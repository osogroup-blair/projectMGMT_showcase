import { useState } from "react";
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
  Briefcase
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

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
  MILESTONE_TASK_LINKS,
  PROJECT_STATUS_OPTIONS,
  TASK_STATUS_OPTIONS
} from "@/lib/mock-data";

// Schema Definitions
const SCHEMA_DEFINITIONS = {
  projects: [
    { sheet: "Projects", columns: ["id", "name", "client_id", "status", "start_date", "deadline", "progress", "framework_id", "default_mapping_template_id", "permissions"] },
    { sheet: "Deliverables", columns: ["id", "project_id", "title", "description", "status", "owner_id", "due_date", "progress"] },
    { sheet: "Epics", columns: ["id", "project_id", "deliverable_id", "title", "description", "status", "owner_id", "start_date", "end_date", "progress"] },
    { sheet: "Tasks", columns: ["id", "project_id", "deliverable_id", "epic_id", "stage_id", "epic_stage_id", "title", "description", "status", "assignee_id", "deadline", "priority", "estimate_hours", "milestone_id", "tags"] },
    { sheet: "Milestones", columns: ["id", "project_id", "stage_id", "name", "description", "phase", "target_date", "status", "owner_id", "scope_type", "completion_mode", "completion_target_percent", "tags", "progress_percent", "is_billing_gate"] }
  ],
  templates: [
    { sheet: "ProjectTemplates", columns: ["id", "name", "description", "default_roles", "default_deliverables", "default_framework_id"] },
    { sheet: "FrameworkTemplates", columns: ["id", "name", "description", "default_stages"] },
    { sheet: "StageTemplates", columns: ["id", "name", "description", "default_tasks", "default_roles", "assigned_frameworks"] },
    { sheet: "DeliverableTemplates", columns: ["id", "title", "description", "default_epics"] },
    { sheet: "EpicTemplates", columns: ["id", "title", "description", "default_stages"] },
    { sheet: "TaskTemplates", columns: ["id", "title", "description", "default_priority", "default_estimate_hours", "required_role"] },
    { sheet: "RoleTemplates", columns: ["id", "name", "description", "default_role_type", "default_permissions"] }
  ],
  defaults: [
    { sheet: "ProjectStatuses", columns: ["id", "label", "color", "description"] },
    { sheet: "TaskStatuses", columns: ["id", "label", "color", "description"] },
    { sheet: "StageTypes", columns: ["id", "label", "description"] },
    { sheet: "MappingTemplates", columns: ["id", "name", "data_type"] },
    { sheet: "GuidanceItems", columns: ["id", "title", "body", "priority", "stage_id"] }
  ],
  users: [
    { sheet: "Users", columns: ["id", "name", "email", "role", "status"] },
    { sheet: "ProjectRoles", columns: ["id", "name", "description", "role_type", "is_required", "max_assignees", "permissions"] },
    { sheet: "RoleAssignments", columns: ["id", "role_id", "user_id", "is_primary", "allocation_percent"] }
  ]
};

export default function AdminImportExport() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("projects");
  const [exportFormat, setExportFormat] = useState<"xlsx" | "json" | "yaml">("xlsx");
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSchema, setShowSchema] = useState(false);

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

  const generateExportData = () => {
    let data: any = {};

    if (activeTab === "projects") {
      data = {
        Projects: serialize(PROJECTS),
        Deliverables: serialize(DELIVERABLES),
        Epics: serialize(EPICS),
        Tasks: serialize(TASKS),
        Milestones: serialize(MILESTONES),
        MilestoneScopeRules: serialize(MILESTONE_SCOPE_RULES),
        MilestoneTaskLinks: serialize(MILESTONE_TASK_LINKS)
      };
    } else if (activeTab === "templates") {
      data = {
        ProjectTemplates: serialize(PROJECT_TEMPLATES),
        FrameworkTemplates: serialize(FRAMEWORK_TEMPLATES),
        StageTemplates: serialize(STAGE_TEMPLATES),
        DeliverableTemplates: serialize(DELIVERABLE_TEMPLATES),
        EpicTemplates: serialize(EPIC_TEMPLATES),
        TaskTemplates: serialize(TASK_TEMPLATES),
        RoleTemplates: serialize(ROLE_TEMPLATES)
      };
    } else if (activeTab === "defaults") {
      data = {
        ProjectStatuses: serialize(PROJECT_STATUS_OPTIONS),
        TaskStatuses: serialize(TASK_STATUS_OPTIONS),
        // StageTypes are currently hardcoded in component state in app-defaults, 
        // normally these would be in mock-data too. For now we export what we have.
        MappingTemplates: serialize(MAPPING_TEMPLATES),
        GuidanceItems: serialize(GUIDANCE_ITEMS)
      };
    } else if (activeTab === "users") {
      data = {
        Users: serialize(TEAM),
        ProjectRoles: serialize(PROJECT_ROLES),
        RoleAssignments: serialize(ROLE_ASSIGNMENTS)
      };
    }

    return data;
  };

  const handleExport = async () => {
    setIsExporting(true);
    setProgress(10);

    setTimeout(() => {
      setProgress(50);
      try {
        const data = generateExportData();
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
    }, 1500);
  };

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const schema = SCHEMA_DEFINITIONS[activeTab as keyof typeof SCHEMA_DEFINITIONS];
    
    if (schema) {
      schema.forEach(def => {
        const ws = XLSX.utils.aoa_to_sheet([def.columns]);
        XLSX.utils.book_append_sheet(wb, ws, def.sheet);
      });

      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      saveAs(blob, `Nexus_${activeTab}_Import_Template.xlsx`);

      toast({
          title: "Template Downloaded",
          description: "Empty import template generated successfully.",
      });
    }
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

  return (
    <Shell>
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Import & Export</h1>
            <p className="text-muted-foreground">Manage data portability across projects, templates, defaults, and users.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                 <Button variant="outline" onClick={handleDownloadTemplate}>
                    Download Template
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
                <CardContent>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer group">
                        <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-background transition-colors">
                            <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
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
    </Shell>
  );
}
