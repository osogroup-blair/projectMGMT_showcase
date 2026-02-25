import { z } from 'zod';

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unmapped';
export type UserMappingAction = 'map' | 'create' | 'skip' | 'unassigned';
export type TaskMappingStatus = 'mapped' | 'orphaned' | 'manual' | 'skipped';
export type TaskScope = 'once' | 'per_epic';
export type ProjectRoleType = 'none' | 'owner' | 'manager' | 'stakeholder' | 'member';

export const confidenceLevelSchema = z.enum(['high', 'medium', 'low', 'unmapped']);
export const userMappingActionSchema = z.enum(['map', 'create', 'skip', 'unassigned']);
export const taskMappingScopeSchema = z.enum(['once', 'per_epic']);
export const taskMappingStatusSchema = z.enum(['mapped', 'orphaned', 'manual', 'skipped']);
export const projectRoleTypeSchema = z.enum(['none', 'owner', 'manager', 'stakeholder', 'member']);

export const userMappingEntrySchema = z.object({
  sourceId: z.string().min(1, 'Source user ID is required'),
  sourceName: z.string().optional(),
  sourceEmail: z.string().optional(),
  mappedToId: z.string().optional(),
  mappedToName: z.string().optional(),
  confidence: confidenceLevelSchema,
  action: userMappingActionSchema,
  taskCount: z.number().optional(),
  projectRole: projectRoleTypeSchema.optional(),
  projectRoles: z.array(projectRoleTypeSchema).optional()
});

export type UserMappingEntry = z.infer<typeof userMappingEntrySchema>;

export const epicTaskSchema = z.object({
  id: z.string().min(1, 'Task ID is required'),
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  priority: z.string().optional(),
  estimateHours: z.number().optional(),
  deadline: z.string().optional(),
  status: z.string().optional(),
  milestoneId: z.string().optional(),
  sprintId: z.string().optional(),
  assigneeId: z.string().optional(),
  taskTypeId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  stageId: z.string().optional(),
  externalId: z.string().optional()
});

export type EpicTask = z.infer<typeof epicTaskSchema>;

export const stageTaskSchema = z.object({
  id: z.string().min(1, 'Task ID is required'),
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  priority: z.string().optional(),
  estimateHours: z.number().optional(),
  scope: taskMappingScopeSchema,
  order: z.number(),
  deadline: z.string().optional(),
  status: z.string().optional(),
  milestoneId: z.string().optional(),
  sprintId: z.string().optional(),
  assigneeId: z.string().optional(),
  taskTypeId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  assignedEpicId: z.string().optional(),
  mappingStatus: taskMappingStatusSchema.optional(),
  stageId: z.string().optional(),
  sourceAssigneeId: z.string().optional(),
  sourceSprintId: z.string().optional(),
  isFromImport: z.boolean().optional()
});

export type StageTask = z.infer<typeof stageTaskSchema>;

export const epicSchema = z.object({
  id: z.string().min(1, 'Epic ID is required'),
  title: z.string().min(1, 'Epic title is required'),
  description: z.string().optional(),
  tasks: z.array(epicTaskSchema).default([]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  epicTypeId: z.string().optional()
});

export type Epic = z.infer<typeof epicSchema>;

export const deliverableSchema = z.object({
  id: z.string().min(1, 'Deliverable ID is required'),
  title: z.string().min(1, 'Deliverable title is required'),
  description: z.string().optional(),
  epics: z.array(epicSchema).default([]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  deliverableTypeId: z.string().optional(),
  isPassThrough: z.boolean().optional()
});

export type Deliverable = z.infer<typeof deliverableSchema>;

export const stageSchema = z.object({
  id: z.string().min(1, 'Stage ID is required'),
  name: z.string().min(1, 'Stage name is required'),
  description: z.string().optional(),
  order: z.number(),
  type: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  tasks: z.array(stageTaskSchema).default([]),
  taskCreationMode: z.enum(['none', 'once', 'per_epic']).optional(),
  isFromImport: z.boolean().optional()
});

export type Stage = z.infer<typeof stageSchema>;

export const milestoneRuleSchema = z.object({
  scopeType: z.string(),
  completionMode: z.string(),
  completionTargetPercent: z.number().optional(),
  scopeEntityId: z.string().optional()
});

export type MilestoneRule = z.infer<typeof milestoneRuleSchema>;

export const milestoneSchema = z.object({
  id: z.string().min(1, 'Milestone ID is required'),
  name: z.string().min(1, 'Milestone name is required'),
  description: z.string().optional(),
  targetDate: z.string().min(1, 'Milestone target date is required'),
  phase: z.string().optional(),
  ownerId: z.string().optional(),
  isBillingGate: z.boolean().optional(),
  rule: milestoneRuleSchema.optional(),
  isFromImport: z.boolean().optional()
});

export type Milestone = z.infer<typeof milestoneSchema>;

export const roleSchema = z.object({
  id: z.string().min(1, 'Role ID is required'),
  roleType: z.string().min(1, 'Role type is required'),
  roleTypeId: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  allocation: z.number().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  templateId: z.string().optional(),
  isCore: z.boolean().optional(),
  assigneeId: z.string().nullable().optional()
});

export type Role = z.infer<typeof roleSchema>;

export const sprintSchema = z.object({
  id: z.string().min(1, 'Sprint ID is required'),
  name: z.string().min(1, 'Sprint name is required'),
  goal: z.string().nullable().optional(),
  startDate: z.string().min(1, 'Sprint start date is required'),
  endDate: z.string().min(1, 'Sprint end date is required'),
  status: z.string().optional(),
  capacityHours: z.number().nullable().optional()
});

export type Sprint = z.infer<typeof sprintSchema>;

export const projectDataSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().default(''),
  status: z.string().default('Upcoming'),
  startDate: z.string().min(1, 'Project start date is required'),
  deadline: z.string().min(1, 'Project deadline is required'),
  frameworkId: z.string().nullable().optional(),
  sprintDurationWeeks: z.number().nullable().optional(),
  ownerId: z.string().nullable().optional(),
  clientId: z.string().nullable().optional(),
  riskLevel: z.string().nullable().optional()
});

export type ProjectData = z.infer<typeof projectDataSchema>;

export const importMetadataSchema = z.object({
  source: z.string(),
  importedAt: z.string(),
  fieldMappings: z.record(z.object({ confidence: z.string() })).optional()
});

export type ImportMetadata = z.infer<typeof importMetadataSchema>;

export const fullProjectCreatePayloadSchema = z.object({
  project: projectDataSchema,
  stages: z.array(stageSchema).default([]),
  deliverables: z.array(deliverableSchema).default([]),
  milestones: z.array(milestoneSchema).default([]),
  roles: z.array(roleSchema).default([]),
  sprints: z.array(sprintSchema).optional(),
  userMappings: z.array(userMappingEntrySchema).optional(),
  importMetadata: importMetadataSchema.optional()
});

export type FullProjectCreatePayload = z.infer<typeof fullProjectCreatePayloadSchema>;

export function validateFullProjectPayload(data: unknown): {
  success: true;
  data: FullProjectCreatePayload
} | {
  success: false;
  errors: z.ZodError
} {
  const result = fullProjectCreatePayloadSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

export function validateUserMappings(data: unknown): {
  success: true;
  data: UserMappingEntry[];
} | {
  success: false;
  errors: z.ZodError;
} {
  const schema = z.array(userMappingEntrySchema);
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

export interface FieldMapping<T = any> {
  value: T;
  confidence: ConfidenceLevel;
  source?: string;
  sourceField?: string;
  originalField?: string;
  sourceValue?: any;
  warning?: string;
}

export interface SystemUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
  username?: string;
}

export interface SystemUserIdentity {
  id?: string;
  userId: string;
  systemId?: string;
  externalSystem?: string;
  externalUserId: string;
  externalEmail?: string;
  externalDisplayName?: string;
}

export type TaskValidationErrorType =
  | 'no_epic_reference'
  | 'epic_id_not_found'
  | 'epic_name_not_found'
  | 'epic_fuzzy_match_failed'
  | 'unknown';

export interface TaskValidationResult {
  taskId: string;
  taskTitle: string;
  sourceId?: string;
  status: 'assigned' | 'orphaned';
  assignedEpicId?: string;
  assignedEpicTitle?: string;
  sourceEpicId?: string;
  sourceEpicTitle?: string;
  errorType?: TaskValidationErrorType;
  errorMessage?: string;
  warnings: string[];
  stageId?: string;
  stageName?: string;
}

export interface TaskValidationSummary {
  totalTasks: number;
  assignedTasks: number;
  orphanedTasks: number;
  errorsByType: Record<TaskValidationErrorType, number>;
  results: TaskValidationResult[];
}

export type SprintValidationErrorType =
  | 'no_sprint_reference'
  | 'sprint_id_not_found'
  | 'sprint_name_not_found'
  | 'unknown';

export interface SprintValidationResult {
  taskId: string;
  taskTitle: string;
  sourceId?: string;
  status: 'assigned' | 'unassigned' | 'invalid';
  assignedSprintId?: string;
  assignedSprintName?: string;
  sourceSprintId?: string;
  sourceSprintName?: string;
  errorType?: SprintValidationErrorType;
  errorMessage?: string;
  warnings: string[];
}

export interface SprintValidationSummary {
  totalTasks: number;
  assignedToSprint: number;
  noSprintAssignment: number;
  invalidSprintReference: number;
  errorsByType: Record<SprintValidationErrorType, number>;
  results: SprintValidationResult[];
  sprints: Array<{
    id: string;
    name: string;
    taskCount: number;
    startDate?: string;
    endDate?: string;
    dateSource?: 'imported' | 'parsed_from_name' | 'calculated';
  }>;
}
