import { Request, Response, NextFunction, RequestHandler } from "express";
import { RolePermissions, SystemRole, UserPermission } from "@shared/contracts/user-management";

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
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const user = req.user as any;
    const userRole = (user.systemRole || "member") as SystemRole;
    const rolePermissions = RolePermissions[userRole] || [];
    const userPermissions = user.permissions || [];

    const hasPermission = 
      rolePermissions.includes(permission) || 
      userPermissions.includes(permission);

    if (!hasPermission) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}

export function requireRole(...roles: SystemRole[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const user = req.user as any;
    const userRole = (user.systemRole || "member") as SystemRole;

    if (!roles.includes(userRole)) {
      res.status(403).json({ error: "Insufficient role permissions" });
      return;
    }

    next();
  };
}

export function requireSelfOrRole(userIdParam: string, ...roles: SystemRole[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const user = req.user as any;
    const targetUserId = req.params[userIdParam];
    const isSelf = user.id === targetUserId;
    const userRole = (user.systemRole || "member") as SystemRole;
    const hasRole = roles.includes(userRole);

    if (!isSelf && !hasRole) {
      res.status(403).json({ error: "You can only modify your own profile or need admin privileges" });
      return;
    }

    next();
  };
}
