import { useState, useEffect, useMemo } from "react";
import { 
  Plus, 
  Trash2, 
  Check,
  GripVertical,
  Pencil,
  X,
  Flag,
  ListTodo,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { StageTemplate, TaskTemplate, RoleTemplate, MilestoneTemplate } from "@shared/schema";

interface StageTemplateEditorProps {
  template: StageTemplate | null;
  taskTemplates: TaskTemplate[];
  roleTemplates: RoleTemplate[];
  milestoneTemplates?: MilestoneTemplate[];
  onSave: (template: StageTemplate) => void;
  onCancel: () => void;
  onMilestoneLink?: (milestoneId: string, stageId: string) => void;
  onMilestoneUnlink?: (milestoneId: string) => void;
}

export function StageTemplateEditor({ 
  template, 
  taskTemplates, 
  roleTemplates, 
  milestoneTemplates = [],
  onSave, 
  onCancel,
  onMilestoneLink,
  onMilestoneUnlink
}: StageTemplateEditorProps) {
  const [formData, setFormData] = useState<Partial<StageTemplate>>({
    name: "",
    description: "",
    defaultTasks: [],
    defaultRoles: [],
    entryCriteria: "",
    exitCriteria: ""
  });

  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Partial<TaskTemplate>>({
    title: "",
    description: "",
    defaultPriority: "Medium",
    defaultEstimateHours: 1,
    assignedRoleId: undefined
  });

  const [localTaskTemplates, setLocalTaskTemplates] = useState<TaskTemplate[]>(taskTemplates);
  const [activeTab, setActiveTab] = useState("tasks");

  useEffect(() => {
    if (template) {
      setFormData({ ...template });
    }
    setLocalTaskTemplates(taskTemplates);
  }, [template, taskTemplates]);

  const linkedMilestones = useMemo(() => {
    if (!template?.id) return [];
    return milestoneTemplates.filter(m => m.stageTemplateId === template.id);
  }, [milestoneTemplates, template?.id]);

  const availableMilestones = useMemo(() => {
    return milestoneTemplates.filter(m => !m.stageTemplateId);
  }, [milestoneTemplates]);

  const derivedRoles = useMemo(() => {
    const roleIds = new Set<string>();
    (formData.defaultTasks || []).forEach(taskId => {
      const task = localTaskTemplates.find(t => t.id === taskId);
      if (task?.assignedRoleId) {
        roleIds.add(task.assignedRoleId);
      }
    });
    return Array.from(roleIds);
  }, [formData.defaultTasks, localTaskTemplates]);

  const handleSave = () => {
    if (!formData.name) return;
    
    const mergedRoles = Array.from(new Set([...(formData.defaultRoles || []), ...derivedRoles]));
    
    onSave({
      id: template?.id || `st${Date.now()}`,
      ...formData,
      defaultRoles: mergedRoles
    } as StageTemplate);
  };

  const handleSaveTask = () => {
    if (!currentTask.title) return;

    const newTask = {
      ...currentTask,
      id: currentTask.id || `tt${Date.now()}`
    } as TaskTemplate;

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
      assignedRoleId: undefined
    });
  };

  const addExistingTask = (taskId: string) => {
    if (!taskId || (formData.defaultTasks || []).includes(taskId)) return;
    setFormData(prev => ({
      ...prev,
      defaultTasks: [...(prev.defaultTasks || []), taskId]
    }));
  };

  const removeTask = (taskId: string) => {
    setFormData(prev => ({
      ...prev,
      defaultTasks: (prev.defaultTasks || []).filter(id => id !== taskId)
    }));
  };

  const handleLinkMilestone = (milestoneId: string) => {
    if (onMilestoneLink && template?.id) {
      onMilestoneLink(milestoneId, template.id);
    }
  };

  const handleUnlinkMilestone = (milestoneId: string) => {
    if (onMilestoneUnlink) {
      onMilestoneUnlink(milestoneId);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-6 border-b shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {template ? "Edit Stage Template" : "Create Stage Template"}
          </h2>
          <p className="text-muted-foreground">
            Configure tasks, roles, and milestones for this stage.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} data-testid="btn-cancel">Cancel</Button>
          <Button onClick={handleSave} data-testid="btn-save">Save Template</Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Stage Name</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Discovery Phase"
                  data-testid="input-stage-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={formData.description || ""} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the purpose of this stage..."
                  data-testid="input-stage-description"
                />
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tasks" className="gap-2">
                <ListTodo className="h-4 w-4" />
                Tasks ({(formData.defaultTasks || []).length})
              </TabsTrigger>
              <TabsTrigger value="milestones" className="gap-2">
                <Flag className="h-4 w-4" />
                Milestones ({linkedMilestones.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle className="text-base">Default Tasks</CardTitle>
                    <CardDescription>
                      Tasks automatically created when this stage is initialized. Assigning roles to tasks will add those roles to the stage.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <SearchableSelect
                      value=""
                      onValueChange={addExistingTask}
                      placeholder="Add existing task template..."
                      triggerClassName="flex-1"
                      options={localTaskTemplates
                        .filter(t => !(formData.defaultTasks || []).includes(t.id))
                        .map(t => ({
                          value: t.id,
                          label: t.title || "Untitled Task"
                        }))}
                      data-testid="select-add-task"
                    />
                    <Button onClick={() => setIsTaskFormOpen(true)} className="gap-2" data-testid="btn-new-task">
                      <Plus className="h-4 w-4" /> New Task
                    </Button>
                  </div>

                  {isTaskFormOpen && (
                    <div className="border rounded-lg p-4 bg-muted/30 space-y-4 animate-in slide-in-from-top-2">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm">{currentTask.id ? 'Edit Task' : 'New Task'}</h4>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsTaskFormOpen(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label>Task Title</Label>
                          <Input 
                            value={currentTask.title || ""} 
                            onChange={(e) => setCurrentTask({ ...currentTask, title: e.target.value })}
                            placeholder="e.g. Kickoff Meeting"
                            data-testid="input-task-title"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Description</Label>
                          <Textarea 
                            value={currentTask.description || ""} 
                            onChange={(e) => setCurrentTask({ ...currentTask, description: e.target.value })}
                            rows={2}
                            data-testid="input-task-description"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="grid gap-2">
                            <Label>Priority</Label>
                            <SearchableSelect 
                              value={currentTask.defaultPriority || "Medium"} 
                              onValueChange={(v: any) => setCurrentTask({ ...currentTask, defaultPriority: v })}
                              options={[
                                { value: "Low", label: "Low" },
                                { value: "Medium", label: "Medium" },
                                { value: "High", label: "High" }
                              ]}
                              data-testid="select-task-priority"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Est. Hours</Label>
                            <Input 
                              type="number" 
                              value={currentTask.defaultEstimateHours || 1} 
                              onChange={(e) => setCurrentTask({ ...currentTask, defaultEstimateHours: parseInt(e.target.value) || 1 })}
                              data-testid="input-task-hours"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Assigned Role</Label>
                            <SearchableSelect 
                              value={currentTask.assignedRoleId || "unassigned"} 
                              onValueChange={(v) => setCurrentTask({ ...currentTask, assignedRoleId: v === "unassigned" ? undefined : v })}
                              placeholder="Select Role"
                              options={[
                                { value: "unassigned", label: "Unassigned" },
                                ...roleTemplates.map(role => ({ value: role.id, label: role.name }))
                              ]}
                              data-testid="select-task-role"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setIsTaskFormOpen(false)}>Cancel</Button>
                          <Button size="sm" onClick={handleSaveTask} data-testid="btn-save-task">Save Task</Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {(formData.defaultTasks || []).map((taskId, idx) => {
                      const task = localTaskTemplates.find(t => t.id === taskId);
                      if (!task) return null;
                      const roleName = task.assignedRoleId 
                        ? roleTemplates.find(r => r.id === task.assignedRoleId)?.name 
                        : null;

                      return (
                        <div key={taskId} className="flex items-center justify-between p-3 border rounded-md bg-card hover:bg-accent/50 transition-colors group" data-testid={`task-item-${taskId}`}>
                          <div className="flex items-center gap-3">
                            <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
                            <div className="p-2 bg-primary/10 rounded text-primary">
                              <Check className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{task.title}</div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <Badge variant="outline" className="h-5 text-[10px] px-1.5">{task.defaultPriority || "Medium"}</Badge>
                                <span>{task.defaultEstimateHours || 1}h</span>
                                {roleName && (
                                  <>
                                    <span>•</span>
                                    <Badge variant="secondary" className="h-5 text-[10px] px-1.5 gap-1">
                                      <Users className="h-3 w-3" />
                                      {roleName}
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
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
                      );
                    })}
                    {(!formData.defaultTasks || formData.defaultTasks.length === 0) && !isTaskFormOpen && (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                        No default tasks configured. Add existing templates or create new ones.
                      </div>
                    )}
                  </div>

                  {derivedRoles.length > 0 && (
                    <div className="pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Users className="h-4 w-4" />
                        <span>Roles derived from tasks:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {derivedRoles.map(roleId => {
                          const role = roleTemplates.find(r => r.id === roleId);
                          return (
                            <Badge key={roleId} variant="secondary">
                              {role?.name || roleId}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="milestones" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div>
                    <CardTitle className="text-base">Linked Milestones</CardTitle>
                    <CardDescription>
                      Milestones that mark completion points within this stage.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {template?.id && availableMilestones.length > 0 && onMilestoneLink && (
                    <div className="flex items-center gap-2">
                      <SearchableSelect
                        value=""
                        onValueChange={handleLinkMilestone}
                        placeholder="Link existing milestone..."
                        triggerClassName="flex-1"
                        options={availableMilestones.map(m => ({
                          value: m.id,
                          label: m.name
                        }))}
                        data-testid="select-link-milestone"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    {linkedMilestones.map(milestone => (
                      <div key={milestone.id} className="flex items-center justify-between p-3 border rounded-md bg-card hover:bg-accent/50 transition-colors group" data-testid={`milestone-item-${milestone.id}`}>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-500/10 rounded text-amber-600">
                            <Flag className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">{milestone.name}</div>
                            {milestone.description && (
                              <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {milestone.description}
                              </div>
                            )}
                          </div>
                        </div>
                        {onMilestoneUnlink && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleUnlinkMilestone(milestone.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {linkedMilestones.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                        {template?.id 
                          ? "No milestones linked to this stage. Link existing milestones above."
                          : "Save the stage first, then link milestones."}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
