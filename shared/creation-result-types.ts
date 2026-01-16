import { z } from 'zod';

export {
  ConfidenceLevel,
  UserMappingAction,
  TaskMappingStatus,
  TaskScope,
  ProjectRoleType,
  confidenceLevelSchema,
  userMappingActionSchema,
  taskMappingScopeSchema,
  taskMappingStatusSchema,
  projectRoleTypeSchema,
  userMappingEntrySchema,
  UserMappingEntry,
  epicTaskSchema,
  EpicTask,
  stageTaskSchema,
  StageTask,
  epicSchema,
  Epic,
  deliverableSchema,
  Deliverable,
  stageSchema,
  Stage,
  milestoneRuleSchema,
  MilestoneRule,
  milestoneSchema,
  Milestone,
  roleSchema,
  Role,
  sprintSchema,
  Sprint,
  projectDataSchema,
  ProjectData,
  importMetadataSchema,
  ImportMetadata,
  fullProjectCreatePayloadSchema,
  FullProjectCreatePayload,
  validateFullProjectPayload,
  validateUserMappings,
  FieldMapping,
  SystemUser,
  SystemUserIdentity
} from './import-types';

export type EntityType = 'project' | 'stage' | 'deliverable' | 'epic' | 'task' | 'milestone' | 'role' | 'sprint' | 'team_member';

export interface EntityResult {
  entityType: EntityType;
  id: string;
  name: string;
  success: boolean;
  error?: string;
  parentId?: string;
  importSource?: {
    confidence: 'high' | 'medium' | 'low' | 'unmapped';
    originalField?: string;
  };
}

export interface UnresolvedAssigneeWarning {
  taskId: string;
  taskTitle: string;
  originalAssigneeId: string;
  reason: 'not_found' | 'not_mapped' | 'skipped' | 'invalid';
  resolution: 'cleared' | 'kept_original';
}

export interface CreationReport {
  projectId: string | null;
  projectName: string;
  overallSuccess: boolean;
  startedAt: string;
  completedAt: string;
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
  entityResults: EntityResult[];
  breakdownByType: {
    [key in EntityType]?: {
      total: number;
      succeeded: number;
      failed: number;
    };
  };
  unresolvedAssignees?: UnresolvedAssigneeWarning[];
  fatalError?: string;
}

export const entityResultSchema = z.object({
  entityType: z.enum(['project', 'stage', 'deliverable', 'epic', 'task', 'milestone', 'role', 'sprint', 'team_member']),
  id: z.string(),
  name: z.string(),
  success: z.boolean(),
  error: z.string().optional(),
  parentId: z.string().optional(),
  importSource: z.object({
    confidence: z.enum(['high', 'medium', 'low', 'unmapped']),
    originalField: z.string().optional()
  }).optional()
});

export const unresolvedAssigneeWarningSchema = z.object({
  taskId: z.string(),
  taskTitle: z.string(),
  originalAssigneeId: z.string(),
  reason: z.enum(['not_found', 'not_mapped', 'skipped', 'invalid']),
  resolution: z.enum(['cleared', 'kept_original'])
});

export const creationReportSchema = z.object({
  projectId: z.string().nullable(),
  projectName: z.string(),
  overallSuccess: z.boolean(),
  startedAt: z.string(),
  completedAt: z.string(),
  summary: z.object({
    total: z.number(),
    succeeded: z.number(),
    failed: z.number()
  }),
  entityResults: z.array(entityResultSchema),
  breakdownByType: z.record(z.object({
    total: z.number(),
    succeeded: z.number(),
    failed: z.number()
  })),
  unresolvedAssignees: z.array(unresolvedAssigneeWarningSchema).optional(),
  fatalError: z.string().optional()
});

export type ValidatedCreationReport = z.infer<typeof creationReportSchema>;

export function validateCreationReport(data: unknown): {
  success: true;
  data: ValidatedCreationReport;
} | {
  success: false;
  errors: z.ZodError;
} {
  const result = creationReportSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}
