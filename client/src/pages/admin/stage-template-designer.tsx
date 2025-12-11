import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Shell } from "@/components/layout/shell";
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Settings2,
  Check,
  ChevronRight,
  GripVertical,
  Pencil,
  X,
  Layout,
  ListTodo,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { 
  StageTemplate, 
  TaskTemplate, 
  RoleTemplate, 
  TASK_STATUS_OPTIONS, 
  STAGE_TEMPLATES,
  TASK_TEMPLATES,
  ROLE_TEMPLATES
} from "@/lib/mock-data";

export default function StageTemplateDesigner() {
  const [match, params] = useRoute("/admin/templates/stage/:templateId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const templateId = params?.templateId;
  const isNew = templateId === "new";

  // State
  const [formData, setFormData] = useState<Partial<StageTemplate>>({
    name: "",
    description: "",
    defaultTasks: [],
    defaultRoles: [],
    entryCriteria: "",
    exitCriteria: "",
    allowedTaskStatuses: ["ts1", "ts2", "ts4"]
  });

  // Task Management State
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Partial<TaskTemplate>>({
    title: "",
    description: "",
    defaultPriority: "Medium",
    defaultEstimateHours: 1,
    requiredRole: "Development"
  });

  // Local task templates state
  const [localTaskTemplates, setLocalTaskTemplates] = useState<TaskTemplate[]>(TASK_TEMPLATES);

  // Load Data
  useEffect(() => {
    if (!isNew && templateId) {
      const template = STAGE_TEMPLATES.find(t => t.id === templateId);
      if (template) {
        setFormData({ ...template });
      }
    }
  }, [templateId, isNew]);

  const handleSave = () => {
    if (!formData.name) {
      toast({
        title: "Validation Error",
        description: "Stage name is required.",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, this would save to backend
    toast({
      title: isNew ? "Stage Template Created" : "Stage Template Updated",
      description: `${formData.name} has been successfully saved.`,
    });
    
    setLocation("/admin/templates");
  };

  const handleSaveTask = () => {
    if (!currentTask.title) return;

    const newTask = {
      ...currentTask,
      id: currentTask.id || `tt${Date.now()}`
    } as TaskTemplate;

    // Update local task list
    const exists = localTaskTemplates.find(t => t.id === newTask.id);
    if (exists) {
      setLocalTaskTemplates(prev => prev.map(t => t.id === newTask.id ? newTask : t));
    } else {
      setLocalTaskTemplates(prev => [...prev, newTask]);
      setFormData(prev => ({
        ...prev,
        defaultTasks: [...(prev.defaultTasks || []), newTask.id]
      }));
    }

    setIsTaskFormOpen(false);
    setCurrentTask({
      title: "",
      description: "",
      defaultPriority: "Medium",
      defaultEstimateHours: 1,
      requiredRole: "Development"
    });
  };

  const removeTask = (taskId: string) => {
    setFormData(prev => ({
      ...prev,
      defaultTasks: (prev.defaultTasks || []).filter(id => id !== taskId)
    }));
  };

  const toggleRole = (roleId: string) => {
    setFormData(prev => {
      const current = prev.defaultRoles || [];
      const updated = current.includes(roleId)
        ? current.filter(id => id !== roleId)
        : [...current, roleId];
      return { ...prev, defaultRoles: updated };
    });
  };

  const toggleStatus = (statusId: string) => {
    setFormData(prev => {
      const current = prev.allowedTaskStatuses || [];
      const updated = current.includes(statusId)
        ? current.filter(id => id !== statusId)
        : [...current, statusId];
      return { ...prev, allowedTaskStatuses: updated };
    });
  };

  return (
    <Shell>
      <div className="flex flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between py-6 border-b shrink-0 bg-background/95 backdrop-blur z-10">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Link href="/admin/templates" className="hover:text-primary transition-colors flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" />
                Templates
              </Link>
              <span className="text-border">/</span>
              <span>Stage Designer</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
              {isNew ? "Create New Stage Template" : `Edit ${formData.name}`}
              <Badge variant="outline" className="font-normal text-sm bg-primary/5 text-primary border-primary/20">
                Stage Template
              </Badge>
            </h1>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/templates">
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Template
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden grid grid-cols-12 gap-8 py-8">
          {/* Left Column: Basic Info & Configuration */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5 text-muted-foreground" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Stage Name</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Discovery Phase"
                    className="font-medium"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={formData.description} 
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the purpose of this stage..."
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-muted-foreground" />
                  Workflow Configuration
                </CardTitle>
                <CardDescription>Define allowed statuses and required roles.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Allowed Statuses</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {TASK_STATUS_OPTIONS.map(status => (
                      <div key={status.id} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 transition-colors">
                        <Checkbox 
                          id={`status-${status.id}`}
                          checked={formData.allowedTaskStatuses?.includes(status.id)}
                          onCheckedChange={() => toggleStatus(status.id)}
                        />
                        <Label htmlFor={`status-${status.id}`} className="flex items-center gap-2 cursor-pointer w-full font-normal">
                           <div className={cn("w-2 h-2 rounded-full", status.color.replace("text", "bg").split(" ")[0].replace("50", "500"))} />
                          {status.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Default Roles</Label>
                  <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto">
                    {ROLE_TEMPLATES.map(role => (
                      <div key={role.id} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 transition-colors">
                        <Checkbox 
                          id={`role-${role.id}`}
                          checked={formData.defaultRoles?.includes(role.id)}
                          onCheckedChange={() => toggleRole(role.id)}
                        />
                        <Label htmlFor={`role-${role.id}`} className="flex-1 cursor-pointer font-normal">
                          {role.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Task Management */}
          <div className="col-span-12 lg:col-span-8 flex flex-col min-h-0">
            <Card className="flex-1 flex flex-col min-h-0 border-primary/20 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 py-4">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <ListTodo className="h-5 w-5 text-primary" />
                    Default Task Definition
                  </CardTitle>
                  <CardDescription>
                    Configure tasks that will be automatically created when this stage starts.
                  </CardDescription>
                </div>
                <Button onClick={() => setIsTaskFormOpen(true)} className="gap-2 shadow-sm">
                  <Plus className="h-4 w-4" /> Add Task
                </Button>
              </CardHeader>
              
              <div className="flex-1 overflow-y-auto p-6 bg-muted/5">
                <div className="space-y-4 max-w-3xl mx-auto">
                  {isTaskFormOpen && (
                    <Card className="border-2 border-primary/10 shadow-lg animate-in slide-in-from-top-2 mb-6">
                      <CardHeader className="pb-3 bg-muted/30 border-b">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{currentTask.id ? 'Edit Task Template' : 'New Task Template'}</CardTitle>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsTaskFormOpen(false)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-4">
                        <div className="grid gap-2">
                          <Label>Task Title</Label>
                          <Input 
                            value={currentTask.title} 
                            onChange={(e) => setCurrentTask({ ...currentTask, title: e.target.value })}
                            placeholder="e.g. Kickoff Meeting"
                            autoFocus
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Description</Label>
                          <Textarea 
                            value={currentTask.description} 
                            onChange={(e) => setCurrentTask({ ...currentTask, description: e.target.value })}
                            rows={3}
                            placeholder="Detailed instructions for this task..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Priority</Label>
                            <Select 
                              value={currentTask.defaultPriority} 
                              onValueChange={(v: any) => setCurrentTask({ ...currentTask, defaultPriority: v })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Low">Low</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label>Est. Hours</Label>
                            <Input 
                              type="number" 
                              value={currentTask.defaultEstimateHours} 
                              onChange={(e) => setCurrentTask({ ...currentTask, defaultEstimateHours: parseInt(e.target.value) })}
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label>Assigned Role</Label>
                          <Select 
                            value={currentTask.assignedRoleId || "unassigned"} 
                            onValueChange={(v) => setCurrentTask({ ...currentTask, assignedRoleId: v === "unassigned" ? undefined : v })}
                          >
                            <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Unassigned</SelectItem>
                              {ROLE_TEMPLATES.map(role => (
                                <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <Button variant="ghost" onClick={() => setIsTaskFormOpen(false)}>Cancel</Button>
                          <Button onClick={handleSaveTask}>Save Task Template</Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="space-y-3">
                    {formData.defaultTasks?.map((taskId, index) => {
                      const task = localTaskTemplates.find(t => t.id === taskId);
                      if (!task) return null;
                      const roleName = task.assignedRoleId 
                        ? ROLE_TEMPLATES.find(r => r.id === task.assignedRoleId)?.name 
                        : "Unassigned";

                      return (
                        <div key={taskId} className="flex items-start gap-4 p-4 border rounded-xl bg-background shadow-sm hover:shadow-md transition-all group relative">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 rounded-l-xl group-hover:bg-primary transition-colors" />
                          
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-xs mt-1">
                            {index + 1}
                          </div>

                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-base">{task.title}</h4>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                  setCurrentTask(task);
                                  setIsTaskFormOpen(true);
                                }}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => removeTask(taskId)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{task.description || "No description provided."}</p>
                            
                            <div className="flex items-center gap-3 pt-2">
                              <Badge variant="outline" className={cn(
                                "text-[10px] px-2 py-0.5 border-0 font-medium",
                                task.defaultPriority === 'High' ? "bg-red-50 text-red-700" :
                                task.defaultPriority === 'Medium' ? "bg-amber-50 text-amber-700" :
                                "bg-blue-50 text-blue-700"
                              )}>
                                {task.defaultPriority} Priority
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                {roleName}
                              </div>
                              <span className="text-xs text-muted-foreground">•</span>
                              <div className="text-xs text-muted-foreground">
                                {task.defaultEstimateHours}h estimate
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {(!formData.defaultTasks || formData.defaultTasks.length === 0) && !isTaskFormOpen && (
                      <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-muted/10">
                        <div className="p-4 rounded-full bg-background mb-4 shadow-sm">
                          <ListTodo className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-lg font-medium text-muted-foreground">No Default Tasks</h3>
                        <p className="text-sm text-muted-foreground/60 max-w-sm mt-2 mb-6">
                          Add tasks that should be automatically created when this stage is initialized in a project.
                        </p>
                        <Button variant="outline" onClick={() => setIsTaskFormOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add First Task
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  );
}
