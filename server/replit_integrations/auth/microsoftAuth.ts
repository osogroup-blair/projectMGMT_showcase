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
    .where(eq(appSettings.id, "microsoft_sso_enabled"));
  
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
    .where(eq(appSettings.id, "microsoft_sso_enabled"));
  
  const [domainsSetting] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.id, "microsoft_allowed_domains"));
  
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
    
    // Helper to get the full host from request (handles Replit proxy headers)
    const getFullHost = (req: any): string => {
      // Prefer x-forwarded-host for proxied requests (Replit)
      const forwardedHost = req.headers['x-forwarded-host'];
      if (forwardedHost) {
        return Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost;
      }
      // Fall back to host header
      const host = req.headers.host;
      if (host) {
        return host;
      }
      // Last resort: hostname
      return req.hostname;
    };

    const ensureMicrosoftStrategy = (host: string) => {
      const strategyName = `microsoft:${host}`;
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
            callbackURL: `https://${host}/api/auth/microsoft/callback`,
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
      
      const host = getFullHost(req);
      console.log(`Microsoft auth initiated - using callback host: ${host}`);
      ensureMicrosoftStrategy(host);
      passport.authenticate(`microsoft:${host}`, {
        prompt: "select_account",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    });
    
    app.get("/api/auth/microsoft/callback", async (req, res, next) => {
      try {
        console.log(`[Microsoft Auth] Callback received`);
        console.log(`[Microsoft Auth] Query params: ${JSON.stringify(req.query)}`);
        
        const enabled = await isMicrosoftAuthEnabled();
        console.log(`[Microsoft Auth] SSO enabled: ${enabled}`);
        
        if (!enabled) {
          console.log(`[Microsoft Auth] SSO disabled - redirecting`);
          return res.redirect("/?error=microsoft_disabled");
        }
        
        const host = getFullHost(req);
        console.log(`[Microsoft Auth] Using host: ${host}`);
        
        // Check for OAuth errors in the query
        if (req.query.error) {
          console.error(`[Microsoft Auth] OAuth error: ${req.query.error} - ${req.query.error_description}`);
          return res.redirect(`/?error=microsoft_oauth_error&details=${encodeURIComponent(String(req.query.error_description || req.query.error))}`);
        }
        
        ensureMicrosoftStrategy(host);
        
        passport.authenticate(`microsoft:${host}`, (err: any, user: any, info: any) => {
          console.log(`[Microsoft Auth] Passport callback - err: ${err}, user: ${!!user}, info: ${JSON.stringify(info)}`);
          
          if (err) {
            console.error(`[Microsoft Auth] Authentication error:`, err);
            return res.redirect(`/?error=microsoft_auth_error&details=${encodeURIComponent(err.message || 'Unknown error')}`);
          }
          
          if (!user) {
            console.log(`[Microsoft Auth] No user returned - info:`, info);
            return res.redirect("/?error=microsoft_auth_failed");
          }
          
          req.logIn(user, (loginErr) => {
            if (loginErr) {
              console.error(`[Microsoft Auth] Login error:`, loginErr);
              return res.redirect(`/?error=microsoft_login_error&details=${encodeURIComponent(loginErr.message)}`);
            }
            console.log(`[Microsoft Auth] Login successful for user: ${user.email}`);
            return res.redirect("/");
          });
        })(req, res, next);
      } catch (error: any) {
        console.error(`[Microsoft Auth] Unexpected error in callback:`, error);
        return res.redirect(`/?error=microsoft_unexpected_error&details=${encodeURIComponent(error.message || 'Unknown error')}`);
      }
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
      id: "microsoft_sso_enabled",
      key: "microsoft_sso_enabled",
      value: enabled,
      description: "Enable Microsoft SSO for user authentication",
      updatedBy: userId,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
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
      id: "microsoft_allowed_domains",
      key: "microsoft_allowed_domains",
      value: domains,
      description: "Allowed email domains for Microsoft SSO",
      updatedBy: userId,
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: {
        value: domains,
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });
}
