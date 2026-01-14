import type { ConfidenceLevel } from './import-to-wizard-adapter';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface EntityReference {
  sourceId: string;
  sourceName?: string;
  sourceValue: string;
  resolvedId?: string;
  resolvedName?: string;
  confidence: ConfidenceLevel;
  resolutionMethod: 'id_match' | 'exact_name' | 'fuzzy_name' | 'partial_name' | 'unresolved';
  warning?: string;
}

export interface EntityLookupMap {
  byId: Map<string, { id: string; name: string }>;
  byNormalizedName: Map<string, { id: string; name: string }>;
  all: Array<{ id: string; name: string; normalizedName: string }>;
}

export interface ReferenceMappingEntry {
  entityType: 'project' | 'deliverable' | 'epic' | 'stage' | 'milestone' | 'sprint';
  sourceValue: string;
  sourceName?: string;
  resolvedId?: string;
  resolvedName?: string;
  confidence: ConfidenceLevel;
  resolutionMethod: EntityReference['resolutionMethod'];
  affectedRows: number;
}

export interface ReferenceMappingResult {
  mappings: ReferenceMappingEntry[];
  unresolvedCount: number;
  resolvedCount: number;
  warnings: string[];
}

export function isUUID(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  return UUID_REGEX.test(value.trim());
}

export function normalizeForMatching(value: string | undefined | null): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[_-]/g, ' ');
}

export function createEntityLookupMap(
  entities: Array<{ id: string; name?: string; title?: string }>
): EntityLookupMap {
  const byId = new Map<string, { id: string; name: string }>();
  const byNormalizedName = new Map<string, { id: string; name: string }>();
  const all: Array<{ id: string; name: string; normalizedName: string }> = [];

  for (const entity of entities) {
    const name = entity.name || entity.title || '';
    const normalizedName = normalizeForMatching(name);
    
    byId.set(entity.id, { id: entity.id, name });
    
    if (normalizedName) {
      byNormalizedName.set(normalizedName, { id: entity.id, name });
    }
    
    all.push({ id: entity.id, name, normalizedName });
  }

  return { byId, byNormalizedName, all };
}

export function resolveReference(
  value: string | undefined | null,
  lookupMap: EntityLookupMap
): EntityReference {
  if (!value || typeof value !== 'string') {
    return {
      sourceId: '',
      sourceValue: '',
      confidence: 'unmapped',
      resolutionMethod: 'unresolved'
    };
  }

  const trimmedValue = value.trim();
  
  if (isUUID(trimmedValue)) {
    const match = lookupMap.byId.get(trimmedValue);
    if (match) {
      return {
        sourceId: trimmedValue,
        sourceValue: trimmedValue,
        resolvedId: match.id,
        resolvedName: match.name,
        confidence: 'high',
        resolutionMethod: 'id_match'
      };
    }
    return {
      sourceId: trimmedValue,
      sourceValue: trimmedValue,
      confidence: 'low',
      resolutionMethod: 'unresolved',
      warning: `UUID "${trimmedValue.substring(0, 8)}..." not found in available entities`
    };
  }

  const normalizedValue = normalizeForMatching(trimmedValue);

  const exactMatch = lookupMap.byNormalizedName.get(normalizedValue);
  if (exactMatch) {
    return {
      sourceId: trimmedValue,
      sourceName: trimmedValue,
      sourceValue: trimmedValue,
      resolvedId: exactMatch.id,
      resolvedName: exactMatch.name,
      confidence: 'high',
      resolutionMethod: 'exact_name'
    };
  }

  for (const entity of lookupMap.all) {
    if (!entity.normalizedName) continue;
    
    if (entity.normalizedName.includes(normalizedValue) || 
        normalizedValue.includes(entity.normalizedName)) {
      return {
        sourceId: trimmedValue,
        sourceName: trimmedValue,
        sourceValue: trimmedValue,
        resolvedId: entity.id,
        resolvedName: entity.name,
        confidence: 'medium',
        resolutionMethod: 'partial_name',
        warning: `Partial match: "${trimmedValue}" → "${entity.name}"`
      };
    }
  }

  const fuzzyMatch = fuzzyMatchEntity(normalizedValue, lookupMap.all);
  if (fuzzyMatch) {
    return {
      sourceId: trimmedValue,
      sourceName: trimmedValue,
      sourceValue: trimmedValue,
      resolvedId: fuzzyMatch.id,
      resolvedName: fuzzyMatch.name,
      confidence: 'low',
      resolutionMethod: 'fuzzy_name',
      warning: `Fuzzy match: "${trimmedValue}" → "${fuzzyMatch.name}" (similarity: ${fuzzyMatch.score.toFixed(2)})`
    };
  }

  return {
    sourceId: trimmedValue,
    sourceName: trimmedValue,
    sourceValue: trimmedValue,
    confidence: 'unmapped',
    resolutionMethod: 'unresolved',
    warning: `No match found for "${trimmedValue}"`
  };
}

function fuzzyMatchEntity(
  query: string,
  entities: Array<{ id: string; name: string; normalizedName: string }>
): { id: string; name: string; score: number } | null {
  const SIMILARITY_THRESHOLD = 0.6;
  
  let bestMatch: { id: string; name: string; score: number } | null = null;
  
  for (const entity of entities) {
    if (!entity.normalizedName) continue;
    
    const score = calculateSimilarity(query, entity.normalizedName);
    
    if (score >= SIMILARITY_THRESHOLD && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { id: entity.id, name: entity.name, score };
    }
  }
  
  return bestMatch;
}

function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (!a || !b) return 0;

  const aWords = a.split(/\s+/);
  const bWords = b.split(/\s+/);
  const aSet = new Set(aWords);
  const bSet = new Set(bWords);
  
  const intersectionCount = aWords.filter(x => bSet.has(x)).length;
  const unionSet = new Set(aWords.concat(bWords));
  
  const jaccard = intersectionCount / unionSet.size;

  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  
  const containsBonus = longer.includes(shorter) ? 0.2 : 0;
  
  return Math.min(1, jaccard + containsBonus);
}

export function resolveEntityReferences(
  rows: Record<string, any>[],
  fieldName: string,
  lookupMap: EntityLookupMap,
  entityType: ReferenceMappingEntry['entityType']
): { 
  resolvedRows: Record<string, any>[];
  mappingEntry: ReferenceMappingEntry | null;
} {
  const valueCount = new Map<string, number>();
  const resolutions = new Map<string, EntityReference>();

  for (const row of rows) {
    const value = row[fieldName];
    if (value !== undefined && value !== null && value !== '') {
      const strValue = String(value);
      valueCount.set(strValue, (valueCount.get(strValue) || 0) + 1);
      
      if (!resolutions.has(strValue)) {
        resolutions.set(strValue, resolveReference(strValue, lookupMap));
      }
    }
  }

  if (resolutions.size === 0) {
    return { resolvedRows: rows, mappingEntry: null };
  }

  const resolvedRows = rows.map(row => {
    const value = row[fieldName];
    if (value === undefined || value === null || value === '') {
      return row;
    }
    
    const resolution = resolutions.get(String(value));
    if (resolution?.resolvedId) {
      return { ...row, [fieldName]: resolution.resolvedId };
    }
    return row;
  });

  let totalAffected = 0;
  let resolvedCount = 0;
  
  Array.from(valueCount.entries()).forEach(([value, count]) => {
    totalAffected += count;
    const resolution = resolutions.get(value);
    if (resolution?.resolvedId) {
      resolvedCount += count;
    }
  });

  const firstUnresolved = Array.from(resolutions.values()).find(r => !r.resolvedId);
  const firstResolved = Array.from(resolutions.values()).find(r => r.resolvedId);
  const primary = firstResolved || firstUnresolved;

  const mappingEntry: ReferenceMappingEntry = {
    entityType,
    sourceValue: primary?.sourceValue || '',
    sourceName: primary?.sourceName,
    resolvedId: primary?.resolvedId,
    resolvedName: primary?.resolvedName,
    confidence: primary?.confidence || 'unmapped',
    resolutionMethod: primary?.resolutionMethod || 'unresolved',
    affectedRows: totalAffected
  };

  return { resolvedRows, mappingEntry };
}

export function buildProjectLookupFromEntities(
  entities: Array<{ entityType: string; rows: Record<string, any>[] }>
): EntityLookupMap {
  const projectEntity = entities.find(e => 
    e.entityType === 'Projects' || e.entityType.toLowerCase() === 'project'
  );
  
  if (!projectEntity) {
    return { byId: new Map(), byNormalizedName: new Map(), all: [] };
  }

  const projects = projectEntity.rows.map(row => ({
    id: row.id || '',
    name: row.name || row.title || '',
    title: row.name || row.title || ''
  }));

  return createEntityLookupMap(projects);
}

export function buildDeliverableLookupFromEntities(
  entities: Array<{ entityType: string; rows: Record<string, any>[] }>
): EntityLookupMap {
  const deliverableEntity = entities.find(e => 
    e.entityType === 'Deliverables' || e.entityType.toLowerCase().includes('deliverable')
  );
  
  if (!deliverableEntity) {
    return { byId: new Map(), byNormalizedName: new Map(), all: [] };
  }

  const deliverables = deliverableEntity.rows.map(row => ({
    id: row.id || '',
    name: row.title || row.name || '',
    title: row.title || row.name || ''
  }));

  return createEntityLookupMap(deliverables);
}

export function buildStageLookupFromEntities(
  entities: Array<{ entityType: string; rows: Record<string, any>[] }>
): EntityLookupMap {
  const stageEntity = entities.find(e => 
    e.entityType === 'ProjectStages' || 
    e.entityType === 'Stages' ||
    e.entityType.toLowerCase().includes('stage')
  );
  
  if (!stageEntity) {
    return { byId: new Map(), byNormalizedName: new Map(), all: [] };
  }

  const stages = stageEntity.rows.map(row => ({
    id: row.id || '',
    name: row.name || row.title || '',
    title: row.name || row.title || ''
  }));

  return createEntityLookupMap(stages);
}

export function buildEpicLookupFromEntities(
  entities: Array<{ entityType: string; rows: Record<string, any>[] }>
): EntityLookupMap {
  const epicEntity = entities.find(e => 
    e.entityType === 'Epics' || e.entityType.toLowerCase().includes('epic')
  );
  
  if (!epicEntity) {
    return { byId: new Map(), byNormalizedName: new Map(), all: [] };
  }

  const epics = epicEntity.rows.map(row => ({
    id: row.id || '',
    name: row.title || row.name || '',
    title: row.title || row.name || ''
  }));

  return createEntityLookupMap(epics);
}

export function buildMilestoneLookupFromEntities(
  entities: Array<{ entityType: string; rows: Record<string, any>[] }>
): EntityLookupMap {
  const milestoneEntity = entities.find(e => 
    e.entityType === 'Milestones' || e.entityType.toLowerCase().includes('milestone')
  );
  
  if (!milestoneEntity) {
    return { byId: new Map(), byNormalizedName: new Map(), all: [] };
  }

  const milestones = milestoneEntity.rows.map(row => ({
    id: row.id || '',
    name: row.name || row.title || '',
    title: row.name || row.title || ''
  }));

  return createEntityLookupMap(milestones);
}

export function buildSprintLookupFromEntities(
  entities: Array<{ entityType: string; rows: Record<string, any>[] }>
): EntityLookupMap {
  const sprintEntity = entities.find(e => 
    e.entityType === 'Sprints' || e.entityType.toLowerCase().includes('sprint')
  );
  
  if (!sprintEntity) {
    return { byId: new Map(), byNormalizedName: new Map(), all: [] };
  }

  const sprints = sprintEntity.rows.map(row => ({
    id: row.id || '',
    name: row.name || row.title || '',
    title: row.name || row.title || ''
  }));

  return createEntityLookupMap(sprints);
}

export interface AllLookupMaps {
  projects: EntityLookupMap;
  deliverables: EntityLookupMap;
  stages: EntityLookupMap;
  epics: EntityLookupMap;
  milestones: EntityLookupMap;
  sprints: EntityLookupMap;
}

export function buildAllLookupMaps(
  entities: Array<{ entityType: string; rows: Record<string, any>[] }>
): AllLookupMaps {
  return {
    projects: buildProjectLookupFromEntities(entities),
    deliverables: buildDeliverableLookupFromEntities(entities),
    stages: buildStageLookupFromEntities(entities),
    epics: buildEpicLookupFromEntities(entities),
    milestones: buildMilestoneLookupFromEntities(entities),
    sprints: buildSprintLookupFromEntities(entities)
  };
}

export interface ResolveAllReferencesResult {
  resolvedEntities: Array<{ entityType: string; rows: Record<string, any>[] }>;
  referenceMappings: ReferenceMappingEntry[];
  warnings: string[];
  stats: {
    totalReferencesProcessed: number;
    resolvedByIdMatch: number;
    resolvedByExactName: number;
    resolvedByPartialName: number;
    resolvedByFuzzyName: number;
    unresolved: number;
  };
}

export function resolveAllReferences(
  entities: Array<{ entityType: string; rows: Record<string, any>[] }>
): ResolveAllReferencesResult {
  const lookups = buildAllLookupMaps(entities);
  const referenceMappings: ReferenceMappingEntry[] = [];
  const warnings: string[] = [];
  const stats = {
    totalReferencesProcessed: 0,
    resolvedByIdMatch: 0,
    resolvedByExactName: 0,
    resolvedByPartialName: 0,
    resolvedByFuzzyName: 0,
    unresolved: 0
  };

  const resolvedEntities = entities.map(entity => {
    let rows = [...entity.rows];
    
    if (entity.entityType === 'Deliverables') {
      const result = resolveEntityReferences(rows, 'projectId', lookups.projects, 'project');
      rows = result.resolvedRows;
      if (result.mappingEntry) {
        referenceMappings.push(result.mappingEntry);
        updateStats(stats, result.mappingEntry.resolutionMethod);
      }
    }
    
    if (entity.entityType === 'Epics') {
      const projectResult = resolveEntityReferences(rows, 'projectId', lookups.projects, 'project');
      rows = projectResult.resolvedRows;
      if (projectResult.mappingEntry) {
        referenceMappings.push(projectResult.mappingEntry);
        updateStats(stats, projectResult.mappingEntry.resolutionMethod);
      }
      
      const deliverableResult = resolveEntityReferences(rows, 'deliverableId', lookups.deliverables, 'deliverable');
      rows = deliverableResult.resolvedRows;
      if (deliverableResult.mappingEntry) {
        referenceMappings.push(deliverableResult.mappingEntry);
        updateStats(stats, deliverableResult.mappingEntry.resolutionMethod);
      }
    }
    
    if (entity.entityType === 'Tasks') {
      const projectResult = resolveEntityReferences(rows, 'projectId', lookups.projects, 'project');
      rows = projectResult.resolvedRows;
      if (projectResult.mappingEntry) {
        referenceMappings.push(projectResult.mappingEntry);
        updateStats(stats, projectResult.mappingEntry.resolutionMethod);
      }
      
      const epicResult = resolveEntityReferences(rows, 'epicId', lookups.epics, 'epic');
      rows = epicResult.resolvedRows;
      if (epicResult.mappingEntry) {
        referenceMappings.push(epicResult.mappingEntry);
        updateStats(stats, epicResult.mappingEntry.resolutionMethod);
      }
      
      const stageResult = resolveEntityReferences(rows, 'stageId', lookups.stages, 'stage');
      rows = stageResult.resolvedRows;
      if (stageResult.mappingEntry) {
        referenceMappings.push(stageResult.mappingEntry);
        updateStats(stats, stageResult.mappingEntry.resolutionMethod);
      }
      
      const milestoneResult = resolveEntityReferences(rows, 'milestoneId', lookups.milestones, 'milestone');
      rows = milestoneResult.resolvedRows;
      if (milestoneResult.mappingEntry) {
        referenceMappings.push(milestoneResult.mappingEntry);
        updateStats(stats, milestoneResult.mappingEntry.resolutionMethod);
      }
      
      const sprintResult = resolveEntityReferences(rows, 'sprintId', lookups.sprints, 'sprint');
      rows = sprintResult.resolvedRows;
      if (sprintResult.mappingEntry) {
        referenceMappings.push(sprintResult.mappingEntry);
        updateStats(stats, sprintResult.mappingEntry.resolutionMethod);
      }
    }
    
    if (entity.entityType === 'Milestones') {
      const projectResult = resolveEntityReferences(rows, 'projectId', lookups.projects, 'project');
      rows = projectResult.resolvedRows;
      if (projectResult.mappingEntry) {
        referenceMappings.push(projectResult.mappingEntry);
        updateStats(stats, projectResult.mappingEntry.resolutionMethod);
      }
    }
    
    if (entity.entityType === 'Sprints') {
      const projectResult = resolveEntityReferences(rows, 'projectId', lookups.projects, 'project');
      rows = projectResult.resolvedRows;
      if (projectResult.mappingEntry) {
        referenceMappings.push(projectResult.mappingEntry);
        updateStats(stats, projectResult.mappingEntry.resolutionMethod);
      }
    }
    
    if (entity.entityType === 'ProjectStages' || entity.entityType === 'Stages') {
      const projectResult = resolveEntityReferences(rows, 'projectId', lookups.projects, 'project');
      rows = projectResult.resolvedRows;
      if (projectResult.mappingEntry) {
        referenceMappings.push(projectResult.mappingEntry);
        updateStats(stats, projectResult.mappingEntry.resolutionMethod);
      }
    }
    
    return { entityType: entity.entityType, rows };
  });

  for (const mapping of referenceMappings) {
    if (mapping.resolutionMethod === 'unresolved' && mapping.sourceValue) {
      warnings.push(`Unresolved ${mapping.entityType} reference: "${mapping.sourceValue}" (affects ${mapping.affectedRows} rows)`);
    } else if (mapping.resolutionMethod === 'fuzzy_name' || mapping.resolutionMethod === 'partial_name') {
      warnings.push(`Approximate ${mapping.entityType} match: "${mapping.sourceValue}" → "${mapping.resolvedName}"`);
    }
  }

  return {
    resolvedEntities,
    referenceMappings,
    warnings,
    stats
  };
}

function updateStats(
  stats: ResolveAllReferencesResult['stats'],
  method: EntityReference['resolutionMethod']
): void {
  stats.totalReferencesProcessed++;
  switch (method) {
    case 'id_match':
      stats.resolvedByIdMatch++;
      break;
    case 'exact_name':
      stats.resolvedByExactName++;
      break;
    case 'partial_name':
      stats.resolvedByPartialName++;
      break;
    case 'fuzzy_name':
      stats.resolvedByFuzzyName++;
      break;
    case 'unresolved':
      stats.unresolved++;
      break;
  }
}
