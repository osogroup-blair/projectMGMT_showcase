import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { HighLevelRoleType, ProjectRole, User, ProjectTeamMember } from "@shared/schema";

export interface UnifiedTeamMember {
  id: string;
  projectId: string;
  userId: string;
  allocationPercent: number;
  joinedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  user?: User;
  highLevelRoles: HighLevelRoleType[];
  executionRoles: Array<{
    id: string;
    teamMemberId: string;
    roleId: string;
    isPrimary: boolean;
    role?: ProjectRole;
  }>;
}

export interface AddMemberPayload {
  userId: string;
  highLevelRoles: HighLevelRoleType[];
  executionRoleIds?: string[];
  allocationPercent?: number;
}

export interface UpdateMemberPayload {
  allocationPercent?: number;
  highLevelRoles?: HighLevelRoleType[];
  executionRoleIds?: string[];
}

export interface BulkAddPayload {
  members: Array<{
    userId: string;
    highLevelRoles: HighLevelRoleType[];
    executionRoleIds?: string[];
    allocationPercent?: number;
  }>;
}

export function useUnifiedTeamMembers(projectId: string | undefined) {
  const queryClient = useQueryClient();

  const queryKey = ["project-team-members", projectId];

  const { data, isLoading, error, refetch } = useQuery<UnifiedTeamMember[]>({
    queryKey,
    queryFn: async () => {
      if (!projectId) return [];
      const response = await fetch(`/api/projects/${projectId}/team-members`);
      if (!response.ok) throw new Error("Failed to fetch team members");
      return response.json();
    },
    enabled: !!projectId,
  });

  const addMemberMutation = useMutation({
    mutationFn: async (payload: AddMemberPayload) => {
      const response = await fetch(`/api/projects/${projectId}/team-members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to add member");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, ...payload }: UpdateMemberPayload & { id: string }) => {
      const response = await fetch(`/api/projects/${projectId}/team-members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to update member");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/projects/${projectId}/team-members/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to remove member");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const bulkAddMutation = useMutation({
    mutationFn: async (payload: BulkAddPayload) => {
      const response = await fetch(`/api/projects/${projectId}/team-members/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to bulk add members");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const addHighLevelRoleMutation = useMutation({
    mutationFn: async ({ memberId, roleType }: { memberId: string; roleType: HighLevelRoleType }) => {
      const response = await fetch(`/api/projects/${projectId}/team-members/${memberId}/high-level-roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleType }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to add role");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const removeHighLevelRoleMutation = useMutation({
    mutationFn: async ({ memberId, roleType }: { memberId: string; roleType: HighLevelRoleType }) => {
      const response = await fetch(`/api/projects/${projectId}/team-members/${memberId}/high-level-roles/${roleType}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to remove role");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const addExecutionRoleMutation = useMutation({
    mutationFn: async ({ memberId, roleId }: { memberId: string; roleId: string }) => {
      const response = await fetch(`/api/projects/${projectId}/team-members/${memberId}/execution-roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to add execution role");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const removeExecutionRoleMutation = useMutation({
    mutationFn: async ({ memberId, roleId }: { memberId: string; roleId: string }) => {
      const response = await fetch(`/api/projects/${projectId}/team-members/${memberId}/execution-roles/${roleId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to remove execution role");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    members: data || [],
    isLoading,
    error,
    refetch,
    addMember: addMemberMutation.mutateAsync,
    updateMember: updateMemberMutation.mutateAsync,
    removeMember: removeMemberMutation.mutateAsync,
    bulkAdd: bulkAddMutation.mutateAsync,
    addHighLevelRole: (memberId: string, roleType: HighLevelRoleType) => 
      addHighLevelRoleMutation.mutateAsync({ memberId, roleType }),
    removeHighLevelRole: (memberId: string, roleType: HighLevelRoleType) => 
      removeHighLevelRoleMutation.mutateAsync({ memberId, roleType }),
    addExecutionRole: (memberId: string, roleId: string) => 
      addExecutionRoleMutation.mutateAsync({ memberId, roleId }),
    removeExecutionRole: (memberId: string, roleId: string) => 
      removeExecutionRoleMutation.mutateAsync({ memberId, roleId }),
    isAdding: addMemberMutation.isPending,
    isUpdating: updateMemberMutation.isPending,
    isRemoving: removeMemberMutation.isPending,
  };
}

export interface TeamMemberRoleAssignment {
  userId: string;
  highLevelRoles: HighLevelRoleType[];
  executionRoleIds: string[];
  allocationPercent: number;
}
