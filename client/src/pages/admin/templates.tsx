import { useState } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  FileBox, 
  Layers, 
  LayoutTemplate, 
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
  Package,
  Check,
  Workflow
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  PROJECT_TEMPLATES,
  DELIVERABLE_TEMPLATES,
  EPIC_TEMPLATES,
  TASK_TEMPLATES,
  STAGE_TEMPLATES,
  FRAMEWORK_TEMPLATES,
  ROLE_TEMPLATES,
  ProjectTemplate,
  DeliverableTemplate,
  EpicTemplate,
  TaskTemplate,
  StageTemplate,
  FrameworkTemplate,
  RoleTemplate
} from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function AdminTemplates() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("projects");

  // State for all template types
  const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>(PROJECT_TEMPLATES);
  const [frameworkTemplates, setFrameworkTemplates] = useState<FrameworkTemplate[]>(FRAMEWORK_TEMPLATES);
  const [stageTemplates, setStageTemplates] = useState<StageTemplate[]>(STAGE_TEMPLATES);
  const [deliverableTemplates, setDeliverableTemplates] = useState<DeliverableTemplate[]>(DELIVERABLE_TEMPLATES);
  const [epicTemplates, setEpicTemplates] = useState<EpicTemplate[]>(EPIC_TEMPLATES);
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>(TASK_TEMPLATES);
  const [roleTemplates, setRoleTemplates] = useState<RoleTemplate[]>(ROLE_TEMPLATES);

  // Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<any>(null);
  const [currentType, setCurrentType] = useState<"project" | "framework" | "stage" | "deliverable" | "epic" | "task" | "role">("project");

  // Task Management State inside Stage Dialog
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<any>(null);

  const [selectedFrameworkFilter, setSelectedFrameworkFilter] = useState<string>("all");

  // Form State (Generic)
  const [formData, setFormData] = useState<any>({});

  const filterTemplates = (templates: any[]) => {
    let filtered = templates.filter(t => 
      t.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (activeTab === 'stages' && selectedFrameworkFilter !== 'all') {
      const framework = frameworkTemplates.find(f => f.id === selectedFrameworkFilter);
      if (framework) {
        filtered = filtered.filter(t => framework.defaultStages.includes(t.id));
      }
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


  const handleSave = () => {
    const isNew = !currentTemplate;
    const newId = isNew ? `${currentType.charAt(0)}t${Date.now()}` : currentTemplate.id;
    const newItem = { ...formData, id: newId };

    if (currentType === "project") {
        const list = isNew ? [...projectTemplates, newItem] : projectTemplates.map(t => t.id === newItem.id ? newItem : t);
        setProjectTemplates(list);
    } else if (currentType === "framework") {
        const list = isNew ? [...frameworkTemplates, newItem] : frameworkTemplates.map(t => t.id === newItem.id ? newItem : t);
        setFrameworkTemplates(list);
    } else if (currentType === "stage") {
        const list = isNew ? [...stageTemplates, newItem] : stageTemplates.map(t => t.id === newItem.id ? newItem : t);
        setStageTemplates(list);
        
        // Update Framework Assignments
        if (formData.assignedFrameworks) {
          const updatedFrameworks = frameworkTemplates.map(fw => {
            const shouldHaveStage = formData.assignedFrameworks.includes(fw.id);
            const hasStage = fw.defaultStages.includes(newItem.id);
            
            if (shouldHaveStage && !hasStage) {
              return { ...fw, defaultStages: [...fw.defaultStages, newItem.id] };
            } else if (!shouldHaveStage && hasStage) {
              return { ...fw, defaultStages: fw.defaultStages.filter(id => id !== newItem.id) };
            }
            return fw;
          });
          setFrameworkTemplates(updatedFrameworks);
        }
    } else if (currentType === "deliverable") {
        const list = isNew ? [...deliverableTemplates, newItem] : deliverableTemplates.map(t => t.id === newItem.id ? newItem : t);
        setDeliverableTemplates(list);
    } else if (currentType === "epic") {
        const list = isNew ? [...epicTemplates, newItem] : epicTemplates.map(t => t.id === newItem.id ? newItem : t);
        setEpicTemplates(list);
    } else if (currentType === "task") {
        const list = isNew ? [...taskTemplates, newItem] : taskTemplates.map(t => t.id === newItem.id ? newItem : t);
        setTaskTemplates(list);
    } else if (currentType === "role") {
        const list = isNew ? [...roleTemplates, newItem] : roleTemplates.map(t => t.id === newItem.id ? newItem : t);
        setRoleTemplates(list);
    }

    setIsEditOpen(false);
    toast({
      title: isNew ? "Template Created" : "Template Updated",
      description: `${newItem.name || newItem.title} has been successfully saved.`,
    });
  };

  const handleConfirmDelete = () => {
    if (!currentTemplate) return;

    if (currentType === "project") {
        setProjectTemplates(projectTemplates.filter(t => t.id !== currentTemplate.id));
    } else if (currentType === "framework") {
        setFrameworkTemplates(frameworkTemplates.filter(t => t.id !== currentTemplate.id));
    } else if (currentType === "stage") {
        setStageTemplates(stageTemplates.filter(t => t.id !== currentTemplate.id));
    } else if (currentType === "deliverable") {
        setDeliverableTemplates(deliverableTemplates.filter(t => t.id !== currentTemplate.id));
    } else if (currentType === "epic") {
        setEpicTemplates(epicTemplates.filter(t => t.id !== currentTemplate.id));
    } else if (currentType === "task") {
        setTaskTemplates(taskTemplates.filter(t => t.id !== currentTemplate.id));
    } else if (currentType === "role") {
        setRoleTemplates(roleTemplates.filter(t => t.id !== currentTemplate.id));
    }

    setIsDeleteOpen(false);
    toast({
      title: "Template Deleted",
      description: "The template has been permanently removed.",
      variant: "destructive"
    });
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

  return (
    <Shell>
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-primary">Template Management</h1>
              <p className="text-muted-foreground">Manage and configure templates for projects, deliverables, epics, and tasks.</p>
            </div>
            <Button className="gap-2" onClick={() => handleCreate(activeTab.slice(0, -1))}>
              <Plus className="h-4 w-4" />
              Create {activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(0, -1).slice(1)} Template
            </Button>
          </div>

          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search templates..." 
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="projects" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6 overflow-x-auto">
            <TabsTrigger 
              value="projects" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 flex items-center gap-2"
            >
              <LayoutTemplate className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger 
              value="deliverables" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Deliverables
            </TabsTrigger>
            <TabsTrigger 
              value="epics" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 flex items-center gap-2"
            >
              <FileBox className="h-4 w-4" />
              Epics
            </TabsTrigger>
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
              value="roles" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Roles
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="projects" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterTemplates(projectTemplates).map(t => (
                  <TemplateCard 
                    key={t.id}
                    item={t}
                    type="project"
                    icon={LayoutTemplate}
                    itemsCount={t.defaultDeliverables?.length || 0}
                    itemLabel="Deliverables"
                    badge="Full Stack"
                  />
                ))}
                <Card 
                    className="flex flex-col items-center justify-center border-dashed cursor-pointer hover:bg-muted/10 transition-colors min-h-[200px]"
                    onClick={() => handleCreate('project')}
                >
                  <div className="p-4 rounded-full bg-muted text-muted-foreground mb-4">
                    <Plus className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg">Create New Project Template</h3>
                  <p className="text-sm text-muted-foreground mt-1">Define stages, roles, and defaults</p>
                </Card>
              </div>
            </TabsContent>

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
                 <Select 
                    value={selectedFrameworkFilter} 
                    onValueChange={setSelectedFrameworkFilter}
                 >
                    <SelectTrigger className="w-[250px] h-8 text-xs">
                      <SelectValue placeholder="All Frameworks" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Frameworks</SelectItem>
                      {frameworkTemplates.map(fw => (
                        <SelectItem key={fw.id} value={fw.id}>{fw.name}</SelectItem>
                      ))}
                    </SelectContent>
                 </Select>
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

            <TabsContent value="deliverables" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterTemplates(deliverableTemplates).map(t => (
                  <TemplateCard 
                    key={t.id}
                    item={t}
                    type="deliverable"
                    icon={Package}
                    itemsCount={t.defaultEpics?.length || 0}
                    itemLabel="Default Epics"
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="epics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterTemplates(epicTemplates).map(t => (
                  <TemplateCard 
                    key={t.id}
                    item={t}
                    type="epic"
                    icon={FileBox}
                    itemsCount={t.defaultStages?.length || 0}
                    itemLabel="Default Stages"
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="roles" className="space-y-6">
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
                  <Select 
                    value={formData.defaultRoleType} 
                    onValueChange={(val) => setFormData({...formData, defaultRoleType: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Management">Management</SelectItem>
                      <SelectItem value="Discovery">Discovery</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Development">Development</SelectItem>
                      <SelectItem value="QA & Testing">QA & Testing</SelectItem>
                      <SelectItem value="Launch">Launch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Project Specific Fields */}
            {currentType === 'project' && (
              <div className="space-y-6 pt-2">
                <div className="space-y-3">
                  <Label>Assigned Framework</Label>
                  <Select 
                      value={formData.defaultFrameworkId} 
                      onValueChange={(val) => setFormData({...formData, defaultFrameworkId: val})}
                  >
                      <SelectTrigger><SelectValue placeholder="Select a framework" /></SelectTrigger>
                      <SelectContent>
                          {frameworkTemplates.map(fw => (
                              <SelectItem key={fw.id} value={fw.id}>{fw.name}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
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
                                <Select 
                                    value={currentTask.defaultPriority} 
                                    onValueChange={(val) => setCurrentTask({...currentTask, defaultPriority: val})}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                    </SelectContent>
                                </Select>
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
                            <Select 
                                value={currentTask.assignedRoleId} 
                                onValueChange={(val) => setCurrentTask({...currentTask, assignedRoleId: val})}
                            >
                                <SelectTrigger><SelectValue placeholder="Select a role..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                    {roleTemplates.map(role => (
                                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Required Role Type (Fallback)</Label>
                            <Select 
                                value={currentTask.requiredRole} 
                                onValueChange={(val) => setCurrentTask({...currentTask, requiredRole: val})}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Management">Management</SelectItem>
                                    <SelectItem value="Discovery">Discovery</SelectItem>
                                    <SelectItem value="Design">Design</SelectItem>
                                    <SelectItem value="Development">Development</SelectItem>
                                    <SelectItem value="QA & Testing">QA & Testing</SelectItem>
                                    <SelectItem value="Launch">Launch</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsTaskFormOpen(false)}>Cancel</Button>
                            <Button size="sm" onClick={() => {
                                if (!currentTask.title) return;
                                
                                let newTask = { ...currentTask };
                                if (!newTask.id) {
                                    newTask.id = `tt${Date.now()}`;
                                    // Add to taskTemplates state
                                    setTaskTemplates([...taskTemplates, newTask]);
                                    // Add to formData
                                    setFormData({
                                        ...formData, 
                                        defaultTasks: [...(formData.defaultTasks || []), newTask.id]
                                    });
                                } else {
                                    // Update taskTemplates state
                                    setTaskTemplates(taskTemplates.map(t => t.id === newTask.id ? newTask : t));
                                    // formData.defaultTasks likely already has the ID, no change needed there
                                }
                                setIsTaskFormOpen(false);
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
    </Shell>
  );
}
