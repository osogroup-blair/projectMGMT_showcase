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
  Package
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
import { 
  PROJECT_TEMPLATES,
  DELIVERABLE_TEMPLATES,
  EPIC_TEMPLATES,
  TASK_TEMPLATES,
  STAGE_TEMPLATES,
  ROLE_TEMPLATES,
  ProjectTemplate,
  DeliverableTemplate,
  EpicTemplate,
  TaskTemplate,
  StageTemplate,
  RoleTemplate
} from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

export default function AdminTemplates() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("projects");

  // State for all template types
  const [projectTemplates, setProjectTemplates] = useState<ProjectTemplate[]>(PROJECT_TEMPLATES);
  const [stageTemplates, setStageTemplates] = useState<StageTemplate[]>(STAGE_TEMPLATES);
  const [deliverableTemplates, setDeliverableTemplates] = useState<DeliverableTemplate[]>(DELIVERABLE_TEMPLATES);
  const [epicTemplates, setEpicTemplates] = useState<EpicTemplate[]>(EPIC_TEMPLATES);
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>(TASK_TEMPLATES);
  const [roleTemplates, setRoleTemplates] = useState<RoleTemplate[]>(ROLE_TEMPLATES);

  // Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<any>(null);
  const [currentType, setCurrentType] = useState<"project" | "stage" | "deliverable" | "epic" | "task" | "role">("project");

  // Form State (Generic)
  const [formData, setFormData] = useState<any>({});

  const filterTemplates = (templates: any[]) => {
    return templates.filter(t => 
      t.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // CRUD Handlers
  const handleCreate = (type: string) => {
    setCurrentTemplate(null);
    setCurrentType(type as any);
    
    // Initialize empty form data based on type
    const initialData: any = { description: "" };
    if (type === "project") initialData.name = "";
    if (type === "stage") initialData.name = "";
    if (type === "deliverable") initialData.title = "";
    if (type === "epic") initialData.title = "";
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
    setFormData({ ...template });
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
        const list = isNew ? [...projectTemplates, { ...newItem, defaultStages: [], defaultRoles: [] }] : projectTemplates.map(t => t.id === newItem.id ? newItem : t);
        setProjectTemplates(list);
    } else if (currentType === "stage") {
        const list = isNew ? [...stageTemplates, { ...newItem, defaultStages: [] }] : stageTemplates.map(t => t.id === newItem.id ? newItem : t);
        setStageTemplates(list);
    } else if (currentType === "deliverable") {
        const list = isNew ? [...deliverableTemplates, { ...newItem, defaultEpics: [] }] : deliverableTemplates.map(t => t.id === newItem.id ? newItem : t);
        setDeliverableTemplates(list);
    } else if (currentType === "epic") {
        const list = isNew ? [...epicTemplates, { ...newItem, defaultTasks: [] }] : epicTemplates.map(t => t.id === newItem.id ? newItem : t);
        setEpicTemplates(list);
    } else if (currentType === "task") {
        const list = isNew ? [...taskTemplates, newItem] : taskTemplates.map(t => t.id === newItem.id ? newItem : t);
        setTaskTemplates(list);
    } else if (currentType === "role") {
        const list = isNew ? [...roleTemplates, { ...newItem, defaultPermissions: [] }] : roleTemplates.map(t => t.id === newItem.id ? newItem : t);
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
              value="stages" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 flex items-center gap-2"
            >
              <Layers className="h-4 w-4" />
              Stages
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
              value="tasks" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 flex items-center gap-2"
            >
              <ListTodo className="h-4 w-4" />
              Tasks & Roles
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
                    itemsCount={t.defaultStages?.length || 0}
                    itemLabel="Stages"
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

            <TabsContent value="stages" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterTemplates(stageTemplates).map(t => (
                  <TemplateCard 
                    key={t.id}
                    item={t}
                    type="stage"
                    icon={Layers}
                    itemsCount={t.defaultStages?.length || 5}
                    itemLabel="Phases"
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
                    itemsCount={t.defaultTasks?.length || 0}
                    itemLabel="Standard Tasks"
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                    <ListTodo className="h-5 w-5 text-primary" />
                    Task Templates
                    </h3>
                    <Button variant="outline" size="sm" onClick={() => handleCreate('task')}>
                        <Plus className="h-4 w-4 mr-2" /> Add Task
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filterTemplates(taskTemplates).map(t => (
                    <Card key={t.id} className="hover:shadow-md transition-shadow group">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                          <Badge variant={t.defaultPriority === 'High' ? 'destructive' : 'secondary'} className="text-[10px]">
                            {t.defaultPriority}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleEdit(t, 'task')}>Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(t, 'task')}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <CardTitle className="text-sm font-semibold mt-2">{t.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 text-xs text-muted-foreground">
                        <p className="line-clamp-2 mb-2">{t.description}</p>
                        <div className="flex items-center gap-2 pt-2 border-t mt-2">
                          <span className="font-medium text-foreground">{t.defaultEstimateHours}h</span> est.
                          <span className="ml-auto bg-muted px-1.5 py-0.5 rounded">{t.requiredRole}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Role Templates
                    </h3>
                    <Button variant="outline" size="sm" onClick={() => handleCreate('role')}>
                        <Plus className="h-4 w-4 mr-2" /> Add Role
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filterTemplates(roleTemplates).map(t => (
                    <Card key={t.id} className="hover:shadow-md transition-shadow group">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <CardTitle className="text-base">{t.name}</CardTitle>
                          <Badge variant="outline">{t.defaultRoleType}</Badge>
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity -mr-2 -mt-2">
                                <MoreHorizontal className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleEdit(t, 'role')}>Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClick(t, 'role')}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <CardDescription className="text-xs">{t.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xs text-muted-foreground">
                          <strong>Permissions:</strong> {t.defaultPermissions?.length || 0} assigned
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
                {currentTemplate ? 'Edit' : 'Create'} {currentType.charAt(0).toUpperCase() + currentType.slice(1)} Template
            </DialogTitle>
            <DialogDescription>
              Configure the details for this template below.
            </DialogDescription>
          </DialogHeader>
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

            {/* Task Specific Fields */}
            {currentType === 'task' && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Default Priority</Label>
                        <Select 
                            value={formData.defaultPriority} 
                            onValueChange={(val) => setFormData({...formData, defaultPriority: val})}
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
                            value={formData.defaultEstimateHours}
                            onChange={(e) => setFormData({...formData, defaultEstimateHours: parseInt(e.target.value)})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Required Role</Label>
                        <Select 
                            value={formData.requiredRole} 
                            onValueChange={(val) => setFormData({...formData, requiredRole: val})}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Management">Management</SelectItem>
                                <SelectItem value="Design">Design</SelectItem>
                                <SelectItem value="Development">Development</SelectItem>
                                <SelectItem value="QA & Testing">QA & Testing</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {/* Role Specific Fields */}
            {currentType === 'role' && (
                <div className="space-y-2">
                    <Label>Role Type</Label>
                    <Select 
                        value={formData.defaultRoleType} 
                        onValueChange={(val) => setFormData({...formData, defaultRoleType: val})}
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
            )}
          </div>
          <DialogFooter>
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
