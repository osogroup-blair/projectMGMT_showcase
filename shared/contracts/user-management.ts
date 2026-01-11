import { z } from "zod";

export const UserPermissions = {
  USERS_READ: "users:read",
  USERS_CREATE: "users:create",
  USERS_UPDATE: "users:update",
  USERS_DELETE: "users:delete",
} as const;

export type UserPermission = typeof UserPermissions[keyof typeof UserPermissions];

export const SystemRoles = {
  ADMIN: "admin",
  MANAGER: "manager",
  MEMBER: "member",
  VIEWER: "viewer",
} as const;

export type SystemRole = typeof SystemRoles[keyof typeof SystemRoles];

export const RolePermissions: Record<SystemRole, UserPermission[]> = {
  admin: [
    UserPermissions.USERS_READ,
    UserPermissions.USERS_CREATE,
    UserPermissions.USERS_UPDATE,
    UserPermissions.USERS_DELETE,
  ],
  manager: [
    UserPermissions.USERS_READ,
    UserPermissions.USERS_UPDATE,
  ],
  member: [
    UserPermissions.USERS_READ,
  ],
  viewer: [
    UserPermissions.USERS_READ,
  ],
};

export const listUsersRequestSchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export type ListUsersRequest = z.infer<typeof listUsersRequestSchema>;

export interface ListUsersResponse {
  users: UserPublic[];
  total: number;
}

export interface UserPublic {
  id: string;
  email: string | null;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  jobTitle: string | null;
  status: string | null;
  systemRole: string | null;
  createdAt: Date | null;
}

export const updateUserRequestSchema = z.object({
  name: z.string().optional(),
  jobTitle: z.string().optional(),
  systemRole: z.enum(["admin", "manager", "member", "viewer"]).optional(),
  permissions: z.array(z.string()).optional(),
});

export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;

export interface UpdateUserResponse {
  user: UserPublic;
}

export const createUserRequestSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  jobTitle: z.string().optional(),
  systemRole: z.enum(["admin", "manager", "member", "viewer"]).default("member"),
});

export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;
