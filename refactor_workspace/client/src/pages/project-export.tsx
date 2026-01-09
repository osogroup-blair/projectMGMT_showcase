import { useState } from "react";
import { useRoute, Link } from "wouter";
import * as XLSX from "xlsx";
import * as yaml from "js-yaml";
import { saveAs } from "file-saver";
import { Shell } from "@/components/layout/shell";
import { 
  Download, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Info,
  ChevronRight,
  ChevronDown,
  FileJson,
  FileCode
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Import all mock data
import { 
  PROJECTS, 
  DELIVERABLES, 
  EPICS, 
  PROJECT_STAGES, 
  TASKS, 
  MILESTONES, 
  TEAM, 
  PROJECT_ROLES, 
  ROLE_ASSIGNMENTS, 
  SAVED_VIEWS, 
  GUIDANCE_ITEMS, 
  STAGE_TEMPLATES, 
  FRAMEWORK_TEMPLATES, 
  PROJECT_TEMPLATES, 
  DELIVERABLE_TEMPLATES, 
  EPIC_TEMPLATES, 
  TASK_TEMPLATES, 
  MAPPING_TEMPLATES, 
  ROLE_TEMPLATES,
  MILESTONE_SCOPE_RULES,
  MILESTONE_TASK_LINKS
} from "@/lib/mock-data";

// Schema Definitions based on Prompt
const SCHEMA_DEFINITIONS = [
  {
    sheet: "Projects",
    columns: ["id", "name", "client_id", "status", "start_date", "deadline", "progress", "framework_id", "default_mapping_template_id", "permissions"]
  },
  {
    sheet: "Deliverables",
    columns: ["id", "project_id", "title", "description", "status", "owner_id", "due_date", "progress"]
  },
  {
    sheet: "Epics",
    columns: ["id", "project_id", "deliverable_id", "title", "description", "status", "owner_id", "start_date", "end_date", "progress"]
  },
  {
    sheet: "Stages",
    columns: ["id", "name", "order", "type", "entry_criteria", "exit_criteria", "status"]
  },
  {
    sheet: "EpicStages", // Virtual table in our mock data
    columns: ["id", "project_id", "epic_id", "stage_id", "status", "planned_start_date", "planned_end_date"]
  },
  {
    sheet: "Tasks",
    columns: ["id", "project_id", "deliverable_id", "epic_id", "stage_id", "epic_stage_id", "title", "description", "status", "assignee_id", "deadline", "priority", "estimate_hours", "milestone_id", "tags"]
  },
  {
    sheet: "Milestones",
    columns: ["id", "project_id", "stage_id", "name", "description", "phase", "target_date", "status", "owner_id", "scope_type", "completion_mode", "completion_target_percent", "tags", "progress_percent", "is_billing_gate"]
  },
  {
    sheet: "MilestoneScopeRules",
    columns: ["id", "milestone_id", "label", "task_template_key", "stage", "active", "filters"]
  },
  {
    sheet: "MilestoneTaskLinks",
    columns: ["id", "milestone_id", "task_id", "source", "rule_id", "locked"]
  },
  {
    sheet: "Users",
    columns: ["id", "name", "email", "role", "status"]
  },
  {
    sheet: "ProjectRoles",
    columns: ["id", "name", "description", "role_type", "is_required", "max_assignees", "permissions"]
  },
  {
    sheet: "RoleAssignments",
    columns: ["id", "role_id", "user_id", "is_primary", "allocation_percent"]
  },
  {
    sheet: "SavedViews",
    columns: ["id", "name", "description", "stage_ids", "view_type", "visibility", "is_default", "config"]
  },
  {
    sheet: "GuidanceItems",
    columns: ["id", "title", "body", "priority", "stage_id"]
  },
  {
    sheet: "StageTemplates",
    columns: ["id", "name", "description", "default_tasks"]
  },
  {
    sheet: "MappingTemplates",
    columns: ["id", "name", "data_type"]
  },
  {
    sheet: "RoleTemplates",
    columns: ["id", "name", "description", "default_role_type", "default_permissions"]
  }
];

export default function ProjectExport() {
  const [match, params] = useRoute("/projects/:projectId/export");
  const projectId = params?.projectId || "1";
  const project = PROJECTS.find(p => p.id === projectId) || PROJECTS[0];
  const { toast } = useToast();

  const [scope, setScope] = useState<"project" | "all">("project");
  const [exportFormat, setExportFormat] = useState<"xlsx" | "json" | "yaml">("xlsx");
  const [includeConfig, setIncludeConfig] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSchema, setShowSchema] = useState(false);

  // Generate Data for Export
  const generateExportData = () => {
    // Filter functions based on scope
    const filterByProject = (item: any) => scope === "all" || item.projectId === projectId || item.project === project.name || item.id === projectId;
    const filterGlobal = () => true; // Config items are global in this prototype

    // 1. Projects
    const projectsData = (scope === "all" ? PROJECTS : [project]).map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      start_date: p.startDate,
      deadline: p.deadline,
      progress: p.progress,
      framework_id: p.frameworkId,
      default_mapping_template_id: p.defaultMappingTemplateId,
      permissions: JSON.stringify(p.permissions || {})
    }));

    // 2. Deliverables
    const deliverablesData = DELIVERABLES.filter(d => scope === "all" || d.projectId === projectId).map(d => ({
      id: d.id,
      project_id: d.projectId,
      title: d.title,
      description: d.description,
      status: d.status,
      owner_id: d.ownerId,
      due_date: d.dueDate,
      progress: d.progress
    }));

    // 3. Epics
    // Need to link Epics to Project via Deliverable
    const relevantDeliverableIds = new Set(deliverablesData.map(d => d.id));
    const epicsData = EPICS.filter(e => relevantDeliverableIds.has(e.deliverableId)).map(e => ({
      id: e.id,
      project_id: DELIVERABLES.find(d => d.id === e.deliverableId)?.projectId,
      deliverable_id: e.deliverableId,
      title: e.title,
      description: e.description,
      status: e.status,
      owner_id: e.ownerId,
      start_date: e.startDate,
      end_date: e.endDate,
      progress: e.progress
    }));

    // 4. Stages (Global definitions)
    const stagesData = PROJECT_STAGES.map(s => ({
      id: s.id,
      name: s.name,
      order: s.order,
      type: s.type,
      status: s.status
    }));

    // 5. EpicStages (Derived Junction Table)
    // In our mock data, this is implicit in Epic.stageIds. We explicate it here.
    const epicStagesData: any[] = [];
    epicsData.forEach(e => {
        const originalEpic = EPICS.find(oe => oe.id === e.id);
        if (originalEpic && originalEpic.stageIds) {
            originalEpic.stageIds.forEach((stageId, index) => {
                epicStagesData.push({
                    id: `${e.id}_${stageId}`,
                    project_id: e.project_id,
                    epic_id: e.id,
                    stage_id: stageId,
                    status: "Pending", // Mock default
                    sequence_index: index + 1
                });
            });
        }
    });

    // 6. Tasks
    const tasksData = TASKS.filter(t => 
      scope === "all" || 
      t.project === project.name || 
      project.name.includes(t.project) ||
      t.project.includes(project.name)
    ).map(t => ({
      id: t.id,
      project_id: projectId, // In real app, verify project name match
      deliverable_id: EPICS.find(e => e.id === t.epicId)?.deliverableId,
      epic_id: t.epicId,
      stage_id: t.stageId,
      epic_stage_id: t.epicId && t.stageId ? `${t.epicId}_${t.stageId}` : null,
      title: t.title,
      description: t.description,
      status: t.status,
      assignee_id: t.assigneeId,
      deadline: t.deadline,
      priority: t.priority,
      estimate_hours: t.estimateHours,
      milestone_id: t.milestoneId,
      tags: JSON.stringify(t.tags || [])
    }));

    // 7. Milestones
    const milestonesData = MILESTONES.filter(m => scope === "all" || m.projectId === projectId).map(m => ({
      id: m.id,
      project_id: m.projectId || projectId, // Mock assumption
      stage_id: m.stageId,
      name: m.name,
      description: m.description,
      phase: m.phase,
      target_date: m.targetDate,
      status: m.status,
      owner_id: m.ownerId,
      scope_type: m.scopeType,
      completion_mode: m.completionMode,
      completion_target_percent: m.completionTargetPercent,
      tags: JSON.stringify(m.tags || []),
      progress_percent: m.progress.percentComplete, // Use new progress object
      is_billing_gate: m.isBillingGate
    }));

    // 8. MilestoneScopeRules
    const milestoneScopeRulesData: any[] = [];
    MILESTONE_SCOPE_RULES.forEach(msr => {
        // Filter by milestone ID if scoping to project
        const milestone = MILESTONES.find(m => m.id === msr.milestoneId);
        if (scope === "all" || (milestone && (milestone.projectId === projectId))) {
             msr.rules.forEach(rule => {
                milestoneScopeRulesData.push({
                    id: rule.id,
                    milestone_id: msr.milestoneId,
                    label: rule.label,
                    task_template_key: rule.taskTemplateKey,
                    stage: rule.stage,
                    active: rule.active,
                    filters: JSON.stringify(rule.filters || {})
                });
             });
        }
    });

    // 9. MilestoneTaskLinks
    const milestoneTaskLinksData = MILESTONE_TASK_LINKS.filter(mtl => {
         const milestone = MILESTONES.find(m => m.id === mtl.milestoneId);
         return scope === "all" || (milestone && (milestone.projectId === projectId));
    }).map(mtl => ({
        id: mtl.id,
        milestone_id: mtl.milestoneId,
        task_id: mtl.taskId,
        source: mtl.source,
        rule_id: mtl.ruleId,
        locked: mtl.locked
    }));

    // Config Data (included if toggle is on)
    const usersData = includeConfig ? TEAM.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, status: u.status })) : [];
    const rolesData = includeConfig ? PROJECT_ROLES.map(r => ({ id: r.id, name: r.name, description: r.description, role_type: r.roleType, is_required: r.isRequired, max_assignees: r.maxAssignees, permissions: JSON.stringify(r.permissions) })) : [];
    const assignmentsData = includeConfig ? ROLE_ASSIGNMENTS.map(ra => ({ id: ra.id, role_id: ra.roleId, user_id: ra.userId, is_primary: ra.isPrimary, allocation_percent: ra.allocationPercent })) : [];
    const savedViewsData = includeConfig ? SAVED_VIEWS.map(v => ({ id: v.id, name: v.name, description: v.description, stage_ids: JSON.stringify(v.stageIds), view_type: v.viewType, visibility: v.visibility, is_default: v.isDefault, config: JSON.stringify(v.config) })) : [];
    const guidanceData = includeConfig ? GUIDANCE_ITEMS.map(g => ({ id: g.id, title: g.title, body: g.body, priority: g.priority, stage_id: g.stageId })) : [];
    const stageTemplatesData = includeConfig ? STAGE_TEMPLATES.map(st => ({ id: st.id, name: st.name, default_tasks: JSON.stringify(st.defaultTasks) })) : [];
    const mappingTemplatesData = includeConfig ? MAPPING_TEMPLATES.map(mt => ({ id: mt.id, name: mt.name, data_type: mt.dataType })) : [];
    const roleTemplatesData = includeConfig ? ROLE_TEMPLATES.map(rt => ({ id: rt.id, name: rt.name, description: rt.description, default_role_type: rt.defaultRoleType, default_permissions: JSON.stringify(rt.defaultPermissions) })) : [];

    return {
      Projects: projectsData,
      Deliverables: deliverablesData,
      Epics: epicsData,
      Stages: stagesData,
      EpicStages: epicStagesData,
      Tasks: tasksData,
      Milestones: milestonesData,
      MilestoneScopeRules: milestoneScopeRulesData,
      MilestoneTaskLinks: milestoneTaskLinksData,
      Users: usersData,
      ProjectRoles: rolesData,
      RoleAssignments: assignmentsData,
      SavedViews: savedViewsData,
      GuidanceItems: guidanceData,
      StageTemplates: stageTemplatesData,
      MappingTemplates: mappingTemplatesData,
      RoleTemplates: roleTemplatesData
    };
  };

  const handleExport = async () => {
    setIsExporting(true);
    setProgress(10);

    // Simulate Processing Delay
    setTimeout(() => {
      setProgress(50);
      try {
        const data = generateExportData();
        const baseFilename = `${project.name.replace(/\s+/g, '_')}_Export_${new Date().toISOString().split('T')[0]}`;

        if (exportFormat === "xlsx") {
          const wb = XLSX.utils.book_new();
          // Add Sheets
          Object.entries(data).forEach(([sheetName, sheetData]) => {
            if (sheetData.length > 0) {
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
          description: `Your project data has been successfully exported as ${exportFormat.toUpperCase()}.`,
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
    }, 1500);
  };

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    
    // Create empty sheets with headers
    SCHEMA_DEFINITIONS.forEach(def => {
      const ws = XLSX.utils.aoa_to_sheet([def.columns]);
      XLSX.utils.book_append_sheet(wb, ws, def.sheet);
    });

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `Nexus_Import_Template.xlsx`);

    toast({
        title: "Template Downloaded",
        description: "Empty import template generated successfully.",
    });
  };

  return (
    <Shell>
      <div className="space-y-8">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                 <Link href={`/projects/${projectId}/settings`}>Settings</Link>
                 <ChevronRight className="h-3 w-3" />
                 <span className="text-foreground">Data Export</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-primary">Data Export</h1>
              <p className="text-muted-foreground">Export project data for backup, analysis, or migration.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Configuration</CardTitle>
                <CardDescription>Customize the scope and format of your export.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Export Scope</Label>
                  <Select value={scope} onValueChange={(v: any) => setScope(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="project">This Project Only ({project.name})</SelectItem>
                      <SelectItem value="all">All Projects (Admin)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Format</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div 
                      className={cn(
                        "border rounded-md p-4 flex flex-col items-center gap-2 cursor-pointer transition-all hover:bg-muted/50 relative",
                        exportFormat === "xlsx" ? "bg-primary/5 border-primary ring-1 ring-primary" : "opacity-70"
                      )}
                      onClick={() => setExportFormat("xlsx")}
                    >
                        <FileSpreadsheet className={cn("h-6 w-6", exportFormat === "xlsx" ? "text-primary" : "text-muted-foreground")} />
                        <div className="text-xs font-medium">Excel (.xlsx)</div>
                        {exportFormat === "xlsx" && <CheckCircle2 className="h-4 w-4 text-primary absolute top-2 right-2" />}
                    </div>
                    
                    <div 
                      className={cn(
                        "border rounded-md p-4 flex flex-col items-center gap-2 cursor-pointer transition-all hover:bg-muted/50 relative",
                        exportFormat === "json" ? "bg-primary/5 border-primary ring-1 ring-primary" : "opacity-70"
                      )}
                      onClick={() => setExportFormat("json")}
                    >
                        <FileJson className={cn("h-6 w-6", exportFormat === "json" ? "text-primary" : "text-muted-foreground")} />
                        <div className="text-xs font-medium">JSON (.json)</div>
                        {exportFormat === "json" && <CheckCircle2 className="h-4 w-4 text-primary absolute top-2 right-2" />}
                    </div>

                    <div 
                      className={cn(
                        "border rounded-md p-4 flex flex-col items-center gap-2 cursor-pointer transition-all hover:bg-muted/50 relative",
                        exportFormat === "yaml" ? "bg-primary/5 border-primary ring-1 ring-primary" : "opacity-70"
                      )}
                      onClick={() => setExportFormat("yaml")}
                    >
                        <FileCode className={cn("h-6 w-6", exportFormat === "yaml" ? "text-primary" : "text-muted-foreground")} />
                        <div className="text-xs font-medium">YAML (.yaml)</div>
                        {exportFormat === "yaml" && <CheckCircle2 className="h-4 w-4 text-primary absolute top-2 right-2" />}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                    <Switch id="include-config" checked={includeConfig} onCheckedChange={setIncludeConfig} />
                    <Label htmlFor="include-config">Include Configuration Data</Label>
                </div>
                <p className="text-xs text-muted-foreground pl-12 -mt-2">
                    Includes Saved Views, Roles, Guidance, and Templates.
                </p>

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
                 <Button variant="outline" onClick={handleDownloadTemplate}>
                    Download Template Only
                 </Button>
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

            <div className="border rounded-lg p-4 bg-blue-50/50 border-blue-100 flex gap-3">
                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">Round-trip Compatible</p>
                    <p>
                        The exported file follows a strict schema that allows it to be re-imported to update data or migrate to another environment.
                        IDs are preserved to ensure relationships are maintained.
                    </p>
                </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Schema Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[400px]">
                        <div className="divide-y">
                            {SCHEMA_DEFINITIONS.map((schema, i) => (
                                <div key={i} className="p-3 text-sm hover:bg-muted/50">
                                    <div className="font-medium flex items-center gap-2">
                                        <Database className="h-3 w-3 text-muted-foreground" />
                                        {schema.sheet}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1 truncate">
                                        Keys: {schema.columns.slice(0, 3).join(", ")}...
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
                <CardContent>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">Upload File</p>
                        <p className="text-xs text-muted-foreground mt-1">Supports .xlsx, .json, .yaml</p>
                    </div>
                </CardContent>
            </Card>
          </div>
        </div>

        {showSchema && (
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Full Schema Definition</CardTitle>
                    <CardDescription>Detailed column structure for all entities.</CardDescription>
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
                            {SCHEMA_DEFINITIONS.map((def) => (
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
    </Shell>
  );
}
