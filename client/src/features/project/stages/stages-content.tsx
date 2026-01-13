import { useMemo, useState, Fragment } from "react";
import { 
  Layers,
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Circle,
  ChevronRight,
  ChevronDown,
  ListTodo,
  ArrowRight,
  ExternalLink,
  Plus,
  Loader2,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar as CalendarIcon,
  Pencil,
  Check,
  X,
  Trash2
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useTasks, useUsers, useEpics, useDeliverables, useProjectStages, useProject, useSprints, useMilestones, useResolvedTaskTypes } from "@/hooks/use-nexus-data";
import { useCompletedStatuses } from "@/hooks/use-completed-statuses";
import { STAGE_STATUS_OPTIONS } from "@/lib/mock-data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { TabToolbar, ViewMode } from "@/components/ui/tab-toolbar";
import { useTaskStatuses } from "@/hooks/use-task-statuses";
import { format, parseISO } from "date-fns";

const PRIORITY_CONFIG: Record<string, string> = {
  "Low": "bg-slate-50 text-slate-700 border-slate-200",
  "Medium": "bg-blue-50 text-blue-700 border-blue-200",
  "High": "bg-orange-50 text-orange-700 border-orange-200",
  "Critical": "bg-red-50 text-red-700 border-red-200",
};

const EFFORT_VALUES = [1, 2, 3, 5, 8, 13, 21];

type SortField = "order" | "name" | "status" | "tasks" | "progress" | "startDate" | "endDate";
type SortDirection = "asc" | "desc";

export function StagesContent({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const { data: project, isLoading: isProjectLoading } = useProject(projectId);
  const { data: allSprints, isLoading: isSprintsLoading } = useSprints();
  const { data: allMilestones, isLoading: isMilestonesLoading } = useMilestones();
  const { data: resolvedTaskTypes = [], isLoading: isTaskTypesLoading } = useResolvedTaskTypes(projectId);
  const { data: allTasks, isLoading: isTasksLoading, createAsync: createTaskAsync, update: updateTask } = useTasks();
  const { data: users, isLoading: isUsersLoading } = useUsers();
  const { data: allEpics, isLoading: isEpicsLoading } = useEpics();
  const { data: allDeliverables, isLoading: isDeliverablesLoading } = useDeliverables();
  const { data: allProjectStages, isLoading: isStagesLoading, update: updateStage, createAsync: createStageAsync, removeAsync: removeStageAsync } = useProjectStages();
  const { statusLabels, getStatusBgColor, getStatusTextColor, getStatusAccentColor } = useTaskStatuses();
  const { isTaskComplete } = useCompletedStatuses();

  const projectSprints = useMemo(() => 
    (allSprints || []).filter((s: any) => s.projectId === projectId),
    [allSprints, projectId]
  );

  const projectMilestones = useMemo(() => 
    (allMilestones || []).filter((m: any) => m.projectId === projectId),
    [allMilestones, projectId]
  );

  const getMilestone = (milestoneId?: string) => {
    if (!milestoneId) return null;
    return (allMilestones || []).find((m: any) => m.id === milestoneId);
  };

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
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  // Add Stage Dialog state
  const [addStageDialogOpen, setAddStageDialogOpen] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [newStageType, setNewStageType] = useState("development");
  const [newStageStatus, setNewStageStatus] = useState("pending");
  const [newStageStartDate, setNewStageStartDate] = useState<Date | undefined>(undefined);
  const [newStageEndDate, setNewStageEndDate] = useState<Date | undefined>(undefined);
  const [isCreatingStage, setIsCreatingStage] = useState(false);

  // Toolbar state - default to list view
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("order");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Expanded rows state
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Inline date editing state
  const [editingCell, setEditingCell] = useState<{ id: string; field: "startDate" | "endDate" } | null>(null);
  const [editValue, setEditValue] = useState("");

  // Task inline editing state
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editingTaskField, setEditingTaskField] = useState<"title" | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState("");

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [newTaskEffort, setNewTaskEffort] = useState<number | null>(3);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stageToDelete, setStageToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk selection state
  const [selectedStageIds, setSelectedStageIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

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
    const done = tasks.filter((t: any) => isTaskComplete(t.status)).length;
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

  const toggleExpanded = (stageId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(stageId)) {
        next.delete(stageId);
      } else {
        next.add(stageId);
      }
      return next;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const handleStartEdit = (stageId: string, field: "startDate" | "endDate", currentValue: string | null) => {
    setEditingCell({ id: stageId, field });
    setEditValue(currentValue || "");
  };

  const handleSaveEdit = async () => {
    if (!editingCell) return;
    
    try {
      await updateStage({ 
        id: editingCell.id, 
        updates: { [editingCell.field]: editValue || null } 
      });
      toast({ title: "Date updated" });
    } catch (error: any) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    }
    setEditingCell(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  // Task inline editing handlers
  const handleTaskTitleEdit = (taskId: string, currentTitle: string) => {
    setEditingTask(taskId);
    setEditingTaskField("title");
    setEditingTaskTitle(currentTitle);
  };

  const handleTaskTitleSave = async (taskId: string) => {
    if (!editingTaskTitle.trim()) {
      toast({ title: "Error", description: "Task title is required.", variant: "destructive" });
      return;
    }
    try {
      await updateTask({ id: taskId, updates: { title: editingTaskTitle.trim() } });
      toast({ title: "Task updated" });
    } catch (error: any) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    }
    setEditingTask(null);
    setEditingTaskField(null);
    setEditingTaskTitle("");
  };

  const handleTaskTitleCancel = () => {
    setEditingTask(null);
    setEditingTaskField(null);
    setEditingTaskTitle("");
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await updateTask({ id: taskId, updates: { status: newStatus } });
      toast({ title: "Status updated" });
    } catch (error: any) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    }
  };

  const handleTaskAssigneeChange = async (taskId: string, assigneeId: string | null) => {
    try {
      await updateTask({ id: taskId, updates: { assigneeId: assigneeId || null } });
      toast({ title: "Assignee updated" });
    } catch (error: any) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    }
  };

  const handleTaskSprintChange = async (taskId: string, sprintId: string | null) => {
    try {
      await updateTask({ id: taskId, updates: { sprintId: sprintId || null } });
      toast({ title: "Sprint updated" });
    } catch (error: any) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    }
  };

  const handleTaskMilestoneChange = async (taskId: string, milestoneId: string | null) => {
    try {
      await updateTask({ id: taskId, updates: { milestoneId: milestoneId || null } });
      toast({ title: "Milestone updated" });
    } catch (error: any) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    }
  };

  const handleTaskDeadlineChange = async (taskId: string, date: Date | undefined) => {
    try {
      const deadline = date ? format(date, "yyyy-MM-dd") : null;
      await updateTask({ id: taskId, updates: { deadline } });
      toast({ title: "Due date updated" });
    } catch (error: any) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    }
  };

  const openAddTaskDialog = (stageId: string) => {
    setDialogStageId(stageId);
    setDialogMode("create");
    setSearchQuery("");
    setSelectedEpicId("");
    setSelectedMilestoneId("");
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskPriority("Medium");
    setNewTaskEffort(3);
    setDialogOpen(true);
  };

  // Delete stage handlers
  const openDeleteDialog = (stage: { id: string; name: string }) => {
    setStageToDelete(stage);
    setDeleteDialogOpen(true);
  };

  const handleDeleteStage = async () => {
    if (!stageToDelete) return;
    
    setIsDeleting(true);
    try {
      await removeStageAsync(stageToDelete.id);
      toast({ title: "Stage deleted", description: `"${stageToDelete.name}" has been removed.` });
      setDeleteDialogOpen(false);
      setStageToDelete(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete stage.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk selection handlers
  const toggleStageSelection = (stageId: string) => {
    setSelectedStageIds(prev => {
      const next = new Set(prev);
      if (next.has(stageId)) {
        next.delete(stageId);
      } else {
        next.add(stageId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedStageIds.size === filteredAndSortedStages.length) {
      setSelectedStageIds(new Set());
    } else {
      setSelectedStageIds(new Set(filteredAndSortedStages.map((s: any) => s.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStageIds.size === 0) return;
    
    setIsBulkDeleting(true);
    try {
      const deletePromises = Array.from(selectedStageIds).map(id => removeStageAsync(id));
      await Promise.all(deletePromises);
      toast({ title: "Stages deleted", description: `${selectedStageIds.size} stage(s) have been removed.` });
      setSelectedStageIds(new Set());
      setBulkDeleteDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete some stages.", variant: "destructive" });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const clearSelection = () => {
    setSelectedStageIds(new Set());
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

    // Get the first available task type for this project
    const taskTypeId = resolvedTaskTypes.length > 0 ? resolvedTaskTypes[0].id : null;

    setIsCreating(true);
    try {
      await createTaskAsync({
        title: newTaskTitle,
        description: newTaskDescription || "",
        project: project?.name || "Project",
        projectId: projectId,
        epicId: selectedEpicId,
        stageId: dialogStageId,
        milestoneId: selectedMilestoneId || null,
        taskTypeId,
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

  const handleCreateStage = async () => {
    if (!newStageName.trim()) {
      toast({ title: "Error", description: "Stage name is required.", variant: "destructive" });
      return;
    }

    setIsCreatingStage(true);
    try {
      const nextOrder = stages.length > 0 ? Math.max(...stages.map((s: any) => s.order || 0)) + 1 : 1;
      
      await createStageAsync({
        projectId,
        name: newStageName.trim(),
        type: newStageType,
        status: newStageStatus,
        order: nextOrder,
        startDate: newStageStartDate ? format(newStageStartDate, "yyyy-MM-dd") : null,
        endDate: newStageEndDate ? format(newStageEndDate, "yyyy-MM-dd") : null,
      });
      
      toast({ title: "Stage created", description: `${newStageName} has been added.` });
      setAddStageDialogOpen(false);
      setNewStageName("");
      setNewStageType("development");
      setNewStageStatus("pending");
      setNewStageStartDate(undefined);
      setNewStageEndDate(undefined);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create stage.", variant: "destructive" });
    } finally {
      setIsCreatingStage(false);
    }
  };

  const isLoading = isTasksLoading || isUsersLoading || isEpicsLoading || isDeliverablesLoading || isProjectLoading || isSprintsLoading || isMilestonesLoading || isTaskTypesLoading;

  // Filter and sort stages
  const filteredAndSortedStages = useMemo(() => {
    let result = stages;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((stage: any) => 
        stage.name?.toLowerCase().includes(query) ||
        stage.description?.toLowerCase().includes(query)
      );
    }

    // Sort
    result = [...result].sort((a: any, b: any) => {
      let aVal: any, bVal: any;
      
      switch (sortField) {
        case "order":
          aVal = a.order || 0;
          bVal = b.order || 0;
          break;
        case "name":
          aVal = a.name?.toLowerCase() || "";
          bVal = b.name?.toLowerCase() || "";
          break;
        case "status":
          aVal = a.status?.toLowerCase() || "";
          bVal = b.status?.toLowerCase() || "";
          break;
        case "tasks":
          aVal = getStageProgress(a.id).total;
          bVal = getStageProgress(b.id).total;
          break;
        case "progress":
          aVal = getStageProgress(a.id).percent;
          bVal = getStageProgress(b.id).percent;
          break;
        case "startDate":
          aVal = a.startDate ? new Date(a.startDate).getTime() : 0;
          bVal = b.startDate ? new Date(b.startDate).getTime() : 0;
          break;
        case "endDate":
          aVal = a.endDate ? new Date(a.endDate).getTime() : 0;
          bVal = b.endDate ? new Date(b.endDate).getTime() : 0;
          break;
        default:
          aVal = a.order || 0;
          bVal = b.order || 0;
      }

      if (typeof aVal === "string") {
        return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [stages, searchQuery, sortField, sortDirection]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return format(parseISO(dateStr), "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-10 bg-background pb-2">
        <TabToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search stages..."
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showFilter={false}
          addButtonLabel="Add Stage"
          onAddClick={() => setAddStageDialogOpen(true)}
        />
      </div>

      {/* Add Stage Dialog */}
      <Dialog open={addStageDialogOpen} onOpenChange={setAddStageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Stage</DialogTitle>
            <DialogDescription>
              Create a new stage for this project's workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="stage-name">Name *</Label>
              <Input
                id="stage-name"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="e.g., Design Review"
                data-testid="input-stage-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newStageType} onValueChange={setNewStageType}>
                  <SelectTrigger data-testid="select-stage-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discovery">Discovery</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="testing">Testing</SelectItem>
                    <SelectItem value="deployment">Deployment</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStageStatus} onValueChange={setNewStageStatus}>
                  <SelectTrigger data-testid="select-stage-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.id} value={opt.label}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newStageStartDate ? format(newStageStartDate, "MMM d, yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newStageStartDate}
                      onSelect={setNewStageStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newStageEndDate ? format(newStageEndDate, "MMM d, yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newStageEndDate}
                      onSelect={setNewStageEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateStage} disabled={isCreatingStage || !newStageName.trim()}>
              {isCreatingStage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Stage"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Stage Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stage</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{stageToDelete?.name}"? This action cannot be undone.
              Tasks in this stage will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStage}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedStageIds.size} Stage{selectedStageIds.size !== 1 ? 's' : ''}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedStageIds.size} selected stage{selectedStageIds.size !== 1 ? 's' : ''}? 
              This action cannot be undone. Tasks in these stages will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete All"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Actions Toolbar */}
      {selectedStageIds.size > 0 && (
        <div className="sticky top-12 z-20 bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {selectedStageIds.size} stage{selectedStageIds.size !== 1 ? 's' : ''} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={clearSelection}
            >
              Clear selection
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setBulkDeleteDialogOpen(true)}
              data-testid="button-bulk-delete"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4 pt-2">
        {filteredAndSortedStages.length === 0 && stages.length > 0 ? (
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
            <Table style={{ minWidth: "900px" }}>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead style={{ width: "3%" }}>
                    <Checkbox
                      checked={filteredAndSortedStages.length > 0 && selectedStageIds.size === filteredAndSortedStages.length}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all stages"
                      data-testid="checkbox-select-all-stages"
                    />
                  </TableHead>
                  <TableHead style={{ width: "3%" }}></TableHead>
                  <TableHead style={{ width: "5%" }}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-1 -ml-1 font-medium"
                      onClick={() => handleSort("order")}
                    >
                      Order
                      {getSortIcon("order")}
                    </Button>
                  </TableHead>
                  <TableHead style={{ width: "18%" }}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-1 -ml-1 font-medium"
                      onClick={() => handleSort("name")}
                    >
                      Stage
                      {getSortIcon("name")}
                    </Button>
                  </TableHead>
                  <TableHead style={{ width: "10%" }}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-1 -ml-1 font-medium"
                      onClick={() => handleSort("status")}
                    >
                      Status
                      {getSortIcon("status")}
                    </Button>
                  </TableHead>
                  <TableHead style={{ width: "12%" }}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-1 -ml-1 font-medium"
                      onClick={() => handleSort("startDate")}
                    >
                      Start Date
                      {getSortIcon("startDate")}
                    </Button>
                  </TableHead>
                  <TableHead style={{ width: "12%" }}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-1 -ml-1 font-medium"
                      onClick={() => handleSort("endDate")}
                    >
                      End Date
                      {getSortIcon("endDate")}
                    </Button>
                  </TableHead>
                  <TableHead style={{ width: "8%" }}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-1 -ml-1 font-medium"
                      onClick={() => handleSort("tasks")}
                    >
                      Tasks
                      {getSortIcon("tasks")}
                    </Button>
                  </TableHead>
                  <TableHead style={{ width: "18%" }}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-1 -ml-1 font-medium"
                      onClick={() => handleSort("progress")}
                    >
                      Progress
                      {getSortIcon("progress")}
                    </Button>
                  </TableHead>
                  <TableHead style={{ width: "10%" }} className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedStages.map((stage: any) => {
                  const statusConfig = STAGE_STATUS_OPTIONS.find(s => s.label === stage.status);
                  const statusColorClass = statusConfig?.color || "bg-muted/50 text-muted-foreground border-muted";
                  const progress = getStageProgress(stage.id);
                  const isExpanded = expandedRows.has(stage.id);
                  const stageTasks = getTasksForStage(stage.id);

                  return (
                    <Fragment key={stage.id}>
                      <TableRow 
                        className={cn("hover:bg-muted/50", isExpanded && "bg-muted/30", selectedStageIds.has(stage.id) && "bg-primary/5")} 
                        data-testid={`row-stage-${stage.id}`}
                      >
                        <TableCell className="py-2">
                          <Checkbox
                            checked={selectedStageIds.has(stage.id)}
                            onCheckedChange={() => toggleStageSelection(stage.id)}
                            aria-label={`Select ${stage.name}`}
                            data-testid={`checkbox-stage-${stage.id}`}
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => toggleExpanded(stage.id)}
                            data-testid={`button-expand-stage-${stage.id}`}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
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
                        <TableCell>
                          {editingCell?.id === stage.id && editingCell?.field === "startDate" ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="date"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="h-7 w-[120px] text-xs"
                                autoFocus
                              />
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSaveEdit}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancelEdit}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="flex items-center gap-1 group cursor-pointer text-sm"
                              onClick={() => handleStartEdit(stage.id, "startDate", stage.startDate)}
                            >
                              <span>{formatDate(stage.startDate)}</span>
                              <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingCell?.id === stage.id && editingCell?.field === "endDate" ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="date"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="h-7 w-[120px] text-xs"
                                autoFocus
                              />
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSaveEdit}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancelEdit}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="flex items-center gap-1 group cursor-pointer text-sm"
                              onClick={() => handleStartEdit(stage.id, "endDate", stage.endDate)}
                            >
                              <span>{formatDate(stage.endDate)}</span>
                              <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                            </div>
                          )}
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
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => openDeleteDialog({ id: stage.id, name: stage.name })}
                              data-testid={`button-delete-stage-${stage.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && stageTasks.length > 0 && (
                        <TableRow className="bg-muted/10 hover:bg-muted/10">
                          <TableCell colSpan={10} className="p-0">
                            <div className="pl-12 pr-4 py-2">
                              <Table>
                                <TableHeader>
                                  <TableRow className="hover:bg-transparent">
                                    <TableHead className="h-8 text-xs" style={{ width: "24%" }}>Task</TableHead>
                                    <TableHead className="h-8 text-xs" style={{ width: "10%" }}>Status</TableHead>
                                    <TableHead className="h-8 text-xs" style={{ width: "12%" }}>Epic</TableHead>
                                    <TableHead className="h-8 text-xs" style={{ width: "12%" }}>Milestone</TableHead>
                                    <TableHead className="h-8 text-xs" style={{ width: "12%" }}>Sprint</TableHead>
                                    <TableHead className="h-8 text-xs" style={{ width: "12%" }}>Assignee</TableHead>
                                    <TableHead className="h-8 text-xs" style={{ width: "12%" }}>Due Date</TableHead>
                                    <TableHead className="h-8 text-xs text-right" style={{ width: "6%" }}>Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {stageTasks.map((task: any) => {
                                    const epic = getEpic(task.epicId);
                                    const assignee = getAssignee(task.assigneeId);
                                    const isEditingThisTask = editingTask === task.id;
                                    return (
                                      <TableRow key={task.id} className="hover:bg-muted/30" data-testid={`row-task-${task.id}`}>
                                        <TableCell className="py-1.5">
                                          {isEditingThisTask && editingTaskField === "title" ? (
                                            <div className="flex items-center gap-1">
                                              <Input
                                                value={editingTaskTitle}
                                                onChange={(e) => setEditingTaskTitle(e.target.value)}
                                                className="h-6 text-xs"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter") handleTaskTitleSave(task.id);
                                                  if (e.key === "Escape") handleTaskTitleCancel();
                                                }}
                                              />
                                              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleTaskTitleSave(task.id)}>
                                                <Check className="h-3 w-3" />
                                              </Button>
                                              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleTaskTitleCancel}>
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <div 
                                              className="flex items-center gap-1 group cursor-pointer"
                                              onClick={() => handleTaskTitleEdit(task.id, task.title)}
                                            >
                                              <div 
                                                className="w-2 h-2 rounded-full shrink-0"
                                                style={{ backgroundColor: getStatusAccentColor(task.status) }}
                                              />
                                              <span className="text-sm hover:text-primary">{task.title}</span>
                                              <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 ml-1" />
                                            </div>
                                          )}
                                        </TableCell>
                                        <TableCell className="py-1.5">
                                          <Select 
                                            value={task.status} 
                                            onValueChange={(v) => handleTaskStatusChange(task.id, v)}
                                          >
                                            <SelectTrigger className={cn("h-6 text-[10px] border px-2 w-auto rounded-full", getStatusBgColor(task.status), getStatusTextColor(task.status))}>
                                              <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {statusLabels.map((status) => (
                                                <SelectItem key={status} value={status}>
                                                  <span className={cn("px-2 py-0.5 rounded-full text-[10px]", getStatusBgColor(status), getStatusTextColor(status))}>
                                                    {status}
                                                  </span>
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </TableCell>
                                        <TableCell className="py-1.5 text-xs">
                                          {epic ? (
                                            <Link href={`/projects/${projectId}/epics/${epic.id}`} className="text-muted-foreground hover:text-primary">
                                              {epic.title}
                                            </Link>
                                          ) : "—"}
                                        </TableCell>
                                        <TableCell className="py-1.5">
                                          <SearchableSelect
                                            value={task.milestoneId || ""}
                                            onValueChange={(v) => handleTaskMilestoneChange(task.id, v || null)}
                                            className="h-6 text-xs w-[110px]"
                                            placeholder="No milestone"
                                            options={[
                                              { value: "", label: "No milestone" },
                                              ...projectMilestones.map((m: any) => ({ value: m.id, label: m.name }))
                                            ]}
                                          />
                                        </TableCell>
                                        <TableCell className="py-1.5">
                                          <SearchableSelect
                                            value={task.sprintId || ""}
                                            onValueChange={(v) => handleTaskSprintChange(task.id, v || null)}
                                            className="h-6 text-xs w-[110px]"
                                            placeholder="No sprint"
                                            options={[
                                              { value: "", label: "No sprint" },
                                              ...projectSprints.map((s: any) => ({ value: s.id, label: s.name }))
                                            ]}
                                          />
                                        </TableCell>
                                        <TableCell className="py-1.5">
                                          <SearchableSelect
                                            value={task.assigneeId || ""}
                                            onValueChange={(v) => handleTaskAssigneeChange(task.id, v || null)}
                                            className="h-6 text-xs w-[110px]"
                                            placeholder="Assign"
                                            options={(users || []).map((u: any) => ({ value: u.id, label: u.name || u.email }))}
                                          />
                                        </TableCell>
                                        <TableCell className="py-1.5">
                                          <Popover>
                                            <PopoverTrigger asChild>
                                              <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-6 px-2 text-xs justify-start font-normal"
                                              >
                                                <CalendarIcon className="h-3 w-3 mr-1 text-muted-foreground" />
                                                {task.deadline ? format(parseISO(task.deadline), "MMM d") : "Set date"}
                                              </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                              <div className="p-2">
                                                <Calendar
                                                  mode="single"
                                                  selected={task.deadline ? parseISO(task.deadline) : undefined}
                                                  onSelect={(date) => handleTaskDeadlineChange(task.id, date)}
                                                  initialFocus
                                                />
                                                {task.deadline && (
                                                  <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="w-full mt-2 text-xs text-muted-foreground"
                                                    onClick={() => handleTaskDeadlineChange(task.id, undefined)}
                                                  >
                                                    <X className="h-3 w-3 mr-1" /> Clear date
                                                  </Button>
                                                )}
                                              </div>
                                            </PopoverContent>
                                          </Popover>
                                        </TableCell>
                                        <TableCell className="py-1.5 text-right">
                                          <Link href={`/projects/${projectId}/tasks/${task.id}`}>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                              <ExternalLink className="h-3.5 w-3.5" />
                                            </Button>
                                          </Link>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                      {isExpanded && stageTasks.length === 0 && (
                        <TableRow className="bg-muted/10 hover:bg-muted/10">
                          <TableCell colSpan={10} className="py-4 text-center text-sm text-muted-foreground">
                            No tasks in this stage.
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="ml-1 h-auto p-0"
                              onClick={() => openAddTaskDialog(stage.id)}
                            >
                              Add one
                            </Button>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedStages.map((stage: any) => {
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
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <Link href={`/projects/${projectId}/stages/${stage.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => openDeleteDialog({ id: stage.id, name: stage.name })}
                          data-testid={`card-button-delete-stage-${stage.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-epic">Epic *</Label>
                <SearchableSelect 
                  value={selectedEpicId} 
                  onValueChange={setSelectedEpicId}
                  data-testid="select-task-epic"
                  placeholder="Select an epic"
                  options={projectEpics.map((epic: any) => ({ value: epic.id, label: epic.title }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-milestone">Milestone</Label>
                <SearchableSelect 
                  value={selectedMilestoneId} 
                  onValueChange={setSelectedMilestoneId}
                  data-testid="select-task-milestone"
                  placeholder="Select a milestone"
                  options={[
                    { value: "", label: "No milestone" },
                    ...projectMilestones.map((m: any) => ({ value: m.id, label: m.name }))
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-priority">Priority</Label>
                <SearchableSelect 
                  value={newTaskPriority} 
                  onValueChange={setNewTaskPriority}
                  data-testid="select-task-priority"
                  placeholder="Select priority"
                  options={[
                    { value: "Low", label: "Low" },
                    { value: "Medium", label: "Medium" },
                    { value: "High", label: "High" },
                    { value: "Critical", label: "Critical" }
                  ]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-effort">Effort *</Label>
                <SearchableSelect 
                  value={newTaskEffort?.toString() || ""} 
                  onValueChange={(v) => setNewTaskEffort(Number(v))}
                  data-testid="select-task-effort"
                  placeholder="Select effort"
                  options={EFFORT_VALUES.map((val) => ({ value: val.toString(), label: `${val} pts` }))}
                />
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
