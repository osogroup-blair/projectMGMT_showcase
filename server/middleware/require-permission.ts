import { Request, Response, NextFunction, RequestHandler } from "express";
import { SystemRole, UserPermission } from "@shared/contracts/user-management";
import { authStorage } from "../replit_integrations/auth/storage";
import { getUserPermissions } from "../services/roles-permissions-service";

export function requireAuth(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    next();
  };
}

export function requirePermission(permission: UserPermission): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    try {
      const passportUser = req.user as any;
      const userId = passportUser.claims?.sub || passportUser.id;
      const dbUser = await authStorage.getUser(userId);
      
      if (!dbUser) {
        res.status(403).json({ error: "User not found" });
        return;
      }

      const userRole = (dbUser.systemRole || "member") as SystemRole;
      const userPermissions = dbUser.permissions || [];
      
      // Get effective permissions from database
      const effectivePermissions = await getUserPermissions(userRole, userPermissions);
      const hasPermission = effectivePermissions.includes(permission);

      if (!hasPermission) {
        res.status(403).json({ error: "Insufficient permissions" });
        return;
      }

      next();
    } catch (error) {
      console.error("Error checking permissions:", error);
      res.status(500).json({ error: "Failed to check permissions" });
    }
  };
}

export function requireRole(...roles: SystemRole[]): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    try {
      const passportUser = req.user as any;
      const userId = passportUser.claims?.sub || passportUser.id;
      const dbUser = await authStorage.getUser(userId);
      
      if (!dbUser) {
        res.status(403).json({ error: "User not found" });
        return;
      }

      const userRole = (dbUser.systemRole || "member") as SystemRole;

      if (!roles.includes(userRole)) {
        res.status(403).json({ error: "Insufficient role permissions" });
        return;
      }

      next();
    } catch (error) {
      console.error("Error checking role:", error);
      res.status(500).json({ error: "Failed to check role" });
    }
  };
}

export function requireSelfOrRole(userIdParam: string, ...roles: SystemRole[]): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    try {
      const passportUser = req.user as any;
      const userId = passportUser.claims?.sub || passportUser.id;
      const targetUserId = req.params[userIdParam];
      const isSelf = userId === targetUserId;
      
      if (isSelf) {
        next();
        return;
      }

      const dbUser = await authStorage.getUser(userId);
      
      if (!dbUser) {
        res.status(403).json({ error: "User not found" });
        return;
      }

      const userRole = (dbUser.systemRole || "member") as SystemRole;
      const hasRole = roles.includes(userRole);

      if (!hasRole) {
        res.status(403).json({ error: "You can only modify your own profile or need admin privileges" });
        return;
      }

      next();
    } catch (error) {
      console.error("Error checking self or role:", error);
      res.status(500).json({ error: "Failed to check permissions" });
    }
  };
}
