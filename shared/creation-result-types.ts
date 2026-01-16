import { z } from 'zod';

export type EntityType = 'project' | 'stage' | 'deliverable' | 'epic' | 'task' | 'milestone' | 'role' | 'sprint' | 'team_member';

// Zod validation schema for FullProjectCreatePayload
export const stageTaskSchema = z.object({
  id: z.string().min(1, 'Task ID is required'),
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  priority: z.string().optional(),
  estimateHours: z.number().optional(),
  scope: z.enum(['once', 'per_epic']),
  order: z.number(),
  // Extended task fields for import
  deadline: z.string().optional(),
  status: z.string().optional(),
  milestoneId: z.string().optional(),
  sprintId: z.string().optional(),
  assigneeId: z.string().optional(),
  taskTypeId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  assignedEpicId: z.string().optional(),
  mappingStatus: z.enum(['mapped', 'orphaned']).optional()
});

export const stageSchema = z.object({
  id: z.string().min(1, 'Stage ID is required'),
  name: z.string().min(1, 'Stage name is required'),
  description: z.string().optional(),
  order: z.number(),
  type: z.string(),
  endDate: z.string().optional(),
  tasks: z.array(stageTaskSchema).default([])
});

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
  stageId: z.string().optional()
});

export const epicSchema = z.object({
  id: z.string().min(1, 'Epic ID is required'),
  title: z.string().min(1, 'Epic title is required'),
  description: z.string().optional(),
  tasks: z.array(epicTaskSchema).default([])
});

export const deliverableSchema = z.object({
  id: z.string().min(1, 'Deliverable ID is required'),
  title: z.string().min(1, 'Deliverable title is required'),
  description: z.string().optional(),
  epics: z.array(epicSchema).default([])
});

export const milestoneRuleSchema = z.object({
  scopeType: z.string(),
  completionMode: z.string(),
  completionTargetPercent: z.number().optional(),
  scopeEntityId: z.string().optional()
});

export const milestoneSchema = z.object({
  id: z.string().min(1, 'Milestone ID is required'),
  name: z.string().min(1, 'Milestone name is required'),
  description: z.string().optional(),
  targetDate: z.string().min(1, 'Milestone target date is required'),
  phase: z.string().optional(),
  ownerId: z.string().optional(),
  isBillingGate: z.boolean().optional(),
  rule: milestoneRuleSchema.optional()
});

export const roleSchema = z.object({
  id: z.string().min(1, 'Role ID is required'),
  roleType: z.string().min(1, 'Role type is required'),
  roleTypeId: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  allocation: z.number().optional()
});

export const sprintSchema = z.object({
  id: z.string().min(1, 'Sprint ID is required'),
  name: z.string().min(1, 'Sprint name is required'),
  goal: z.string().nullable().optional(),
  startDate: z.string().min(1, 'Sprint start date is required'),
  endDate: z.string().min(1, 'Sprint end date is required'),
  status: z.string().optional(),
  capacityHours: z.number().nullable().optional()
});

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().default(''),
  status: z.string().default('Upcoming'),
  startDate: z.string().min(1, 'Project start date is required'),
  deadline: z.string().min(1, 'Project deadline is required'),
  frameworkId: z.string().nullable().optional(),
  sprintDurationWeeks: z.number().nullable().optional(),
  ownerId: z.string().nullable().optional(),
  client: z.string().nullable().optional(),
  riskLevel: z.string().nullable().optional()
});

export const importMetadataSchema = z.object({
  source: z.string(),
  importedAt: z.string(),
  fieldMappings: z.record(z.object({ confidence: z.string() })).optional()
});

export const fullProjectCreatePayloadSchema = z.object({
  project: projectSchema,
  stages: z.array(stageSchema).default([]),
  deliverables: z.array(deliverableSchema).default([]),
  milestones: z.array(milestoneSchema).default([]),
  roles: z.array(roleSchema).default([]),
  sprints: z.array(sprintSchema).optional(),
  importMetadata: importMetadataSchema.optional()
});

export type ValidatedFullProjectCreatePayload = z.infer<typeof fullProjectCreatePayloadSchema>;

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
  fatalError?: string;
}

export interface FullProjectCreatePayload {
  project: {
    name: string;
    description: string;
    status: string;
    startDate: string;
    deadline: string;
    frameworkId?: string | null;
    sprintDurationWeeks?: number | null;
    ownerId?: string | null;
    client?: string | null;
    riskLevel?: string | null;
  };
  stages: Array<{
    id: string;
    name: string;
    description?: string;
    order: number;
    type: string;
    tasks: Array<{
      id: string;
      title: string;
      description?: string;
      priority?: string;
      estimateHours?: number;
      scope: 'once' | 'per_epic';
      order: number;
    }>;
  }>;
  deliverables: Array<{
    id: string;
    title: string;
    description?: string;
    epics: Array<{
      id: string;
      title: string;
      description?: string;
    }>;
  }>;
  milestones: Array<{
    id: string;
    name: string;
    description?: string;
    targetDate: string;
    phase?: string;
    ownerId?: string;
    isBillingGate?: boolean;
    rule?: {
      scopeType: string;
      completionMode: string;
      completionTargetPercent?: number;
      scopeEntityId?: string;
    };
  }>;
  roles: Array<{
    id: string;
    roleType: string;
    roleTypeId?: string | null;
    userId?: string | null;
    allocation?: number;
  }>;
  sprints?: Array<{
    id: string;
    name: string;
    goal?: string | null;
    startDate: string;
    endDate: string;
    status?: string;
    capacityHours?: number | null;
  }>;
  importMetadata?: {
    source: string;
    importedAt: string;
    fieldMappings?: Record<string, { confidence: string }>;
  };
}
