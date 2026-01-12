import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";

// Roles that can use impersonation feature
const IMPERSONATION_ROLES = ["admin", "demo"];

function canImpersonate(role: string | null | undefined): boolean {
  return IMPERSONATION_ROLES.includes(role || "");
}

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user (includes impersonation state)
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const realUserId = req.user.claims.sub;
      const realUser = await authStorage.getUser(realUserId);
      
      // Check if admin/demo is impersonating another user
      const impersonatedUserId = req.session?.impersonatedUserId;
      
      if (impersonatedUserId && canImpersonate(realUser?.systemRole)) {
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
      const realUserId = req.user.claims.sub;
      const realUser = await authStorage.getUser(realUserId);
      
      if (!canImpersonate(realUser?.systemRole)) {
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
      const realUserId = req.user.claims.sub;
      const realUser = await authStorage.getUser(realUserId);
      
      if (!canImpersonate(realUser?.systemRole)) {
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

  // Get impersonation status (admin and demo roles)
  app.get("/api/admin/impersonation-status", isAuthenticated, async (req: any, res) => {
    try {
      const realUserId = req.user.claims.sub;
      const realUser = await authStorage.getUser(realUserId);
      
      const canUserImpersonate = canImpersonate(realUser?.systemRole);
      const isAdmin = realUser?.systemRole === "admin";
      
      if (!canUserImpersonate) {
        return res.json({ isAdmin: false, canImpersonate: false, isImpersonating: false });
      }
      
      const impersonatedUserId = req.session?.impersonatedUserId;
      
      if (impersonatedUserId) {
        const impersonatedUser = await authStorage.getUser(impersonatedUserId);
        res.json({
          isAdmin,
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
        res.json({ isAdmin, canImpersonate: true, isImpersonating: false });
      }
    } catch (error) {
      console.error("Error getting impersonation status:", error);
      res.status(500).json({ message: "Failed to get impersonation status" });
    }
  });
}
