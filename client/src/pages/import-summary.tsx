import { useState, useMemo, useCallback } from 'react';
import { useLocation } from 'wouter';
import { 
  ArrowRight, 
  ArrowLeft,
  FileCheck, 
  Package, 
  FileBox, 
  ListTodo, 
  Target, 
  Users,
  Layers,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  UserCheck,
  ArrowRightLeft,
  Wand2,
  Link2,
  UserPlus,
  Crown,
  Briefcase,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useImport } from '@/context/import-context';
import { useStatusOptions } from '@/hooks/use-nexus-data';
import { useAllUsersForAssignment } from '@/features/user-management';
import type { ConfidenceLevel, UserMappingEntry, StatusMappingEntry, ProjectRoleType } from '@/lib/import-to-wizard-adapter';
import type { ReferenceMappingEntry } from '@/lib/import-reference-resolver';
import { useQuery } from '@tanstack/react-query';
import { validateTaskEpicAssignments } from '@/lib/import-validation';
import { TaskValidationPanel } from '@/components/import/task-validation-panel';

function ConfidenceBadge({ confidence }: { confidence: ConfidenceLevel }) {
  const config = {
    high: { label: 'High', className: 'bg-green-100 text-green-700 border-green-200' },
    medium: { label: 'Medium', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    low: { label: 'Low', className: 'bg-red-100 text-red-700 border-red-200' },
    unmapped: { label: 'Not Mapped', className: 'bg-gray-100 text-gray-500 border-gray-200' },
  };
  const { label, className } = config[confidence] || config.unmapped;
  return <Badge variant="outline" className={className}>{label}</Badge>;
}

function ConfidenceIcon({ confidence }: { confidence: ConfidenceLevel }) {
  if (confidence === 'high') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (confidence === 'medium') return <HelpCircle className="h-4 w-4 text-amber-500" />;
  return <XCircle className="h-4 w-4 text-red-500" />;
}

interface ReferenceMappingTableProps {
  mappings: ReferenceMappingEntry[];
  entityOptions: Record<ReferenceMappingEntry['entityType'], { value: string; label: string }[]>;
  onMappingChange: (entityType: ReferenceMappingEntry['entityType'], sourceValue: string, newResolvedId: string) => void;
}

function ReferenceMappingTable({ mappings, entityOptions, onMappingChange }: ReferenceMappingTableProps) {
  const typeLabels: Record<string, string> = {
    deliverable: 'Deliverable',
    epic: 'Epic',
    stage: 'Stage',
    milestone: 'Milestone'
  };
  const methodLabels: Record<string, string> = {
    id_match: 'ID Match',
    exact_name: 'Exact Name',
    partial_name: 'Partial Match',
    fuzzy_name: 'Fuzzy Match',
    unresolved: 'Unresolved'
  };

  if (mappings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No reference mappings in this category.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Field</TableHead>
          <TableHead>Target Type</TableHead>
          <TableHead>Source Value</TableHead>
          <TableHead></TableHead>
          <TableHead>Resolved To</TableHead>
          <TableHead>Confidence</TableHead>
          <TableHead>Rows</TableHead>
          <TableHead>Manual Override</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {mappings.map((mapping, idx) => {
          const options = entityOptions[mapping.entityType] || [];
          return (
            <TableRow key={`${mapping.entityType}-${mapping.sourceValue}-${idx}`} data-testid={`reference-mapping-row-${mapping.entityType}-${idx}`}>
              <TableCell>
                <Badge variant="outline" className="font-mono text-xs">
                  {mapping.fieldName}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="font-normal">
                  {typeLabels[mapping.entityType] || mapping.entityType}
                </Badge>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium font-mono text-sm">{mapping.sourceValue}</p>
                  {mapping.sourceName && mapping.sourceName !== mapping.sourceValue && (
                    <p className="text-xs text-muted-foreground">{mapping.sourceName}</p>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <ArrowRight className="h-4 w-4 text-muted-foreground inline" />
              </TableCell>
              <TableCell>
                {mapping.resolvedId ? (
                  <div>
                    <p className="font-medium text-primary">{mapping.resolvedName || mapping.resolvedId}</p>
                    <p className="text-xs text-muted-foreground font-mono">{methodLabels[mapping.resolutionMethod]}</p>
                  </div>
                ) : (
                  <Badge variant="outline" className="text-red-600 border-red-200">
                    Not Resolved
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <ConfidenceBadge confidence={mapping.confidence} />
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{mapping.affectedRows}</Badge>
              </TableCell>
              <TableCell>
                <SearchableSelect
                  value={mapping.resolvedId || ''}
                  onValueChange={(val) => onMappingChange(mapping.entityType, mapping.sourceValue, val)}
                  options={options}
                  placeholder={`Select ${typeLabels[mapping.entityType] || 'entity'}...`}
                  searchPlaceholder="Search..."
                  emptyMessage="No matches found."
                  className="w-[200px]"
                  data-testid={`reference-select-${mapping.entityType}-${idx}`}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function getEffectiveId(
  rawValue: string | undefined | null,
  entityType: ReferenceMappingEntry['entityType'],
  referenceMappings: ReferenceMappingEntry[],
  validEntityIds: Set<string>
): string | undefined {
  if (!rawValue) return undefined;
  
  const mapping = referenceMappings.find(m => m.entityType === entityType && m.sourceValue === rawValue);
  if (mapping?.resolvedId) {
    return mapping.resolvedId;
  }
  
  if (validEntityIds.has(rawValue)) {
    return rawValue;
  }
  
  return undefined;
}

interface RelationshipHierarchyPreviewProps {
  deliverables: any[];
  epics: any[];
  tasks: any[];
  referenceMappings: ReferenceMappingEntry[];
}

function RelationshipHierarchyPreview({ deliverables, epics, tasks, referenceMappings }: RelationshipHierarchyPreviewProps) {
  const hierarchy = useMemo(() => {
    const deliverableIds = new Set(deliverables.map((d: any) => d.id));
    const epicIds = new Set(epics.map((e: any) => e.id));
    
    const deliverableMap = new Map<string, { 
      deliverable: any; 
      epics: Map<string, { epic: any; tasks: any[] }>;
      taskCount: number;
    }>();
    
    deliverables.forEach((d: any) => {
      deliverableMap.set(d.id, { deliverable: d, epics: new Map(), taskCount: 0 });
    });

    epics.forEach((e: any) => {
      const rawDeliverableRef = e.deliverableId || e.deliverableName || e.deliverableTitle;
      const deliverableId = getEffectiveId(rawDeliverableRef, 'deliverable', referenceMappings, deliverableIds);
      if (deliverableId && deliverableMap.has(deliverableId)) {
        deliverableMap.get(deliverableId)!.epics.set(e.id, { epic: e, tasks: [] });
      }
    });

    tasks.forEach((t: any) => {
      const rawEpicRef = t.epicId || t.epicName || t.epicTitle;
      const epicId = getEffectiveId(rawEpicRef, 'epic', referenceMappings, epicIds);
      if (epicId) {
        for (const [, dData] of deliverableMap) {
          if (dData.epics.has(epicId)) {
            dData.epics.get(epicId)!.tasks.push(t);
            dData.taskCount++;
            break;
          }
        }
      }
    });

    return deliverableMap;
  }, [deliverables, epics, tasks, referenceMappings]);

  if (deliverables.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No deliverables to preview.</div>;
  }

  return (
    <Accordion type="multiple" className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
      {Array.from(hierarchy.entries()).map(([dId, dData]) => (
        <AccordionItem key={dId} value={dId} className="border rounded-lg px-3">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2 flex-1">
              <Package className="h-4 w-4 text-primary" />
              <span className="font-semibold text-left">{dData.deliverable.title || dData.deliverable.name || dId}</span>
              <div className="ml-auto flex gap-2 mr-4">
                <Badge variant="outline">
                  {dData.epics.size} epics
                </Badge>
                <Badge variant="secondary">
                  {dData.taskCount} tasks
                </Badge>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="ml-4 space-y-2 border-l-2 border-muted pl-4">
              {Array.from(dData.epics.entries()).map(([eId, eData]) => (
                <div key={eId} className="py-2">
                  <div className="flex items-center gap-2">
                    <FileBox className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">{eData.epic.title || eData.epic.name || eId}</span>
                    <Badge variant="outline" className="ml-auto text-xs bg-blue-50/50">
                      {eData.tasks.length} tasks
                    </Badge>
                  </div>
                  {eData.tasks.length > 0 && (
                    <div className="ml-4 mt-1 space-y-1">
                      {eData.tasks.slice(0, 3).map((t: any) => (
                        <div key={t.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <ListTodo className="h-3 w-3" />
                          <span className="truncate">{t.title || t.name || t.id}</span>
                        </div>
                      ))}
                      {eData.tasks.length > 3 && (
                        <div className="text-xs text-muted-foreground italic">
                          +{eData.tasks.length - 3} more tasks
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {dData.epics.size === 0 && (
                <div className="text-sm text-muted-foreground italic py-2">
                  No epics assigned to this deliverable
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

interface EntityTaskPreviewProps {
  entities: any[];
  tasks: any[];
  entityType: string;
  entityLabel: string;
  fieldName: string;
  referenceMappings: ReferenceMappingEntry[];
}

function EntityTaskPreview({ entities, tasks, entityType, entityLabel, fieldName, referenceMappings }: EntityTaskPreviewProps) {
  const groupedTasks = useMemo(() => {
    const entityIds = new Set(entities.map((e: any) => e.id));
    const groups = new Map<string, { entity: any; tasks: any[] }>();
    
    entities.forEach((e: any) => {
      groups.set(e.id, { entity: e, tasks: [] });
    });

    groups.set('unassigned', { entity: null, tasks: [] });

    const nameField = fieldName.replace('Id', 'Name');
    const titleField = fieldName.replace('Id', 'Title');
    
    tasks.forEach((t: any) => {
      const rawRef = t[fieldName] || t[nameField] || t[titleField];
      const effectiveEntityId = getEffectiveId(
        rawRef, 
        entityType as ReferenceMappingEntry['entityType'], 
        referenceMappings, 
        entityIds
      );
      
      if (effectiveEntityId && groups.has(effectiveEntityId)) {
        groups.get(effectiveEntityId)!.tasks.push(t);
      } else {
        groups.get('unassigned')!.tasks.push(t);
      }
    });

    return groups;
  }, [entities, tasks, fieldName, entityType, referenceMappings]);

  if (entities.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No {entityLabel.toLowerCase()}s imported.</div>;
  }

  const unassignedCount = groupedTasks.get('unassigned')?.tasks.length || 0;

  return (
    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
      <Accordion type="multiple" className="space-y-4">
        {Array.from(groupedTasks.entries())
          .filter(([id]) => id !== 'unassigned')
          .map(([eId, data]) => (
            <AccordionItem key={eId} value={eId} className="border rounded-lg px-3">
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-2 flex-1">
                  {entityType === 'stage' && <Layers className="h-4 w-4 text-orange-500" />}
                  {entityType === 'sprint' && <ArrowRightLeft className="h-4 w-4 text-purple-500" />}
                  {entityType === 'milestone' && <Target className="h-4 w-4 text-green-500" />}
                  <span className="font-semibold text-left">{data.entity?.title || data.entity?.name || eId}</span>
                  <Badge variant="secondary" className="ml-auto mr-4">
                    {data.tasks.length} tasks
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                {data.tasks.length > 0 ? (
                  <div className="ml-6 space-y-1">
                    {data.tasks.slice(0, 10).map((t: any) => (
                      <div key={t.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ListTodo className="h-3 w-3" />
                        <span className="truncate">{t.title || t.name || t.id}</span>
                      </div>
                    ))}
                    {data.tasks.length > 10 && (
                      <div className="text-xs text-muted-foreground italic">
                        +{data.tasks.length - 10} more tasks
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="ml-6 text-sm text-muted-foreground italic">
                    No tasks assigned
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
      </Accordion>
      
      {unassignedCount > 0 && (
        <div className="border border-dashed border-amber-300 rounded-lg p-3 bg-amber-50/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="font-semibold text-amber-700">No {entityLabel} Assigned</span>
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 ml-auto">
              {unassignedCount} tasks
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            These tasks don't have a {entityLabel.toLowerCase()} assigned or their reference couldn't be resolved.
          </p>
        </div>
      )}
    </div>
  );
}

export default function ImportSummary() {
  const [, setLocation] = useLocation();
  const { state, updateUserMapping, updateStatusMapping, updateReferenceMapping, setDefaultUnassignedTo } = useImport();
  const { data: allUsers } = useAllUsersForAssignment();
  const { data: statusOptionsData } = useStatusOptions();
  
  const [userMappingOpen, setUserMappingOpen] = useState(true);
  const [statusMappingOpen, setStatusMappingOpen] = useState(true);
  const [referenceMappingOpen, setReferenceMappingOpen] = useState(true);
  const [relationshipPreviewOpen, setRelationshipPreviewOpen] = useState(true);
  const [taskPreviewOpen, setTaskPreviewOpen] = useState(false);
  const [unassignedOpen, setUnassignedOpen] = useState(true);

  const systemUsers = allUsers || [];
  const taskStatuses = (statusOptionsData || []).filter((s: any) => s.type === 'task');

  const importedEntities = useMemo(() => {
    const entities = state.parseResult?.entities || [];
    return {
      deliverables: entities.find(e => e.entityType === 'Deliverables')?.rows || [],
      epics: entities.find(e => e.entityType === 'Epics')?.rows || [],
      milestones: entities.find(e => e.entityType === 'Milestones')?.rows || [],
      stages: entities.find(e => e.entityType === 'ProjectStages')?.rows || [],
      tasks: entities.find(e => e.entityType === 'Tasks')?.rows || [],
      sprints: entities.find(e => e.entityType === 'Sprints')?.rows || [],
    };
  }, [state.parseResult?.entities]);

  const entityOptions = useMemo(() => {
    const options: Record<ReferenceMappingEntry['entityType'], SearchableSelectOption[]> = {
      deliverable: [{ value: '', label: 'Select deliverable...' }],
      epic: [{ value: '', label: 'Select epic...' }],
      milestone: [{ value: '', label: 'Select milestone...' }],
      stage: [{ value: '', label: 'Select stage...' }],
    };

    const seenIds = new Set<string>();

    importedEntities.deliverables.forEach((d: any) => {
      if (d.id && !seenIds.has(`d-${d.id}`)) {
        seenIds.add(`d-${d.id}`);
        options.deliverable.push({ value: d.id, label: d.title || d.name || d.id });
      }
    });
    importedEntities.epics.forEach((e: any) => {
      if (e.id && !seenIds.has(`e-${e.id}`)) {
        seenIds.add(`e-${e.id}`);
        options.epic.push({ value: e.id, label: e.title || e.name || e.id });
      }
    });
    importedEntities.milestones.forEach((m: any) => {
      if (m.id && !seenIds.has(`m-${m.id}`)) {
        seenIds.add(`m-${m.id}`);
        options.milestone.push({ value: m.id, label: m.name || m.title || m.id });
      }
    });
    importedEntities.stages.forEach((s: any) => {
      if (s.id && !seenIds.has(`s-${s.id}`)) {
        seenIds.add(`s-${s.id}`);
        options.stage.push({ value: s.id, label: s.name || s.title || s.id });
      }
    });

    return options;
  }, [importedEntities]);

  const handleReferenceMappingChange = useCallback((
    entityType: ReferenceMappingEntry['entityType'],
    sourceValue: string,
    newResolvedId: string
  ) => {
    const entityList = {
      deliverable: importedEntities.deliverables,
      epic: importedEntities.epics,
      milestone: importedEntities.milestones,
      stage: importedEntities.stages,
    }[entityType];
    
    const entity = entityList.find((e: any) => e.id === newResolvedId);
    const resolvedName = entity?.name || entity?.title || newResolvedId;
    updateReferenceMapping(entityType, sourceValue, newResolvedId, resolvedName);
  }, [importedEntities, updateReferenceMapping]);

  const stats = state.adapterResult?.stats;
  const userMappings = state.userMappings;
  const statusMappings = state.statusMappings;
  const referenceMappings = state.referenceMappings;
  const referenceStats = state.referenceStats;

  const validationSummary = useMemo(() => {
    const unmappedUsers = userMappings.filter(m => !m.mappedToId || m.action === 'unassigned');
    const lowConfidenceStatuses = statusMappings.filter(m => m.confidence === 'low');
    const unresolvedReferences = referenceMappings.filter(m => !m.resolvedId);
    const hasIssues = unmappedUsers.length > 0 || lowConfidenceStatuses.length > 0 || unresolvedReferences.length > 0;
    
    return {
      unmappedUsers: unmappedUsers.length,
      lowConfidenceStatuses: lowConfidenceStatuses.length,
      unresolvedReferences: unresolvedReferences.length,
      hasIssues,
      isReady: !hasIssues || (unmappedUsers.length === 0)
    };
  }, [userMappings, statusMappings, referenceMappings]);

  const taskValidationSummary = useMemo(() => {
    if (!state.adapterResult?.stages) return null;
    const stageMap = new Map(state.adapterResult.stages.map(s => [s.id, s.name]));
    return validateTaskEpicAssignments(state.adapterResult.stages, stageMap);
  }, [state.adapterResult?.stages]);

  const handleAutoMapUsers = useCallback(() => {
    const normalizeString = (str: string): string => {
      return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    };

    const fuzzyMatch = (a: string, b: string): number => {
      const normA = normalizeString(a);
      const normB = normalizeString(b);
      
      if (normA === normB) return 1;
      if (normA.includes(normB) || normB.includes(normA)) return 0.8;
      
      const words1 = a.toLowerCase().split(/[\s_\-@.]+/).filter(Boolean);
      const words2 = b.toLowerCase().split(/[\s_\-@.]+/).filter(Boolean);
      const matchingWords = words1.filter(w => words2.some(w2 => w2.includes(w) || w.includes(w2)));
      if (matchingWords.length > 0) {
        return 0.5 + (matchingWords.length / Math.max(words1.length, words2.length)) * 0.4;
      }
      
      return 0;
    };

    for (const mapping of userMappings) {
      if (mapping.mappedToId && mapping.action === 'map') continue;
      
      let bestMatch: { userId: string; userName: string; score: number } | null = null;
      
      const sourceStrings = [
        mapping.sourceName,
        mapping.sourceEmail,
        mapping.sourceId
      ].filter(Boolean) as string[];
      
      for (const user of systemUsers) {
        const userStrings = [
          user.name,
          user.email,
          user.firstName,
          user.lastName,
          `${user.firstName || ''} ${user.lastName || ''}`.trim()
        ].filter(Boolean) as string[];
        
        for (const sourceStr of sourceStrings) {
          for (const userStr of userStrings) {
            const score = fuzzyMatch(sourceStr, userStr);
            if (score > 0.5 && (!bestMatch || score > bestMatch.score)) {
              bestMatch = { userId: user.id, userName: user.name || user.email || user.id, score };
            }
          }
        }
      }
      
      if (bestMatch) {
        updateUserMapping(mapping.sourceId, bestMatch.userId, bestMatch.userName, 'map');
      }
    }
  }, [userMappings, systemUsers, updateUserMapping]);

  const tasksByAssignee = useMemo(() => {
    if (!state.adapterResult) return [];
    
    const tasks = state.adapterResult.stages.flatMap(s => s.tasks);
    const grouped: Record<string, { sourceName: string; mappedName?: string; mappedId?: string; count: number; confidence: ConfidenceLevel }> = {};
    
    tasks.forEach(task => {
      const sourceAssignee = (task as any).sourceAssigneeId;
      if (!sourceAssignee) {
        if (!grouped['unassigned']) {
          grouped['unassigned'] = { sourceName: 'Unassigned', count: 0, confidence: 'unmapped' };
        }
        grouped['unassigned'].count++;
        return;
      }
      
      const mapping = userMappings.find(m => m.sourceId === sourceAssignee);
      const key = sourceAssignee;
      
      if (!grouped[key]) {
        grouped[key] = {
          sourceName: mapping?.sourceName || sourceAssignee,
          mappedName: mapping?.mappedToName,
          mappedId: mapping?.mappedToId,
          count: 0,
          confidence: mapping?.confidence || 'unmapped'
        };
      }
      grouped[key].count++;
    });
    
    return Object.entries(grouped)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [state.adapterResult, userMappings]);

  const userSelectOptions: SearchableSelectOption[] = useMemo(() => {
    const options: SearchableSelectOption[] = [
      { value: 'unassigned', label: 'Leave unassigned' }
    ];
    systemUsers.forEach((user: any) => {
      options.push({
        value: user.id,
        label: user.name || user.email || user.id
      });
    });
    return options;
  }, [systemUsers]);

  const statusSelectOptions: SearchableSelectOption[] = useMemo(() => {
    return taskStatuses.map((status: any) => ({
      value: status.id,
      label: status.label
    }));
  }, [taskStatuses]);

  const unassignedTaskCount = useMemo(() => {
    const entry = tasksByAssignee.find(t => t.id === 'unassigned');
    return entry?.count || 0;
  }, [tasksByAssignee]);

  const teamAssignmentSummary = useMemo(() => {
    const mappedUsers = userMappings.filter(m => m.mappedToId && m.action === 'map');
    const byRole: Record<string, { users: typeof mappedUsers; count: number }> = {
      owner: { users: [], count: 0 },
      manager: { users: [], count: 0 },
      stakeholder: { users: [], count: 0 },
      member: { users: [], count: 0 },
      none: { users: [], count: 0 },
    };
    
    mappedUsers.forEach(m => {
      const roles = m.projectRoles || [];
      if (roles.length === 0) {
        byRole.none.users.push(m);
        byRole.none.count++;
      } else {
        roles.forEach(role => {
          if (byRole[role]) {
            byRole[role].users.push(m);
            byRole[role].count++;
          }
        });
      }
    });
    
    const totalMapped = mappedUsers.length;
    const totalWithRoles = totalMapped - byRole.none.count;
    
    return {
      byRole,
      totalMapped,
      totalWithRoles,
      hasOwner: byRole.owner.count > 0,
      hasManager: byRole.manager.count > 0,
    };
  }, [userMappings]);

  const [teamSummaryOpen, setTeamSummaryOpen] = useState(true);

  const defaultAssigneeOptions: SearchableSelectOption[] = useMemo(() => {
    const options: SearchableSelectOption[] = [
      { value: 'none', label: 'Leave unassigned' }
    ];
    
    const addedIds = new Set<string>();
    
    const mappedUsers = userMappings.filter(m => m.mappedToId && m.action === 'map');
    mappedUsers.forEach(m => {
      if (m.mappedToId && !addedIds.has(m.mappedToId)) {
        addedIds.add(m.mappedToId);
        options.push({
          value: m.mappedToId,
          label: `${m.mappedToName || m.mappedToId} (from import)`
        });
      }
    });
    
    const pmUsers = systemUsers.filter((u: any) => 
      u.jobTitle?.toLowerCase().includes('project manager') ||
      u.jobTitle?.toLowerCase().includes('pm') ||
      u.systemRole === 'manager'
    );
    pmUsers.forEach((user: any) => {
      if (!addedIds.has(user.id)) {
        addedIds.add(user.id);
        options.push({
          value: user.id,
          label: `${user.name || user.email} (Project Manager)`
        });
      }
    });
    
    const teamMembers = systemUsers.filter((u: any) => 
      u.systemRole === 'member' && !addedIds.has(u.id)
    );
    teamMembers.slice(0, 10).forEach((user: any) => {
      if (!addedIds.has(user.id)) {
        addedIds.add(user.id);
        options.push({
          value: user.id,
          label: `${user.name || user.email} (Team Member)`
        });
      }
    });
    
    return options;
  }, [userMappings, systemUsers]);

  const handleDefaultAssigneeChange = (userId: string) => {
    if (userId === 'none') {
      setDefaultUnassignedTo(null);
    } else {
      const user = systemUsers.find((u: any) => u.id === userId);
      setDefaultUnassignedTo(userId, user?.name || undefined);
    }
  };

  if (!state.isImportMode || !state.adapterResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Import Data</h1>
          <p className="text-muted-foreground mb-6">Please upload a file first to see the import summary.</p>
          <Button onClick={() => setLocation('/projects/import')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Upload
          </Button>
        </div>
      </div>
    );
  }

  const handleUserMappingChange = (sourceId: string, newMappedToId: string) => {
    if (newMappedToId === 'unassigned') {
      updateUserMapping(sourceId, null, undefined, 'unassigned');
    } else {
      const user = systemUsers.find((u: any) => u.id === newMappedToId);
      updateUserMapping(sourceId, newMappedToId, user?.name || undefined, 'map');
    }
  };

  const handleStatusMappingChange = (sourceStatus: string, newMappedStatusId: string) => {
    const status = taskStatuses.find((s: any) => s.id === newMappedStatusId);
    if (status) {
      updateStatusMapping(sourceStatus, status.label, status.id);
    }
  };

  const handleContinue = () => {
    setLocation('/projects/new');
  };

  const handleBack = () => {
    setLocation('/projects/import/team');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FileCheck className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-primary">Import Summary</h1>
          </div>
          <p className="text-muted-foreground">
            Review what was found in <span className="font-medium">{state.sourceFileName}</span> and verify the mappings before creating your project.
          </p>
        </div>

        {validationSummary.hasIssues && (
          <Card className="mb-6 border-amber-200 bg-amber-50/50">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Some items need attention</p>
                  <ul className="text-sm text-amber-700 mt-1 space-y-1">
                    {validationSummary.unmappedUsers > 0 && (
                      <li>{validationSummary.unmappedUsers} imported user(s) couldn't be matched to system users</li>
                    )}
                    {validationSummary.lowConfidenceStatuses > 0 && (
                      <li>{validationSummary.lowConfidenceStatuses} status(es) are using default fallback mappings</li>
                    )}
                    {validationSummary.unresolvedReferences > 0 && (
                      <li>{validationSummary.unresolvedReferences} entity reference(s) couldn't be resolved (e.g., project names, epic names)</li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Package className="h-4 w-4" />
                <span className="text-xs">Deliverables</span>
              </div>
              <p className="text-2xl font-bold">{stats?.deliverablesFound || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <FileBox className="h-4 w-4" />
                <span className="text-xs">Epics</span>
              </div>
              <p className="text-2xl font-bold">{stats?.epicsFound || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <ListTodo className="h-4 w-4" />
                <span className="text-xs">Tasks</span>
              </div>
              <p className="text-2xl font-bold">{stats?.tasksFound || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Target className="h-4 w-4" />
                <span className="text-xs">Milestones</span>
              </div>
              <p className="text-2xl font-bold">{stats?.milestonesFound || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs">Team Members</span>
              </div>
              <p className="text-2xl font-bold">{teamAssignmentSummary.totalMapped}</p>
            </CardContent>
          </Card>
        </div>

        {teamAssignmentSummary.totalMapped > 0 && (
          <Collapsible open={teamSummaryOpen} onOpenChange={setTeamSummaryOpen}>
            <Card className="mb-4 border-primary/30 bg-primary/5">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Team Assignment Preview</CardTitle>
                      {teamAssignmentSummary.totalWithRoles > 0 ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          {teamAssignmentSummary.totalWithRoles} will be added to project
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                          Assign roles to add to team
                        </Badge>
                      )}
                    </div>
                    {teamSummaryOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                  <CardDescription>
                    Users with project roles assigned below will automatically be added to the project team in the wizard.
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-amber-50 border-amber-200">
                      <Crown className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Owner</p>
                        <p className="text-lg font-bold text-amber-900">{teamAssignmentSummary.byRole.owner.count}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-purple-50 border-purple-200">
                      <Briefcase className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-purple-800">Manager</p>
                        <p className="text-lg font-bold text-purple-900">{teamAssignmentSummary.byRole.manager.count}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-blue-50 border-blue-200">
                      <Eye className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Stakeholders</p>
                        <p className="text-lg font-bold text-blue-900">{teamAssignmentSummary.byRole.stakeholder.count}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-green-50 border-green-200">
                      <Users className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Members</p>
                        <p className="text-lg font-bold text-green-900">{teamAssignmentSummary.byRole.member.count}</p>
                      </div>
                    </div>
                  </div>
                  
                  {teamAssignmentSummary.byRole.none.count > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">
                            {teamAssignmentSummary.byRole.none.count} user{teamAssignmentSummary.byRole.none.count !== 1 ? 's' : ''} mapped without a project role
                          </p>
                          <p className="text-xs text-amber-700 mt-1">
                            Assign project roles in the User Mappings section below to include them in the project team.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!teamAssignmentSummary.hasOwner && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                      <div className="flex items-start gap-2">
                        <Crown className="h-4 w-4 text-amber-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-800">No project owner assigned</p>
                          <p className="text-xs text-amber-700 mt-1">
                            Consider assigning an owner in the User Mappings section below.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Team Members:</p>
                    <div className="flex flex-wrap gap-2">
                      {teamAssignmentSummary.byRole.owner.users.map(u => (
                        <Badge key={u.sourceId} className="bg-amber-100 text-amber-800 border-amber-200">
                          <Crown className="h-3 w-3 mr-1" />
                          {u.mappedToName || u.sourceName}
                        </Badge>
                      ))}
                      {teamAssignmentSummary.byRole.manager.users.map(u => (
                        <Badge key={u.sourceId} className="bg-purple-100 text-purple-800 border-purple-200">
                          <Briefcase className="h-3 w-3 mr-1" />
                          {u.mappedToName || u.sourceName}
                        </Badge>
                      ))}
                      {teamAssignmentSummary.byRole.stakeholder.users.map(u => (
                        <Badge key={u.sourceId} className="bg-blue-100 text-blue-800 border-blue-200">
                          <Eye className="h-3 w-3 mr-1" />
                          {u.mappedToName || u.sourceName}
                        </Badge>
                      ))}
                      {teamAssignmentSummary.byRole.member.users.map(u => (
                        <Badge key={u.sourceId} className="bg-green-100 text-green-800 border-green-200">
                          <Users className="h-3 w-3 mr-1" />
                          {u.mappedToName || u.sourceName}
                        </Badge>
                      ))}
                      {teamAssignmentSummary.byRole.none.users.map(u => (
                        <Badge key={u.sourceId} variant="outline" className="text-muted-foreground">
                          {u.mappedToName || u.sourceName}
                          <span className="text-xs ml-1">(no role)</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        <div className="space-y-4">
          <Collapsible open={userMappingOpen} onOpenChange={setUserMappingOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <CardTitle className="text-lg">User Mappings</CardTitle>
                      <Badge variant="outline">{userMappings.length}</Badge>
                      {validationSummary.unmappedUsers > 0 && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                          {validationSummary.unmappedUsers} unmapped
                        </Badge>
                      )}
                    </div>
                    {userMappingOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                  <CardDescription>
                    Map imported users to existing system users. Unmapped users will have their tasks left unassigned.
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {userMappings.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No users found in import file</p>
                  ) : (
                    <>
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 p-3 bg-muted/30 rounded-lg border">
                        <div className="text-sm">
                          {validationSummary.unmappedUsers > 0 ? (
                            <>
                              <span className="font-medium">{validationSummary.unmappedUsers} user(s)</span>
                              <span className="text-muted-foreground"> need to be mapped to system users</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">All users are mapped. Assign project roles to include them in the team.</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {validationSummary.unmappedUsers > 0 && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={(e) => { e.stopPropagation(); handleAutoMapUsers(); }}
                              data-testid="auto-map-users-btn"
                            >
                              <Wand2 className="h-4 w-4 mr-2" />
                              Auto-Map Users
                            </Button>
                          )}
                          {teamAssignmentSummary.byRole.none.count > 0 && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setLocation('/projects/import/team');
                              }}
                              data-testid="assign-roles-btn"
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Assign Roles
                            </Button>
                          )}
                        </div>
                      </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Imported User</TableHead>
                          <TableHead>Confidence</TableHead>
                          <TableHead>Map To</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userMappings.map((mapping) => (
                          <TableRow key={mapping.sourceId} data-testid={`user-mapping-row-${mapping.sourceId}`}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{mapping.sourceName || mapping.sourceId}</p>
                                {mapping.sourceEmail && (
                                  <p className="text-xs text-muted-foreground">{mapping.sourceEmail}</p>
                                )}
                                {mapping.taskCount !== undefined && (
                                  <p className="text-xs text-muted-foreground">{mapping.taskCount} tasks assigned</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <ConfidenceBadge confidence={mapping.confidence} />
                            </TableCell>
                            <TableCell>
                              <SearchableSelect
                                value={mapping.mappedToId || 'unassigned'}
                                onValueChange={(val) => handleUserMappingChange(mapping.sourceId, val)}
                                options={userSelectOptions}
                                placeholder="Select user..."
                                searchPlaceholder="Search users..."
                                emptyMessage="No users found."
                                className="w-[220px]"
                                data-testid={`user-select-${mapping.sourceId}`}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    </>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Collapsible open={statusMappingOpen} onOpenChange={setStatusMappingOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="h-5 w-5" />
                      <CardTitle className="text-lg">Status Mappings</CardTitle>
                      <Badge variant="outline">{statusMappings.length}</Badge>
                      {validationSummary.lowConfidenceStatuses > 0 && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                          {validationSummary.lowConfidenceStatuses} low confidence
                        </Badge>
                      )}
                    </div>
                    {statusMappingOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                  <CardDescription>
                    Map imported task statuses to system statuses. This determines which stage tasks will be placed in.
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {statusMappings.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No statuses found in import file</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Imported Status</TableHead>
                          <TableHead></TableHead>
                          <TableHead>Target Status</TableHead>
                          <TableHead>Confidence</TableHead>
                          <TableHead>Change</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {statusMappings.map((mapping) => {
                          const targetStatus = taskStatuses.find((s: any) => 
                            s.id === mapping.mappedStatusId || s.label === mapping.mappedStatus
                          );
                          const targetColor = targetStatus?.color || 'bg-muted text-muted-foreground';
                          
                          return (
                            <TableRow key={mapping.sourceStatus} data-testid={`status-mapping-row-${mapping.sourceStatus}`}>
                              <TableCell>
                                <Badge variant="outline" className="font-mono">{mapping.sourceStatus}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <ArrowRight className="h-4 w-4 text-muted-foreground inline" />
                              </TableCell>
                              <TableCell>
                                <Badge className={`font-normal ${targetColor}`}>
                                  {mapping.mappedStatus || 'Not mapped'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <ConfidenceBadge confidence={mapping.confidence} />
                              </TableCell>
                              <TableCell>
                                <SearchableSelect
                                  value={mapping.mappedStatusId || ''}
                                  onValueChange={(val) => handleStatusMappingChange(mapping.sourceStatus, val)}
                                  options={statusSelectOptions}
                                  placeholder="Select..."
                                  searchPlaceholder="Search statuses..."
                                  emptyMessage="No statuses found."
                                  className="w-[180px]"
                                  data-testid={`status-select-${mapping.sourceStatus}`}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {referenceMappings.length > 0 && (
            <Collapsible open={referenceMappingOpen} onOpenChange={setReferenceMappingOpen}>
              <Card className={validationSummary.unresolvedReferences > 0 ? "border-amber-200 bg-amber-50/30" : ""}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-5 w-5" />
                        <CardTitle className="text-lg">Reference Mappings</CardTitle>
                        <Badge variant="outline">{referenceMappings.length}</Badge>
                        {validationSummary.unresolvedReferences > 0 && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                            {validationSummary.unresolvedReferences} unresolved
                          </Badge>
                        )}
                        {referenceStats && (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            {referenceStats.resolvedByIdMatch + referenceStats.resolvedByExactName + referenceStats.resolvedByPartialName + referenceStats.resolvedByFuzzyName} resolved
                          </Badge>
                        )}
                      </div>
                      {referenceMappingOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                    <CardDescription>
                      Entity references were automatically matched to imported entities. Review the mappings below organized by source type.
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    {referenceStats && (
                      <div className="mb-4 p-3 bg-muted/30 rounded-lg border grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-semibold text-lg">{referenceStats.totalReferencesProcessed}</p>
                          <p className="text-muted-foreground text-xs">Total References</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-lg text-green-600">{referenceStats.resolvedByIdMatch}</p>
                          <p className="text-muted-foreground text-xs">By ID Match</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-lg text-green-600">{referenceStats.resolvedByExactName}</p>
                          <p className="text-muted-foreground text-xs">Exact Name</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-lg text-amber-600">{referenceStats.resolvedByPartialName + referenceStats.resolvedByFuzzyName}</p>
                          <p className="text-muted-foreground text-xs">Fuzzy Match</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-lg text-red-600">{referenceStats.unresolved}</p>
                          <p className="text-muted-foreground text-xs">Unresolved</p>
                        </div>
                      </div>
                    )}
                    <Tabs defaultValue="epics" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="epics" className="flex items-center gap-2">
                          Epic References
                          <Badge variant="secondary" className="ml-1">
                            {referenceMappings.filter(m => m.sourceEntityType === 'Epic').length}
                          </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="tasks" className="flex items-center gap-2">
                          Task References
                          <Badge variant="secondary" className="ml-1">
                            {referenceMappings.filter(m => m.sourceEntityType === 'Task').length}
                          </Badge>
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="epics" className="mt-4">
                        <ReferenceMappingTable
                          mappings={referenceMappings.filter(m => m.sourceEntityType === 'Epic')}
                          entityOptions={entityOptions}
                          onMappingChange={handleReferenceMappingChange}
                        />
                      </TabsContent>
                      <TabsContent value="tasks" className="mt-4">
                        <ReferenceMappingTable
                          mappings={referenceMappings.filter(m => m.sourceEntityType === 'Task')}
                          entityOptions={entityOptions}
                          onMappingChange={handleReferenceMappingChange}
                        />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {(importedEntities.deliverables.length > 0 || importedEntities.tasks.length > 0) && (
            <Collapsible open={relationshipPreviewOpen} onOpenChange={setRelationshipPreviewOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        <CardTitle className="text-lg">Relationship Preview</CardTitle>
                        <Badge variant="outline">
                          {importedEntities.deliverables.length} deliverables, {importedEntities.epics.length} epics, {importedEntities.tasks.length} tasks
                        </Badge>
                      </div>
                      {relationshipPreviewOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                    <CardDescription>
                      Preview how imported entities will be organized after applying reference mappings.
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <Tabs defaultValue="hierarchy" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="hierarchy" className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span className="hidden sm:inline">Work Breakdown</span>
                          <Badge variant="secondary" className="ml-1">
                            {importedEntities.deliverables.length}
                          </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="stages" className="flex items-center gap-2">
                          <Layers className="h-4 w-4" />
                          <span className="hidden sm:inline">Stages</span>
                          <Badge variant="secondary" className="ml-1">
                            {importedEntities.stages.length}
                          </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="sprints" className="flex items-center gap-2">
                          <ArrowRightLeft className="h-4 w-4" />
                          <span className="hidden sm:inline">Sprints</span>
                          <Badge variant="secondary" className="ml-1">
                            {importedEntities.sprints.length}
                          </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="milestones" className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          <span className="hidden sm:inline">Milestones</span>
                          <Badge variant="secondary" className="ml-1">
                            {importedEntities.milestones.length}
                          </Badge>
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="hierarchy" className="mt-4">
                        <RelationshipHierarchyPreview 
                          deliverables={importedEntities.deliverables}
                          epics={importedEntities.epics}
                          tasks={importedEntities.tasks}
                          referenceMappings={referenceMappings}
                        />
                      </TabsContent>
                      
                      <TabsContent value="stages" className="mt-4">
                        <EntityTaskPreview
                          entities={importedEntities.stages}
                          tasks={importedEntities.tasks}
                          entityType="stage"
                          entityLabel="Stage"
                          fieldName="stageId"
                          referenceMappings={referenceMappings}
                        />
                      </TabsContent>
                      
                      <TabsContent value="sprints" className="mt-4">
                        <EntityTaskPreview
                          entities={importedEntities.sprints}
                          tasks={importedEntities.tasks}
                          entityType="sprint"
                          entityLabel="Sprint"
                          fieldName="sprintId"
                          referenceMappings={referenceMappings}
                        />
                      </TabsContent>
                      
                      <TabsContent value="milestones" className="mt-4">
                        <EntityTaskPreview
                          entities={importedEntities.milestones}
                          tasks={importedEntities.tasks}
                          entityType="milestone"
                          entityLabel="Milestone"
                          fieldName="milestoneId"
                          referenceMappings={referenceMappings}
                        />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {taskValidationSummary && taskValidationSummary.totalTasks > 0 && (
            <TaskValidationPanel summary={taskValidationSummary} />
          )}

          {unassignedTaskCount > 0 && (
            <Collapsible open={unassignedOpen} onOpenChange={setUnassignedOpen}>
              <Card className="border-blue-200 bg-blue-50/30">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-lg">Unassigned Tasks</CardTitle>
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                          {unassignedTaskCount} tasks
                        </Badge>
                      </div>
                      {unassignedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                    <CardDescription>
                      Some tasks don't have an assignee. Choose a default person to assign them to.
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Assign all unassigned tasks to:</p>
                        <p className="text-xs text-muted-foreground">
                          This will set a default assignee for {unassignedTaskCount} task{unassignedTaskCount !== 1 ? 's' : ''} that came in without an owner.
                        </p>
                      </div>
                      <SearchableSelect
                        value={state.defaultUnassignedTo?.userId || 'none'}
                        onValueChange={handleDefaultAssigneeChange}
                        options={defaultAssigneeOptions}
                        placeholder="Select default assignee..."
                        searchPlaceholder="Search users..."
                        emptyMessage="No users found."
                        className="w-[280px]"
                        data-testid="default-assignee-select"
                      />
                    </div>
                    {state.defaultUnassignedTo && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {unassignedTaskCount} task{unassignedTaskCount !== 1 ? 's' : ''} will be assigned to {state.defaultUnassignedTo.userName}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          <Collapsible open={taskPreviewOpen} onOpenChange={setTaskPreviewOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      <CardTitle className="text-lg">Task Assignment Preview</CardTitle>
                      <Badge variant="outline">{stats?.tasksFound || 0} tasks</Badge>
                    </div>
                    {taskPreviewOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                  <CardDescription>
                    Preview how tasks will be assigned to users based on your mappings above.
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {tasksByAssignee.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No tasks found in import file</p>
                  ) : (
                    <div className="space-y-3">
                      {tasksByAssignee.map(({ id, sourceName, mappedName, mappedId, count, confidence }) => (
                        <div key={id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg" data-testid={`task-preview-${id}`}>
                          <div className="flex items-center gap-3">
                            <ConfidenceIcon confidence={confidence} />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{sourceName}</span>
                                {mappedId && (
                                  <>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-primary font-medium">{mappedName}</span>
                                  </>
                                )}
                                {!mappedId && id !== 'unassigned' && (
                                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                                    Will be unassigned
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge variant="secondary">{count} task{count !== 1 ? 's' : ''}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>

        <Separator className="my-8" />

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack} data-testid="back-to-team-btn">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Team Assignment
          </Button>
          <Button onClick={handleContinue} data-testid="continue-to-wizard-btn">
            Continue to Project Setup
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
