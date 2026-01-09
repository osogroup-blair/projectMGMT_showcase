import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users (Team Members)
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  email: text("email").unique(),
  status: text("status").notNull().default("Offline"),
  avatar: text("avatar"),
});

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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  status: text("status").notNull().default("Todo"),
  assigneeId: varchar("assignee_id").references(() => users.id),
  deadline: text("deadline").notNull(),
  priority: text("priority").notNull().default("Medium"),
  milestoneId: varchar("milestone_id").references(() => milestones.id),
  sprintId: varchar("sprint_id").references(() => sprints.id),
  estimateHours: integer("estimate_hours"),
  effort: integer("effort"),
  tags: text("tags").array().default([]),
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
  name: text("name").notNull(),
  description: text("description").notNull(),
  roleType: text("role_type").notNull(),
  isRequired: boolean("is_required").notNull().default(false),
  maxAssignees: integer("max_assignees"),
  permissions: text("permissions").array().notNull().default([]),
});

// Role Assignments
export const roleAssignments = pgTable("role_assignments", {
  id: varchar("id").primaryKey(),
  roleId: varchar("role_id").notNull().references(() => projectRoles.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").notNull().default(false),
  allocationPercent: integer("allocation_percent").notNull().default(100),
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

// Task Template Scope - defines how tasks are generated
export const TASK_TEMPLATE_SCOPES = ["PER_EPIC", "ONCE"] as const;
export type TaskTemplateScope = typeof TASK_TEMPLATE_SCOPES[number];

// Task Templates
export const taskTemplates = pgTable("task_templates", {
  id: varchar("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  defaultPriority: text("default_priority").notNull(),
  defaultEstimateHours: integer("default_estimate_hours").notNull(),
  requiredRole: text("required_role"),
  assignedRoleId: varchar("assigned_role_id"),
  scope: text("scope").notNull().default("ONCE"), // PER_EPIC or ONCE per stage
  stageTemplateId: varchar("stage_template_id").references(() => stageTemplates.id),
});

// Stage Template Tasks (junction table for ordering tasks within stages)
export const stageTemplateTasks = pgTable("stage_template_tasks", {
  id: varchar("id").primaryKey(),
  stageTemplateId: varchar("stage_template_id").notNull().references(() => stageTemplates.id, { onDelete: "cascade" }),
  taskTemplateId: varchar("task_template_id").notNull().references(() => taskTemplates.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(0),
});

// User Role Eligibility (maps users to eligible role types)
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

// Status Options
export const statusOptions = pgTable("status_options", {
  id: varchar("id").primaryKey(),
  label: text("label").notNull(),
  color: text("color").notNull(),
  isDefault: boolean("is_default").default(false),
  type: text("type").notNull(),
});

// Role Types (for role template categorization)
export const roleTypes = pgTable("role_types", {
  id: varchar("id").primaryKey(),
  label: text("label").notNull(),
  description: text("description"),
  isDefault: boolean("is_default").default(false),
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

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true });
export const insertDeliverableSchema = createInsertSchema(deliverables).omit({ id: true });
export const insertEpicSchema = createInsertSchema(epics).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true });
export const insertMilestoneSchema = createInsertSchema(milestones).omit({ id: true });
export const insertMilestoneScopeRuleSchema = createInsertSchema(milestoneScopeRules).omit({ id: true });
export const insertMilestoneTaskLinkSchema = createInsertSchema(milestoneTaskLinks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSprintSchema = createInsertSchema(sprints).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSprintMemberSchema = createInsertSchema(sprintMembers).omit({ id: true });
export const insertSprintScopeEventSchema = createInsertSchema(sprintScopeEvents).omit({ id: true, occurredAt: true });
export const insertSprintScopeTargetSchema = createInsertSchema(sprintScopeTargets).omit({ id: true, createdAt: true });
export const insertActivitySchema = createInsertSchema(activity).omit({ id: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true });
export const insertAttachmentSchema = createInsertSchema(attachments).omit({ id: true });
export const insertHistorySchema = createInsertSchema(history).omit({ id: true });
export const insertProjectRoleSchema = createInsertSchema(projectRoles).omit({ id: true });
export const insertRoleAssignmentSchema = createInsertSchema(roleAssignments).omit({ id: true });
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
export const insertStageTemplateTaskSchema = createInsertSchema(stageTemplateTasks).omit({ id: true });
export const insertUserRoleEligibilitySchema = createInsertSchema(userRoleEligibility).omit({ id: true });
export const insertMappingTemplateSchema = createInsertSchema(mappingTemplates).omit({ id: true });
export const insertStatusOptionSchema = createInsertSchema(statusOptions).omit({ id: true });
export const insertRoleTypeSchema = createInsertSchema(roleTypes).omit({ id: true });
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({ id: true });
export const insertWorkBlockSchema = createInsertSchema(workBlocks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDayPlanSchema = createInsertSchema(dayPlans).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

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

export type StageTemplateTask = typeof stageTemplateTasks.$inferSelect;
export type InsertStageTemplateTask = z.infer<typeof insertStageTemplateTaskSchema>;

export type UserRoleEligibility = typeof userRoleEligibility.$inferSelect;
export type InsertUserRoleEligibility = z.infer<typeof insertUserRoleEligibilitySchema>;

export type MappingTemplate = typeof mappingTemplates.$inferSelect;
export type InsertMappingTemplate = z.infer<typeof insertMappingTemplateSchema>;

export type StatusOption = typeof statusOptions.$inferSelect;
export type InsertStatusOption = z.infer<typeof insertStatusOptionSchema>;

export type RoleType = typeof roleTypes.$inferSelect;
export type InsertRoleType = z.infer<typeof insertRoleTypeSchema>;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

export type WorkBlock = typeof workBlocks.$inferSelect;
export type InsertWorkBlock = z.infer<typeof insertWorkBlockSchema>;

export type DayPlan = typeof dayPlans.$inferSelect;
export type InsertDayPlan = z.infer<typeof insertDayPlanSchema>;
