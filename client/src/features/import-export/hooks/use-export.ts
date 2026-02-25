import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import * as yaml from "js-yaml";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/storage";
import { SCHEMA_DEFINITIONS } from "../constants";
import { serialize } from "../utils";
import type { ExportFormat, ExportTab } from "../types";

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
  priority: "Priority level (Low, Medium, High, Critical)",
  order: "Sort order or sequence number",
  type: "Entity type or category",
  tags: "Array of tag strings [\"tag1\", \"tag2\"]",
  stageIds: "Array of stage IDs [\"stage-1\", \"stage-2\"]",
  email: "Email address",
  role: "User role or permission level",
  estimateHours: "Estimated hours to complete",
  effort: "Effort points or story points",
  blocked: "Whether task is blocked (true/false)",
  capacityHours: "Available capacity in hours",
  goal: "Sprint or milestone goal description",
  externalRefs: "Array of external reference objects",
  permissions: "JSON object of permission settings",
  config: "JSON configuration object",
  isDefault: "Whether this is the default option (true/false)",
  isRequired: "Whether this field is required (true/false)",
  visibility: "Visibility setting (public, private, team)",
  viewType: "Type of view (kanban, table, timeline)",
  scopeType: "Scope type (all, filtered, custom)"
};

export function useExport() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ExportTab>("all");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("xlsx");
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [useNestedExport, setUseNestedExport] = useState(false);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [selectiveExportEnabled, setSelectiveExportEnabled] = useState(false);

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

  const safeGetAll = async (collection: keyof import("@/lib/storage").NexusDB) => {
    try {
      return serialize(await db.getAll(collection));
    } catch {
      return [];
    }
  };

  const safeGet = async (collection: keyof import("@/lib/storage").NexusDB) => {
    try {
      return await db.getAll(collection);
    } catch {
      return [];
    }
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

    if (activeTab === "all") {
      data = {
        Projects: await safeGetAll("projects"),
        Deliverables: await safeGetAll("deliverables"),
        Epics: await safeGetAll("epics"),
        ProjectStages: await safeGetAll("projectStages"),
        Tasks: await safeGetAll("tasks"),
        Milestones: await safeGetAll("milestones"),
        MilestoneScopeRules: await safeGetAll("milestoneScopeRules"),
        MilestoneTaskLinks: await safeGetAll("milestoneTaskLinks"),
        Sprints: await safeGetAll("sprints"),
        SprintMembers: await safeGetAll("sprintMembers"),
        SprintScopeEvents: await safeGetAll("sprintScopeEvents"),
        SprintScopeTargets: await safeGetAll("sprintScopeTargets"),
        SprintPulseUpdates: await safeGetAll("sprintPulseUpdates"),
        TaskDependencies: await safeGetAll("taskDependencies"),
        TaskTypes: await safeGetAll("taskTypes"),
        ProjectTaskTypes: await safeGetAll("projectTaskTypes"),
        ProjectTaskStatuses: await safeGetAll("projectTaskStatuses"),
        ProjectSettings: await safeGetAll("projectSettings"),
        Activity: await safeGetAll("activity"),
        Comments: await safeGetAll("comments"),
        Attachments: await safeGetAll("attachments"),
        History: await safeGetAll("history"),
        SavedViews: await safeGetAll("savedViews"),
        GuidanceItems: await safeGetAll("guidanceItems"),
        ProjectTemplates: await safeGetAll("projectTemplates"),
        FrameworkTemplates: await safeGetAll("frameworkTemplates"),
        StageTemplates: await safeGetAll("stageTemplates"),
        DeliverableTemplates: await safeGetAll("deliverableTemplates"),
        EpicTemplates: await safeGetAll("epicTemplates"),
        TaskTemplates: await safeGetAll("taskTemplates"),
        RoleTemplates: await safeGetAll("roleTemplates"),
        MilestoneTemplates: await safeGetAll("milestoneTemplates"),
        TemplateSnippets: await safeGetAll("templateSnippets"),
        StatusOptions: await safeGetAll("statusOptions"),
        RoleTypes: await safeGetAll("roleTypes"),
        MappingTemplates: await safeGetAll("mappingTemplates"),
        EpicTypes: await safeGetAll("epicTypes"),
        DeliverableTypes: await safeGetAll("deliverableTypes"),
        Users: await safeGetAll("users"),
        ProjectRoles: await safeGetAll("projectRoles"),
        ProjectTeamMembers: await safeGetAll("projectTeamMembers"),
        UserRoleEligibility: await safeGetAll("userRoleEligibility"),
        UserPreferences: await safeGetAll("userPreferences"),
        ProjectFavorites: await safeGetAll("projectFavorites"),
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
          SprintMembers: await safeGetAll("sprintMembers"),
          SprintScopeEvents: await safeGetAll("sprintScopeEvents"),
          SprintScopeTargets: await safeGetAll("sprintScopeTargets"),
          SprintPulseUpdates: await safeGetAll("sprintPulseUpdates"),
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
          SprintMembers: await safeGetAll("sprintMembers"),
          SprintScopeEvents: await safeGetAll("sprintScopeEvents"),
          SprintScopeTargets: await safeGetAll("sprintScopeTargets"),
          SprintPulseUpdates: await safeGetAll("sprintPulseUpdates"),
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
        ProjectTeamMembers: await safeGetAll("projectTeamMembers"),
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
                  return { ...task, comments: taskComments, attachments: taskAttachments, history: taskHistory, dependencies: taskDeps };
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
          const scopeTargetsData = sprintScopeTargets.filter((t: any) => t.sprintId === sprint.id || t.sprint_id === sprint.id);
          const pulseUpdates = sprintPulseUpdates.filter((u: any) => u.sprintId === sprint.id || u.sprint_id === sprint.id);
          return { ...sprint, members, scopeEvents, scopeTargets: scopeTargetsData, pulseUpdates };
        });

      return { ...project, deliverables: projectDeliverables, milestones: projectMilestones, stages: projectStagesData, sprints: projectSprints };
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
          projectTeamMembers: await safeGet("projectTeamMembers"),
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
    }, 100);
  };

  const handleDownloadTemplate = (format: "xlsx" | "json") => {
    const schema = SCHEMA_DEFINITIONS[activeTab];
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
    const schema = SCHEMA_DEFINITIONS[activeTab];
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

  return {
    activeTab,
    setActiveTab,
    exportFormat,
    setExportFormat,
    isExporting,
    progress,
    useNestedExport,
    setUseNestedExport,
    availableProjects,
    selectedProjectIds,
    setSelectedProjectIds,
    selectiveExportEnabled,
    setSelectiveExportEnabled,
    handleExport,
    handleDownloadTemplate,
    handleDownloadSchemaReference
  };
}
