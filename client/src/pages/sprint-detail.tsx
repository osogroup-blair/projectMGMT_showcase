import { useMemo, useState, useRef, useEffect } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  Zap, 
  Play, 
  Square, 
  Calendar as CalendarIcon,
  Target,
  CheckCircle2,
  Circle,
  Clock,
  User,
  Loader2,
  Plus,
  Search,
  Pencil,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useRoute } from "wouter";
import { cn } from "@/lib/utils";
import { useSprints, useTasks, useProject, useUsers, useEpics } from "@/hooks/use-nexus-data";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUS_CONFIG: Record<string, { icon: typeof Circle; color: string; bgColor: string; label: string }> = {
  "planned": { icon: Circle, color: "text-slate-500", bgColor: "bg-slate-100", label: "Planned" },
  "active": { icon: Play, color: "text-blue-500", bgColor: "bg-blue-100", label: "Active" },
  "closed": { icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-100", label: "Closed" },
};

const TASK_STATUS_CONFIG: Record<string, { icon: typeof Circle; color: string; bgColor: string }> = {
  "Pending": { icon: Circle, color: "text-slate-500", bgColor: "bg-slate-100" },
  "To Do": { icon: Circle, color: "text-slate-500", bgColor: "bg-slate-100" },
  "In Progress": { icon: Clock, color: "text-blue-500", bgColor: "bg-blue-100" },
  "Done": { icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-100" },
  "Completed": { icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-100" },
};

export default function SprintDetail() {
  const [, params] = useRoute("/projects/:projectId/sprints/:sprintId");
  const projectId = params?.projectId || "";
  const sprintId = params?.sprintId || "";
  const { toast } = useToast();

  const { data: project } = useProject(projectId);
  const { data: allSprints, update: updateSprint } = useSprints();
  const { data: allTasks, update: updateTask } = useTasks();
  const { data: users } = useUsers();
  const { data: allEpics } = useEpics();

  const sprint = useMemo(() => 
    (allSprints || []).find((s: any) => s.id === sprintId),
    [allSprints, sprintId]
  );

  const projectSprints = useMemo(() =>
    (allSprints || []).filter((s: any) => s.projectId === projectId),
    [allSprints, projectId]
  );

  const sprintTasks = useMemo(() => 
    (allTasks || []).filter((t: any) => t.sprintId === sprintId),
    [allTasks, sprintId]
  );

  const backlogTasks = useMemo(() => 
    (allTasks || []).filter((t: any) => 
      (t.projectId === projectId || t.project === projectId) && 
      !t.sprintId
    ),
    [allTasks, projectId]
  );

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editGoal, setEditGoal] = useState("");
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [showAddTasksDialog, setShowAddTasksDialog] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("tasks");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const goalInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (sprint) {
      setEditName(sprint.name || "");
      setEditGoal(sprint.goal || "");
      setEditStartDate(sprint.startDate || "");
      setEditEndDate(sprint.endDate || "");
    }
  }, [sprint]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    if (isEditingGoal && goalInputRef.current) {
      goalInputRef.current.focus();
    }
  }, [isEditingGoal]);

  const handleSaveName = () => {
    if (editName.trim() && editName !== sprint?.name) {
      updateSprint({ id: sprintId, updates: { name: editName.trim() } });
    }
    setIsEditingName(false);
  };

  const handleSaveGoal = () => {
    if (editGoal !== sprint?.goal) {
      updateSprint({ id: sprintId, updates: { goal: editGoal || null } });
    }
    setIsEditingGoal(false);
  };

  const handleSaveDates = () => {
    updateSprint({ 
      id: sprintId, 
      updates: { 
        startDate: editStartDate || null, 
        endDate: editEndDate || null 
      } 
    });
    setIsEditingDates(false);
  };

  const handleStartSprint = async () => {
    const hasActive = projectSprints.some((s: any) => s.status === "active" && s.id !== sprintId);
    if (hasActive) {
      toast({ title: "Another sprint is already active", description: "Close the active sprint first.", variant: "destructive" });
      return;
    }
    try {
      const response = await fetch(`/api/sprints/${sprintId}/start`, { method: "POST" });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error);
      }
      updateSprint({ id: sprintId, updates: { status: "active" } });
      toast({ title: "Sprint started" });
    } catch (error: any) {
      toast({ title: "Failed to start sprint", description: error.message, variant: "destructive" });
    }
  };

  const handleCloseSprint = async () => {
    try {
      const response = await fetch(`/api/sprints/${sprintId}/close`, { method: "POST" });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error);
      }
      updateSprint({ id: sprintId, updates: { status: "closed" } });
      toast({ title: "Sprint closed" });
    } catch (error: any) {
      toast({ title: "Failed to close sprint", description: error.message, variant: "destructive" });
    }
  };

  const handleAddTasks = async () => {
    if (selectedTasks.length === 0) return;
    try {
      await fetch(`/api/sprints/${sprintId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: selectedTasks })
      });
      selectedTasks.forEach(taskId => {
        updateTask({ id: taskId, updates: { sprintId } });
      });
      setSelectedTasks([]);
      setShowAddTasksDialog(false);
      toast({ title: `${selectedTasks.length} task(s) added to sprint` });
    } catch (error: any) {
      toast({ title: "Failed to add tasks", description: error.message, variant: "destructive" });
    }
  };

  const handleRemoveTask = async (taskId: string) => {
    try {
      await fetch(`/api/sprints/${sprintId}/tasks/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: [taskId] })
      });
      updateTask({ id: taskId, updates: { sprintId: null } });
      toast({ title: "Task removed from sprint" });
    } catch (error: any) {
      toast({ title: "Failed to remove task", description: error.message, variant: "destructive" });
    }
  };

  const getUser = (userId?: string) => {
    if (!userId) return null;
    return (users || []).find((u: any) => u.id === userId);
  };

  const getEpic = (epicId?: string) => {
    if (!epicId) return null;
    return (allEpics || []).find((e: any) => e.id === epicId);
  };

  const filteredBacklogTasks = useMemo(() => {
    if (!searchQuery) return backlogTasks;
    const query = searchQuery.toLowerCase();
    return backlogTasks.filter((t: any) => 
      t.title?.toLowerCase().includes(query) || 
      t.name?.toLowerCase().includes(query)
    );
  }, [backlogTasks, searchQuery]);

  const stats = useMemo(() => {
    const total = sprintTasks.length;
    const done = sprintTasks.filter((t: any) => t.status === "Done" || t.status === "Completed").length;
    const inProgress = sprintTasks.filter((t: any) => t.status === "In Progress").length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, inProgress, percent };
  }, [sprintTasks]);

  if (!sprint) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    );
  }

  const statusConfig = STATUS_CONFIG[sprint.status] || STATUS_CONFIG["planned"];
  const StatusIcon = statusConfig.icon;

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={cn("p-3 rounded-lg", statusConfig.bgColor)}>
              <Zap className={cn("h-6 w-6", statusConfig.color)} />
            </div>
            <div className="space-y-1">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    ref={nameInputRef}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName();
                      if (e.key === "Escape") setIsEditingName(false);
                    }}
                    className="h-8 text-xl font-bold w-64"
                    data-testid="input-edit-sprint-name"
                  />
                  <Button size="icon" variant="ghost" onClick={handleSaveName} data-testid="button-save-sprint-name">
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setIsEditingName(false)} data-testid="button-cancel-sprint-name">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <h1 
                  className="text-2xl font-bold tracking-tight cursor-pointer hover:text-primary group flex items-center gap-2"
                  onClick={() => setIsEditingName(true)}
                  data-testid="text-sprint-name"
                >
                  {sprint.name}
                  <Pencil className="h-4 w-4 opacity-0 group-hover:opacity-100 text-muted-foreground" />
                </h1>
              )}
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Badge variant="outline" className={cn(statusConfig.bgColor, statusConfig.color, "border-0")}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                <Link href={`/projects/${projectId}`} className="hover:text-primary">
                  {project?.name}
                </Link>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {sprint.status === "planned" && (
              <Button onClick={handleStartSprint} data-testid="button-start-sprint">
                <Play className="h-4 w-4 mr-2" />
                Start Sprint
              </Button>
            )}
            {sprint.status === "active" && (
              <Button variant="secondary" onClick={handleCloseSprint} data-testid="button-close-sprint">
                <Square className="h-4 w-4 mr-2" />
                Close Sprint
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  Sprint Goal
                  {!isEditingGoal && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingGoal(true)} data-testid="button-edit-goal">
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditingGoal ? (
                  <div className="space-y-2">
                    <Textarea
                      ref={goalInputRef}
                      value={editGoal}
                      onChange={(e) => setEditGoal(e.target.value)}
                      placeholder="What do you want to achieve in this sprint?"
                      className="min-h-[80px]"
                      data-testid="input-edit-goal"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveGoal} data-testid="button-save-goal">Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditingGoal(false)} data-testid="button-cancel-goal">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    {sprint.goal || "No goal set for this sprint."}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Sprint Backlog</CardTitle>
                  <Button size="sm" onClick={() => setShowAddTasksDialog(true)} data-testid="button-add-tasks">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Tasks
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {sprintTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-8 w-8 mx-auto mb-2" />
                    <p>No tasks in this sprint yet.</p>
                    <Button variant="link" onClick={() => setShowAddTasksDialog(true)}>
                      Add tasks from backlog
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%]">Task</TableHead>
                        <TableHead>Epic</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assignee</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sprintTasks.map((task: any) => {
                        const taskStatus = TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG["Pending"];
                        const TaskStatusIcon = taskStatus.icon;
                        const assignee = getUser(task.assigneeId || task.assignee);
                        const epic = getEpic(task.epicId);

                        return (
                          <TableRow key={task.id} data-testid={`row-task-${task.id}`}>
                            <TableCell>
                              <Link href={`/projects/${projectId}/tasks/${task.id}`} className="font-medium hover:text-primary">
                                {task.title || task.name}
                              </Link>
                            </TableCell>
                            <TableCell>
                              {epic ? (
                                <Badge variant="outline" className="font-normal">
                                  {epic.name}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn(taskStatus.bgColor, taskStatus.color, "border-0")}>
                                <TaskStatusIcon className="h-3 w-3 mr-1" />
                                {task.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {assignee ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">
                                      {assignee.name?.charAt(0) || assignee.username?.charAt(0) || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{assignee.name || assignee.username}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleRemoveTask(task.id)}
                                data-testid={`button-remove-task-${task.id}`}
                              >
                                <X className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  Dates
                  {!isEditingDates && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingDates(true)} data-testid="button-edit-dates">
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditingDates ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Start Date</Label>
                      <Input
                        type="date"
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                        data-testid="input-edit-start-date"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">End Date</Label>
                      <Input
                        type="date"
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                        data-testid="input-edit-end-date"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveDates} data-testid="button-save-dates">Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditingDates(false)} data-testid="button-cancel-dates">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start</span>
                      <span>{sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : "Not set"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End</span>
                      <span>{sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : "Not set"}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Completion</span>
                    <span className="font-medium">{stats.percent}%</span>
                  </div>
                  <Progress value={stats.percent} className="h-2" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="p-2 rounded-md bg-slate-50">
                    <div className="text-lg font-semibold">{stats.total}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="p-2 rounded-md bg-blue-50">
                    <div className="text-lg font-semibold text-blue-600">{stats.inProgress}</div>
                    <div className="text-xs text-muted-foreground">In Progress</div>
                  </div>
                  <div className="p-2 rounded-md bg-green-50">
                    <div className="text-lg font-semibold text-green-600">{stats.done}</div>
                    <div className="text-xs text-muted-foreground">Done</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showAddTasksDialog} onOpenChange={setShowAddTasksDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Tasks to Sprint</DialogTitle>
            <DialogDescription>
              Select tasks from the backlog to add to this sprint.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-backlog"
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto border rounded-md">
              {filteredBacklogTasks.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No tasks in backlog
                </div>
              ) : (
                filteredBacklogTasks.map((task: any) => (
                  <div 
                    key={task.id}
                    className="flex items-center gap-3 p-3 border-b last:border-0 hover:bg-muted/50"
                    data-testid={`checkbox-task-${task.id}`}
                  >
                    <Checkbox
                      checked={selectedTasks.includes(task.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTasks([...selectedTasks, task.id]);
                        } else {
                          setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{task.title || task.name}</div>
                      {task.epicId && (
                        <div className="text-xs text-muted-foreground">
                          Epic: {getEpic(task.epicId)?.name}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {task.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <span className="text-sm text-muted-foreground">
                {selectedTasks.length} task(s) selected
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAddTasksDialog(false)} data-testid="button-cancel-add-tasks">
                  Cancel
                </Button>
                <Button onClick={handleAddTasks} disabled={selectedTasks.length === 0} data-testid="button-confirm-add-tasks">
                  Add to Sprint
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
