import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import * as XLSX from "xlsx";
import * as yaml from "js-yaml";
import { saveAs } from "file-saver";
import { Shell } from "@/components/layout/shell";
import { 
  Download, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  Database,
  Info,
  FileJson,
  FileCode,
  Users,
  LayoutTemplate,
  Settings,
  Briefcase,
  AlertCircle,
  FileWarning,
  Loader2,
  X,
  Filter,
  ChevronDown,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter
} from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import all mock data
import { db } from "@/lib/storage";

// Schema Definitions - uses camelCase to match API response format
// Complete schema with ALL attributes from shared/schema.ts
const SCHEMA_DEFINITIONS = {
  all: [
    // Core Project Entities
    { sheet: "Projects", columns: ["id", "name", "description", "status", "startDate", "deadline", "progress", "frameworkId", "defaultMappingTemplateId", "permissions", "sprintDurationWeeks", "ownerId", "client", "riskLevel", "externalRefs"] },
    { sheet: "Deliverables", columns: ["id", "projectId", "title", "description", "status", "ownerId", "startDate", "dueDate", "progress", "externalRefs"] },
    { sheet: "Epics", columns: ["id", "deliverableId", "title", "description", "status", "ownerId", "startDate", "endDate", "progress", "stageIds", "externalRefs"] },
    { sheet: "ProjectStages", columns: ["id", "projectId", "name", "description", "order", "type", "status", "startDate", "endDate"] },
    { sheet: "Tasks", columns: ["id", "title", "description", "project", "projectId", "stageId", "epicId", "status", "assigneeId", "deadline", "priority", "milestoneId", "sprintId", "estimateHours", "effort", "tags", "blocked", "blockerReason", "updatedAt", "taskTypeId", "parentTaskId", "externalRefs"] },
    { sheet: "Milestones", columns: ["id", "projectId", "name", "description", "phase", "stageId", "targetDate", "status", "ownerId", "scopeType", "completionMode", "completionTargetPercent", "tags", "createdAt", "updatedAt", "progressTotalTasks", "progressCompletedTasks", "progressPercentComplete", "progressLastCalculatedAt", "progressPercent", "isBillingGate", "requiredCompletionRatio"] },
    { sheet: "MilestoneScopeRules", columns: ["id", "milestoneId", "rules", "lastEvaluatedAt"] },
    { sheet: "MilestoneTaskLinks", columns: ["id", "milestoneId", "taskId", "projectId", "source", "ruleId", "locked", "createdAt", "updatedAt"] },
    // Sprint Entities
    { sheet: "Sprints", columns: ["id", "projectId", "ownerUserId", "name", "goal", "startDate", "endDate", "status", "capacityHours", "notes", "autoStart", "closedAt", "createdAt", "updatedAt"] },
    { sheet: "SprintMembers", columns: ["id", "sprintId", "userId", "capacityHours", "capacityPoints"] },
    { sheet: "SprintScopeEvents", columns: ["id", "sprintId", "taskId", "userId", "eventType", "occurredAt", "note"] },
    { sheet: "SprintScopeTargets", columns: ["id", "sprintId", "targetType", "targetId", "autoSyncTasks", "createdAt"] },
    { sheet: "SprintPulseUpdates", columns: ["id", "sprintId", "userId", "date", "didText", "nextText", "blockersText", "referencedTaskIds", "createdAt", "updatedAt"] },
    // Task Related
    { sheet: "TaskDependencies", columns: ["id", "taskId", "dependsOnTaskId", "dependencyType", "createdAt"] },
    { sheet: "TaskTypes", columns: ["id", "name", "color", "icon", "isDefault", "order", "createdAt"] },
    { sheet: "ProjectTaskTypes", columns: ["id", "projectId", "taskTypeId", "name", "color", "icon", "isEnabled", "isDefault", "order", "createdAt"] },
    { sheet: "ProjectTaskStatuses", columns: ["id", "projectId", "label", "color", "isDefault", "order", "createdAt"] },
    { sheet: "ProjectSettings", columns: ["id", "projectId", "useCustomStatuses", "useCustomTaskTypes", "updatedAt"] },
    // Activity & Comments
    { sheet: "Activity", columns: ["id", "user", "action", "target", "time", "details", "avatar"] },
    { sheet: "Comments", columns: ["id", "taskId", "authorId", "authorName", "body", "createdAt"] },
    { sheet: "Attachments", columns: ["id", "taskId", "fileName", "url", "fileType", "size", "uploadedAt", "uploadedBy"] },
    { sheet: "History", columns: ["id", "taskId", "field", "oldValue", "newValue", "changedAt", "changedBy"] },
    // Views & Guidance
    { sheet: "SavedViews", columns: ["id", "name", "description", "stageIds", "viewType", "visibility", "isDefault", "config"] },
    { sheet: "GuidanceItems", columns: ["id", "title", "body", "priority", "stageId"] },
    // Templates
    { sheet: "ProjectTemplates", columns: ["id", "name", "description", "defaultFrameworkId", "defaultRoles", "defaultDeliverables", "thumbnail"] },
    { sheet: "FrameworkTemplates", columns: ["id", "name", "description", "defaultStages"] },
    { sheet: "StageTemplates", columns: ["id", "name", "description", "defaultTasks", "defaultRoles", "entryCriteria", "exitCriteria", "allowedTaskStatuses"] },
    { sheet: "DeliverableTemplates", columns: ["id", "title", "description", "defaultEpics"] },
    { sheet: "EpicTemplates", columns: ["id", "title", "description", "defaultStages"] },
    { sheet: "TaskTemplates", columns: ["id", "title", "description", "defaultPriority", "defaultEstimateHours", "requiredRole", "assignedRoleId", "scope", "assigneeRoleTypeId"] },
    { sheet: "RoleTemplates", columns: ["id", "name", "description", "defaultRoleType", "defaultPermissions"] },
    { sheet: "MilestoneTemplates", columns: ["id", "name", "description", "phase", "scopeType", "completionMode", "completionTargetPercent", "isBillingGate", "offsetDays"] },
    { sheet: "TemplateSnippets", columns: ["id", "name", "description", "type", "stageTemplateIds", "taskTemplateIds", "milestoneTemplateIds", "isDefault"] },
    // Defaults & Config
    { sheet: "StatusOptions", columns: ["id", "label", "color", "isDefault", "type", "order"] },
    { sheet: "RoleTypes", columns: ["id", "label", "description", "isDefault"] },
    { sheet: "MappingTemplates", columns: ["id", "name", "dataType"] },
    { sheet: "EpicTypes", columns: ["id", "name", "color", "icon", "isDefault", "order", "createdAt"] },
    { sheet: "DeliverableTypes", columns: ["id", "name", "color", "icon", "isDefault", "order", "createdAt"] },
    // Users & Roles
    { sheet: "Users", columns: ["id", "name", "role", "email", "status", "avatar"] },
    { sheet: "ProjectRoles", columns: ["id", "name", "description", "roleType", "isRequired", "maxAssignees", "permissions"] },
    { sheet: "RoleAssignments", columns: ["id", "roleId", "userId", "isPrimary", "allocationPercent"] },
    { sheet: "UserRoleEligibility", columns: ["id", "userId", "roleTypeId"] },
    { sheet: "UserPreferences", columns: ["id", "userId", "workdayStartTime", "workdayEndTime", "defaultTargetDailyMinutes", "showOnlyActionable", "timezone"] },
    { sheet: "ProjectFavorites", columns: ["id", "userId", "projectId", "createdAt"] },
    // Planning
    { sheet: "WorkBlocks", columns: ["id", "userId", "date", "startTime", "endTime", "label", "taskIds", "totalPlannedMinutes", "status", "createdAt", "updatedAt"] },
    { sheet: "DayPlans", columns: ["id", "userId", "date", "targetWorkMinutes", "plannedMinutes", "unassignedTaskIds", "createdAt", "updatedAt"] }
  ],
  projects: [
    { sheet: "Projects", columns: ["id", "name", "description", "status", "startDate", "deadline", "progress", "frameworkId", "defaultMappingTemplateId", "permissions", "sprintDurationWeeks", "ownerId", "client", "riskLevel", "externalRefs"] },
    { sheet: "Deliverables", columns: ["id", "projectId", "title", "description", "status", "ownerId", "startDate", "dueDate", "progress", "externalRefs"] },
    { sheet: "Epics", columns: ["id", "deliverableId", "title", "description", "status", "ownerId", "startDate", "endDate", "progress", "stageIds", "externalRefs"] },
    { sheet: "ProjectStages", columns: ["id", "projectId", "name", "description", "order", "type", "status", "startDate", "endDate"] },
    { sheet: "Tasks", columns: ["id", "title", "description", "project", "projectId", "stageId", "epicId", "status", "assigneeId", "deadline", "priority", "milestoneId", "sprintId", "estimateHours", "effort", "tags", "blocked", "blockerReason", "updatedAt", "taskTypeId", "parentTaskId", "externalRefs"] },
    { sheet: "Milestones", columns: ["id", "projectId", "name", "description", "phase", "stageId", "targetDate", "status", "ownerId", "scopeType", "completionMode", "completionTargetPercent", "tags", "createdAt", "updatedAt", "progressTotalTasks", "progressCompletedTasks", "progressPercentComplete", "progressLastCalculatedAt", "progressPercent", "isBillingGate", "requiredCompletionRatio"] },
    { sheet: "MilestoneScopeRules", columns: ["id", "milestoneId", "rules", "lastEvaluatedAt"] },
    { sheet: "MilestoneTaskLinks", columns: ["id", "milestoneId", "taskId", "projectId", "source", "ruleId", "locked", "createdAt", "updatedAt"] },
    { sheet: "Sprints", columns: ["id", "projectId", "ownerUserId", "name", "goal", "startDate", "endDate", "status", "capacityHours", "notes", "autoStart", "closedAt", "createdAt", "updatedAt"] },
    { sheet: "SprintMembers", columns: ["id", "sprintId", "userId", "capacityHours", "capacityPoints"] },
    { sheet: "SprintScopeEvents", columns: ["id", "sprintId", "taskId", "userId", "eventType", "occurredAt", "note"] },
    { sheet: "SprintScopeTargets", columns: ["id", "sprintId", "targetType", "targetId", "autoSyncTasks", "createdAt"] },
    { sheet: "SprintPulseUpdates", columns: ["id", "sprintId", "userId", "date", "didText", "nextText", "blockersText", "referencedTaskIds", "createdAt", "updatedAt"] },
    { sheet: "TaskDependencies", columns: ["id", "taskId", "dependsOnTaskId", "dependencyType", "createdAt"] },
    { sheet: "ProjectTaskTypes", columns: ["id", "projectId", "taskTypeId", "name", "color", "icon", "isEnabled", "isDefault", "order", "createdAt"] },
    { sheet: "ProjectTaskStatuses", columns: ["id", "projectId", "label", "color", "isDefault", "order", "createdAt"] },
    { sheet: "ProjectSettings", columns: ["id", "projectId", "useCustomStatuses", "useCustomTaskTypes", "updatedAt"] },
    { sheet: "Activity", columns: ["id", "user", "action", "target", "time", "details", "avatar"] },
    { sheet: "Comments", columns: ["id", "taskId", "authorId", "authorName", "body", "createdAt"] },
    { sheet: "Attachments", columns: ["id", "taskId", "fileName", "url", "fileType", "size", "uploadedAt", "uploadedBy"] },
    { sheet: "History", columns: ["id", "taskId", "field", "oldValue", "newValue", "changedAt", "changedBy"] }
  ],
  templates: [
    { sheet: "ProjectTemplates", columns: ["id", "name", "description", "defaultFrameworkId", "defaultRoles", "defaultDeliverables", "thumbnail"] },
    { sheet: "FrameworkTemplates", columns: ["id", "name", "description", "defaultStages"] },
    { sheet: "StageTemplates", columns: ["id", "name", "description", "defaultTasks", "defaultRoles", "entryCriteria", "exitCriteria", "allowedTaskStatuses"] },
    { sheet: "DeliverableTemplates", columns: ["id", "title", "description", "defaultEpics"] },
    { sheet: "EpicTemplates", columns: ["id", "title", "description", "defaultStages"] },
    { sheet: "TaskTemplates", columns: ["id", "title", "description", "defaultPriority", "defaultEstimateHours", "requiredRole", "assignedRoleId", "scope", "assigneeRoleTypeId"] },
    { sheet: "RoleTemplates", columns: ["id", "name", "description", "defaultRoleType", "defaultPermissions"] },
    { sheet: "MilestoneTemplates", columns: ["id", "name", "description", "phase", "scopeType", "completionMode", "completionTargetPercent", "isBillingGate", "offsetDays"] },
    { sheet: "TemplateSnippets", columns: ["id", "name", "description", "type", "stageTemplateIds", "taskTemplateIds", "milestoneTemplateIds", "isDefault"] }
  ],
  defaults: [
    { sheet: "StatusOptions", columns: ["id", "label", "color", "isDefault", "type", "order"] },
    { sheet: "RoleTypes", columns: ["id", "label", "description", "isDefault"] },
    { sheet: "MappingTemplates", columns: ["id", "name", "dataType"] },
    { sheet: "GuidanceItems", columns: ["id", "title", "body", "priority", "stageId"] },
    { sheet: "SavedViews", columns: ["id", "name", "description", "stageIds", "viewType", "visibility", "isDefault", "config"] },
    { sheet: "TaskTypes", columns: ["id", "name", "color", "icon", "isDefault", "order", "createdAt"] },
    { sheet: "EpicTypes", columns: ["id", "name", "color", "icon", "isDefault", "order", "createdAt"] },
    { sheet: "DeliverableTypes", columns: ["id", "name", "color", "icon", "isDefault", "order", "createdAt"] }
  ],
  users: [
    { sheet: "Users", columns: ["id", "name", "role", "email", "status", "avatar"] },
    { sheet: "ProjectRoles", columns: ["id", "name", "description", "roleType", "isRequired", "maxAssignees", "permissions"] },
    { sheet: "RoleAssignments", columns: ["id", "roleId", "userId", "isPrimary", "allocationPercent"] },
    { sheet: "UserRoleEligibility", columns: ["id", "userId", "roleTypeId"] },
    { sheet: "UserPreferences", columns: ["id", "userId", "workdayStartTime", "workdayEndTime", "defaultTargetDailyMinutes", "showOnlyActionable", "timezone"] },
    { sheet: "ProjectFavorites", columns: ["id", "userId", "projectId", "createdAt"] },
    { sheet: "WorkBlocks", columns: ["id", "userId", "date", "startTime", "endTime", "label", "taskIds", "totalPlannedMinutes", "status", "createdAt", "updatedAt"] },
    { sheet: "DayPlans", columns: ["id", "userId", "date", "targetWorkMinutes", "plannedMinutes", "unassignedTaskIds", "createdAt", "updatedAt"] }
  ]
};

type ImportPreviewData = {
  entityName: string;
  count: number;
  sample: any[];
  errors: string[];
  existingCount: number;
  newCount: number;
  existingIds: string[];
};

type ImportState = {
  file: File | null;
  data: Record<string, any[]> | null;
  preview: ImportPreviewData[];
  isProcessing: boolean;
  isImporting: boolean;
  importProgress: number;
  errors: string[];
  hasConflicts: boolean;
  totalExisting: number;
  totalNew: number;
};

const ENTITY_TO_COLLECTION: Record<string, string> = {
  // Core Entities
  Projects: "projects",
  Deliverables: "deliverables",
  Epics: "epics",
  ProjectStages: "projectStages",
  Tasks: "tasks",
  Milestones: "milestones",
  MilestoneScopeRules: "milestoneScopeRules",
  MilestoneTaskLinks: "milestoneTaskLinks",
  // Sprint Entities
  Sprints: "sprints",
  SprintMembers: "sprintMembers",
  SprintScopeEvents: "sprintScopeEvents",
  SprintScopeTargets: "sprintScopeTargets",
  SprintPulseUpdates: "sprintPulseUpdates",
  // Task Related
  TaskDependencies: "taskDependencies",
  TaskTypes: "taskTypes",
  EpicTypes: "epicTypes",
  DeliverableTypes: "deliverableTypes",
  ProjectTaskTypes: "projectTaskTypes",
  ProjectTaskStatuses: "projectTaskStatuses",
  ProjectSettings: "projectSettings",
  // Activity & Comments
  Activity: "activity",
  Comments: "comments",
  Attachments: "attachments",
  History: "history",
  // Views & Guidance
  SavedViews: "savedViews",
  GuidanceItems: "guidanceItems",
  // Templates
  ProjectTemplates: "projectTemplates",
  FrameworkTemplates: "frameworkTemplates",
  StageTemplates: "stageTemplates",
  DeliverableTemplates: "deliverableTemplates",
  EpicTemplates: "epicTemplates",
  TaskTemplates: "taskTemplates",
  RoleTemplates: "roleTemplates",
  MilestoneTemplates: "milestoneTemplates",
  TemplateSnippets: "templateSnippets",
  // Defaults & Config
  StatusOptions: "statusOptions",
  RoleTypes: "roleTypes",
  MappingTemplates: "mappingTemplates",
  // Users & Roles
  Users: "users",
  ProjectRoles: "projectRoles",
  RoleAssignments: "roleAssignments",
  UserRoleEligibility: "userRoleEligibility",
  UserPreferences: "userPreferences",
  ProjectFavorites: "projectFavorites",
  // Planning
  WorkBlocks: "workBlocks",
  DayPlans: "dayPlans"
};

const DEFAULT_STATUS_VALUES: Record<string, string> = {
  projects: "Not Started",
  tasks: "Not Started",
  deliverables: "Not Started",
  epics: "Not Started",
  milestones: "Pending"
};

const applyDefaultsForNewRecord = (record: any, entityName: string): any => {
  const now = new Date().toISOString();
  const updated = { ...record };
  
  if (!updated.createdAt && !updated.created_at) {
    updated.createdAt = now;
  }
  if (!updated.updatedAt && !updated.updated_at) {
    updated.updatedAt = now;
  }
  
  const collection = ENTITY_TO_COLLECTION[entityName]?.toLowerCase();
  if (collection && DEFAULT_STATUS_VALUES[collection] && !updated.status) {
    updated.status = DEFAULT_STATUS_VALUES[collection];
  }
  
  if ((collection === "projects" || collection === "deliverables" || collection === "epics") && 
      updated.progress === undefined) {
    updated.progress = 0;
  }
  
  return updated;
};

interface AdminImportExportProps {
  embedded?: boolean;
}

export default function AdminImportExport({ embedded = false }: AdminImportExportProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [exportFormat, setExportFormat] = useState<"xlsx" | "json" | "yaml">("xlsx");
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSchema, setShowSchema] = useState(false);
  const [useNestedExport, setUseNestedExport] = useState(false);
  const [importState, setImportState] = useState<ImportState>({
    file: null,
    data: null,
    preview: [],
    isProcessing: false,
    isImporting: false,
    importProgress: 0,
    errors: [],
    hasConflicts: false,
    totalExisting: 0,
    totalNew: 0
  });
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [selectiveExportEnabled, setSelectiveExportEnabled] = useState(false);
  const [templateFormat, setTemplateFormat] = useState<"xlsx" | "json">("xlsx");

  useEffect(() => {
    const loadProjects = async () => {
      const projects = await db.getAll("projects");
      setAvailableProjects(projects);
      setSelectedProjectIds(new Set(projects.map((p: any) => p.id)));
    };
    if (activeTab === "projects" || activeTab === "all") {
      loadProjects();
    }
  }, [activeTab]);

  const parseJsonValue = (value: any): any => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'object') return parsed;
      } catch {
        return value;
      }
    }
    return value;
  };

  const deserialize = (data: any[]): any[] => {
    return data.map(item => {
      const newItem: any = {};
      Object.keys(item).forEach(key => {
        newItem[key] = parseJsonValue(item[key]);
      });
      return newItem;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportState(prev => ({ ...prev, file, isProcessing: true, errors: [], preview: [], data: null }));

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let parsedData: Record<string, any[]> = {};

      if (ext === 'xlsx' || ext === 'xls') {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        wb.SheetNames.forEach(sheetName => {
          const ws = wb.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(ws);
          if (jsonData.length > 0) {
            parsedData[sheetName] = deserialize(jsonData);
          }
        });
      } else if (ext === 'json') {
        const text = await file.text();
        const json = JSON.parse(text);
        if (json.projects && Array.isArray(json.projects)) {
          parsedData = flattenNestedImport(json);
        } else {
          parsedData = json;
        }
      } else if (ext === 'yaml' || ext === 'yml') {
        const text = await file.text();
        const parsed = yaml.load(text) as any;
        if (parsed.projects && Array.isArray(parsed.projects)) {
          parsedData = flattenNestedImport(parsed);
        } else {
          parsedData = parsed;
        }
      } else {
        throw new Error('Unsupported file format');
      }

      const preview: ImportPreviewData[] = [];
      const globalErrors: string[] = [];
      let totalExisting = 0;
      let totalNew = 0;

      for (const [entityName, records] of Object.entries(parsedData)) {
        if (!Array.isArray(records)) continue;
        
        const entityErrors: string[] = [];
        const collection = ENTITY_TO_COLLECTION[entityName];
        
        if (!collection) {
          entityErrors.push(`Unknown entity: ${entityName}`);
          preview.push({
            entityName,
            count: records.length,
            sample: records.slice(0, 3),
            errors: entityErrors,
            existingCount: 0,
            newCount: records.length,
            existingIds: []
          });
          continue;
        }

        const existingIds: string[] = [];
        const existingData = await db.getAll(collection as any);
        const existingIdSet = new Set(existingData.map((item: any) => item.id));
        
        for (const record of records) {
          if (record.id && existingIdSet.has(record.id)) {
            existingIds.push(record.id);
          }
        }

        const existingCount = existingIds.length;
        const newCount = records.length - existingCount;
        totalExisting += existingCount;
        totalNew += newCount;

        preview.push({
          entityName,
          count: records.length,
          sample: records.slice(0, 3),
          errors: entityErrors,
          existingCount,
          newCount,
          existingIds
        });

        if (entityErrors.length > 0) {
          globalErrors.push(...entityErrors);
        }
      }

      setImportState(prev => ({
        ...prev,
        data: parsedData,
        preview,
        errors: globalErrors,
        isProcessing: false,
        hasConflicts: totalExisting > 0,
        totalExisting,
        totalNew
      }));

    } catch (error: any) {
      setImportState(prev => ({
        ...prev,
        isProcessing: false,
        errors: [error.message || 'Failed to parse file']
      }));
      toast({
        title: "Parse Error",
        description: error.message || "Failed to parse the import file.",
        variant: "destructive"
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const flattenNestedImport = (nested: any): Record<string, any[]> => {
    const flat: Record<string, any[]> = {
      Projects: [],
      Deliverables: [],
      Epics: [],
      Tasks: [],
      Milestones: [],
      MilestoneScopeRules: [],
      MilestoneTaskLinks: [],
      ProjectStages: [],
      Sprints: [],
      Comments: [],
      Attachments: [],
      History: []
    };

    const referencedSprintIds = new Set<string>();
    const existingSprintIds = new Set<string>();
    const referencedStageIds = new Set<string>();
    const existingStageIds = new Set<string>();
    const projectDatesMap = new Map<string, { startDate: string; deadline: string }>();

    if (nested.projects && Array.isArray(nested.projects)) {
      nested.projects.forEach((project: any) => {
        const { deliverables, milestones, stages, sprints, ...projectData } = project;
        flat.Projects.push(projectData);
        
        projectDatesMap.set(project.id, {
          startDate: project.startDate || new Date().toISOString().split('T')[0],
          deadline: project.deadline || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });

        if (Array.isArray(stages)) {
          stages.forEach((stage: any) => {
            existingStageIds.add(stage.id);
            flat.ProjectStages.push(stage);
          });
        }

        if (Array.isArray(sprints)) {
          sprints.forEach((sprint: any) => {
            existingSprintIds.add(sprint.id);
            flat.Sprints.push(sprint);
          });
        }

        if (Array.isArray(milestones)) {
          milestones.forEach((milestone: any) => {
            const { scopeRules, scope_rules, taskLinks, task_links, ...milestoneData } = milestone;
            flat.Milestones.push(milestoneData);
            const rules = scopeRules || scope_rules;
            const links = taskLinks || task_links;
            if (Array.isArray(rules)) {
              flat.MilestoneScopeRules.push(...rules);
            }
            if (Array.isArray(links)) {
              flat.MilestoneTaskLinks.push(...links);
            }
          });
        }

        if (Array.isArray(deliverables)) {
          deliverables.forEach((deliverable: any) => {
            const { epics, ...deliverableData } = deliverable;
            flat.Deliverables.push(deliverableData);

            if (Array.isArray(epics)) {
              epics.forEach((epic: any) => {
                const { tasks, ...epicData } = epic;
                if (epicData.stageIds && Array.isArray(epicData.stageIds)) {
                  epicData.stageIds.forEach((id: string) => referencedStageIds.add(id));
                }
                flat.Epics.push(epicData);

                if (Array.isArray(tasks)) {
                  tasks.forEach((task: any) => {
                    const { comments, attachments, history, ...taskData } = task;
                    
                    if (taskData.sprintId) {
                      referencedSprintIds.add(taskData.sprintId);
                    }
                    if (taskData.stageId) {
                      referencedStageIds.add(taskData.stageId);
                    }
                    
                    const normalizedTask = {
                      ...taskData,
                      blocked: taskData.blocked ?? false,
                      blockerReason: taskData.blockerReason ?? null,
                      taskTypeId: taskData.taskTypeId ?? null,
                      parentTaskId: taskData.parentTaskId ?? null
                    };
                    flat.Tasks.push(normalizedTask);
                    
                    if (Array.isArray(comments)) {
                      flat.Comments.push(...comments);
                    }
                    if (Array.isArray(attachments)) {
                      flat.Attachments.push(...attachments);
                    }
                    if (Array.isArray(history)) {
                      flat.History.push(...history);
                    }
                  });
                }
              });
            }
          });
        }
      });
    }

    referencedSprintIds.forEach(sprintId => {
      if (!existingSprintIds.has(sprintId)) {
        const taskWithSprint = flat.Tasks.find((t: any) => t.sprintId === sprintId);
        const projectId = taskWithSprint?.projectId || flat.Projects[0]?.id;
        const projectDates = projectDatesMap.get(projectId) || {
          startDate: new Date().toISOString().split('T')[0],
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
        
        flat.Sprints.push({
          id: sprintId,
          projectId: projectId,
          name: `Imported Sprint`,
          goal: 'Auto-generated during import',
          startDate: projectDates.startDate,
          endDate: projectDates.deadline,
          status: 'Planned',
          capacityHours: 40
        });
      }
    });

    referencedStageIds.forEach(stageId => {
      if (!existingStageIds.has(stageId)) {
        const taskWithStage = flat.Tasks.find((t: any) => t.stageId === stageId);
        const epicWithStage = flat.Epics.find((e: any) => e.stageIds?.includes(stageId));
        const projectId = taskWithStage?.projectId || epicWithStage?.projectId || flat.Projects[0]?.id;
        
        flat.ProjectStages.push({
          id: stageId,
          projectId: projectId,
          name: `Imported Stage`,
          description: 'Auto-generated during import',
          order: flat.ProjectStages.filter((s: any) => s.projectId === projectId).length,
          type: 'standard',
          status: 'pending'
        });
        existingStageIds.add(stageId);
      }
    });

    const existingMilestoneIds = new Set(flat.Milestones.map((m: any) => m.id));
    const referencedMilestoneIds = new Set<string>();
    flat.MilestoneTaskLinks.forEach((link: any) => {
      if (link.milestoneId) {
        referencedMilestoneIds.add(link.milestoneId);
      }
    });
    flat.MilestoneScopeRules.forEach((rule: any) => {
      if (rule.milestoneId) {
        referencedMilestoneIds.add(rule.milestoneId);
      }
    });
    
    referencedMilestoneIds.forEach(milestoneId => {
      if (!existingMilestoneIds.has(milestoneId)) {
        const linkWithMilestone = flat.MilestoneTaskLinks.find((l: any) => l.milestoneId === milestoneId);
        const projectId = linkWithMilestone?.projectId || flat.Projects[0]?.id;
        const projectDates = projectDatesMap.get(projectId) || {
          startDate: new Date().toISOString().split('T')[0],
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        };
        
        flat.Milestones.push({
          id: milestoneId,
          projectId: projectId,
          name: `Imported Milestone`,
          description: 'Auto-generated during import',
          targetDate: projectDates.deadline,
          status: 'Not Started',
          scopeType: 'all',
          completionMode: 'all_tasks'
        });
        existingMilestoneIds.add(milestoneId);
      }
    });

    if (nested.templates) {
      Object.entries(nested.templates).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          const entityName = key.charAt(0).toUpperCase() + key.slice(1);
          flat[entityName] = value;
        }
      });
    }

    if (nested.defaults) {
      Object.entries(nested.defaults).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          const entityName = key.charAt(0).toUpperCase() + key.slice(1);
          flat[entityName] = value;
        }
      });
    }

    if (nested.users) {
      if (Array.isArray(nested.users.users)) flat.Users = nested.users.users;
      if (Array.isArray(nested.users.projectRoles)) flat.ProjectRoles = nested.users.projectRoles;
      if (Array.isArray(nested.users.roleAssignments)) flat.RoleAssignments = nested.users.roleAssignments;
    }

    return flat;
  };

  const IMPORT_ORDER = [
    // Users & Roles (base entities)
    "Users",
    "RoleTypes",
    "StatusOptions",
    "TaskTypes",
    "EpicTypes",
    "DeliverableTypes",
    // Templates (config before data)
    "FrameworkTemplates",
    "StageTemplates",
    "TaskTemplates",
    "RoleTemplates",
    "MilestoneTemplates",
    "DeliverableTemplates",
    "EpicTemplates",
    "ProjectTemplates",
    "TemplateSnippets",
    "MappingTemplates",
    "GuidanceItems",
    "SavedViews",
    // User-related config
    "UserRoleEligibility",
    "UserPreferences",
    // Projects & related config
    "Projects",
    "ProjectFavorites",
    "ProjectRoles",
    "RoleAssignments",
    "ProjectSettings",
    "ProjectTaskTypes",
    "ProjectTaskStatuses",
    "ProjectStages",
    // Sprints
    "Sprints",
    "SprintMembers",
    "SprintScopeTargets",
    // Work breakdown
    "Deliverables",
    "Epics",
    "Milestones",
    "MilestoneScopeRules",
    // Tasks
    "Tasks",
    "TaskDependencies",
    "MilestoneTaskLinks",
    // Sprint activity
    "SprintScopeEvents",
    "SprintPulseUpdates",
    // Task activity
    "Activity",
    "Comments",
    "Attachments",
    "History",
    // Planning
    "DayPlans",
    "WorkBlocks"
  ];

  const normalizeRecord = (record: any, entityName: string): any => {
    const normalized = { ...record };
    
    const arrayFields = ["tags", "stageIds", "defaultStages", "defaultEpics", "defaultTasks", "defaultRoles", "defaultPermissions", "defaultDeliverables", "allowedTaskStatuses", "permissions", "rules"];
    for (const field of arrayFields) {
      if (normalized[field] !== undefined && normalized[field] !== null) {
        if (typeof normalized[field] === 'string') {
          try {
            normalized[field] = JSON.parse(normalized[field]);
          } catch {
            normalized[field] = [];
          }
        }
        if (!Array.isArray(normalized[field])) {
          normalized[field] = [];
        }
      }
    }
    
    const stringFields = ["entryCriteria", "exitCriteria"];
    for (const field of stringFields) {
      if (normalized[field] !== undefined && normalized[field] !== null) {
        if (Array.isArray(normalized[field])) {
          normalized[field] = JSON.stringify(normalized[field]);
        } else if (typeof normalized[field] !== 'string') {
          normalized[field] = String(normalized[field]);
        }
      }
    }
    
    const dateFields = ["updatedAt", "createdAt", "deadline", "startDate", "endDate", "dueDate", "targetDate", "lastEvaluatedAt", "progressLastCalculatedAt"];
    for (const field of dateFields) {
      if (normalized[field] !== undefined && normalized[field] !== null) {
        if (typeof normalized[field] === 'string') {
          const parsed = new Date(normalized[field]);
          if (!isNaN(parsed.getTime())) {
            normalized[field] = parsed;
          } else {
            delete normalized[field];
          }
        }
      }
    }
    
    return normalized;
  };

  const handleImport = async () => {
    if (!importState.data) return;

    setImportState(prev => ({ ...prev, isImporting: true, importProgress: 0 }));

    const orderedEntities: [string, any[]][] = [];
    for (const entityName of IMPORT_ORDER) {
      if (importState.data[entityName] && Array.isArray(importState.data[entityName])) {
        orderedEntities.push([entityName, importState.data[entityName]]);
      }
    }
    for (const [entityName, records] of Object.entries(importState.data)) {
      if (!IMPORT_ORDER.includes(entityName) && Array.isArray(records)) {
        orderedEntities.push([entityName, records]);
      }
    }

    const totalEntities = orderedEntities.length;
    let processed = 0;
    const importErrors: string[] = [];
    let updatedCount = 0;
    let createdCount = 0;

    for (const [entityName, records] of orderedEntities) {
      const collection = ENTITY_TO_COLLECTION[entityName];
      if (!collection || !Array.isArray(records)) {
        processed++;
        continue;
      }

      for (const record of records) {
        try {
          const normalizedRecord = normalizeRecord(record, entityName);
          if (normalizedRecord.id) {
            const existing = await db.getById(collection as any, normalizedRecord.id);
            if (existing) {
              await db.update(collection as any, normalizedRecord.id, normalizedRecord);
              updatedCount++;
            } else {
              const recordWithDefaults = applyDefaultsForNewRecord(normalizedRecord, entityName);
              await db.create(collection as any, recordWithDefaults);
              createdCount++;
            }
          } else {
            const recordWithDefaults = applyDefaultsForNewRecord(normalizedRecord, entityName);
            await db.create(collection as any, recordWithDefaults);
            createdCount++;
          }
        } catch (error: any) {
          importErrors.push(`${entityName}: ${error.message}`);
        }
      }

      processed++;
      setImportState(prev => ({
        ...prev,
        importProgress: Math.round((processed / totalEntities) * 100)
      }));
    }

    setImportState(prev => ({
      ...prev,
      isImporting: false,
      importProgress: 100,
      errors: importErrors
    }));

    if (importErrors.length === 0) {
      toast({
        title: "Import Complete",
        description: `Successfully imported: ${createdCount} created, ${updatedCount} updated.`,
      });
      clearImport();
    } else {
      toast({
        title: "Import Completed with Errors",
        description: `${importErrors.length} errors occurred during import.`,
        variant: "destructive"
      });
    }
  };

  const clearImport = () => {
    setImportState({
      file: null,
      data: null,
      preview: [],
      isProcessing: false,
      isImporting: false,
      importProgress: 0,
      errors: [],
      hasConflicts: false,
      totalExisting: 0,
      totalNew: 0
    });
  };

  // Helper to flatten/serialize data
  const serialize = (data: any[]) => {
    return data.map(item => {
      const newItem: any = {};
      Object.keys(item).forEach(key => {
        if (typeof item[key] === 'object' && item[key] !== null) {
          newItem[key] = JSON.stringify(item[key]);
        } else {
          newItem[key] = item[key];
        }
      });
      return newItem;
    });
  };

  const filterBySelectedProjects = async () => {
    const allProjects = await db.getAll("projects");
    const allDeliverables = await db.getAll("deliverables");
    const allEpics = await db.getAll("epics");
    const allTasks = await db.getAll("tasks");
    const allMilestones = await db.getAll("milestones");
    const allMilestoneScopeRules = await db.getAll("milestoneScopeRules");
    const allMilestoneTaskLinks = await db.getAll("milestoneTaskLinks");
    const allProjectStages = await db.getAll("projectStages");
    const allSprints = await db.getAll("sprints");
    const allComments = await db.getAll("comments");
    const allAttachments = await db.getAll("attachments");
    const allHistory = await db.getAll("history");
    const allActivity = await db.getAll("activity");

    const filteredProjects = allProjects.filter((p: any) => selectedProjectIds.has(p.id));
    const projectIdSet = selectedProjectIds;
    
    const filteredDeliverables = allDeliverables.filter((d: any) => projectIdSet.has(d.projectId || d.project_id));
    const deliverableIds = new Set(filteredDeliverables.map((d: any) => d.id));
    
    const filteredEpics = allEpics.filter((e: any) => deliverableIds.has(e.deliverableId || e.deliverable_id));
    const epicIds = new Set(filteredEpics.map((e: any) => e.id));
    
    const filteredTasks = allTasks.filter((t: any) => epicIds.has(t.epicId || t.epic_id) || projectIdSet.has(t.projectId || t.project_id));
    const taskIds = new Set(filteredTasks.map((t: any) => t.id));
    
    const filteredMilestones = allMilestones.filter((m: any) => projectIdSet.has(m.projectId || m.project_id));
    const milestoneIds = new Set(filteredMilestones.map((m: any) => m.id));
    
    const filteredMilestoneScopeRules = allMilestoneScopeRules.filter((r: any) => milestoneIds.has(r.milestoneId || r.milestone_id));
    const filteredMilestoneTaskLinks = allMilestoneTaskLinks.filter((l: any) => milestoneIds.has(l.milestoneId || l.milestone_id));
    const filteredProjectStages = allProjectStages.filter((s: any) => projectIdSet.has(s.projectId || s.project_id));
    const filteredSprints = allSprints.filter((s: any) => projectIdSet.has(s.projectId || s.project_id));
    
    const filteredComments = allComments.filter((c: any) => taskIds.has(c.taskId || c.task_id));
    const filteredAttachments = allAttachments.filter((a: any) => taskIds.has(a.taskId || a.task_id));
    const filteredHistory = allHistory.filter((h: any) => taskIds.has(h.taskId || h.task_id));

    return {
      projects: filteredProjects,
      deliverables: filteredDeliverables,
      epics: filteredEpics,
      tasks: filteredTasks,
      milestones: filteredMilestones,
      milestoneScopeRules: filteredMilestoneScopeRules,
      milestoneTaskLinks: filteredMilestoneTaskLinks,
      projectStages: filteredProjectStages,
      sprints: filteredSprints,
      comments: filteredComments,
      attachments: filteredAttachments,
      history: filteredHistory,
      activity: allActivity
    };
  };

  const generateExportData = async () => {
    let data: any = {};

    const safeGetAll = async (collection: keyof import("@/lib/storage").NexusDB) => {
      try {
        return serialize(await db.getAll(collection));
      } catch {
        return [];
      }
    };

    if (activeTab === "all") {
       data = {
         // Core Project Entities
         Projects: await safeGetAll("projects"),
         Deliverables: await safeGetAll("deliverables"),
         Epics: await safeGetAll("epics"),
         ProjectStages: await safeGetAll("projectStages"),
         Tasks: await safeGetAll("tasks"),
         Milestones: await safeGetAll("milestones"),
         MilestoneScopeRules: await safeGetAll("milestoneScopeRules"),
         MilestoneTaskLinks: await safeGetAll("milestoneTaskLinks"),
         // Sprint Entities
         Sprints: await safeGetAll("sprints"),
         SprintMembers: await safeGetAll("sprintMembers"),
         SprintScopeEvents: await safeGetAll("sprintScopeEvents"),
         SprintScopeTargets: await safeGetAll("sprintScopeTargets"),
         SprintPulseUpdates: await safeGetAll("sprintPulseUpdates"),
         // Task Related
         TaskDependencies: await safeGetAll("taskDependencies"),
         TaskTypes: await safeGetAll("taskTypes"),
         ProjectTaskTypes: await safeGetAll("projectTaskTypes"),
         ProjectTaskStatuses: await safeGetAll("projectTaskStatuses"),
         ProjectSettings: await safeGetAll("projectSettings"),
         // Activity & Comments
         Activity: await safeGetAll("activity"),
         Comments: await safeGetAll("comments"),
         Attachments: await safeGetAll("attachments"),
         History: await safeGetAll("history"),
         // Views & Guidance
         SavedViews: await safeGetAll("savedViews"),
         GuidanceItems: await safeGetAll("guidanceItems"),
         // Templates
         ProjectTemplates: await safeGetAll("projectTemplates"),
         FrameworkTemplates: await safeGetAll("frameworkTemplates"),
         StageTemplates: await safeGetAll("stageTemplates"),
         DeliverableTemplates: await safeGetAll("deliverableTemplates"),
         EpicTemplates: await safeGetAll("epicTemplates"),
         TaskTemplates: await safeGetAll("taskTemplates"),
         RoleTemplates: await safeGetAll("roleTemplates"),
         MilestoneTemplates: await safeGetAll("milestoneTemplates"),
         TemplateSnippets: await safeGetAll("templateSnippets"),
         // Defaults & Config
         StatusOptions: await safeGetAll("statusOptions"),
         RoleTypes: await safeGetAll("roleTypes"),
         MappingTemplates: await safeGetAll("mappingTemplates"),
         EpicTypes: await safeGetAll("epicTypes"),
         DeliverableTypes: await safeGetAll("deliverableTypes"),
         // Users & Roles
         Users: await safeGetAll("users"),
         ProjectRoles: await safeGetAll("projectRoles"),
         RoleAssignments: await safeGetAll("roleAssignments"),
         UserRoleEligibility: await safeGetAll("userRoleEligibility"),
         UserPreferences: await safeGetAll("userPreferences"),
         ProjectFavorites: await safeGetAll("projectFavorites"),
         // Planning
         WorkBlocks: await safeGetAll("workBlocks"),
         DayPlans: await safeGetAll("dayPlans")
       };
    } else if (activeTab === "projects") {
      if (selectiveExportEnabled && selectedProjectIds.size > 0) {
        const filtered = await filterBySelectedProjects();
        data = {
          Projects: serialize(filtered.projects),
          Deliverables: serialize(filtered.deliverables),
          Epics: serialize(filtered.epics),
          ProjectStages: serialize(filtered.projectStages),
          Sprints: serialize(filtered.sprints),
          Tasks: serialize(filtered.tasks),
          Milestones: serialize(filtered.milestones),
          MilestoneScopeRules: serialize(filtered.milestoneScopeRules),
          MilestoneTaskLinks: serialize(filtered.milestoneTaskLinks),
          Activity: serialize(filtered.activity),
          Comments: serialize(filtered.comments),
          Attachments: serialize(filtered.attachments),
          History: serialize(filtered.history),
          // Sprint-related (filter by sprint IDs from filtered sprints)
          SprintMembers: await safeGetAll("sprintMembers"),
          SprintScopeEvents: await safeGetAll("sprintScopeEvents"),
          SprintScopeTargets: await safeGetAll("sprintScopeTargets"),
          SprintPulseUpdates: await safeGetAll("sprintPulseUpdates"),
          // Task-related project config
          TaskDependencies: await safeGetAll("taskDependencies"),
          ProjectTaskTypes: await safeGetAll("projectTaskTypes"),
          ProjectTaskStatuses: await safeGetAll("projectTaskStatuses"),
          ProjectSettings: await safeGetAll("projectSettings")
        };
      } else {
        data = {
          Projects: await safeGetAll("projects"),
          Deliverables: await safeGetAll("deliverables"),
          Epics: await safeGetAll("epics"),
          ProjectStages: await safeGetAll("projectStages"),
          Sprints: await safeGetAll("sprints"),
          Tasks: await safeGetAll("tasks"),
          Milestones: await safeGetAll("milestones"),
          MilestoneScopeRules: await safeGetAll("milestoneScopeRules"),
          MilestoneTaskLinks: await safeGetAll("milestoneTaskLinks"),
          Activity: await safeGetAll("activity"),
          Comments: await safeGetAll("comments"),
          Attachments: await safeGetAll("attachments"),
          History: await safeGetAll("history"),
          // Sprint Entities
          SprintMembers: await safeGetAll("sprintMembers"),
          SprintScopeEvents: await safeGetAll("sprintScopeEvents"),
          SprintScopeTargets: await safeGetAll("sprintScopeTargets"),
          SprintPulseUpdates: await safeGetAll("sprintPulseUpdates"),
          // Task Related
          TaskDependencies: await safeGetAll("taskDependencies"),
          ProjectTaskTypes: await safeGetAll("projectTaskTypes"),
          ProjectTaskStatuses: await safeGetAll("projectTaskStatuses"),
          ProjectSettings: await safeGetAll("projectSettings")
        };
      }
    } else if (activeTab === "templates") {
      data = {
        ProjectTemplates: await safeGetAll("projectTemplates"),
        FrameworkTemplates: await safeGetAll("frameworkTemplates"),
        StageTemplates: await safeGetAll("stageTemplates"),
        DeliverableTemplates: await safeGetAll("deliverableTemplates"),
        EpicTemplates: await safeGetAll("epicTemplates"),
        TaskTemplates: await safeGetAll("taskTemplates"),
        RoleTemplates: await safeGetAll("roleTemplates"),
        MilestoneTemplates: await safeGetAll("milestoneTemplates"),
        TemplateSnippets: await safeGetAll("templateSnippets")
      };
    } else if (activeTab === "defaults") {
      data = {
        StatusOptions: await safeGetAll("statusOptions"),
        RoleTypes: await safeGetAll("roleTypes"),
        MappingTemplates: await safeGetAll("mappingTemplates"),
        GuidanceItems: await safeGetAll("guidanceItems"),
        SavedViews: await safeGetAll("savedViews"),
        TaskTypes: await safeGetAll("taskTypes"),
        EpicTypes: await safeGetAll("epicTypes"),
        DeliverableTypes: await safeGetAll("deliverableTypes")
      };
    } else if (activeTab === "users") {
      data = {
        Users: await safeGetAll("users"),
        ProjectRoles: await safeGetAll("projectRoles"),
        RoleAssignments: await safeGetAll("roleAssignments"),
        UserRoleEligibility: await safeGetAll("userRoleEligibility"),
        UserPreferences: await safeGetAll("userPreferences"),
        ProjectFavorites: await safeGetAll("projectFavorites"),
        WorkBlocks: await safeGetAll("workBlocks"),
        DayPlans: await safeGetAll("dayPlans")
      };
    }

    return data;
  };

  const generateNestedExportData = async () => {
    const safeGet = async (collection: keyof import("@/lib/storage").NexusDB) => {
      try {
        return await db.getAll(collection);
      } catch {
        return [];
      }
    };
    
    const allProjects = await safeGet("projects");
    const deliverables = await safeGet("deliverables");
    const epics = await safeGet("epics");
    const tasks = await safeGet("tasks");
    const milestones = await safeGet("milestones");
    const milestoneScopeRules = await safeGet("milestoneScopeRules");
    const milestoneTaskLinks = await safeGet("milestoneTaskLinks");
    const projectStages = await safeGet("projectStages");
    const comments = await safeGet("comments");
    const attachments = await safeGet("attachments");
    const history = await safeGet("history");
    const sprints = await safeGet("sprints");
    const sprintMembers = await safeGet("sprintMembers");
    const sprintScopeEvents = await safeGet("sprintScopeEvents");
    const sprintScopeTargets = await safeGet("sprintScopeTargets");
    const sprintPulseUpdates = await safeGet("sprintPulseUpdates");
    const taskDependencies = await safeGet("taskDependencies");

    const projects = (selectiveExportEnabled && activeTab === "projects" && selectedProjectIds.size > 0)
      ? allProjects.filter((p: any) => selectedProjectIds.has(p.id))
      : allProjects;

    const nestedProjects = projects.map((project: any) => {
      const projectDeliverables = deliverables
        .filter((d: any) => d.projectId === project.id || d.project_id === project.id)
        .map((deliverable: any) => {
          const deliverableEpics = epics
            .filter((e: any) => e.deliverableId === deliverable.id || e.deliverable_id === deliverable.id)
            .map((epic: any) => {
              const epicTasks = tasks
                .filter((t: any) => t.epicId === epic.id || t.epic_id === epic.id)
                .map((task: any) => {
                  const taskComments = comments.filter((c: any) => c.taskId === task.id || c.task_id === task.id);
                  const taskAttachments = attachments.filter((a: any) => a.taskId === task.id || a.task_id === task.id);
                  const taskHistory = history.filter((h: any) => h.taskId === task.id || h.task_id === task.id);
                  const taskDeps = taskDependencies.filter((d: any) => d.taskId === task.id || d.task_id === task.id);
                  return { 
                    ...task, 
                    comments: taskComments,
                    attachments: taskAttachments,
                    history: taskHistory,
                    dependencies: taskDeps
                  };
                });
              return { ...epic, tasks: epicTasks };
            });
          return { ...deliverable, epics: deliverableEpics };
        });

      const projectMilestones = milestones
        .filter((m: any) => m.projectId === project.id || m.project_id === project.id)
        .map((milestone: any) => {
          const rules = milestoneScopeRules.filter((r: any) => r.milestoneId === milestone.id || r.milestone_id === milestone.id);
          const taskLinks = milestoneTaskLinks.filter((l: any) => l.milestoneId === milestone.id || l.milestone_id === milestone.id);
          return { ...milestone, scopeRules: rules, taskLinks: taskLinks };
        });

      const projectStagesData = projectStages.filter((s: any) => s.projectId === project.id || s.project_id === project.id);
      
      const projectSprints = sprints
        .filter((s: any) => s.projectId === project.id || s.project_id === project.id)
        .map((sprint: any) => {
          const members = sprintMembers.filter((m: any) => m.sprintId === sprint.id || m.sprint_id === sprint.id);
          const scopeEvents = sprintScopeEvents.filter((e: any) => e.sprintId === sprint.id || e.sprint_id === sprint.id);
          const scopeTargets = sprintScopeTargets.filter((t: any) => t.sprintId === sprint.id || t.sprint_id === sprint.id);
          const pulseUpdates = sprintPulseUpdates.filter((u: any) => u.sprintId === sprint.id || u.sprint_id === sprint.id);
          return { ...sprint, members, scopeEvents, scopeTargets, pulseUpdates };
        });

      return {
        ...project,
        deliverables: projectDeliverables,
        milestones: projectMilestones,
        stages: projectStagesData,
        sprints: projectSprints
      };
    });

    if (activeTab === "all") {
      return {
        projects: nestedProjects,
        templates: {
          projectTemplates: await safeGet("projectTemplates"),
          frameworkTemplates: await safeGet("frameworkTemplates"),
          stageTemplates: await safeGet("stageTemplates"),
          deliverableTemplates: await safeGet("deliverableTemplates"),
          epicTemplates: await safeGet("epicTemplates"),
          taskTemplates: await safeGet("taskTemplates"),
          roleTemplates: await safeGet("roleTemplates"),
          milestoneTemplates: await safeGet("milestoneTemplates"),
          templateSnippets: await safeGet("templateSnippets")
        },
        defaults: {
          statusOptions: await safeGet("statusOptions"),
          roleTypes: await safeGet("roleTypes"),
          mappingTemplates: await safeGet("mappingTemplates"),
          guidanceItems: await safeGet("guidanceItems"),
          savedViews: await safeGet("savedViews"),
          taskTypes: await safeGet("taskTypes"),
          epicTypes: await safeGet("epicTypes"),
          deliverableTypes: await safeGet("deliverableTypes")
        },
        users: {
          users: await safeGet("users"),
          projectRoles: await safeGet("projectRoles"),
          roleAssignments: await safeGet("roleAssignments"),
          userRoleEligibility: await safeGet("userRoleEligibility"),
          userPreferences: await safeGet("userPreferences"),
          projectFavorites: await safeGet("projectFavorites"),
          workBlocks: await safeGet("workBlocks"),
          dayPlans: await safeGet("dayPlans")
        }
      };
    } else if (activeTab === "projects") {
      return { projects: nestedProjects };
    } else {
      return await generateExportData();
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setProgress(10);

    // Use a small delay to allow UI to update then do work
    setTimeout(async () => {
      setProgress(20);
      try {
        const shouldUseNested = useNestedExport && exportFormat !== "xlsx" && (activeTab === "all" || activeTab === "projects");
        const data = shouldUseNested ? await generateNestedExportData() : await generateExportData();
        setProgress(80);
        
        const baseFilename = `Nexus_${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}_Export_${new Date().toISOString().split('T')[0]}`;

        if (exportFormat === "xlsx") {
          const wb = XLSX.utils.book_new();
          Object.entries(data).forEach(([sheetName, sheetData]: [string, any]) => {
            if (Array.isArray(sheetData) && sheetData.length > 0) {
              const ws = XLSX.utils.json_to_sheet(sheetData);
              XLSX.utils.book_append_sheet(wb, ws, sheetName);
            }
          });
          const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([wbout], { type: 'application/octet-stream' });
          saveAs(blob, `${baseFilename}.xlsx`);
        } else if (exportFormat === "json") {
          const jsonString = JSON.stringify(data, null, 2);
          const blob = new Blob([jsonString], { type: 'application/json' });
          saveAs(blob, `${baseFilename}.json`);
        } else if (exportFormat === "yaml") {
          const yamlString = yaml.dump(data);
          const blob = new Blob([yamlString], { type: 'text/yaml' });
          saveAs(blob, `${baseFilename}.yaml`);
        }

        setProgress(100);
        setTimeout(() => setIsExporting(false), 500);
        
        toast({
          title: "Export Complete",
          description: `Successfully exported ${activeTab} data as ${exportFormat.toUpperCase()}.`,
        });

      } catch (error) {
        console.error("Export failed:", error);
        setIsExporting(false);
        toast({
          title: "Export Failed",
          description: "An error occurred while generating the export file.",
          variant: "destructive"
        });
      }
    }, 100); // reduced timeout
  };

  const FIELD_DESCRIPTIONS: Record<string, string> = {
    id: "Unique identifier (UUID or string)",
    name: "Display name of the entity",
    title: "Title or heading text",
    description: "Detailed description or notes",
    status: "Current status (e.g., Active, Completed, Pending)",
    progress: "Completion percentage (0-100)",
    startDate: "Start date (ISO format: YYYY-MM-DD)",
    endDate: "End date (ISO format: YYYY-MM-DD)",
    deadline: "Due date (ISO format: YYYY-MM-DD)",
    dueDate: "Due date (ISO format: YYYY-MM-DD)",
    targetDate: "Target completion date (ISO format: YYYY-MM-DD)",
    createdAt: "Creation timestamp (auto-generated)",
    updatedAt: "Last update timestamp (auto-generated)",
    projectId: "Reference to parent project ID",
    deliverableId: "Reference to parent deliverable ID",
    epicId: "Reference to parent epic ID",
    taskId: "Reference to parent task ID",
    milestoneId: "Reference to linked milestone ID",
    sprintId: "Reference to assigned sprint ID",
    stageId: "Reference to workflow stage ID",
    userId: "Reference to user ID",
    ownerId: "Reference to owner user ID",
    assigneeId: "Reference to assigned user ID",
    frameworkId: "Reference to project framework template ID",
    templateId: "Reference to template ID",
    roleId: "Reference to role definition ID",
    priority: "Priority level (Low, Medium, High, Critical)",
    order: "Sort order or sequence number",
    type: "Entity type or category",
    tags: "Array of tag strings [\"tag1\", \"tag2\"]",
    stageIds: "Array of stage IDs [\"stage-1\", \"stage-2\"]",
    email: "Email address",
    role: "User role or permission level",
    avatar: "URL to avatar image",
    client: "Client or customer name",
    riskLevel: "Risk assessment (Low, Medium, High)",
    estimateHours: "Estimated hours to complete",
    effort: "Effort points or story points",
    blocked: "Whether task is blocked (true/false)",
    blockerReason: "Reason for blocking",
    capacityHours: "Available capacity in hours",
    goal: "Sprint or milestone goal description",
    externalRefs: "Array of external reference objects",
    permissions: "JSON object of permission settings",
    config: "JSON configuration object",
    isDefault: "Whether this is the default option (true/false)",
    isRequired: "Whether this field is required (true/false)",
    isPrimary: "Whether this is the primary assignment (true/false)",
    isActive: "Whether entity is active (true/false)",
    visibility: "Visibility setting (public, private, team)",
    viewType: "Type of view (kanban, table, timeline)",
    scopeType: "Scope type (all, filtered, custom)",
    completionMode: "How completion is calculated",
    allocationPercent: "Allocation percentage (0-100)",
    maxAssignees: "Maximum number of assignees allowed",
    defaultTasks: "Array of default task definitions",
    defaultStages: "Array of default stage definitions",
    defaultRoles: "Array of default role definitions",
    defaultPermissions: "Array of default permission settings",
    entryCriteria: "Criteria required to enter this stage",
    exitCriteria: "Criteria required to exit this stage",
    body: "Main content or body text",
    phase: "Project phase or milestone phase",
    source: "Data source or origin",
    active: "Whether rule or setting is active",
    locked: "Whether record is locked for editing",
    label: "Display label text",
    filters: "JSON filter criteria object"
  };

  const handleDownloadTemplate = (format: "xlsx" | "json") => {
    const schema = SCHEMA_DEFINITIONS[activeTab as keyof typeof SCHEMA_DEFINITIONS];
    
    if (!schema) return;

    if (format === "xlsx") {
      const wb = XLSX.utils.book_new();
      schema.forEach(def => {
        const ws = XLSX.utils.aoa_to_sheet([def.columns]);
        XLSX.utils.book_append_sheet(wb, ws, def.sheet);
      });

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      saveAs(blob, `Nexus_${activeTab}_Import_Template.xlsx`);
    } else {
      const templateData: Record<string, Record<string, any>[]> = {};
      schema.forEach(def => {
        const sampleRecord: Record<string, any> = {};
        def.columns.forEach((col: string) => {
          sampleRecord[col] = "";
        });
        templateData[def.sheet] = [sampleRecord];
      });
      
      const jsonString = JSON.stringify(templateData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      saveAs(blob, `Nexus_${activeTab}_Import_Template.json`);
    }

    toast({
      title: "Template Downloaded",
      description: `Empty ${format.toUpperCase()} import template generated successfully.`,
    });
  };

  const handleDownloadSchemaReference = () => {
    const schema = SCHEMA_DEFINITIONS[activeTab as keyof typeof SCHEMA_DEFINITIONS];
    
    if (!schema) return;

    const referenceData: Record<string, Record<string, any>[]> = {};
    schema.forEach(def => {
      const sampleRecord: Record<string, any> = {};
      def.columns.forEach((col: string) => {
        sampleRecord[col] = FIELD_DESCRIPTIONS[col] || `Value for ${col}`;
      });
      referenceData[def.sheet] = [sampleRecord];
    });
    
    const jsonString = JSON.stringify(referenceData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    saveAs(blob, `Nexus_${activeTab}_Schema_Reference.json`);

    toast({
      title: "Schema Reference Downloaded",
      description: "JSON with field descriptions generated successfully.",
    });
  };

  const TabCard = ({ value, icon: Icon, title, description }: any) => (
    <div 
      className={cn(
        "flex flex-col items-center justify-center p-6 border rounded-lg cursor-pointer transition-all hover:bg-muted/50",
        activeTab === value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
      )}
      onClick={() => setActiveTab(value)}
    >
      <Icon className={cn("h-8 w-8 mb-3", activeTab === value ? "text-primary" : "text-muted-foreground")} />
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground text-center mt-1">{description}</p>
    </div>
  );

  const FormatCard = ({ format, icon: Icon, label }: any) => (
    <div 
      className={cn(
        "flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all hover:bg-muted/50 relative",
        exportFormat === format ? "bg-primary/5 border-primary ring-1 ring-primary" : "opacity-70"
      )}
      onClick={() => setExportFormat(format)}
    >
        <Icon className={cn("h-6 w-6 mb-2", exportFormat === format ? "text-primary" : "text-muted-foreground")} />
        <div className="text-xs font-medium">{label}</div>
        {exportFormat === format && <CheckCircle2 className="h-4 w-4 text-primary absolute top-2 right-2" />}
    </div>
  );

  const Wrapper = embedded ? ({ children }: { children: React.ReactNode }) => <>{children}</> : Shell;

  return (
    <Wrapper>
      <div className="space-y-8">
        {!embedded && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-primary">Import & Export</h1>
              <p className="text-muted-foreground">Manage data portability across projects, templates, defaults, and users.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <TabCard value="all" icon={Database} title="Full System" description="Complete data backup of all entities" />
          <TabCard value="projects" icon={Briefcase} title="Projects" description="Project data, tasks, and milestones" />
          <TabCard value="templates" icon={LayoutTemplate} title="Templates" description="Project, stage, and task templates" />
          <TabCard value="defaults" icon={Settings} title="App Defaults" description="Global settings and status options" />
          <TabCard value="users" icon={Users} title="User Management" description="Users, roles, and assignments" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Export {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Data</CardTitle>
                <CardDescription>Select format and configure export options.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Export Format</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <FormatCard format="xlsx" icon={FileSpreadsheet} label="Excel (.xlsx)" />
                    <FormatCard format="json" icon={FileJson} label="JSON (.json)" />
                    <FormatCard format="yaml" icon={FileCode} label="YAML (.yaml)" />
                  </div>
                </div>

                {exportFormat !== "xlsx" && (activeTab === "all" || activeTab === "projects") && (
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                    <div className="space-y-0.5">
                      <Label htmlFor="nested-export" className="text-sm font-medium">Hierarchical Structure</Label>
                      <p className="text-xs text-muted-foreground">
                        Nest deliverables, epics, and tasks within projects
                      </p>
                    </div>
                    <Switch 
                      id="nested-export"
                      checked={useNestedExport}
                      onCheckedChange={setUseNestedExport}
                      data-testid="switch-nested-export"
                    />
                  </div>
                )}

                {activeTab === "projects" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                      <div className="space-y-0.5">
                        <Label htmlFor="selective-export" className="text-sm font-medium flex items-center gap-2">
                          <Filter className="h-4 w-4" />
                          Selective Export
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Export only selected projects with their children
                        </p>
                      </div>
                      <Switch 
                        id="selective-export"
                        checked={selectiveExportEnabled}
                        onCheckedChange={setSelectiveExportEnabled}
                        data-testid="switch-selective-export"
                      />
                    </div>
                    
                    {selectiveExportEnabled && availableProjects.length > 0 && (
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Select Projects</Label>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-xs h-7"
                              onClick={() => setSelectedProjectIds(new Set(availableProjects.map((p: any) => p.id)))}
                              data-testid="button-select-all-projects"
                            >
                              Select All
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-xs h-7"
                              onClick={() => setSelectedProjectIds(new Set())}
                              data-testid="button-deselect-all-projects"
                            >
                              Deselect All
                            </Button>
                          </div>
                        </div>
                        <ScrollArea className="h-[120px]">
                          <div className="space-y-2">
                            {availableProjects.map((project: any) => (
                              <div 
                                key={project.id} 
                                className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50"
                              >
                                <Checkbox
                                  id={`project-${project.id}`}
                                  checked={selectedProjectIds.has(project.id)}
                                  onCheckedChange={(checked) => {
                                    const newSet = new Set(selectedProjectIds);
                                    if (checked) {
                                      newSet.add(project.id);
                                    } else {
                                      newSet.delete(project.id);
                                    }
                                    setSelectedProjectIds(newSet);
                                  }}
                                  data-testid={`checkbox-project-${project.id}`}
                                />
                                <label 
                                  htmlFor={`project-${project.id}`}
                                  className="text-sm font-medium leading-none cursor-pointer flex-1"
                                >
                                  {project.name}
                                </label>
                                <span className="text-xs text-muted-foreground">{project.status}</span>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        <p className="text-xs text-muted-foreground">
                          {selectedProjectIds.size} of {availableProjects.length} projects selected
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                        <p className="font-semibold mb-1">Round-trip Compatible</p>
                        <p>
                            Exported files include ID references and structure allowing them to be re-imported to update existing records or migrate data.
                        </p>
                    </div>
                </div>

                {isExporting && (
                    <div className="space-y-2 pt-4">
                        <div className="flex justify-between text-xs">
                            <span>Generating export...</span>
                            <span>{progress}%</span>
                        </div>
                        <Progress value={progress} />
                    </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-6">
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                     <Button variant="outline" className="gap-2">
                       <Download className="h-4 w-4" />
                       Download Template
                       <ChevronDown className="h-3 w-3 opacity-50" />
                     </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="start">
                     <DropdownMenuItem onClick={() => handleDownloadTemplate("xlsx")} className="gap-2">
                       <FileSpreadsheet className="h-4 w-4" />
                       Excel Template (.xlsx)
                     </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => handleDownloadTemplate("json")} className="gap-2">
                       <FileJson className="h-4 w-4" />
                       JSON Template (.json)
                     </DropdownMenuItem>
                     <DropdownMenuSeparator />
                     <DropdownMenuItem onClick={handleDownloadSchemaReference} className="gap-2">
                       <FileText className="h-4 w-4" />
                       Schema Reference (.json)
                     </DropdownMenuItem>
                   </DropdownMenuContent>
                 </DropdownMenu>
                 <Button onClick={handleExport} disabled={isExporting} className="gap-2">
                    {isExporting ? "Exporting..." : (
                        <>
                            <Download className="h-4 w-4" />
                            Export {exportFormat.toUpperCase()}
                        </>
                    )}
                 </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Schema Preview</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[300px]">
                        <div className="divide-y">
                            {SCHEMA_DEFINITIONS[activeTab as keyof typeof SCHEMA_DEFINITIONS]?.map((schema: any, i: number) => (
                                <div key={i} className="p-3 text-sm hover:bg-muted/50">
                                    <div className="font-medium flex items-center gap-2">
                                        <Database className="h-3 w-3 text-muted-foreground" />
                                        {schema.sheet}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1 truncate">
                                        {schema.columns.slice(0, 3).join(", ")}...
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="border-t p-3 bg-muted/20">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-xs"
                        onClick={() => setShowSchema(!showSchema)}
                    >
                        {showSchema ? "Hide Details" : "View Full Schema"}
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Import Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.json,.yaml,.yml"
                      onChange={handleFileSelect}
                      className="hidden"
                      data-testid="input-import-file"
                    />
                    
                    {!importState.file && !importState.isProcessing && (
                      <div 
                        className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer group"
                        onClick={() => fileInputRef.current?.click()}
                        data-testid="dropzone-import"
                      >
                        <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-background transition-colors">
                            <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-sm font-medium">Upload File</p>
                        <p className="text-xs text-muted-foreground mt-1">Supports .xlsx, .json, .yaml</p>
                      </div>
                    )}

                    {importState.isProcessing && (
                      <div className="flex items-center justify-center p-6 gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-sm">Processing file...</span>
                      </div>
                    )}

                    {importState.file && importState.preview.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium truncate max-w-[150px]">{importState.file.name}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearImport} data-testid="button-clear-import">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {importState.hasConflicts && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2" data-testid="conflict-warning-banner">
                            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-xs text-amber-800">
                              <p className="font-medium">Existing records detected</p>
                              <p className="mt-1">
                                {importState.totalExisting} record{importState.totalExisting !== 1 ? 's' : ''} will be updated, {importState.totalNew} new record{importState.totalNew !== 1 ? 's' : ''} will be created.
                              </p>
                            </div>
                          </div>
                        )}

                        <ScrollArea className="h-[150px] border rounded-lg">
                          <div className="divide-y">
                            {importState.preview.map((item, i) => (
                              <div key={i} className="p-2 text-sm flex items-center justify-between" data-testid={`preview-entity-${item.entityName}`}>
                                <div className="flex items-center gap-2">
                                  {item.errors.length > 0 ? (
                                    <AlertCircle className="h-3 w-3 text-destructive" />
                                  ) : item.existingCount > 0 ? (
                                    <AlertCircle className="h-3 w-3 text-amber-500" />
                                  ) : (
                                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                                  )}
                                  <span>{item.entityName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  {item.existingCount > 0 && (
                                    <span className="text-amber-600" data-testid={`count-update-${item.entityName}`}>
                                      {item.existingCount} update{item.existingCount !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                  {item.newCount > 0 && (
                                    <span className="text-green-600" data-testid={`count-new-${item.entityName}`}>
                                      {item.newCount} new
                                    </span>
                                  )}
                                  {item.existingCount === 0 && item.newCount === 0 && (
                                    <span className="text-muted-foreground">{item.count} records</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>

                        {importState.errors.length > 0 && (
                          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex gap-2">
                            <FileWarning className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                            <div className="text-xs text-destructive">
                              {importState.errors.slice(0, 3).map((err, i) => (
                                <p key={i}>{err}</p>
                              ))}
                              {importState.errors.length > 3 && (
                                <p>+{importState.errors.length - 3} more errors</p>
                              )}
                            </div>
                          </div>
                        )}

                        {importState.isImporting && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>Importing...</span>
                              <span>{importState.importProgress}%</span>
                            </div>
                            <Progress value={importState.importProgress} />
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={clearImport}
                            disabled={importState.isImporting}
                            data-testid="button-cancel-import"
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={handleImport}
                            disabled={importState.isImporting || importState.errors.length > 0}
                            data-testid="button-confirm-import"
                          >
                            {importState.isImporting ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                Importing...
                              </>
                            ) : (
                              "Import"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                </CardContent>
            </Card>
          </div>
        </div>

        {showSchema && (
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Full Schema Definition</CardTitle>
                    <CardDescription>Detailed column structure for {activeTab} entities.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Sheet Name</TableHead>
                                <TableHead>Columns</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {SCHEMA_DEFINITIONS[activeTab as keyof typeof SCHEMA_DEFINITIONS]?.map((def: any) => (
                                <TableRow key={def.sheet}>
                                    <TableCell className="font-medium">{def.sheet}</TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {def.columns.join(", ")}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )}
      </div>
    </Wrapper>
  );
}
