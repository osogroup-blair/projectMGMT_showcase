import { useState } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  Layers, 
  ListTodo, 
  Plus, 
  Search, 
  Settings, 
  Users,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  ChevronRight,
  Check,
  Workflow,
  Loader2,
  Download,
  Upload,
  FileJson,
  AlertCircle,
  Flag
} from "lucide-react";
import { useRoleTypes } from "@/hooks/use-nexus-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  TaskTemplate,
  StageTemplate,
  FrameworkTemplate,
  RoleTemplate
} from "@/lib/mock-data";
import { 
  useFrameworkTemplates, 
  useProjectTemplates, 
  useStageTemplates, 
  useDeliverableTemplates, 
  useEpicTemplates, 
  useTaskTemplates, 
  useRoleTemplates,
  useMilestoneTemplates
} from "@/hooks/use-nexus-data";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

interface AdminTemplatesProps {
  embedded?: boolean;
}

export default function AdminTemplates({ embedded = false }: AdminTemplatesProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("frameworks");

  // Database hooks for all template types
  const { 
    data: projectTemplates, 
    createAsync: createProject, 
    updateAsync: updateProject, 
    removeAsync: removeProject,
    isLoading: projectsLoading 
  } = useProjectTemplates();
  
  const { 
    data: frameworkTemplates, 
    createAsync: createFramework, 
    updateAsync: updateFramework, 
    removeAsync: removeFramework,
    isLoading: frameworksLoading 
  } = useFrameworkTemplates();
  
  const { 
    data: stageTemplates, 
    createAsync: createStage, 
    updateAsync: updateStage, 
    removeAsync: removeStage,
    isLoading: stagesLoading 
  } = useStageTemplates();
  
  const { 
    data: deliverableTemplates, 
    createAsync: createDeliverable, 
    updateAsync: updateDeliverable, 
    removeAsync: removeDeliverable,
    isLoading: deliverablesLoading 
  } = useDeliverableTemplates();
  
  const { 
    data: epicTemplates, 
    createAsync: createEpic, 
    updateAsync: updateEpic, 
    removeAsync: removeEpic,
    isLoading: epicsLoading 
  } = useEpicTemplates();
  
  const { 
    data: taskTemplates, 
    createAsync: createTask, 
    updateAsync: updateTask, 
    removeAsync: removeTask,
    isLoading: tasksLoading 
  } = useTaskTemplates();
  
  const { 
    data: roleTemplates, 
    createAsync: createRole, 
    updateAsync: updateRole, 
    removeAsync: removeRole,
    isLoading: rolesLoading 
  } = useRoleTemplates();

  const {
    data: milestoneTemplates,
    createAsync: createMilestone,
    updateAsync: updateMilestone,
    removeAsync: removeMilestone,
    isLoading: milestonesLoading
  } = useMilestoneTemplates();

  const { data: roleTypes = [] } = useRoleTypes();

  const isLoading = projectsLoading || frameworksLoading || stagesLoading || 
                    deliverablesLoading || epicsLoading || tasksLoading || rolesLoading || milestonesLoading;

  // Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<any>(null);
  const [currentType, setCurrentType] = useState<"project" | "framework" | "stage" | "deliverable" | "epic" | "task" | "role" | "milestone">("project");

  // Task Management State inside Stage Dialog
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<any>(null);

  const [selectedFrameworkFilter, setSelectedFrameworkFilter] = useState<string>("all");
  const [selectedRoleTypeFilter, setSelectedRoleTypeFilter] = useState<string>("all");
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>("all");

  // Form State (Generic)
  const [formData, setFormData] = useState<any>({});

  // Import/Export State
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importData, setImportData] = useState<any>(null);
  const [importMode, setImportMode] = useState<"skip" | "overwrite">("skip");
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/templates/export");
      if (!response.ok) throw new Error("Export failed");
      const data = await response.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `templates-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: "All templates have been exported successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.templates) {
          throw new Error("Invalid template file format");
        }
        setImportData(data);
      } catch (error: any) {
        toast({
          title: "Invalid File",
          description: error.message,
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importData) return;
    
    setIsImporting(true);
    try {
      const response = await fetch("/api/templates/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templates: importData.templates, mode: importMode }),
      });
      
      if (!response.ok) throw new Error("Import failed");
      const result = await response.json();
      
      const totalCreated = Object.values(result.results).reduce((sum: number, r: any) => sum + r.created, 0);
      const totalUpdated = Object.values(result.results).reduce((sum: number, r: any) => sum + r.updated, 0);
      const totalSkipped = Object.values(result.results).reduce((sum: number, r: any) => sum + r.skipped, 0);
      
      toast({
        title: "Import Complete",
        description: `Created: ${totalCreated}, Updated: ${totalUpdated}, Skipped: ${totalSkipped}`,
      });
      
      setIsImportOpen(false);
      setImportData(null);
      
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const filterTemplates = (templates: any[]) => {
    let filtered = (templates || []).filter(t => 
      t.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (activeTab === 'stages' && selectedFrameworkFilter !== 'all') {
      const framework = (frameworkTemplates || []).find(f => f.id === selectedFrameworkFilter);
      if (framework) {
        filtered = filtered.filter(t => (framework.defaultStages || []).includes(t.id));
      }
    }

    if (activeTab === 'roles' && selectedRoleTypeFilter !== 'all') {
      filtered = filtered.filter(t => t.defaultRoleType === selectedRoleTypeFilter);
    }

    return filtered;
  };

  const filterTaskTemplates = (templates: any[]) => {
    let filtered = (templates || []).filter(t => 
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (selectedPriorityFilter !== 'all') {
      filtered = filtered.filter(t => t.defaultPriority === selectedPriorityFilter);
    }

    return filtered;
  };

  const filterMilestoneTemplates = (templates: any[]) => {
    let filtered = (templates || []).filter(t => 
      t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (selectedFrameworkFilter !== 'all') {
      filtered = filtered.filter(t => t.stageTemplateId === selectedFrameworkFilter);
    }

    return filtered;
  };

  // CRUD Handlers
  const handleCreate = (type: string) => {
    setCurrentTemplate(null);
    setCurrentType(type as any);
    
    // Special handling for Stage Template to use the new Designer
    if (type === "stage") {
      setLocation("/admin/templates/stage/new");
      return;
    }

    // Initialize empty form data based on type
    const initialData: any = { description: "" };
    if (type === "project") { initialData.name = ""; initialData.defaultRoles = []; initialData.defaultDeliverables = []; initialData.defaultFrameworkId = ""; }
    if (type === "framework") { initialData.name = ""; initialData.defaultStages = []; }
    if (type === "stage") { 
      initialData.name = ""; 
      initialData.defaultTasks = []; 
      initialData.defaultRoles = [];
      // Initialize assigned frameworks for new stage
      initialData.assignedFrameworks = selectedFrameworkFilter !== 'all' ? [selectedFrameworkFilter] : [];
    }
    if (type === "deliverable") { initialData.title = ""; initialData.defaultEpics = []; }
    if (type === "epic") { initialData.title = ""; initialData.defaultStages = []; }
    if (type === "task") {
        initialData.title = "";
        initialData.defaultPriority = "Medium";
        initialData.defaultEstimateHours = 1;
        initialData.requiredRole = "Development";
    }
    if (type === "role") {
        initialData.name = "";
        initialData.defaultRoleType = "Development";
    }
    if (type === "milestone") {
        initialData.name = "";
        initialData.phase = "delivery";
        initialData.scopeType = "deliverable";
        initialData.completionMode = "percentage";
        initialData.completionTargetPercent = 100;
        initialData.isBillingGate = false;
        initialData.offsetDays = 0;
        initialData.stageTemplateId = selectedFrameworkFilter !== 'all' ? selectedFrameworkFilter : null;
        initialData.order = 0;
    }

    setFormData(initialData);
    setIsEditOpen(true);
  };

  const handleEdit = (template: any, type: string) => {
    setCurrentTemplate(template);
    setCurrentType(type as any);
    
    // Special handling for Stage Template
    if (type === "stage") {
      setLocation(`/admin/templates/stage/${template.id}`);
      return;
    }

    let data = { ...template };
    
    // If editing a stage, populate assigned frameworks
    if (type === 'stage') {
      data.assignedFrameworks = frameworkTemplates
        .filter(f => f.defaultStages.includes(template.id))
        .map(f => f.id);
    }
    
    setFormData(data);
    setIsEditOpen(true);
  };

  const handleDeleteClick = (template: any, type: string) => {
    setCurrentTemplate(template);
    setCurrentType(type as any);
    setIsDeleteOpen(true);
  };


  const handleSave = async () => {
    const isNew = !currentTemplate;
    const newId = isNew ? `${currentType.charAt(0)}t${Date.now()}` : currentTemplate.id;
    const newItem = { ...formData, id: newId };

    try {
      if (currentType === "project") {
        if (isNew) {
          await createProject(newItem);
        } else {
          await updateProject({ id: newItem.id, updates: newItem });
        }
      } else if (currentType === "framework") {
        if (isNew) {
          await createFramework(newItem);
        } else {
          await updateFramework({ id: newItem.id, updates: newItem });
        }
      } else if (currentType === "stage") {
        if (isNew) {
          await createStage(newItem);
        } else {
          await updateStage({ id: newItem.id, updates: newItem });
        }
        
        // Update Framework Assignments
        if (formData.assignedFrameworks) {
          for (const fw of (frameworkTemplates || [])) {
            const shouldHaveStage = formData.assignedFrameworks.includes(fw.id);
            const hasStage = (fw.defaultStages || []).includes(newItem.id);
            
            if (shouldHaveStage && !hasStage) {
              await updateFramework({ id: fw.id, updates: { ...fw, defaultStages: [...(fw.defaultStages || []), newItem.id] } });
            } else if (!shouldHaveStage && hasStage) {
              await updateFramework({ id: fw.id, updates: { ...fw, defaultStages: (fw.defaultStages || []).filter((id: string) => id !== newItem.id) } });
            }
          }
        }
      } else if (currentType === "deliverable") {
        if (isNew) {
          await createDeliverable(newItem);
        } else {
          await updateDeliverable({ id: newItem.id, updates: newItem });
        }
      } else if (currentType === "epic") {
        if (isNew) {
          await createEpic(newItem);
        } else {
          await updateEpic({ id: newItem.id, updates: newItem });
        }
      } else if (currentType === "task") {
        if (isNew) {
          await createTask(newItem);
        } else {
          await updateTask({ id: newItem.id, updates: newItem });
        }
      } else if (currentType === "role") {
        if (isNew) {
          await createRole(newItem);
        } else {
          await updateRole({ id: newItem.id, updates: newItem });
        }
      } else if (currentType === "milestone") {
        if (isNew) {
          await createMilestone(newItem);
        } else {
          await updateMilestone({ id: newItem.id, updates: newItem });
        }
      }

      setIsEditOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentTemplate) return;

    try {
      if (currentType === "project") {
        await removeProject(currentTemplate.id);
      } else if (currentType === "framework") {
        await removeFramework(currentTemplate.id);
      } else if (currentType === "stage") {
        await removeStage(currentTemplate.id);
      } else if (currentType === "deliverable") {
        await removeDeliverable(currentTemplate.id);
      } else if (currentType === "epic") {
        await removeEpic(currentTemplate.id);
      } else if (currentType === "task") {
        await removeTask(currentTemplate.id);
      } else if (currentType === "role") {
        await removeRole(currentTemplate.id);
      } else if (currentType === "milestone") {
        await removeMilestone(currentTemplate.id);
      }

      setIsDeleteOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete template: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const toggleSelection = (list: string[], item: string, field: string) => {
    const newList = list.includes(item) 
      ? list.filter(i => i !== item)
      : [...list, item];
    setFormData({ ...formData, [field]: newList });
  };

  const TemplateCard = ({ item, type, icon: Icon, itemsCount, itemLabel, badge }: any) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(item, type)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit Template
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const dup = { ...item, id: undefined, name: `${item.name || item.title} (Copy)`, title: `${item.name || item.title} (Copy)` };
                handleCreate(type);
                setFormData(dup);
              }}>
                <Copy className="mr-2 h-4 w-4" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(item, type)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardTitle className="text-lg mt-3">{item.name || item.title}</CardTitle>
        <CardDescription className="line-clamp-2 mt-1 h-10">
          {item.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between pt-2 border-t text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="font-medium text-foreground">{itemsCount}</span> {itemLabel}
          </div>
          {badge && (
            <Badge variant="secondary" className="font-normal text-xs">
              {badge}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const Wrapper = embedded ? ({ children }: { children: React.ReactNode }) => <>{children}</> : Shell;

  if (isLoading) {
    return (
      <Wrapper>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className="space-y-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {!embedded && (
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-primary">Template Management</h1>
                <p className="text-muted-foreground">Manage and configure templates for projects, deliverables, epics, and tasks.</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="gap-2" 
                onClick={() => setIsImportOpen(true)}
                data-testid="button-import-templates"
              >
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <Button 
                variant="outline" 
                className="gap-2" 
                onClick={handleExport}
                disabled={isExporting}
                data-testid="button-export-templates"
              >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Export
              </Button>
              <Button className="gap-2" onClick={() => handleCreate(activeTab.slice(0, -1))}>
                <Plus className="h-4 w-4" />
                Create {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(0, -1).slice(1)} Template
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6 overflow-x-auto">
            <TabsTrigger 
              value="frameworks" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 flex items-center gap-2"
            >
              <Workflow className="h-4 w-4" />
              Frameworks
            </TabsTrigger>
            <TabsTrigger 
              value="stages" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 flex items-center gap-2"
            >
              <Layers className="h-4 w-4" />
              Stages
            </TabsTrigger>
            <TabsTrigger 
              value="tasks" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 flex items-center gap-2"
            >
              <ListTodo className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger 
              value="roles" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Roles
            </TabsTrigger>
            <TabsTrigger 
              value="milestones" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 flex items-center gap-2"
            >
              <Flag className="h-4 w-4" />
              Milestones
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 mb-6">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search templates..." 
                className="pl-9 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-templates"
              />
            </div>
          </div>

          <div className="mt-6">
            <TabsContent value="frameworks" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterTemplates(frameworkTemplates).map(t => (
                  <TemplateCard 
                    key={t.id}
                    item={t}
                    type="framework"
                    icon={Workflow}
                    itemsCount={t.defaultStages?.length || 5}
                    itemLabel="Stages"
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="stages" className="space-y-6">
              <div className="flex items-center gap-4 mb-4 bg-muted/20 p-3 rounded-lg border">
                 <Workflow className="h-4 w-4 text-muted-foreground" />
                 <span className="text-sm font-medium">Filter by Framework:</span>
                 <SearchableSelect
                    value={selectedFrameworkFilter}
                    onValueChange={setSelectedFrameworkFilter}
                    placeholder="All Frameworks"
                    triggerClassName="w-[250px] h-8 text-xs"
                    options={[
                      { value: "all", label: "All Frameworks" },
                      ...frameworkTemplates.map(fw => ({ value: fw.id, label: fw.name }))
                    ]}
                 />
                 {selectedFrameworkFilter !== 'all' && (
                   <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs ml-auto text-muted-foreground hover:text-foreground"
                    onClick={() => setSelectedFrameworkFilter('all')}
                   >
                     Clear Filter
                   </Button>
                 )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterTemplates(stageTemplates).map(t => (
                  <TemplateCard 
                    key={t.id}
                    item={t}
                    type="stage"
                    icon={Layers}
                    itemsCount={t.defaultTasks?.length || 0}
                    itemLabel="Tasks"
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-6">
              <div className="flex items-center gap-4 mb-4 bg-muted/20 p-3 rounded-lg border">
                <ListTodo className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter by Priority:</span>
                <SearchableSelect
                  value={selectedPriorityFilter}
                  onValueChange={setSelectedPriorityFilter}
                  placeholder="All Priorities"
                  triggerClassName="w-[180px] h-8 text-xs"
                  data-testid="select-priority-filter"
                  options={[
                    { value: "all", label: "All Priorities" },
                    { value: "Low", label: "Low" },
                    { value: "Medium", label: "Medium" },
                    { value: "High", label: "High" },
                    { value: "Critical", label: "Critical" },
                  ]}
                />
                {selectedPriorityFilter !== 'all' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs ml-auto text-muted-foreground hover:text-foreground"
                    onClick={() => setSelectedPriorityFilter('all')}
                    data-testid="button-clear-priority-filter"
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterTaskTemplates(taskTemplates).map(t => (
                  <TemplateCard 
                    key={t.id}
                    item={t}
                    type="task"
                    icon={ListTodo}
                    itemsCount={t.defaultEstimateHours || 0}
                    itemLabel="Est. Hours"
                    badge={t.defaultPriority}
                  />
                ))}
                <Card 
                  className="flex flex-col items-center justify-center border-dashed cursor-pointer hover:bg-muted/10 transition-colors min-h-[200px]"
                  onClick={() => handleCreate('task')}
                  data-testid="card-create-task-template"
                >
                  <div className="p-4 rounded-full bg-muted text-muted-foreground mb-4">
                    <Plus className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg">Create New Task Template</h3>
                  <p className="text-sm text-muted-foreground mt-1">Define default task properties</p>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="roles" className="space-y-6">
              <div className="flex items-center gap-4 mb-4 bg-muted/20 p-3 rounded-lg border">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter by Role Type:</span>
                <SearchableSelect
                  value={selectedRoleTypeFilter}
                  onValueChange={setSelectedRoleTypeFilter}
                  placeholder="All Role Types"
                  triggerClassName="w-[200px] h-8 text-xs"
                  data-testid="select-role-type-filter"
                  options={[
                    { value: "all", label: "All Role Types" },
                    ...(roleTypes.length > 0
                      ? roleTypes.map((rt: any) => ({ value: rt.label, label: rt.label }))
                      : [
                          { value: "Development", label: "Development" },
                          { value: "Design", label: "Design" },
                          { value: "Management", label: "Management" },
                          { value: "Consulting", label: "Consulting" },
                        ])
                  ]}
                />
                {selectedRoleTypeFilter !== 'all' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs ml-auto text-muted-foreground hover:text-foreground"
                    onClick={() => setSelectedRoleTypeFilter('all')}
                    data-testid="button-clear-role-type-filter"
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterTemplates(roleTemplates).map(t => (
                  <TemplateCard 
                    key={t.id}
                    item={t}
                    type="role"
                    icon={Users}
                    itemsCount={t.defaultPermissions?.length || 0}
                    itemLabel="Permissions"
                    badge={t.defaultRoleType}
                  />
                ))}
                <Card 
                  className="flex flex-col items-center justify-center border-dashed cursor-pointer hover:bg-muted/10 transition-colors min-h-[200px]"
                  onClick={() => handleCreate('role')}
                  data-testid="card-create-role-template"
                >
                  <div className="p-4 rounded-full bg-muted text-muted-foreground mb-4">
                    <Plus className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg">Create New Role Template</h3>
                  <p className="text-sm text-muted-foreground mt-1">Define default role properties</p>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="milestones" className="space-y-6">
              <div className="flex items-center gap-4 mb-4 bg-muted/20 p-3 rounded-lg border">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter by Stage:</span>
                <SearchableSelect
                  value={selectedFrameworkFilter}
                  onValueChange={setSelectedFrameworkFilter}
                  placeholder="All Stages"
                  triggerClassName="w-[250px] h-8 text-xs"
                  data-testid="select-milestone-stage-filter"
                  options={[
                    { value: "all", label: "All Stages" },
                    ...stageTemplates.map(st => ({ value: st.id, label: st.name }))
                  ]}
                />
                {selectedFrameworkFilter !== 'all' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs ml-auto text-muted-foreground hover:text-foreground"
                    onClick={() => setSelectedFrameworkFilter('all')}
                    data-testid="button-clear-milestone-stage-filter"
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterMilestoneTemplates(milestoneTemplates).map(t => (
                  <TemplateCard 
                    key={t.id}
                    item={t}
                    type="milestone"
                    icon={Flag}
                    itemsCount={t.completionTargetPercent || 100}
                    itemLabel="% Target"
                    badge={t.phase}
                  />
                ))}
                <Card 
                  className="flex flex-col items-center justify-center border-dashed cursor-pointer hover:bg-muted/10 transition-colors min-h-[200px]"
                  onClick={() => handleCreate('milestone')}
                  data-testid="card-create-milestone-template"
                >
                  <div className="p-4 rounded-full bg-muted text-muted-foreground mb-4">
                    <Plus className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg">Create New Milestone Template</h3>
                  <p className="text-sm text-muted-foreground mt-1">Define default milestone properties</p>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>


      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
                {currentTemplate ? 'Edit' : 'Create'} {currentType.charAt(0).toUpperCase() + currentType.slice(1)} Template
            </DialogTitle>
            <DialogDescription>
              Configure the details for this template below.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="name">
                    {currentType === 'task' || currentType === 'deliverable' || currentType === 'epic' ? 'Title' : 'Name'}
                </Label>
                <Input 
                    id="name" 
                    value={formData.name || formData.title || ""} 
                    onChange={(e) => {
                        if (currentType === 'task' || currentType === 'deliverable' || currentType === 'epic') {
                            setFormData({...formData, title: e.target.value});
                        } else {
                            setFormData({...formData, name: e.target.value});
                        }
                    }}
                />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                    id="description" 
                    value={formData.description || ""} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
            </div>

            {/* Role Specific Fields */}
            {currentType === 'role' && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Role Type</Label>
                  <SearchableSelect
                    value={formData.defaultRoleType}
                    onValueChange={(val) => setFormData({...formData, defaultRoleType: val})}
                    placeholder="Select role type"
                    emptyMessage={roleTypes.length === 0 ? "No role types defined. Add them in App Defaults." : "No results found."}
                    options={roleTypes.map((rt: any) => ({ value: rt.label, label: rt.label }))}
                  />
                </div>
              </div>
            )}

            {/* Milestone Specific Fields */}
            {currentType === 'milestone' && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Linked Stage Template</Label>
                  <SearchableSelect
                    value={formData.stageTemplateId || ""}
                    onValueChange={(val) => setFormData({...formData, stageTemplateId: val || null})}
                    placeholder="Select stage (optional)"
                    options={[
                      { value: "", label: "No stage link" },
                      ...stageTemplates.map(st => ({ value: st.id, label: st.name }))
                    ]}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phase</Label>
                    <SearchableSelect
                      value={formData.phase || "delivery"}
                      onValueChange={(val) => setFormData({...formData, phase: val})}
                      placeholder="Select phase"
                      options={[
                        { value: "planning", label: "Planning" },
                        { value: "delivery", label: "Delivery" },
                        { value: "closing", label: "Closing" },
                      ]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Scope Type</Label>
                    <SearchableSelect
                      value={formData.scopeType || "deliverable"}
                      onValueChange={(val) => setFormData({...formData, scopeType: val})}
                      placeholder="Select scope"
                      options={[
                        { value: "project", label: "Project" },
                        { value: "deliverable", label: "Deliverable" },
                        { value: "epic", label: "Epic" },
                      ]}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Completion Mode</Label>
                    <SearchableSelect
                      value={formData.completionMode || "percentage"}
                      onValueChange={(val) => setFormData({...formData, completionMode: val})}
                      placeholder="Select mode"
                      options={[
                        { value: "percentage", label: "Percentage" },
                        { value: "manual", label: "Manual" },
                        { value: "tasks", label: "Tasks Complete" },
                      ]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target %</Label>
                    <Input 
                      type="number" 
                      min={0} 
                      max={100}
                      value={formData.completionTargetPercent ?? 100} 
                      onChange={(e) => setFormData({...formData, completionTargetPercent: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Offset Days</Label>
                    <Input 
                      type="number" 
                      value={formData.offsetDays ?? 0} 
                      onChange={(e) => setFormData({...formData, offsetDays: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Order</Label>
                    <Input 
                      type="number" 
                      min={0}
                      value={formData.order ?? 0} 
                      onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div 
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors",
                      formData.isBillingGate ? "bg-primary border-primary text-primary-foreground" : "border-input bg-background"
                    )}
                    onClick={() => setFormData({...formData, isBillingGate: !formData.isBillingGate})}
                  >
                    {formData.isBillingGate && <Check className="w-3 h-3" />}
                  </div>
                  <Label className="font-normal cursor-pointer" onClick={() => setFormData({...formData, isBillingGate: !formData.isBillingGate})}>
                    Is Billing Gate
                  </Label>
                </div>
              </div>
            )}

            {/* Project Specific Fields */}
            {currentType === 'project' && (
              <div className="space-y-6 pt-2">
                <div className="space-y-3">
                  <Label>Assigned Framework</Label>
                  <SearchableSelect
                      value={formData.defaultFrameworkId}
                      onValueChange={(val) => setFormData({...formData, defaultFrameworkId: val})}
                      placeholder="Select a framework"
                      options={frameworkTemplates.map(fw => ({ value: fw.id, label: fw.name }))}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Default Deliverables</Label>
                  <div className="grid grid-cols-1 gap-2 border rounded-md p-2 bg-muted/30">
                    {deliverableTemplates.map(item => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <div 
                          className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors",
                            formData.defaultDeliverables?.includes(item.id) ? "bg-primary border-primary text-primary-foreground" : "border-input bg-background"
                          )}
                          onClick={() => toggleSelection(formData.defaultDeliverables || [], item.id, 'defaultDeliverables')}
                        >
                          {formData.defaultDeliverables?.includes(item.id) && <Check className="w-3 h-3" />}
                        </div>
                        <Label className="font-normal cursor-pointer flex-1" onClick={() => toggleSelection(formData.defaultDeliverables || [], item.id, 'defaultDeliverables')}>
                          {item.title}
                        </Label>
                      </div>
                    ))}
                    {deliverableTemplates.length === 0 && <span className="text-xs text-muted-foreground p-2">No deliverables available</span>}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Default Roles</Label>
                  <div className="grid grid-cols-1 gap-2 border rounded-md p-2 bg-muted/30">
                    {roleTemplates.map(item => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <div 
                          className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors",
                            formData.defaultRoles?.includes(item.id) ? "bg-primary border-primary text-primary-foreground" : "border-input bg-background"
                          )}
                          onClick={() => toggleSelection(formData.defaultRoles || [], item.id, 'defaultRoles')}
                        >
                          {formData.defaultRoles?.includes(item.id) && <Check className="w-3 h-3" />}
                        </div>
                        <Label className="font-normal cursor-pointer flex-1" onClick={() => toggleSelection(formData.defaultRoles || [], item.id, 'defaultRoles')}>
                          {item.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Framework Specific Fields */}
            {currentType === 'framework' && (
              <div className="space-y-3 pt-2">
                <Label>Default Stages</Label>
                <div className="grid grid-cols-1 gap-2 border rounded-md p-2 bg-muted/30">
                  {stageTemplates.map(item => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <div 
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors",
                          formData.defaultStages?.includes(item.id) ? "bg-primary border-primary text-primary-foreground" : "border-input bg-background"
                        )}
                        onClick={() => toggleSelection(formData.defaultStages || [], item.id, 'defaultStages')}
                      >
                        {formData.defaultStages?.includes(item.id) && <Check className="w-3 h-3" />}
                      </div>
                      <Label className="font-normal cursor-pointer flex-1" onClick={() => toggleSelection(formData.defaultStages || [], item.id, 'defaultStages')}>
                        {item.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stage Specific Fields */}
            {currentType === 'stage' && (
              <div className="space-y-6 pt-2">
                <div className="space-y-3">
                  <Label>Assigned Frameworks</Label>
                  <div className="grid grid-cols-1 gap-2 border rounded-md p-2 bg-muted/30">
                    {frameworkTemplates.map(item => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <div 
                          className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors",
                            formData.assignedFrameworks?.includes(item.id) ? "bg-primary border-primary text-primary-foreground" : "border-input bg-background"
                          )}
                          onClick={() => toggleSelection(formData.assignedFrameworks || [], item.id, 'assignedFrameworks')}
                        >
                          {formData.assignedFrameworks?.includes(item.id) && <Check className="w-3 h-3" />}
                        </div>
                        <Label className="font-normal cursor-pointer flex-1" onClick={() => toggleSelection(formData.assignedFrameworks || [], item.id, 'assignedFrameworks')}>
                          {item.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Select which frameworks include this stage by default.</p>
                </div>

                <div className="space-y-3">
                  <Label>Default Tasks</Label>
                  <div className="grid grid-cols-1 gap-2 border rounded-md p-2 bg-muted/30">
                    {!isTaskFormOpen && (
                        <Button 
                            variant="outline" 
                            size="sm" 
                            type="button"
                            onClick={() => {
                                setCurrentTask({ 
                                    title: "", 
                                    description: "", 
                                    defaultPriority: "Medium", 
                                    defaultEstimateHours: 1, 
                                    requiredRole: "Development" 
                                });
                                setIsTaskFormOpen(true);
                            }}
                        >
                            <Plus className="h-3 w-3 mr-2" /> Add Task
                        </Button>
                    )}
                  </div>

                  {isTaskFormOpen ? (
                    <div className="border rounded-lg p-4 bg-muted/20 space-y-4">
                        <h4 className="font-semibold text-sm">{currentTask.id ? 'Edit' : 'New'} Task</h4>
                        <div className="space-y-2">
                            <Label htmlFor="task-title">Task Title</Label>
                            <Input 
                                id="task-title" 
                                value={currentTask.title} 
                                onChange={(e) => setCurrentTask({...currentTask, title: e.target.value})}
                                placeholder="e.g. Code Review"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="task-desc">Description</Label>
                            <Textarea 
                                id="task-desc" 
                                value={currentTask.description} 
                                onChange={(e) => setCurrentTask({...currentTask, description: e.target.value})}
                                placeholder="Task description..."
                                className="h-20"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <SearchableSelect
                                    value={currentTask.defaultPriority}
                                    onValueChange={(val) => setCurrentTask({...currentTask, defaultPriority: val})}
                                    placeholder="Select priority"
                                    options={[
                                        { value: "Low", label: "Low" },
                                        { value: "Medium", label: "Medium" },
                                        { value: "High", label: "High" },
                                    ]}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Est. Hours</Label>
                                <Input 
                                    type="number" 
                                    min="1"
                                    value={currentTask.defaultEstimateHours}
                                    onChange={(e) => setCurrentTask({...currentTask, defaultEstimateHours: parseInt(e.target.value)})}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Assigned Role</Label>
                            <SearchableSelect
                                value={currentTask.assignedRoleId}
                                onValueChange={(val) => setCurrentTask({...currentTask, assignedRoleId: val})}
                                placeholder="Select a role..."
                                options={[
                                    { value: "unassigned", label: "Unassigned" },
                                    ...roleTemplates.map(role => ({ value: role.id, label: role.name }))
                                ]}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Required Role Type (Fallback)</Label>
                            <SearchableSelect
                                value={currentTask.requiredRole}
                                onValueChange={(val) => setCurrentTask({...currentTask, requiredRole: val})}
                                placeholder="Select role type"
                                emptyMessage={roleTypes.length === 0 ? "No role types defined. Add them in App Defaults." : "No results found."}
                                options={roleTypes.map((rt: any) => ({ value: rt.label, label: rt.label }))}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsTaskFormOpen(false)}>Cancel</Button>
                            <Button size="sm" onClick={async () => {
                                if (!currentTask.title) return;
                                
                                try {
                                    let newTask = { ...currentTask };
                                    if (!newTask.id) {
                                        newTask.id = `tt${Date.now()}`;
                                        await createTask(newTask);
                                        setFormData({
                                            ...formData, 
                                            defaultTasks: [...(formData.defaultTasks || []), newTask.id]
                                        });
                                    } else {
                                        await updateTask({ id: newTask.id, updates: newTask });
                                    }
                                    setIsTaskFormOpen(false);
                                } catch (error) {
                                    toast({
                                        title: "Error",
                                        description: `Failed to save task template: ${error instanceof Error ? error.message : 'Unknown error'}`,
                                        variant: "destructive"
                                    });
                                }
                            }}>
                                {currentTask.id ? 'Update Task' : 'Add Task'}
                            </Button>
                        </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                        {formData.defaultTasks && formData.defaultTasks.length > 0 ? (
                             <div className="grid grid-cols-1 gap-2">
                                {formData.defaultTasks.map((taskId: string) => {
                                    const task = taskTemplates.find(t => t.id === taskId);
                                    if (!task) return null;
                                    const assignedRoleName = task.assignedRoleId ? roleTemplates.find(r => r.id === task.assignedRoleId)?.name : null;
                                    
                                    return (
                                        <div key={taskId} className="flex items-center justify-between p-3 border rounded-md bg-muted/10 group hover:bg-muted/20 transition-colors">
                                            <div>
                                                <div className="font-medium text-sm">{task.title}</div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                                    <Badge variant="outline" className="h-5 px-1.5 text-[10px]">{task.defaultPriority}</Badge>
                                                    <span>{task.defaultEstimateHours}h</span>
                                                    <span>•</span>
                                                    <span>{assignedRoleName || task.requiredRole}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                                    setCurrentTask(task);
                                                    setIsTaskFormOpen(true);
                                                }}>
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => {
                                                    setFormData({
                                                        ...formData,
                                                        defaultTasks: formData.defaultTasks.filter((id: string) => id !== taskId)
                                                    });
                                                }}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                             </div>
                        ) : (
                            <div className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg">
                                No tasks defined for this stage template.
                            </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Deliverable Specific Fields */}
            {currentType === 'deliverable' && (
              <div className="space-y-3 pt-2">
                <Label>Default Epics</Label>
                <div className="grid grid-cols-1 gap-2 border rounded-md p-2 bg-muted/30">
                  {epicTemplates.map(item => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <div 
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors",
                          formData.defaultEpics?.includes(item.id) ? "bg-primary border-primary text-primary-foreground" : "border-input bg-background"
                        )}
                        onClick={() => toggleSelection(formData.defaultEpics || [], item.id, 'defaultEpics')}
                      >
                        {formData.defaultEpics?.includes(item.id) && <Check className="w-3 h-3" />}
                      </div>
                      <Label className="font-normal cursor-pointer flex-1" onClick={() => toggleSelection(formData.defaultEpics || [], item.id, 'defaultEpics')}>
                        {item.title}
                      </Label>
                    </div>
                  ))}
                  {epicTemplates.length === 0 && <span className="text-xs text-muted-foreground p-2">No epics available</span>}
                </div>
              </div>
            )}

            {/* Epic Specific Fields */}
            {currentType === 'epic' && (
              <div className="space-y-3 pt-2">
                <Label>Default Stages</Label>
                <div className="grid grid-cols-1 gap-2 border rounded-md p-2 bg-muted/30">
                  {stageTemplates.map(item => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <div 
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors",
                          formData.defaultStages?.includes(item.id) ? "bg-primary border-primary text-primary-foreground" : "border-input bg-background"
                        )}
                        onClick={() => toggleSelection(formData.defaultStages || [], item.id, 'defaultStages')}
                      >
                        {formData.defaultStages?.includes(item.id) && <Check className="w-3 h-3" />}
                      </div>
                      <Label className="font-normal cursor-pointer flex-1" onClick={() => toggleSelection(formData.defaultStages || [], item.id, 'defaultStages')}>
                        {item.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t mt-auto">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the 
              <span className="font-semibold"> {currentTemplate?.name || currentTemplate?.title} </span>
              template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Templates Modal */}
      <Dialog open={isImportOpen} onOpenChange={(open) => {
        setIsImportOpen(open);
        if (!open) setImportData(null);
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5" />
              Import Templates
            </DialogTitle>
            <DialogDescription>
              Upload a JSON file to import templates. Exported templates from this system are compatible.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {!importData ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                  <Label 
                    htmlFor="import-file" 
                    className="block text-sm font-medium mb-2 cursor-pointer"
                  >
                    Click to upload or drag and drop
                  </Label>
                  <p className="text-xs text-muted-foreground mb-4">JSON files only</p>
                  <Input
                    id="import-file"
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleFileUpload}
                    data-testid="input-import-file"
                  />
                  <Button variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
                    Select File
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span>Need a reference?</span>
                  <a 
                    href="/api/templates/sample" 
                    download="sample-templates.json"
                    className="text-primary hover:underline flex items-center gap-1"
                    data-testid="link-download-sample"
                  >
                    <Download className="h-3 w-3" />
                    Download Sample Template
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 border">
                  <div className="flex items-center gap-2 mb-3">
                    <FileJson className="h-4 w-4 text-primary" />
                    <span className="font-medium">File Preview</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Version:</span> {importData.version}</p>
                    <p><span className="text-muted-foreground">Exported:</span> {new Date(importData.exportedAt).toLocaleString()}</p>
                    <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs">
                      <div>Frameworks: {importData.templates?.framework?.length || 0}</div>
                      <div>Stages: {importData.templates?.stage?.length || 0}</div>
                      <div>Projects: {importData.templates?.project?.length || 0}</div>
                      <div>Deliverables: {importData.templates?.deliverable?.length || 0}</div>
                      <div>Epics: {importData.templates?.epic?.length || 0}</div>
                      <div>Tasks: {importData.templates?.task?.length || 0}</div>
                      <div>Roles: {importData.templates?.role?.length || 0}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Conflict Resolution</Label>
                  <SearchableSelect
                    value={importMode}
                    onValueChange={(v: string) => setImportMode(v as "skip" | "overwrite")}
                    placeholder="Select conflict resolution"
                    options={[
                      { value: "skip", label: "Skip existing templates" },
                      { value: "overwrite", label: "Overwrite existing templates" },
                    ]}
                  />
                  <p className="text-xs text-muted-foreground">
                    {importMode === "skip" 
                      ? "Templates with matching IDs will be skipped."
                      : "Templates with matching IDs will be updated with imported values."
                    }
                  </p>
                </div>

                <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    {importMode === "overwrite" 
                      ? "Warning: Existing templates will be overwritten. This cannot be undone."
                      : "New templates will be added. Existing templates with the same ID will be skipped."
                    }
                  </span>
                </div>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setImportData(null)}
                  className="text-muted-foreground"
                >
                  Choose different file
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsImportOpen(false); setImportData(null); }}>
              Cancel
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!importData || isImporting}
              data-testid="button-confirm-import"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Importing...
                </>
              ) : (
                "Import Templates"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Wrapper>
  );
}
