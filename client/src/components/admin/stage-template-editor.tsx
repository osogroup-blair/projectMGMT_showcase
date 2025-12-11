import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Settings2,
  Check,
  ChevronRight,
  GripVertical,
  Pencil,
  X
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { 
  StageTemplate, 
  TaskTemplate, 
  RoleTemplate, 
  TASK_STATUS_OPTIONS, 
  MILESTONES 
} from "@/lib/mock-data";

interface StageTemplateEditorProps {
  template: StageTemplate | null;
  taskTemplates: TaskTemplate[];
  roleTemplates: RoleTemplate[];
  onSave: (template: StageTemplate) => void;
  onCancel: () => void;
}

export function StageTemplateEditor({ 
  template, 
  taskTemplates, 
  roleTemplates, 
  onSave, 
  onCancel 
}: StageTemplateEditorProps) {
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

  // Local task templates state to handle new tasks created within the editor
  const [localTaskTemplates, setLocalTaskTemplates] = useState<TaskTemplate[]>(taskTemplates);

  useEffect(() => {
    if (template) {
      setFormData({ ...template });
    }
    setLocalTaskTemplates(taskTemplates);
  }, [template, taskTemplates]);

  const handleSave = () => {
    if (!formData.name) return;
    
    onSave({
      id: template?.id || `st${Date.now()}`,
      ...formData
    } as StageTemplate);
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
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {template ? "Edit Stage Template" : "Create Stage Template"}
          </h2>
          <p className="text-muted-foreground">
            Configure the default behavior, criteria, and tasks for this stage.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave}>Save Template</Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-8 max-w-5xl mx-auto">
          {/* Basic Info */}
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
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the purpose of this stage..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Criteria & Gates */}
          <Card>
            <CardHeader>
              <CardTitle>Stage Criteria & Gates</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Entry Criteria</Label>
                  <Input 
                    value={formData.entryCriteria} 
                    onChange={(e) => setFormData({ ...formData, entryCriteria: e.target.value })}
                    placeholder="e.g. Project Charter Approved"
                  />
                  <p className="text-xs text-muted-foreground">Conditions that must be met to start this stage.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Exit Criteria</Label>
                  <Input 
                    value={formData.exitCriteria} 
                    onChange={(e) => setFormData({ ...formData, exitCriteria: e.target.value })}
                    placeholder="e.g. Sign-off received"
                  />
                  <p className="text-xs text-muted-foreground">Conditions required to complete this stage.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Task Configuration */}
          <Card className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Default Tasks</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Tasks automatically created when this stage is initialized.</p>
              </div>
              <Button onClick={() => setIsTaskFormOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Add Task
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        value={currentTask.title} 
                        onChange={(e) => setCurrentTask({ ...currentTask, title: e.target.value })}
                        placeholder="e.g. Kickoff Meeting"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Description</Label>
                      <Textarea 
                        value={currentTask.description} 
                        onChange={(e) => setCurrentTask({ ...currentTask, description: e.target.value })}
                        rows={2}
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
                          {roleTemplates.map(role => (
                            <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsTaskFormOpen(false)}>Cancel</Button>
                      <Button size="sm" onClick={handleSaveTask}>Save Task</Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {formData.defaultTasks?.map(taskId => {
                  const task = localTaskTemplates.find(t => t.id === taskId);
                  if (!task) return null;
                  const roleName = task.assignedRoleId 
                    ? roleTemplates.find(r => r.id === task.assignedRoleId)?.name 
                    : "Unassigned";

                  return (
                    <div key={taskId} className="flex items-center justify-between p-3 border rounded-md bg-card hover:bg-accent/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded text-primary">
                          <Check className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{task.title}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <Badge variant="outline" className="h-5 text-[10px] px-1.5">{task.defaultPriority}</Badge>
                            <span>{task.defaultEstimateHours}h</span>
                            <span>•</span>
                            <span>{roleName}</span>
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
                    No default tasks configured. Click "Add Task" to create one.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Workflow Configuration */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Required Roles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {roleTemplates.map(role => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`role-${role.id}`}
                        checked={formData.defaultRoles?.includes(role.id)}
                        onCheckedChange={() => toggleRole(role.id)}
                      />
                      <Label htmlFor={`role-${role.id}`} className="flex-1 cursor-pointer">
                        {role.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Allowed Statuses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {TASK_STATUS_OPTIONS.map(status => (
                    <div key={status.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`status-${status.id}`}
                        checked={formData.allowedTaskStatuses?.includes(status.id)}
                        onCheckedChange={() => toggleStatus(status.id)}
                      />
                      <Label htmlFor={`status-${status.id}`} className="flex items-center gap-2 cursor-pointer">
                         <div className={cn("w-2 h-2 rounded-full", status.color.replace("text", "bg").split(" ")[0].replace("50", "500"))} />
                        {status.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
