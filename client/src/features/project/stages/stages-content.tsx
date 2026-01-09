import { useMemo, useState } from "react";
import { 
  Layers,
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Circle,
  ChevronRight,
  ListTodo,
  ArrowRight,
  ExternalLink,
  Plus,
  Loader2,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useTasks, useUsers, useEpics, useDeliverables, useProjectStages } from "@/hooks/use-nexus-data";
import { STAGE_STATUS_OPTIONS } from "@/lib/mock-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const PRIORITY_CONFIG: Record<string, string> = {
  "Low": "bg-slate-50 text-slate-700 border-slate-200",
  "Medium": "bg-blue-50 text-blue-700 border-blue-200",
  "High": "bg-orange-50 text-orange-700 border-orange-200",
  "Critical": "bg-red-50 text-red-700 border-red-200",
};

const EFFORT_VALUES = [1, 2, 3, 5, 8, 13, 21];

export function StagesContent({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const { data: allTasks, isLoading: isTasksLoading, createAsync: createTaskAsync } = useTasks();
  const { data: users, isLoading: isUsersLoading } = useUsers();
  const { data: allEpics, isLoading: isEpicsLoading } = useEpics();
  const { data: allDeliverables, isLoading: isDeliverablesLoading } = useDeliverables();
  const { data: allProjectStages, isLoading: isStagesLoading } = useProjectStages();

  // Get stages for this project, sorted by order
  const stages = useMemo(() => {
    if (!allProjectStages) return [];
    return [...allProjectStages]
      .filter((s: any) => s.projectId === projectId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [allProjectStages, projectId]);

  // Add Task Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStageId, setDialogStageId] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<"search" | "create">("create");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEpicId, setSelectedEpicId] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [newTaskEffort, setNewTaskEffort] = useState<number | null>(3);

  const projectDeliverables = useMemo(() => 
    (allDeliverables || []).filter((d: any) => d.projectId === projectId),
    [allDeliverables, projectId]
  );

  const projectDeliverableIds = useMemo(() => 
    projectDeliverables.map((d: any) => d.id),
    [projectDeliverables]
  );

  const projectEpics = useMemo(() => 
    (allEpics || []).filter((e: any) => projectDeliverableIds.includes(e.deliverableId)),
    [allEpics, projectDeliverableIds]
  );

  const getTasksForStage = (stageId: string) => {
    if (!allTasks) return [];
    return allTasks.filter((t: any) => t.stageId === stageId && t.projectId === projectId);
  };

  const getStageProgress = (stageId: string) => {
    const tasks = getTasksForStage(stageId);
    if (tasks.length === 0) return { done: 0, total: 0, percent: 0 };
    const done = tasks.filter((t: any) => t.status === "Done").length;
    return { done, total: tasks.length, percent: Math.round((done / tasks.length) * 100) };
  };

  const getEpic = (epicId?: string) => {
    if (!epicId) return null;
    return (allEpics || []).find((e: any) => e.id === epicId);
  };

  const getAssignee = (assigneeId?: string) => {
    if (!assigneeId) return null;
    return (users || []).find((u: any) => u.id === assigneeId);
  };

  const openAddTaskDialog = (stageId: string) => {
    setDialogStageId(stageId);
    setDialogMode("create");
    setSearchQuery("");
    setSelectedEpicId("");
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskPriority("Medium");
    setNewTaskEffort(3);
    setDialogOpen(true);
  };

  const handleCreateTask = async () => {
    if (!dialogStageId) return;
    
    if (!newTaskTitle.trim()) {
      toast({ title: "Error", description: "Task title is required.", variant: "destructive" });
      return;
    }
    if (!selectedEpicId) {
      toast({ title: "Error", description: "Epic is required.", variant: "destructive" });
      return;
    }
    if (!newTaskEffort) {
      toast({ title: "Error", description: "Effort is required.", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      await createTaskAsync({
        title: newTaskTitle,
        description: newTaskDescription || "",
        project: projectId,
        projectId: projectId,
        epicId: selectedEpicId,
        stageId: dialogStageId,
        status: "Todo",
        priority: newTaskPriority,
        effort: newTaskEffort,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tags: []
      });
      
      toast({ title: "Task created", description: "New task has been created and added to the stage." });
      setDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create task.", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const isLoading = isTasksLoading || isUsersLoading || isEpicsLoading || isDeliverablesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {/* Hidden trigger for tab-level Add button (stages are created at project setup) */}
      <button 
        data-testid="button-create-stages" 
        className="hidden" 
        aria-hidden="true"
      />

      <div className="space-y-4 pt-4">
        <Accordion type="multiple" defaultValue={stages.map((s: any) => s.id)} className="space-y-4">
          {stages.map((stage: any) => {
            const statusConfig = STAGE_STATUS_OPTIONS.find(s => s.label === stage.status);
            const statusColorClass = statusConfig?.color || "bg-muted/50 text-muted-foreground border-muted";
            const progress = getStageProgress(stage.id);
            const stageTasks = getTasksForStage(stage.id);

            return (
              <AccordionItem 
                key={stage.id} 
                value={stage.id} 
                className="border rounded-lg bg-card px-4 relative" 
                data-testid={`accordion-stage-${stage.id}`}
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-start gap-4 text-left w-full">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold mt-1",
                      statusColorClass
                    )}>
                      {stage.order}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{stage.name}</h3>
                        <Badge variant="outline" className={cn("font-normal", statusColorClass)}>
                          {stage.status}
                        </Badge>
                      </div>
                      {stage.description && (
                        <p className="text-sm text-muted-foreground">{stage.description}</p>
                      )}
                      <div className="flex items-center gap-6 pt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <ListTodo className="h-3.5 w-3.5" />
                          <span>{progress.total} Tasks</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{progress.done} Completed</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Progress value={progress.percent} className="h-1.5 w-16" />
                          <span>{progress.percent}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>

                <div className="absolute right-12 top-4">
                  <Link href={`/projects/${projectId}/stages/${stage.id}`}>
                    <Button variant="outline" size="sm" className="gap-2" data-testid={`open-workspace-${stage.id}`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                      Overview
                    </Button>
                  </Link>
                </div>

                <AccordionContent className="pt-0 pb-4 pl-14">
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Tasks ({stageTasks.length})
                      </span>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-2 h-7"
                        onClick={() => openAddTaskDialog(stage.id)}
                        data-testid={`button-add-task-${stage.id}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Task
                      </Button>
                    </div>
                    {stageTasks.length > 0 ? (
                      <div className="grid gap-3">
                        {stageTasks.map((task: any) => {
                          const epic = getEpic(task.epicId);
                          const assignee = getAssignee(task.assigneeId);
                          const priorityClass = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
                          
                          return (
                            <Link key={task.id} href={`/projects/${projectId}/tasks/${task.id}`}>
                              <div 
                                className="group flex items-center justify-between p-3 rounded-md border bg-background hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
                                data-testid={`stage-task-${task.id}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-1.5 bg-primary/10 text-primary rounded">
                                    <ListTodo className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium group-hover:text-primary transition-colors">{task.title}</h4>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      {epic && <span>{epic.title}</span>}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <Badge variant="outline" className={cn("font-normal text-xs", priorityClass)}>
                                    {task.priority}
                                  </Badge>
                                  <Badge 
                                    variant="secondary" 
                                    className={cn(
                                      "font-normal text-xs",
                                      task.status === "Done" ? "bg-green-100 text-green-700" :
                                      task.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                                      task.status === "Review" ? "bg-amber-100 text-amber-700" :
                                      "bg-slate-100 text-slate-700"
                                    )}
                                  >
                                    {task.status}
                                  </Badge>
                                  {assignee && (
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-[9px]">
                                        {assignee.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                  <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-6 border border-dashed rounded-md text-center bg-muted/20">
                        <ListTodo className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No tasks in this stage yet.
                        </p>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* Add Task Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Create a new task in this stage. Tasks must be assigned to an epic.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title *</Label>
              <Input
                id="task-title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter task title"
                data-testid="input-new-task-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="Enter task description"
                className="min-h-[80px]"
                data-testid="input-new-task-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-epic">Epic *</Label>
              <Select value={selectedEpicId} onValueChange={setSelectedEpicId}>
                <SelectTrigger data-testid="select-task-epic">
                  <SelectValue placeholder="Select an epic" />
                </SelectTrigger>
                <SelectContent>
                  {projectEpics.map((epic: any) => (
                    <SelectItem key={epic.id} value={epic.id}>{epic.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-priority">Priority</Label>
                <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                  <SelectTrigger data-testid="select-task-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-effort">Effort *</Label>
                <Select 
                  value={newTaskEffort?.toString() || ""} 
                  onValueChange={(v) => setNewTaskEffort(Number(v))}
                >
                  <SelectTrigger data-testid="select-task-effort">
                    <SelectValue placeholder="Select effort" />
                  </SelectTrigger>
                  <SelectContent>
                    {EFFORT_VALUES.map((val) => (
                      <SelectItem key={val} value={val.toString()}>{val} pts</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-task">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTask} 
              disabled={isCreating}
              data-testid="button-create-task"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Task"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
