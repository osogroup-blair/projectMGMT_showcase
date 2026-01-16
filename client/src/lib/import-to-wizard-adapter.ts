import type { ParseResult, ParsedEntity } from './import-parser';
import type {
  ProjectData,
  WizardDeliverable,
  WizardEpic,
  WizardStage,
  WizardTaskDraft,
  WizardMilestone,
  WizardRole
} from '@/pages/project-new/types';
import {
  resolveAllReferences,
  type ReferenceMappingEntry,
  type ResolveAllReferencesResult
} from './import-reference-resolver';

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unmapped';

export interface FieldMapping<T = any> {
  value: T;
  confidence: ConfidenceLevel;
  sourceField?: string;
  sourceValue?: any;
  warning?: string;
}

export interface ImportedProjectData {
  name: FieldMapping<string>;
  description: FieldMapping<string>;
  startDate: FieldMapping<string>;
  dueDate: FieldMapping<string>;
  sprintDurationWeeks: FieldMapping<number>;
  ownerId: FieldMapping<string | undefined>;
  client: FieldMapping<string | undefined>;
}

export interface ImportedDeliverable extends WizardDeliverable {
  sourceId?: string;
  confidence: ConfidenceLevel;
  warnings: string[];
}

export interface ImportedEpic extends WizardEpic {
  sourceId?: string;
  confidence: ConfidenceLevel;
  warnings: string[];
  sourceDeliverableId?: string;
}

export interface ImportedStage extends WizardStage {
  sourceId?: string;
  confidence: ConfidenceLevel;
  warnings: string[];
  reconstructedFrom?: 'statuses' | 'explicit' | 'template';
}

export interface ImportedTask extends WizardTaskDraft {
  sourceId?: string;
  confidence: ConfidenceLevel;
  warnings: string[];
  sourceAssigneeId?: string;
  sourceStatus?: string;
  sourceEpicId?: string;
  sourceEpicTitle?: string;
}

export interface ImportedMilestone extends WizardMilestone {
  sourceId?: string;
  confidence: ConfidenceLevel;
  warnings: string[];
}

export interface ImportedSprint {
  id: string;
  name: string;
  goal?: string | null;
  startDate: string;
  endDate: string;
  status?: string;
  capacityHours?: number | null;
  sourceId?: string;
  confidence: ConfidenceLevel;
  warnings: string[];
}

export interface ImportedRole extends WizardRole {
  sourceId?: string;
  confidence: ConfidenceLevel;
  warnings: string[];
  sourceUserId?: string;
}

export type ProjectRoleType = 'none' | 'owner' | 'manager' | 'stakeholder' | 'member';

export interface UserMappingEntry {
  sourceId: string;
  sourceName?: string;
  sourceEmail?: string;
  mappedToId?: string;
  mappedToName?: string;
  confidence: ConfidenceLevel;
  action: 'map' | 'create' | 'skip' | 'unassigned';
  projectRoles?: ProjectRoleType[];
  suggestedExecutionRoleId?: string;
  suggestedExecutionRoleName?: string;
  suggestedExecutionRoleConfidence?: number;
  taskCount?: number;
}

export interface StatusMappingEntry {
  sourceStatus: string;
  mappedStatus: string;
  mappedStatusId?: string;
  confidence: ConfidenceLevel;
}

export interface SystemUser {
  id: string;
  name?: string;
  email?: string;
  username?: string;
}

export interface SystemUserIdentity {
  userId: string;
  externalSystem: string;
  externalUserId: string;
  externalDisplayName?: string;
  externalEmail?: string;
}

export interface SystemStatus {
  id: string;
  label: string;
  order?: number;
  isDefault?: boolean;
}

export interface ImportAdapterOptions {
  systemUsers?: SystemUser[];
  userIdentities?: SystemUserIdentity[];
  systemStatuses?: SystemStatus[];
}

export interface ImportAdapterResult {
  projectData: ImportedProjectData;
  deliverables: ImportedDeliverable[];
  stages: ImportedStage[];
  milestones: ImportedMilestone[];
  sprints: ImportedSprint[];
  roles: ImportedRole[];
  userMappings: UserMappingEntry[];
  statusMappings: StatusMappingEntry[];
  referenceMappings: ReferenceMappingEntry[];
  warnings: string[];
  errors: string[];
  stats: {
    totalEntitiesFound: number;
    projectsFound: number;
    deliverablesFound: number;
    epicsFound: number;
    tasksFound: number;
    milestonesFound: number;
    sprintsFound: number;
    usersFound: number;
    stagesFound: number;
  };
  referenceStats?: ResolveAllReferencesResult['stats'];
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}

function getFieldValue<T>(
  row: Record<string, any>,
  fieldNames: string[],
  defaultValue: T
): { value: T; sourceField?: string; sourceValue?: any } {
  for (const field of fieldNames) {
    if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
      return { value: row[field] as T, sourceField: field, sourceValue: row[field] };
    }
  }
  return { value: defaultValue };
}

function parseDate(value: any): string | null {
  if (!value) return null;
  
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }
  
  if (typeof value === 'number') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  return null;
}

function calculateConfidence(hasValue: boolean, fieldMatch: 'exact' | 'alias' | 'inferred'): ConfidenceLevel {
  if (!hasValue) return 'unmapped';
  if (fieldMatch === 'exact') return 'high';
  if (fieldMatch === 'alias') return 'medium';
  return 'low';
}

function normalizeStatus(status: string): string {
  const normalized = status.toLowerCase().trim();
  const mappings: Record<string, string> = {
    'backlog': 'Backlog',
    'todo': 'To Do',
    'to do': 'To Do',
    'to_do': 'To Do',
    'in progress': 'In Progress',
    'in_progress': 'In Progress',
    'inprogress': 'In Progress',
    'review': 'In Review',
    'in review': 'In Review',
    'in_review': 'In Review',
    'done': 'Done',
    'completed': 'Completed',
    'complete': 'Completed',
    'active': 'In Progress',
    'open': 'To Do',
    'closed': 'Done',
    'blocked': 'Blocked',
    'on hold': 'On Hold',
    'on_hold': 'On Hold'
  };
  return mappings[normalized] || status.charAt(0).toUpperCase() + status.slice(1);
}

export interface RoleType {
  id: string;
  label: string;
  description?: string;
}

interface TaskRolePattern {
  patterns: RegExp[];
  roleLabel: string;
  priority: number;
}

const TASK_ROLE_PATTERNS: TaskRolePattern[] = [
  { patterns: [/design/i, /wireframe/i, /mockup/i, /prototype/i, /ui\b/i, /ux\b/i, /visual/i, /layout/i], roleLabel: 'Designer', priority: 1 },
  { patterns: [/develop/i, /implement/i, /code/i, /build/i, /engineer/i, /program/i, /frontend/i, /backend/i, /api\b/i, /database/i], roleLabel: 'Developer', priority: 2 },
  { patterns: [/test/i, /qa\b/i, /quality/i, /verify/i, /validation/i, /bug/i, /regression/i], roleLabel: 'QA Engineer', priority: 3 },
  { patterns: [/document/i, /write/i, /content/i, /copy/i, /help text/i, /manual/i, /guide/i], roleLabel: 'Technical Writer', priority: 4 },
  { patterns: [/manage/i, /plan/i, /coordinate/i, /schedule/i, /organize/i, /lead/i], roleLabel: 'Project Manager', priority: 5 },
  { patterns: [/review/i, /approve/i, /sign.?off/i, /validate/i, /check/i], roleLabel: 'Reviewer', priority: 6 },
  { patterns: [/analyze/i, /research/i, /requirements/i, /gather/i, /define/i, /specify/i], roleLabel: 'Business Analyst', priority: 7 },
  { patterns: [/deploy/i, /release/i, /ops/i, /infrastructure/i, /server/i, /cloud/i, /ci.?cd/i], roleLabel: 'DevOps Engineer', priority: 8 },
];

export function suggestExecutionRole(
  taskTitles: string[],
  roleTypes: RoleType[]
): { roleId: string | undefined; roleName: string | undefined; confidence: number } {
  if (taskTitles.length === 0 || roleTypes.length === 0) {
    return { roleId: undefined, roleName: undefined, confidence: 0 };
  }
  
  const patternScores: Record<string, number> = {};
  
  for (const title of taskTitles) {
    for (const pattern of TASK_ROLE_PATTERNS) {
      for (const regex of pattern.patterns) {
        if (regex.test(title)) {
          patternScores[pattern.roleLabel] = (patternScores[pattern.roleLabel] || 0) + 1;
          break;
        }
      }
    }
  }
  
  let bestRole: string | undefined;
  let bestScore = 0;
  
  for (const [roleLabel, score] of Object.entries(patternScores)) {
    if (score > bestScore) {
      bestScore = score;
      bestRole = roleLabel;
    }
  }
  
  if (!bestRole) {
    return { roleId: undefined, roleName: undefined, confidence: 0 };
  }
  
  const matchedRoleType = roleTypes.find(rt => 
    rt.label.toLowerCase().includes(bestRole!.toLowerCase()) ||
    bestRole!.toLowerCase().includes(rt.label.toLowerCase())
  );
  
  const confidence = Math.min(bestScore / taskTitles.length, 1);
  
  return {
    roleId: matchedRoleType?.id,
    roleName: matchedRoleType?.label || bestRole,
    confidence
  };
}

function extractProjectData(
  entities: ParsedEntity[]
): ImportedProjectData {
  const projectEntity = entities.find(e => 
    e.entityType === 'Projects' || e.entityType.toLowerCase() === 'project'
  );
  
  const today = new Date().toISOString().split('T')[0];
  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + 84);
  
  if (!projectEntity || projectEntity.rows.length === 0) {
    return {
      name: { value: '', confidence: 'unmapped' },
      description: { value: '', confidence: 'unmapped' },
      startDate: { value: today, confidence: 'unmapped' },
      dueDate: { value: defaultDue.toISOString().split('T')[0], confidence: 'unmapped' },
      sprintDurationWeeks: { value: 2, confidence: 'unmapped' },
      ownerId: { value: undefined, confidence: 'unmapped' },
      client: { value: undefined, confidence: 'unmapped' }
    };
  }
  
  const row = projectEntity.rows[0];
  
  const nameField = getFieldValue<string>(row, ['name', 'title', 'projectName', 'project_name'], '');
  const descField = getFieldValue<string>(row, ['description', 'desc', 'summary', 'overview'], '');
  const startField = getFieldValue<string>(row, ['startDate', 'start_date', 'startAt', 'start'], today);
  const dueField = getFieldValue<string>(row, ['deadline', 'dueDate', 'due_date', 'endDate', 'end_date', 'end'], '');
  const ownerField = getFieldValue<string>(row, ['ownerId', 'owner_id', 'owner', 'managerId', 'manager'], '');
  const clientField = getFieldValue<string>(row, ['client', 'clientName', 'customer', 'account'], '');
  
  const parsedStart = parseDate(startField.value) || today;
  const parsedDue = parseDate(dueField.value) || defaultDue.toISOString().split('T')[0];
  
  return {
    name: {
      value: nameField.value,
      confidence: nameField.sourceField ? 'high' : 'unmapped',
      sourceField: nameField.sourceField,
      sourceValue: nameField.sourceValue
    },
    description: {
      value: descField.value,
      confidence: descField.sourceField ? 'high' : 'unmapped',
      sourceField: descField.sourceField,
      sourceValue: descField.sourceValue
    },
    startDate: {
      value: parsedStart,
      confidence: startField.sourceField ? 'high' : 'unmapped',
      sourceField: startField.sourceField,
      sourceValue: startField.sourceValue
    },
    dueDate: {
      value: parsedDue,
      confidence: dueField.sourceField ? 'high' : 'unmapped',
      sourceField: dueField.sourceField,
      sourceValue: dueField.sourceValue
    },
    sprintDurationWeeks: {
      value: row.sprintDuration || row.sprint_duration || 2,
      confidence: row.sprintDuration || row.sprint_duration ? 'high' : 'unmapped'
    },
    ownerId: {
      value: ownerField.value || undefined,
      confidence: ownerField.sourceField ? 'medium' : 'unmapped',
      sourceField: ownerField.sourceField,
      sourceValue: ownerField.sourceValue
    },
    client: {
      value: clientField.value || undefined,
      confidence: clientField.sourceField ? 'high' : 'unmapped',
      sourceField: clientField.sourceField,
      sourceValue: clientField.sourceValue
    }
  };
}

function extractDeliverables(entities: ParsedEntity[]): ImportedDeliverable[] {
  const deliverableEntity = entities.find(e => 
    e.entityType === 'Deliverables' || e.entityType.toLowerCase().includes('deliverable')
  );
  
  if (!deliverableEntity) return [];
  
  return deliverableEntity.rows.map((row, index) => {
    const titleField = getFieldValue<string>(row, ['title', 'name', 'deliverableName'], `Deliverable ${index + 1}`);
    const descField = getFieldValue<string>(row, ['description', 'desc', 'summary'], '');
    
    return {
      id: generateId('d'),
      title: titleField.value,
      description: descField.value,
      epics: [],
      sourceId: row.id || row.sourceId,
      confidence: titleField.sourceField ? 'high' : 'medium',
      warnings: []
    };
  });
}

function extractEpics(
  entities: ParsedEntity[],
  deliverables: ImportedDeliverable[]
): ImportedDeliverable[] {
  const epicEntity = entities.find(e => 
    e.entityType === 'Epics' || e.entityType.toLowerCase().includes('epic')
  );
  
  if (!epicEntity) return deliverables;
  
  const deliverableMap = new Map<string, ImportedDeliverable>();
  deliverables.forEach(d => {
    if (d.sourceId) deliverableMap.set(d.sourceId, d);
  });
  
  const orphanEpics: ImportedEpic[] = [];
  
  epicEntity.rows.forEach((row, index) => {
    const titleField = getFieldValue<string>(row, ['title', 'name', 'epicName'], `Epic ${index + 1}`);
    const descField = getFieldValue<string>(row, ['description', 'desc', 'summary'], '');
    const deliverableIdField = getFieldValue<string>(row, ['deliverableId', 'deliverable_id', 'parentId'], '');
    
    const epic: ImportedEpic = {
      id: generateId('e'),
      title: titleField.value,
      description: descField.value,
      sourceId: row.id || row.sourceId,
      sourceDeliverableId: deliverableIdField.value,
      confidence: titleField.sourceField ? 'high' : 'medium',
      warnings: []
    };
    
    const parentDeliverable = deliverableMap.get(deliverableIdField.value);
    if (parentDeliverable) {
      parentDeliverable.epics.push(epic);
    } else {
      orphanEpics.push(epic);
    }
  });
  
  if (orphanEpics.length > 0) {
    let defaultDeliverable = deliverables.find(d => d.title === 'Imported Work');
    if (!defaultDeliverable) {
      defaultDeliverable = {
        id: generateId('d'),
        title: 'Imported Work',
        description: 'Auto-created to hold epics without a deliverable',
        epics: [],
        confidence: 'low',
        warnings: ['Created automatically to group orphan epics']
      };
      deliverables.push(defaultDeliverable);
    }
    defaultDeliverable.epics.push(...orphanEpics);
  }
  
  return deliverables;
}

function extractStagesFromStatuses(entities: ParsedEntity[]): ImportedStage[] {
  const taskEntity = entities.find(e => e.entityType === 'Tasks');
  if (!taskEntity) return [];
  
  const statuses = new Set<string>();
  taskEntity.rows.forEach(row => {
    if (row.status) statuses.add(normalizeStatus(row.status));
  });
  
  if (statuses.size === 0) return [];
  
  const defaultOrder = ['Backlog', 'To Do', 'In Progress', 'In Review', 'Done', 'Completed'];
  const sortedStatuses = Array.from(statuses).sort((a, b) => {
    const aIdx = defaultOrder.indexOf(a);
    const bIdx = defaultOrder.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
  
  return sortedStatuses.map((status, index) => ({
    id: generateId('s'),
    name: status,
    description: `Reconstructed from task statuses`,
    taskCreationMode: 'none' as const,
    tasks: [],
    confidence: 'low' as ConfidenceLevel,
    warnings: ['Stage reconstructed from task status values'],
    reconstructedFrom: 'statuses' as const
  }));
}

function extractStages(entities: ParsedEntity[]): ImportedStage[] {
  const stageEntity = entities.find(e => 
    e.entityType === 'ProjectStages' || 
    e.entityType === 'Stages' ||
    e.entityType.toLowerCase().includes('stage')
  );
  
  if (stageEntity && stageEntity.rows.length > 0) {
    return stageEntity.rows.map((row, index) => {
      const nameField = getFieldValue<string>(row, ['name', 'title', 'stageName', 'stage_name'], `Stage ${index + 1}`);
      const descField = getFieldValue<string>(row, ['description', 'desc'], '');
      
      return {
        id: generateId('s'),
        name: nameField.value,
        description: descField.value,
        taskCreationMode: 'none' as const,
        tasks: [],
        type: row.type,
        sourceId: row.id || row.sourceId,
        confidence: 'high' as ConfidenceLevel,
        warnings: [],
        reconstructedFrom: 'explicit' as const,
        startDate: parseDate(row.startDate) || undefined,
        endDate: parseDate(row.endDate) || undefined
      };
    });
  }
  
  return extractStagesFromStatuses(entities);
}

function extractTasks(
  entities: ParsedEntity[],
  stages: ImportedStage[],
  deliverables: ImportedDeliverable[],
  sprints: ImportedSprint[]
): ImportedTask[] {
  const taskEntity = entities.find(e => e.entityType === 'Tasks');
  if (!taskEntity) return [];
  
  const stageByName = new Map<string, ImportedStage>();
  const stageBySourceId = new Map<string, ImportedStage>();
  stages.forEach(s => {
    stageByName.set(s.name.toLowerCase(), s);
    if (s.sourceId) stageBySourceId.set(s.sourceId, s);
  });
  
  // Build sprint lookup maps for task-sprint mapping
  const sprintBySourceId = new Map<string, ImportedSprint>();
  const sprintByName = new Map<string, ImportedSprint>();
  sprints.forEach(sp => {
    if (sp.sourceId) sprintBySourceId.set(sp.sourceId, sp);
    sprintByName.set(sp.name.toLowerCase(), sp);
  });
  
  const epicBySourceId = new Map<string, { id: string; title: string }>();
  const epicByNormalizedTitle = new Map<string, { id: string; title: string }>();
  const allEpics: { id: string; title: string; normalizedTitle: string }[] = [];
  
  deliverables.forEach(d => {
    d.epics.forEach(e => {
      const imported = e as ImportedEpic;
      const normalizedTitle = e.title.toLowerCase().trim().replace(/\s+/g, ' ');
      
      if (imported.sourceId) {
        epicBySourceId.set(imported.sourceId, { id: e.id, title: e.title });
      }
      epicByNormalizedTitle.set(normalizedTitle, { id: e.id, title: e.title });
      allEpics.push({ id: e.id, title: e.title, normalizedTitle });
    });
  });
  
  function fuzzyMatchEpic(searchTitle: string): { id: string; title: string } | undefined {
    const normalized = searchTitle.toLowerCase().trim().replace(/\s+/g, ' ');
    if (epicByNormalizedTitle.has(normalized)) {
      return epicByNormalizedTitle.get(normalized);
    }
    for (const epic of allEpics) {
      if (epic.normalizedTitle.includes(normalized) || normalized.includes(epic.normalizedTitle)) {
        return { id: epic.id, title: epic.title };
      }
    }
    return undefined;
  }
  
  return taskEntity.rows.map((row, index) => {
    const titleField = getFieldValue<string>(row, ['title', 'name', 'taskName', 'summary'], `Task ${index + 1}`);
    const descField = getFieldValue<string>(row, ['description', 'desc', 'details'], '');
    const priorityField = getFieldValue<string>(row, ['priority', 'importance', 'urgency'], 'medium');
    const estimateField = getFieldValue<number>(row, ['estimateHours', 'estimate_hours', 'estimate', 'hours'], 0);
    const deadlineField = getFieldValue<string>(row, ['deadline', 'dueDate', 'due_date', 'endDate', 'end_date'], '');
    const startDateField = getFieldValue<string>(row, ['startDate', 'start_date', 'startAt', 'start'], '');
    
    let matchedStage = stages[0];
    const warnings: string[] = [];
    
    if (row.stageId) {
      const stageMatch = stageBySourceId.get(row.stageId);
      if (stageMatch) matchedStage = stageMatch;
      else warnings.push(`Stage ID "${row.stageId}" not found`);
    } else if (row.status) {
      const normalizedStatus = normalizeStatus(row.status);
      const stageMatch = stageByName.get(normalizedStatus.toLowerCase());
      if (stageMatch) matchedStage = stageMatch;
    }
    
    const sourceEpicId = row.epicId || row.epic_id || row.parentEpicId;
    const sourceEpicName = row.epicName || row.epic_name || row.epicTitle || row.epic_title;
    let sourceEpicTitle: string | undefined = sourceEpicName;
    let assignedEpicId: string | undefined;
    let assignedEpicTitle: string | undefined;
    let mappingStatus: 'mapped' | 'orphaned' = 'orphaned';
    
    if (sourceEpicId) {
      const epicMatch = epicBySourceId.get(sourceEpicId);
      if (epicMatch) {
        assignedEpicId = epicMatch.id;
        assignedEpicTitle = epicMatch.title;
        sourceEpicTitle = sourceEpicTitle || epicMatch.title;
        mappingStatus = 'mapped';
      } else {
        warnings.push(`Epic ID "${sourceEpicId}" not found - attempting title match`);
      }
    }
    
    if (!assignedEpicId && sourceEpicName) {
      const fuzzyMatch = fuzzyMatchEpic(sourceEpicName);
      if (fuzzyMatch) {
        assignedEpicId = fuzzyMatch.id;
        assignedEpicTitle = fuzzyMatch.title;
        mappingStatus = 'mapped';
      } else {
        warnings.push(`Epic "${sourceEpicName}" not found - task needs manual assignment`);
      }
    }
    
    // Map sprint ID from import
    const sourceSprintId = row.sprintId || row.sprint_id || row.sprintName;
    let sprintId: string | undefined;
    
    if (sourceSprintId) {
      // First try to match by source ID
      const sprintMatch = sprintBySourceId.get(sourceSprintId);
      if (sprintMatch) {
        sprintId = sprintMatch.id;
      } else {
        // Try to match by sprint name (case-insensitive)
        const normalizedSprintName = String(sourceSprintId).toLowerCase();
        const sprintByNameMatch = sprintByName.get(normalizedSprintName);
        if (sprintByNameMatch) {
          sprintId = sprintByNameMatch.id;
        } else {
          warnings.push(`Sprint "${sourceSprintId}" not found - task sprint assignment skipped`);
        }
      }
    }
    
    return {
      id: generateId('t'),
      title: titleField.value,
      description: descField.value,
      priority: priorityField.value,
      estimateHours: Number(estimateField.value) || 0,
      scope: 'once' as const,
      stageId: matchedStage?.id || '',
      order: index,
      sourceId: row.id || row.sourceId,
      sourceAssigneeId: row.assigneeId || row.assignee,
      sourceStatus: row.status,
      sourceEpicId,
      sourceEpicTitle,
      assignedEpicId,
      assignedEpicTitle,
      mappingStatus,
      startDate: parseDate(startDateField.value) || undefined,
      deadline: parseDate(deadlineField.value) || undefined,
      sprintId,
      sourceSprintId,
      confidence: titleField.sourceField ? 'high' : 'medium',
      warnings
    };
  });
}

function extractMilestones(entities: ParsedEntity[]): ImportedMilestone[] {
  const milestoneEntity = entities.find(e => 
    e.entityType === 'Milestones' || e.entityType.toLowerCase().includes('milestone')
  );
  
  if (!milestoneEntity) return [];
  
  return milestoneEntity.rows.map((row, index) => {
    const nameField = getFieldValue<string>(row, ['name', 'title', 'milestoneName'], `Milestone ${index + 1}`);
    const descField = getFieldValue<string>(row, ['description', 'desc'], '');
    const dateField = getFieldValue<string>(row, ['targetDate', 'target_date', 'dueDate', 'date'], '');
    const phaseField = getFieldValue<string>(row, ['phase', 'stage'], 'General');
    
    return {
      id: generateId('m'),
      name: nameField.value,
      description: descField.value,
      phase: phaseField.value,
      targetDate: parseDate(dateField.value) || new Date().toISOString().split('T')[0],
      ownerId: '',
      isBillingGate: row.isBillingGate || row.billing_gate || false,
      rule: {
        scopeType: 'all' as const,
        completionMode: 'all_tasks' as const,
        completionTargetPercent: 100
      },
      sourceId: row.id || row.sourceId,
      confidence: nameField.sourceField ? 'high' : 'medium',
      warnings: []
    };
  });
}

type SprintStatus = 'Planned' | 'Active' | 'Completed' | 'Cancelled';

const SPRINT_STATUS_MAPPING: Record<string, SprintStatus> = {
  'planned': 'Planned',
  'plan': 'Planned',
  'not started': 'Planned',
  'notstarted': 'Planned',
  'upcoming': 'Planned',
  'pending': 'Planned',
  'future': 'Planned',
  'backlog': 'Planned',
  
  'active': 'Active',
  'in progress': 'Active',
  'inprogress': 'Active',
  'in-progress': 'Active',
  'current': 'Active',
  'running': 'Active',
  'started': 'Active',
  'open': 'Active',
  
  'completed': 'Completed',
  'complete': 'Completed',
  'done': 'Completed',
  'finished': 'Completed',
  'closed': 'Completed',
  'ended': 'Completed',
  
  'cancelled': 'Cancelled',
  'canceled': 'Cancelled',
  'abandoned': 'Cancelled',
  'aborted': 'Cancelled'
};

function normalizeSprintStatus(rawStatus: string | null | undefined): { status: SprintStatus; normalized: boolean } {
  if (!rawStatus) {
    return { status: 'Planned', normalized: false };
  }
  
  const cleanStatus = rawStatus.toString().toLowerCase().trim();
  const mappedStatus = SPRINT_STATUS_MAPPING[cleanStatus];
  
  if (mappedStatus) {
    return { status: mappedStatus, normalized: cleanStatus !== mappedStatus.toLowerCase() };
  }
  
  // Try partial matching for common patterns
  if (cleanStatus.includes('progress') || cleanStatus.includes('active') || cleanStatus.includes('current')) {
    return { status: 'Active', normalized: true };
  }
  if (cleanStatus.includes('complet') || cleanStatus.includes('done') || cleanStatus.includes('finish')) {
    return { status: 'Completed', normalized: true };
  }
  if (cleanStatus.includes('cancel') || cleanStatus.includes('abort')) {
    return { status: 'Cancelled', normalized: true };
  }
  
  // Default to Planned for unknown statuses
  return { status: 'Planned', normalized: true };
}

function validateSprintDates(sprints: ImportedSprint[]): ImportedSprint[] {
  if (sprints.length === 0) return sprints;
  
  // Sort sprints by start date for overlap detection
  const sortedSprints = [...sprints].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
  
  const validatedSprints = sortedSprints.map((sprint, index) => {
    const warnings = [...(sprint.warnings || [])];
    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    
    // Check for invalid date range (end before start)
    if (endDate < startDate) {
      warnings.push(`Invalid date range: end date (${sprint.endDate}) is before start date (${sprint.startDate})`);
    }
    
    // Check for very long sprints (> 6 weeks)
    const durationDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (durationDays > 42) {
      warnings.push(`Sprint duration is ${durationDays} days (${Math.round(durationDays / 7)} weeks) - unusually long`);
    }
    
    // Check for overlap with next sprint
    if (index < sortedSprints.length - 1) {
      const nextSprint = sortedSprints[index + 1];
      const nextStartDate = new Date(nextSprint.startDate);
      
      if (endDate > nextStartDate) {
        warnings.push(`Overlaps with sprint "${nextSprint.name}" (${nextSprint.startDate})`);
      }
    }
    
    return {
      ...sprint,
      warnings
    };
  });
  
  return validatedSprints;
}

function extractSprints(entities: ParsedEntity[]): ImportedSprint[] {
  const sprintsEntity = entities.find(e => e.entityType === 'Sprints');
  if (!sprintsEntity || sprintsEntity.rows.length === 0) return [];
  
  const sprints: ImportedSprint[] = [];
  
  for (const row of sprintsEntity.rows) {
    const sprintName = getFieldValue(row, ['name', 'sprintName', 'title'], `Sprint ${sprints.length + 1}`);
    const sprintGoal = getFieldValue(row, ['goal', 'description', 'objective'], null);
    const sprintStartDate = getFieldValue(row, ['startDate', 'start_date', 'start'], null);
    const sprintEndDate = getFieldValue(row, ['endDate', 'end_date', 'end', 'dueDate'], null);
    const sprintStatusRaw = getFieldValue(row, ['status', 'state'], null);
    const sprintCapacity = getFieldValue(row, ['capacityHours', 'capacity', 'capacity_hours'], null);
    
    const parsedStartDate = parseDate(sprintStartDate.value);
    const parsedEndDate = parseDate(sprintEndDate.value);
    
    if (parsedStartDate && parsedEndDate) {
      const warnings: string[] = [];
      const { status: normalizedStatus, normalized } = normalizeSprintStatus(sprintStatusRaw.value);
      
      if (normalized && sprintStatusRaw.value) {
        warnings.push(`Status normalized from "${sprintStatusRaw.value}" to "${normalizedStatus}"`);
      }
      
      sprints.push({
        id: generateId('sprint'),
        name: sprintName.value,
        goal: sprintGoal.value,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        status: normalizedStatus,
        capacityHours: typeof sprintCapacity.value === 'number' ? sprintCapacity.value : null,
        sourceId: row.id || row.sprintId,
        confidence: calculateConfidence(!!sprintName.sourceField, sprintName.sourceField ? 'exact' : 'inferred'),
        warnings
      });
    }
  }
  
  // Validate sprint dates and detect overlaps
  return validateSprintDates(sprints);
}

function normalizeString(s: string | undefined | null): string {
  if (!s) return '';
  return s.toLowerCase().trim().replace(/\s+/g, ' ');
}

function matchUserByNameOrEmail(
  sourceName: string | undefined,
  sourceEmail: string | undefined,
  sourceExternalId: string | undefined,
  systemUsers: SystemUser[],
  userIdentities: SystemUserIdentity[]
): { userId?: string; userName?: string; confidence: ConfidenceLevel } {
  const normalizedName = normalizeString(sourceName);
  const normalizedEmail = normalizeString(sourceEmail);
  const normalizedExternalId = sourceExternalId?.trim();
  
  if (normalizedExternalId) {
    const identityMatch = userIdentities.find(
      i => i.externalUserId === normalizedExternalId
    );
    if (identityMatch) {
      const user = systemUsers.find(u => u.id === identityMatch.userId);
      return { userId: identityMatch.userId, userName: user?.name, confidence: 'high' };
    }
  }
  
  if (normalizedEmail) {
    const emailMatch = systemUsers.find(
      u => normalizeString(u.email) === normalizedEmail
    );
    if (emailMatch) {
      return { userId: emailMatch.id, userName: emailMatch.name, confidence: 'high' };
    }
    
    const identityEmailMatch = userIdentities.find(
      i => normalizeString(i.externalEmail) === normalizedEmail
    );
    if (identityEmailMatch) {
      const user = systemUsers.find(u => u.id === identityEmailMatch.userId);
      return { userId: identityEmailMatch.userId, userName: user?.name, confidence: 'high' };
    }
  }
  
  if (normalizedName) {
    const exactNameMatch = systemUsers.find(
      u => normalizeString(u.name) === normalizedName
    );
    if (exactNameMatch) {
      return { userId: exactNameMatch.id, userName: exactNameMatch.name, confidence: 'high' };
    }
    
    const identityNameMatch = userIdentities.find(
      i => normalizeString(i.externalDisplayName) === normalizedName
    );
    if (identityNameMatch) {
      const user = systemUsers.find(u => u.id === identityNameMatch.userId);
      return { userId: identityNameMatch.userId, userName: user?.name, confidence: 'high' };
    }
    
    const fuzzyNameMatch = systemUsers.find(u => {
      const userName = normalizeString(u.name);
      if (!userName || !normalizedName) return false;
      return userName.includes(normalizedName) || normalizedName.includes(userName);
    });
    if (fuzzyNameMatch) {
      return { userId: fuzzyNameMatch.id, userName: fuzzyNameMatch.name, confidence: 'medium' };
    }
    
    const usernameMatch = systemUsers.find(
      u => normalizeString(u.username) === normalizedName
    );
    if (usernameMatch) {
      return { userId: usernameMatch.id, userName: usernameMatch.name, confidence: 'medium' };
    }
  }
  
  return { confidence: 'low' };
}

function splitMultipleAssignees(assigneeString: string): string[] {
  if (!assigneeString || typeof assigneeString !== 'string') return [];
  
  let parts = assigneeString
    .split(/[,;]/)
    .map(s => s.trim())
    .filter(Boolean);
  
  const finalParts: string[] = [];
  for (const part of parts) {
    const andSplit = part.split(/\s+and\s+/i);
    if (andSplit.length > 1) {
      finalParts.push(...andSplit.map(s => s.trim()).filter(Boolean));
    } else {
      finalParts.push(part);
    }
  }
  
  return finalParts;
}

function extractUsers(
  entities: ParsedEntity[],
  systemUsers: SystemUser[] = [],
  userIdentities: SystemUserIdentity[] = []
): UserMappingEntry[] {
  const userEntity = entities.find(e => e.entityType === 'Users');
  const userRefs = new Map<string, { name?: string; email?: string; externalId?: string; taskCount: number }>();
  
  const addUserRef = (
    key: string, 
    info: { name?: string; email?: string; externalId?: string }, 
    incrementTaskCount: boolean
  ) => {
    const normalizedKey = key.trim();
    if (!normalizedKey) return;
    
    const existing = userRefs.get(normalizedKey);
    userRefs.set(normalizedKey, {
      name: existing?.name || info.name,
      email: existing?.email || info.email,
      externalId: existing?.externalId || info.externalId,
      taskCount: (existing?.taskCount || 0) + (incrementTaskCount ? 1 : 0)
    });
  };
  
  const extractUserFromRow = (row: any, isTask: boolean = false) => {
    if (row.assigneeId) {
      const assigneeIdStr = String(row.assigneeId);
      const individuals = splitMultipleAssignees(assigneeIdStr);
      
      if (individuals.length > 1) {
        individuals.forEach((individual, idx) => {
          const isPrimaryOwner = idx === individuals.length - 1;
          addUserRef(individual, {
            name: individual,
            externalId: individual
          }, isTask && isPrimaryOwner);
        });
        
        row.multipleAssignees = individuals;
        row.primaryAssignee = individuals[individuals.length - 1];
      } else {
        addUserRef(row.assigneeId, {
          name: row.assigneeName || row.assignee,
          email: row.assigneeEmail,
          externalId: row.assigneeId
        }, isTask);
      }
    }
    
    if (row.assignee && typeof row.assignee === 'string' && !row.assigneeId) {
      const individuals = splitMultipleAssignees(row.assignee);
      
      if (individuals.length > 1) {
        individuals.forEach((individual, idx) => {
          const isPrimaryOwner = idx === individuals.length - 1;
          addUserRef(individual, { name: individual }, isTask && isPrimaryOwner);
        });
        
        row.multipleAssignees = individuals;
        row.primaryAssignee = individuals[individuals.length - 1];
      } else if (individuals.length === 1) {
        addUserRef(individuals[0], { name: individuals[0] }, isTask);
      }
    }
    
    if (row.ownerId) {
      const individuals = splitMultipleAssignees(String(row.ownerId));
      individuals.forEach((individual, idx) => {
        const isPrimary = idx === individuals.length - 1;
        addUserRef(individual, {
          name: isPrimary ? (row.ownerName || row.owner || individual) : individual,
          email: isPrimary ? row.ownerEmail : undefined,
          externalId: individual
        }, false);
      });
    }
    
    if (row.managerId) {
      const individuals = splitMultipleAssignees(String(row.managerId));
      individuals.forEach((individual, idx) => {
        const isPrimary = idx === individuals.length - 1;
        addUserRef(individual, {
          name: isPrimary ? (row.managerName || row.manager || individual) : individual,
          email: isPrimary ? row.managerEmail : undefined,
          externalId: individual
        }, false);
      });
    }
    
    if (Array.isArray(row.assigneeIds)) {
      row.assigneeIds.forEach((id: string, idx: number) => {
        const isPrimaryOwner = idx === row.assigneeIds.length - 1;
        addUserRef(id, { externalId: id }, isTask && isPrimaryOwner);
      });
    }
  };
  
  entities.forEach(entity => {
    const isTaskEntity = entity.entityType === 'Tasks' || 
                         entity.entityType.toLowerCase() === 'tasks';
    
    entity.rows.forEach(row => {
      extractUserFromRow(row, isTaskEntity);
      
      if (Array.isArray(row.tasks)) {
        row.tasks.forEach((task: any) => extractUserFromRow(task, true));
      }
      if (Array.isArray(row.epics)) {
        row.epics.forEach((epic: any) => {
          extractUserFromRow(epic, false);
          if (Array.isArray(epic.tasks)) {
            epic.tasks.forEach((task: any) => extractUserFromRow(task, true));
          }
        });
      }
    });
  });
  
  if (userEntity) {
    userEntity.rows.forEach(row => {
      const id = row.id || row.email || row.name;
      if (id) {
        const existing = userRefs.get(id);
        userRefs.set(id, {
          name: row.name || row.displayName || row.username,
          email: row.email,
          externalId: row.id,
          taskCount: existing?.taskCount || 0
        });
      }
    });
  }
  
  const mappings: UserMappingEntry[] = [];
  
  userRefs.forEach((info, sourceId) => {
    const match = matchUserByNameOrEmail(
      info.name,
      info.email,
      info.externalId,
      systemUsers,
      userIdentities
    );
    
    mappings.push({
      sourceId,
      sourceName: info.name,
      sourceEmail: info.email,
      mappedToId: match.userId,
      mappedToName: match.userName,
      confidence: match.confidence,
      action: match.userId ? 'map' : 'unassigned',
      taskCount: info.taskCount || 0
    });
  });
  
  return mappings;
}

function matchStatusToSystemStatus(
  sourceStatus: string,
  systemStatuses: SystemStatus[]
): { mappedStatus: string; mappedStatusId?: string; confidence: ConfidenceLevel } {
  const normalized = normalizeString(sourceStatus);
  
  const exactMatch = systemStatuses.find(
    s => normalizeString(s.label) === normalized
  );
  if (exactMatch) {
    return { mappedStatus: exactMatch.label, mappedStatusId: exactMatch.id, confidence: 'high' };
  }
  
  const partialMatch = systemStatuses.find(s => {
    const statusLabel = normalizeString(s.label);
    return statusLabel.includes(normalized) || normalized.includes(statusLabel);
  });
  if (partialMatch) {
    return { mappedStatus: partialMatch.label, mappedStatusId: partialMatch.id, confidence: 'medium' };
  }
  
  const statusCategories: Record<string, string[]> = {
    'not_started': ['todo', 'to do', 'to_do', 'backlog', 'pending', 'open', 'new', 'not started'],
    'in_progress': ['in progress', 'in_progress', 'inprogress', 'active', 'working', 'doing', 'started'],
    'review': ['review', 'in review', 'in_review', 'testing', 'qa', 'approval', 'pending review'],
    'blocked': ['blocked', 'on hold', 'on_hold', 'waiting', 'paused', 'stalled'],
    'done': ['done', 'completed', 'complete', 'finished', 'closed', 'resolved', 'approved']
  };
  
  let category: string | undefined;
  for (const [cat, patterns] of Object.entries(statusCategories)) {
    if (patterns.some(p => normalized === p || normalized.includes(p) || p.includes(normalized))) {
      category = cat;
      break;
    }
  }
  
  if (category) {
    const categoryMatch = systemStatuses.find(s => {
      const sNorm = normalizeString(s.label);
      const patterns = statusCategories[category!];
      return patterns.some(p => sNorm === p || sNorm.includes(p) || p.includes(sNorm));
    });
    if (categoryMatch) {
      return { mappedStatus: categoryMatch.label, mappedStatusId: categoryMatch.id, confidence: 'medium' };
    }
  }
  
  const defaultStatus = systemStatuses.find(s => s.isDefault);
  if (defaultStatus) {
    return { mappedStatus: defaultStatus.label, mappedStatusId: defaultStatus.id, confidence: 'low' };
  }
  
  if (systemStatuses.length > 0) {
    const first = systemStatuses[0];
    return { mappedStatus: first.label, mappedStatusId: first.id, confidence: 'low' };
  }
  
  return { mappedStatus: normalizeStatus(sourceStatus), confidence: 'low' };
}

function extractStatuses(
  entities: ParsedEntity[],
  systemStatuses: SystemStatus[] = []
): StatusMappingEntry[] {
  const statuses = new Set<string>();
  
  entities.forEach(entity => {
    entity.rows.forEach(row => {
      if (row.status) statuses.add(String(row.status));
    });
  });
  
  return Array.from(statuses).map(status => {
    if (systemStatuses.length > 0) {
      const match = matchStatusToSystemStatus(status, systemStatuses);
      return {
        sourceStatus: status,
        mappedStatus: match.mappedStatus,
        mappedStatusId: match.mappedStatusId,
        confidence: match.confidence
      };
    }
    return {
      sourceStatus: status,
      mappedStatus: normalizeStatus(status),
      confidence: normalizeStatus(status) !== status ? 'high' as const : 'medium' as const
    };
  });
}

export function convertImportToWizardData(
  parseResult: ParseResult,
  options: ImportAdapterOptions = {}
): ImportAdapterResult {
  const { systemUsers = [], userIdentities = [], systemStatuses = [] } = options;
  
  const warnings: string[] = [...parseResult.warnings];
  const errors: string[] = [...parseResult.errors];
  
  // First, resolve all name-based references to IDs
  const referenceResolution = resolveAllReferences(
    parseResult.entities.map(e => ({ entityType: e.entityType, rows: e.rows }))
  );
  
  // Add reference resolution warnings
  warnings.push(...referenceResolution.warnings);
  
  // Use resolved entities for further processing
  const resolvedParseResult: ParseResult = {
    ...parseResult,
    entities: referenceResolution.resolvedEntities.map((e, i) => ({
      ...parseResult.entities[i],
      rows: e.rows
    }))
  };
  
  const projectData = extractProjectData(resolvedParseResult.entities);
  let deliverables = extractDeliverables(resolvedParseResult.entities);
  deliverables = extractEpics(resolvedParseResult.entities, deliverables);
  const stages = extractStages(resolvedParseResult.entities);
  
  // Extract sprints BEFORE tasks so we can map task-sprint associations
  const sprints = extractSprints(resolvedParseResult.entities);
  
  const tasks = extractTasks(resolvedParseResult.entities, stages, deliverables, sprints);
  const milestones = extractMilestones(resolvedParseResult.entities);
  const userMappings = extractUsers(resolvedParseResult.entities, systemUsers, userIdentities);
  const statusMappings = extractStatuses(resolvedParseResult.entities, systemStatuses);
  
  tasks.forEach(task => {
    const stage = stages.find(s => s.id === task.stageId);
    if (stage) {
      stage.tasks.push(task);
    }
  });
  
  if (deliverables.length === 0) {
    deliverables.push({
      id: generateId('d'),
      title: '',
      description: '',
      epics: [{
        id: generateId('e'),
        title: '',
        description: ''
      }],
      confidence: 'unmapped',
      warnings: []
    });
    warnings.push('No deliverables found in import - created empty placeholder');
  }
  
  if (stages.some(s => s.reconstructedFrom === 'statuses')) {
    warnings.push('Stages were reconstructed from task status values');
  }
  
  // Add reference resolution stats summary to warnings if there are unresolved references
  if (referenceResolution.stats.unresolved > 0) {
    warnings.push(
      `Reference resolution: ${referenceResolution.stats.unresolved} unresolved references. ` +
      `(${referenceResolution.stats.resolvedByIdMatch} by ID, ` +
      `${referenceResolution.stats.resolvedByExactName} by exact name, ` +
      `${referenceResolution.stats.resolvedByPartialName + referenceResolution.stats.resolvedByFuzzyName} by fuzzy match)`
    );
  }
  
  // Check for skipped sprints (those with missing dates)
  const sprintsEntity = resolvedParseResult.entities.find(e => e.entityType === 'Sprints');
  if (sprintsEntity) {
    const totalSprintRows = sprintsEntity.rows.length;
    const extractedCount = sprints.length;
    if (extractedCount < totalSprintRows) {
      warnings.push(`${totalSprintRows - extractedCount} sprint(s) skipped: missing start or end date`);
    }
  }
  
  const stats = {
    totalEntitiesFound: parseResult.entities.reduce((sum, e) => sum + e.rowCount, 0),
    projectsFound: parseResult.entities.find(e => e.entityType === 'Projects')?.rowCount || 0,
    deliverablesFound: parseResult.entities.find(e => e.entityType === 'Deliverables')?.rowCount || 0,
    epicsFound: parseResult.entities.find(e => e.entityType === 'Epics')?.rowCount || 0,
    tasksFound: parseResult.entities.find(e => e.entityType === 'Tasks')?.rowCount || 0,
    milestonesFound: parseResult.entities.find(e => e.entityType === 'Milestones')?.rowCount || 0,
    sprintsFound: sprints.length,
    usersFound: parseResult.entities.find(e => e.entityType === 'Users')?.rowCount || 0,
    stagesFound: parseResult.entities.find(e => e.entityType === 'ProjectStages' || e.entityType === 'Stages')?.rowCount || 0
  };
  
  return {
    projectData,
    deliverables,
    stages,
    milestones,
    sprints,
    roles: [],
    userMappings,
    statusMappings,
    referenceMappings: referenceResolution.referenceMappings,
    warnings,
    errors,
    stats,
    referenceStats: referenceResolution.stats
  };
}

export function toWizardProjectData(imported: ImportedProjectData): ProjectData {
  return {
    name: imported.name.value,
    description: imported.description.value,
    startDate: imported.startDate.value,
    dueDate: imported.dueDate.value,
    sprintDurationWeeks: imported.sprintDurationWeeks.value,
    ownerId: imported.ownerId.value,
    client: imported.client.value
  };
}

export function toWizardDeliverables(imported: ImportedDeliverable[]): WizardDeliverable[] {
  return imported.map(d => ({
    id: d.id,
    title: d.title,
    description: d.description,
    epics: d.epics.map(e => ({
      id: e.id,
      title: e.title,
      description: e.description
    }))
  }));
}

export function toWizardStages(
  imported: ImportedStage[],
  userMappings: UserMappingEntry[] = [],
  defaultUnassignedTo?: string | null
): WizardStage[] {
  const userMappingLookup = new Map<string, string>();
  userMappings.forEach(m => {
    if (m.mappedToId && m.action === 'map') {
      userMappingLookup.set(m.sourceId, m.mappedToId);
    }
  });
  
  return imported.map(s => ({
    id: s.id,
    name: s.name,
    description: s.description,
    taskCreationMode: s.taskCreationMode || 'per_epic',
    defaultTasks: s.defaultTasks || [],
    defaultRoles: s.defaultRoles || [],
    tasks: (s.tasks || []).map(t => {
      const importedTask = t as ImportedTask;
      let assigneeId: string | undefined = undefined;
      
      if (importedTask.sourceAssigneeId) {
        assigneeId = userMappingLookup.get(importedTask.sourceAssigneeId);
      }
      
      if (!assigneeId && defaultUnassignedTo) {
        assigneeId = defaultUnassignedTo;
      }
      
      return {
        id: t.id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        estimateHours: t.estimateHours,
        scope: t.scope,
        stageId: t.stageId,
        order: t.order,
        sourceEpicId: importedTask.sourceEpicId,
        sourceEpicTitle: importedTask.sourceEpicTitle,
        assignedEpicId: importedTask.assignedEpicId,
        assignedEpicTitle: importedTask.assignedEpicTitle,
        mappingStatus: importedTask.mappingStatus,
        assigneeId,
        isFromImport: true,
        sourceAssigneeId: importedTask.sourceAssigneeId
      };
    }),
    type: s.type || 'standard',
    startDate: s.startDate,
    endDate: s.endDate,
    isFromImport: true
  }));
}

export function toWizardMilestones(imported: ImportedMilestone[]): WizardMilestone[] {
  return imported.map(m => ({
    id: m.id,
    name: m.name,
    description: m.description,
    targetDate: m.targetDate,
    ownerId: m.ownerId,
    isBillingGate: m.isBillingGate,
    rule: m.rule
  }));
}

export function toWizardRoles(imported: ImportedRole[]): WizardRole[] {
  return imported.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    roleType: r.roleType,
    templateId: r.templateId,
    isCore: r.isCore,
    assigneeId: r.assigneeId
  }));
}

export function toWizardSprints(imported: ImportedSprint[]): Array<{
  id: string;
  name: string;
  goal?: string | null;
  startDate: string;
  endDate: string;
  status?: string;
  capacityHours?: number | null;
}> {
  return imported.map(s => ({
    id: s.id,
    name: s.name,
    goal: s.goal,
    startDate: s.startDate,
    endDate: s.endDate,
    status: s.status,
    capacityHours: s.capacityHours
  }));
}
