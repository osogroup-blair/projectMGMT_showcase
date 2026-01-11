import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";

interface RealUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  systemRole: string | null;
}

interface AuthUser extends User {
  isImpersonating: boolean;
  realUser: RealUser | null;
}

async function fetchUser(): Promise<AuthUser | null> {
  const response = await fetch("/api/auth/user", {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function logout(): Promise<void> {
  window.location.href = "/api/logout";
}

async function startImpersonation(userId: string): Promise<void> {
  const response = await fetch(`/api/admin/impersonate/${userId}`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to start impersonation");
  }
}

async function stopImpersonation(): Promise<void> {
  const response = await fetch("/api/admin/stop-impersonate", {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to stop impersonation");
  }
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: startImpersonation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const stopImpersonateMutation = useMutation({
    mutationFn: stopImpersonation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  const isAdmin = user?.realUser?.systemRole === "admin" || (!user?.isImpersonating && user?.systemRole === "admin");

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    isImpersonating: user?.isImpersonating ?? false,
    realUser: user?.realUser ?? null,
    isAdmin,
    impersonate: impersonateMutation.mutate,
    isImpersonating_loading: impersonateMutation.isPending,
    stopImpersonation: stopImpersonateMutation.mutate,
    isStoppingImpersonation: stopImpersonateMutation.isPending,
  };
}
