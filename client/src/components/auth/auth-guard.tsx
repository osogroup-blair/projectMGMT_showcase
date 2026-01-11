import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  fallback?: React.ReactNode;
}

export function AuthGuard({ 
  children, 
  requiredRoles = [], 
  requiredPermissions = [],
  fallback 
}: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/api/login";
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRoles.length > 0 && user) {
    const userRole = (user as any).systemRole || "member";
    if (!requiredRoles.includes(userRole)) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
            <p className="text-muted-foreground mt-2">You don't have permission to view this page.</p>
          </div>
        </div>
      );
    }
  }

  if (requiredPermissions.length > 0 && user) {
    const userPermissions = (user as any).permissions || [];
    const hasAllPermissions = requiredPermissions.every(p => userPermissions.includes(p));
    if (!hasAllPermissions) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
            <p className="text-muted-foreground mt-2">You don't have the required permissions.</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}

export function useRequireAuth() {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/api/login";
    }
  }, [isLoading, isAuthenticated]);

  return { user, isLoading, isAuthenticated };
}

export function hasRole(user: any, role: string): boolean {
  if (!user) return false;
  return user.systemRole === role;
}

export function hasPermission(user: any, permission: string): boolean {
  if (!user) return false;
  const permissions = user.permissions || [];
  return permissions.includes(permission);
}

export function isAdmin(user: any): boolean {
  return hasRole(user, "admin");
}
