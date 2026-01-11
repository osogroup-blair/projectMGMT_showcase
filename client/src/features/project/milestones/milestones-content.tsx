import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { 
  Flag, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Circle,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ListTodo,
  Plus,
  Loader2,
  Pencil,
  Check,
  X,
  User,
  Search,
  ExternalLink,
  ArrowUpDown,
  Layers,
  SlidersHorizontal,
  Trash2,
  Lock,
  Unlock,
  AlertTriangle,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useMilestones, useMilestoneTaskLinks, useTasks, useUsers, useEpics, useDeliverables, useProjectStages, useMilestoneScopeRules } from "@/hooks/use-nexus-data";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabToolbar, ViewMode } from "@/components/ui/tab-toolbar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { MilestoneScopeInline } from "./milestone-scope-inline";

const STATUS_CONFIG: Record<string, { icon: typeof Circle; color: string; bgColor: string; label: string }> = {
  "planned": { icon: Circle, color: "text-slate-500", bgColor: "bg-slate-100", label: "Planned" },
  "in_progress": { icon: Clock, color: "text-blue-500", bgColor: "bg-blue-100", label: "In Progress" },
  "achieved": { icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-100", label: "Achieved" },
  "slipped": { icon: AlertCircle, color: "text-red-500", bgColor: "bg-red-100", label: "Slipped" },
  "cancelled": { icon: Flag, color: "text-slate-400", bgColor: "bg-slate-100", label: "Cancelled" },
  "Pending": { icon: Circle, color: "text-slate-500", bgColor: "bg-slate-100", label: "Planned" },
  "In Progress": { icon: Clock, color: "text-blue-500", bgColor: "bg-blue-100", label: "In Progress" },
  "Completed": { icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-100", label: "Achieved" },
  "Blocked": { icon: AlertCircle, color: "text-red-500", bgColor: "bg-red-100", label: "Blocked" },
};

const PRIORITY_CONFIG: Record<string, string> = {
  "Low": "bg-slate-50 text-slate-700 border-slate-200",
  "Medium": "bg-blue-50 text-blue-700 border-blue-200",
  "High": "bg-orange-50 text-orange-700 border-orange-200",
  "Critical": "bg-red-50 text-red-700 border-red-200",
};

const EFFORT_VALUES = [1, 2, 3, 5, 8, 13, 21];

interface MilestoneTaskLink {
  id: string;
  milestoneId: string;
  taskId: string;
  projectId?: string;
  source: string;
  locked?: boolean;
  createdAt?: string;
}

export function MilestonesContent({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { data: allMilestones, isLoading: isMilestonesLoading, createAsync: createMilestoneAsync, update: updateMilestone, remove: removeMilestone } = useMilestones();
  const { data: allTaskLinks, isLoading: isLinksLoading, create: createLink } = useMilestoneTaskLinks();
  const { data: allTasks, isLoading: isTasksLoading, createAsync: createTaskAsync } = useTasks();
  const { data: users, isLoading: isUsersLoading } = useUsers();
  const { data: allEpics, isLoading: isEpicsLoading } = useEpics();
  const { data: allDeliverables, isLoading: isDeliverablesLoading } = useDeliverables();
  const { data: allStages, isLoading: isStagesLoading } = useProjectStages();

  // Inline editing state
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Add Task Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMilestoneId, setDialogMilestoneId] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<"search" | "create">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEpicId, setSelectedEpicId] = useState<string>("");
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [newTaskEffort, setNewTaskEffort] = useState<number | null>(3);

  // Milestone search state
  const [milestoneSearchQuery, setMilestoneSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Sorting state
  type SortField = "name" | "status" | "targetDate" | "owner" | "tasks" | "progress";
  type SortDirection = "asc" | "desc";
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Expanded rows state for internal tabs
  const [expandedMilestoneId, setExpandedMilestoneId] = useState<string | null>(null);
  const [activeInternalTab, setActiveInternalTab] = useState<"tasks" | "scope">("tasks");

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = useState<any>(null);

  // Scope rules for expanded milestone
  const { data: allScopeRules, create: createScopeRule, update: updateScopeRule } = useMilestoneScopeRules();

  const milestones = useMemo(() => 
    (allMilestones || []).filter((m: any) => m.projectId === projectId),
    [allMilestones, projectId]
  );

  const filteredMilestones = useMemo(() => {
    let result = milestones;
    if (milestoneSearchQuery.trim()) {
      const q = milestoneSearchQuery.toLowerCase();
      result = result.filter((m: any) => 
        m.name?.toLowerCase().includes(q) || 
        m.description?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [milestones, milestoneSearchQuery]);

  // Sorted milestones for list view
  const sortedMilestones = useMemo(() => {
    const sorted = [...filteredMilestones];
    sorted.sort((a: any, b: any) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case "name":
          aVal = a.name?.toLowerCase() || "";
          bVal = b.name?.toLowerCase() || "";
          break;
        case "status":
          aVal = a.status || "";
          bVal = b.status || "";
          break;
        case "targetDate":
          aVal = a.targetDate ? new Date(a.targetDate).getTime() : 0;
          bVal = b.targetDate ? new Date(b.targetDate).getTime() : 0;
          break;
        case "owner":
          const ownerA = users?.find((u: any) => u.id === a.ownerId);
          const ownerB = users?.find((u: any) => u.id === b.ownerId);
          aVal = ownerA?.name?.toLowerCase() || "";
          bVal = ownerB?.name?.toLowerCase() || "";
          break;
        case "tasks":
          const linksA = (allTaskLinks || []).filter((l: any) => l.milestoneId === a.id);
          const linksB = (allTaskLinks || []).filter((l: any) => l.milestoneId === b.id);
          aVal = linksA.length;
          bVal = linksB.length;
          break;
        case "progress":
          const tasksA = (allTaskLinks || []).filter((l: any) => l.milestoneId === a.id)
            .map((l: any) => allTasks?.find((t: any) => t.id === l.taskId))
            .filter(Boolean);
          const tasksB = (allTaskLinks || []).filter((l: any) => l.milestoneId === b.id)
            .map((l: any) => allTasks?.find((t: any) => t.id === l.taskId))
            .filter(Boolean);
          aVal = tasksA.length > 0 ? tasksA.filter((t: any) => t.status === "Done").length / tasksA.length : 0;
          bVal = tasksB.length > 0 ? tasksB.filter((t: any) => t.status === "Done").length / tasksB.length : 0;
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
  }, [filteredMilestones, sortField, sortDirection, users, allTaskLinks, allTasks]);

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
            <ChevronUp className="h-3.5 w-3.5 text-primary" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-primary" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
        )}
      </div>
    </TableHead>
  );

  const projectTasks = useMemo(() => 
    (allTasks || []).filter((t: any) => t.projectId === projectId || t.project === projectId),
    [allTasks, projectId]
  );

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

  const projectStages = useMemo(() => {
    const stageIds = Array.from(new Set(projectTasks.map((t: any) => t.stageId).filter(Boolean)));
    return stageIds.map(id => {
      const stage = (allStages || []).find((s: any) => s.id === id);
      return stage ? { id: stage.id, label: stage.name, order: stage.order } : null;
    }).filter(Boolean).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  }, [projectTasks, allStages]);

  const getTasksForMilestone = (milestoneId: string) => {
    const links = (allTaskLinks || []).filter((l: any) => l.milestoneId === milestoneId);
    return links.map((link: any) => {
      const task = (allTasks || []).find((t: any) => t.id === link.taskId);
      return task;
    }).filter(Boolean);
  };

  const getLinksForMilestone = (milestoneId: string) => {
    return (allTaskLinks || []).filter((l: any) => l.milestoneId === milestoneId);
  };

  const getMilestoneProgress = (milestoneId: string) => {
    const tasks = getTasksForMilestone(milestoneId);
    if (tasks.length === 0) return { done: 0, total: 0, percent: 0 };
    const done = tasks.filter((t: any) => t.status === "Done").length;
    return { done, total: tasks.length, percent: Math.round((done / tasks.length) * 100) };
  };

  const getOwner = (ownerId?: string) => {
    if (!ownerId) return null;
    return (users || []).find((u: any) => u.id === ownerId);
  };

  const getEpic = (epicId?: string) => {
    if (!epicId) return null;
    return (allEpics || []).find((e: any) => e.id === epicId);
  };

  const getAssignee = (assigneeId?: string) => {
    if (!assigneeId) return null;
    return (users || []).find((u: any) => u.id === assigneeId);
  };

  const isLoading = isMilestonesLoading || isLinksLoading || isTasksLoading || isUsersLoading || isEpicsLoading || isDeliverablesLoading || isStagesLoading;

  const handleCreateMilestone = async () => {
    try {
      const newMilestone = await createMilestoneAsync({
        projectId: projectId,
        name: "New Milestone",
        description: "",
        phase: "plan_strategy",
        targetDate: new Date().toISOString().split('T')[0],
        status: "planned",
        ownerId: users?.[0]?.id || "1",
        scopeType: "manual",
        completionMode: "all_tasks",
        completionTargetPercent: 100,
        tags: []
      });
      
      if (newMilestone?.id) {
        toast({ title: "Milestone Created", description: "Redirecting to edit details..." });
        navigate(`/projects/${projectId}/milestones/${newMilestone.id}`);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create milestone.", variant: "destructive" });
    }
  };

  // Inline editing handlers
  const startEditing = (milestoneId: string, field: string, currentValue: string) => {
    setEditingMilestoneId(milestoneId);
    setEditingField(field);
    setEditValue(currentValue || "");
  };

  const cancelEditing = () => {
    setEditingMilestoneId(null);
    setEditingField(null);
    setEditValue("");
  };

  const saveEdit = (milestoneId: string, field: string) => {
    const milestone = milestones.find((m: any) => m.id === milestoneId);
    if (!milestone) return;

    const updates: Record<string, any> = {};
    if (field === "name" && editValue.trim()) {
      updates.name = editValue.trim();
    } else if (field === "description") {
      updates.description = editValue;
    } else if (field === "targetDate") {
      updates.targetDate = editValue;
    }

    if (Object.keys(updates).length > 0) {
      updateMilestone({ id: milestoneId, updates });
      toast({ title: "Updated", description: `${field.charAt(0).toUpperCase() + field.slice(1)} has been updated.` });
    }
    cancelEditing();
  };

  const handleOwnerChange = (milestoneId: string, newOwnerId: string) => {
    updateMilestone({ id: milestoneId, updates: { ownerId: newOwnerId } });
    toast({ title: "Owner updated" });
    cancelEditing();
  };

  const handleStatusChange = (milestoneId: string, newStatus: string) => {
    updateMilestone({ id: milestoneId, updates: { status: newStatus } });
    toast({ title: "Status updated" });
    cancelEditing();
  };

  const handleDateChange = (milestoneId: string, newDate: string) => {
    updateMilestone({ id: milestoneId, updates: { targetDate: newDate } });
    toast({ title: "Target date updated" });
    cancelEditing();
  };

  const openDeleteDialog = (milestone: any) => {
    setMilestoneToDelete(milestone);
    setDeleteDialogOpen(true);
  };

  const handleDeleteMilestone = () => {
    if (milestoneToDelete) {
      removeMilestone(milestoneToDelete.id);
      toast({ title: "Milestone deleted", description: `"${milestoneToDelete.name}" has been removed.` });
      setDeleteDialogOpen(false);
      setMilestoneToDelete(null);
      if (expandedMilestoneId === milestoneToDelete.id) {
        setExpandedMilestoneId(null);
      }
    }
  };

  useEffect(() => {
    if (editingField === "name" || editingField === "targetDate") {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (editingField === "description") {
      textareaRef.current?.focus();
    }
  }, [editingField]);

  // Add Task Dialog handlers
  const openAddTaskDialog = (milestoneId: string) => {
    setDialogMilestoneId(milestoneId);
    setDialogMode("search");
    setSearchQuery("");
    setSelectedEpicId("");
    setSelectedStageId("");
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskPriority("Medium");
    setNewTaskEffort(3);
    setDialogOpen(true);
  };

  const currentLinkedTaskIds = useMemo(() => {
    if (!dialogMilestoneId) return [];
    const links = getLinksForMilestone(dialogMilestoneId);
    return links.map((l: any) => l.taskId);
  }, [dialogMilestoneId, allTaskLinks]);

  const searchableTasks = useMemo(() => {
    return projectTasks.filter((t: any) => !currentLinkedTaskIds.includes(t.id));
  }, [projectTasks, currentLinkedTaskIds]);

  const filteredSearchTasks = useMemo(() => {
    let result = searchableTasks;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t: any) => 
        t.title?.toLowerCase().includes(q) || 
        t.description?.toLowerCase().includes(q)
      );
    }
    
    if (selectedEpicId) {
      result = result.filter((t: any) => t.epicId === selectedEpicId);
    }
    
    if (selectedStageId) {
      result = result.filter((t: any) => t.stageId === selectedStageId);
    }
    
    return result.slice(0, 20);
  }, [searchableTasks, searchQuery, selectedEpicId, selectedStageId]);

  const handleLinkTask = (taskId: string) => {
    if (!dialogMilestoneId) return;
    
    createLink({
      milestoneId: dialogMilestoneId,
      taskId,
      projectId,
      source: "manual_add",
      locked: false
    });
    
    toast({ title: "Task linked", description: "Task has been added to the milestone." });
    setDialogOpen(false);
  };

  const handleCreateTask = async () => {
    if (!dialogMilestoneId) return;
    
    if (!newTaskTitle.trim()) {
      toast({ title: "Error", description: "Task title is required.", variant: "destructive" });
      return;
    }
    if (!selectedEpicId) {
      toast({ title: "Error", description: "Epic is required.", variant: "destructive" });
      return;
    }
    if (!selectedStageId) {
      toast({ title: "Error", description: "Stage is required.", variant: "destructive" });
      return;
    }
    if (!newTaskEffort) {
      toast({ title: "Error", description: "Effort is required.", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      const newTask = await createTaskAsync({
        title: newTaskTitle,
        description: newTaskDescription || "",
        project: projectId,
        projectId: projectId,
        epicId: selectedEpicId,
        stageId: selectedStageId,
        status: "Todo",
        priority: newTaskPriority,
        effort: newTaskEffort,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tags: []
      });

      createLink({
        milestoneId: dialogMilestoneId,
        taskId: newTask.id,
        projectId,
        source: "manual_add",
        locked: false
      });
      
      toast({ title: "Task created and linked", description: "New task has been created and added to the milestone." });
      setDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create task.", variant: "destructive" });
    } finally {
      setIsCreating(false);
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
      {/* Hidden trigger for tab-level Add button */}
      <button 
        data-testid="button-create-milestones" 
        onClick={handleCreateMilestone} 
        className="hidden" 
        aria-hidden="true"
      />

      <div className="sticky top-0 z-10 bg-background pt-2 pb-3 -mx-1 px-1">
        <TabToolbar
          searchQuery={milestoneSearchQuery}
          onSearchChange={setMilestoneSearchQuery}
          searchPlaceholder="Search milestones..."
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showFilter={false}
          addButtonLabel="Add Milestone"
          onAddClick={handleCreateMilestone}
        />
      </div>

      <div className="space-y-4">
        {filteredMilestones.length === 0 ? (
          <Card className="bg-muted/10 border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Flag className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium">
                {milestones.length === 0 ? "No milestones defined" : "No milestones match your search"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
                {milestones.length === 0 
                  ? "Milestones help track key project deliverables and deadlines."
                  : "Try adjusting your search terms."}
              </p>
            </CardContent>
          </Card>
        ) : viewMode === "list" ? (
          <div className="border rounded-lg bg-card overflow-x-auto">
            <Table style={{ minWidth: "900px" }}>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead style={{ width: "3%" }}></TableHead>
                  <SortableHeader field="name" width="22%">Milestone</SortableHeader>
                  <SortableHeader field="status" width="12%">Status</SortableHeader>
                  <SortableHeader field="targetDate" width="14%">Target Date</SortableHeader>
                  <SortableHeader field="owner" width="14%">Owner</SortableHeader>
                  <SortableHeader field="tasks" width="10%">Tasks</SortableHeader>
                  <SortableHeader field="progress" width="14%">Progress</SortableHeader>
                  <TableHead style={{ width: "8%" }} className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMilestones.map((milestone: any) => {
                  const status = STATUS_CONFIG[milestone.status] || STATUS_CONFIG.planned;
                  const StatusIcon = status.icon;
                  const owner = getOwner(milestone.ownerId);
                  const progress = getMilestoneProgress(milestone.id);
                  const isExpanded = expandedMilestoneId === milestone.id;
                  const milestoneTasks = getTasksForMilestone(milestone.id);
                  const milestoneLinks = getLinksForMilestone(milestone.id);

                  return (
                    <React.Fragment key={milestone.id}>
                      <TableRow 
                        className={cn("hover:bg-muted/50", isExpanded && "bg-muted/30")} 
                        data-testid={`row-milestone-${milestone.id}`}
                      >
                        <TableCell className="p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              setExpandedMilestoneId(isExpanded ? null : milestone.id);
                              setActiveInternalTab("tasks");
                            }}
                            data-testid={`expand-milestone-${milestone.id}`}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          {editingMilestoneId === milestone.id && editingField === "name" ? (
                            <div className="flex items-center gap-1">
                              <Input
                                ref={inputRef}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEdit(milestone.id, "name");
                                  if (e.key === "Escape") cancelEditing();
                                }}
                                className="h-7 text-sm"
                                data-testid={`input-milestone-name-${milestone.id}`}
                              />
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => saveEdit(milestone.id, "name")}>
                                <Check className="h-3.5 w-3.5 text-green-600" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={cancelEditing}>
                                <X className="h-3.5 w-3.5 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-0.5 group">
                              <div className="flex items-center gap-1.5">
                                <span 
                                  className="font-medium hover:text-primary cursor-pointer"
                                  onClick={() => startEditing(milestone.id, "name", milestone.name)}
                                  data-testid={`editable-name-${milestone.id}`}
                                >
                                  {milestone.name}
                                </span>
                                <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              {milestone.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{milestone.description}</p>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingMilestoneId === milestone.id && editingField === "status" ? (
                            <SearchableSelect
                              value={editValue}
                              onValueChange={(v) => handleStatusChange(milestone.id, v)}
                              className="w-[130px] h-7 text-xs"
                              placeholder="Status"
                              options={[
                                { value: "planned", label: "Planned" },
                                { value: "in_progress", label: "In Progress" },
                                { value: "achieved", label: "Achieved" },
                                { value: "slipped", label: "Slipped" },
                                { value: "cancelled", label: "Cancelled" }
                              ]}
                              data-testid={`select-milestone-status-${milestone.id}`}
                            />
                          ) : (
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "font-normal text-xs cursor-pointer hover:ring-1 hover:ring-primary/50",
                                milestone.status === "achieved" || milestone.status === "Completed" 
                                  ? "bg-green-50 text-green-700 border-green-200" 
                                  : milestone.status === "in_progress" || milestone.status === "In Progress"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : milestone.status === "slipped" || milestone.status === "Blocked"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-slate-50 text-slate-700 border-slate-200"
                              )}
                              onClick={() => startEditing(milestone.id, "status", milestone.status || "planned")}
                              data-testid={`editable-status-${milestone.id}`}
                            >
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <Popover>
                            <PopoverTrigger asChild>
                              <div 
                                className="flex items-center gap-1.5 cursor-pointer hover:text-primary group"
                                data-testid={`editable-date-${milestone.id}`}
                              >
                                <CalendarIcon className="h-3.5 w-3.5" />
                                {milestone.targetDate ? (
                                  new Date(milestone.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                ) : (
                                  <span className="italic">Not set</span>
                                )}
                                <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={milestone.targetDate ? new Date(milestone.targetDate) : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    handleDateChange(milestone.id, date.toISOString().split('T')[0]);
                                  }
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell>
                          {editingMilestoneId === milestone.id && editingField === "owner" ? (
                            <SearchableSelect
                              value={editValue}
                              onValueChange={(v) => handleOwnerChange(milestone.id, v)}
                              className="w-[130px] h-7 text-xs"
                              placeholder="Select owner"
                              options={(users || []).map((u: any) => ({ value: u.id, label: u.name || u.email }))}
                              data-testid={`select-milestone-owner-${milestone.id}`}
                            />
                          ) : (
                            <div 
                              className="flex items-center gap-2 cursor-pointer hover:text-primary group"
                              onClick={() => startEditing(milestone.id, "owner", milestone.ownerId || "")}
                              data-testid={`editable-owner-${milestone.id}`}
                            >
                              {owner ? (
                                <>
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback className="text-[8px]">
                                      {owner.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs truncate max-w-[80px]">{owner.name?.split(' ')[0]}</span>
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Unassigned</span>
                              )}
                              <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7"
                              onClick={() => openAddTaskDialog(milestone.id)}
                              data-testid={`add-task-to-milestone-${milestone.id}`}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                            <Link href={`/projects/${projectId}/milestones/${milestone.id}`}>
                              <Button variant="ghost" size="sm" className="h-7">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => openDeleteDialog(milestone)}
                              data-testid={`delete-milestone-${milestone.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${milestone.id}-expanded`} className="bg-muted/10 hover:bg-muted/10">
                          <TableCell colSpan={8} className="p-0">
                            <div className="p-4 border-t">
                              <Tabs value={activeInternalTab} onValueChange={(v) => setActiveInternalTab(v as "tasks" | "scope")}>
                                <TabsList className="h-8 mb-4">
                                  <TabsTrigger value="tasks" className="text-xs h-7 px-3" data-testid="internal-tab-tasks">
                                    <ListTodo className="h-3.5 w-3.5 mr-1.5" />
                                    Tasks ({milestoneTasks.length})
                                  </TabsTrigger>
                                  <TabsTrigger value="scope" className="text-xs h-7 px-3" data-testid="internal-tab-scope">
                                    <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
                                    Scope Definition
                                  </TabsTrigger>
                                </TabsList>

                                <TabsContent value="tasks" className="mt-0">
                                  {milestoneTasks.length === 0 ? (
                                    <div className="text-center py-6 text-muted-foreground">
                                      <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                      <p className="text-sm">No tasks linked to this milestone</p>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="mt-3"
                                        onClick={() => openAddTaskDialog(milestone.id)}
                                      >
                                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                                        Add Task
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm text-muted-foreground">{milestoneTasks.length} linked task{milestoneTasks.length !== 1 ? 's' : ''}</span>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => openAddTaskDialog(milestone.id)}
                                        >
                                          <Plus className="h-3.5 w-3.5 mr-1.5" />
                                          Add Task
                                        </Button>
                                      </div>
                                      <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
                                        {milestoneTasks.map((task: any) => {
                                          const taskEpic = getEpic(task.epicId);
                                          const assignee = getAssignee(task.assigneeId);
                                          return (
                                            <div key={task.id} className="p-3 hover:bg-muted/30 flex items-center justify-between">
                                              <div className="flex-1 min-w-0">
                                                <Link href={`/tasks/${task.id}`}>
                                                  <span className="font-medium text-sm hover:text-primary cursor-pointer">{task.title}</span>
                                                </Link>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                  {taskEpic && <span>{taskEpic.title}</span>}
                                                  <Badge variant="outline" className={cn(
                                                    "text-[10px] px-1.5 py-0",
                                                    task.status === "Done" ? "bg-green-50 text-green-700 border-green-200" :
                                                    task.status === "In Progress" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                                    "bg-slate-50 text-slate-700 border-slate-200"
                                                  )}>
                                                    {task.status}
                                                  </Badge>
                                                </div>
                                              </div>
                                              {assignee && (
                                                <Avatar className="h-6 w-6">
                                                  <AvatarFallback className="text-[10px]">
                                                    {assignee.name?.substring(0, 2).toUpperCase()}
                                                  </AvatarFallback>
                                                </Avatar>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </TabsContent>

                                <TabsContent value="scope" className="mt-0">
                                  <MilestoneScopeInline
                                    milestone={milestone}
                                    projectId={projectId}
                                    tasks={projectTasks}
                                    epics={projectEpics}
                                    stages={projectStages}
                                    links={milestoneLinks}
                                    allLinks={allTaskLinks || []}
                                    scopeRules={allScopeRules || []}
                                    onCreateLink={createLink}
                                    onCreateScopeRule={createScopeRule}
                                    onUpdateScopeRule={updateScopeRule}
                                  />
                                </TabsContent>
                              </Tabs>
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMilestones.map((milestone: any) => {
              const status = STATUS_CONFIG[milestone.status] || STATUS_CONFIG.planned;
              const StatusIcon = status.icon;
              const owner = getOwner(milestone.ownerId);
              const progress = getMilestoneProgress(milestone.id);

              return (
                <Card 
                  key={milestone.id} 
                  className="hover:shadow-md transition-shadow group"
                  data-testid={`card-milestone-${milestone.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={cn("p-2 rounded-lg shrink-0", status.bgColor, status.color)}>
                          <StatusIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/projects/${projectId}/milestones/${milestone.id}`}>
                            <h4 className="font-semibold text-sm hover:text-primary truncate">
                              {milestone.name}
                            </h4>
                          </Link>
                          {milestone.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {milestone.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <Link href={`/projects/${projectId}/milestones/${milestone.id}`}>
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
                          variant="secondary"
                          className={cn(
                            "text-[10px]",
                            milestone.status === "achieved" || milestone.status === "Completed" 
                              ? "bg-green-100 text-green-700" 
                              : milestone.status === "in_progress" || milestone.status === "In Progress"
                              ? "bg-blue-100 text-blue-700"
                              : milestone.status === "slipped" || milestone.status === "Blocked"
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-700"
                          )}
                        >
                          {status.label}
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
                          {milestone.targetDate 
                            ? new Date(milestone.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                            : '—'}
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Task to Milestone</DialogTitle>
            <DialogDescription>
              Search for an existing task or create a new one.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={dialogMode} onValueChange={(v) => setDialogMode(v as "search" | "create")} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search" data-testid="tab-search-task">
                <Search className="h-4 w-4 mr-2" />
                Search Existing
              </TabsTrigger>
              <TabsTrigger value="create" data-testid="tab-create-task">
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="flex-1 overflow-hidden flex flex-col mt-4">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search tasks by title..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    data-testid="input-search-task"
                  />
                </div>
                <div className="flex gap-2">
                  <SearchableSelect 
                    value={selectedEpicId || "all"} 
                    onValueChange={(v) => setSelectedEpicId(v === "all" ? "" : v)}
                    className="w-[200px]"
                    data-testid="select-search-epic"
                    placeholder="Filter by Epic"
                    options={[
                      { value: "all", label: "All Epics" },
                      ...projectEpics.map((epic: any) => ({ value: epic.id, label: epic.title }))
                    ]}
                  />
                  <SearchableSelect 
                    value={selectedStageId || "all"} 
                    onValueChange={(v) => setSelectedStageId(v === "all" ? "" : v)}
                    className="w-[200px]"
                    data-testid="select-search-stage"
                    placeholder="Filter by Stage"
                    options={[
                      { value: "all", label: "All Stages" },
                      ...projectStages.map((stage: any) => ({ value: stage.id, label: stage.label }))
                    ]}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto mt-3 border rounded-md">
                {filteredSearchTasks.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No matching tasks found.</p>
                    <p className="text-xs mt-1">Try adjusting your search or filters.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredSearchTasks.map((task: any) => {
                      const epic = getEpic(task.epicId);
                      const stage = projectStages.find((s: any) => s.id === task.stageId);
                      return (
                        <div 
                          key={task.id} 
                          className="p-3 hover:bg-muted/50 flex items-center justify-between cursor-pointer"
                          onClick={() => handleLinkTask(task.id)}
                          data-testid={`search-result-task-${task.id}`}
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{task.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              {epic && <span>{epic.title}</span>}
                              {stage && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                  {stage.label}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="shrink-0">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="create" className="flex-1 overflow-y-auto mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-task-title">Title <span className="text-red-500">*</span></Label>
                  <Input 
                    id="new-task-title"
                    placeholder="Enter task title..."
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    data-testid="input-new-task-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-task-description">Description</Label>
                  <Textarea 
                    id="new-task-description"
                    placeholder="Enter task description..."
                    value={newTaskDescription}
                    onChange={e => setNewTaskDescription(e.target.value)}
                    rows={2}
                    data-testid="input-new-task-description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Epic <span className="text-red-500">*</span></Label>
                    <SearchableSelect 
                      value={selectedEpicId} 
                      onValueChange={(v) => { setSelectedEpicId(v); setSelectedStageId(""); }}
                      data-testid="select-new-task-epic"
                      placeholder="Select Epic first"
                      options={projectEpics.map((epic: any) => ({ value: epic.id, label: epic.title }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Stage <span className="text-red-500">*</span></Label>
                    <SearchableSelect 
                      value={selectedStageId} 
                      onValueChange={setSelectedStageId}
                      disabled={!selectedEpicId}
                      data-testid="select-new-task-stage"
                      placeholder={selectedEpicId ? "Select Stage" : "Select Epic first"}
                      options={projectStages.map((stage: any) => ({ value: stage.id, label: stage.label }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <SearchableSelect 
                      value={newTaskPriority} 
                      onValueChange={setNewTaskPriority}
                      data-testid="select-new-task-priority"
                      options={[
                        { value: "Low", label: "Low" },
                        { value: "Medium", label: "Medium" },
                        { value: "High", label: "High" },
                        { value: "Critical", label: "Critical" }
                      ]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Effort (Fibonacci) <span className="text-red-500">*</span></Label>
                    <SearchableSelect 
                      value={newTaskEffort?.toString() || ""} 
                      onValueChange={(v) => setNewTaskEffort(v ? parseInt(v) : null)}
                      data-testid="select-new-task-effort"
                      placeholder="Select effort"
                      options={EFFORT_VALUES.map((val) => ({ value: val.toString(), label: val.toString() }))}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleCreateTask}
                  disabled={!newTaskTitle.trim() || !selectedEpicId || !selectedStageId || !newTaskEffort || isCreating}
                  data-testid="button-create-task"
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Create & Link
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Milestone</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{milestoneToDelete?.name}"? This action cannot be undone.
              Any linked tasks will be unlinked but not deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMilestoneToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteMilestone}
              className="bg-red-600 hover:bg-red-700"
              data-testid="confirm-delete-milestone"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
