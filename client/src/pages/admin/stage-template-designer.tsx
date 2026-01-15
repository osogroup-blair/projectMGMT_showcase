import { useState, useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Shell } from "@/components/layout/shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Check,
  Pencil,
  X,
  Layout,
  ListTodo,
  Users,
  Loader2,
  Flag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useStageTemplates, useTaskTemplates, useRoleTemplates, useMilestoneTemplates } from "@/hooks/use-nexus-data";
import { 
  StageTemplate, 
  TaskTemplate, 
  RoleTemplate 
} from "@/lib/mock-data";

export default function StageTemplateDesigner() {
  const [match, params] = useRoute("/admin/templates/stage/:templateId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const templateId = params?.templateId;
  const isNew = templateId === "new";

  const { data: stageTemplates, createAsync: createStage, updateAsync: updateStage, isLoading: stagesLoading } = useStageTemplates();
  const { data: taskTemplates, createAsync: createTask, updateAsync: updateTask, removeAsync: removeTaskAsync, isLoading: tasksLoading } = useTaskTemplates();
  const { data: roleTemplates, isLoading: rolesLoading } = useRoleTemplates();
  const { data: milestoneTemplates, isLoading: milestonesLoading } = useMilestoneTemplates();
  const isLoading = stagesLoading || tasksLoading || rolesLoading || milestonesLoading;
  
  const linkedMilestones = templateId && !isNew 
    ? (milestoneTemplates || []).filter((m: any) => m.stageTemplateId === templateId).sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
    : [];

  // State
  const [formData, setFormData] = useState<Partial<StageTemplate>>({
    name: "",
    description: "",
    defaultTasks: [],
    defaultRoles: [],
    entryCriteria: "",
    exitCriteria: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  // Task Management State
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isLinkMilestoneOpen, setIsLinkMilestoneOpen] = useState(false);
  
  const { updateAsync: updateMilestone } = useMilestoneTemplates();
  const [currentTask, setCurrentTask] = useState<Partial<TaskTemplate>>({
    title: "",
    description: "",
    defaultPriority: "Medium",
    defaultEstimateHours: 1,
    requiredRole: "Development"
  });

  // Local task templates state
  const [localTaskTemplates, setLocalTaskTemplates] = useState<TaskTemplate[]>([]);

  // Sync taskTemplates from database
  useEffect(() => {
    if (taskTemplates && taskTemplates.length > 0) {
      setLocalTaskTemplates(taskTemplates as TaskTemplate[]);
    }
  }, [taskTemplates]);

  // Load Data
  useEffect(() => {
    if (!isNew && templateId && stageTemplates) {
      const template = (stageTemplates as StageTemplate[]).find(t => t.id === templateId);
      if (template) {
        setFormData({ ...template });
      }
    }
  }, [templateId, isNew, stageTemplates]);

  const handleSave = async () => {
    if (!formData.name) {
      toast({
        title: "Validation Error",
        description: "Stage name is required.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    try {
      if (isNew) {
        await createStage({ ...formData, id: `st_${Date.now()}` } as StageTemplate);
      } else if (templateId) {
        await updateStage({ id: templateId, updates: formData });
      }
      
      toast({
        title: isNew ? "Stage Template Created" : "Stage Template Updated",
        description: `${formData.name} has been successfully saved.`,
      });
      
      setLocation("/admin/templates");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save stage template. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTask = async () => {
    if (!currentTask.title) return;

    try {
      // Check if we're editing an existing task
      const existingTask = currentTask.id ? localTaskTemplates.find(t => t.id === currentTask.id) : null;
      
      if (existingTask) {
        // Update existing task
        await updateTask({ id: existingTask.id, updates: currentTask });
        setLocalTaskTemplates(prev => prev.map(t => t.id === existingTask.id ? { ...t, ...currentTask } as TaskTemplate : t));
        
        // Auto-add the role to stage roles if assigned
        if (currentTask.assignedRoleId) {
          setFormData(prev => ({
            ...prev,
            defaultRoles: prev.defaultRoles?.includes(currentTask.assignedRoleId!) 
              ? prev.defaultRoles 
              : [...(prev.defaultRoles || []), currentTask.assignedRoleId!]
          }));
        }
      } else {
        // Create new task - let the API generate the ID
        const taskToCreate = {
          title: currentTask.title,
          description: currentTask.description || "",
          defaultPriority: currentTask.defaultPriority || "Medium",
          defaultEstimateHours: currentTask.defaultEstimateHours || 1,
          requiredRole: currentTask.requiredRole || "Development",
          assignedRoleId: currentTask.assignedRoleId || null,
        };
        
        // createTask returns the created item with the actual database ID
        const createdTask = await createTask(taskToCreate) as TaskTemplate;
        
        // Add to local state with the actual ID from the database
        setLocalTaskTemplates(prev => [...prev, createdTask]);
        const newTaskList = [...(formData.defaultTasks || []), createdTask.id];
        setFormData(prev => ({
          ...prev,
          defaultTasks: newTaskList
        }));
        
        // Auto-add the role to stage roles if assigned
        if (createdTask.assignedRoleId) {
          setFormData(prev => ({
            ...prev,
            defaultRoles: prev.defaultRoles?.includes(createdTask.assignedRoleId!) 
              ? prev.defaultRoles 
              : [...(prev.defaultRoles || []), createdTask.assignedRoleId!]
          }));
        }
      }

      setIsTaskFormOpen(false);
      setCurrentTask({
        title: "",
        description: "",
        defaultPriority: "Medium",
        defaultEstimateHours: 1,
        requiredRole: "Development"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save task template. Please try again.",
        variant: "destructive"
      });
    }
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

  const updateStageRolesFromTasks = (taskList: string[]) => {
    const roleIds = new Set<string>();
    taskList.forEach(taskId => {
      const task = localTaskTemplates.find(t => t.id === taskId);
      if (task?.assignedRoleId) {
        roleIds.add(task.assignedRoleId);
      }
    });
    setFormData(prev => ({
      ...prev,
      defaultRoles: Array.from(roleIds)
    }));
  };

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    );
  }

  return (
    <AuthGuard requiredRoles={["admin", "manager"]}>
    <Shell>
      <div className="flex flex-col h-[calc(100vh-4rem)] w-full">
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
            <Button onClick={handleSave} className="gap-2" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? "Saving..." : "Save Template"}
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
                  <Users className="h-5 w-5 text-muted-foreground" />
                  Stage Roles
                </CardTitle>
                <CardDescription>Roles are automatically set based on task assignments, or add manually below.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.defaultRoles && formData.defaultRoles.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.defaultRoles.map(roleId => {
                      const role = (roleTemplates as RoleTemplate[])?.find(r => r.id === roleId);
                      return role ? (
                        <Badge key={roleId} variant="secondary" className="px-3 py-1 gap-2">
                          {role.name}
                          <button
                            onClick={() => toggleRole(roleId)}
                            className="hover:text-destructive transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No roles assigned. Add tasks with roles to auto-populate.</p>
                )}
                <Separator />
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Add Role Manually</Label>
                  <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto">
                    {((roleTemplates || []) as RoleTemplate[])
                      .filter(role => !formData.defaultRoles?.includes(role.id))
                      .map(role => (
                      <div 
                        key={role.id} 
                        className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => toggleRole(role.id)}
                      >
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        <span className="flex-1 font-normal text-sm">
                          {role.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Linked Milestones */}
            {!isNew && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Flag className="h-5 w-5 text-muted-foreground" />
                        Milestones
                      </CardTitle>
                      <CardDescription>Milestone templates linked to this stage.</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsLinkMilestoneOpen(!isLinkMilestoneOpen)}
                      className="gap-1"
                    >
                      <Plus className="h-4 w-4" /> Link
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLinkMilestoneOpen && (
                    <div className="p-3 border rounded-lg bg-muted/30 space-y-2 animate-in slide-in-from-top-2">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Available Milestones</Label>
                      <div className="max-h-[150px] overflow-y-auto space-y-1">
                        {(milestoneTemplates || [])
                          .filter((m: any) => !m.stageTemplateId)
                          .map((milestone: any) => (
                            <div 
                              key={milestone.id} 
                              className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors cursor-pointer group"
                              onClick={async () => {
                                try {
                                  await updateMilestone({ id: milestone.id, updates: { stageTemplateId: templateId } });
                                  toast({ title: "Milestone linked successfully" });
                                } catch {
                                  toast({ title: "Failed to link milestone", variant: "destructive" });
                                }
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <Flag className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{milestone.name}</span>
                              </div>
                              <Plus className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          ))}
                        {(milestoneTemplates || []).filter((m: any) => !m.stageTemplateId).length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-2">No unlinked milestones available</p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setIsLinkMilestoneOpen(false)}>
                        Done
                      </Button>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {linkedMilestones.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No milestones linked yet. Click "Link" to add milestones.
                      </p>
                    ) : (
                      linkedMilestones.map((milestone: any) => (
                        <div key={milestone.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors group">
                          <div className="flex items-center gap-3">
                            <Flag className="h-4 w-4 text-primary" />
                            <div>
                              <p className="font-medium text-sm">{milestone.name}</p>
                              <p className="text-xs text-muted-foreground">{milestone.phase} • {milestone.completionTargetPercent}% target</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {milestone.isBillingGate && (
                              <Badge variant="secondary" className="text-xs">Billing Gate</Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                              onClick={async () => {
                                try {
                                  await updateMilestone({ id: milestone.id, updates: { stageTemplateId: null } });
                                  toast({ title: "Milestone unlinked" });
                                } catch {
                                  toast({ title: "Failed to unlink milestone", variant: "destructive" });
                                }
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
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
                            <SearchableSelect
                              value={currentTask.defaultPriority}
                              onValueChange={(v: any) => setCurrentTask({ ...currentTask, defaultPriority: v })}
                              placeholder="Select priority"
                              options={[
                                { value: "Low", label: "Low" },
                                { value: "Medium", label: "Medium" },
                                { value: "High", label: "High" },
                              ]}
                            />
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
                          <SearchableSelect
                            value={currentTask.assignedRoleId || "unassigned"}
                            onValueChange={(v) => setCurrentTask({ ...currentTask, assignedRoleId: v === "unassigned" ? undefined : v })}
                            placeholder="Select Role"
                            options={[
                              { value: "unassigned", label: "Unassigned" },
                              ...((roleTemplates || []) as RoleTemplate[]).map(role => ({ value: role.id, label: role.name }))
                            ]}
                          />
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
                        ? ((roleTemplates || []) as RoleTemplate[]).find(r => r.id === task.assignedRoleId)?.name 
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
    </AuthGuard>
  );
}
