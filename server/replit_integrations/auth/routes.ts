import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./sessionAuth";
import { storage } from "../../data/storage";
import { getMicrosoftAuthConfig } from "./microsoftAuth";
import { getGoogleAuthConfig } from "./googleAuth";

// Roles that can use impersonation feature
const IMPERSONATION_ROLES = ["admin", "demo"];

function canImpersonate(role: string | null | undefined, userId?: string | null): boolean {
  // Check by role first
  if (IMPERSONATION_ROLES.includes(role || "")) {
    return true;
  }
  // Also allow users with demo- prefix (they have impersonation rights)
  if (userId && userId.startsWith("demo-")) {
    return true;
  }
  return false;
}

function isDemoUser(role: string | null | undefined, userId?: string | null): boolean {
  return role === "demo" || (userId ? userId.startsWith("demo-") : false);
}

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user (includes impersonation state)
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      // Use the database user ID stored in session, fallback to claims.sub for backwards compatibility
      const realUserId = req.user.id || req.user.claims?.sub;
      const realUser = await authStorage.getUser(realUserId);
      
      // Check if admin/demo is impersonating another user
      const impersonatedUserId = req.session?.impersonatedUserId;
      
      if (impersonatedUserId && realUser && canImpersonate(realUser.systemRole, realUser.id)) {
        const impersonatedUser = await authStorage.getUser(impersonatedUserId);
        if (impersonatedUser) {
          res.json({
            ...impersonatedUser,
            isImpersonating: true,
            realUser: {
              id: realUser.id,
              firstName: realUser.firstName,
              lastName: realUser.lastName,
              email: realUser.email,
              systemRole: realUser.systemRole,
            },
          });
          return;
        }
      }
      
      res.json({
        ...realUser,
        isImpersonating: false,
        realUser: null,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Start impersonation (admin and demo roles)
  app.post("/api/admin/impersonate/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const realUserId = req.user.id || req.user.claims?.sub;
      const realUser = await authStorage.getUser(realUserId);
      
      if (!canImpersonate(realUser?.systemRole, realUser?.id)) {
        return res.status(403).json({ error: "Only admins and demo users can impersonate users" });
      }
      
      const targetUserId = req.params.userId;
      
      if (targetUserId === realUserId) {
        return res.status(400).json({ error: "Cannot impersonate yourself" });
      }
      
      const targetUser = await authStorage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Demo users can only impersonate other demo users
      if (isDemoUser(realUser?.systemRole, realUser?.id)) {
        const isDemoTarget = isDemoUser(targetUser?.systemRole, targetUser?.id);
        if (!isDemoTarget) {
          return res.status(403).json({ error: "Demo users can only impersonate other demo users" });
        }
      }
      
      // Store impersonated user ID in session and save explicitly
      req.session.impersonatedUserId = targetUserId;
      req.session.save((err: any) => {
        if (err) {
          console.error("Error saving session:", err);
          return res.status(500).json({ error: "Failed to save session" });
        }
        res.json({ 
          success: true, 
          message: `Now impersonating ${targetUser.firstName || targetUser.email}`,
          impersonatedUser: targetUser,
        });
      });
    } catch (error) {
      console.error("Error starting impersonation:", error);
      res.status(500).json({ message: "Failed to start impersonation" });
    }
  });

  // Stop impersonation
  app.post("/api/admin/stop-impersonate", isAuthenticated, async (req: any, res) => {
    try {
      const realUserId = req.user.id || req.user.claims?.sub;
      const realUser = await authStorage.getUser(realUserId);
      
      if (!canImpersonate(realUser?.systemRole, realUser?.id)) {
        return res.status(403).json({ error: "Only admins and demo users can stop impersonation" });
      }
      
      // Clear impersonation from session and save explicitly
      delete req.session.impersonatedUserId;
      req.session.save((err: any) => {
        if (err) {
          console.error("Error saving session:", err);
          return res.status(500).json({ error: "Failed to save session" });
        }
        res.json({ success: true, message: "Stopped impersonation" });
      });
    } catch (error) {
      console.error("Error stopping impersonation:", error);
      res.status(500).json({ message: "Failed to stop impersonation" });
    }
  });

  // Demo login - logs in as the configured demo user without OIDC
  app.post("/api/demo-login", async (req: any, res) => {
    try {
      // Check if demo mode is enabled via app settings
      const appSettings = await storage.getAppSettings();
      
      if (!appSettings?.demoDataReady) {
        return res.status(403).json({ error: "Demo mode is not available. Please generate demo data first." });
      }
      
      const demoUserId = appSettings.demoLoginUserId || "demo-admin";
      
      // Get the configured demo user
      let demoUser = await authStorage.getUser(demoUserId);
      
      if (!demoUser) {
        return res.status(404).json({ error: "Configured demo user not found. Please regenerate demo data." });
      }
      
      // Create a mock user object that matches what SSO auth provides
      const mockUser = {
        id: demoUser.id,
        email: demoUser.email,
        claims: {
          sub: demoUser.id,
          email: demoUser.email,
          first_name: demoUser.firstName,
          last_name: demoUser.lastName,
        },
        access_token: "demo-token",
        refresh_token: null,
        expires_at: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days from now
        authProvider: "demo",
      };
      
      // Use Passport's login method to properly set up the session
      req.login(mockUser, (err: any) => {
        if (err) {
          console.error("Error during passport login:", err);
          return res.status(500).json({ error: "Failed to create demo session" });
        }
        
        res.json({ 
          success: true, 
          message: `Logged in as ${demoUser!.name || 'Demo User'}`,
          user: demoUser,
          redirectTo: "/"
        });
      });
    } catch (error) {
      console.error("Error during demo login:", error);
      res.status(500).json({ message: "Failed to start demo session" });
    }
  });

  // Demo Admin login - direct passthrough to admin account without OIDC
  app.post("/api/demo-admin-login", async (req: any, res) => {
    try {
      // Check if demo admin passthrough is enabled
      const appSettings = await storage.getAppSettings();
      
      if (!appSettings?.demoAdminPassthroughEnabled) {
        return res.status(403).json({ error: "Demo Admin passthrough is not enabled." });
      }
      
      let adminUser: any = null;
      
      // Check if a specific admin user is configured
      if (appSettings.demoAdminPassthroughUserId) {
        adminUser = await authStorage.getUser(appSettings.demoAdminPassthroughUserId);
        
        // Reject if configured user doesn't exist
        if (!adminUser) {
          return res.status(400).json({ 
            error: "Configured demo admin user not found. Please select a valid admin user in settings." 
          });
        }
        
        // Reject if configured user is not an admin
        if (adminUser.systemRole !== "admin") {
          return res.status(403).json({ 
            error: `User "${adminUser.name || adminUser.email}" no longer has admin privileges. Please select a valid admin user in settings.` 
          });
        }
      } else {
        // No specific user configured - fall back to default demo-admin user
        adminUser = await authStorage.getUser("demo-admin");
        
        if (!adminUser) {
          // Create a demo admin user if it doesn't exist
          adminUser = await authStorage.upsertUser({
            id: "demo-admin",
            email: "demo-admin@nymbl.com",
            firstName: "Demo",
            lastName: "Admin",
            name: "Demo Admin",
            systemRole: "admin",
            profileImageUrl: null,
          });
        }
        
        // Ensure the demo admin has admin role
        if (adminUser.systemRole !== "admin") {
          adminUser = await storage.updateUser("demo-admin", { systemRole: "admin" });
        }
      }
      
      // Create a mock user object that matches what SSO auth provides
      const mockUser = {
        id: adminUser!.id,
        email: adminUser!.email,
        claims: {
          sub: adminUser!.id,
          email: adminUser!.email,
          first_name: adminUser!.firstName,
          last_name: adminUser!.lastName,
        },
        access_token: "demo-admin-token",
        refresh_token: null,
        expires_at: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days from now
        authProvider: "demo-admin",
      };
      
      const userName = adminUser!.name || `${adminUser!.firstName || ''} ${adminUser!.lastName || ''}`.trim() || 'Admin';
      
      // Use Passport's login method to properly set up the session
      req.login(mockUser, (err: any) => {
        if (err) {
          console.error("Error during demo admin login:", err);
          return res.status(500).json({ error: "Failed to create demo admin session" });
        }
        
        res.json({ 
          success: true, 
          message: `Logged in as ${userName} with admin privileges`,
          user: adminUser,
          redirectTo: "/"
        });
      });
    } catch (error) {
      console.error("Error during demo admin login:", error);
      res.status(500).json({ message: "Failed to start demo admin session" });
    }
  });

  // Get impersonation status (admin and demo roles)
  app.get("/api/admin/impersonation-status", isAuthenticated, async (req: any, res) => {
    try {
      const realUserId = req.user.id || req.user.claims?.sub;
      const realUser = await authStorage.getUser(realUserId);
      
      const canUserImpersonate = canImpersonate(realUser?.systemRole, realUser?.id);
      const isAdmin = realUser?.systemRole === "admin";
      const isDemo = isDemoUser(realUser?.systemRole, realUser?.id);
      
      if (!canUserImpersonate) {
        return res.json({ isAdmin: false, isDemo: false, canImpersonate: false, isImpersonating: false });
      }
      
      const impersonatedUserId = req.session?.impersonatedUserId;
      
      if (impersonatedUserId) {
        const impersonatedUser = await authStorage.getUser(impersonatedUserId);
        res.json({
          isAdmin,
          isDemo,
          canImpersonate: true,
          isImpersonating: true,
          impersonatedUser: impersonatedUser ? {
            id: impersonatedUser.id,
            firstName: impersonatedUser.firstName,
            lastName: impersonatedUser.lastName,
            email: impersonatedUser.email,
          } : null,
        });
      } else {
        res.json({ isAdmin, isDemo, canImpersonate: true, isImpersonating: false });
      }
    } catch (error) {
      console.error("Error getting impersonation status:", error);
      res.status(500).json({ message: "Failed to get impersonation status" });
    }
  });
}
