import { Request, Response, NextFunction } from "express";
import { RolePermissions, SystemRole, UserPermission } from "@shared/contracts/user-management";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    systemRole?: string;
    permissions?: string[];
  };
}

export function requireAuth() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  };
}

export function requirePermission(permission: UserPermission) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = req.user;
    const userRole = (user.systemRole || "member") as SystemRole;
    const rolePermissions = RolePermissions[userRole] || [];
    const userPermissions = user.permissions || [];

    const hasPermission = 
      rolePermissions.includes(permission) || 
      userPermissions.includes(permission);

    if (!hasPermission) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

export function requireRole(...roles: SystemRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRole = (req.user.systemRole || "member") as SystemRole;

    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: "Insufficient role permissions" });
    }

    next();
  };
}

export function requireSelfOrRole(userIdParam: string, ...roles: SystemRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const targetUserId = req.params[userIdParam];
    const isSelf = req.user.id === targetUserId;
    const userRole = (req.user.systemRole || "member") as SystemRole;
    const hasRole = roles.includes(userRole);

    if (!isSelf && !hasRole) {
      return res.status(403).json({ error: "You can only modify your own profile or need admin privileges" });
    }

    next();
  };
}
