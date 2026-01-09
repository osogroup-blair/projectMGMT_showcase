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
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { TabToolbar, ViewMode } from "@/components/ui/tab-toolbar";

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
  const [selectedEpicId, setSelectedEpicId] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  // Toolbar state
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("card");

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

  // Filter stages by search query
  const filteredStages = useMemo(() => {
    if (!searchQuery.trim()) return stages;
    const query = searchQuery.toLowerCase();
    return stages.filter((stage: any) => 
      stage.name?.toLowerCase().includes(query) ||
      stage.description?.toLowerCase().includes(query)
    );
  }, [stages, searchQuery]);

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

      <TabToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search stages..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showFilter={false}
        addButtonLabel="Add Stage"
        onAddClick={() => {
          const btn = document.querySelector('[data-testid="button-create-stages"]') as HTMLButtonElement;
          if (btn) btn.click();
        }}
      />

      <div className="space-y-4 pt-4">
        {filteredStages.length === 0 && stages.length > 0 ? (
          <Card className="bg-muted/10 border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Layers className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No stages match your search</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-2">
                Try adjusting your search terms.
              </p>
            </CardContent>
          </Card>
        ) : stages.length === 0 ? (
          <Card className="bg-muted/10 border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Layers className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No stages defined</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-2">
                Stages are configured during project setup.
              </p>
            </CardContent>
          </Card>
        ) : viewMode === "list" ? (
          <div className="border rounded-lg bg-card overflow-x-auto">
            <Table style={{ minWidth: "700px" }}>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead style={{ width: "8%" }}>Order</TableHead>
                  <TableHead style={{ width: "25%" }}>Stage</TableHead>
                  <TableHead style={{ width: "15%" }}>Status</TableHead>
                  <TableHead style={{ width: "12%" }}>Tasks</TableHead>
                  <TableHead style={{ width: "25%" }}>Progress</TableHead>
                  <TableHead style={{ width: "15%" }} className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStages.map((stage: any) => {
                  const statusConfig = STAGE_STATUS_OPTIONS.find(s => s.label === stage.status);
                  const statusColorClass = statusConfig?.color || "bg-muted/50 text-muted-foreground border-muted";
                  const progress = getStageProgress(stage.id);

                  return (
                    <TableRow key={stage.id} className="hover:bg-muted/50" data-testid={`row-stage-${stage.id}`}>
                      <TableCell>
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold",
                          statusColorClass
                        )}>
                          {stage.order}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <Link href={`/projects/${projectId}/stages/${stage.id}`}>
                            <span className="font-medium hover:text-primary cursor-pointer">{stage.name}</span>
                          </Link>
                          {stage.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">{stage.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("font-normal text-xs", statusColorClass)}>
                          {stage.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {progress.total} <span className="text-muted-foreground">({progress.done} done)</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={progress.percent} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-8">{progress.percent}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/projects/${projectId}/stages/${stage.id}`}>
                            <Button variant="ghost" size="sm" className="h-7">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7"
                            onClick={() => openAddTaskDialog(stage.id)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStages.map((stage: any) => {
              const statusConfig = STAGE_STATUS_OPTIONS.find(s => s.label === stage.status);
              const statusColorClass = statusConfig?.color || "bg-muted/50 text-muted-foreground border-muted";
              const progress = getStageProgress(stage.id);

              return (
                <Card 
                  key={stage.id} 
                  className="hover:shadow-md transition-shadow group"
                  data-testid={`card-stage-${stage.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold shrink-0",
                          statusColorClass
                        )}>
                          {stage.order}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/projects/${projectId}/stages/${stage.id}`}>
                            <h4 className="font-semibold text-sm hover:text-primary truncate">
                              {stage.name}
                            </h4>
                          </Link>
                          {stage.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {stage.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <Link href={`/projects/${projectId}/stages/${stage.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{progress.done}/{progress.total} tasks</span>
                      </div>
                      <Progress value={progress.percent} className="h-1.5" />

                      <div className="flex flex-wrap gap-1.5">
                        <Badge 
                          variant="outline"
                          className={cn("text-[10px] font-normal", statusColorClass)}
                        >
                          {stage.status}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                        <div className="flex items-center gap-1">
                          <ListTodo className="h-3 w-3" />
                          <span>{progress.total} tasks</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>{progress.done} done</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
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
