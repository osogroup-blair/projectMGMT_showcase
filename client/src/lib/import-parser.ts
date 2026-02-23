import * as XLSX from 'xlsx';
import YAML from 'js-yaml';

export type FileFormat = 'json' | 'excel' | 'csv' | 'yaml' | 'unknown';

export interface ParsedColumn {
  name: string;
  sampleValues: string[];
  detectedType: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
}

export interface ParsedEntity {
  entityType: string;
  columns: ParsedColumn[];
  rows: Record<string, any>[];
  rowCount: number;
}

export interface ParseResult {
  format: FileFormat;
  fileName: string;
  entities: ParsedEntity[];
  rawData: any;
  errors: string[];
  warnings: string[];
}

export interface ProdCoSchema {
  Projects: string[];
  ProjectStages: string[];
  Deliverables: string[];
  Epics: string[];
  Tasks: string[];
  Milestones: string[];
  Users: string[];
  Sprints: string[];
}

export const PRODCO_SCHEMA: ProdCoSchema = {
  Projects: ['id', 'name', 'description', 'status', 'startDate', 'deadline', 'progress', 'client', 'ownerId', 'frameworkId', 'riskLevel', 'externalRefs'],
  ProjectStages: ['id', 'projectId', 'name', 'type', 'order', 'description', 'status', 'startDate', 'endDate'],
  Deliverables: ['id', 'projectId', 'title', 'description', 'status', 'ownerId', 'dueDate', 'startDate', 'progress', 'externalRefs'],
  Epics: ['id', 'deliverableId', 'title', 'description', 'status', 'ownerId', 'startDate', 'endDate', 'progress', 'stageIds', 'externalRefs'],
  Tasks: ['id', 'projectId', 'epicId', 'title', 'description', 'status', 'stageId', 'assigneeId', 'priority', 'deadline', 'tags', 'estimateHours', 'effort', 'blocked', 'blockerReason', 'sprintId', 'milestoneId', 'project', 'externalRefs'],
  Milestones: ['id', 'projectId', 'name', 'description', 'targetDate', 'status', 'ownerId', 'scopeType', 'completionMode'],
  Users: ['id', 'name', 'email', 'role', 'status', 'avatar'],
  Sprints: ['id', 'projectId', 'name', 'startDate', 'endDate', 'status', 'goal', 'capacity']
};

export const REQUIRED_FIELDS: Record<string, string[]> = {
  Projects: ['name'],
  ProjectStages: ['projectId', 'name'],
  Deliverables: ['projectId', 'title'],
  Epics: ['deliverableId', 'title'],
  Tasks: ['title'],
  Milestones: ['projectId', 'name'],
  Users: ['name', 'email'],
  Sprints: ['projectId', 'name', 'startDate', 'endDate']
};

export const FIELD_ALIASES: Record<string, string> = {
  name: 'title',
  dueDate: 'deadline',
  endDate: 'deadline',
  assignee: 'assigneeId',
  owner: 'ownerId'
};

export function detectFileFormat(file: File): FileFormat {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeType = file.type.toLowerCase();

  if (extension === 'json' || mimeType === 'application/json') return 'json';
  if (extension === 'xlsx' || extension === 'xls' || mimeType.includes('spreadsheet')) return 'excel';
  if (extension === 'csv' || mimeType === 'text/csv') return 'csv';
  if (extension === 'yaml' || extension === 'yml') return 'yaml';

  return 'unknown';
}

function detectColumnType(values: any[]): ParsedColumn['detectedType'] {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNullValues.length === 0) return 'string';

  const sample = nonNullValues.slice(0, 10);

  if (sample.every(v => Array.isArray(v))) return 'array';
  if (sample.every(v => typeof v === 'object' && v !== null)) return 'object';
  if (sample.every(v => typeof v === 'boolean' || v === 'true' || v === 'false')) return 'boolean';
  if (sample.every(v => !isNaN(Number(v)) && v !== '')) return 'number';
  if (sample.every(v => !isNaN(Date.parse(String(v))))) return 'date';

  return 'string';
}

function extractColumns(rows: Record<string, any>[]): ParsedColumn[] {
  if (rows.length === 0) return [];

  const allKeys = new Set<string>();
  rows.forEach(row => Object.keys(row).forEach(key => allKeys.add(key)));

  return Array.from(allKeys).map(key => {
    const values = rows.map(row => row[key]);
    return {
      name: key,
      sampleValues: values.slice(0, 3).map(v =>
        typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')
      ),
      detectedType: detectColumnType(values)
    };
  });
}

interface FlattenedNexusData {
  projects: Record<string, any>[];
  deliverables: Record<string, any>[];
  epics: Record<string, any>[];
  tasks: Record<string, any>[];
  stages: Record<string, any>[];
  milestones: Record<string, any>[];
  sprints: Record<string, any>[];
  comments: Record<string, any>[];
}

function isNestedNexusFormat(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.projects) || data.projects.length === 0) return false;

  const firstProject = data.projects[0];
  return (
    Array.isArray(firstProject.deliverables) &&
    firstProject.deliverables.length > 0 &&
    Array.isArray(firstProject.deliverables[0]?.epics)
  );
}

function flattenNexusExport(data: any): FlattenedNexusData {
  const result: FlattenedNexusData = {
    projects: [],
    deliverables: [],
    epics: [],
    tasks: [],
    stages: [],
    milestones: [],
    sprints: [],
    comments: []
  };

  if (!data.projects || !Array.isArray(data.projects)) {
    return result;
  }

  for (const project of data.projects) {
    const { deliverables, stages, milestones, sprints, ...projectData } = project;
    result.projects.push(projectData);

    if (Array.isArray(stages)) {
      result.stages.push(...stages);
    }

    if (Array.isArray(milestones)) {
      result.milestones.push(...milestones);
    }

    if (Array.isArray(sprints)) {
      result.sprints.push(...sprints);
    }

    if (Array.isArray(deliverables)) {
      for (const deliverable of deliverables) {
        const { epics, ...deliverableData } = deliverable;
        result.deliverables.push(deliverableData);

        if (Array.isArray(epics)) {
          for (const epic of epics) {
            const { tasks, ...epicData } = epic;
            result.epics.push(epicData);

            if (Array.isArray(tasks)) {
              for (const task of tasks) {
                const { comments, ...taskData } = task;
                result.tasks.push(taskData);

                if (Array.isArray(comments)) {
                  result.comments.push(...comments);
                }
              }
            }
          }
        }
      }
    }
  }

  return result;
}

async function parseJSON(content: string): Promise<ParseResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const entities: ParsedEntity[] = [];

  try {
    const data = JSON.parse(content);

    if (isNestedNexusFormat(data)) {
      warnings.push('Detected nested Nexus export format - flattening hierarchical structure');
      const flattened = flattenNexusExport(data);

      const entityTypes: Array<{ key: keyof FlattenedNexusData; type: string }> = [
        { key: 'projects', type: 'Projects' },
        { key: 'deliverables', type: 'Deliverables' },
        { key: 'epics', type: 'Epics' },
        { key: 'tasks', type: 'Tasks' },
        { key: 'stages', type: 'ProjectStages' },
        { key: 'milestones', type: 'Milestones' },
        { key: 'sprints', type: 'Sprints' },
        { key: 'comments', type: 'Comments' }
      ];

      for (const { key, type } of entityTypes) {
        const rows = flattened[key];
        if (rows.length > 0) {
          entities.push({
            entityType: type,
            columns: extractColumns(rows),
            rows,
            rowCount: rows.length
          });
        }
      }

      return { format: 'json', fileName: '', entities, rawData: data, errors, warnings };
    }

    if (Array.isArray(data)) {
      entities.push({
        entityType: 'Unknown',
        columns: extractColumns(data),
        rows: data,
        rowCount: data.length
      });
    } else if (typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
          const suggestedType = suggestEntityType(key, value);
          entities.push({
            entityType: suggestedType,
            columns: extractColumns(value as Record<string, any>[]),
            rows: value as Record<string, any>[],
            rowCount: (value as any[]).length
          });
        } else if (typeof value === 'object' && value !== null) {
          entities.push({
            entityType: key,
            columns: extractColumns([value as Record<string, any>]),
            rows: [value as Record<string, any>],
            rowCount: 1
          });
        }
      }
    }

    return { format: 'json', fileName: '', entities, rawData: data, errors, warnings };
  } catch (e) {
    errors.push(`JSON parse error: ${e instanceof Error ? e.message : String(e)}`);
    return { format: 'json', fileName: '', entities: [], rawData: null, errors, warnings };
  }
}

async function parseExcel(buffer: ArrayBuffer): Promise<ParseResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const entities: ParsedEntity[] = [];

  try {
    const workbook = XLSX.read(buffer, { type: 'array' });

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

      if (rows.length > 0) {
        const suggestedType = suggestEntityType(sheetName, rows);
        entities.push({
          entityType: suggestedType,
          columns: extractColumns(rows),
          rows,
          rowCount: rows.length
        });
      }
    }

    return { format: 'excel', fileName: '', entities, rawData: workbook, errors, warnings };
  } catch (e) {
    errors.push(`Excel parse error: ${e instanceof Error ? e.message : String(e)}`);
    return { format: 'excel', fileName: '', entities: [], rawData: null, errors, warnings };
  }
}

async function parseCSV(content: string): Promise<ParseResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const workbook = XLSX.read(content, { type: 'string' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

    const entities: ParsedEntity[] = [{
      entityType: 'Unknown',
      columns: extractColumns(rows),
      rows,
      rowCount: rows.length
    }];

    return { format: 'csv', fileName: '', entities, rawData: rows, errors, warnings };
  } catch (e) {
    errors.push(`CSV parse error: ${e instanceof Error ? e.message : String(e)}`);
    return { format: 'csv', fileName: '', entities: [], rawData: null, errors, warnings };
  }
}

async function parseYAML(content: string): Promise<ParseResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const entities: ParsedEntity[] = [];

  try {
    const data = YAML.load(content) as any;

    if (Array.isArray(data)) {
      entities.push({
        entityType: 'Unknown',
        columns: extractColumns(data),
        rows: data,
        rowCount: data.length
      });
    } else if (typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
          const suggestedType = suggestEntityType(key, value);
          entities.push({
            entityType: suggestedType,
            columns: extractColumns(value as Record<string, any>[]),
            rows: value as Record<string, any>[],
            rowCount: (value as any[]).length
          });
        }
      }
    }

    return { format: 'yaml', fileName: '', entities, rawData: data, errors, warnings };
  } catch (e) {
    errors.push(`YAML parse error: ${e instanceof Error ? e.message : String(e)}`);
    return { format: 'yaml', fileName: '', entities: [], rawData: null, errors, warnings };
  }
}

function suggestEntityType(key: string, rows: any[]): string {
  const normalizedKey = key.toLowerCase().replace(/[_\-\s]/g, '');

  const mappings: Record<string, string> = {
    'projects': 'Projects',
    'project': 'Projects',
    'projectstages': 'ProjectStages',
    'stages': 'ProjectStages',
    'deliverables': 'Deliverables',
    'deliverable': 'Deliverables',
    'epics': 'Epics',
    'epic': 'Epics',
    'tasks': 'Tasks',
    'task': 'Tasks',
    'milestones': 'Milestones',
    'milestone': 'Milestones',
    'users': 'Users',
    'user': 'Users',
    'members': 'Users',
    'sprints': 'Sprints',
    'sprint': 'Sprints'
  };

  if (mappings[normalizedKey]) return mappings[normalizedKey];

  if (rows.length > 0) {
    const sample = rows[0];
    if (sample.title && sample.status && sample.priority) return 'Tasks';
    if (sample.name && sample.projectId && sample.type) return 'ProjectStages';
    if (sample.name && sample.projectId && sample.targetDate) return 'Milestones';
    if (sample.deliverableId) return 'Epics';
    if (sample.epicId || sample.stageId) return 'Tasks';
    if (sample.email) return 'Users';
    if (sample.startDate && sample.endDate && sample.goal) return 'Sprints';
    if (sample.projectId && sample.name && !sample.deliverableId) return 'Deliverables';
    if (sample.name && sample.status && sample.deadline) return 'Projects';
  }

  return key;
}

export async function parseFile(file: File): Promise<ParseResult> {
  const format = detectFileFormat(file);

  if (file.size === 0) {
    return {
      format,
      fileName: file.name,
      entities: [],
      rawData: null,
      errors: ['The file is empty. Please upload a file with data to import.'],
      warnings: []
    };
  }

  let result: ParseResult;

  switch (format) {
    case 'json': {
      const content = await file.text();
      if (content.trim() === '' || content.trim() === '{}' || content.trim() === '[]') {
        result = {
          format: 'json',
          fileName: file.name,
          entities: [],
          rawData: null,
          errors: ['The JSON file is empty or contains no data. Please provide a file with project data.'],
          warnings: []
        };
      } else {
        result = await parseJSON(content);
      }
      break;
    }
    case 'excel': {
      const buffer = await file.arrayBuffer();
      result = await parseExcel(buffer);
      if (result.entities.length === 0 && result.errors.length === 0) {
        result.errors.push('The Excel file contains no data sheets or all sheets are empty.');
      }
      break;
    }
    case 'csv': {
      const content = await file.text();
      if (content.trim() === '') {
        result = {
          format: 'csv',
          fileName: file.name,
          entities: [],
          rawData: null,
          errors: ['The CSV file is empty. Please provide a file with data rows.'],
          warnings: []
        };
      } else {
        result = await parseCSV(content);
        if (result.entities.length > 0 && result.entities[0].rowCount === 0) {
          result.errors.push('The CSV file contains only headers but no data rows.');
        }
      }
      break;
    }
    case 'yaml': {
      const content = await file.text();
      if (content.trim() === '') {
        result = {
          format: 'yaml',
          fileName: file.name,
          entities: [],
          rawData: null,
          errors: ['The YAML file is empty. Please provide a file with project data.'],
          warnings: []
        };
      } else {
        result = await parseYAML(content);
      }
      break;
    }
    default:
      result = {
        format: 'unknown',
        fileName: file.name,
        entities: [],
        rawData: null,
        errors: [`Unsupported file format: ${file.name}. Supported formats: JSON, Excel (.xlsx), CSV, YAML.`],
        warnings: []
      };
  }

  result.fileName = file.name;
  result.format = format;

  return result;
}

export interface ExternalRef {
  source: string;
  sourceId: string;
  url?: string;
  importedAt: string;
  metadata?: Record<string, any>;
}

export function extractExternalRefs(row: Record<string, any>): ExternalRef[] {
  const refs: ExternalRef[] = [];

  if (row.external && typeof row.external === 'object') {
    refs.push({
      source: row.external.source || 'unknown',
      sourceId: row.external.sourceId || row.external.taskId || row.external.listId || row.id || '',
      url: row.external.url,
      importedAt: new Date().toISOString(),
      metadata: row.external
    });
  }

  return refs;
}

export function normalizeStatus(status: string): string {
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
    'on_hold': 'On Hold',
    'cancelled': 'Cancelled',
    'canceled': 'Cancelled'
  };

  return mappings[normalized] || status.charAt(0).toUpperCase() + status.slice(1);
}

export function extractUniqueUserIds(entities: ParsedEntity[]): string[] {
  const userIds = new Set<string>();

  entities.forEach(entity => {
    entity.rows.forEach(row => {
      if (row.assigneeId) userIds.add(row.assigneeId);
      if (row.ownerId) userIds.add(row.ownerId);
      if (Array.isArray(row.assigneeIds)) {
        row.assigneeIds.forEach((id: string) => userIds.add(id));
      }
    });
  });

  return Array.from(userIds);
}

export function extractUniqueStatuses(entities: ParsedEntity[]): string[] {
  const statuses = new Set<string>();

  entities.forEach(entity => {
    entity.rows.forEach(row => {
      if (row.status) statuses.add(String(row.status));
    });
  });

  return Array.from(statuses);
}

export interface TransformationResult {
  entities: Record<string, Record<string, any>[]>;
  userMappings: Record<string, string>;
  statusMappings: Record<string, string>;
  warnings: string[];
  createdEpics: Record<string, any>[];
}

function applyFieldAliases(row: Record<string, any>, entityType: string): Record<string, any> {
  const transformed = { ...row };

  if (entityType === 'Deliverables' || entityType === 'Epics') {
    if (row.name && !row.title) {
      transformed.title = row.name;
      delete transformed.name;
    }
  }

  if (row.dueDate && !row.deadline) {
    transformed.deadline = row.dueDate;
  }

  if (row.endDate && !row.deadline && entityType === 'Tasks') {
    transformed.deadline = row.endDate;
  }

  if (row.assignee && !row.assigneeId) {
    transformed.assigneeId = row.assignee;
    delete transformed.assignee;
  }

  if (row.owner && !row.ownerId) {
    transformed.ownerId = row.owner;
    delete transformed.owner;
  }

  return transformed;
}

export function transformForImport(
  parsedEntities: ParsedEntity[],
  userMappings: Record<string, string>,
  statusMappings: Record<string, string>,
  entityMappings?: Record<string, string>,
  projectId?: string
): TransformationResult {
  const result: TransformationResult = {
    entities: {},
    userMappings,
    statusMappings,
    warnings: [],
    createdEpics: []
  };

  const deliverableToEpic: Record<string, string> = {};

  parsedEntities.forEach(entity => {
    const targetEntityType = entityMappings?.[entity.entityType] || entity.entityType;

    if (targetEntityType === 'skip') {
      return;
    }

    const transformedRows = entity.rows.map(row => {
      const aliased = applyFieldAliases(row, targetEntityType);
      const transformed = { ...aliased };

      if (row.id) {
        transformed.sourceId = row.id;
      }

      if (row.status) {
        transformed.status = statusMappings[row.status] || normalizeStatus(row.status);
      }

      if (row.assigneeIds && Array.isArray(row.assigneeIds)) {
        const firstAssignee = row.assigneeIds[0];
        transformed.assigneeId = userMappings[firstAssignee] || null;
        if (row.assigneeIds.length > 1) {
          result.warnings.push(`Task "${row.title}" has ${row.assigneeIds.length} assignees, only first will be used`);
        }
      } else if (row.assigneeId) {
        transformed.assigneeId = userMappings[row.assigneeId] || row.assigneeId;
      }

      if (row.ownerId) {
        transformed.ownerId = userMappings[row.ownerId] || row.ownerId;
      }

      const externalRefs = extractExternalRefs(row);
      if (externalRefs.length > 0) {
        transformed.externalRefs = externalRefs;
      }
      delete transformed.external;

      if (targetEntityType === 'Tasks' && row.deliverableId && !row.epicId) {
        if (!deliverableToEpic[row.deliverableId]) {
          const epicId = `auto_epic_${row.deliverableId}`;
          deliverableToEpic[row.deliverableId] = epicId;
          result.createdEpics.push({
            id: epicId,
            deliverableId: row.deliverableId,
            name: 'Default Epic',
            title: 'Default Epic',
            description: 'Auto-created during import',
            status: 'In Progress',
            progress: 0
          });
        }
        transformed.epicId = deliverableToEpic[row.deliverableId];
        delete transformed.deliverableId;
      }

      if (projectId && !transformed.projectId) {
        transformed.projectId = projectId;
      }

      return transformed;
    });

    if (!result.entities[targetEntityType]) {
      result.entities[targetEntityType] = [];
    }
    result.entities[targetEntityType].push(...transformedRows);
  });

  if (result.createdEpics.length > 0) {
    result.entities['Epics'] = [
      ...(result.entities['Epics'] || []),
      ...result.createdEpics
    ];
  }

  return result;
}

export function validateForImport(
  entities: Record<string, Record<string, any>[]>
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const [entityType, rows] of Object.entries(entities)) {
    const requiredFields = REQUIRED_FIELDS[entityType] || [];

    rows.forEach((row, index) => {
      requiredFields.forEach(field => {
        if (!row[field] && row[field] !== 0 && row[field] !== false) {
          errors.push(`${entityType}[${index}]: Missing required field "${field}"`);
        }
      });
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
