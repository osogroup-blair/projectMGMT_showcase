import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { 
  ListUsersResponse, 
  UserPublic, 
  UpdateUserRequest,
  CreateUserRequest 
} from "@shared/contracts/user-management";

const USERS_QUERY_KEY = "/api/users";

interface UseUsersOptions {
  search?: string;
  role?: string;
}

export function useUsers(options: UseUsersOptions = {}) {
  const { search, role } = options;
  
  return useQuery<ListUsersResponse>({
    queryKey: [USERS_QUERY_KEY, { search, role }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (role) params.set("role", role);
      
      const url = params.toString() 
        ? `${USERS_QUERY_KEY}?${params.toString()}`
        : USERS_QUERY_KEY;
        
      const response = await fetch(url);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch users");
      }
      return response.json();
    },
  });
}

export function useUser(id: string) {
  return useQuery<UserPublic>({
    queryKey: [USERS_QUERY_KEY, id],
    queryFn: async () => {
      const response = await fetch(`${USERS_QUERY_KEY}/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch user");
      }
      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateUserRequest) => {
      const response = await fetch(USERS_QUERY_KEY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create user");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserRequest }) => {
      const response = await fetch(`${USERS_QUERY_KEY}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user");
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY, variables.id] });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${USERS_QUERY_KEY}/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to deactivate user");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
  });
}
