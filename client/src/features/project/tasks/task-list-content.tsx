import { useState, useMemo, useRef, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Filter,
  ChevronRight,
  Clock,
  User,
  Calendar,
  Loader2,
  SlidersHorizontal,
  ListTodo,
  Zap,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useTasks, useProject, useMilestones, useUsers, useProjectStages, useEpics, useDeliverables, useSprints } from "@/hooks/use-nexus-data";
import { useToast } from "@/hooks/use-toast";
import { TaskFilterModal, TaskFilters, emptyFilters, getActiveFilterCount } from "./task-filter-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EFFORT_VALUES } from "@shared/schema";

const PRIORITY_CONFIG: Record<string, { color: string; bgColor: string }> = {
  "Low": { color: "text-slate-600", bgColor: "bg-slate-100" },
  "Medium": { color: "text-blue-600", bgColor: "bg-blue-100" },
  "High": { color: "text-orange-600", bgColor: "bg-orange-100" },
  "Critical": { color: "text-red-600", bgColor: "bg-red-100" },
};

const STATUS_CONFIG: Record<string, { color: string; bgColor: string }> = {
  "Todo": { color: "text-slate-600", bgColor: "bg-slate-100" },
  "In Progress": { color: "text-blue-600", bgColor: "bg-blue-100" },
  "Review": { color: "text-amber-600", bgColor: "bg-amber-100" },
  "Done": { color: "text-green-600", bgColor: "bg-green-100" },
};

export function TaskListContent({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const { data: project, isLoading: isProjectLoading } = useProject(projectId);
  const { data: allTasks, isLoading: isTasksLoading, createAsync: createTaskAsync, update: updateTask } = useTasks();
  const { data: milestones, isLoading: isMilestonesLoading } = useMilestones();
  const { data: users, isLoading: isUsersLoading } = useUsers();
  const { data: projectStages, isLoading: isStagesLoading } = useProjectStages();
  const { data: allEpics, isLoading: isEpicsLoading } = useEpics();
  const { data: allDeliverables, isLoading: isDeliverablesLoading } = useDeliverables();
  const { data: allSprints } = useSprints();

  const projectSprints = useMemo(() => {
    if (!allSprints || !project) return [];
    return allSprints.filter((s: any) => s.projectId === project.id);
  }, [allSprints, project]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<TaskFilters>(emptyFilters);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ taskId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing title
  useEffect(() => {
    if (editingCell?.field === "title" && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingCell]);

  const startEditingTitle = (taskId: string, currentValue: string) => {
    setEditingCell({ taskId, field: "title" });
    setEditValue(currentValue);
  };

  const saveTitle = (taskId: string) => {
    if (editValue.trim()) {
      updateTask({ id: taskId, updates: { title: editValue.trim() } });
    }
    setEditingCell(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [newTaskEffort, setNewTaskEffort] = useState<number>(3);
  const [newTaskEpicId, setNewTaskEpicId] = useState("");
  const [newTaskStageId, setNewTaskStageId] = useState("");

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

  // Get project-specific tasks
  const projectTasks = useMemo(() => {
    if (!project || !allTasks) return [];
    return allTasks.filter((t: any) => t.project === project.name || t.projectId === project.id);
  }, [project, allTasks]);

  // Extract unique stage IDs from project tasks and epics
  const projectStageIds = useMemo(() => {
    const stageIds = new Set<string>();
    projectTasks.forEach((t: any) => {
      if (t.stageId) stageIds.add(t.stageId);
    });
    projectEpics.forEach((e: any) => {
      if (e.stageIds && Array.isArray(e.stageIds)) {
        e.stageIds.forEach((sid: string) => stageIds.add(sid));
      }
    });
    return stageIds;
  }, [projectTasks, projectEpics]);

  // Map stages filtered to project
  const stages = useMemo(() => {
    if (!projectStages || projectStages.length === 0) return [];
    return [...projectStages]
      .filter((stage: any) => projectStageIds.has(stage.id))
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  }, [projectStages, projectStageIds]);

  const getAssignee = (id?: string) => (users || []).find((u: any) => u.id === id);
  const getEpic = (id?: string) => projectEpics.find((e: any) => e.id === id);
  const getStage = (id?: string) => stages.find((s: any) => s.id === id);

  // Apply search and filters
  const filteredTasks = useMemo(() => {
    return projectTasks.filter((task: any) => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch = 
          task.title?.toLowerCase().includes(q) ||
          task.description?.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.statuses.length > 0 && !filters.statuses.includes(task.status)) {
        return false;
      }

      // Priority filter
      if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) {
        return false;
      }

      // Stage filter
      if (filters.stageIds.length > 0 && !filters.stageIds.includes(task.stageId)) {
        return false;
      }

      // Epic filter
      if (filters.epicIds.length > 0 && !filters.epicIds.includes(task.epicId)) {
        return false;
      }

      // Assignee filter
      if (filters.assigneeIds.length > 0) {
        if (filters.assigneeIds.includes("unassigned")) {
          if (task.assigneeId && !filters.assigneeIds.includes(task.assigneeId)) {
            return false;
          }
        } else if (!filters.assigneeIds.includes(task.assigneeId)) {
          return false;
        }
      }

      // Sprint filter
      if (filters.sprintIds.length > 0) {
        if (filters.sprintIds.includes("backlog")) {
          if (task.sprintId && !filters.sprintIds.includes(task.sprintId)) {
            return false;
          }
        } else if (!filters.sprintIds.includes(task.sprintId)) {
          return false;
        }
      }

      // Due date range filter
      if (filters.dueDateRange) {
        const taskDate = new Date(task.deadline);
        if (filters.dueDateRange.from && taskDate < new Date(filters.dueDateRange.from)) {
          return false;
        }
        if (filters.dueDateRange.to && taskDate > new Date(filters.dueDateRange.to)) {
          return false;
        }
      }

      return true;
    });
  }, [projectTasks, searchQuery, filters]);

  const activeFilterCount = getActiveFilterCount(filters);

  const openCreateDialog = () => {
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskPriority("Medium");
    setNewTaskEffort(3);
    setNewTaskEpicId(projectEpics[0]?.id || "");
    setNewTaskStageId(stages[0]?.id || "");
    setCreateDialogOpen(true);
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      toast({ title: "Error", description: "Task title is required.", variant: "destructive" });
      return;
    }
    if (!newTaskEpicId) {
      toast({ title: "Error", description: "Epic is required.", variant: "destructive" });
      return;
    }
    if (!newTaskStageId) {
      toast({ title: "Error", description: "Stage is required.", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      await createTaskAsync({
        title: newTaskTitle,
        description: newTaskDescription || "",
        project: project?.name,
        projectId: project?.id,
        epicId: newTaskEpicId,
        stageId: newTaskStageId,
        status: "Todo",
        priority: newTaskPriority,
        effort: newTaskEffort,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tags: []
      });
      
      toast({ title: "Task created", description: "New task has been added to the project." });
      setCreateDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create task.", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleTaskClick = (taskId: string) => {
    setLocation(`/projects/${projectId}/tasks/${taskId}`);
  };

  const isLoading = isProjectLoading || isTasksLoading || isMilestonesLoading || isUsersLoading || isStagesLoading || isEpicsLoading || isDeliverablesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {/* Hidden trigger for tab-level Add button */}
      <button 
        data-testid="button-create-tasks" 
        onClick={openCreateDialog} 
        className="hidden" 
        aria-hidden="true"
      />

      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-4">
        <div className="sticky top-40 z-20 bg-background py-3 -mx-6 px-6 border-b">
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9"
                data-testid="input-search-tasks"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="gap-2"
              onClick={() => setFilterModalOpen(true)}
              data-testid="button-open-filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            <Button 
              size="sm"
              className="gap-1.5"
              onClick={openCreateDialog}
              data-testid="button-add-task"
            >
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Active Filters Summary */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 text-sm">
            {filters.statuses.map(status => (
              <Badge key={status} variant="secondary" className="gap-1">
                Status: {status}
              </Badge>
            ))}
            {filters.priorities.map(priority => (
              <Badge key={priority} variant="secondary" className="gap-1">
                Priority: {priority}
              </Badge>
            ))}
            {filters.stageIds.map(stageId => {
              const stage = getStage(stageId);
              return stage ? (
                <Badge key={stageId} variant="secondary" className="gap-1">
                  Stage: {stage.name}
                </Badge>
              ) : null;
            })}
            {filters.epicIds.map(epicId => {
              const epic = getEpic(epicId);
              return epic ? (
                <Badge key={epicId} variant="secondary" className="gap-1">
                  Epic: {epic.title}
                </Badge>
              ) : null;
            })}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs"
              onClick={() => setFilters(emptyFilters)}
              data-testid="button-clear-filters"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <Card className="bg-muted/10 border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <ListTodo className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">
              {projectTasks.length === 0 ? "No tasks yet" : "No tasks match your filters"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
              {projectTasks.length === 0 
                ? "Create your first task to get started."
                : "Try adjusting your search or filters."}
            </p>
            {projectTasks.length === 0 && (
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Task
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg bg-card overflow-x-auto">
          <Table style={{ minWidth: "900px" }}>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead style={{ width: "25%" }}>Task</TableHead>
                <TableHead style={{ width: "12%" }}>Stage</TableHead>
                <TableHead style={{ width: "12%" }}>Status</TableHead>
                <TableHead style={{ width: "15%" }}>Sprint</TableHead>
                <TableHead style={{ width: "10%" }}>Priority</TableHead>
                <TableHead style={{ width: "14%" }}>Assignee</TableHead>
                <TableHead style={{ width: "12%" }} className="text-right">Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task: any) => {
                const assignee = getAssignee(task.assigneeId);
                const epic = getEpic(task.epicId);
                const stage = getStage(task.stageId);
                const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
                const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.Todo;
                const isOverdue = new Date(task.deadline) < new Date() && task.status !== "Done";

                return (
                  <TableRow 
                    key={task.id} 
                    className="hover:bg-muted/50 transition-colors"
                    data-testid={`task-row-${task.id}`}
                  >
                    {/* Title - Inline Editable */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="space-y-1">
                        {editingCell?.taskId === task.id && editingCell?.field === "title" ? (
                          <div className="flex items-center gap-1">
                            <Input
                              ref={titleInputRef}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveTitle(task.id);
                                if (e.key === "Escape") cancelEdit();
                              }}
                              onBlur={() => saveTitle(task.id)}
                              className="h-7 text-sm"
                              data-testid={`input-title-${task.id}`}
                            />
                          </div>
                        ) : (
                          <div 
                            className="font-medium flex items-center gap-2 cursor-pointer hover:text-primary"
                            onClick={() => startEditingTitle(task.id, task.title)}
                            data-testid={`edit-title-${task.id}`}
                          >
                            {task.title}
                          </div>
                        )}
                        {epic && (
                          <div className="text-xs text-muted-foreground">
                            {epic.title}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Stage - Inline Dropdown */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select 
                        value={task.stageId || "none"} 
                        onValueChange={(v) => updateTask({ id: task.id, updates: { stageId: v === "none" ? null : v } })}
                      >
                        <SelectTrigger className="h-7 w-full border-0 bg-transparent hover:bg-muted/50 px-2" data-testid={`select-stage-${task.id}`}>
                          <SelectValue placeholder="—">
                            {stage?.name || "—"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          {stages.map((s: any) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Status - Inline Dropdown */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select 
                        value={task.status} 
                        onValueChange={(v) => updateTask({ id: task.id, updates: { status: v } })}
                      >
                        <SelectTrigger className="h-7 w-full border-0 bg-transparent hover:bg-muted/50 px-2" data-testid={`select-status-${task.id}`}>
                          <Badge 
                            variant="secondary" 
                            className={cn("font-normal text-xs", statusConfig.bgColor, statusConfig.color)}
                          >
                            {task.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {["Todo", "In Progress", "Review", "Done"].map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Sprint - Inline Dropdown (already working) */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select 
                        value={task.sprintId || "backlog"} 
                        onValueChange={(v) => updateTask({ id: task.id, updates: { sprintId: v === "backlog" ? null : v } })}
                      >
                        <SelectTrigger className="h-7 w-full border-0 bg-transparent hover:bg-muted/50 px-2" data-testid={`select-sprint-${task.id}`}>
                          <SelectValue placeholder="Backlog" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="backlog">Backlog</SelectItem>
                          {projectSprints.map((s: any) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Priority - Inline Dropdown */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select 
                        value={task.priority} 
                        onValueChange={(v) => updateTask({ id: task.id, updates: { priority: v } })}
                      >
                        <SelectTrigger className="h-7 w-full border-0 bg-transparent hover:bg-muted/50 px-1" data-testid={`select-priority-${task.id}`}>
                          <span className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-full",
                            priorityConfig.bgColor,
                            priorityConfig.color
                          )}>
                            {task.priority}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {["Low", "Medium", "High", "Critical"].map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Assignee - Inline Dropdown */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select 
                        value={task.assigneeId || "unassigned"} 
                        onValueChange={(v) => updateTask({ id: task.id, updates: { assigneeId: v === "unassigned" ? null : v } })}
                      >
                        <SelectTrigger className="h-7 w-full border-0 bg-transparent hover:bg-muted/50 px-2" data-testid={`select-assignee-${task.id}`}>
                          {assignee ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[8px]">
                                  {assignee.name?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs truncate max-w-[60px]">
                                {assignee.name?.split(' ')[0]}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {(users || []).map((u: any) => (
                            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Due Date - Inline Input */}
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Input
                        type="date"
                        value={task.deadline ? task.deadline.split('T')[0] : ''}
                        onChange={(e) => updateTask({ id: task.id, updates: { deadline: e.target.value } })}
                        className={cn(
                          "h-7 w-full border-0 bg-transparent hover:bg-muted/50 text-right text-xs px-1",
                          isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"
                        )}
                        data-testid={`input-deadline-${task.id}`}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Filter Modal */}
      <TaskFilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        filters={filters}
        onFiltersChange={setFilters}
        stages={stages.map((s: any) => ({ id: s.id, name: s.name }))}
        epics={projectEpics.map((e: any) => ({ id: e.id, title: e.title }))}
        users={(users || []).map((u: any) => ({ id: u.id, name: u.name }))}
        sprints={projectSprints.map((s: any) => ({ id: s.id, name: s.name }))}
      />

      {/* Create Task Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to your project.
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
                data-testid="input-create-task-title"
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
                data-testid="input-create-task-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-epic">Epic *</Label>
                <Select value={newTaskEpicId} onValueChange={setNewTaskEpicId}>
                  <SelectTrigger data-testid="select-create-task-epic">
                    <SelectValue placeholder="Select an epic" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectEpics.map((epic: any) => (
                      <SelectItem key={epic.id} value={epic.id}>{epic.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-stage">Stage *</Label>
                <Select value={newTaskStageId} onValueChange={setNewTaskStageId}>
                  <SelectTrigger data-testid="select-create-task-stage">
                    <SelectValue placeholder="Select a stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage: any) => (
                      <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-priority">Priority</Label>
                <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                  <SelectTrigger data-testid="select-create-task-priority">
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
                <Label htmlFor="task-effort">Effort</Label>
                <Select 
                  value={newTaskEffort.toString()} 
                  onValueChange={(v) => setNewTaskEffort(Number(v))}
                >
                  <SelectTrigger data-testid="select-create-task-effort">
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
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} data-testid="button-cancel-create-task">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTask} 
              disabled={isCreating}
              data-testid="button-submit-create-task"
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
