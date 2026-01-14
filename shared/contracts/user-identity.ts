import { z } from "zod";

export const IdentityStatuses = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
  ERROR: "error",
} as const;

export type IdentityStatus = typeof IdentityStatuses[keyof typeof IdentityStatuses];

export const AuthTypes = {
  OAUTH2: "oauth2",
  API_KEY: "api_key",
  BASIC: "basic",
  SSO: "sso",
  IMPORTED: "imported",
} as const;

export type AuthType = typeof AuthTypes[keyof typeof AuthTypes];

export const SyncStatuses = {
  HEALTHY: "healthy",
  STALE: "stale",
  ERROR: "error",
  SYNCING: "syncing",
} as const;

export type SyncStatus = typeof SyncStatuses[keyof typeof SyncStatuses];

export const SystemTypes = {
  PROJECT_MANAGEMENT: "project_management",
  IDENTITY_PROVIDER: "identity_provider",
  CRM: "crm",
  COMMUNICATION: "communication",
  STORAGE: "storage",
  OTHER: "other",
} as const;

export type SystemType = typeof SystemTypes[keyof typeof SystemTypes];

export interface IdentityAuth {
  authType: AuthType;
  provider: string;
  scopes?: string[];
  tokenRef?: string;
  tokenExpiresAt?: string;
}

export interface IdentityProfile {
  displayName?: string;
  avatarUrl?: string;
  timezone?: string;
  locale?: string;
}

export interface IdentityPublic {
  id: string;
  userId: string;
  systemId: string;
  systemType: string | null;
  systemName: string | null;
  workspaceId: string | null;
  externalUserId: string;
  externalUsername: string | null;
  externalEmail: string | null;
  identityType: string | null;
  status: string | null;
  roles: string[] | null;
  profile: IdentityProfile | null;
  syncSourceOfTruth: string | null;
  lastSyncedAt: Date | null;
  syncStatus: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface UserProfileWithIdentities {
  id: string;
  email: string | null;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  jobTitle: string | null;
  status: string | null;
  systemRole: string | null;
  avatar: string | null;
  roleTemplateIds: string[] | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  identities: IdentityPublic[];
  primaryIdentityId?: string | null;
}

export const linkIdentityRequestSchema = z.object({
  systemId: z.string().min(1),
  systemType: z.string().optional(),
  systemName: z.string().optional(),
  workspaceId: z.string().optional(),
  externalUserId: z.string().min(1),
  externalUsername: z.string().optional(),
  externalEmail: z.string().email().optional(),
  identityType: z.enum(["user", "service_account", "bot"]).default("user"),
  auth: z.object({
    authType: z.enum(["oauth2", "api_key", "basic", "sso", "imported"]),
    provider: z.string(),
    scopes: z.array(z.string()).optional(),
  }).optional(),
  profile: z.object({
    displayName: z.string().optional(),
    avatarUrl: z.string().url().optional(),
    timezone: z.string().optional(),
    locale: z.string().optional(),
  }).optional(),
  roles: z.array(z.string()).optional(),
});

export type LinkIdentityRequest = z.infer<typeof linkIdentityRequestSchema>;

export const updateIdentityRequestSchema = z.object({
  status: z.enum(["active", "inactive", "pending", "error"]).optional(),
  externalUsername: z.string().optional(),
  externalEmail: z.string().email().optional(),
  syncSourceOfTruth: z.enum(["local", "external", "mixed"]).optional(),
  profile: z.object({
    displayName: z.string().optional(),
    avatarUrl: z.string().url().optional(),
    timezone: z.string().optional(),
    locale: z.string().optional(),
  }).optional(),
  roles: z.array(z.string()).optional(),
});

export type UpdateIdentityRequest = z.infer<typeof updateIdentityRequestSchema>;

export const updateProfileRequestSchema = z.object({
  name: z.string().min(1).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  jobTitle: z.string().optional(),
  avatar: z.string().url().optional().nullable(),
  roleTemplateIds: z.array(z.string()).optional(),
});

export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;

export interface MergeUsersRequest {
  sourceUserId: string;
  targetUserId: string;
  conflictResolution?: {
    preferSource?: boolean;
    fieldOverrides?: Record<string, "source" | "target">;
  };
}

export interface MergeUsersResult {
  mergedUserId: string;
  identitiesMoved: number;
  sourceUserMarkedMerged: boolean;
}

export const AvailableSystems = [
  { id: "clickup", name: "ClickUp", type: "project_management" },
  { id: "jira", name: "Jira", type: "project_management" },
  { id: "asana", name: "Asana", type: "project_management" },
  { id: "monday", name: "Monday.com", type: "project_management" },
  { id: "trello", name: "Trello", type: "project_management" },
  { id: "google", name: "Google Workspace", type: "identity_provider" },
  { id: "microsoft", name: "Microsoft 365", type: "identity_provider" },
  { id: "slack", name: "Slack", type: "communication" },
  { id: "github", name: "GitHub", type: "other" },
  { id: "gitlab", name: "GitLab", type: "other" },
] as const;
