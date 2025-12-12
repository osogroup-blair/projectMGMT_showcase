import { useState, useMemo } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  MoreHorizontal,
  Plus,
  Filter,
  Layers,
  Package,
  User as UserIcon,
  Workflow,
  Loader2,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRoute, Link } from "wouter";
import { cn } from "@/lib/utils";
import { useProject, useEpics, useDeliverables, useTasks, useUsers, useProjectStages } from "@/hooks/use-nexus-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { EFFORT_VALUES } from "@shared/schema";

interface TaskFormData {
  title: string;
  description: string;
  stageId: string;
  status: "Todo" | "In Progress" | "Review" | "Done";
  priority: "Low" | "Medium" | "High";
  assigneeId: string;
  effort: number;
  estimateHours: number;
  deadline: string;
}

export default function EpicDetail() {
  const [match, params] = useRoute("/projects/:projectId/epics/:epicId");
  const projectId = params?.projectId || "1";
  const epicId = params?.epicId || "e1";
  const { toast } = useToast();

  // Fetch data from database
  const { data: project, isLoading: isProjectLoading } = useProject(projectId);
  const { data: allEpics, isLoading: isEpicsLoading } = useEpics();
  const { data: allDeliverables, isLoading: isDeliverablesLoading } = useDeliverables();
  const { data: allTasks, isLoading: isTasksLoading, create: createTask, update: updateTask, remove: deleteTask } = useTasks();
  const { data: users, isLoading: isUsersLoading } = useUsers();
  const { data: projectStages, isLoading: isStagesLoading } = useProjectStages();

  // Task CRUD state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    status: [] as string[],
    priority: [] as string[],
    assigneeId: [] as string[]
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    stageId: "",
    status: "Todo",
    priority: "Medium",
    assigneeId: "",
    effort: 5,
    estimateHours: 0,
    deadline: new Date().toISOString().split('T')[0]
  });

  // Derive epic and related data
  const epic = useMemo(() => allEpics?.find((e: any) => e.id === epicId), [allEpics, epicId]);
  const deliverable = useMemo(() => allDeliverables?.find((d: any) => d.id === epic?.deliverableId), [allDeliverables, epic]);
  const tasks = useMemo(() => allTasks?.filter((t: any) => t.epicId === epicId) || [], [allTasks, epicId]);
  const owner = useMemo(() => users?.find((u: any) => u.id === epic?.ownerId), [users, epic]);

  // Filter tasks based on active filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((task: any) => {
      if (filters.status.length > 0 && !filters.status.includes(task.status)) return false;
      if (filters.priority.length > 0 && !filters.priority.includes(task.priority)) return false;
      if (filters.assigneeId.length > 0 && !filters.assigneeId.includes(task.assigneeId)) return false;
      return true;
    });
  }, [tasks, filters]);

  const activeFilterCount = filters.status.length + filters.priority.length + filters.assigneeId.length;

  const toggleFilter = (type: 'status' | 'priority' | 'assigneeId', value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value]
    }));
  };

  const clearFilters = () => {
    setFilters({ status: [], priority: [], assigneeId: [] });
  };

  // Get Assigned Stages directly from the Epic
  const epicStages = useMemo(() => {
    if (!epic?.stageIds || !projectStages) return [];
    return projectStages.filter((s: any) => epic.stageIds.includes(s.id));
  }, [epic, projectStages]);

  // Calculate progress from task completion (uses filtered tasks when filters active)
  const progress = useMemo(() => {
    if (filteredTasks.length === 0) return 0;
    const doneTasks = filteredTasks.filter((t: any) => t.status === "Done").length;
    return Math.round((doneTasks / filteredTasks.length) * 100);
  }, [filteredTasks]);

  // Task counts (uses filtered tasks for consistency with board view)
  const taskCounts = useMemo(() => {
    const done = filteredTasks.filter((t: any) => t.status === "Done").length;
    return { done, total: filteredTasks.length };
  }, [filteredTasks]);

  const getAssignee = (id?: string) => users?.find((u: any) => u.id === id);

  // Task CRUD handlers
  const handleOpenCreate = (stageId?: string) => {
    if (epicStages.length === 0) {
      toast({
        title: "Cannot Create Task",
        description: "This epic has no stages assigned. Add stages to the epic first.",
        variant: "destructive"
      });
      return;
    }
    
    setEditingTaskId(null);
    setFormData({
      title: "",
      description: "",
      stageId: stageId || epicStages[0]?.id || "",
      status: "Todo",
      priority: "Medium",
      assigneeId: users?.[0]?.id || "",
      effort: 5,
      estimateHours: 0,
      deadline: new Date().toISOString().split('T')[0]
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (task: any) => {
    setEditingTaskId(task.id);
    setFormData({
      title: task.title || "",
      description: task.description || "",
      stageId: task.stageId || epicStages[0]?.id || "",
      status: task.status || "Todo",
      priority: task.priority || "Medium",
      assigneeId: task.assigneeId || "",
      effort: task.effort || 5,
      estimateHours: task.estimateHours || 0,
      deadline: task.deadline || new Date().toISOString().split('T')[0]
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Task title is required.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.stageId) {
      toast({
        title: "Validation Error",
        description: "Please select a stage.",
        variant: "destructive"
      });
      return;
    }

    if (editingTaskId) {
      updateTask({
        id: editingTaskId,
        updates: {
          ...formData,
          epicId,
          projectId,
          project: project?.name
        }
      });
      toast({
        title: "Task Updated",
        description: `"${formData.title}" has been updated.`
      });
    } else {
      createTask({
        ...formData,
        epicId,
        projectId,
        project: project?.name
      });
      toast({
        title: "Task Created",
        description: `"${formData.title}" has been added to the epic.`
      });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteTaskId) {
      const task = tasks.find(t => t.id === deleteTaskId);
      deleteTask(deleteTaskId);
      toast({
        title: "Task Deleted",
        description: `"${task?.title}" has been removed.`
      });
      setDeleteTaskId(null);
    }
  };

  // Loading state
  const isLoading = isProjectLoading || isEpicsLoading || isDeliverablesLoading || isTasksLoading || isUsersLoading || isStagesLoading;

  if (isLoading) {
    return (
      <Shell>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  if (!epic) {
    return (
      <Shell>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Epic not found</h2>
            <p className="text-muted-foreground">The epic you're looking for doesn't exist.</p>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-7xl h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 shrink-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={`/projects/${projectId}?tab=deliverables`} className="hover:text-primary transition-colors flex items-center gap-1" data-testid="link-back-deliverables">
              <ArrowLeft className="h-4 w-4" />
              Deliverables
            </Link>
            <span className="text-border">/</span>
            <Link href={`/projects/${projectId}/deliverables/${epic?.deliverableId}`} className="hover:text-primary transition-colors" data-testid="link-deliverable">
              {deliverable?.title}
            </Link>
            <span className="text-border">/</span>
            <span className="text-foreground font-medium">{epic.title}</span>
          </div>

          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-primary">{epic.title}</h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {epic.startDate} - {epic.endDate}
                    </span>
                    <span>•</span>
                    <Badge variant="outline" className={cn(
                      "font-normal text-xs",
                      epic.status === "In Progress" ? "bg-blue-50 text-blue-700 border-blue-200" :
                      epic.status === "Completed" ? "bg-green-50 text-green-700 border-green-200" :
                      "bg-slate-50 text-slate-700 border-slate-200"
                    )}>
                      {epic.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2" data-testid="button-filter-tasks">
                    <Filter className="h-4 w-4" />
                    Filter Tasks
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Filter Tasks</h4>
                      {activeFilterCount > 0 && (
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground" onClick={clearFilters}>
                          Clear all
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {["Todo", "In Progress", "Review", "Done"].map(status => (
                          <div 
                            key={status} 
                            className={cn(
                              "flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-muted/50 transition-colors text-sm",
                              filters.status.includes(status) && "bg-primary/10 border-primary"
                            )}
                            onClick={() => toggleFilter('status', status)}
                          >
                            <Checkbox checked={filters.status.includes(status)} />
                            <span>{status}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Priority</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {["Low", "Medium", "High"].map(priority => (
                          <div 
                            key={priority} 
                            className={cn(
                              "flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-muted/50 transition-colors text-sm",
                              filters.priority.includes(priority) && "bg-primary/10 border-primary"
                            )}
                            onClick={() => toggleFilter('priority', priority)}
                          >
                            <Checkbox checked={filters.priority.includes(priority)} />
                            <span>{priority}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Assignee</Label>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {users?.map((user: any) => (
                          <div 
                            key={user.id} 
                            className={cn(
                              "flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-muted/50 transition-colors text-sm",
                              filters.assigneeId.includes(user.id) && "bg-primary/10 border-primary"
                            )}
                            onClick={() => toggleFilter('assigneeId', user.id)}
                          >
                            <Checkbox checked={filters.assigneeId.includes(user.id)} />
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[9px]">{user.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="truncate">{user.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button className="gap-2" onClick={() => handleOpenCreate()} data-testid="button-add-task-header">
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="text-muted-foreground max-w-3xl">
            {epic.description}
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
            <Card className="bg-muted/20 border-none shadow-none">
              <CardContent className="p-3 flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{owner?.name?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-xs text-muted-foreground">Owner</div>
                  <div className="text-sm font-medium">{owner?.name || "Unassigned"}</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/20 border-none shadow-none">
              <CardContent className="p-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progress ({taskCounts.done}/{taskCounts.total} tasks)</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </CardContent>
            </Card>
            <Card className="bg-muted/20 border-none shadow-none">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Active Stages</div>
                  <div className="text-sm font-medium truncate max-w-[120px]">
                    {epicStages.length} Stages
                  </div>
                </div>
                <div className="h-8 w-8 bg-background rounded-full flex items-center justify-center text-muted-foreground">
                  <Layers className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/20 border-none shadow-none">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Est. Hours</div>
                  <div className="text-lg font-bold">
                    {filteredTasks.reduce((acc: number, t: any) => acc + (t.estimateHours || 0), 0)}h
                  </div>
                </div>
                <div className="h-8 w-8 bg-background rounded-full flex items-center justify-center text-muted-foreground">
                  <Clock className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tasks grouped by Stage (from Epic's assigned stages) */}
        <div className="flex-1 min-h-0 border rounded-lg bg-muted/5 overflow-hidden flex flex-col">
          <div className="p-3 border-b bg-background font-medium text-sm flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            Epic Stages
          </div>
          <ScrollArea className="flex-1 p-6">
            <div className="flex gap-6 min-w-max pb-4">
              {epicStages.length > 0 ? (
                epicStages.map((stage, index) => {
                  const stageTasks = filteredTasks.filter(t => t.stageId === stage.id);
                  
                  return (
                    <div key={stage.id} className="w-[320px] shrink-0 flex flex-col gap-4">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border bg-background text-primary border-primary"
                        )}>
                          {index + 1}
                        </div>
                        <h3 className="font-semibold text-sm">{stage.name}</h3>
                        <Badge variant="secondary" className="ml-auto text-[10px] h-5">
                          {stageTasks.length}
                        </Badge>
                      </div>

                      <div className="flex flex-col gap-3">
                        {stageTasks.length > 0 ? (
                          stageTasks.map(task => {
                            const assignee = getAssignee(task.assigneeId);
                            return (
                              <Link href={`/projects/${projectId}/tasks/${task.id}`}>
                              <Card 
                                key={task.id} 
                                className="shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                                data-testid={`card-task-${task.id}`}
                              >
                                <CardContent className="p-3 space-y-3">
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-start gap-2">
                                      <h4 className="text-sm font-medium hover:text-primary leading-tight line-clamp-2">
                                        {task.title}
                                      </h4>
                                      <Badge variant={
                                        task.priority === "High" ? "destructive" : 
                                        task.priority === "Medium" ? "default" : "secondary"
                                      } className="text-[10px] h-5 px-1.5 shrink-0">
                                        {task.priority}
                                      </Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {task.tags?.map((tag: string) => (
                                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center justify-between pt-1 border-t border-dashed mt-2">
                                    <div className="flex items-center gap-2">
                                      {assignee ? (
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                          <Avatar className="h-5 w-5 border border-background">
                                            <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                              {assignee.name?.substring(0, 2).toUpperCase() || "??"}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="truncate max-w-[80px]">{assignee.name?.split(' ')[0] || "Unknown"}</span>
                                        </div>
                                      ) : (
                                        <div className="text-xs text-muted-foreground italic">Unassigned</div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {task.effort && (
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded">
                                          {task.effort} pts
                                        </span>
                                      )}
                                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-muted-foreground/20">
                                        {task.status}
                                      </Badge>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                              </Link>
                            );
                          })
                        ) : (
                          <div className="h-24 rounded-lg border border-dashed flex flex-col items-center justify-center text-muted-foreground/50 text-xs bg-muted/10">
                            <span>No tasks in this stage</span>
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="h-auto p-0 text-primary opacity-50 hover:opacity-100"
                              onClick={() => handleOpenCreate(stage.id)}
                              data-testid={`button-add-task-${stage.id}`}
                            >
                              + Add Task
                            </Button>
                          </div>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full justify-center text-xs text-muted-foreground border border-dashed h-8 mt-2"
                          onClick={() => handleOpenCreate(stage.id)}
                          data-testid={`button-add-task-bottom-${stage.id}`}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Task
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="w-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Layers className="h-12 w-12 mb-4 opacity-20" />
                    <h3 className="text-lg font-medium">No Stages Assigned</h3>
                    <p className="text-sm">This epic doesn't have any stages assigned yet.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Task Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingTaskId ? "Edit Task" : "Create Task"}</DialogTitle>
            <DialogDescription>
              {editingTaskId ? "Update the task details below." : "Add a new task to this epic."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title *</Label>
              <Input
                id="task-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Task title..."
                data-testid="input-task-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Task description..."
                rows={3}
                data-testid="input-task-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stage *</Label>
                <Select
                  value={formData.stageId}
                  onValueChange={(value) => setFormData({ ...formData, stageId: value })}
                >
                  <SelectTrigger data-testid="select-task-stage">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {epicStages.map((stage: any) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger data-testid="select-task-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todo">Todo</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Review">Review</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger data-testid="select-task-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Effort (Story Points)</Label>
                <Select
                  value={String(formData.effort)}
                  onValueChange={(value) => setFormData({ ...formData, effort: Number(value) })}
                >
                  <SelectTrigger data-testid="select-task-effort">
                    <SelectValue placeholder="Select effort" />
                  </SelectTrigger>
                  <SelectContent>
                    {EFFORT_VALUES.map((val) => (
                      <SelectItem key={val} value={String(val)}>
                        {val} points
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select
                  value={formData.assigneeId}
                  onValueChange={(value) => setFormData({ ...formData, assigneeId: value })}
                >
                  <SelectTrigger data-testid="select-task-assignee">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-deadline">Deadline</Label>
                <Input
                  id="task-deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  data-testid="input-task-deadline"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <div>
              {editingTaskId && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setDeleteTaskId(editingTaskId);
                  }}
                  data-testid="button-delete-task"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} data-testid="button-save-task">
                {editingTaskId ? "Save Changes" : "Create Task"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTaskId} onOpenChange={(open) => !open && setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The task will be permanently removed from this epic.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
}
