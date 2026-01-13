import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import { db } from "../../db";
import { users, appSettings } from "@shared/models/auth";
import { eq, and } from "drizzle-orm";

const MICROSOFT_ISSUER_URL = "https://login.microsoftonline.com";

const getMicrosoftOidcConfig = memoize(
  async () => {
    const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
    const issuerUrl = new URL(`${MICROSOFT_ISSUER_URL}/${tenantId}/v2.0`);
    return await client.discovery(
      issuerUrl,
      process.env.MICROSOFT_CLIENT_ID!,
      process.env.MICROSOFT_CLIENT_SECRET!
    );
  },
  { maxAge: 3600 * 1000 }
);

export async function isMicrosoftAuthEnabled(): Promise<boolean> {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return false;
  }
  
  const [setting] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, "microsoft_sso_enabled"));
  
  return setting?.value === true;
}

export async function getMicrosoftAuthConfig(): Promise<{
  enabled: boolean;
  configured: boolean;
  allowedDomains: string[];
}> {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const configured = !!(clientId && clientSecret);
  
  const [enabledSetting] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, "microsoft_sso_enabled"));
  
  const [domainsSetting] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, "microsoft_allowed_domains"));
  
  return {
    enabled: enabledSetting?.value === true && configured,
    configured,
    allowedDomains: (domainsSetting?.value as string[]) || [],
  };
}

async function upsertMicrosoftUser(claims: any) {
  const email = claims.email || claims.preferred_username;
  const firstName = claims.given_name;
  const lastName = claims.family_name;
  const microsoftId = claims.sub || claims.oid;
  const profileImageUrl = claims.picture;
  
  const name = [firstName, lastName].filter(Boolean).join(" ").trim() || email || "User";
  
  const existingByMicrosoftId = await db
    .select()
    .from(users)
    .where(eq(users.microsoftId, microsoftId))
    .limit(1);
  
  if (existingByMicrosoftId.length > 0) {
    const [updatedUser] = await db
      .update(users)
      .set({
        email,
        firstName,
        lastName,
        name,
        profileImageUrl: profileImageUrl || existingByMicrosoftId[0].profileImageUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.microsoftId, microsoftId))
      .returning();
    return updatedUser;
  }
  
  if (email) {
    const existingByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (existingByEmail.length > 0) {
      const [updatedUser] = await db
        .update(users)
        .set({
          microsoftId,
          authProvider: "microsoft",
          firstName: firstName || existingByEmail[0].firstName,
          lastName: lastName || existingByEmail[0].lastName,
          name: name || existingByEmail[0].name,
          profileImageUrl: profileImageUrl || existingByEmail[0].profileImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.email, email))
        .returning();
      return updatedUser;
    }
  }
  
  const [newUser] = await db
    .insert(users)
    .values({
      id: microsoftId,
      email,
      firstName,
      lastName,
      name,
      profileImageUrl,
      microsoftId,
      authProvider: "microsoft",
    })
    .returning();
  
  return newUser;
}

export async function setupMicrosoftAuth(app: Express) {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.log("Microsoft SSO not configured - missing MICROSOFT_CLIENT_ID or MICROSOFT_CLIENT_SECRET");
    return;
  }
  
  try {
    const config = await getMicrosoftOidcConfig();
    
    const registeredStrategies = new Set<string>();
    
    const ensureMicrosoftStrategy = (domain: string) => {
      const strategyName = `microsoft:${domain}`;
      if (!registeredStrategies.has(strategyName)) {
        const verify: VerifyFunction = async (
          tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
          verified: passport.AuthenticateCallback
        ) => {
          try {
            const claims = tokens.claims();
            const user = await upsertMicrosoftUser(claims);
            const sessionUser = {
              id: user.id,
              email: user.email,
              claims,
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              expires_at: claims?.exp,
              authProvider: "microsoft",
            };
            verified(null, sessionUser);
          } catch (error) {
            verified(error as Error);
          }
        };
        
        const strategy = new Strategy(
          {
            name: strategyName,
            config,
            scope: "openid email profile offline_access",
            callbackURL: `https://${domain}/api/auth/microsoft/callback`,
          },
          verify
        );
        passport.use(strategy);
        registeredStrategies.add(strategyName);
      }
    };
    
    app.get("/api/auth/microsoft", async (req, res, next) => {
      const enabled = await isMicrosoftAuthEnabled();
      if (!enabled) {
        return res.status(403).json({ message: "Microsoft sign-in is not enabled" });
      }
      
      ensureMicrosoftStrategy(req.hostname);
      passport.authenticate(`microsoft:${req.hostname}`, {
        prompt: "select_account",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    });
    
    app.get("/api/auth/microsoft/callback", async (req, res, next) => {
      const enabled = await isMicrosoftAuthEnabled();
      if (!enabled) {
        return res.redirect("/?error=microsoft_disabled");
      }
      
      ensureMicrosoftStrategy(req.hostname);
      passport.authenticate(`microsoft:${req.hostname}`, {
        successReturnToOrRedirect: "/",
        failureRedirect: "/?error=microsoft_auth_failed",
      })(req, res, next);
    });
    
    console.log("Microsoft SSO configured successfully");
  } catch (error) {
    console.error("Failed to configure Microsoft SSO:", error);
  }
}

export async function setMicrosoftAuthEnabled(enabled: boolean, userId?: string): Promise<void> {
  await db
    .insert(appSettings)
    .values({
      key: "microsoft_sso_enabled",
      value: enabled,
      description: "Enable Microsoft SSO for user authentication",
      updatedBy: userId,
    })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: {
        value: enabled,
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });
}

export async function setMicrosoftAllowedDomains(domains: string[], userId?: string): Promise<void> {
  await db
    .insert(appSettings)
    .values({
      key: "microsoft_allowed_domains",
      value: domains,
      description: "Allowed email domains for Microsoft SSO",
      updatedBy: userId,
    })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: {
        value: domains,
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });
}
