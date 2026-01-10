export type EntityType = 'project' | 'stage' | 'deliverable' | 'epic' | 'task' | 'milestone' | 'role';

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
    roleTypeId: string;
    userId?: string | null;
    rate?: number;
    allocation?: number;
  }>;
  importMetadata?: {
    source: string;
    importedAt: string;
    fieldMappings?: Record<string, { confidence: string }>;
  };
}
