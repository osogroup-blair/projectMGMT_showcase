import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import type { Express } from "express";
import memoize from "memoizee";
import { db } from "../../db";
import { appSettings, users, userIdentities } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

// Helper to update login tracking stats
async function updateLoginStats(userId: string) {
  await db
    .update(users)
    .set({
      lastLogin: new Date(),
      loginCount: sql`COALESCE(${users.loginCount}, 0) + 1`,
    })
    .where(eq(users.id, userId));
}

const getGoogleOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL("https://accounts.google.com"),
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!
    );
  },
  { maxAge: 3600 * 1000 }
);

export async function isGoogleAuthConfigured(): Promise<boolean> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return !!(clientId && clientSecret);
}

export async function isGoogleAuthEnabled(): Promise<boolean> {
  if (!(await isGoogleAuthConfigured())) {
    return false;
  }
  
  try {
    const setting = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.id, "google_sso_enabled"))
      .limit(1);
    
    return setting.length > 0 && setting[0].value === true;
  } catch (error) {
    return false;
  }
}

export async function getGoogleAuthConfig() {
  const configured = await isGoogleAuthConfigured();
  const enabled = configured ? await isGoogleAuthEnabled() : false;
  
  return {
    enabled,
    configured,
  };
}

async function upsertOrLinkGoogleIdentity(userId: string, claims: any) {
  const googleId = claims.sub;
  const email = claims.email;
  const firstName = claims.given_name || claims.name?.split(' ')[0] || '';
  const lastName = claims.family_name || claims.name?.split(' ').slice(1).join(' ') || '';
  const profileImageUrl = claims.picture;

  // Check if identity already exists for this user and Google account
  const existingIdentity = await db
    .select()
    .from(userIdentities)
    .where(
      and(
        eq(userIdentities.userId, userId),
        eq(userIdentities.systemId, "google"),
        eq(userIdentities.externalUserId, googleId)
      )
    )
    .limit(1);

  if (existingIdentity.length > 0) {
    // Update existing identity with latest claims
    await db
      .update(userIdentities)
      .set({
        externalEmail: email,
        profile: {
          displayName: `${firstName} ${lastName}`.trim(),
          avatarUrl: profileImageUrl,
        },
        auth: {
          authType: "oauth",
          provider: "google",
          scopes: ["openid", "email", "profile"],
        },
        lastSyncedAt: new Date(),
        syncStatus: "healthy",
        updatedAt: new Date(),
      })
      .where(eq(userIdentities.id, existingIdentity[0].id));
    return existingIdentity[0];
  }

  // Create new identity record
  const identityId = `google-identity-${randomUUID()}`;
  const [newIdentity] = await db
    .insert(userIdentities)
    .values({
      id: identityId,
      userId,
      systemId: "google",
      systemType: "sso",
      systemName: "Google",
      externalUserId: googleId,
      externalUsername: email,
      externalEmail: email,
      identityType: "user",
      status: "active",
      auth: {
        authType: "oauth",
        provider: "google",
        scopes: ["openid", "email", "profile"],
      },
      profile: {
        displayName: `${firstName} ${lastName}`.trim(),
        avatarUrl: profileImageUrl,
      },
      syncSourceOfTruth: "external",
      lastSyncedAt: new Date(),
      syncStatus: "healthy",
    })
    .returning();

  return newIdentity;
}

async function upsertGoogleUser(claims: any) {
  const googleId = claims.sub;
  const email = claims.email;
  const firstName = claims.given_name || claims.name?.split(' ')[0] || '';
  const lastName = claims.family_name || claims.name?.split(' ').slice(1).join(' ') || '';
  const profileImageUrl = claims.picture;

  // Try to find existing user by googleId or email
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUsers.length > 0) {
    const existingUser = existingUsers[0];
    // Link Google ID if not set, but do NOT overwrite names
    if (!existingUser.googleId) {
      await db
        .update(users)
        .set({
          googleId,
          authProvider: existingUser.authProvider || "google",
          // Only update profile image if user doesn't have one
          profileImageUrl: existingUser.profileImageUrl || profileImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id));
    }
    // Create/update identity record with SSO claims
    await upsertOrLinkGoogleIdentity(existingUser.id, claims);
    // Update login tracking
    await updateLoginStats(existingUser.id);
    return existingUser;
  }

  // Create new user - only for truly new users do we set names from SSO
  const newUser = await db
    .insert(users)
    .values({
      id: `google-${googleId}`,
      email,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      googleId,
      profileImageUrl,
      authProvider: "google",
      systemRole: "member",
      status: "active",
      lastLogin: new Date(),
      loginCount: 1,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        googleId,
        // Don't overwrite existing data on conflict
        updatedAt: new Date(),
      },
    })
    .returning();

  // Create identity record for the new user
  await upsertOrLinkGoogleIdentity(newUser[0].id, claims);

  return newUser[0];
}

export async function setupGoogleAuth(app: Express) {
  if (!(await isGoogleAuthConfigured())) {
    console.log("Google SSO not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
    return;
  }

  try {
    const config = await getGoogleOidcConfig();
    
    const registeredStrategies = new Set<string>();
    
    const getFullHost = (req: any): string => {
      const forwardedHost = req.headers['x-forwarded-host'];
      if (forwardedHost) {
        return Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost;
      }
      const host = req.headers.host;
      if (host) {
        return host;
      }
      return req.hostname;
    };

    const ensureGoogleStrategy = (host: string) => {
      const strategyName = `google:${host}`;
      if (!registeredStrategies.has(strategyName)) {
        const verify: VerifyFunction = async (
          tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
          verified: passport.AuthenticateCallback
        ) => {
          try {
            const claims = tokens.claims();
            const user = await upsertGoogleUser(claims);
            const sessionUser = {
              id: user.id,
              email: user.email,
              claims,
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              expires_at: claims?.exp,
              authProvider: "google",
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
            scope: "openid email profile",
            callbackURL: `https://${host}/api/auth/google/callback`,
          },
          verify
        );
        passport.use(strategy);
        registeredStrategies.add(strategyName);
      }
    };
    
    app.get("/api/auth/google", async (req, res, next) => {
      const enabled = await isGoogleAuthEnabled();
      if (!enabled) {
        return res.status(403).json({ message: "Google sign-in is not enabled" });
      }
      
      const host = getFullHost(req);
      console.log(`Google auth initiated - using callback host: ${host}`);
      ensureGoogleStrategy(host);
      passport.authenticate(`google:${host}`, {
        prompt: "select_account",
        scope: ["openid", "email", "profile"],
      })(req, res, next);
    });
    
    app.get("/api/auth/google/callback", async (req, res, next) => {
      try {
        console.log(`[Google Auth] Callback received`);
        
        const enabled = await isGoogleAuthEnabled();
        if (!enabled) {
          return res.redirect("/?error=google_disabled");
        }
        
        const host = getFullHost(req);
        console.log(`[Google Auth] Using host: ${host}`);
        
        if (req.query.error) {
          console.error(`[Google Auth] OAuth error: ${req.query.error}`);
          return res.redirect(`/?error=google_oauth_error&details=${encodeURIComponent(String(req.query.error_description || req.query.error))}`);
        }
        
        ensureGoogleStrategy(host);
        
        passport.authenticate(`google:${host}`, (err: any, user: any, info: any) => {
          console.log(`[Google Auth] Passport callback - err: ${err}, user: ${!!user}`);
          
          if (err) {
            console.error(`[Google Auth] Authentication error:`, err);
            let errorDetails = err.message || 'Unknown error';
            if (err.cause) {
              errorDetails += ` | Cause: ${JSON.stringify(err.cause)}`;
            }
            return res.redirect(`/?error=google_auth_error&details=${encodeURIComponent(errorDetails)}`);
          }
          
          if (!user) {
            return res.redirect("/?error=google_auth_failed");
          }
          
          req.logIn(user, (loginErr) => {
            if (loginErr) {
              console.error(`[Google Auth] Login error:`, loginErr);
              return res.redirect(`/?error=google_login_error&details=${encodeURIComponent(loginErr.message)}`);
            }
            console.log(`[Google Auth] Login successful for user: ${user.email}`);
            return res.redirect("/");
          });
        })(req, res, next);
      } catch (error: any) {
        console.error(`[Google Auth] Unexpected error:`, error);
        return res.redirect(`/?error=google_unexpected_error&details=${encodeURIComponent(error.message || 'Unknown error')}`);
      }
    });
    
    console.log("Google SSO configured successfully");
  } catch (error) {
    console.error("Failed to configure Google SSO:", error);
  }
}

export async function setGoogleAuthEnabled(enabled: boolean, userId?: string): Promise<void> {
  await db
    .insert(appSettings)
    .values({
      id: "google_sso_enabled",
      key: "google_sso_enabled",
      value: enabled,
      description: "Enable Google SSO for user authentication",
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
