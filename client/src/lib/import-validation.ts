import { z } from 'zod';
import type { ParseResult, ParsedEntity } from './import-parser';
import type { ConfidenceLevel } from '@shared/import-types';

export interface ImportValidationResult {
  isValid: boolean;
  errors: ImportError[];
  warnings: ImportWarning[];
  stats: ValidationStats;
}

export interface ImportError {
  code: string;
  message: string;
  entityType?: string;
  field?: string;
  rowIndex?: number;
  suggestion?: string;
}

export interface ImportWarning {
  code: string;
  message: string;
  entityType?: string;
  field?: string;
  rowIndex?: number;
  originalValue?: any;
  resolvedValue?: any;
}

export interface ValidationStats {
  totalRows: number;
  validRows: number;
  errorCount: number;
  warningCount: number;
  duplicatesFound: number;
  circularDepsFound: number;
  dateParseFailures: number;
}

export interface DateParseResult {
  value: string | null;
  success: boolean;
  originalValue: any;
  warning?: string;
}

const REQUIRED_FIELDS: Record<string, string[]> = {
  Tasks: ['title'],
  Projects: ['name'],
  Epics: ['title'],
  Deliverables: ['title'],
  Milestones: ['name'],
  Sprints: ['name', 'startDate', 'endDate'],
  Users: ['name']
};

const taskSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assigneeId: z.string().optional(),
  epicId: z.string().optional(),
  stageId: z.string().optional(),
  sprintId: z.string().optional(),
  milestoneId: z.string().optional(),
  deadline: z.string().optional(),
  estimateHours: z.number().optional()
});

const epicSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Epic title is required'),
  description: z.string().optional(),
  deliverableId: z.string().optional()
});

const deliverableSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Deliverable title is required'),
  description: z.string().optional(),
  projectId: z.string().optional()
});

const sprintSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Sprint name is required'),
  startDate: z.string().min(1, 'Sprint start date is required'),
  endDate: z.string().min(1, 'Sprint end date is required'),
  goal: z.string().optional(),
  status: z.string().optional()
});

const projectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  startDate: z.string().optional(),
  deadline: z.string().optional()
});

const milestoneSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Milestone name is required'),
  description: z.string().optional(),
  targetDate: z.string().optional()
});

const ENTITY_SCHEMAS: Record<string, z.ZodSchema> = {
  Tasks: taskSchema,
  Epics: epicSchema,
  Deliverables: deliverableSchema,
  Sprints: sprintSchema,
  Projects: projectSchema,
  Milestones: milestoneSchema
};

export function validateEmptyFile(parseResult: ParseResult): ImportError | null {
  const totalRows = parseResult.entities.reduce((sum, e) => sum + e.rowCount, 0);
  
  if (parseResult.entities.length === 0 || totalRows === 0) {
    return {
      code: 'EMPTY_FILE',
      message: 'The import file appears to be empty or contains no recognizable data.',
      suggestion: 'Please upload a file with at least one project, task, or other entity to import.'
    };
  }
  
  const hasData = parseResult.entities.some(e => e.rows.length > 0);
  if (!hasData) {
    return {
      code: 'NO_DATA_ROWS',
      message: 'The file structure was recognized but no data rows were found.',
      suggestion: 'Check that your file contains actual data rows, not just headers.'
    };
  }
  
  return null;
}

export interface DuplicateIdResult {
  entityType: string;
  duplicates: Map<string, number[]>;
  renamedIds: Map<string, string[]>;
  warnings: ImportWarning[];
}

export function detectAndResolveDuplicateIds(
  entities: ParsedEntity[]
): DuplicateIdResult[] {
  const results: DuplicateIdResult[] = [];
  
  for (const entity of entities) {
    const idOccurrences = new Map<string, number[]>();
    const renamedIds = new Map<string, string[]>();
    const warnings: ImportWarning[] = [];
    
    entity.rows.forEach((row, index) => {
      const id = row.id;
      if (id) {
        const existing = idOccurrences.get(id) || [];
        existing.push(index);
        idOccurrences.set(id, existing);
      }
    });
    
    const duplicates = new Map<string, number[]>();
    idOccurrences.forEach((indices, id) => {
      if (indices.length > 1) {
        duplicates.set(id, indices);
        
        const newIds: string[] = [];
        indices.slice(1).forEach((rowIndex, dupIndex) => {
          const newId = `${id}_dup${dupIndex + 1}`;
          entity.rows[rowIndex].id = newId;
          newIds.push(newId);
          
          warnings.push({
            code: 'DUPLICATE_ID_RENAMED',
            message: `Duplicate ID "${id}" found at row ${rowIndex + 1}. Renamed to "${newId}".`,
            entityType: entity.entityType,
            field: 'id',
            rowIndex,
            originalValue: id,
            resolvedValue: newId
          });
        });
        renamedIds.set(id, newIds);
      }
    });
    
    if (duplicates.size > 0) {
      results.push({
        entityType: entity.entityType,
        duplicates,
        renamedIds,
        warnings
      });
    }
  }
  
  return results;
}

interface DependencyNode {
  id: string;
  entityType: string;
  dependsOn: string[];
}

export function detectCircularDependencies(
  entities: ParsedEntity[]
): ImportWarning[] {
  const warnings: ImportWarning[] = [];
  const nodes = new Map<string, DependencyNode>();
  
  for (const entity of entities) {
    for (const row of entity.rows) {
      if (!row.id) continue;
      
      const dependencies: string[] = [];
      
      if (row.parentTaskId) dependencies.push(row.parentTaskId);
      if (row.blockedBy && Array.isArray(row.blockedBy)) {
        dependencies.push(...row.blockedBy);
      }
      if (row.dependsOn && Array.isArray(row.dependsOn)) {
        dependencies.push(...row.dependsOn);
      }
      
      nodes.set(row.id, {
        id: row.id,
        entityType: entity.entityType,
        dependsOn: dependencies
      });
    }
  }
  
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cycles: string[][] = [];
  
  function detectCycle(nodeId: string, path: string[]): boolean {
    if (recursionStack.has(nodeId)) {
      const cycleStart = path.indexOf(nodeId);
      const cycle = path.slice(cycleStart);
      cycle.push(nodeId);
      cycles.push(cycle);
      return true;
    }
    
    if (visited.has(nodeId)) return false;
    
    const node = nodes.get(nodeId);
    if (!node) return false;
    
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);
    
    for (const dep of node.dependsOn) {
      detectCycle(dep, [...path]);
    }
    
    recursionStack.delete(nodeId);
    return false;
  }
  
  for (const nodeId of Array.from(nodes.keys())) {
    if (!visited.has(nodeId)) {
      detectCycle(nodeId, []);
    }
  }
  
  for (const cycle of cycles) {
    warnings.push({
      code: 'CIRCULAR_DEPENDENCY',
      message: `Circular dependency detected: ${cycle.join(' → ')}. These dependencies will be ignored.`,
      originalValue: cycle
    });
  }
  
  return warnings;
}

export function validateRequiredFields(
  entities: ParsedEntity[]
): { errors: ImportError[]; warnings: ImportWarning[] } {
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  
  for (const entity of entities) {
    const schema = ENTITY_SCHEMAS[entity.entityType];
    const required = REQUIRED_FIELDS[entity.entityType] || [];
    
    entity.rows.forEach((row, index) => {
      if (schema) {
        const result = schema.safeParse(row);
        if (!result.success) {
          for (const issue of result.error.issues) {
            const field = issue.path.join('.');
            const isRequired = required.includes(field) || issue.code === 'too_small';
            
            if (isRequired && (field === 'title' || field === 'name')) {
              errors.push({
                code: 'ZOD_VALIDATION_ERROR',
                message: `${entity.entityType} row ${index + 1}: ${issue.message}`,
                entityType: entity.entityType,
                field,
                rowIndex: index,
                suggestion: `Please provide a valid ${field} for this ${entity.entityType.slice(0, -1).toLowerCase()}.`
              });
            } else if (isRequired) {
              warnings.push({
                code: 'ZOD_VALIDATION_WARNING',
                message: `${entity.entityType} row ${index + 1}: ${issue.message} - will use default.`,
                entityType: entity.entityType,
                field,
                rowIndex: index
              });
            }
          }
        }
      } else {
        for (const field of required) {
          const value = row[field];
          if (value === undefined || value === null || value === '') {
            if (field === 'title' || field === 'name') {
              errors.push({
                code: 'MISSING_REQUIRED_FIELD',
                message: `${entity.entityType} row ${index + 1}: Missing required field "${field}".`,
                entityType: entity.entityType,
                field,
                rowIndex: index,
                suggestion: `Please provide a ${field} for this ${entity.entityType.slice(0, -1).toLowerCase()}.`
              });
            } else {
              warnings.push({
                code: 'MISSING_OPTIONAL_IMPORTANT_FIELD',
                message: `${entity.entityType} row ${index + 1}: Missing field "${field}" - using default value.`,
                entityType: entity.entityType,
                field,
                rowIndex: index
              });
            }
          }
        }
      }
    });
  }
  
  return { errors, warnings };
}

export function parseDateWithWarning(
  value: any,
  fieldName: string,
  entityType: string,
  rowIndex: number
): DateParseResult {
  if (!value) {
    return { value: null, success: true, originalValue: value };
  }
  
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return {
        value: parsed.toISOString().split('T')[0],
        success: true,
        originalValue: value
      };
    }
    
    const dateFormats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
      /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/
    ];
    
    for (const format of dateFormats) {
      const match = value.match(format);
      if (match) {
        let year: number, month: number, day: number;
        
        if (match[1].length === 4) {
          year = parseInt(match[1]);
          month = parseInt(match[2]) - 1;
          day = parseInt(match[3]);
        } else if (match[3].length === 4) {
          if (format.source.startsWith('^(\\d{1,2})\\/')) {
            month = parseInt(match[1]) - 1;
            day = parseInt(match[2]);
          } else {
            day = parseInt(match[1]);
            month = parseInt(match[2]) - 1;
          }
          year = parseInt(match[3]);
        } else {
          continue;
        }
        
        const parsed = new Date(year, month, day);
        if (!isNaN(parsed.getTime())) {
          return {
            value: parsed.toISOString().split('T')[0],
            success: true,
            originalValue: value
          };
        }
      }
    }
  }
  
  if (typeof value === 'number') {
    if (value > 25569 && value < 100000) {
      const excelDate = new Date((value - 25569) * 86400 * 1000);
      if (!isNaN(excelDate.getTime())) {
        return {
          value: excelDate.toISOString().split('T')[0],
          success: true,
          originalValue: value
        };
      }
    }
    
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return {
        value: date.toISOString().split('T')[0],
        success: true,
        originalValue: value
      };
    }
  }
  
  return {
    value: null,
    success: false,
    originalValue: value,
    warning: `${entityType} row ${rowIndex + 1}: Could not parse "${fieldName}" value "${value}" as a date.`
  };
}

export function collectDateParseWarnings(
  entities: ParsedEntity[]
): { warnings: ImportWarning[]; parsedEntities: ParsedEntity[] } {
  const warnings: ImportWarning[] = [];
  const dateFields = ['startDate', 'endDate', 'deadline', 'dueDate', 'targetDate', 'createdAt', 'updatedAt'];
  
  const parsedEntities = entities.map(entity => ({
    ...entity,
    rows: entity.rows.map((row, rowIndex) => {
      const newRow = { ...row };
      
      for (const field of dateFields) {
        if (row[field] !== undefined) {
          const result = parseDateWithWarning(row[field], field, entity.entityType, rowIndex);
          newRow[field] = result.value;
          
          if (!result.success && result.warning) {
            warnings.push({
              code: 'DATE_PARSE_FAILURE',
              message: result.warning,
              entityType: entity.entityType,
              field,
              rowIndex,
              originalValue: result.originalValue,
              resolvedValue: null
            });
          }
        }
      }
      
      return newRow;
    })
  }));
  
  return { warnings, parsedEntities };
}

const CHUNK_SIZE = 500;
const LARGE_FILE_THRESHOLD = 5000;

export interface ChunkedProcessingResult<T> {
  results: T[];
  processedCount: number;
  totalCount: number;
  isComplete: boolean;
  warnings: ImportWarning[];
}

export async function processInChunks<T, R>(
  items: T[],
  processor: (chunk: T[], startIndex: number) => Promise<R[]>,
  onProgress?: (processed: number, total: number) => void
): Promise<ChunkedProcessingResult<R>> {
  const results: R[] = [];
  const warnings: ImportWarning[] = [];
  const total = items.length;
  
  if (total > LARGE_FILE_THRESHOLD) {
    warnings.push({
      code: 'LARGE_FILE_PROCESSING',
      message: `Processing ${total} items in chunks of ${CHUNK_SIZE} for better performance.`
    });
  }
  
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    const chunkResults = await processor(chunk, i);
    results.push(...chunkResults);
    
    if (onProgress) {
      onProgress(Math.min(i + CHUNK_SIZE, total), total);
    }
    
    if (i + CHUNK_SIZE < items.length) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  return {
    results,
    processedCount: items.length,
    totalCount: items.length,
    isComplete: true,
    warnings
  };
}

export function validateParseResult(parseResult: ParseResult): ImportValidationResult {
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  let stats: ValidationStats = {
    totalRows: 0,
    validRows: 0,
    errorCount: 0,
    warningCount: 0,
    duplicatesFound: 0,
    circularDepsFound: 0,
    dateParseFailures: 0
  };
  
  const emptyError = validateEmptyFile(parseResult);
  if (emptyError) {
    errors.push(emptyError);
    return {
      isValid: false,
      errors,
      warnings,
      stats
    };
  }
  
  stats.totalRows = parseResult.entities.reduce((sum, e) => sum + e.rowCount, 0);
  
  const duplicateResults = detectAndResolveDuplicateIds(parseResult.entities);
  for (const result of duplicateResults) {
    warnings.push(...result.warnings);
    stats.duplicatesFound += result.duplicates.size;
  }
  
  const circularWarnings = detectCircularDependencies(parseResult.entities);
  warnings.push(...circularWarnings);
  stats.circularDepsFound = circularWarnings.length;
  
  const fieldValidation = validateRequiredFields(parseResult.entities);
  errors.push(...fieldValidation.errors);
  warnings.push(...fieldValidation.warnings);
  
  const dateResults = collectDateParseWarnings(parseResult.entities);
  warnings.push(...dateResults.warnings);
  stats.dateParseFailures = dateResults.warnings.length;
  
  Object.assign(parseResult.entities, dateResults.parsedEntities);
  
  stats.errorCount = errors.length;
  stats.warningCount = warnings.length;
  stats.validRows = stats.totalRows - errors.filter(e => e.rowIndex !== undefined).length;
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats
  };
}

export function formatValidationErrorsForUser(errors: ImportError[]): string[] {
  if (errors.length === 0) return [];
  
  const byCode = new Map<string, ImportError[]>();
  errors.forEach(e => {
    const existing = byCode.get(e.code) || [];
    existing.push(e);
    byCode.set(e.code, existing);
  });
  
  const messages: string[] = [];
  
  byCode.forEach((errs, code) => {
    if (errs.length === 1) {
      const e = errs[0];
      messages.push(e.suggestion ? `${e.message} ${e.suggestion}` : e.message);
    } else {
      const first = errs[0];
      const sample = errs.slice(0, 3).map(e => e.message).join('; ');
      const remaining = errs.length > 3 ? ` (and ${errs.length - 3} more)` : '';
      messages.push(`${sample}${remaining}`);
      if (first.suggestion) {
        messages.push(`Suggestion: ${first.suggestion}`);
      }
    }
  });
  
  return messages;
}

export function formatValidationWarningsForUser(warnings: ImportWarning[]): string[] {
  if (warnings.length === 0) return [];
  
  const byCode = new Map<string, number>();
  warnings.forEach(w => {
    byCode.set(w.code, (byCode.get(w.code) || 0) + 1);
  });
  
  const messages: string[] = [];
  
  byCode.forEach((count, code) => {
    const sample = warnings.find(w => w.code === code);
    if (!sample) return;
    
    switch (code) {
      case 'DUPLICATE_ID_RENAMED':
        messages.push(`${count} duplicate ID(s) were automatically renamed.`);
        break;
      case 'DATE_PARSE_FAILURE':
        messages.push(`${count} date value(s) could not be parsed and were set to empty.`);
        break;
      case 'CIRCULAR_DEPENDENCY':
        messages.push(`${count} circular dependency chain(s) detected and will be ignored.`);
        break;
      case 'MISSING_OPTIONAL_IMPORTANT_FIELD':
        messages.push(`${count} optional field(s) missing, using defaults.`);
        break;
      case 'LARGE_FILE_PROCESSING':
        messages.push(sample.message);
        break;
      default:
        if (count === 1) {
          messages.push(sample.message);
        } else {
          messages.push(`${count} ${code.toLowerCase().replace(/_/g, ' ')} warning(s).`);
        }
    }
  });
  
  return messages;
}

import type { 
  TaskValidationResult, 
  TaskValidationSummary, 
  TaskValidationErrorType 
} from '@shared/import-types';
import type { ImportedStage, ImportedTask } from './import-to-wizard-adapter';

export function validateTaskEpicAssignments(
  stages: ImportedStage[],
  stageMap?: Map<string, string>
): TaskValidationSummary {
  const results: TaskValidationResult[] = [];
  const errorsByType: Record<TaskValidationErrorType, number> = {
    no_epic_reference: 0,
    epic_id_not_found: 0,
    epic_name_not_found: 0,
    epic_fuzzy_match_failed: 0,
    unknown: 0
  };
  
  let assignedCount = 0;
  let orphanedCount = 0;
  
  stages.forEach(stage => {
    (stage.tasks || []).forEach(task => {
      const importedTask = task as ImportedTask;
      const isOrphaned = importedTask.mappingStatus === 'orphaned' || !importedTask.assignedEpicId;
      
      let errorType: TaskValidationErrorType | undefined;
      let errorMessage: string | undefined;
      
      if (isOrphaned) {
        orphanedCount++;
        
        const hasEpicId = !!importedTask.sourceEpicId;
        const hasEpicTitle = !!importedTask.sourceEpicTitle;
        
        if (!hasEpicId && !hasEpicTitle) {
          errorType = 'no_epic_reference';
          errorMessage = 'No epic ID or name provided in import file';
        } else if (hasEpicId && importedTask.warnings?.some(w => w.includes('Epic ID') && w.includes('not found'))) {
          errorType = 'epic_id_not_found';
          errorMessage = `Epic ID "${importedTask.sourceEpicId}" not found in import`;
        } else if (hasEpicTitle && importedTask.warnings?.some(w => w.includes('Epic') && w.includes('not found'))) {
          errorType = 'epic_name_not_found';
          errorMessage = `Epic "${importedTask.sourceEpicTitle}" not found in import`;
        } else if (importedTask.warnings?.some(w => w.includes('needs manual assignment'))) {
          errorType = 'epic_fuzzy_match_failed';
          errorMessage = `Could not match epic "${importedTask.sourceEpicTitle || importedTask.sourceEpicId}" - needs manual assignment`;
        } else {
          errorType = 'unknown';
          errorMessage = importedTask.warnings?.join('; ') || 'Unknown error during epic matching';
        }
        
        errorsByType[errorType]++;
      } else {
        assignedCount++;
      }
      
      results.push({
        taskId: importedTask.id,
        taskTitle: importedTask.title,
        sourceId: importedTask.sourceId,
        status: isOrphaned ? 'orphaned' : 'assigned',
        assignedEpicId: importedTask.assignedEpicId,
        assignedEpicTitle: importedTask.assignedEpicTitle,
        sourceEpicId: importedTask.sourceEpicId,
        sourceEpicTitle: importedTask.sourceEpicTitle,
        errorType,
        errorMessage,
        warnings: importedTask.warnings || [],
        stageId: stage.id,
        stageName: stageMap?.get(stage.id) || stage.name
      });
    });
  });
  
  return {
    totalTasks: results.length,
    assignedTasks: assignedCount,
    orphanedTasks: orphanedCount,
    errorsByType,
    results
  };
}

export function exportTaskValidationProblems(summary: TaskValidationSummary): string {
  const orphanedTasks = summary.results.filter(r => r.status === 'orphaned');
  
  if (orphanedTasks.length === 0) {
    return '';
  }
  
  const headers = ['Task Title', 'Source ID', 'Error Type', 'Error Message', 'Source Epic ID', 'Source Epic Name', 'Stage'];
  const rows = orphanedTasks.map(task => [
    task.taskTitle,
    task.sourceId || '',
    task.errorType || '',
    task.errorMessage || '',
    task.sourceEpicId || '',
    task.sourceEpicTitle || '',
    task.stageName || ''
  ]);
  
  const escapeCSV = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };
  
  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');
  
  return csvContent;
}
