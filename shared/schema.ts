import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const highLevelRoleEnum = z.enum(['owner', 'manager', 'stakeholder', 'member']);
export type HighLevelRoleType = z.infer<typeof highLevelRoleEnum>;

// Re-export auth schema (users and sessions tables)
export * from "./models/auth";

// Import users from auth for relations
import { users } from "./models/auth";

// User Identities - external system connections for imported users
export const userIdentities = pgTable("user_identities", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // External system info
  systemId: varchar("system_id").notNull(), // e.g., "clickup", "jira"
  systemType: varchar("system_type"), // e.g., "project_management"
  systemName: varchar("system_name"), // Display name e.g., "ClickUp"
  workspaceId: varchar("workspace_id"), // Workspace/org in the external system
  
  // External user info
  externalUserId: varchar("external_user_id").notNull(), // User ID in external system
  externalUsername: varchar("external_username"),
  externalEmail: varchar("external_email"),
  identityType: varchar("identity_type").default("user"), // user, service_account, bot
  status: varchar("status").default("active"), // active, inactive, pending
  
  // Auth info (stored as JSON for flexibility)
  auth: jsonb("auth").$type<{
    authType: string;
    provider: string;
    scopes?: string[];
    tokenRef?: string;
    tokenExpiresAt?: string;
  }>(),
  
  // Roles and permissions in external system
  roles: jsonb("roles").$type<string[]>().default([]),
  externalPermissions: jsonb("external_permissions").$type<Record<string, boolean>>(),
  
  // Profile from external system
  profile: jsonb("profile").$type<{
    displayName?: string;
    avatarUrl?: string;
    timezone?: string;
    locale?: string;
  }>(),
  
  // Sync status
  syncSourceOfTruth: varchar("sync_source_of_truth").default("mixed"), // local, external, mixed
  lastSyncedAt: timestamp("last_synced_at"),
  syncStatus: varchar("sync_status").default("healthy"), // healthy, stale, error
  lastSyncError: text("last_sync_error"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by"),
  updatedBy: varchar("updated_by"),
});

export const insertUserIdentitySchema = createInsertSchema(userIdentities).omit({ 
  createdAt: true, 
  updatedAt: true 
});

export type UserIdentity = typeof userIdentities.$inferSelect;
export type InsertUserIdentity = z.infer<typeof insertUserIdentitySchema>;

// Framework Templates
export const frameworkTemplates = pgTable("framework_templates", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  defaultStages: text("default_stages").array().notNull().default([]),
});

// Projects
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("Upcoming"),
  startDate: text("start_date"),
  deadline: text("deadline").notNull(),
  progress: integer("progress").default(0),
  frameworkId: varchar("framework_id").references(() => frameworkTemplates.id),
  defaultMappingTemplateId: varchar("default_mapping_template_id"),
  permissions: jsonb("permissions"),
  sprintDurationWeeks: integer("sprint_duration_weeks"),
  ownerId: varchar("owner_id").references(() => users.id),
  client: text("client"),
  riskLevel: text("risk_level"),
  externalRefs: jsonb("external_refs").$type<Array<{source: string; sourceId: string; url?: string; importedAt: string; metadata?: Record<string, any>}>>(),
  createdBy: varchar("created_by").references(() => users.id),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project Favorites (user favorites for quick access)
export const projectFavorites = pgTable("project_favorites", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Deliverables
export const deliverables = pgTable("deliverables", {
  id: varchar("id").primaryKey(),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("Not Started"),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  startDate: text("start_date"),
  dueDate: text("due_date").notNull(),
  progress: integer("progress").notNull().default(0),
  typeId: varchar("type_id"),
  externalRefs: jsonb("external_refs").$type<Array<{source: string; sourceId: string; url?: string; importedAt: string; metadata?: Record<string, any>}>>(),
  createdBy: varchar("created_by").references(() => users.id),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Epics
export const epics = pgTable("epics", {
  id: varchar("id").primaryKey(),
  deliverableId: varchar("deliverable_id").notNull().references(() => deliverables.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("Not Started"),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  progress: integer("progress").notNull().default(0),
  stageIds: text("stage_ids").array().notNull().default([]),
  typeId: varchar("type_id"),
  externalRefs: jsonb("external_refs").$type<Array<{source: string; sourceId: string; url?: string; importedAt: string; metadata?: Record<string, any>}>>(),
  scheduleOverride: boolean("schedule_override").default(false),
  overrideReason: text("override_reason"),
  overrideAt: timestamp("override_at"),
  overrideBy: varchar("override_by").references(() => users.id),
  createdBy: varchar("created_by").references(() => users.id),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project Stages
export const projectStages = pgTable("project_stages", {
  id: varchar("id").primaryKey(),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  order: integer("order").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("pending"),
  startDate: text("start_date"),
  endDate: text("end_date"),
});

// Milestones
export const milestones = pgTable("milestones", {
  id: varchar("id").primaryKey(),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  phase: text("phase").notNull(),
  stageId: varchar("stage_id").references(() => projectStages.id),
  targetDate: text("target_date").notNull(),
  status: text("status").notNull().default("planned"),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  scopeType: text("scope_type").notNull(),
  completionMode: text("completion_mode").notNull(),
  completionTargetPercent: integer("completion_target_percent"),
  tags: text("tags").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  progressTotalTasks: integer("progress_total_tasks").notNull().default(0),
  progressCompletedTasks: integer("progress_completed_tasks").notNull().default(0),
  progressPercentComplete: integer("progress_percent_complete").notNull().default(0),
  progressLastCalculatedAt: timestamp("progress_last_calculated_at"),
  progressPercent: integer("progress_percent"),
  isBillingGate: boolean("is_billing_gate").default(false),
  requiredCompletionRatio: integer("required_completion_ratio"),
  createdBy: varchar("created_by").references(() => users.id),
  updatedBy: varchar("updated_by").references(() => users.id),
});

// Sprints (timeboxed work containers)
export const sprints = pgTable("sprints", {
  id: varchar("id").primaryKey(),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  ownerUserId: varchar("owner_user_id").references(() => users.id),
  name: text("name").notNull(),
  goal: text("goal"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  status: text("status").notNull().default("planned"),
  capacityHours: integer("capacity_hours"),
  notes: text("notes"),
  autoStart: boolean("auto_start").default(false),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
  updatedBy: varchar("updated_by").references(() => users.id),
});

// Sprint Members (capacity tracking)
export const sprintMembers = pgTable("sprint_members", {
  id: varchar("id").primaryKey(),
  sprintId: varchar("sprint_id").notNull().references(() => sprints.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  capacityHours: integer("capacity_hours").default(0),
  capacityPoints: integer("capacity_points").default(0),
});

// Sprint Scope Events (audit trail for scope changes)
export const sprintScopeEvents = pgTable("sprint_scope_events", {
  id: varchar("id").primaryKey(),
  sprintId: varchar("sprint_id").notNull().references(() => sprints.id, { onDelete: "cascade" }),
  taskId: varchar("task_id").notNull(),
  userId: varchar("user_id").references(() => users.id),
  eventType: text("event_type").notNull(),
  occurredAt: timestamp("occurred_at").defaultNow(),
  note: text("note"),
});

// Sprint Scope Targets (which epics/milestones/stages are in scope for a sprint)
export const sprintScopeTargets = pgTable("sprint_scope_targets", {
  id: varchar("id").primaryKey(),
  sprintId: varchar("sprint_id").notNull().references(() => sprints.id, { onDelete: "cascade" }),
  targetType: text("target_type").notNull(), // "epic" | "milestone" | "stage"
  targetId: varchar("target_id").notNull(),
  autoSyncTasks: boolean("auto_sync_tasks").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sprint Pulse Updates (async standup entries per user per day)
export const sprintPulseUpdates = pgTable("sprint_pulse_updates", {
  id: varchar("id").primaryKey(),
  sprintId: varchar("sprint_id").notNull().references(() => sprints.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  didText: text("did_text"),
  nextText: text("next_text"),
  blockersText: text("blockers_text"),
  referencedTaskIds: text("referenced_task_ids").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schedule Sync Audit (tracks all hierarchy date sync decisions)
export const scheduleSyncAudit = pgTable("schedule_sync_audit", {
  id: varchar("id").primaryKey(),
  entityType: text("entity_type").notNull(), // 'task' | 'epic' | 'deliverable'
  entityId: varchar("entity_id").notNull(),
  action: text("action").notNull(), // 'sync_applied' | 'override_saved' | 'cancelled'
  changePlan: jsonb("change_plan").$type<{
    items: Array<{
      entityType: string;
      entityId: string;
      currentDates: { startDate?: string; endDate?: string; dueDate?: string };
      proposedDates: { startDate?: string; endDate?: string; dueDate?: string };
      reason: string;
      warningCode: string;
    }>;
    impactedCount: number;
    warnings: string[];
  }>(),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Fibonacci sequence values for effort estimation (1-100)
export const EFFORT_VALUES = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89] as const;
export type EffortValue = typeof EFFORT_VALUES[number];

// Tasks
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  project: text("project").notNull(),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  stageId: varchar("stage_id").references(() => projectStages.id),
  epicId: varchar("epic_id").references(() => epics.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("BACKLOGGED"),
  assigneeId: varchar("assignee_id").references(() => users.id),
  deadline: text("deadline").notNull(),
  priority: text("priority").notNull().default("Medium"),
  milestoneId: varchar("milestone_id").references(() => milestones.id),
  sprintId: varchar("sprint_id").references(() => sprints.id),
  estimateHours: integer("estimate_hours"),
  effort: integer("effort"),
  tags: text("tags").array().default([]),
  blocked: boolean("blocked").default(false),
  blockerReason: text("blocker_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  taskTypeId: varchar("task_type_id"),
  parentTaskId: varchar("parent_task_id"),
  externalRefs: jsonb("external_refs").$type<Array<{source: string; sourceId: string; url?: string; importedAt: string; metadata?: Record<string, any>}>>(),
  scheduleOverride: boolean("schedule_override").default(false),
  overrideReason: text("override_reason"),
  overrideAt: timestamp("override_at"),
  overrideBy: varchar("override_by").references(() => users.id),
  inheritedFromStage: boolean("inherited_from_stage").default(false),
  assignedRoleId: varchar("assigned_role_id").references(() => projectRoles.id),
  createdBy: varchar("created_by").references(() => users.id),
  updatedBy: varchar("updated_by").references(() => users.id),
});

// Milestone Scope Rules (stored as JSONB for flexibility)
export const milestoneScopeRules = pgTable("milestone_scope_rules", {
  id: varchar("id").primaryKey(),
  milestoneId: varchar("milestone_id").notNull().references(() => milestones.id, { onDelete: "cascade" }),
  rules: jsonb("rules").notNull(),
  lastEvaluatedAt: timestamp("last_evaluated_at"),
});

// Milestone Task Links
export const milestoneTaskLinks = pgTable("milestone_task_links", {
  id: varchar("id").primaryKey(),
  milestoneId: varchar("milestone_id").notNull().references(() => milestones.id, { onDelete: "cascade" }),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").references(() => projects.id),
  source: text("source").notNull(),
  ruleId: varchar("rule_id"),
  locked: boolean("locked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activity
export const activity = pgTable("activity", {
  id: varchar("id").primaryKey(),
  user: text("user").notNull(),
  action: text("action").notNull(),
  target: text("target").notNull(),
  time: text("time").notNull(),
  details: text("details"),
  avatar: text("avatar"),
});

// Comments
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey(),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").notNull().references(() => users.id),
  authorName: text("author_name").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Attachments
export const attachments = pgTable("attachments", {
  id: varchar("id").primaryKey(),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  url: text("url").notNull(),
  fileType: text("file_type").notNull(),
  size: text("size").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  uploadedBy: text("uploaded_by").notNull(),
});

// History
export const history = pgTable("history", {
  id: varchar("id").primaryKey(),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  field: text("field").notNull(),
  oldValue: text("old_value").notNull(),
  newValue: text("new_value").notNull(),
  changedAt: timestamp("changed_at").notNull().defaultNow(),
  changedBy: text("changed_by").notNull(),
});

// Project Roles
export const projectRoles = pgTable("project_roles", {
  id: varchar("id").primaryKey(),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  roleType: text("role_type").notNull(),
  isRequired: boolean("is_required").notNull().default(false),
  maxAssignees: integer("max_assignees"),
  permissions: text("permissions").array().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Role Assignments (links users to roles within a project) - LEGACY, use projectTeamMembers instead
export const roleAssignments = pgTable("role_assignments", {
  id: varchar("id").primaryKey(),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  roleId: varchar("role_id").references(() => projectRoles.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  memberType: text("member_type").notNull().default("member"), // owner, stakeholder, member
  isPrimary: boolean("is_primary").notNull().default(false),
  allocationPercent: integer("allocation_percent").notNull().default(100),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project Team Members - unified source of truth for project membership
export const projectTeamMembers = pgTable("project_team_members", {
  id: varchar("id").primaryKey(),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  allocationPercent: integer("allocation_percent").notNull().default(100),
  joinedAt: timestamp("joined_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// High-Level Project Roles - enum-driven project-level roles (owner, manager, stakeholder, member)
export const projectHighLevelRoles = pgTable("project_high_level_roles", {
  id: varchar("id").primaryKey(),
  teamMemberId: varchar("team_member_id").notNull().references(() => projectTeamMembers.id, { onDelete: "cascade" }),
  roleType: text("role_type").notNull(), // 'owner', 'manager', 'stakeholder', 'member'
  createdAt: timestamp("created_at").defaultNow(),
});

// Execution Role Assignments - links team members to execution roles (designer, developer, QA)
export const executionRoleAssignments = pgTable("execution_role_assignments", {
  id: varchar("id").primaryKey(),
  teamMemberId: varchar("team_member_id").notNull().references(() => projectTeamMembers.id, { onDelete: "cascade" }),
  roleId: varchar("role_id").notNull().references(() => projectRoles.id, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Role Templates
export const roleTemplates = pgTable("role_templates", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  defaultRoleType: text("default_role_type").notNull(),
  defaultPermissions: text("default_permissions").array().notNull().default([]),
});

// Saved Views
export const savedViews = pgTable("saved_views", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  stageIds: text("stage_ids").array().notNull().default([]),
  viewType: text("view_type").notNull(),
  visibility: text("visibility").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  config: jsonb("config").notNull(),
});

// Guidance Items
export const guidanceItems = pgTable("guidance_items", {
  id: varchar("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  priority: text("priority").notNull(),
  stageId: varchar("stage_id").references(() => projectStages.id),
});

// Stage Templates
export const stageTemplates = pgTable("stage_templates", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  defaultTasks: text("default_tasks").array().notNull().default([]),
  defaultRoles: text("default_roles").array().notNull().default([]),
  entryCriteria: text("entry_criteria"),
  exitCriteria: text("exit_criteria"),
  allowedTaskStatuses: text("allowed_task_statuses").array().default([]),
});

// Project Templates
export const projectTemplates = pgTable("project_templates", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  defaultFrameworkId: varchar("default_framework_id").references(() => frameworkTemplates.id),
  defaultRoles: text("default_roles").array().notNull().default([]),
  defaultDeliverables: text("default_deliverables").array().default([]),
  thumbnail: text("thumbnail"),
});

// Deliverable Templates
export const deliverableTemplates = pgTable("deliverable_templates", {
  id: varchar("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  defaultEpics: text("default_epics").array().notNull().default([]),
});

// Epic Templates
export const epicTemplates = pgTable("epic_templates", {
  id: varchar("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  defaultStages: text("default_stages").array().notNull().default([]),
});

// Task Templates
export const taskTemplates = pgTable("task_templates", {
  id: varchar("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  defaultPriority: text("default_priority").notNull(),
  defaultEstimateHours: integer("default_estimate_hours").notNull(),
  requiredRole: text("required_role"),
  assignedRoleId: varchar("assigned_role_id"),
  scope: text("scope").notNull().default("per_epic"),
  assigneeRoleTypeId: varchar("assignee_role_type_id").references(() => roleTypes.id),
});

// Milestone Templates
export const milestoneTemplates = pgTable("milestone_templates", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  phase: text("phase").notNull().default("delivery"),
  scopeType: text("scope_type").notNull().default("deliverable"),
  completionMode: text("completion_mode").notNull().default("percentage"),
  completionTargetPercent: integer("completion_target_percent").default(100),
  isBillingGate: boolean("is_billing_gate").default(false),
  offsetDays: integer("offset_days").default(0),
});

// Template Snippets (bundles of stages/tasks/milestones that can be applied together)
export const templateSnippets = pgTable("template_snippets", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  stageTemplateIds: text("stage_template_ids").array().default([]),
  taskTemplateIds: text("task_template_ids").array().default([]),
  milestoneTemplateIds: text("milestone_template_ids").array().default([]),
  isDefault: boolean("is_default").default(false),
});

// User Role Eligibility (maps users to role types they can be assigned to)
export const userRoleEligibility = pgTable("user_role_eligibility", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleTypeId: varchar("role_type_id").notNull().references(() => roleTypes.id, { onDelete: "cascade" }),
});

// Mapping Templates
export const mappingTemplates = pgTable("mapping_templates", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  dataType: text("data_type").notNull(),
});

// Task Types (global defaults for categorizing tasks)
export const taskTypes = pgTable("task_types", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  icon: text("icon"), // optional lucide icon name
  isDefault: boolean("is_default").default(false),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Project Task Types (project-level task type configuration)
export const projectTaskTypes = pgTable("project_task_types", {
  id: varchar("id").primaryKey(),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  taskTypeId: varchar("task_type_id").references(() => taskTypes.id, { onDelete: "cascade" }), // null for custom project types
  name: text("name").notNull(), // can override global name
  color: text("color").notNull(),
  icon: text("icon"),
  isEnabled: boolean("is_enabled").default(true),
  isDefault: boolean("is_default").default(false),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Epic Types (global defaults for categorizing epics)
export const epicTypes = pgTable("epic_types", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  icon: text("icon"),
  isDefault: boolean("is_default").default(false),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Deliverable Types (global defaults for categorizing deliverables)
export const deliverableTypes = pgTable("deliverable_types", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  icon: text("icon"),
  isDefault: boolean("is_default").default(false),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Task Dependencies (finish-to-start blocking relationships)
export const taskDependencies = pgTable("task_dependencies", {
  id: varchar("id").primaryKey(),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  dependsOnTaskId: varchar("depends_on_task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  dependencyType: text("dependency_type").notNull().default("finish_to_start"), // only finish_to_start for v1
  source: text("source").notNull().default("manual_add"), // "manual_add" | "rule:ruleId1,ruleId2" | "matrix_add"
  locked: boolean("locked").notNull().default(false), // Prevent automatic removal by rule changes
  createdAt: timestamp("created_at").defaultNow(),
});

// Task Dependency Scope Rules (stored as JSONB for flexibility)
export const taskDependencyScopeRules = pgTable("task_dependency_scope_rules", {
  id: varchar("id").primaryKey(),
  taskId: varchar("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  rules: jsonb("rules").notNull(), // Array of rule objects: { id, label, active, stage, epicType, taskTemplateKey }
  lastEvaluatedAt: timestamp("last_evaluated_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Status Options (global defaults)
export const statusOptions = pgTable("status_options", {
  id: varchar("id").primaryKey(),
  label: text("label").notNull(),
  color: text("color").notNull(),
  isDefault: boolean("is_default").default(false),
  type: text("type").notNull(), // "project" | "task"
  order: integer("order").notNull().default(0),
  kanbanCollapsed: boolean("kanban_collapsed").default(false), // Whether column is collapsed by default on kanban board
});

// Project Task Statuses (project-level overrides)
export const projectTaskStatuses = pgTable("project_task_statuses", {
  id: varchar("id").primaryKey(),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  color: text("color").notNull(),
  isDefault: boolean("is_default").default(false),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Project Settings (for project-level configuration)
export const projectSettings = pgTable("project_settings", {
  id: varchar("id").primaryKey(),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }).unique(),
  useCustomStatuses: boolean("use_custom_statuses").default(false),
  useCustomTaskTypes: boolean("use_custom_task_types").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Role Types (for role template categorization)
export const roleTypes = pgTable("role_types", {
  id: varchar("id").primaryKey(),
  label: text("label").notNull(),
  description: text("description"),
  isDefault: boolean("is_default").default(false),
});

// System Roles (platform-level access control)
export const systemRoles = pgTable("system_roles", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull().unique(),
  label: text("label").notNull(),
  description: text("description"),
  isBuiltIn: boolean("is_built_in").default(true),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// System Permissions (granular access rights)
export const systemPermissions = pgTable("system_permissions", {
  id: varchar("id").primaryKey(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Role Permissions (junction table for role-permission assignments)
export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id").primaryKey(),
  roleId: varchar("role_id").notNull().references(() => systemRoles.id, { onDelete: "cascade" }),
  permissionId: varchar("permission_id").notNull().references(() => systemPermissions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Preferences (for work hours and settings)
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workdayStartTime: text("workday_start_time").default("09:00"),
  workdayEndTime: text("workday_end_time").default("17:00"),
  defaultTargetDailyMinutes: integer("default_target_daily_minutes").default(480),
  showOnlyActionable: boolean("show_only_actionable").default(false),
  timezone: text("timezone").default("America/New_York"),
});

// Work Blocks (time-boxed work sessions)
export const workBlocks = pgTable("work_blocks", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  label: text("label"),
  taskIds: text("task_ids").array().default([]),
  totalPlannedMinutes: integer("total_planned_minutes"),
  status: text("status").notNull().default("planned"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Day Plans (daily planning container)
export const dayPlans = pgTable("day_plans", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  targetWorkMinutes: integer("target_work_minutes").default(480),
  plannedMinutes: integer("planned_minutes").default(0),
  unassignedTaskIds: text("unassigned_task_ids").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// App Settings (global application configuration)
export const appSettings = pgTable("app_settings", {
  id: varchar("id").primaryKey().default("default"),
  demoDataReady: boolean("demo_data_ready").default(false),
  demoLoginUserId: varchar("demo_login_user_id"),
  completedTaskStatusIds: text("completed_task_status_ids").array().default([]),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true });
export const insertProjectFavoriteSchema = createInsertSchema(projectFavorites).omit({ id: true, createdAt: true });
export const insertDeliverableSchema = createInsertSchema(deliverables).omit({ id: true });
export const insertEpicSchema = createInsertSchema(epics).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true }).extend({
  updatedAt: z.coerce.date().optional(),
});
export const insertMilestoneSchema = createInsertSchema(milestones).omit({ id: true }).extend({
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  progressLastCalculatedAt: z.coerce.date().optional(),
});
export const insertMilestoneScopeRuleSchema = createInsertSchema(milestoneScopeRules).omit({ id: true }).extend({
  lastEvaluatedAt: z.coerce.date().optional(),
});
export const insertMilestoneTaskLinkSchema = createInsertSchema(milestoneTaskLinks).omit({ id: true }).extend({
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});
export const insertSprintSchema = createInsertSchema(sprints).omit({ id: true }).extend({
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});
export const insertSprintMemberSchema = createInsertSchema(sprintMembers).omit({ id: true });
export const insertSprintScopeEventSchema = createInsertSchema(sprintScopeEvents).omit({ id: true, occurredAt: true });
export const insertSprintScopeTargetSchema = createInsertSchema(sprintScopeTargets).omit({ id: true, createdAt: true });
export const insertSprintPulseUpdateSchema = createInsertSchema(sprintPulseUpdates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertActivitySchema = createInsertSchema(activity).omit({ id: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true });
export const insertAttachmentSchema = createInsertSchema(attachments).omit({ id: true });
export const insertHistorySchema = createInsertSchema(history).omit({ id: true });
export const insertProjectRoleSchema = createInsertSchema(projectRoles).omit({ id: true });
export const insertRoleAssignmentSchema = createInsertSchema(roleAssignments).omit({ id: true });
export const insertProjectTeamMemberSchema = createInsertSchema(projectTeamMembers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProjectHighLevelRoleSchema = createInsertSchema(projectHighLevelRoles).omit({ id: true, createdAt: true });
export const insertExecutionRoleAssignmentSchema = createInsertSchema(executionRoleAssignments).omit({ id: true, createdAt: true });
export const insertRoleTemplateSchema = createInsertSchema(roleTemplates).omit({ id: true });
export const insertSavedViewSchema = createInsertSchema(savedViews).omit({ id: true });
export const insertGuidanceItemSchema = createInsertSchema(guidanceItems).omit({ id: true });
export const insertProjectStageSchema = createInsertSchema(projectStages).omit({ id: true });
export const insertFrameworkTemplateSchema = createInsertSchema(frameworkTemplates).omit({ id: true });
export const insertStageTemplateSchema = createInsertSchema(stageTemplates).omit({ id: true });
export const insertProjectTemplateSchema = createInsertSchema(projectTemplates).omit({ id: true });
export const insertDeliverableTemplateSchema = createInsertSchema(deliverableTemplates).omit({ id: true });
export const insertEpicTemplateSchema = createInsertSchema(epicTemplates).omit({ id: true });
export const insertTaskTemplateSchema = createInsertSchema(taskTemplates).omit({ id: true });
export const insertMilestoneTemplateSchema = createInsertSchema(milestoneTemplates).omit({ id: true });
export const insertTemplateSnippetSchema = createInsertSchema(templateSnippets).omit({ id: true });
export const insertUserRoleEligibilitySchema = createInsertSchema(userRoleEligibility).omit({ id: true });
export const insertMappingTemplateSchema = createInsertSchema(mappingTemplates).omit({ id: true });
export const insertStatusOptionSchema = createInsertSchema(statusOptions).omit({ id: true });
export const insertProjectTaskStatusSchema = createInsertSchema(projectTaskStatuses).omit({ id: true, createdAt: true });
export const insertProjectSettingsSchema = createInsertSchema(projectSettings).omit({ id: true, updatedAt: true });
export const insertTaskTypeSchema = createInsertSchema(taskTypes).omit({ id: true, createdAt: true });
export const insertProjectTaskTypeSchema = createInsertSchema(projectTaskTypes).omit({ id: true, createdAt: true });
export const insertEpicTypeSchema = createInsertSchema(epicTypes).omit({ id: true, createdAt: true });
export const insertDeliverableTypeSchema = createInsertSchema(deliverableTypes).omit({ id: true, createdAt: true });
export const insertTaskDependencySchema = createInsertSchema(taskDependencies).omit({ id: true, createdAt: true });
export const insertTaskDependencyScopeRuleSchema = createInsertSchema(taskDependencyScopeRules).omit({ id: true, createdAt: true, updatedAt: true }).extend({
  lastEvaluatedAt: z.coerce.date().optional(),
});
export const insertRoleTypeSchema = createInsertSchema(roleTypes).omit({ id: true });
export const insertSystemRoleSchema = createInsertSchema(systemRoles).omit({ id: true, createdAt: true });
export const insertSystemPermissionSchema = createInsertSchema(systemPermissions).omit({ id: true, createdAt: true });
export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({ id: true, createdAt: true });
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true });
export const insertWorkBlockSchema = createInsertSchema(workBlocks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDayPlanSchema = createInsertSchema(dayPlans).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAppSettingsSchema = createInsertSchema(appSettings).omit({ updatedAt: true });

// Bulk-create schemas (include optional id for import/full-create scenarios)
export const bulkInsertDeliverableSchema = insertDeliverableSchema.extend({ id: z.string().optional() });
export const bulkInsertEpicSchema = insertEpicSchema.extend({ id: z.string().optional() });
export const bulkInsertTaskSchema = insertTaskSchema.extend({ id: z.string().optional() });
export const bulkInsertMilestoneSchema = insertMilestoneSchema.extend({ id: z.string().optional() });
export const bulkInsertProjectStageSchema = insertProjectStageSchema.extend({ id: z.string().optional() });

export type BulkInsertDeliverable = z.infer<typeof bulkInsertDeliverableSchema>;
export type BulkInsertEpic = z.infer<typeof bulkInsertEpicSchema>;
export type BulkInsertTask = z.infer<typeof bulkInsertTaskSchema>;
export type BulkInsertMilestone = z.infer<typeof bulkInsertMilestoneSchema>;
export type BulkInsertProjectStage = z.infer<typeof bulkInsertProjectStageSchema>;

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type ProjectFavorite = typeof projectFavorites.$inferSelect;
export type InsertProjectFavorite = z.infer<typeof insertProjectFavoriteSchema>;

export type Deliverable = typeof deliverables.$inferSelect;
export type InsertDeliverable = z.infer<typeof insertDeliverableSchema>;

export type Epic = typeof epics.$inferSelect;
export type InsertEpic = z.infer<typeof insertEpicSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;

export type MilestoneScopeRule = typeof milestoneScopeRules.$inferSelect;
export type InsertMilestoneScopeRule = z.infer<typeof insertMilestoneScopeRuleSchema>;

export type MilestoneTaskLink = typeof milestoneTaskLinks.$inferSelect;
export type InsertMilestoneTaskLink = z.infer<typeof insertMilestoneTaskLinkSchema>;

export type Sprint = typeof sprints.$inferSelect;
export type InsertSprint = z.infer<typeof insertSprintSchema>;

export type SprintMember = typeof sprintMembers.$inferSelect;
export type InsertSprintMember = z.infer<typeof insertSprintMemberSchema>;

export type SprintScopeEvent = typeof sprintScopeEvents.$inferSelect;
export type InsertSprintScopeEvent = z.infer<typeof insertSprintScopeEventSchema>;

export type SprintScopeTarget = typeof sprintScopeTargets.$inferSelect;
export type InsertSprintScopeTarget = z.infer<typeof insertSprintScopeTargetSchema>;

export type SprintPulseUpdate = typeof sprintPulseUpdates.$inferSelect;
export type InsertSprintPulseUpdate = z.infer<typeof insertSprintPulseUpdateSchema>;

export type Activity = typeof activity.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;

export type History = typeof history.$inferSelect;
export type InsertHistory = z.infer<typeof insertHistorySchema>;

export type ProjectRole = typeof projectRoles.$inferSelect;
export type InsertProjectRole = z.infer<typeof insertProjectRoleSchema>;

export type RoleAssignment = typeof roleAssignments.$inferSelect;
export type InsertRoleAssignment = z.infer<typeof insertRoleAssignmentSchema>;

export type ProjectTeamMember = typeof projectTeamMembers.$inferSelect;
export type InsertProjectTeamMember = z.infer<typeof insertProjectTeamMemberSchema>;

export type ProjectHighLevelRole = typeof projectHighLevelRoles.$inferSelect;
export type InsertProjectHighLevelRole = z.infer<typeof insertProjectHighLevelRoleSchema>;

export type ExecutionRoleAssignment = typeof executionRoleAssignments.$inferSelect;
export type InsertExecutionRoleAssignment = z.infer<typeof insertExecutionRoleAssignmentSchema>;

export type RoleTemplate = typeof roleTemplates.$inferSelect;
export type InsertRoleTemplate = z.infer<typeof insertRoleTemplateSchema>;

export type SavedView = typeof savedViews.$inferSelect;
export type InsertSavedView = z.infer<typeof insertSavedViewSchema>;

export type GuidanceItem = typeof guidanceItems.$inferSelect;
export type InsertGuidanceItem = z.infer<typeof insertGuidanceItemSchema>;

export type ProjectStage = typeof projectStages.$inferSelect;
export type InsertProjectStage = z.infer<typeof insertProjectStageSchema>;

export type FrameworkTemplate = typeof frameworkTemplates.$inferSelect;
export type InsertFrameworkTemplate = z.infer<typeof insertFrameworkTemplateSchema>;

export type StageTemplate = typeof stageTemplates.$inferSelect;
export type InsertStageTemplate = z.infer<typeof insertStageTemplateSchema>;

export type ProjectTemplate = typeof projectTemplates.$inferSelect;
export type InsertProjectTemplate = z.infer<typeof insertProjectTemplateSchema>;

export type DeliverableTemplate = typeof deliverableTemplates.$inferSelect;
export type InsertDeliverableTemplate = z.infer<typeof insertDeliverableTemplateSchema>;

export type EpicTemplate = typeof epicTemplates.$inferSelect;
export type InsertEpicTemplate = z.infer<typeof insertEpicTemplateSchema>;

export type TaskTemplate = typeof taskTemplates.$inferSelect;
export type InsertTaskTemplate = z.infer<typeof insertTaskTemplateSchema>;

export type MilestoneTemplate = typeof milestoneTemplates.$inferSelect;
export type InsertMilestoneTemplate = z.infer<typeof insertMilestoneTemplateSchema>;

export type TemplateSnippet = typeof templateSnippets.$inferSelect;
export type InsertTemplateSnippet = z.infer<typeof insertTemplateSnippetSchema>;

export type UserRoleEligibility = typeof userRoleEligibility.$inferSelect;
export type InsertUserRoleEligibility = z.infer<typeof insertUserRoleEligibilitySchema>;

export type MappingTemplate = typeof mappingTemplates.$inferSelect;
export type InsertMappingTemplate = z.infer<typeof insertMappingTemplateSchema>;

export type StatusOption = typeof statusOptions.$inferSelect;
export type InsertStatusOption = z.infer<typeof insertStatusOptionSchema>;

export type ProjectTaskStatus = typeof projectTaskStatuses.$inferSelect;
export type InsertProjectTaskStatus = z.infer<typeof insertProjectTaskStatusSchema>;

export type ProjectSettings = typeof projectSettings.$inferSelect;
export type InsertProjectSettings = z.infer<typeof insertProjectSettingsSchema>;

export type RoleType = typeof roleTypes.$inferSelect;
export type InsertRoleType = z.infer<typeof insertRoleTypeSchema>;

export type SystemRole = typeof systemRoles.$inferSelect;
export type InsertSystemRole = z.infer<typeof insertSystemRoleSchema>;

export type SystemPermission = typeof systemPermissions.$inferSelect;
export type InsertSystemPermission = z.infer<typeof insertSystemPermissionSchema>;

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

export type WorkBlock = typeof workBlocks.$inferSelect;
export type InsertWorkBlock = z.infer<typeof insertWorkBlockSchema>;

export type DayPlan = typeof dayPlans.$inferSelect;
export type InsertDayPlan = z.infer<typeof insertDayPlanSchema>;

export type TaskType = typeof taskTypes.$inferSelect;
export type InsertTaskType = z.infer<typeof insertTaskTypeSchema>;

export type ProjectTaskType = typeof projectTaskTypes.$inferSelect;
export type InsertProjectTaskType = z.infer<typeof insertProjectTaskTypeSchema>;

export type EpicType = typeof epicTypes.$inferSelect;
export type InsertEpicType = z.infer<typeof insertEpicTypeSchema>;

export type DeliverableType = typeof deliverableTypes.$inferSelect;
export type InsertDeliverableType = z.infer<typeof insertDeliverableTypeSchema>;

export type TaskDependency = typeof taskDependencies.$inferSelect;
export type InsertTaskDependency = z.infer<typeof insertTaskDependencySchema>;

export type TaskDependencyScopeRule = typeof taskDependencyScopeRules.$inferSelect;
export type InsertTaskDependencyScopeRule = z.infer<typeof insertTaskDependencyScopeRuleSchema>;

export type AppSettings = typeof appSettings.$inferSelect;
export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;
