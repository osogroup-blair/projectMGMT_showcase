import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { 
  UserProfileWithIdentities, 
  IdentityPublic,
  LinkIdentityRequest,
  UpdateIdentityRequest,
  UpdateProfileRequest,
  MergeUsersResult,
} from "@shared/contracts/user-identity";

const API_BASE = "/api";

export function useUserProfile(userId: string | undefined) {
  return useQuery<UserProfileWithIdentities>({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/users/${userId}/profile`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation<UserProfileWithIdentities, Error, { userId: string; data: UpdateProfileRequest }>({
    mutationFn: async ({ userId, data }) => {
      const res = await fetch(`${API_BASE}/users/${userId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["user-profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
    },
  });
}

export function useUserIdentities(userId: string | undefined) {
  return useQuery<IdentityPublic[]>({
    queryKey: ["user-identities", userId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/users/${userId}/identities`);
      if (!res.ok) throw new Error("Failed to fetch identities");
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useLinkIdentity() {
  const queryClient = useQueryClient();
  return useMutation<IdentityPublic, Error, { userId: string; data: LinkIdentityRequest }>({
    mutationFn: async ({ userId, data }) => {
      const res = await fetch(`${API_BASE}/users/${userId}/identities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to link identity");
      }
      return res.json();
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["user-identities", userId] });
      queryClient.invalidateQueries({ queryKey: ["user-profile", userId] });
    },
  });
}

export function useUnlinkIdentity() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { userId: string; identityId: string }>({
    mutationFn: async ({ userId, identityId }) => {
      const res = await fetch(`${API_BASE}/users/${userId}/identities/${identityId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to unlink identity");
      }
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["user-identities", userId] });
      queryClient.invalidateQueries({ queryKey: ["user-profile", userId] });
    },
  });
}

export function useUpdateIdentity() {
  const queryClient = useQueryClient();
  return useMutation<IdentityPublic, Error, { identityId: string; userId: string; data: UpdateIdentityRequest }>({
    mutationFn: async ({ identityId, data }) => {
      const res = await fetch(`${API_BASE}/identities/${identityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update identity");
      return res.json();
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["user-identities", userId] });
      queryClient.invalidateQueries({ queryKey: ["user-profile", userId] });
    },
  });
}

export function useAvailableSystems() {
  return useQuery<Array<{ id: string; name: string; type: string }>>({
    queryKey: ["available-systems"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/identity/systems`);
      if (!res.ok) throw new Error("Failed to fetch systems");
      return res.json();
    },
  });
}

export function useMergeUsers() {
  const queryClient = useQueryClient();
  return useMutation<MergeUsersResult, Error, { sourceUserId: string; targetUserId: string }>({
    mutationFn: async (data) => {
      const res = await fetch(`${API_BASE}/users/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to merge users");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["user-identities"] });
    },
  });
}
