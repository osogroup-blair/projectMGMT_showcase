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
  DEMO: "demo",
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
  demo: [
    UserPermissions.USERS_READ,
  ],
};

export const listUsersRequestSchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  userType: z.enum(["internal", "client"]).optional(),
  page: z.number().optional().default(1),
  pageSize: z.number().optional().default(50),
  sortBy: z.enum(["name", "email", "systemRole", "status", "createdAt", "lastLogin", "loginCount"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  hasEmail: z.enum(["yes", "no"]).optional(),
  hasTasks: z.enum(["yes", "no"]).optional(),
  emailDomain: z.string().optional(),
  createdBefore: z.string().optional(),
  createdAfter: z.string().optional(),
  // Legacy support
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export type ListUsersRequest = z.infer<typeof listUsersRequestSchema>;

export interface ListUsersResponse {
  users: UserPublic[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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
  userType: string | null;
  permissions: string[] | null;
  roleTemplateIds: string[] | null;
  createdAt: Date | null;
  lastLogin: Date | null;
  loginCount: number | null;
}

export const updateUserRequestSchema = z.object({
  name: z.string().optional(),
  jobTitle: z.string().optional(),
  systemRole: z.enum(["admin", "manager", "member", "viewer", "demo"]).optional(),
  userType: z.enum(["internal", "client"]).optional(),
  permissions: z.array(z.string()).optional(),
  roleTemplateIds: z.array(z.string()).optional(),
});

export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;

export interface UpdateUserResponse {
  user: UserPublic;
}

export const createUserRequestSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  jobTitle: z.string().optional(),
  systemRole: z.enum(["admin", "manager", "member", "viewer", "demo"]).default("member"),
  userType: z.enum(["internal", "client"]).default("internal"),
  permissions: z.array(z.string()).optional(),
});

export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;
