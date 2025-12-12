import { useState, useMemo } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Calendar,
  User,
  Users,
  Flag,
  Clock,
  CheckCircle2,
  AlertCircle,
  GripVertical,
  ChevronDown,
  LayoutGrid,
  List,
  Columns,
  Trash2,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoute, useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Task } from "@/lib/mock-data";
import { useTasks, useProject, useMilestones, useUsers, useProjectStages, useEpics, useDeliverables } from "@/hooks/use-nexus-data";
import { EFFORT_VALUES } from "@shared/schema";

// Stage color mapping based on stage type/order
const STAGE_COLORS: Record<string, string> = {
  "st_plan": "border-purple-500/20 bg-purple-500/5",
  "st_validate": "border-blue-500/20 bg-blue-500/5",
  "st_develop": "border-indigo-500/20 bg-indigo-500/5",
  "st_enable": "border-green-500/20 bg-green-500/5"
};

const getStageColor = (stageId: string, order: number) => {
  if (STAGE_COLORS[stageId]) return STAGE_COLORS[stageId];
  const colors = ["border-purple-500/20 bg-purple-500/5", "border-blue-500/20 bg-blue-500/5", "border-indigo-500/20 bg-indigo-500/5", "border-amber-500/20 bg-amber-500/5", "border-green-500/20 bg-green-500/5"];
  return colors[(order - 1) % colors.length];
};

const PRIORITY_CONFIG = {
  "High": { color: "text-red-600 bg-red-100", label: "High" },
  "Medium": { color: "text-amber-600 bg-amber-100", label: "Medium" },
  "Low": { color: "text-slate-600 bg-slate-100", label: "Low" }
};

export default function TaskBoard() {
  const [match, params] = useRoute("/projects/:projectId/tasks");
  const [, setLocation] = useLocation();
  const projectId = params?.projectId || "1";
  const { toast } = useToast();

  const { data: project, isLoading: isProjectLoading } = useProject(projectId);
  const { data: allTasks, isLoading: isTasksLoading, create: createTask, update: updateTask, remove: deleteTask } = useTasks();
  const { data: milestones, isLoading: isMilestonesLoading } = useMilestones();
  const { data: users, isLoading: isUsersLoading } = useUsers();
  const { data: projectStages, isLoading: isStagesLoading } = useProjectStages();
  const { data: allEpics, isLoading: isEpicsLoading } = useEpics();
  const { data: allDeliverables, isLoading: isDeliverablesLoading } = useDeliverables();
  
  // Filter deliverables for this project
  const projectDeliverables = useMemo(() => {
    if (!allDeliverables || !project) return [];
    return allDeliverables.filter((d: any) => d.projectId === project.id);
  }, [allDeliverables, project]);
  
  // Filter epics for the current project (via deliverables)
  const projectEpics = useMemo(() => {
    if (!allEpics || !project || projectDeliverables.length === 0) return [];
    const deliverableIds = new Set(projectDeliverables.map((d: any) => d.id));
    return allEpics.filter((e: any) => deliverableIds.has(e.deliverableId));
  }, [allEpics, project, projectDeliverables]);

  // Get project-specific tasks first (needed to determine which stages belong to this project)
  const projectTasks = useMemo(() => {
    if (!project || !allTasks) return [];
    return allTasks.filter((t: any) => t.project === project.name || t.projectId === project.id);
  }, [project, allTasks]);

  // Extract unique stage IDs from project tasks AND project epics to scope stages to this project
  // This ensures stages show even if they have no tasks yet (from epic configuration)
  const projectStageIds = useMemo(() => {
    const stageIds = new Set<string>();
    // Add stage IDs from tasks
    projectTasks.forEach((t: any) => {
      if (t.stageId) stageIds.add(t.stageId);
    });
    // Add stage IDs from epics (epics define which stages belong to the project)
    projectEpics.forEach((e: any) => {
      if (e.stageIds && Array.isArray(e.stageIds)) {
        e.stageIds.forEach((sid: string) => stageIds.add(sid));
      }
    });
    return stageIds;
  }, [projectTasks, projectEpics]);

  // Map stages with colors, sorted by order - FILTERED to only stages used by this project
  const stages = useMemo(() => {
    if (!projectStages || projectStages.length === 0) return [];
    // Filter to only stages configured for this project (via tasks or epics)
    return [...projectStages]
      .filter((stage: any) => projectStageIds.has(stage.id))
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
      .map((stage: any) => ({
        ...stage,
        color: getStageColor(stage.id, stage.order)
      }));
  }, [projectStages, projectStageIds]);

  const [searchQuery, setSearchQuery] = useState("");
  const [viewType, setViewType] = useState<"board" | "list">("board");
  
  // Filters
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [milestoneFilter, setMilestoneFilter] = useState<string>("all");

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<Partial<Task>>({});

  // Use the already filtered project tasks
  const tasks = projectTasks;

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.description?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesAssignee = assigneeFilter === "all" || t.assigneeId === assigneeFilter;
    const matchesMilestone = milestoneFilter === "all" || t.milestoneId === milestoneFilter;
    
    return matchesSearch && matchesAssignee && matchesMilestone;
  });

  const handleOpenCreate = (stageId?: string, epicId?: string) => {
    if (!project) return;
    setEditingTask(null);
    setFormData({
      title: "",
      description: "",
      project: project.name, // Legacy field
      projectId: project.id, // New field
      stageId: stageId || (stages[0]?.id || "st_plan"),
      epicId: epicId || (projectEpics[0]?.id || ""),
      status: "Todo",
      assigneeId: users[0]?.id || "",
      deadline: new Date().toISOString().split('T')[0],
      priority: "Medium",
      estimateHours: 0,
      effort: 3, // Default to Fibonacci value 3
      tags: []
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    // For now, we open the dialog instead of navigating, to keep it simple
    setEditingTask(task);
    setFormData({ ...task });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.stageId || !formData.epicId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Title, Stage, and Epic are required).",
        variant: "destructive"
      });
      return;
    }

    if (editingTask) {
      updateTask({ id: editingTask.id, updates: formData });
    } else {
      createTask({
        ...formData,
        project: project?.name,
        projectId: project?.id
      });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteTask(id);
    setIsDialogOpen(false);
  };

  const getAssignee = (id?: string) => users.find((t: any) => t.id === id);
  const getMilestone = (id?: string) => milestones.find((m: any) => m.id === id);
  const getEpic = (id?: string) => projectEpics.find((e: any) => e.id === id);

  if (isProjectLoading || isTasksLoading || isMilestonesLoading || isUsersLoading || isStagesLoading || isEpicsLoading || isDeliverablesLoading) {
    return (
      <Shell>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  if (!project) return null;

  return (
    <Shell>
      <div className="mx-auto max-w-[1600px] h-[calc(100vh-8rem)] flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-6 shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-primary">Task Board</h1>
              <p className="text-muted-foreground">Manage and track tasks across project stages.</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center border rounded-md bg-card">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("h-9 w-9 rounded-none rounded-l-md", viewType === "board" && "bg-muted")}
                  onClick={() => setViewType("board")}
                >
                  <Columns className="h-4 w-4" />
                </Button>
                <div className="w-px h-full bg-border" />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn("h-9 w-9 rounded-none rounded-r-md", viewType === "list" && "bg-muted")}
                  onClick={() => setViewType("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={() => handleOpenCreate()} className="gap-2">
                <Plus className="h-4 w-4" />
                New Task
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-[160px]">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Assignee" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {users.map((member: any) => (
                    <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={milestoneFilter} onValueChange={setMilestoneFilter}>
                <SelectTrigger className="w-[160px]">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Milestone" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Milestones</SelectItem>
                  {milestones.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Board View */}
        {viewType === "board" ? (
          <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
            <div className="flex gap-6 h-full min-w-max">
              {stages.map(stage => {
                const stageTasks = filteredTasks.filter(t => t.stageId === stage.id);
                
                return (
                  <div key={stage.id} className="w-[320px] flex flex-col h-full rounded-xl bg-muted/30 border border-border/50">
                    {/* Column Header */}
                    <div 
                      className={cn("p-4 border-b flex items-center justify-between shrink-0 rounded-t-xl cursor-pointer hover:opacity-80 transition-opacity", stage.color)}
                      onClick={() => setLocation(`/projects/${projectId}?tab=stage-${stage.id}`)}
                      title={`View ${stage.name} stage details`}
                    >
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{stage.name}</h3>
                        <Badge variant="secondary" className="bg-background/50 text-foreground font-mono text-xs">
                          {stageTasks.length}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleOpenCreate(stage.id); }}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Tasks List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      {stageTasks.map(task => {
                        const assignee = getAssignee(task.assigneeId);
                        const priority = PRIORITY_CONFIG[task.priority];

                        return (
                          <Card 
                            key={task.id} 
                            className="shadow-sm hover:shadow-md transition-shadow cursor-pointer group bg-card"
                            onClick={() => handleOpenEdit(task)}
                          >
                            <CardContent className="p-3 space-y-3">
                              <div className="flex justify-between items-start gap-2">
                                <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 font-medium border-0", priority.color)}>
                                  {priority.label}
                                </Badge>
                                <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); /* Menu logic */ }}>
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </div>

                              <div>
                                <h4 className="font-medium text-sm leading-tight mb-1 line-clamp-2">{task.title}</h4>
                                {task.tags && task.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {task.tags.map(tag => (
                                      <span key={tag} className="text-[10px] text-muted-foreground bg-muted px-1 rounded-sm">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between pt-1 border-t border-border/50">
                                {assignee ? (
                                  <div className="flex items-center gap-1.5" title={assignee.name}>
                                    <Avatar className="h-5 w-5">
                                      <AvatarFallback className="text-[9px]">{assignee.name.substring(0,2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs text-muted-foreground max-w-[80px] truncate">{assignee.name.split(' ')[0]}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <User className="h-3.5 w-3.5" />
                                    <span className="text-xs">Unassigned</span>
                                  </div>
                                )}
                                
                                <div className={cn(
                                  "flex items-center gap-1 text-xs",
                                  new Date(task.deadline) < new Date() ? "text-red-500 font-medium" : "text-muted-foreground"
                                )}>
                                  <Clock className="h-3 w-3" />
                                  <span>{new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                      
                      <Button variant="ghost" className="w-full text-muted-foreground text-xs py-2 h-auto hover:bg-muted/50 border border-dashed border-border" onClick={() => handleOpenCreate(stage.id)}>
                        <Plus className="h-3 w-3 mr-1.5" />
                        Add Task
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-card rounded-lg border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-muted/30 font-medium text-sm grid grid-cols-12 gap-4 text-muted-foreground">
              <div className="col-span-4">Task</div>
              <div className="col-span-2">Stage</div>
              <div className="col-span-2">Assignee</div>
              <div className="col-span-2">Priority</div>
              <div className="col-span-2">Due Date</div>
            </div>
            <div className="overflow-y-auto h-full">
              {filteredTasks.map(task => {
                const assignee = getAssignee(task.assigneeId);
                const stage = stages.find(s => s.id === task.stageId);
                const priority = PRIORITY_CONFIG[task.priority];

                return (
                  <div 
                    key={task.id} 
                    className="p-4 border-b last:border-0 grid grid-cols-12 gap-4 items-center hover:bg-muted/30 transition-colors cursor-pointer text-sm"
                    onClick={() => handleOpenEdit(task)}
                  >
                    <div className="col-span-4 font-medium flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {task.title}
                    </div>
                    <div className="col-span-2">
                      <Badge variant="outline" className="font-normal text-muted-foreground">
                        {stage?.name || "Unknown"}
                      </Badge>
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      {assignee ? (
                        <>
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[9px]">{assignee.name.substring(0,2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="truncate">{assignee.name}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground italic">Unassigned</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", priority.color)}>
                        {priority.label}
                      </span>
                    </div>
                    <div className="col-span-2 text-muted-foreground">
                      {new Date(task.deadline).toLocaleDateString()}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Create/Edit Task Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[650px]">
            <DialogHeader>
              <DialogTitle>{editingTask ? "Edit Task" : "Create Task"}</DialogTitle>
              <DialogDescription>
                {editingTask ? "Update task details and progress." : "Add a new task to your project workflow."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Task Title</Label>
                <Input 
                  id="title" 
                  value={formData.title || ""} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Implement Login Page"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  value={formData.description || ""} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed explanation of the task..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="stage">Stage <span className="text-destructive">*</span></Label>
                  <Select 
                    value={formData.stageId} 
                    onValueChange={(v) => setFormData({ ...formData, stageId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map(stage => (
                        <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="epic">Epic <span className="text-destructive">*</span></Label>
                  <Select 
                    value={formData.epicId || ""} 
                    onValueChange={(v) => setFormData({ ...formData, epicId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select epic" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectEpics.map((epic: any) => (
                        <SelectItem key={epic.id} value={epic.id}>{epic.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="assignee">Assignee</Label>
                  <Select 
                    value={formData.assigneeId} 
                    onValueChange={(v) => setFormData({ ...formData, assigneeId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((member: any) => (
                        <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="effort">Effort</Label>
                  <Select 
                    value={formData.effort?.toString() || "5"} 
                    onValueChange={(v) => setFormData({ ...formData, effort: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select effort" />
                    </SelectTrigger>
                    <SelectContent>
                      {EFFORT_VALUES.map((value) => (
                        <SelectItem key={value} value={value.toString()}>{value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(v: any) => setFormData({ ...formData, priority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="deadline">Due Date</Label>
                  <Input 
                    id="deadline" 
                    type="date"
                    value={formData.deadline || ""} 
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="milestone">Milestone (Optional)</Label>
                  <Select 
                    value={formData.milestoneId || "none"} 
                    onValueChange={(v) => setFormData({ ...formData, milestoneId: v === "none" ? undefined : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select milestone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {milestones?.map((m: any) => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="estimate">Estimate (Hours)</Label>
                  <Input 
                    id="estimate" 
                    type="number"
                    min="0"
                    value={formData.estimateHours || 0} 
                    onChange={(e) => setFormData({ ...formData, estimateHours: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              {editingTask && (
                 <div className="flex justify-between items-center pt-2 border-t">
                    <Button 
                      variant="ghost" 
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        handleDelete(editingTask.id);
                        setIsDialogOpen(false);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Task
                    </Button>
                 </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editingTask ? "Save Changes" : "Create Task"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Shell>
  );
}

// Group types for filter buttons
type GroupByType = "status" | "epic" | "stage" | "milestone" | "assignee";

const GROUP_BY_CONFIG: Record<GroupByType, { label: string; icon: any; color: string }> = {
  status: { label: "By Status", icon: CheckCircle2, color: "bg-green-500/10 text-green-700 border-green-200 hover:bg-green-500/20" },
  epic: { label: "By Epic", icon: LayoutGrid, color: "bg-purple-500/10 text-purple-700 border-purple-200 hover:bg-purple-500/20" },
  stage: { label: "By Stage", icon: Columns, color: "bg-blue-500/10 text-blue-700 border-blue-200 hover:bg-blue-500/20" },
  milestone: { label: "By Milestone", icon: Flag, color: "bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/20" },
  assignee: { label: "By Assignee", icon: User, color: "bg-indigo-500/10 text-indigo-700 border-indigo-200 hover:bg-indigo-500/20" }
};

const STATUS_COLORS: Record<string, string> = {
  "Todo": "bg-slate-100 text-slate-700 border-slate-200",
  "In Progress": "bg-blue-100 text-blue-700 border-blue-200",
  "Review": "bg-amber-100 text-amber-700 border-amber-200",
  "Done": "bg-green-100 text-green-700 border-green-200"
};

// Embeddable Task Board Content (without Shell wrapper)
export function TaskBoardContent({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: project, isLoading: isProjectLoading } = useProject(projectId);
  const { data: allTasks, isLoading: isTasksLoading, create: createTask, update: updateTask, remove: deleteTask } = useTasks();
  const { data: milestones, isLoading: isMilestonesLoading } = useMilestones();
  const { data: users, isLoading: isUsersLoading } = useUsers();
  const { data: projectStages, isLoading: isStagesLoading } = useProjectStages();
  const { data: allEpics, isLoading: isEpicsLoading } = useEpics();
  const { data: allDeliverables, isLoading: isDeliverablesLoading } = useDeliverables();
  
  const projectDeliverables = useMemo(() => {
    if (!allDeliverables || !project) return [];
    return allDeliverables.filter((d: any) => d.projectId === project.id);
  }, [allDeliverables, project]);
  
  const projectEpics = useMemo(() => {
    if (!allEpics || !project || projectDeliverables.length === 0) return [];
    const deliverableIds = new Set(projectDeliverables.map((d: any) => d.id));
    return allEpics.filter((e: any) => deliverableIds.has(e.deliverableId));
  }, [allEpics, project, projectDeliverables]);

  const projectTasks = useMemo(() => {
    if (!project || !allTasks) return [];
    return allTasks.filter((t: any) => t.project === project.name || t.projectId === project.id);
  }, [project, allTasks]);

  const projectStageIds = useMemo(() => {
    const stageIds = new Set<string>();
    projectTasks.forEach((t: any) => { if (t.stageId) stageIds.add(t.stageId); });
    projectEpics.forEach((e: any) => {
      if (e.stageIds && Array.isArray(e.stageIds)) {
        e.stageIds.forEach((sid: string) => stageIds.add(sid));
      }
    });
    return stageIds;
  }, [projectTasks, projectEpics]);

  const stages = useMemo(() => {
    if (!projectStages || projectStages.length === 0) return [];
    return [...projectStages]
      .filter((stage: any) => projectStageIds.has(stage.id))
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
      .map((stage: any) => ({ ...stage, color: getStageColor(stage.id, stage.order) }));
  }, [projectStages, projectStageIds]);

  const projectMilestones = useMemo(() => {
    if (!milestones || !project) return [];
    return milestones.filter((m: any) => m.projectId === project.id);
  }, [milestones, project]);

  const [searchQuery, setSearchQuery] = useState("");
  const [groupBy, setGroupBy] = useState<GroupByType>("status");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [viewType, setViewType] = useState<"card" | "list">("card");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<Partial<Task>>({});

  const filteredTasks = projectTasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.description?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const groupedTasks = useMemo(() => {
    const groups: Record<string, { id: string; name: string; tasks: any[]; color?: string }> = {};
    
    if (groupBy === "status") {
      ["Todo", "In Progress", "Review", "Done"].forEach(status => {
        groups[status] = { id: status, name: status, tasks: [], color: STATUS_COLORS[status] };
      });
      filteredTasks.forEach(t => {
        const status = t.status || "Todo";
        if (groups[status]) groups[status].tasks.push(t);
      });
    } else if (groupBy === "epic") {
      groups["unassigned"] = { id: "unassigned", name: "No Epic", tasks: [] };
      projectEpics.forEach((e: any) => { groups[e.id] = { id: e.id, name: e.title, tasks: [] }; });
      filteredTasks.forEach(t => {
        const epicId = t.epicId || "unassigned";
        if (groups[epicId]) groups[epicId].tasks.push(t);
        else groups["unassigned"].tasks.push(t);
      });
    } else if (groupBy === "stage") {
      groups["unassigned"] = { id: "unassigned", name: "No Stage", tasks: [] };
      stages.forEach((s: any) => { groups[s.id] = { id: s.id, name: s.name, tasks: [], color: s.color }; });
      filteredTasks.forEach(t => {
        const stageId = t.stageId || "unassigned";
        if (groups[stageId]) groups[stageId].tasks.push(t);
        else groups["unassigned"].tasks.push(t);
      });
    } else if (groupBy === "milestone") {
      groups["unassigned"] = { id: "unassigned", name: "No Milestone", tasks: [] };
      projectMilestones.forEach((m: any) => { groups[m.id] = { id: m.id, name: m.name, tasks: [] }; });
      filteredTasks.forEach(t => {
        const milestoneId = t.milestoneId || "unassigned";
        if (groups[milestoneId]) groups[milestoneId].tasks.push(t);
        else groups["unassigned"].tasks.push(t);
      });
    } else if (groupBy === "assignee") {
      groups["unassigned"] = { id: "unassigned", name: "Unassigned", tasks: [] };
      users.forEach((u: any) => { groups[u.id] = { id: u.id, name: u.name, tasks: [] }; });
      filteredTasks.forEach(t => {
        const assigneeId = t.assigneeId || "unassigned";
        if (groups[assigneeId]) groups[assigneeId].tasks.push(t);
        else groups["unassigned"].tasks.push(t);
      });
    }
    
    return Object.values(groups).filter(g => g.tasks.length > 0 || g.id !== "unassigned");
  }, [filteredTasks, groupBy, projectEpics, stages, projectMilestones, users]);

  const handleOpenCreate = (stageId?: string, epicId?: string) => {
    if (!project) return;
    setEditingTask(null);
    setFormData({
      title: "", description: "", project: project.name, projectId: project.id,
      stageId: stageId || (stages[0]?.id || "st_plan"), epicId: epicId || (projectEpics[0]?.id || ""),
      status: "Todo", assigneeId: users[0]?.id || "", deadline: new Date().toISOString().split('T')[0],
      priority: "Medium", estimateHours: 0, effort: 5, tags: []
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({ ...task, stageId: task.stageId || stages[0]?.id || "st_plan", epicId: task.epicId || projectEpics[0]?.id || "", effort: task.effort || 5 });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.stageId || !formData.epicId) {
      toast({ title: "Validation Error", description: "Please fill in all required fields (Title, Stage, and Epic are required).", variant: "destructive" });
      return;
    }
    if (editingTask) { updateTask({ id: editingTask.id, updates: formData }); }
    else { createTask({ ...formData, project: project?.name, projectId: project?.id }); }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => { deleteTask(id); setIsDialogOpen(false); };

  const getAssignee = (id?: string) => users.find((t: any) => t.id === id);
  const getMilestone = (id?: string) => milestones.find((m: any) => m.id === id);
  const getEpic = (id?: string) => projectEpics.find((e: any) => e.id === id);

  if (isProjectLoading || isTasksLoading || isMilestonesLoading || isUsersLoading || isStagesLoading || isEpicsLoading || isDeliverablesLoading) {
    return (<div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>);
  }

  if (!project) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* 5 Large Filter Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {(Object.keys(GROUP_BY_CONFIG) as GroupByType[]).map(key => {
          const config = GROUP_BY_CONFIG[key];
          const Icon = config.icon;
          const isActive = groupBy === key;
          return (
            <Button
              key={key}
              variant="outline"
              className={cn(
                "h-16 flex flex-col items-center justify-center gap-1.5 transition-all border-2",
                isActive ? config.color : "hover:bg-muted/50"
              )}
              onClick={() => setGroupBy(key)}
              data-testid={`filter-${key}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{config.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Search and New Task */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search tasks..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-tasks"
          />
        </div>
        <Button onClick={() => handleOpenCreate()} className="gap-2" data-testid="button-new-task">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Grouped Card Views */}
      <div className="space-y-6">
        {groupedTasks.map(group => (
          <div key={group.id} className="space-y-3">
            <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border", group.color || "bg-muted/50")}>
              <h3 className="font-semibold text-sm">{group.name}</h3>
              <Badge variant="secondary" className="text-xs">{group.tasks.length}</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {group.tasks.map(task => {
                const assignee = getAssignee(task.assigneeId);
                const milestone = getMilestone(task.milestoneId);
                const epic = getEpic(task.epicId);
                const stage = stages.find((s: any) => s.id === task.stageId);
                const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG["Medium"];

                return (
                  <Card 
                    key={task.id}
                    className="cursor-pointer hover:border-primary/30 transition-all hover:shadow-md"
                    onClick={() => handleOpenEdit(task)}
                    data-testid={`task-card-${task.id}`}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm leading-tight line-clamp-2">{task.title}</h4>
                        <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0", priority.color)}>
                          {priority.label}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5">
                        {groupBy !== "status" && (
                          <Badge variant="outline" className={cn("text-[10px]", STATUS_COLORS[task.status] || "")}>
                            {task.status}
                          </Badge>
                        )}
                        {groupBy !== "stage" && stage && (
                          <Badge variant="outline" className="text-[10px]">{stage.name}</Badge>
                        )}
                        {groupBy !== "epic" && epic && (
                          <Badge variant="outline" className="text-[10px] text-purple-600">{epic.title}</Badge>
                        )}
                        {groupBy !== "milestone" && milestone && (
                          <Badge variant="outline" className="text-[10px] text-amber-600">
                            <Flag className="h-2.5 w-2.5 mr-1" />{milestone.name}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
                        {groupBy !== "assignee" ? (
                          <div className="flex items-center gap-1.5">
                            {assignee ? (
                              <>
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-[9px]">{assignee.name.substring(0,2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span className="truncate max-w-[80px]">{assignee.name.split(' ')[0]}</span>
                              </>
                            ) : (
                              <span className="italic">Unassigned</span>
                            )}
                          </div>
                        ) : (
                          <div />
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {groupedTasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No tasks found matching your search.</p>
          </div>
        )}
      </div>

      {/* Task Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "Create New Task"}</DialogTitle>
            <DialogDescription>
              {editingTask ? "Update the task details below." : "Fill out the form to create a new task."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Task Title</Label>
              <Input 
                id="title" 
                value={formData.title || ""} 
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Implement Login Page"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description" 
                value={formData.description || ""} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed explanation of the task..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="stage">Stage <span className="text-destructive">*</span></Label>
                <Select 
                  value={formData.stageId} 
                  onValueChange={(v) => setFormData({ ...formData, stageId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map(stage => (
                      <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="epic">Epic <span className="text-destructive">*</span></Label>
                <Select 
                  value={formData.epicId || ""} 
                  onValueChange={(v) => setFormData({ ...formData, epicId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select epic" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectEpics.map((epic: any) => (
                      <SelectItem key={epic.id} value={epic.id}>{epic.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="assignee">Assignee</Label>
                <Select 
                  value={formData.assigneeId} 
                  onValueChange={(v) => setFormData({ ...formData, assigneeId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((member: any) => (
                      <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="effort">Effort</Label>
                <Select 
                  value={formData.effort?.toString() || "5"} 
                  onValueChange={(v) => setFormData({ ...formData, effort: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select effort" />
                  </SelectTrigger>
                  <SelectContent>
                    {EFFORT_VALUES.map((value) => (
                      <SelectItem key={value} value={value.toString()}>{value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(v: any) => setFormData({ ...formData, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input 
                  id="deadline" 
                  type="date"
                  value={formData.deadline || ""} 
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="milestone">Milestone</Label>
                <Select 
                  value={formData.milestoneId || "none"} 
                  onValueChange={(v) => setFormData({ ...formData, milestoneId: v === "none" ? undefined : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No milestone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Milestone</SelectItem>
                    {milestones.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="estimate">Estimate (Hours)</Label>
                <Input 
                  id="estimate" 
                  type="number"
                  min="0"
                  value={formData.estimateHours || 0} 
                  onChange={(e) => setFormData({ ...formData, estimateHours: parseInt(e.target.value) })}
                />
              </div>
            </div>

            {editingTask && (
               <div className="flex justify-between items-center pt-2 border-t">
                  <Button 
                    variant="ghost" 
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      handleDelete(editingTask.id);
                      setIsDialogOpen(false);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Task
                  </Button>
               </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingTask ? "Save Changes" : "Create Task"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
