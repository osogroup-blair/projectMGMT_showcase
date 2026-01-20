import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  ArrowLeft, 
  Plus, 
  Check,
  Package,
  Layers,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Pencil,
  X,
  Trash2,
  Search,
  ChevronsUpDown,
  ListTodo,
  User,
  ExternalLink,
  ArrowUpDown,
  LayoutGrid,
  List,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
  Flag,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRoute, Link } from "wouter";
import { STAGE_TEMPLATES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useDeliverables, useEpics, useUsers, useTasks, useProject, useStatusOptions, useSprints, useMilestones, useProjectStages, useResolvedTaskTypes, useDeliverableTypes } from "@/hooks/use-nexus-data";
import { useTaskStatuses, useDeliverableStatuses, useEpicStatuses } from "@/hooks/use-task-statuses";
import { useCompletedStatuses } from "@/hooks/use-completed-statuses";
import { Textarea } from "@/components/ui/textarea";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";

const STATUS_CONFIG: Record<string, { icon: typeof Circle; color: string; bgColor: string; label: string }> = {
  "Not Started": { icon: Circle, color: "text-slate-500", bgColor: "bg-slate-100", label: "Not Started" },
  "In Progress": { icon: Clock, color: "text-blue-500", bgColor: "bg-blue-100", label: "In Progress" },
  "Completed": { icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-100", label: "Completed" },
  "Blocked": { icon: AlertCircle, color: "text-red-500", bgColor: "bg-red-100", label: "Blocked" },
  "Todo": { icon: Circle, color: "text-slate-500", bgColor: "bg-slate-100", label: "Todo" },
  "Done": { icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-100", label: "Done" },
  "Review": { icon: Clock, color: "text-amber-500", bgColor: "bg-amber-100", label: "Review" },
};

const PRIORITY_CONFIG: Record<string, string> = {
  "Low": "bg-slate-50 text-slate-700 border-slate-200",
  "Medium": "bg-blue-50 text-blue-700 border-blue-200",
  "High": "bg-orange-50 text-orange-700 border-orange-200",
  "Critical": "bg-red-50 text-red-700 border-red-200",
};

const EFFORT_VALUES = [1, 2, 3, 5, 8, 13, 21];

export function DeliverablesContent({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: project } = useProject(projectId);
  const { data: allDeliverables, isLoading: isDeliverablesLoading, createAsync: createDeliverableAsync, isCreating: isCreatingDeliverable, update: updateDeliverable, updateAsync: updateDeliverableAsync, remove: deleteDeliverable, isRemoving: isDeletingDeliverable } = useDeliverables();
  const { data: allEpics, isLoading: isEpicsLoading, create: createEpic, isCreating: isCreatingEpic, remove: deleteEpic } = useEpics();
  const { data: users, isLoading: isUsersLoading } = useUsers();
  const { data: allTasks, isLoading: isTasksLoading, update: updateTask, createAsync: createTaskAsync } = useTasks();
  const { data: statusOptions = [] } = useStatusOptions();
  const { data: allSprints = [], isLoading: isSprintsLoading } = useSprints();
  const { data: allMilestones = [], isLoading: isMilestonesLoading } = useMilestones();
  const { data: allProjectStages = [] } = useProjectStages();
  const { data: resolvedTaskTypes = [] } = useResolvedTaskTypes(projectId);
  const { data: deliverableTypes = [] } = useDeliverableTypes();
  const { statuses: taskStatuses, statusLabels, getStatusBgColor, getStatusTextColor, getStatusAccentColor, defaultStatus } = useTaskStatuses();
  const { statusLabels: deliverableStatusLabels, getStatusBgColor: getDeliverableStatusBgColor, getStatusTextColor: getDeliverableStatusTextColor, defaultStatus: defaultDeliverableStatus } = useDeliverableStatuses();
  const { statusLabels: epicStatusLabels, getStatusBgColor: getEpicStatusBgColor, getStatusTextColor: getEpicStatusTextColor } = useEpicStatuses();
  const { updateAsync: updateEpicAsync } = useEpics();
  const { isTaskComplete } = useCompletedStatuses();

  const projectSprints = useMemo(() => 
    (allSprints || []).filter((s: any) => s.projectId === projectId),
    [allSprints, projectId]
  );

  const projectMilestones = useMemo(() => 
    (allMilestones || []).filter((m: any) => m.projectId === projectId),
    [allMilestones, projectId]
  );

  const projectStages = useMemo(() => 
    (allProjectStages || []).filter((s: any) => s.projectId === projectId),
    [allProjectStages, projectId]
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [editingDeliverableId, setEditingDeliverableId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskField, setEditingTaskField] = useState<string | null>(null);
  const [editTaskValue, setEditTaskValue] = useState<string>("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deliverableToDelete, setDeliverableToDelete] = useState<{ id: string; title: string } | null>(null);
  
  const [deleteEpicDialogOpen, setDeleteEpicDialogOpen] = useState(false);
  const [epicToDelete, setEpicToDelete] = useState<{ id: string; title: string } | null>(null);

  const [expandedDeliverables, setExpandedDeliverables] = useState<Set<string>>(new Set());
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
  const [isExpanding, setIsExpanding] = useState(false);

  const [isCreateEpicOpen, setIsCreateEpicOpen] = useState(false);
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<string>("");
  const [newEpicData, setNewEpicData] = useState({
    title: "",
    description: "",
    stageIds: [] as string[]
  });

  type SortField = "title" | "status" | "dueDate" | "owner" | "epics" | "progress";
  type SortDirection = "asc" | "desc";
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [creatingTaskForEpic, setCreatingTaskForEpic] = useState<string | null>(null);

  const deliverables = useMemo(() => 
    (allDeliverables || []).filter((d: any) => d.projectId === projectId),
    [allDeliverables, projectId]
  );
  
  const filteredDeliverables = useMemo(() => {
    if (!searchQuery.trim()) return deliverables;
    const query = searchQuery.toLowerCase();
    return deliverables.filter((d: any) => 
      d.title?.toLowerCase().includes(query) ||
      d.description?.toLowerCase().includes(query)
    );
  }, [deliverables, searchQuery]);

  const sortedDeliverables = useMemo(() => {
    const sorted = [...filteredDeliverables];
    sorted.sort((a: any, b: any) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case "title":
          aVal = a.title?.toLowerCase() || "";
          bVal = b.title?.toLowerCase() || "";
          break;
        case "status":
          aVal = a.status || "";
          bVal = b.status || "";
          break;
        case "dueDate":
          aVal = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          bVal = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          break;
        case "owner":
          const ownerA = users?.find((u: any) => u.id === a.ownerId);
          const ownerB = users?.find((u: any) => u.id === b.ownerId);
          aVal = ownerA?.name?.toLowerCase() || "";
          bVal = ownerB?.name?.toLowerCase() || "";
          break;
        case "epics":
          aVal = getEpicsForDeliverable(a.id).length;
          bVal = getEpicsForDeliverable(b.id).length;
          break;
        case "progress":
          aVal = getDeliverableProgress(a.id);
          bVal = getDeliverableProgress(b.id);
          break;
        default:
          aVal = "";
          bVal = "";
      }
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredDeliverables, sortField, sortDirection, users]);

  const getEpicsForDeliverable = (deliverableId: string) => 
    (allEpics || []).filter((e: any) => e.deliverableId === deliverableId);
  
  const getOwner = (ownerId: string) => users?.find((t: any) => t.id === ownerId);

  const getTasksForEpic = (epicId: string) => {
    if (!allTasks) return [];
    return allTasks.filter((t: any) => t.epicId === epicId);
  };

  const getEpicProgress = (epicId: string) => {
    const epicTasks = getTasksForEpic(epicId);
    if (epicTasks.length === 0) return 0;
    const doneTasks = epicTasks.filter((t: any) => isTaskComplete(t.status)).length;
    return Math.round((doneTasks / epicTasks.length) * 100);
  };

  const getEpicTaskCounts = (epicId: string) => {
    const epicTasks = getTasksForEpic(epicId);
    const doneTasks = epicTasks.filter((t: any) => isTaskComplete(t.status)).length;
    return { done: doneTasks, total: epicTasks.length };
  };

  const getDeliverableProgress = (deliverableId: string) => {
    const taskCounts = getDeliverableTaskCounts(deliverableId);
    if (taskCounts.total === 0) return 0;
    return Math.round((taskCounts.done / taskCounts.total) * 100);
  };

  const getDeliverableTaskCounts = (deliverableId: string) => {
    const epics = getEpicsForDeliverable(deliverableId);
    let done = 0;
    let total = 0;
    epics.forEach((epic: any) => {
      const counts = getEpicTaskCounts(epic.id);
      done += counts.done;
      total += counts.total;
    });
    return { done, total };
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortableHeader = ({ field, children, width }: { field: SortField; children: React.ReactNode; width: string }) => (
    <TableHead 
      style={{ width }} 
      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(field)}
      data-testid={`sort-header-${field}`}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortDirection === "asc" ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </div>
    </TableHead>
  );

  const handleExpandAll = useCallback(() => {
    setIsExpanding(true);
    // Use requestAnimationFrame to allow the loader to render before heavy DOM work
    requestAnimationFrame(() => {
      setTimeout(() => {
        setExpandedDeliverables(new Set(filteredDeliverables.map((d: any) => d.id)));
        const allEpicIds = new Set<string>();
        filteredDeliverables.forEach((d: any) => {
          getEpicsForDeliverable(d.id).forEach((e: any) => allEpicIds.add(e.id));
        });
        setExpandedEpics(allEpicIds);
        setIsExpanding(false);
      }, 50);
    });
  }, [filteredDeliverables, getEpicsForDeliverable]);

  const handleCollapseAll = () => {
    setExpandedDeliverables(new Set());
    setExpandedEpics(new Set());
  };

  const toggleDeliverableExpanded = (deliverableId: string) => {
    setExpandedDeliverables(prev => {
      const next = new Set(prev);
      if (next.has(deliverableId)) {
        next.delete(deliverableId);
      } else {
        next.add(deliverableId);
      }
      return next;
    });
  };

  const toggleEpicExpanded = (epicId: string) => {
    setExpandedEpics(prev => {
      const next = new Set(prev);
      if (next.has(epicId)) {
        next.delete(epicId);
      } else {
        next.add(epicId);
      }
      return next;
    });
  };

  const handleOpenCreateEpic = (deliverableId: string) => {
    setSelectedDeliverableId(deliverableId);
    setNewEpicData({ title: "", description: "", stageIds: [] });
    setIsCreateEpicOpen(true);
  };

  const toggleStageSelection = (stageId: string) => {
    setNewEpicData(prev => ({
      ...prev,
      stageIds: prev.stageIds.includes(stageId)
        ? prev.stageIds.filter(id => id !== stageId)
        : [...prev.stageIds, stageId]
    }));
  };

  const handleCreateEpic = () => {
    if (!newEpicData.title || !selectedDeliverableId) {
      toast({ title: "Validation Error", description: "Please provide an epic title.", variant: "destructive" });
      return;
    }
    
    createEpic({
      title: newEpicData.title,
      description: newEpicData.description,
      deliverableId: selectedDeliverableId,
      stageIds: newEpicData.stageIds,
      status: "Not Started",
      progress: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    
    toast({ title: "Epic Created", description: `${newEpicData.title} has been created.` });
    setIsCreateEpicOpen(false);
  };

  const handleCreateDeliverable = async () => {
    try {
      const newDeliverable = await createDeliverableAsync({
        projectId: projectId,
        title: "New Deliverable",
        description: "",
        status: "Not Started",
        startDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        ownerId: users?.[0]?.id || undefined
      });

      if (newDeliverable?.id) {
        toast({ title: "Deliverable Created", description: "New deliverable has been added." });
        setEditingDeliverableId(newDeliverable.id);
        setEditingField("title");
        setEditValue("New Deliverable");
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create deliverable.", variant: "destructive" });
    }
  };

  const openDeleteDialog = (id: string, title: string) => {
    setDeliverableToDelete({ id, title });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deliverableToDelete) {
      deleteDeliverable(deliverableToDelete.id);
      toast({ title: "Deleted", description: `${deliverableToDelete.title} has been deleted.` });
    }
    setDeleteDialogOpen(false);
    setDeliverableToDelete(null);
  };

  const openDeleteEpicDialog = (id: string, title: string) => {
    setEpicToDelete({ id, title });
    setDeleteEpicDialogOpen(true);
  };

  const confirmDeleteEpic = () => {
    if (epicToDelete) {
      deleteEpic(epicToDelete.id);
      toast({ title: "Deleted", description: `Epic "${epicToDelete.title}" has been deleted.` });
    }
    setDeleteEpicDialogOpen(false);
    setEpicToDelete(null);
  };

  const startEditing = (deliverableId: string, field: string, currentValue: string) => {
    setEditingDeliverableId(deliverableId);
    setEditingField(field);
    setEditValue(currentValue || "");
  };

  const cancelEditing = () => {
    setEditingDeliverableId(null);
    setEditingField(null);
    setEditValue("");
  };

  const saveEdit = async (deliverableId: string, field: string) => {
    const deliverable = deliverables.find((d: any) => d.id === deliverableId);
    if (!deliverable) return;

    const updates: Record<string, any> = {};
    if (field === "title" && editValue.trim()) {
      updates.title = editValue.trim();
    } else if (field === "description") {
      updates.description = editValue;
    }

    if (Object.keys(updates).length > 0) {
      try {
        await updateDeliverableAsync({ id: deliverableId, updates });
      } catch (error) {
        toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
      }
    }
    cancelEditing();
  };

  const handleDateChange = async (deliverableId: string, field: "startDate" | "dueDate", date: Date | undefined) => {
    if (!date) return;
    const dateStr = format(date, "yyyy-MM-dd");
    try {
      await updateDeliverableAsync({ id: deliverableId, updates: { [field]: dateStr } });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update date.", variant: "destructive" });
    }
  };

  const handleOwnerChange = async (deliverableId: string, newOwnerId: string) => {
    try {
      await updateDeliverableAsync({ id: deliverableId, updates: { ownerId: newOwnerId } });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update owner.", variant: "destructive" });
    }
    cancelEditing();
  };

  const handleStatusChange = async (deliverableId: string, newStatus: string) => {
    try {
      await updateDeliverableAsync({ id: deliverableId, updates: { status: newStatus } });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    }
  };

  const startEditingTask = (taskId: string, field: string, currentValue: string) => {
    setEditingTaskId(taskId);
    setEditingTaskField(field);
    setEditTaskValue(currentValue || "");
  };

  const cancelEditingTask = () => {
    setEditingTaskId(null);
    setEditingTaskField(null);
    setEditTaskValue("");
  };

  const saveTaskEdit = (taskId: string, field: string) => {
    const updates: Record<string, any> = {};
    if (field === "title" && editTaskValue.trim()) {
      updates.title = editTaskValue.trim();
    } else if (field === "description") {
      updates.description = editTaskValue;
    }

    if (Object.keys(updates).length > 0) {
      updateTask({ id: taskId, updates });
    }
    cancelEditingTask();
  };

  const handleTaskStatusChange = (taskId: string, newStatus: string) => {
    updateTask({ id: taskId, updates: { status: newStatus } });
  };

  const handleTaskPriorityChange = (taskId: string, newPriority: string) => {
    updateTask({ id: taskId, updates: { priority: newPriority } });
  };

  const handleTaskEffortChange = (taskId: string, newEffort: number) => {
    updateTask({ id: taskId, updates: { effort: newEffort } });
  };

  const handleTaskAssigneeChange = (taskId: string, newAssigneeId: string) => {
    updateTask({ id: taskId, updates: { assigneeId: newAssigneeId } });
  };

  const handleTaskDeadlineChange = async (taskId: string, date: Date | undefined) => {
    if (!date) return;
    const dateStr = format(date, "yyyy-MM-dd");
    updateTask({ id: taskId, updates: { deadline: dateStr } });
    
    const task = allTasks?.find((t: any) => t.id === taskId);
    if (task?.epicId) {
      await autoAdjustEpicDates(task.epicId, dateStr);
    }
  };

  const handleTaskSprintChange = (taskId: string, sprintId: string) => {
    updateTask({ id: taskId, updates: { sprintId: sprintId === "none" ? null : sprintId } });
  };

  const handleTaskMilestoneChange = (taskId: string, milestoneId: string) => {
    updateTask({ id: taskId, updates: { milestoneId: milestoneId === "none" ? null : milestoneId } });
  };

  const handleEpicDateChange = async (epicId: string, field: "startDate" | "endDate", date: Date | undefined) => {
    if (!date) return;
    const dateStr = format(date, "yyyy-MM-dd");
    try {
      await updateEpicAsync({ id: epicId, updates: { [field]: dateStr } });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update epic date.", variant: "destructive" });
    }
  };

  const handleEpicStatusChange = async (epicId: string, newStatus: string) => {
    try {
      await updateEpicAsync({ id: epicId, updates: { status: newStatus } });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update epic status.", variant: "destructive" });
    }
  };

  const autoAdjustEpicDates = async (epicId: string, taskDeadline: string) => {
    const epic = allEpics?.find((e: any) => e.id === epicId);
    if (!epic) return;

    const taskDate = new Date(taskDeadline);
    const epicEndDate = epic.endDate ? new Date(epic.endDate) : null;
    const epicStartDate = epic.startDate ? new Date(epic.startDate) : null;

    let needsUpdate = false;
    const updates: Record<string, string> = {};

    if (epicEndDate && taskDate > epicEndDate) {
      updates.endDate = format(taskDate, "yyyy-MM-dd");
      needsUpdate = true;
    }

    if (epicStartDate && taskDate < epicStartDate) {
      updates.startDate = format(taskDate, "yyyy-MM-dd");
      needsUpdate = true;
    }

    if (needsUpdate) {
      try {
        await updateEpicAsync({ id: epicId, updates });
        toast({ 
          title: "Epic Dates Adjusted", 
          description: "Epic dates were automatically updated to accommodate the task deadline." 
        });
      } catch (error) {
        console.error("Failed to auto-adjust epic dates:", error);
      }
    }
  };

  const handleCreateTask = async (epicId: string) => {
    if (!newTaskTitle.trim()) {
      toast({ title: "Error", description: "Task title is required.", variant: "destructive" });
      return;
    }
    
    const epic = allEpics?.find((e: any) => e.id === epicId);
    if (!epic) {
      toast({ title: "Error", description: "Epic not found.", variant: "destructive" });
      return;
    }
    
    // Get the first stage from the epic's stageIds, or fallback to project stages
    const stageId = epic.stageIds?.[0] || projectStages?.[0]?.id;
    if (!stageId) {
      toast({ title: "Error", description: "No stage available for this task.", variant: "destructive" });
      return;
    }
    
    // Get default task type from resolved types (default or first available)
    const defaultTaskType = resolvedTaskTypes.find((t: any) => t.isDefault) || resolvedTaskTypes[0];
    if (!defaultTaskType?.id) {
      toast({ title: "Error", description: "No task type available for this project.", variant: "destructive" });
      return;
    }
    
    try {
      await createTaskAsync({
        title: newTaskTitle.trim(),
        description: "",
        project: project?.name || "",
        projectId: projectId,
        epicId: epicId,
        deliverableId: epic?.deliverableId,
        stageId: stageId,
        taskTypeId: defaultTaskType.id,
        status: defaultStatus,
        priority: "Medium",
        effort: 3,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tags: []
      });
      
      setNewTaskTitle("");
      setCreatingTaskForEpic(null);
      toast({ title: "Task Created", description: "New task has been added to the epic." });
    } catch (error: any) {
      console.error("Failed to create task:", error);
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to create task.", 
        variant: "destructive" 
      });
    }
  };

  useEffect(() => {
    if (editingField === "title") {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (editingField === "description") {
      textareaRef.current?.focus();
    }
  }, [editingField]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not set";
    try {
      return format(parseISO(dateStr), "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  if (isDeliverablesLoading || isEpicsLoading || isUsersLoading || isTasksLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <button 
        data-testid="button-create-deliverables" 
        onClick={handleCreateDeliverable} 
        className="hidden" 
        aria-hidden="true"
      />

      <div className="py-3 border-b">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search deliverables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
              data-testid="input-search-deliverables"
            />
          </div>
          
          <div className="flex items-center gap-1 border rounded-md">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs"
              onClick={handleExpandAll}
              disabled={isExpanding}
              data-testid="button-expand-all"
            >
              {isExpanding ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <ChevronsUpDown className="h-3.5 w-3.5 mr-1" />
              )}
              {isExpanding ? "Expanding..." : "Expand All"}
            </Button>
            <div className="w-px h-4 bg-border" />
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs"
              onClick={handleCollapseAll}
              data-testid="button-collapse-all"
            >
              Collapse All
            </Button>
          </div>

          <Button 
            size="sm"
            className="gap-1.5"
            onClick={handleCreateDeliverable}
            loading={isCreatingDeliverable}
            data-testid="button-add-deliverable"
          >
            <Plus className="h-4 w-4" />
            Add Deliverable
          </Button>
          
          <div className="flex items-center rounded-md bg-muted p-0.5 ml-auto">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded text-sm transition-colors",
                viewMode === "list" 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid="button-view-list"
            >
              <List className="h-4 w-4" />
              List
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded text-sm transition-colors",
                viewMode === "card" 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid="button-view-card"
            >
              <LayoutGrid className="h-4 w-4" />
              Cards
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        {filteredDeliverables.length === 0 && deliverables.length > 0 ? (
          <Card className="bg-muted/10 border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No deliverables match your search</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-2">
                Try adjusting your search terms.
              </p>
            </CardContent>
          </Card>
        ) : deliverables.length === 0 ? (
          <Card className="bg-muted/10 border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No deliverables defined</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
                Start by defining the major outcomes for this project.
              </p>
              <Button onClick={handleCreateDeliverable} loading={isCreatingDeliverable} data-testid="button-create-first-deliverable">Create First Deliverable</Button>
            </CardContent>
          </Card>
        ) : viewMode === "card" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedDeliverables.map((deliverable: any) => {
              const epics = getEpicsForDeliverable(deliverable.id);
              const owner = getOwner(deliverable.ownerId);
              const progress = getDeliverableProgress(deliverable.id);
              const taskCounts = getDeliverableTaskCounts(deliverable.id);

              return (
                <Card 
                  key={deliverable.id} 
                  className="hover:shadow-md transition-shadow group"
                  data-testid={`deliverable-card-${deliverable.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={cn(
                          "p-2 rounded-lg shrink-0",
                          deliverableStatusLabels.length > 0 
                            ? cn(getDeliverableStatusBgColor(deliverable.status), getDeliverableStatusTextColor(deliverable.status))
                            : deliverable.status === "Completed" ? "bg-green-100 text-green-700" :
                              deliverable.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                              "bg-slate-100 text-slate-700"
                        )}>
                          <Package className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/projects/${projectId}/deliverables/${deliverable.id}`}>
                            <h4 className="font-semibold text-sm hover:text-primary truncate">
                              {deliverable.title}
                            </h4>
                          </Link>
                          {deliverable.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {deliverable.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{taskCounts.done}/{taskCounts.total} tasks</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />

                      <div className="flex flex-wrap gap-1.5">
                        <Badge 
                          variant="secondary"
                          className={cn(
                            "text-[10px]",
                            deliverableStatusLabels.length > 0 
                              ? cn(getDeliverableStatusBgColor(deliverable.status), getDeliverableStatusTextColor(deliverable.status))
                              : deliverable.status === "Completed" ? "bg-green-100 text-green-700" :
                                deliverable.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                                "bg-slate-100 text-slate-700"
                          )}
                        >
                          {deliverable.status}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {epics.length} epic{epics.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                        <div className="flex items-center gap-1.5">
                          {owner ? (
                            <>
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[8px]">
                                  {owner.name?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate max-w-[80px]">{owner.name?.split(' ')[0]}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">No owner</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {deliverable.dueDate 
                            ? new Date(deliverable.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                            : '-'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="border rounded-lg bg-card overflow-x-auto">
            <Table style={{ minWidth: "900px" }}>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead style={{ width: "3%" }}></TableHead>
                  <SortableHeader field="title" width="18%">Deliverable</SortableHeader>
                  <TableHead style={{ width: "10%" }}>Type</TableHead>
                  <SortableHeader field="status" width="10%">Status</SortableHeader>
                  <TableHead style={{ width: "10%" }}>Start Date</TableHead>
                  <SortableHeader field="dueDate" width="10%">Due Date</SortableHeader>
                  <SortableHeader field="owner" width="10%">Owner</SortableHeader>
                  <SortableHeader field="epics" width="6%">Epics</SortableHeader>
                  <SortableHeader field="progress" width="13%">Progress</SortableHeader>
                  <TableHead style={{ width: "10%" }} className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDeliverables.map((deliverable: any) => {
                  const status = STATUS_CONFIG[deliverable.status] || STATUS_CONFIG["Not Started"];
                  const StatusIcon = status.icon;
                  const owner = getOwner(deliverable.ownerId);
                  const progress = getDeliverableProgress(deliverable.id);
                  const taskCounts = getDeliverableTaskCounts(deliverable.id);
                  const isExpanded = expandedDeliverables.has(deliverable.id);
                  const epics = getEpicsForDeliverable(deliverable.id);

                  return (
                    <React.Fragment key={deliverable.id}>
                      <TableRow 
                        className={cn("hover:bg-muted/50", isExpanded && "bg-muted/30")} 
                        data-testid={`row-deliverable-${deliverable.id}`}
                      >
                        <TableCell className="p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => toggleDeliverableExpanded(deliverable.id)}
                            data-testid={`expand-deliverable-${deliverable.id}`}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          {editingDeliverableId === deliverable.id && editingField === "title" ? (
                            <div className="flex items-center gap-1">
                              <Input
                                ref={inputRef}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEdit(deliverable.id, "title");
                                  if (e.key === "Escape") cancelEditing();
                                }}
                                className="h-7 text-sm"
                                data-testid={`input-deliverable-title-${deliverable.id}`}
                              />
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => saveEdit(deliverable.id, "title")}>
                                <Check className="h-3 w-3 text-green-600" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEditing}>
                                <X className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "p-1.5 rounded shrink-0",
                                deliverableStatusLabels.length > 0 
                                  ? cn(getDeliverableStatusBgColor(deliverable.status), getDeliverableStatusTextColor(deliverable.status))
                                  : deliverable.status === "Completed" ? "bg-green-100 text-green-700" :
                                    deliverable.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                                    "bg-slate-100 text-slate-700"
                              )}>
                                <Package className="h-3.5 w-3.5" />
                              </div>
                              <div 
                                className="flex items-center gap-1 cursor-pointer hover:text-primary group"
                                onClick={() => startEditing(deliverable.id, "title", deliverable.title)}
                                data-testid={`editable-title-${deliverable.id}`}
                              >
                                <span className="font-medium text-sm">{deliverable.title}</span>
                                <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <SearchableSelect
                            options={[
                              { value: "", label: "No type" },
                              ...deliverableTypes.map((t: any) => ({ value: t.id, label: t.name }))
                            ]}
                            value={deliverable.typeId || ""}
                            onValueChange={(value) => {
                              updateDeliverableAsync({ 
                                id: deliverable.id, 
                                updates: { typeId: value || null } 
                              });
                            }}
                            placeholder="Select type..."
                            className="h-7 text-xs w-full min-w-[100px]"
                            data-testid={`select-type-${deliverable.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={deliverable.status} 
                            onValueChange={(v) => handleStatusChange(deliverable.id, v)}
                          >
                            <SelectTrigger className="h-7 text-xs border-none shadow-none px-2 w-auto">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-[10px] cursor-pointer",
                                  deliverableStatusLabels.length > 0 
                                    ? cn(getDeliverableStatusBgColor(deliverable.status), getDeliverableStatusTextColor(deliverable.status))
                                    : deliverable.status === "Completed" ? "bg-green-50 text-green-700 border-green-200" :
                                      deliverable.status === "In Progress" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                      "bg-slate-50 text-slate-700 border-slate-200"
                                )}
                              >
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status.label}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {deliverableStatusLabels.length > 0 ? (
                                deliverableStatusLabels.map((status) => (
                                  <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))
                              ) : (
                                <>
                                  <SelectItem value="Not Started">Not Started</SelectItem>
                                  <SelectItem value="In Progress">In Progress</SelectItem>
                                  <SelectItem value="Completed">Completed</SelectItem>
                                  <SelectItem value="Blocked">Blocked</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <Popover>
                            <PopoverTrigger asChild>
                              <div 
                                className="flex items-center gap-1.5 cursor-pointer hover:text-primary group"
                                data-testid={`editable-start-date-${deliverable.id}`}
                              >
                                <CalendarIcon className="h-3.5 w-3.5" />
                                {deliverable.startDate ? (
                                  new Date(deliverable.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                ) : (
                                  <span className="italic">Not set</span>
                                )}
                                <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={deliverable.startDate ? new Date(deliverable.startDate) : undefined}
                                onSelect={(date) => handleDateChange(deliverable.id, "startDate", date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <Popover>
                            <PopoverTrigger asChild>
                              <div 
                                className="flex items-center gap-1.5 cursor-pointer hover:text-primary group"
                                data-testid={`editable-due-date-${deliverable.id}`}
                              >
                                <CalendarIcon className="h-3.5 w-3.5" />
                                {deliverable.dueDate ? (
                                  new Date(deliverable.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                ) : (
                                  <span className="italic">Not set</span>
                                )}
                                <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={deliverable.dueDate ? new Date(deliverable.dueDate) : undefined}
                                onSelect={(date) => handleDateChange(deliverable.id, "dueDate", date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell>
                          <SearchableSelect
                            value={deliverable.ownerId || ""}
                            onValueChange={(v) => handleOwnerChange(deliverable.id, v)}
                            className="h-7 text-xs w-[120px]"
                            placeholder="Assign..."
                            options={(users || []).map((u: any) => ({ value: u.id, label: u.name || u.email }))}
                            data-testid={`select-owner-${deliverable.id}`}
                          />
                        </TableCell>
                        <TableCell className="text-sm">
                          {epics.length} <span className="text-muted-foreground">epic{epics.length !== 1 ? 's' : ''}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={progress} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground w-16">{taskCounts.done}/{taskCounts.total}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7"
                              onClick={() => handleOpenCreateEpic(deliverable.id)}
                              data-testid={`add-epic-${deliverable.id}`}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                            <Link href={`/projects/${projectId}/deliverables/${deliverable.id}`}>
                              <Button variant="ghost" size="sm" className="h-7">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => openDeleteDialog(deliverable.id, deliverable.title)}
                              data-testid={`delete-deliverable-${deliverable.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow className="bg-muted/10 hover:bg-muted/10">
                          <TableCell colSpan={10} className="p-0">
                            <div className="p-4 border-t">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  Epics ({epics.length})
                                </span>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleOpenCreateEpic(deliverable.id)}
                                >
                                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                                  Add Epic
                                </Button>
                              </div>

                              {epics.length === 0 ? (
                                <div className="text-center py-6 text-muted-foreground border rounded-md bg-muted/20">
                                  <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  <p className="text-sm">No epics in this deliverable</p>
                                  <Button 
                                    variant="default" 
                                    size="sm" 
                                    className="mt-3"
                                    onClick={() => handleOpenCreateEpic(deliverable.id)}
                                  >
                                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                                    Create First Epic
                                  </Button>
                                </div>
                              ) : (
                                <div className="border rounded-md divide-y">
                                  {epics.map((epic: any) => {
                                    const epicProgress = getEpicProgress(epic.id);
                                    const epicTaskCounts = getEpicTaskCounts(epic.id);
                                    const epicTasks = getTasksForEpic(epic.id);
                                    const isEpicExpanded = expandedEpics.has(epic.id);
                                    const epicStatus = STATUS_CONFIG[epic.status] || STATUS_CONFIG["Not Started"];
                                    const EpicStatusIcon = epicStatus.icon;

                                    return (
                                      <div key={epic.id}>
                                        <div 
                                          className={cn(
                                            "flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors",
                                            isEpicExpanded && "bg-muted/20"
                                          )}
                                          onClick={() => toggleEpicExpanded(epic.id)}
                                          data-testid={`row-epic-${epic.id}`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                                              {isEpicExpanded ? (
                                                <ChevronDown className="h-4 w-4" />
                                              ) : (
                                                <ChevronRight className="h-4 w-4" />
                                              )}
                                            </Button>
                                            <div className="p-1.5 bg-primary/10 text-primary rounded">
                                              <Layers className="h-4 w-4" />
                                            </div>
                                            <div>
                                              <Link 
                                                href={`/projects/${projectId}/epics/${epic.id}`} 
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <h4 className="font-medium text-sm hover:text-primary transition-colors">{epic.title}</h4>
                                              </Link>
                                              {epic.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-1">{epic.description}</p>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                                            <Select 
                                              value={epic.status} 
                                              onValueChange={(v) => handleEpicStatusChange(epic.id, v)}
                                            >
                                              <SelectTrigger className="h-6 text-[10px] border-none shadow-none px-1 w-auto">
                                                <Badge 
                                                  variant="outline" 
                                                  className={cn(
                                                    "text-[10px] cursor-pointer",
                                                    epicStatusLabels.length > 0 
                                                      ? cn(getEpicStatusBgColor(epic.status), getEpicStatusTextColor(epic.status))
                                                      : epic.status === "Completed" || epic.status === "Done" ? "bg-green-50 text-green-700 border-green-200" :
                                                        epic.status === "In Progress" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                                        "bg-slate-50 text-slate-700 border-slate-200"
                                                  )}
                                                >
                                                  <EpicStatusIcon className="h-2.5 w-2.5 mr-1" />
                                                  {epic.status}
                                                </Badge>
                                              </SelectTrigger>
                                              <SelectContent>
                                                {epicStatusLabels.length > 0 ? (
                                                  epicStatusLabels.map((status) => (
                                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                                  ))
                                                ) : (
                                                  <>
                                                    <SelectItem value="Not Started">Not Started</SelectItem>
                                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                                    <SelectItem value="Completed">Completed</SelectItem>
                                                    <SelectItem value="Blocked">Blocked</SelectItem>
                                                  </>
                                                )}
                                              </SelectContent>
                                            </Select>
                                            <Popover>
                                              <PopoverTrigger asChild>
                                                <div 
                                                  className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer hover:text-primary group"
                                                  data-testid={`epic-start-date-${epic.id}`}
                                                >
                                                  <CalendarIcon className="h-3 w-3" />
                                                  {epic.startDate ? (
                                                    new Date(epic.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                                  ) : (
                                                    <span className="italic">Start</span>
                                                  )}
                                                </div>
                                              </PopoverTrigger>
                                              <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                  mode="single"
                                                  selected={epic.startDate ? new Date(epic.startDate) : undefined}
                                                  onSelect={(date) => handleEpicDateChange(epic.id, "startDate", date)}
                                                  initialFocus
                                                />
                                              </PopoverContent>
                                            </Popover>
                                            <span className="text-xs text-muted-foreground">-</span>
                                            <Popover>
                                              <PopoverTrigger asChild>
                                                <div 
                                                  className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer hover:text-primary group"
                                                  data-testid={`epic-end-date-${epic.id}`}
                                                >
                                                  <CalendarIcon className="h-3 w-3" />
                                                  {epic.endDate ? (
                                                    new Date(epic.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                                  ) : (
                                                    <span className="italic">End</span>
                                                  )}
                                                </div>
                                              </PopoverTrigger>
                                              <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                  mode="single"
                                                  selected={epic.endDate ? new Date(epic.endDate) : undefined}
                                                  onSelect={(date) => handleEpicDateChange(epic.id, "endDate", date)}
                                                  initialFocus
                                                />
                                              </PopoverContent>
                                            </Popover>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                              <ListTodo className="h-3 w-3" />
                                              <span>{epicTaskCounts.done}/{epicTaskCounts.total}</span>
                                            </div>
                                            <div className="flex items-center gap-2 w-24">
                                              <Progress value={epicProgress} className="h-1.5" />
                                              <span className="text-xs text-muted-foreground w-8 text-right">{epicProgress}%</span>
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openDeleteEpicDialog(epic.id, epic.title);
                                              }}
                                              data-testid={`btn-delete-epic-${epic.id}`}
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                          </div>
                                        </div>

                                        {isEpicExpanded && (
                                          <div className="border-t bg-muted/10 p-3 pl-12">
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Tasks ({epicTasks.length})
                                              </span>
                                              <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setCreatingTaskForEpic(epic.id);
                                                }}
                                              >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Add Task
                                              </Button>
                                            </div>

                                            {creatingTaskForEpic === epic.id && (
                                              <div className="flex items-center gap-2 mb-2 p-2 bg-background rounded border">
                                                <Input
                                                  placeholder="New task title..."
                                                  value={newTaskTitle}
                                                  onChange={(e) => setNewTaskTitle(e.target.value)}
                                                  onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleCreateTask(epic.id);
                                                    if (e.key === "Escape") {
                                                      setCreatingTaskForEpic(null);
                                                      setNewTaskTitle("");
                                                    }
                                                  }}
                                                  className="h-8 flex-1"
                                                  autoFocus
                                                  data-testid={`input-new-task-${epic.id}`}
                                                />
                                                <Button 
                                                  size="sm" 
                                                  onClick={() => handleCreateTask(epic.id)}
                                                  data-testid={`button-save-task-${epic.id}`}
                                                >
                                                  <Check className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button 
                                                  size="sm" 
                                                  variant="ghost"
                                                  onClick={() => {
                                                    setCreatingTaskForEpic(null);
                                                    setNewTaskTitle("");
                                                  }}
                                                >
                                                  <X className="h-3.5 w-3.5" />
                                                </Button>
                                              </div>
                                            )}

                                            {epicTasks.length === 0 && creatingTaskForEpic !== epic.id ? (
                                              <div className="text-center py-4 text-sm text-muted-foreground border rounded bg-background">
                                                No tasks in this epic yet.
                                              </div>
                                            ) : (
                                              <div className="border rounded divide-y bg-background">
                                                {epicTasks.map((task: any) => {
                                                  const assignee = users?.find((u: any) => u.id === task.assigneeId);
                                                  const taskStatus = STATUS_CONFIG[task.status] || STATUS_CONFIG["Todo"];
                                                  const isEditingThisTask = editingTaskId === task.id;

                                                  return (
                                                    <div 
                                                      key={task.id} 
                                                      className="p-2 hover:bg-muted/30 transition-colors"
                                                      data-testid={`row-task-${task.id}`}
                                                    >
                                                      <div className="flex items-center gap-3">
                                                        <div 
                                                          className="w-2 h-2 rounded-full shrink-0"
                                                          style={{ backgroundColor: getStatusAccentColor(task.status) }}
                                                        />

                                                        <div className="flex-1 min-w-0">
                                                          {isEditingThisTask && editingTaskField === "title" ? (
                                                            <div className="flex items-center gap-1">
                                                              <Input
                                                                value={editTaskValue}
                                                                onChange={(e) => setEditTaskValue(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                  if (e.key === "Enter") saveTaskEdit(task.id, "title");
                                                                  if (e.key === "Escape") cancelEditingTask();
                                                                }}
                                                                className="h-6 text-sm"
                                                                autoFocus
                                                                data-testid={`input-task-title-${task.id}`}
                                                              />
                                                              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => saveTaskEdit(task.id, "title")}>
                                                                <Check className="h-3 w-3 text-green-600" />
                                                              </Button>
                                                              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={cancelEditingTask}>
                                                                <X className="h-3 w-3" />
                                                              </Button>
                                                            </div>
                                                          ) : (
                                                            <div 
                                                              className="flex items-center gap-1 cursor-pointer group"
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                startEditingTask(task.id, "title", task.title);
                                                              }}
                                                            >
                                                              <span className="text-sm font-medium truncate">{task.title}</span>
                                                              <Pencil className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                            </div>
                                                          )}
                                                        </div>

                                                        <Select 
                                                          value={task.status} 
                                                          onValueChange={(v) => handleTaskStatusChange(task.id, v)}
                                                        >
                                                          <SelectTrigger className="h-6 text-[10px] border-none shadow-none px-1 w-auto">
                                                            <Badge 
                                                              variant="outline" 
                                                              className={cn(
                                                                "text-[10px] px-1.5 py-0",
                                                                getStatusBgColor(task.status),
                                                                getStatusTextColor(task.status)
                                                              )}
                                                            >
                                                              {task.status}
                                                            </Badge>
                                                          </SelectTrigger>
                                                          <SelectContent>
                                                            {statusLabels.length > 0 ? (
                                                              statusLabels.map((status) => (
                                                                <SelectItem key={status} value={status}>{status}</SelectItem>
                                                              ))
                                                            ) : (
                                                              <>
                                                                <SelectItem value="Todo">Todo</SelectItem>
                                                                <SelectItem value="In Progress">In Progress</SelectItem>
                                                                <SelectItem value="Review">Review</SelectItem>
                                                                <SelectItem value="Done">Done</SelectItem>
                                                              </>
                                                            )}
                                                          </SelectContent>
                                                        </Select>

                                                        <Select 
                                                          value={task.priority} 
                                                          onValueChange={(v) => handleTaskPriorityChange(task.id, v)}
                                                        >
                                                          <SelectTrigger className="h-6 text-[10px] border-none shadow-none px-1 w-auto">
                                                            <Badge 
                                                              variant="outline" 
                                                              className={cn("text-[10px] px-1.5 py-0", PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG["Medium"])}
                                                            >
                                                              {task.priority}
                                                            </Badge>
                                                          </SelectTrigger>
                                                          <SelectContent>
                                                            <SelectItem value="Low">Low</SelectItem>
                                                            <SelectItem value="Medium">Medium</SelectItem>
                                                            <SelectItem value="High">High</SelectItem>
                                                            <SelectItem value="Critical">Critical</SelectItem>
                                                          </SelectContent>
                                                        </Select>

                                                        <Select 
                                                          value={String(task.effort || 3)} 
                                                          onValueChange={(v) => handleTaskEffortChange(task.id, parseInt(v))}
                                                        >
                                                          <SelectTrigger className="h-6 text-[10px] border-none shadow-none px-1 w-12">
                                                            <span className="text-xs">{task.effort || 3}pt</span>
                                                          </SelectTrigger>
                                                          <SelectContent>
                                                            {EFFORT_VALUES.map((v) => (
                                                              <SelectItem key={v} value={String(v)}>{v} pts</SelectItem>
                                                            ))}
                                                          </SelectContent>
                                                        </Select>

                                                        <Popover>
                                                          <PopoverTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-6 px-1 text-xs">
                                                              <CalendarIcon className="h-3 w-3 mr-1" />
                                                              {task.deadline ? format(new Date(task.deadline), "MMM d") : "-"}
                                                            </Button>
                                                          </PopoverTrigger>
                                                          <PopoverContent className="w-auto p-0" align="end">
                                                            <Calendar
                                                              mode="single"
                                                              selected={task.deadline ? new Date(task.deadline) : undefined}
                                                              onSelect={(date) => handleTaskDeadlineChange(task.id, date)}
                                                              initialFocus
                                                            />
                                                          </PopoverContent>
                                                        </Popover>

                                                        <SearchableSelect
                                                          value={task.assigneeId || ""}
                                                          onValueChange={(v) => handleTaskAssigneeChange(task.id, v)}
                                                          className="h-6 text-xs w-[100px]"
                                                          placeholder="Assign"
                                                          options={(users || []).map((u: any) => ({ value: u.id, label: u.name || u.email }))}
                                                        />

                                                        <SearchableSelect
                                                          value={task.sprintId || ""}
                                                          onValueChange={(v) => handleTaskSprintChange(task.id, v || "none")}
                                                          className="h-6 text-xs w-[100px]"
                                                          placeholder="Sprint"
                                                          options={[
                                                            { value: "none", label: "No Sprint" },
                                                            ...projectSprints.map((s: any) => ({ value: s.id, label: s.name }))
                                                          ]}
                                                        />

                                                        <SearchableSelect
                                                          value={task.milestoneId || ""}
                                                          onValueChange={(v) => handleTaskMilestoneChange(task.id, v || "none")}
                                                          className="h-6 text-xs w-[100px]"
                                                          placeholder="Milestone"
                                                          options={[
                                                            { value: "none", label: "No Milestone" },
                                                            ...projectMilestones.map((m: any) => ({ value: m.id, label: m.title || m.name }))
                                                          ]}
                                                        />

                                                        <Link href={`/projects/${projectId}/tasks/${task.id}`}>
                                                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                            <ExternalLink className="h-3 w-3" />
                                                          </Button>
                                                        </Link>
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={isCreateEpicOpen} onOpenChange={setIsCreateEpicOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Epic</DialogTitle>
            <DialogDescription>
              Define a new body of work for this deliverable.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="epic-title">Epic Title</Label>
              <Input 
                id="epic-title" 
                value={newEpicData.title}
                onChange={(e) => setNewEpicData({...newEpicData, title: e.target.value})}
                placeholder="e.g. User Authentication"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="epic-desc">Description</Label>
              <Input 
                id="epic-desc" 
                value={newEpicData.description}
                onChange={(e) => setNewEpicData({...newEpicData, description: e.target.value})}
                placeholder="Brief description of the work..."
              />
            </div>
            
            <div className="space-y-3 pt-2">
              <Label>Assign Stages</Label>
              <div className="text-xs text-muted-foreground mb-2">
                  Select the workflow stages that apply to this epic.
              </div>
              <ScrollArea className="h-[200px] border rounded-md p-2">
                  <div className="space-y-2">
                      {STAGE_TEMPLATES.map(stage => (
                          <div 
                              key={stage.id} 
                              className={cn(
                                  "flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors border",
                                  newEpicData.stageIds.includes(stage.id) 
                                      ? "bg-primary/5 border-primary" 
                                      : "hover:bg-muted border-transparent"
                              )}
                              onClick={() => toggleStageSelection(stage.id)}
                          >
                              <div className={cn(
                                  "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                                  newEpicData.stageIds.includes(stage.id)
                                      ? "bg-primary border-primary text-primary-foreground"
                                      : "border-muted-foreground"
                              )}>
                                  {newEpicData.stageIds.includes(stage.id) && <Check className="h-3 w-3" />}
                              </div>
                              <div className="flex-1">
                                  <div className="text-sm font-medium">{stage.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                      Includes {stage.defaultTasks.length} default tasks
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateEpicOpen(false)} disabled={isCreatingEpic}>Cancel</Button>
            <Button onClick={handleCreateEpic} loading={isCreatingEpic}>Create Epic</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deliverable</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deliverableToDelete?.title}"? This action cannot be undone. 
              Any associated epics will remain but will no longer be linked to this deliverable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-deliverable"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteEpicDialogOpen} onOpenChange={setDeleteEpicDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Epic</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{epicToDelete?.title}"? This action cannot be undone. 
              Any associated tasks will remain but will no longer be linked to this epic.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteEpic}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-epic"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function DeliverablesList() {
  const [match, params] = useRoute("/projects/:projectId/deliverables");
  const projectId = params?.projectId || "1";

  return (
    <Shell>
      <div className="space-y-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={`/projects/${projectId}`} className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Project
            </Link>
            <span className="text-border">|</span>
            <span>Deliverables & Epics</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-primary">Deliverables</h1>
              <p className="text-muted-foreground">Manage high-level deliverables and breakdown epics.</p>
            </div>
          </div>
        </div>

        <DeliverablesContent projectId={projectId} />
      </div>
    </Shell>
  );
}
