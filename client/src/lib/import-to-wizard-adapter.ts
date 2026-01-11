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

export interface ImportedRole extends WizardRole {
  sourceId?: string;
  confidence: ConfidenceLevel;
  warnings: string[];
  sourceUserId?: string;
}

export interface UserMappingEntry {
  sourceId: string;
  sourceName?: string;
  sourceEmail?: string;
  mappedToId?: string;
  mappedToName?: string;
  confidence: ConfidenceLevel;
  action: 'map' | 'create' | 'skip' | 'unassigned';
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
  roles: ImportedRole[];
  userMappings: UserMappingEntry[];
  statusMappings: StatusMappingEntry[];
  warnings: string[];
  errors: string[];
  stats: {
    totalEntitiesFound: number;
    projectsFound: number;
    deliverablesFound: number;
    epicsFound: number;
    tasksFound: number;
    milestonesFound: number;
    usersFound: number;
    stagesFound: number;
  };
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
  deliverables: ImportedDeliverable[]
): ImportedTask[] {
  const taskEntity = entities.find(e => e.entityType === 'Tasks');
  if (!taskEntity) return [];
  
  const stageByName = new Map<string, ImportedStage>();
  const stageBySourceId = new Map<string, ImportedStage>();
  stages.forEach(s => {
    stageByName.set(s.name.toLowerCase(), s);
    if (s.sourceId) stageBySourceId.set(s.sourceId, s);
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

function extractUsers(
  entities: ParsedEntity[],
  systemUsers: SystemUser[] = [],
  userIdentities: SystemUserIdentity[] = []
): UserMappingEntry[] {
  const userEntity = entities.find(e => e.entityType === 'Users');
  const userRefs = new Map<string, { name?: string; email?: string; externalId?: string }>();
  
  entities.forEach(entity => {
    entity.rows.forEach(row => {
      if (row.assigneeId) {
        userRefs.set(row.assigneeId, {
          name: row.assigneeName || row.assignee,
          email: row.assigneeEmail,
          externalId: row.assigneeId
        });
      }
      if (row.ownerId) {
        userRefs.set(row.ownerId, {
          name: row.ownerName || row.owner,
          email: row.ownerEmail,
          externalId: row.ownerId
        });
      }
      if (row.managerId) {
        userRefs.set(row.managerId, {
          name: row.managerName || row.manager,
          email: row.managerEmail,
          externalId: row.managerId
        });
      }
      if (row.assignee && typeof row.assignee === 'string' && !row.assigneeId) {
        userRefs.set(row.assignee, { name: row.assignee });
      }
      if (Array.isArray(row.assigneeIds)) {
        row.assigneeIds.forEach((id: string) => {
          if (!userRefs.has(id)) {
            userRefs.set(id, { externalId: id });
          }
        });
      }
    });
  });
  
  if (userEntity) {
    userEntity.rows.forEach(row => {
      const id = row.id || row.email || row.name;
      if (id) {
        userRefs.set(id, {
          name: row.name || row.displayName || row.username,
          email: row.email,
          externalId: row.id
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
      action: match.userId ? 'map' : 'unassigned'
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
  
  const projectData = extractProjectData(parseResult.entities);
  let deliverables = extractDeliverables(parseResult.entities);
  deliverables = extractEpics(parseResult.entities, deliverables);
  const stages = extractStages(parseResult.entities);
  const tasks = extractTasks(parseResult.entities, stages, deliverables);
  const milestones = extractMilestones(parseResult.entities);
  const userMappings = extractUsers(parseResult.entities, systemUsers, userIdentities);
  const statusMappings = extractStatuses(parseResult.entities, systemStatuses);
  
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
  
  const stats = {
    totalEntitiesFound: parseResult.entities.reduce((sum, e) => sum + e.rowCount, 0),
    projectsFound: parseResult.entities.find(e => e.entityType === 'Projects')?.rowCount || 0,
    deliverablesFound: parseResult.entities.find(e => e.entityType === 'Deliverables')?.rowCount || 0,
    epicsFound: parseResult.entities.find(e => e.entityType === 'Epics')?.rowCount || 0,
    tasksFound: parseResult.entities.find(e => e.entityType === 'Tasks')?.rowCount || 0,
    milestonesFound: parseResult.entities.find(e => e.entityType === 'Milestones')?.rowCount || 0,
    usersFound: parseResult.entities.find(e => e.entityType === 'Users')?.rowCount || 0,
    stagesFound: parseResult.entities.find(e => e.entityType === 'ProjectStages' || e.entityType === 'Stages')?.rowCount || 0
  };
  
  return {
    projectData,
    deliverables,
    stages,
    milestones,
    roles: [],
    userMappings,
    statusMappings,
    warnings,
    errors,
    stats
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
        assigneeId
      };
    }),
    type: s.type || 'standard',
    startDate: s.startDate,
    endDate: s.endDate
  }));
}

export function toWizardMilestones(imported: ImportedMilestone[]): WizardMilestone[] {
  return imported.map(m => ({
    id: m.id,
    name: m.name,
    description: m.description,
    phase: m.phase,
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
