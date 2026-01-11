import { useMemo, useState, useRef, useEffect, useCallback } from "react";
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
  ChevronLeft,
  ArrowRight,
  Users,
  AlertTriangle,
  BarChart3,
  Settings,
  Trash2,
  Archive,
  Link as LinkIcon,
  ListTodo,
  SlidersHorizontal,
  RefreshCw,
  Layers,
  Lock,
  Unlock,
  CheckSquare,
  FileText,
  PanelRightClose,
  PanelRightOpen,
  MessageSquare,
  ExternalLink
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
import { Link, useRoute, useSearch, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useSprints, useTasks, useProject, useUsers, useEpics, useMilestones, useDeliverables, useSprintScopeTargets, useSuggestedTasks, useProjectStages, useResolvedTaskTypes } from "@/hooks/use-nexus-data";
import { useTaskStatuses } from "@/hooks/use-task-statuses";
import { apiRequest } from "@/lib/queryClient";
import { format as formatDate } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PortableKanban } from "@/components/kanban";
import { BlockerReasonDialog } from "@/features/project/sprints/blocker-reason-dialog";
import { PulsePanel } from "@/features/project/sprints/pulse-panel";
import { SprintSignalsBar } from "@/features/project/sprints/sprint-signals-bar";
import { SprintInsightsTab } from "@/features/project/sprints/sprint-insights-tab";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useCurrentUser } from "@/context/current-user-context";

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
  const searchString = useSearch();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const tabFromUrl = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return params.get("tab") || "plan";
  }, [searchString]);

  const [activeTab, setActiveTab] = useState<string>(tabFromUrl);

  useEffect(() => {
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl, activeTab]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setLocation(`/projects/${projectId}/sprints/${sprintId}?tab=${newTab}`);
  };

  const { data: project } = useProject(projectId);
  const { data: allSprints, update: updateSprint, remove: deleteSprint } = useSprints();
  const { data: allTasks, update: updateTask, create: createTask } = useTasks();
  const { data: users } = useUsers();
  const { data: allEpics } = useEpics();
  const { data: allMilestones } = useMilestones();
  const { data: allDeliverables } = useDeliverables();
  const { data: allStages } = useProjectStages();

  const scopeTargets = useSprintScopeTargets(sprintId);
  const { data: suggestedTasks = [], isLoading: loadingSuggested } = useSuggestedTasks(sprintId);
  const { data: taskTypes } = useResolvedTaskTypes(projectId);
  const { statuses: taskStatuses, statusLabels, getStatusColor, defaultStatus, isNotStartedStatus, isInProgressStatus, isCompletedStatus } = useTaskStatuses();

  const addCommentMutation = useMutation({
    mutationFn: async ({ taskId, comment, authorId, authorName }: { taskId: string; comment: string; authorId: string; authorName: string }) => {
      const response = await apiRequest("POST", `/api/comments`, {
        taskId,
        body: comment,
        authorId,
        authorName,
      });
      return response.json();
    },
  });

  const formattedStatusOptions = useMemo(() => 
    taskStatuses.map((s) => ({ id: s.id, label: s.label, color: s.color })),
    [taskStatuses]
  );

  const handleStatusChange = (taskId: string, newStatus: string) => {
    updateTask({ id: taskId, updates: { status: newStatus } });
  };

  const handleBlockedToggle = (taskId: string, blocked: boolean) => {
    updateTask({ id: taskId, updates: { blocked } });
  };

  const handleDueDateChange = (taskId: string, date: Date | null) => {
    const deadline = date ? formatDate(date, "yyyy-MM-dd") : undefined;
    updateTask({ id: taskId, updates: { deadline } });
  };

  const handleAddComment = (taskId: string, comment: string) => {
    if (currentUser?.id && currentUser?.name) {
      addCommentMutation.mutate({ taskId, comment, authorId: currentUser.id, authorName: currentUser.name });
    }
  };

  const handleAssigneeChange = (taskId: string, assigneeId: string | null) => {
    updateTask({ id: taskId, updates: { assigneeId } });
  };

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
  const [isEditingCapacity, setIsEditingCapacity] = useState(false);
  const [editCapacity, setEditCapacity] = useState("");
  const [showAddTasksDialog, setShowAddTasksDialog] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeMode, setScopeMode] = useState<"epic" | "milestone" | "stage" | null>(null);
  const [scopeSearch, setScopeSearch] = useState("");
  const [showSuggestedDrawer, setShowSuggestedDrawer] = useState(false);
  const [selectedSuggested, setSelectedSuggested] = useState<string[]>([]);
  const [showScopeModeChangeDialog, setShowScopeModeChangeDialog] = useState(false);
  const [pendingScopeMode, setPendingScopeMode] = useState<"epic" | "milestone" | "stage" | null>(null);
  const [planSubTab, setPlanSubTab] = useState<"tasks" | "scope" | "details">("scope");
  const [scopeDefSubTab, setScopeDefSubTab] = useState<"manual" | "matrix" | "rules">("rules");
  const [manualScopeSearch, setManualScopeSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [epicFilter, setEpicFilter] = useState<string>("all");
  const [milestoneFilter, setMilestoneFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [taskTypeFilter, setTaskTypeFilter] = useState<string>("all");
  const [showIncludedOnly, setShowIncludedOnly] = useState<boolean | null>(null);
  const [expandedRules, setExpandedRules] = useState<Record<string, boolean>>({});
  const [sprintScopeRules, setSprintScopeRules] = useState<any[]>([]);
  const [matrixAxis, setMatrixAxis] = useState<"epics" | "milestones">("epics");
  const [blockerDialogOpen, setBlockerDialogOpen] = useState(false);
  const [pendingBlockerTaskId, setPendingBlockerTaskId] = useState<string | null>(null);
  const [signalFilter, setSignalFilter] = useState<"blocked" | "overdue" | "stale" | null>(null);
  const [pulseCollapsed, setPulseCollapsed] = useState(false);
  const [goalMetricsOpen, setGoalMetricsOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<"title" | "effort" | null>(null);
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskEpicId, setNewTaskEpicId] = useState("");
  const [newTaskStageId, setNewTaskStageId] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const goalInputRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();

  const { data: pulseUpdates = [] } = useQuery({
    queryKey: ["sprint-pulse", sprintId],
    queryFn: async () => {
      const res = await fetch(`/api/sprints/${sprintId}/pulse`);
      if (!res.ok) throw new Error("Failed to fetch pulse updates");
      return res.json();
    },
    enabled: !!sprintId,
  });

  const postPulseMutation = useMutation({
    mutationFn: async (data: { didText: string; nextText: string; blockersText: string; referencedTaskIds: string[] }) => {
      const res = await fetch(`/api/sprints/${sprintId}/pulse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id,
          date: format(new Date(), "yyyy-MM-dd"),
          ...data,
        }),
      });
      if (!res.ok) throw new Error("Failed to post pulse update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprint-pulse", sprintId] });
      toast({ title: "Pulse update posted" });
    },
  });

  const isReadOnly = sprint?.status === "closed";
  const isPartiallyLocked = sprint?.status === "active";

  useEffect(() => {
    if (sprint) {
      setEditName(sprint.name || "");
      setEditGoal(sprint.goal || "");
      setEditStartDate(sprint.startDate || "");
      setEditEndDate(sprint.endDate || "");
      setEditCapacity(sprint.capacityHours?.toString() || "");
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
      toast({ title: "Sprint name updated" });
    }
    setIsEditingName(false);
  };

  const handleSaveGoal = () => {
    if (editGoal !== sprint?.goal) {
      updateSprint({ id: sprintId, updates: { goal: editGoal || null } });
      toast({ title: "Sprint goal updated" });
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
    toast({ title: "Sprint dates updated" });
  };

  const handleAutoStartToggle = async (checked: boolean) => {
    try {
      await fetch(`/api/sprints/${sprintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoStart: checked }),
      });
      updateSprint({ id: sprintId, updates: { autoStart: checked } });
      toast({ title: checked ? "Auto-start enabled" : "Auto-start disabled" });
    } catch (error: any) {
      toast({ title: "Failed to update auto-start setting", variant: "destructive" });
    }
  };

  const handleSaveCapacity = () => {
    const hours = parseInt(editCapacity) || null;
    updateSprint({ id: sprintId, updates: { capacityHours: hours } });
    setIsEditingCapacity(false);
    toast({ title: "Team capacity updated" });
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
      updateSprint({ id: sprintId, updates: { status: "closed", closedAt: new Date().toISOString() } });
      toast({ title: "Sprint closed" });
    } catch (error: any) {
      toast({ title: "Failed to close sprint", description: error.message, variant: "destructive" });
    }
  };

  const handleCloseSprintWithRollover = async () => {
    const response = await fetch(`/api/sprints/${sprintId}/close`, { method: "POST" });
    if (!response.ok) {
      const err = await response.json();
      toast({ title: "Failed to close sprint", description: err.error, variant: "destructive" });
      throw new Error(err.error);
    }
    updateSprint({ id: sprintId, updates: { status: "closed", closedAt: new Date().toISOString() } });
    queryClient.invalidateQueries({ queryKey: ["sprints"] });
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    toast({ title: "Sprint closed successfully" });
    setLocation(`/projects/${projectId}?tab=sprints`);
  };

  const handleNotesChange = async (notes: string) => {
    try {
      await fetch(`/api/sprints/${sprintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      updateSprint({ id: sprintId, updates: { notes } });
      toast({ title: "Sprint notes saved" });
    } catch (error: any) {
      toast({ title: "Failed to save notes", description: error.message, variant: "destructive" });
    }
  };

  const handleRolloverTasks = async (decisions: { taskId: string; action: string; targetSprintId?: string }[]) => {
    const nextSprint = projectSprints
      .filter((s: any) => s.id !== sprintId && s.status === "planned")
      .sort((a: any, b: any) => (a.startDate || "").localeCompare(b.startDate || ""))[0];

    for (const decision of decisions) {
      let response: Response;
      if (decision.action === "next_sprint") {
        const targetId = decision.targetSprintId || nextSprint?.id;
        if (targetId) {
          response = await fetch(`/api/tasks/${decision.taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sprintId: targetId }),
          });
          if (!response.ok) {
            toast({ title: "Failed to rollover tasks", description: "Could not move task to next sprint", variant: "destructive" });
            throw new Error("Failed to move task to next sprint");
          }
          updateTask({ id: decision.taskId, updates: { sprintId: targetId } });
        } else {
          response = await fetch(`/api/tasks/${decision.taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sprintId: null }),
          });
          if (!response.ok) {
            toast({ title: "Failed to rollover tasks", description: "Could not move task to backlog", variant: "destructive" });
            throw new Error("Failed to move task to backlog");
          }
          updateTask({ id: decision.taskId, updates: { sprintId: null } });
        }
      } else if (decision.action === "backlog") {
        response = await fetch(`/api/tasks/${decision.taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sprintId: null }),
        });
        if (!response.ok) {
          toast({ title: "Failed to rollover tasks", description: "Could not move task to backlog", variant: "destructive" });
          throw new Error("Failed to move task to backlog");
        }
        updateTask({ id: decision.taskId, updates: { sprintId: null } });
      } else if (decision.action === "close") {
        response = await fetch(`/api/tasks/${decision.taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Done", sprintId: null }),
        });
        if (!response.ok) {
          toast({ title: "Failed to rollover tasks", description: "Could not close task", variant: "destructive" });
          throw new Error("Failed to close task");
        }
        updateTask({ id: decision.taskId, updates: { status: "Done", sprintId: null } });
      }
    }
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };

  const handleAddTasks = async () => {
    if (selectedTasks.length === 0) return;
    try {
      await fetch(`/api/sprints/${sprintId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: selectedTasks })
      });
      const updates: any = { sprintId };
      if (sprint?.endDate) {
        updates.dueDate = sprint.endDate;
      }
      selectedTasks.forEach(taskId => {
        updateTask({ id: taskId, updates });
      });
      setSelectedTasks([]);
      setShowAddTasksDialog(false);
      toast({ title: `${selectedTasks.length} task(s) added to sprint` });
    } catch (error: any) {
      toast({ title: "Failed to add tasks", description: error.message, variant: "destructive" });
    }
  };

  const handleCreateNewTask = async () => {
    if (!newTaskTitle.trim() || !newTaskEpicId || !newTaskStageId) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    try {
      const newTask = {
        title: newTaskTitle,
        epicId: newTaskEpicId,
        stageId: newTaskStageId,
        projectId,
        sprintId,
        status: defaultStatus,
        deadline: sprint?.endDate || null,
      };
      await createTask(newTask);
      setShowCreateTaskDialog(false);
      setNewTaskTitle("");
      setNewTaskEpicId("");
      setNewTaskStageId("");
      toast({ title: "Task created and added to sprint" });
    } catch (error: any) {
      toast({ title: "Failed to create task", description: error.message, variant: "destructive" });
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

  const handleDeleteSprint = async () => {
    if (!confirm("Are you sure you want to delete this sprint? This action cannot be undone.")) return;
    try {
      await fetch(`/api/sprints/${sprintId}`, { method: "DELETE" });
      deleteSprint(sprintId);
      toast({ title: "Sprint deleted" });
      setLocation(`/projects/${projectId}?tab=sprints`);
    } catch (error: any) {
      toast({ title: "Failed to delete sprint", description: error.message, variant: "destructive" });
    }
  };

  const handleTaskMove = async (taskId: string, newStatus: string, blockerReason?: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === "Blocked") {
        updates.blocked = true;
        updates.blockerReason = blockerReason || null;
      } else {
        updates.blocked = false;
        updates.blockerReason = null;
      }
      updates.updatedAt = new Date().toISOString();
      
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      updateTask({ id: taskId, updates });
      toast({ title: `Task moved to ${newStatus}` });
    } catch (error: any) {
      toast({ title: "Failed to move task", description: error.message, variant: "destructive" });
    }
  };

  const handleBlockerRequested = (taskId: string) => {
    setPendingBlockerTaskId(taskId);
    setBlockerDialogOpen(true);
  };

  const handleBlockerConfirm = (reason: string) => {
    if (pendingBlockerTaskId) {
      handleTaskMove(pendingBlockerTaskId, "Blocked", reason);
    }
    setBlockerDialogOpen(false);
    setPendingBlockerTaskId(null);
  };

  const handleBlockerCancel = () => {
    setBlockerDialogOpen(false);
    setPendingBlockerTaskId(null);
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
    const toDo = sprintTasks.filter((t: any) => t.status === "To Do" || t.status === "Pending").length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    const totalEffort = sprintTasks.reduce((sum: number, t: any) => sum + (t.effort || 0), 0);
    const doneEffort = sprintTasks.filter((t: any) => t.status === "Done" || t.status === "Completed")
      .reduce((sum: number, t: any) => sum + (t.effort || 0), 0);
    return { total, done, inProgress, toDo, percent, totalEffort, doneEffort };
  }, [sprintTasks]);

  const linkedEpics = useMemo(() => {
    const epicIds = new Set(sprintTasks.map((t: any) => t.epicId).filter(Boolean));
    return (allEpics || []).filter((e: any) => epicIds.has(e.id));
  }, [sprintTasks, allEpics]);

  const linkedMilestones = useMemo(() => {
    const milestoneIds = new Set(sprintTasks.map((t: any) => t.milestoneId).filter(Boolean));
    return (allMilestones || []).filter((m: any) => milestoneIds.has(m.id));
  }, [sprintTasks, allMilestones]);

  // Scope Planner data
  const projectDeliverables = useMemo(() => 
    (allDeliverables || []).filter((d: any) => d.projectId === projectId),
    [allDeliverables, projectId]
  );

  const projectDeliverableIds = useMemo(() => 
    new Set(projectDeliverables.map((d: any) => d.id)),
    [projectDeliverables]
  );

  const projectEpics = useMemo(() => 
    (allEpics || []).filter((e: any) => projectDeliverableIds.has(e.deliverableId)),
    [allEpics, projectDeliverableIds]
  );

  const projectMilestones = useMemo(() => 
    (allMilestones || []).filter((m: any) => m.projectId === projectId),
    [allMilestones, projectId]
  );

  const projectStages = useMemo(() => 
    (allStages || []).filter((s: any) => s.projectId === projectId),
    [allStages, projectId]
  );

  // Derive current scope mode from existing targets
  const currentScopeMode = useMemo(() => {
    if (scopeTargets.data.length === 0) return null;
    return scopeTargets.data[0].targetType as "epic" | "milestone" | "stage";
  }, [scopeTargets.data]);

  // Get selected target IDs for current mode
  const selectedScopeIds = useMemo(() => 
    scopeTargets.data.map((t: any) => t.targetId),
    [scopeTargets.data]
  );

  // Filter entities based on search
  const filteredScopeEntities = useMemo(() => {
    const mode = scopeMode || currentScopeMode;
    if (!mode) return [];

    let entities: any[] = [];
    if (mode === "epic") entities = projectEpics;
    else if (mode === "milestone") entities = projectMilestones;
    else if (mode === "stage") entities = projectStages;

    if (!scopeSearch) return entities;
    const q = scopeSearch.toLowerCase();
    return entities.filter((e: any) => 
      (e.name || e.title || "").toLowerCase().includes(q)
    );
  }, [scopeMode, currentScopeMode, projectEpics, projectMilestones, projectStages, scopeSearch]);

  // Handle scope mode change
  const handleScopeModeChange = async (newMode: "epic" | "milestone" | "stage") => {
    // If there are existing targets and we're switching to a different mode
    if (currentScopeMode && currentScopeMode !== newMode && scopeTargets.data.length > 0) {
      // On active sprints, show confirmation dialog
      if (sprint?.status === "active") {
        setPendingScopeMode(newMode);
        setShowScopeModeChangeDialog(true);
        return;
      }
      // On planned sprints, just clear and switch
      await scopeTargets.clearAllTargetsAsync();
    }
    setScopeMode(newMode);
  };

  // Confirm scope mode change (after dialog confirmation)
  const handleConfirmScopeModeChange = async () => {
    if (pendingScopeMode) {
      await scopeTargets.clearAllTargetsAsync();
      setScopeMode(pendingScopeMode);
      setPendingScopeMode(null);
      setShowScopeModeChangeDialog(false);
      toast({ title: "Scope mode changed", description: "Previous selections have been cleared." });
    }
  };

  // Handle adding/removing scope target
  const handleToggleScopeTarget = async (targetId: string) => {
    const mode = scopeMode || currentScopeMode;
    if (!mode) return;

    const existingTarget = scopeTargets.data.find((t: any) => t.targetId === targetId);
    if (existingTarget) {
      await scopeTargets.removeTargetAsync(existingTarget.id);
    } else {
      await scopeTargets.addTargetAsync({ targetType: mode, targetId });
    }
  };

  // Handle adding suggested tasks to sprint
  const handleAddSuggestedTasks = async () => {
    if (selectedSuggested.length === 0) return;
    try {
      await fetch(`/api/sprints/${sprintId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: selectedSuggested })
      });
      selectedSuggested.forEach(taskId => {
        updateTask({ id: taskId, updates: { sprintId } });
      });
      setSelectedSuggested([]);
      setShowSuggestedDrawer(false);
      toast({ title: `${selectedSuggested.length} task(s) added to sprint` });
    } catch (error: any) {
      toast({ title: "Failed to add tasks", description: error.message, variant: "destructive" });
    }
  };

  // Calculate sprint tasks that match the current scope
  const scopedSprintTasks = useMemo(() => {
    if (!scopeTargets.data.length || !sprintTasks.length) return [];
    const mode = currentScopeMode;
    const targetIds = new Set(selectedScopeIds);
    
    return sprintTasks.filter((task: any) => {
      if (mode === "epic") return targetIds.has(task.epicId);
      if (mode === "milestone") return targetIds.has(task.milestoneId);
      if (mode === "stage") return targetIds.has(task.stageId);
      return false;
    });
  }, [scopeTargets.data, sprintTasks, currentScopeMode, selectedScopeIds]);

  // Get entity name by ID
  const getScopeEntityName = (targetType: string, targetId: string) => {
    if (targetType === "epic") {
      const epic = projectEpics.find((e: any) => e.id === targetId);
      return epic?.title || epic?.name || "Unknown Epic";
    } else if (targetType === "milestone") {
      const ms = projectMilestones.find((m: any) => m.id === targetId);
      return ms?.title || ms?.name || "Unknown Milestone";
    } else if (targetType === "stage") {
      const stage = projectStages.find((s: any) => s.id === targetId);
      return stage?.name || "Unknown Stage";
    }
    return "Unknown";
  };

  // Get stage name for scope definition
  const getStageName = (stageId: string) => {
    const stage = projectStages.find((s: any) => s.id === stageId);
    return stage?.label || stage?.name || stageId;
  };

  // Get milestone name
  const getMilestoneName = (milestoneId?: string) => {
    if (!milestoneId) return "No Milestone";
    const milestone = projectMilestones.find((m: any) => m.id === milestoneId);
    return milestone?.title || milestone?.name || "Unknown Milestone";
  };

  // Project tasks (for scope definition)
  const projectTasks = useMemo(() => 
    (allTasks || []).filter((t: any) => t.projectId === projectId || t.project === projectId),
    [allTasks, projectId]
  );

  // Evaluate a scope rule
  const evaluateRule = useCallback((rule: any): any[] => {
    if (!rule.active) return [];
    
    return projectTasks.filter(task => {
      if (rule.stage && rule.stage !== "all" && task.stageId !== rule.stage) {
        return false;
      }
      
      // Filter by milestone
      if (rule.milestone && rule.milestone !== "all" && task.milestoneId !== rule.milestone) {
        return false;
      }
      
      const epic = projectEpics.find((e: any) => e.id === task.epicId);
      if (rule.epicType && rule.epicType !== "all") {
        const epicType = epic?.type || epic?.epicType || "";
        if (epicType !== rule.epicType) {
          return false;
        }
      }
      
      if (rule.taskTemplateKey && rule.taskTemplateKey !== "all") {
        const taskType = task.templateKey || task.type || "";
        if (!taskType.toLowerCase().includes(rule.taskTemplateKey.toLowerCase())) {
          return false;
        }
      }
      
      return true;
    });
  }, [projectTasks, projectEpics]);

  // All matched tasks by rule
  const allMatchedTasksByRule = useMemo(() => {
    const result: Record<string, any[]> = {};
    sprintScopeRules.forEach((rule: any) => {
      result[rule.id] = evaluateRule(rule);
    });
    return result;
  }, [sprintScopeRules, evaluateRule]);

  // All matched tasks from all rules
  const allMatchedTasks = useMemo(() => {
    const taskSet = new Set<string>();
    Object.values(allMatchedTasksByRule).forEach((matchedTasks: any[]) => {
      matchedTasks.forEach(t => taskSet.add(t.id));
    });
    return projectTasks.filter(t => taskSet.has(t.id));
  }, [allMatchedTasksByRule, projectTasks]);

  // Tasks in sprint IDs
  const sprintTaskIds = useMemo(() => 
    sprintTasks.map((t: any) => t.id),
    [sprintTasks]
  );

  // Pending tasks (matched by rules but not in sprint)
  const pendingRuleTasks = useMemo(() => {
    return allMatchedTasks.filter(t => !sprintTaskIds.includes(t.id));
  }, [allMatchedTasks, sprintTaskIds]);

  // Already in sprint from rules
  const alreadyInSprintFromRules = useMemo(() => {
    return allMatchedTasks.filter(t => sprintTaskIds.includes(t.id));
  }, [allMatchedTasks, sprintTaskIds]);

  // Helper to check if a task's deadline is outside sprint dates
  const isDeadlineOutsideSprint = (taskDeadline?: string) => {
    if (!taskDeadline || !sprint) return false;
    const deadline = new Date(taskDeadline);
    const sprintStart = sprint.startDate ? new Date(sprint.startDate) : null;
    const sprintEnd = sprint.endDate ? new Date(sprint.endDate) : null;
    
    if (sprintStart && deadline < sprintStart) return true;
    if (sprintEnd && deadline > sprintEnd) return true;
    return false;
  };

  // Filtered tasks for manual adjustments tab
  const filteredManualTasks = useMemo(() => {
    return projectTasks.filter(t => {
      const epic = projectEpics.find((e: any) => e.id === t.epicId);
      const epicName = epic?.title || "";
      const milestone = projectMilestones.find((m: any) => m.id === t.milestoneId);
      const milestoneName = milestone?.title || milestone?.name || "";
      const searchLower = manualScopeSearch.toLowerCase();
      const matchesSearch = !manualScopeSearch || 
        t.title?.toLowerCase().includes(searchLower) || 
        epicName.toLowerCase().includes(searchLower) ||
        milestoneName.toLowerCase().includes(searchLower);
      
      const matchesStage = stageFilter === "all" || t.stageId === stageFilter;
      const matchesEpic = epicFilter === "all" || t.epicId === epicFilter;
      const matchesMilestone = milestoneFilter === "all" || t.milestoneId === milestoneFilter;
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      const matchesTaskType = taskTypeFilter === "all" || t.taskTypeId === taskTypeFilter;
      
      const isInSprint = sprintTaskIds.includes(t.id);
      const matchesIncludedFilter = showIncludedOnly === null || 
        (showIncludedOnly === true && isInSprint) || 
        (showIncludedOnly === false && !isInSprint);
      
      return matchesSearch && matchesStage && matchesEpic && matchesMilestone && matchesStatus && matchesTaskType && matchesIncludedFilter;
    });
  }, [projectTasks, projectEpics, projectMilestones, manualScopeSearch, stageFilter, epicFilter, milestoneFilter, statusFilter, taskTypeFilter, showIncludedOnly, sprintTaskIds]);

  // Toggle task in/out of sprint
  const handleToggleTaskInSprint = async (taskId: string) => {
    const isInSprint = sprintTaskIds.includes(taskId);
    const task = projectTasks.find((t: any) => t.id === taskId);
    
    if (isInSprint) {
      // Remove from sprint
      updateTask({ id: taskId, updates: { sprintId: null } });
      toast({ title: "Task removed from sprint" });
    } else {
      // Add to sprint - set default deadline to sprint end date if no deadline exists
      const updates: any = { sprintId };
      if (!task?.deadline && sprint?.endDate) {
        updates.deadline = sprint.endDate;
      }
      updateTask({ id: taskId, updates });
      
      // Show warning if deadline is outside sprint
      if (task?.deadline && isDeadlineOutsideSprint(task.deadline)) {
        toast({ 
          title: "Task added to sprint", 
          description: "Warning: Task deadline is outside sprint dates.",
          variant: "destructive"
        });
      } else {
        toast({ title: "Task added to sprint" });
      }
    }
  };

  // Toggle all tasks in a cell (epic + stage) for matrix view
  const handleToggleCellTasks = (epicId: string, stageId: string) => {
    const cellTasks = projectTasks.filter((t: any) => t.epicId === epicId && t.stageId === stageId);
    if (cellTasks.length === 0) return;

    const unlinkedTasks = cellTasks.filter((t: any) => !sprintTaskIds.includes(t.id));
    
    if (unlinkedTasks.length > 0) {
      // Add all to sprint
      unlinkedTasks.forEach((t: any) => {
        updateTask({ id: t.id, updates: { sprintId } });
      });
      toast({ title: `Added ${unlinkedTasks.length} task(s) to sprint` });
    } else {
      // Remove all from sprint
      cellTasks.forEach((t: any) => {
        updateTask({ id: t.id, updates: { sprintId: null } });
      });
      toast({ title: `Removed ${cellTasks.length} task(s) from sprint` });
    }
  };

  // Get cell task counts for matrix view (supports both epic and milestone axis)
  const getCellTaskCounts = (rowId: string, stageId: string, axis: "epics" | "milestones" = "epics") => {
    const cellTasks = projectTasks.filter((t: any) => {
      if (axis === "epics") {
        return t.epicId === rowId && t.stageId === stageId;
      } else {
        return t.milestoneId === rowId && t.stageId === stageId;
      }
    });
    const inSprint = cellTasks.filter((t: any) => sprintTaskIds.includes(t.id)).length;
    return { total: cellTasks.length, inSprint };
  };

  // Toggle all tasks in a cell for matrix view (supports both epic and milestone axis)
  const handleToggleCellTasksGeneric = (rowId: string, stageId: string, axis: "epics" | "milestones") => {
    const cellTasks = projectTasks.filter((t: any) => {
      if (axis === "epics") {
        return t.epicId === rowId && t.stageId === stageId;
      } else {
        return t.milestoneId === rowId && t.stageId === stageId;
      }
    });
    if (cellTasks.length === 0) return;

    const unlinkedTasks = cellTasks.filter((t: any) => !sprintTaskIds.includes(t.id));
    
    if (unlinkedTasks.length > 0) {
      unlinkedTasks.forEach((t: any) => {
        updateTask({ id: t.id, updates: { sprintId } });
      });
      toast({ title: `Added ${unlinkedTasks.length} task(s) to sprint` });
    } else {
      cellTasks.forEach((t: any) => {
        updateTask({ id: t.id, updates: { sprintId: null } });
      });
      toast({ title: `Removed ${cellTasks.length} task(s) from sprint` });
    }
  };

  // Add a new scope rule
  const handleAddRule = () => {
    const newRule = {
      id: `r-${Date.now()}`,
      label: "New Scope Rule",
      active: true,
      stage: "all",
      milestone: "all",
      epicType: "all",
      taskTemplateKey: "all"
    };
    setSprintScopeRules([...sprintScopeRules, newRule]);
    setExpandedRules(prev => ({ ...prev, [newRule.id]: true }));
  };

  // Delete a scope rule
  const handleDeleteRule = (ruleId: string) => {
    setSprintScopeRules(sprintScopeRules.filter((r: any) => r.id !== ruleId));
  };

  // Update a scope rule
  const handleUpdateRule = (ruleId: string, updates: any) => {
    setSprintScopeRules(sprintScopeRules.map((r: any) => r.id === ruleId ? { ...r, ...updates } : r));
  };

  // Toggle rule active state
  const handleToggleRuleActive = (ruleId: string, newActive: boolean) => {
    handleUpdateRule(ruleId, { active: newActive });
    
    if (!newActive) {
      const rule = sprintScopeRules.find((r: any) => r.id === ruleId);
      if (!rule) return;
      
      const tasksMatchedByThisRule = evaluateRule({ ...rule, active: true });
      const tasksMatchedByOtherActiveRules = new Set<string>();
      
      sprintScopeRules.forEach((r: any) => {
        if (r.id !== ruleId && r.active) {
          evaluateRule(r).forEach(t => tasksMatchedByOtherActiveRules.add(t.id));
        }
      });
      
      const tasksToRemove = tasksMatchedByThisRule.filter(t => 
        !tasksMatchedByOtherActiveRules.has(t.id) && sprintTaskIds.includes(t.id)
      );
      
      if (tasksToRemove.length > 0) {
        tasksToRemove.forEach(t => {
          updateTask({ id: t.id, updates: { sprintId: null } });
        });
        toast({ 
          title: "Rule Disabled", 
          description: `Removed ${tasksToRemove.length} task(s) from sprint.` 
        });
      }
    }
  };

  // Apply all rules - add matched tasks to sprint
  const handleApplyRules = () => {
    if (pendingRuleTasks.length === 0) {
      toast({ 
        title: "No Changes", 
        description: "All matched tasks are already in this sprint." 
      });
      return;
    }

    pendingRuleTasks.forEach(t => {
      updateTask({ id: t.id, updates: { sprintId } });
    });
    
    toast({ 
      title: "Rules Applied", 
      description: `Added ${pendingRuleTasks.length} task(s) to sprint.` 
    });
  };

  // Toggle rule expanded state
  const toggleRuleExpanded = (ruleId: string) => {
    setExpandedRules(prev => ({ ...prev, [ruleId]: !prev[ruleId] }));
  };

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
  const ownerUser = getUser(sprint.ownerUserId);

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={cn("p-3 rounded-lg", statusConfig.bgColor)}>
              <Zap className={cn("h-6 w-6", statusConfig.color)} />
            </div>
            <div className="space-y-1">
              {isEditingName && !isReadOnly ? (
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
                  className={cn(
                    "text-2xl font-bold tracking-tight group flex items-center gap-2",
                    !isReadOnly && "cursor-pointer hover:text-primary"
                  )}
                  onClick={() => !isReadOnly && setIsEditingName(true)}
                  data-testid="text-sprint-name"
                >
                  {sprint.name}
                  {!isReadOnly && <Pencil className="h-4 w-4 opacity-0 group-hover:opacity-100 text-muted-foreground" />}
                </h1>
              )}
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Badge variant="outline" className={cn(statusConfig.bgColor, statusConfig.color, "border-0")}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                {isEditingDates && !isReadOnly ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      <Input
                        type="date"
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                        className="h-7 w-32 text-xs"
                        data-testid="input-edit-start-date"
                      />
                      <span className="text-xs">–</span>
                      <Input
                        type="date"
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                        className="h-7 w-32 text-xs"
                        data-testid="input-edit-end-date"
                      />
                    </div>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSaveDates} data-testid="button-save-dates">
                      <Check className="h-3 w-3 text-green-600" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsEditingDates(false)} data-testid="button-cancel-dates">
                      <X className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <div 
                    className={cn(
                      "flex items-center gap-1.5 group",
                      !isReadOnly && "cursor-pointer hover:text-primary"
                    )}
                    onClick={() => {
                      if (!isReadOnly) {
                        setEditStartDate(sprint.startDate || "");
                        setEditEndDate(sprint.endDate || "");
                        setIsEditingDates(true);
                      }
                    }}
                    data-testid="text-sprint-dates"
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    <span>
                      {sprint.startDate ? format(new Date(sprint.startDate), "MMM d") : "No start"} – {sprint.endDate ? format(new Date(sprint.endDate), "MMM d, yyyy") : "No end"}
                    </span>
                    {!isReadOnly && <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100" />}
                  </div>
                )}
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

        {sprint.status === "planned" && sprint.startDate && new Date(sprint.startDate) <= new Date() && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg" data-testid="banner-ready-to-start">
            <Play className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <div className="font-medium text-blue-800">Sprint is ready to start</div>
              <div className="text-sm text-blue-600">
                The start date ({format(new Date(sprint.startDate), "MMM d, yyyy")}) has been reached. Click "Start Sprint" to begin.
              </div>
            </div>
            <Button size="sm" onClick={handleStartSprint} data-testid="banner-button-start">
              <Play className="h-4 w-4 mr-1" />
              Start Now
            </Button>
          </div>
        )}

        {sprint.status === "active" && sprint.endDate && new Date(sprint.endDate) < new Date() && (
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg" data-testid="banner-needs-closure">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div className="flex-1">
              <div className="font-medium text-amber-800">Sprint end date has passed</div>
              <div className="text-sm text-amber-600">
                This sprint was scheduled to end on {format(new Date(sprint.endDate), "MMM d, yyyy")}. Consider closing it.
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={() => handleTabChange("insights")} data-testid="banner-button-close">
              <Square className="h-4 w-4 mr-1" />
              Review & Close
            </Button>
          </div>
        )}

        <Collapsible open={goalMetricsOpen} onOpenChange={setGoalMetricsOpen}>
          <div className="border rounded-lg bg-card">
            <CollapsibleTrigger asChild>
              <button className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  {goalMetricsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="font-medium">Sprint Goal & Metrics</span>
                </div>
                {!goalMetricsOpen && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{stats.done}/{stats.total} tasks</span>
                    <span>{stats.percent}% complete</span>
                  </div>
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 pt-0 border-t">
                {/* Goal & Success Criteria - Left Side */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Sprint Goal</h3>
                    {!isEditingGoal && !isReadOnly && (
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingGoal(true)} data-testid="button-edit-goal">
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {isEditingGoal && !isReadOnly ? (
                    <div className="space-y-2">
                      <Textarea
                        ref={goalInputRef}
                        value={editGoal}
                        onChange={(e) => setEditGoal(e.target.value)}
                        placeholder="What do you want to achieve in this sprint? Include success criteria."
                        className="min-h-[100px]"
                        data-testid="input-edit-goal"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveGoal} data-testid="button-save-goal">Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setIsEditingGoal(false)} data-testid="button-cancel-goal">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {sprint.goal || "No goal set for this sprint. Define what you want to achieve."}
                    </p>
                  )}
                </div>

                {/* Metrics - Right Side */}
                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Sprint Metrics</h3>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold">{stats.total}</div>
                      <div className="text-xs text-muted-foreground">Total Tasks</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stats.done}</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                      <div className="text-xs text-muted-foreground">In Progress</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-slate-600">{stats.toDo}</div>
                      <div className="text-xs text-muted-foreground">To Do</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold">{stats.percent}%</div>
                      <div className="text-xs text-muted-foreground">Progress</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold">{stats.totalEffort}</div>
                      <div className="text-xs text-muted-foreground">Story Points</div>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
            <TabsTrigger 
              value="plan" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
              data-testid="tab-plan"
            >
              <Target className="h-4 w-4 mr-2" />
              Plan
            </TabsTrigger>
            <TabsTrigger 
              value="run" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
              data-testid="tab-run"
            >
              <Play className="h-4 w-4 mr-2" />
              Run
            </TabsTrigger>
            <TabsTrigger 
              value="insights" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
              data-testid="tab-insights"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Insights
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
              data-testid="tab-settings"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plan" className="mt-6">
            {/* Sub-navigation tabs matching Milestone pattern */}
            <Tabs value={planSubTab} onValueChange={(v) => setPlanSubTab(v as "tasks" | "scope" | "details")} className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-lg mb-6">
                <TabsTrigger value="scope" className="gap-2" data-testid="subtab-scope">
                  <SlidersHorizontal className="h-4 w-4" />
                  Scope Definition
                </TabsTrigger>
                <TabsTrigger value="tasks" className="gap-2" data-testid="subtab-tasks">
                  <ListTodo className="h-4 w-4" />
                  Tasks
                </TabsTrigger>
                <TabsTrigger value="details" className="gap-2" data-testid="subtab-details">
                  <FileText className="h-4 w-4" />
                  Details
                </TabsTrigger>
              </TabsList>

              {/* Tasks Sub-Tab */}
              <TabsContent value="tasks" className="mt-0">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Sprint Backlog</CardTitle>
                      {!isReadOnly && (
                        <Button size="sm" onClick={() => setShowAddTasksDialog(true)} data-testid="button-add-tasks">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Tasks
                        </Button>
                      )}
                    </div>
                    <CardDescription>
                      {stats.total} tasks committed, {stats.totalEffort} story points
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sprintTasks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Target className="h-8 w-8 mx-auto mb-2" />
                        <p>No tasks in this sprint yet.</p>
                        {!isReadOnly && (
                          <Button variant="link" onClick={() => setShowAddTasksDialog(true)}>
                            Add tasks from backlog
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[30%]">Task</TableHead>
                            <TableHead>Epic</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Effort</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Assignee</TableHead>
                            {!isReadOnly && <TableHead className="w-[80px]"></TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sprintTasks.map((task: any) => {
                            const taskStatus = TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG["Pending"];
                            const TaskStatusIcon = taskStatus.icon;
                            const assignee = getUser(task.assigneeId || task.assignee);
                            const epic = getEpic(task.epicId);
                            const isOutsideSprint = isDeadlineOutsideSprint(task.deadline);

                            return (
                              <TableRow key={task.id} data-testid={`row-task-${task.id}`} className={cn(isOutsideSprint && "bg-amber-50")}>
                                <TableCell>
                                  {!isReadOnly && editingTaskId === task.id && editingField === "title" ? (
                                    <Input
                                      autoFocus
                                      defaultValue={task.title || task.name}
                                      className="h-8"
                                      onBlur={(e) => {
                                        if (e.target.value !== (task.title || task.name)) {
                                          updateTask({ id: task.id, updates: { title: e.target.value } });
                                        }
                                        setEditingTaskId(null);
                                        setEditingField(null);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.currentTarget.blur();
                                        } else if (e.key === "Escape") {
                                          setEditingTaskId(null);
                                          setEditingField(null);
                                        }
                                      }}
                                      data-testid={`input-task-title-${task.id}`}
                                    />
                                  ) : (
                                    <div 
                                      className={cn("font-medium", !isReadOnly && "cursor-pointer hover:text-primary")}
                                      onClick={() => !isReadOnly && (setEditingTaskId(task.id), setEditingField("title"))}
                                    >
                                      {task.title || task.name}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {epic ? (
                                    <Link href={`/projects/${projectId}/epics/${epic.id}`}>
                                      <Badge variant="outline" className="font-normal hover:bg-muted cursor-pointer">
                                        {epic.title || epic.name}
                                      </Badge>
                                    </Link>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {!isReadOnly ? (
                                    <Select
                                      value={task.status}
                                      onValueChange={(value) => updateTask({ id: task.id, updates: { status: value } })}
                                    >
                                      <SelectTrigger className="h-7 w-[130px] border-0 bg-transparent p-0">
                                        {(() => {
                                          const statusOption = formattedStatusOptions.find((s: any) => s.label === task.status);
                                          const colorClass = statusOption?.color || taskStatus.bgColor + " " + taskStatus.color;
                                          return (
                                            <Badge variant="outline" className={cn(colorClass, "border-0 cursor-pointer")}>
                                              <TaskStatusIcon className="h-3 w-3 mr-1" />
                                              {statusOption?.label || task.status}
                                            </Badge>
                                          );
                                        })()}
                                      </SelectTrigger>
                                      <SelectContent>
                                        {formattedStatusOptions.map((status: any) => (
                                          <SelectItem key={status.id} value={status.label}>
                                            <div className="flex items-center gap-2">
                                              <span className={cn("w-2 h-2 rounded-full", status.color?.split(" ")[0] || "bg-gray-200")} />
                                              {status.label}
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Badge variant="outline" className={cn(taskStatus.bgColor, taskStatus.color, "border-0")}>
                                      <TaskStatusIcon className="h-3 w-3 mr-1" />
                                      {task.status}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {!isReadOnly && editingTaskId === task.id && editingField === "effort" ? (
                                    <Input
                                      autoFocus
                                      type="number"
                                      defaultValue={task.effort || ""}
                                      className="h-8 w-16"
                                      onBlur={(e) => {
                                        const newValue = e.target.value ? parseInt(e.target.value) : null;
                                        if (newValue !== task.effort) {
                                          updateTask({ id: task.id, updates: { effort: newValue } });
                                        }
                                        setEditingTaskId(null);
                                        setEditingField(null);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.currentTarget.blur();
                                        } else if (e.key === "Escape") {
                                          setEditingTaskId(null);
                                          setEditingField(null);
                                        }
                                      }}
                                      data-testid={`input-task-effort-${task.id}`}
                                    />
                                  ) : (
                                    <span 
                                      className={cn("text-sm", !isReadOnly && "cursor-pointer hover:text-primary")}
                                      onClick={() => !isReadOnly && (setEditingTaskId(task.id), setEditingField("effort"))}
                                    >
                                      {task.effort || "-"}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {!isReadOnly ? (
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className={cn(
                                            "h-7 px-2 justify-start font-normal",
                                            isOutsideSprint && "text-amber-700 font-medium",
                                            !task.deadline && "text-muted-foreground"
                                          )}
                                        >
                                          <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                                          {task.deadline ? (
                                            <>
                                              {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                              {isOutsideSprint && (
                                                <AlertTriangle className="h-3.5 w-3.5 ml-1 text-amber-600" />
                                              )}
                                            </>
                                          ) : (
                                            "Set date"
                                          )}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                          mode="single"
                                          selected={task.deadline ? new Date(task.deadline) : undefined}
                                          onSelect={(date) => {
                                            handleDueDateChange(task.id, date || null);
                                          }}
                                          initialFocus
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  ) : (
                                    <div className={cn(
                                      "flex items-center gap-1 text-sm",
                                      isOutsideSprint && "text-amber-700 font-medium"
                                    )}>
                                      {task.deadline ? (
                                        <>
                                          {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                          {isOutsideSprint && (
                                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                          )}
                                        </>
                                      ) : (
                                        <span className="text-muted-foreground">-</span>
                                      )}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {!isReadOnly ? (
                                    <Select
                                      value={task.assigneeId || task.assignee || "unassigned"}
                                      onValueChange={(value) => updateTask({ id: task.id, updates: { assigneeId: value === "unassigned" ? null : value } })}
                                    >
                                      <SelectTrigger className="h-7 w-[140px] border-0 bg-transparent p-0">
                                        {assignee ? (
                                          <div className="flex items-center gap-2">
                                            <Avatar className="h-5 w-5">
                                              <AvatarFallback className="text-xs">
                                                {assignee.name?.charAt(0) || assignee.username?.charAt(0) || "?"}
                                              </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm truncate">{assignee.name || assignee.username}</span>
                                          </div>
                                        ) : (
                                          <span className="text-muted-foreground text-sm">Unassigned</span>
                                        )}
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                        {(users || []).map((user: any) => (
                                          <SelectItem key={user.id} value={user.id}>
                                            <div className="flex items-center gap-2">
                                              <Avatar className="h-5 w-5">
                                                <AvatarFallback className="text-xs">
                                                  {user.name?.charAt(0) || user.username?.charAt(0) || "?"}
                                                </AvatarFallback>
                                              </Avatar>
                                              {user.name || user.username}
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : assignee ? (
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
                                {!isReadOnly && (
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Link href={`/projects/${projectId}/tasks/${task.id}`}>
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          className="h-7 w-7"
                                          data-testid={`button-view-task-${task.id}`}
                                        >
                                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                        </Button>
                                      </Link>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => handleRemoveTask(task.id)}
                                        data-testid={`button-remove-task-${task.id}`}
                                      >
                                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                )}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Details Sub-Tab */}
              <TabsContent value="details" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left column */}
                  <div className="space-y-6">
                    {/* Linked Entities */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <LinkIcon className="h-4 w-4" />
                          Linked Entities
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {linkedEpics.length > 0 ? (
                          <div>
                            <Label className="text-xs text-muted-foreground">Epics</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {linkedEpics.map((epic: any) => (
                                <Link key={epic.id} href={`/projects/${projectId}/epics/${epic.id}`}>
                                  <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                                    {epic.title || epic.name}
                                  </Badge>
                                </Link>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No epics linked to sprint tasks.</p>
                        )}
                        {linkedMilestones.length > 0 && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Milestones</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {linkedMilestones.map((milestone: any) => (
                                <Link key={milestone.id} href={`/projects/${projectId}/milestones/${milestone.id}`}>
                                  <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                                    {milestone.name}
                                  </Badge>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Progress */}
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

                  {/* Right column */}
                  <div className="space-y-6">
                    {/* Dates */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center justify-between">
                          Dates
                          {!isEditingDates && !isPartiallyLocked && !isReadOnly && (
                            <Button variant="ghost" size="sm" onClick={() => setIsEditingDates(true)} data-testid="button-edit-dates">
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isEditingDates && !isPartiallyLocked && !isReadOnly ? (
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
                            {isPartiallyLocked && (
                              <p className="text-xs text-muted-foreground italic mt-2">
                                Dates cannot be changed while sprint is active.
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Team Capacity */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center justify-between">
                          Team Capacity
                          {!isEditingCapacity && !isReadOnly && (
                            <Button variant="ghost" size="sm" onClick={() => setIsEditingCapacity(true)} data-testid="button-edit-capacity">
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isEditingCapacity && !isReadOnly ? (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs">Capacity (hours)</Label>
                              <Input
                                type="number"
                                value={editCapacity}
                                onChange={(e) => setEditCapacity(e.target.value)}
                                placeholder="e.g., 80"
                                data-testid="input-edit-capacity"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSaveCapacity} data-testid="button-save-capacity">Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setIsEditingCapacity(false)} data-testid="button-cancel-capacity">Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Hours</span>
                              <span>{sprint.capacityHours || "Not set"}</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Scope Definition Sub-Tab */}
              <TabsContent value="scope" className="mt-0">
                <div className="space-y-6">
                  {isReadOnly ? (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        <Target className="h-8 w-8 mx-auto mb-2" />
                        <p>Scope cannot be modified on closed sprints.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Tabs value={scopeDefSubTab} onValueChange={(v) => setScopeDefSubTab(v as any)} className="w-full">
                      <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                        <TabsTrigger 
                          value="rules" 
                          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2"
                          data-testid="subtab-rules"
                        >
                          <SlidersHorizontal className="w-4 h-4 mr-2" />
                          Rule-Based Scope
                          {pendingRuleTasks.length > 0 && (
                            <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700 text-xs">
                              {pendingRuleTasks.length} pending
                            </Badge>
                          )}
                        </TabsTrigger>
                        <TabsTrigger 
                          value="matrix"
                          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2"
                          data-testid="subtab-matrix"
                        >
                          <Layers className="w-4 h-4 mr-2" />
                          Coverage Matrix
                        </TabsTrigger>
                        <TabsTrigger 
                          value="manual"
                          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2"
                          data-testid="subtab-manual"
                        >
                          <ListTodo className="w-4 h-4 mr-2" />
                          Manual Adjustments
                        </TabsTrigger>
                      </TabsList>

                      <div className="mt-6">
                        {/* Manual Adjustments Tab */}
                        <TabsContent value="manual" className="space-y-4">
                          <div className="flex flex-col gap-3">
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="Search by task, epic, or milestone name..." 
                                  className="pl-9"
                                  value={manualScopeSearch}
                                  onChange={e => setManualScopeSearch(e.target.value)}
                                  data-testid="input-manual-scope-search"
                                />
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 items-center">
                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground whitespace-nowrap">Stage:</Label>
                                <SearchableSelect 
                                  value={stageFilter} 
                                  onValueChange={setStageFilter}
                                  className="h-8 w-[180px]"
                                  data-testid="select-stage-filter"
                                  placeholder="All Stages"
                                  options={[
                                    { value: "all", label: "All Stages" },
                                    ...projectStages.map((stage: any) => ({ value: stage.id, label: stage.label || stage.name }))
                                  ]}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground whitespace-nowrap">Epic:</Label>
                                <SearchableSelect 
                                  value={epicFilter} 
                                  onValueChange={setEpicFilter}
                                  className="h-8 w-[180px]"
                                  data-testid="select-epic-filter"
                                  placeholder="All Epics"
                                  options={[
                                    { value: "all", label: "All Epics" },
                                    ...projectEpics.map((epic: any) => ({ value: epic.id, label: epic.title || epic.name }))
                                  ]}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground whitespace-nowrap">Milestone:</Label>
                                <SearchableSelect 
                                  value={milestoneFilter} 
                                  onValueChange={setMilestoneFilter}
                                  className="h-8 w-[180px]"
                                  data-testid="select-milestone-filter"
                                  placeholder="All Milestones"
                                  options={[
                                    { value: "all", label: "All Milestones" },
                                    ...projectMilestones.map((ms: any) => ({ value: ms.id, label: ms.title || ms.name }))
                                  ]}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground whitespace-nowrap">Status:</Label>
                                <SearchableSelect 
                                  value={statusFilter} 
                                  onValueChange={setStatusFilter}
                                  className="h-8 w-[140px]"
                                  data-testid="select-status-filter"
                                  placeholder="All Statuses"
                                  options={[
                                    { value: "all", label: "All Statuses" },
                                    { value: "Todo", label: "Todo" },
                                    { value: "In Progress", label: "In Progress" },
                                    { value: "Review", label: "Review" },
                                    { value: "Done", label: "Done" }
                                  ]}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground whitespace-nowrap">Type:</Label>
                                <SearchableSelect 
                                  value={taskTypeFilter} 
                                  onValueChange={setTaskTypeFilter}
                                  className="h-8 w-[140px]"
                                  data-testid="select-tasktype-filter"
                                  placeholder="All Types"
                                  options={[
                                    { value: "all", label: "All Types" },
                                    ...(taskTypes || []).map((tt: any) => ({ value: tt.id, label: tt.name }))
                                  ]}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground whitespace-nowrap">Show:</Label>
                                <SearchableSelect 
                                  value={showIncludedOnly === null ? "all" : showIncludedOnly ? "included" : "excluded"} 
                                  onValueChange={(v) => setShowIncludedOnly(v === "all" ? null : v === "included")}
                                  className="h-8 w-[130px]"
                                  data-testid="select-included-filter"
                                  placeholder="All Tasks"
                                  options={[
                                    { value: "all", label: "All Tasks" },
                                    { value: "included", label: "In Sprint" },
                                    { value: "excluded", label: "Not In Sprint" }
                                  ]}
                                />
                              </div>
                              {(stageFilter !== "all" || epicFilter !== "all" || milestoneFilter !== "all" || statusFilter !== "all" || taskTypeFilter !== "all" || showIncludedOnly !== null || manualScopeSearch) && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 text-xs"
                                  onClick={() => {
                                    setStageFilter("all");
                                    setEpicFilter("all");
                                    setMilestoneFilter("all");
                                    setStatusFilter("all");
                                    setTaskTypeFilter("all");
                                    setShowIncludedOnly(null);
                                    setManualScopeSearch("");
                                  }}
                                  data-testid="button-clear-filters"
                                >
                                  Clear Filters
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="border rounded-md">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[50px]"></TableHead>
                                  <TableHead>Task</TableHead>
                                  <TableHead>Epic</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Due Date</TableHead>
                                  <TableHead className="text-right">In Sprint</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredManualTasks.slice(0, 50).map((task: any) => {
                                  const isInSprint = sprintTaskIds.includes(task.id);
                                  const epic = projectEpics.find((e: any) => e.id === task.epicId);
                                  const taskType = (taskTypes || []).find((tt: any) => tt.id === task.taskTypeId);
                                  const isOutsideSprint = isInSprint && isDeadlineOutsideSprint(task.deadline);

                                  return (
                                    <TableRow key={task.id} className={cn(isOutsideSprint && "bg-amber-50")}>
                                      <TableCell>
                                        <CheckSquare 
                                          className={cn(
                                            "h-4 w-4 cursor-pointer transition-colors", 
                                            isInSprint ? "text-primary" : "text-muted-foreground/30 hover:text-muted-foreground"
                                          )}
                                          onClick={() => handleToggleTaskInSprint(task.id)}
                                          data-testid={`toggle-task-${task.id}`}
                                        />
                                      </TableCell>
                                      <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                          {task.title || task.name}
                                          {taskType && (
                                            <span 
                                              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                                              style={{ backgroundColor: `${taskType.color}20`, color: taskType.color }}
                                            >
                                              {taskType.name}
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{task.description}</div>
                                      </TableCell>
                                      <TableCell className="text-xs text-muted-foreground">
                                        {epic?.title || epic?.name || "No Epic"}
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className="text-xs font-normal">
                                          {task.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        <div className={cn(
                                          "flex items-center gap-1 text-xs",
                                          isOutsideSprint && "text-amber-700 font-medium"
                                        )}>
                                          {task.deadline ? (
                                            <>
                                              {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                              {isOutsideSprint && (
                                                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                              )}
                                            </>
                                          ) : (
                                            <span className="text-muted-foreground">No date</span>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {isInSprint ? (
                                          <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                                            Yes
                                          </Badge>
                                        ) : (
                                          <span className="text-muted-foreground text-xs">-</span>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                            {filteredManualTasks.length > 20 && (
                              <div className="p-2 text-center text-xs text-muted-foreground border-t">
                                Showing 20 of {filteredManualTasks.length} tasks. Use search to find more.
                              </div>
                            )}
                            {filteredManualTasks.length === 0 && (
                              <div className="p-8 text-center text-muted-foreground">
                                No tasks found matching your filters.
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        {/* Coverage Matrix Tab */}
                        <TabsContent value="matrix" className="space-y-4">
                          <div className="border rounded-md overflow-hidden">
                            <div className="bg-muted/30 p-4 border-b flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-sm">Coverage Matrix</h4>
                                <p className="text-xs text-muted-foreground">
                                  Click on cells to toggle task inclusion for {matrixAxis === "epics" ? "Epic" : "Milestone"} & Stage.
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground">View by:</Label>
                                <SearchableSelect 
                                  value={matrixAxis} 
                                  onValueChange={(v) => setMatrixAxis(v as "epics" | "milestones")}
                                  className="h-8 w-[140px]"
                                  data-testid="select-matrix-axis"
                                  options={[
                                    { value: "epics", label: "Epics" },
                                    { value: "milestones", label: "Milestones" }
                                  ]}
                                />
                              </div>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b bg-muted/10">
                                    <th className="p-3 text-left font-medium min-w-[200px]">
                                      {matrixAxis === "epics" ? "Epic" : "Milestone"}
                                    </th>
                                    {projectStages.map((stage: any) => (
                                      <th key={stage.id} className="p-3 text-center font-medium border-l min-w-[100px]">
                                        {stage.label || stage.name}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {matrixAxis === "epics" ? (
                                    projectEpics.length === 0 ? (
                                      <tr>
                                        <td colSpan={projectStages.length + 1} className="p-8 text-center text-muted-foreground">
                                          No epics found in this project.
                                        </td>
                                      </tr>
                                    ) : projectStages.length === 0 ? (
                                      <tr>
                                        <td colSpan={2} className="p-8 text-center text-muted-foreground">
                                          No stages found. Tasks must have stages assigned.
                                        </td>
                                      </tr>
                                    ) : (
                                      projectEpics.map((epic: any) => (
                                        <tr key={epic.id} className="border-b hover:bg-muted/5">
                                          <td className="p-3 font-medium">
                                            <div className="flex items-center gap-2">
                                              <span className="truncate max-w-[180px]">{epic.title || epic.name}</span>
                                            </div>
                                          </td>
                                          {projectStages.map((stage: any) => {
                                            const counts = getCellTaskCounts(epic.id, stage.id, "epics");
                                            const allInSprint = counts.total > 0 && counts.inSprint === counts.total;
                                            const someInSprint = counts.inSprint > 0 && counts.inSprint < counts.total;
                                            
                                            return (
                                              <td 
                                                key={stage.id} 
                                                className={cn(
                                                  "p-3 text-center border-l cursor-pointer transition-colors",
                                                  counts.total === 0 && "bg-muted/10",
                                                  allInSprint && "bg-green-50",
                                                  someInSprint && "bg-amber-50"
                                                )}
                                                onClick={() => handleToggleCellTasksGeneric(epic.id, stage.id, "epics")}
                                                data-testid={`cell-epic-${epic.id}-${stage.id}`}
                                              >
                                                {counts.total > 0 ? (
                                                  <div className="flex flex-col items-center gap-0.5">
                                                    <span className={cn(
                                                      "text-sm font-medium",
                                                      allInSprint && "text-green-700",
                                                      someInSprint && "text-amber-700"
                                                    )}>
                                                      {counts.inSprint}/{counts.total}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                      {allInSprint ? "All in" : someInSprint ? "Partial" : "None"}
                                                    </span>
                                                  </div>
                                                ) : (
                                                  <span className="text-muted-foreground/30">-</span>
                                                )}
                                              </td>
                                            );
                                          })}
                                        </tr>
                                      ))
                                    )
                                  ) : (
                                    projectMilestones.length === 0 ? (
                                      <tr>
                                        <td colSpan={projectStages.length + 1} className="p-8 text-center text-muted-foreground">
                                          No milestones found in this project.
                                        </td>
                                      </tr>
                                    ) : projectStages.length === 0 ? (
                                      <tr>
                                        <td colSpan={2} className="p-8 text-center text-muted-foreground">
                                          No stages found. Tasks must have stages assigned.
                                        </td>
                                      </tr>
                                    ) : (
                                      projectMilestones.map((milestone: any) => (
                                        <tr key={milestone.id} className="border-b hover:bg-muted/5">
                                          <td className="p-3 font-medium">
                                            <div className="flex items-center gap-2">
                                              <Target className="h-4 w-4 text-muted-foreground" />
                                              <span className="truncate max-w-[180px]">{milestone.title || milestone.name}</span>
                                            </div>
                                          </td>
                                          {projectStages.map((stage: any) => {
                                            const counts = getCellTaskCounts(milestone.id, stage.id, "milestones");
                                            const allInSprint = counts.total > 0 && counts.inSprint === counts.total;
                                            const someInSprint = counts.inSprint > 0 && counts.inSprint < counts.total;
                                            
                                            return (
                                              <td 
                                                key={stage.id} 
                                                className={cn(
                                                  "p-3 text-center border-l cursor-pointer transition-colors",
                                                  counts.total === 0 && "bg-muted/10",
                                                  allInSprint && "bg-green-50",
                                                  someInSprint && "bg-amber-50"
                                                )}
                                                onClick={() => handleToggleCellTasksGeneric(milestone.id, stage.id, "milestones")}
                                                data-testid={`cell-milestone-${milestone.id}-${stage.id}`}
                                              >
                                                {counts.total > 0 ? (
                                                  <div className="flex flex-col items-center gap-0.5">
                                                    <span className={cn(
                                                      "text-sm font-medium",
                                                      allInSprint && "text-green-700",
                                                      someInSprint && "text-amber-700"
                                                    )}>
                                                      {counts.inSprint}/{counts.total}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                      {allInSprint ? "All in" : someInSprint ? "Partial" : "None"}
                                                    </span>
                                                  </div>
                                                ) : (
                                                  <span className="text-muted-foreground/30">-</span>
                                                )}
                                              </td>
                                            );
                                          })}
                                        </tr>
                                      ))
                                    )
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </TabsContent>

                        {/* Rule-Based Scope Tab */}
                        <TabsContent value="rules" className="space-y-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="text-sm font-medium">Definition Rules</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Define criteria to automatically include tasks in this sprint
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {pendingRuleTasks.length > 0 && (
                                <Button 
                                  size="sm" 
                                  onClick={handleApplyRules}
                                  className="gap-2 bg-green-600 hover:bg-green-700"
                                  data-testid="button-apply-rules"
                                >
                                  <Zap className="h-4 w-4" /> 
                                  Apply Rules ({pendingRuleTasks.length} tasks)
                                </Button>
                              )}
                              <Button size="sm" variant="outline" onClick={handleAddRule} className="gap-2" data-testid="button-add-rule">
                                <Plus className="h-4 w-4" /> Add Rule
                              </Button>
                            </div>
                          </div>

                          {pendingRuleTasks.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
                              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-amber-800">
                                  {pendingRuleTasks.length} task{pendingRuleTasks.length !== 1 ? 's' : ''} matched but not yet applied
                                </p>
                                <p className="text-xs text-amber-700 mt-0.5">
                                  Click "Apply Rules" to add these tasks to the sprint.
                                </p>
                              </div>
                            </div>
                          )}

                          {alreadyInSprintFromRules.length > 0 && pendingRuleTasks.length === 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-3">
                              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-green-800">
                                  All matched tasks are in sprint
                                </p>
                                <p className="text-xs text-green-700 mt-0.5">
                                  {alreadyInSprintFromRules.length} task{alreadyInSprintFromRules.length !== 1 ? 's' : ''} from rules are included in this sprint.
                                </p>
                              </div>
                            </div>
                          )}
                          
                          <div className="space-y-3">
                            {sprintScopeRules.length === 0 ? (
                               <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm bg-muted/10">
                                 No rules defined. Add a rule to automatically include tasks in this sprint.
                               </div>
                            ) : (
                              sprintScopeRules.map((rule: any) => {
                                const matchedTasks = allMatchedTasksByRule[rule.id] || [];
                                const inSprintCount = matchedTasks.filter(t => sprintTaskIds.includes(t.id)).length;
                                const pendingCount = matchedTasks.length - inSprintCount;
                                const isExpanded = expandedRules[rule.id] || false;
                                
                                return (
                                  <Card key={rule.id} className={cn(
                                    "relative overflow-hidden transition-all",
                                    !rule.active && "opacity-60"
                                  )}>
                                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                                      <div className="flex-1 mr-4">
                                         <Input 
                                           value={rule.label} 
                                           onChange={(e) => handleUpdateRule(rule.id, { label: e.target.value })}
                                           className="h-8 font-medium border-transparent hover:border-input focus:border-input px-0"
                                           data-testid={`input-rule-label-${rule.id}`}
                                         />
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Switch 
                                          checked={rule.active} 
                                          onCheckedChange={(c) => handleToggleRuleActive(rule.id, c)} 
                                          data-testid={`switch-rule-active-${rule.id}`}
                                        />
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-8 w-8 text-muted-foreground hover:text-destructive" 
                                          onClick={() => handleDeleteRule(rule.id)}
                                          data-testid={`button-delete-rule-${rule.id}`}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-2 text-sm text-muted-foreground space-y-3">
                                      <div className="grid grid-cols-4 gap-4">
                                        <div className="space-y-1">
                                           <Label className="text-xs">Stage</Label>
                                           <SearchableSelect 
                                             value={rule.stage || "all"} 
                                             onValueChange={(v) => handleUpdateRule(rule.id, { stage: v })}
                                             className="h-8"
                                             data-testid={`select-rule-stage-${rule.id}`}
                                             placeholder="Any Stage"
                                             options={[
                                               { value: "all", label: "Any Stage" },
                                               ...projectStages.map((stage: any) => ({ value: stage.id, label: stage.label || stage.name }))
                                             ]}
                                           />
                                        </div>
                                        <div className="space-y-1">
                                           <Label className="text-xs">Milestone</Label>
                                           <SearchableSelect 
                                             value={rule.milestone || "all"} 
                                             onValueChange={(v) => handleUpdateRule(rule.id, { milestone: v })}
                                             className="h-8"
                                             data-testid={`select-rule-milestone-${rule.id}`}
                                             placeholder="Any Milestone"
                                             options={[
                                               { value: "all", label: "Any Milestone" },
                                               ...projectMilestones.map((ms: any) => ({ value: ms.id, label: ms.title || ms.name }))
                                             ]}
                                           />
                                        </div>
                                        <div className="space-y-1">
                                           <Label className="text-xs">Epic Type</Label>
                                           <SearchableSelect 
                                             value={rule.epicType || "all"} 
                                             onValueChange={(v) => handleUpdateRule(rule.id, { epicType: v })}
                                             className="h-8"
                                             data-testid={`select-rule-epic-type-${rule.id}`}
                                             placeholder="Any Epic Type"
                                             options={[
                                               { value: "all", label: "Any Epic Type" },
                                               { value: "use_case", label: "Use Case" },
                                               { value: "technical", label: "Technical" }
                                             ]}
                                           />
                                        </div>
                                        <div className="space-y-1">
                                           <Label className="text-xs">Task Type</Label>
                                           <SearchableSelect 
                                             value={rule.taskTemplateKey || "all"} 
                                             onValueChange={(v) => handleUpdateRule(rule.id, { taskTemplateKey: v })}
                                             className="h-8"
                                             data-testid={`select-rule-task-type-${rule.id}`}
                                             placeholder="Any Task Type"
                                             options={[
                                               { value: "all", label: "Any Task Type" },
                                               { value: "design", label: "Design" },
                                               { value: "development", label: "Development" },
                                               { value: "testing", label: "Testing" }
                                             ]}
                                           />
                                        </div>
                                      </div>
                                      
                                      <Collapsible open={isExpanded} onOpenChange={() => toggleRuleExpanded(rule.id)}>
                                        <CollapsibleTrigger asChild>
                                          <button className="flex items-center justify-between w-full text-xs hover:text-foreground transition-colors py-2">
                                            <span className="flex items-center gap-1.5">
                                              {matchedTasks.length > 0 ? (
                                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                              ) : (
                                                <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                                              )}
                                              <span>
                                                Matches <strong>{matchedTasks.length}</strong> task{matchedTasks.length !== 1 ? 's' : ''}
                                                {matchedTasks.length > 0 && (
                                                  <span className="text-muted-foreground ml-1">
                                                    ({inSprintCount} in sprint{pendingCount > 0 && `, ${pendingCount} pending`})
                                                  </span>
                                                )}
                                              </span>
                                            </span>
                                            <ChevronDown className={cn(
                                              "h-4 w-4 transition-transform",
                                              isExpanded && "rotate-180"
                                            )} />
                                          </button>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                          {matchedTasks.length > 0 ? (
                                            <div className="mt-2 border rounded-lg divide-y max-h-[200px] overflow-y-auto">
                                              {matchedTasks.map((task: any) => {
                                                const isInSprint = sprintTaskIds.includes(task.id);
                                                return (
                                                  <div 
                                                    key={task.id} 
                                                    className="px-3 py-2 flex items-center justify-between text-xs hover:bg-muted/30"
                                                  >
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                      {isInSprint ? (
                                                        <CheckSquare className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                                                      )}
                                                      <span className="truncate font-medium">{task.title || task.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                                      <Badge variant="outline" className="text-[10px]">
                                                        {getStageName(task.stageId)}
                                                      </Badge>
                                                      {task.milestoneId && (
                                                        <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                                                          {getMilestoneName(task.milestoneId)}
                                                        </Badge>
                                                      )}
                                                      <Badge 
                                                        variant="secondary" 
                                                        className={cn(
                                                          "text-[10px]",
                                                          isInSprint ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                                        )}
                                                      >
                                                        {isInSprint ? "In Sprint" : "Pending"}
                                                      </Badge>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          ) : (
                                            <div className="mt-2 p-4 border rounded-lg text-center text-muted-foreground text-xs">
                                              No tasks match this rule's criteria
                                            </div>
                                          )}
                                        </CollapsibleContent>
                                      </Collapsible>
                                    </CardContent>
                                  </Card>
                                );
                              })
                            )}
                          </div>
                        </TabsContent>
                      </div>
                    </Tabs>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="run" className="mt-6">
            <div className="flex gap-4 h-[calc(100vh-280px)]" data-testid="run-tab-container">
              <div className={cn("min-w-0 transition-all", pulseCollapsed ? "flex-1" : "flex-[65]")}>
                <Card className="h-full flex flex-col overflow-hidden">
                  <CardHeader className="py-2 px-4 flex-row items-center justify-between border-b">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Flow Board
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {!isReadOnly && (
                        <Button size="sm" variant="outline" onClick={() => setShowAddTasksDialog(true)} data-testid="button-add-tasks-run">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Tasks
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setPulseCollapsed(!pulseCollapsed)}
                        data-testid="button-toggle-pulse"
                      >
                        {pulseCollapsed ? (
                          <>
                            <MessageSquare className="h-4 w-4 mr-1" />
                            <PanelRightOpen className="h-4 w-4" />
                          </>
                        ) : (
                          <PanelRightClose className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <SprintSignalsBar
                    tasks={sprintTasks}
                    activeFilter={signalFilter}
                    onFilterChange={setSignalFilter}
                  />
                  <CardContent className="flex-1 p-3 overflow-hidden">
                    <PortableKanban
                      tasks={sprintTasks}
                      users={users || []}
                      epics={allEpics || []}
                      milestones={projectMilestones}
                      projectId={projectId}
                      boardId={`sprint-${sprintId}`}
                      isReadOnly={isReadOnly}
                      signalFilter={signalFilter}
                      hoverCard={{
                        enabled: true,
                        users: users || [],
                        onAssigneeChange: handleAssigneeChange,
                        onAddComment: handleAddComment,
                      }}
                      onTaskMove={handleTaskMove}
                      onBlockerRequested={handleBlockerRequested}
                    />
                  </CardContent>
                </Card>
              </div>
              {!pulseCollapsed && (
                <div className="flex-[35] min-w-0">
                  <PulsePanel
                    tasks={sprintTasks}
                    users={users || []}
                    pulseUpdates={pulseUpdates}
                    currentUserId={currentUser?.id || ""}
                    sprintId={sprintId}
                    onPostPulse={(data) => postPulseMutation.mutate(data)}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <SprintInsightsTab
              sprint={sprint}
              tasks={sprintTasks.map((t: any) => ({
                id: t.id,
                title: t.title,
                status: t.status,
                priority: t.priority,
                dueDate: t.dueDate,
                updatedAt: t.updatedAt,
                epicId: t.epicId,
                epicName: getEpic(t.epicId)?.title,
                blocked: t.blocked,
                blockerReason: t.blockerReason,
              }))}
              projectId={projectId}
              projectSprints={projectSprints}
              isReadOnly={isReadOnly}
              onCloseSprint={handleCloseSprintWithRollover}
              onNotesChange={handleNotesChange}
              onRolloverTasks={handleRolloverTasks}
            />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sprint Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current Status</span>
                    <Badge variant="outline" className={cn(statusConfig.bgColor, statusConfig.color, "border-0")}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {sprint.status === "planned" && (
                      <Button onClick={handleStartSprint} className="flex-1" data-testid="button-start-sprint-settings">
                        <Play className="h-4 w-4 mr-2" />
                        Start Sprint
                      </Button>
                    )}
                    {sprint.status === "active" && (
                      <Button variant="secondary" onClick={handleCloseSprint} className="flex-1" data-testid="button-close-sprint-settings">
                        <Square className="h-4 w-4 mr-2" />
                        Close Sprint
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sprint Owner</CardTitle>
                </CardHeader>
                <CardContent>
                  {ownerUser ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{ownerUser.name?.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{ownerUser.name}</div>
                        <div className="text-sm text-muted-foreground">{ownerUser.email || ownerUser.username}</div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No owner assigned</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Automation</CardTitle>
                  <CardDescription>Configure automatic sprint lifecycle actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-start" className="text-sm font-medium">Auto-start sprint</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically start the sprint when the start date is reached
                      </p>
                    </div>
                    <Switch 
                      id="auto-start"
                      checked={sprint.autoStart || false}
                      onCheckedChange={(checked) => handleAutoStartToggle(checked)}
                      disabled={isReadOnly || sprint.status !== "planned"}
                      data-testid="switch-auto-start"
                    />
                  </div>
                  {sprint.autoStart && sprint.status === "planned" && (
                    <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                      <CalendarIcon className="h-3 w-3 inline mr-1" />
                      Will auto-start on {sprint.startDate ? format(new Date(sprint.startDate), "MMM d, yyyy") : "start date (not set)"}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 border-red-200">
                <CardHeader>
                  <CardTitle className="text-base text-red-600">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50">
                    <div>
                      <div className="font-medium">Delete Sprint</div>
                      <div className="text-sm text-muted-foreground">Permanently delete this sprint and remove all task associations.</div>
                    </div>
                    <Button variant="destructive" onClick={handleDeleteSprint} data-testid="button-delete-sprint">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
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
                data-testid="input-search-tasks"
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto border rounded-md">
              {filteredBacklogTasks.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No tasks available in backlog</p>
                </div>
              ) : (
                <Table>
                  <TableBody>
                    {filteredBacklogTasks.map((task: any) => (
                      <TableRow key={task.id} data-testid={`row-backlog-task-${task.id}`}>
                        <TableCell className="w-[40px]">
                          <Checkbox
                            checked={selectedTasks.includes(task.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTasks([...selectedTasks, task.id]);
                              } else {
                                setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                              }
                            }}
                            data-testid={`checkbox-task-${task.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{task.title || task.name}</div>
                          {task.effort && <span className="text-xs text-muted-foreground">{task.effort} pts</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowAddTasksDialog(false);
                setShowCreateTaskDialog(true);
              }} 
              data-testid="button-create-new-task"
            >
              <Plus className="h-4 w-4 mr-1" />
              Create New Task
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAddTasksDialog(false)} data-testid="button-cancel-add-tasks">
                Cancel
              </Button>
              <Button onClick={handleAddTasks} disabled={selectedTasks.length === 0} data-testid="button-confirm-add-tasks">
                Add {selectedTasks.length} Task{selectedTasks.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Task Dialog */}
      <Dialog open={showCreateTaskDialog} onOpenChange={setShowCreateTaskDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Create a new task and add it directly to this sprint.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-task-title">Task Name *</Label>
              <Input
                id="new-task-title"
                placeholder="Enter task name..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                data-testid="input-new-task-title"
              />
            </div>
            <div className="space-y-2">
              <Label>Epic *</Label>
              <SearchableSelect
                value={newTaskEpicId}
                onValueChange={setNewTaskEpicId}
                placeholder="Select an epic..."
                options={projectEpics.map((epic: any) => ({
                  value: epic.id,
                  label: epic.title || epic.name
                }))}
                data-testid="select-new-task-epic"
              />
            </div>
            <div className="space-y-2">
              <Label>Stage *</Label>
              <SearchableSelect
                value={newTaskStageId}
                onValueChange={setNewTaskStageId}
                placeholder="Select a stage..."
                options={projectStages.map((stage: any) => ({
                  value: stage.id,
                  label: stage.label || stage.name
                }))}
                data-testid="select-new-task-stage"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTaskDialog(false)} data-testid="button-cancel-create-task">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateNewTask} 
              disabled={!newTaskTitle.trim() || !newTaskEpicId || !newTaskStageId}
              data-testid="button-confirm-create-task"
            >
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BlockerReasonDialog
        open={blockerDialogOpen}
        onOpenChange={setBlockerDialogOpen}
        taskTitle={sprintTasks.find((t: any) => t.id === pendingBlockerTaskId)?.title}
        onConfirm={handleBlockerConfirm}
        onCancel={handleBlockerCancel}
      />

      {/* Suggested Tasks Drawer */}
      <Dialog open={showSuggestedDrawer} onOpenChange={setShowSuggestedDrawer}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Suggested Tasks</DialogTitle>
            <DialogDescription>
              Tasks matching your scope selection ({scopeTargets.data.length} {currentScopeMode}s selected)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {loadingSuggested ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : suggestedTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2" />
                <p>No unassigned tasks match your scope selection</p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={selectedSuggested.length === suggestedTasks.length && suggestedTasks.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSuggested(suggestedTasks.map((t: any) => t.id));
                            } else {
                              setSelectedSuggested([]);
                            }
                          }}
                          data-testid="checkbox-select-all-suggested"
                        />
                      </TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Epic</TableHead>
                      <TableHead>Effort</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suggestedTasks.map((task: any) => {
                      const epic = getEpic(task.epicId);
                      return (
                        <TableRow key={task.id} data-testid={`row-suggested-task-${task.id}`}>
                          <TableCell>
                            <Checkbox
                              checked={selectedSuggested.includes(task.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedSuggested([...selectedSuggested, task.id]);
                                } else {
                                  setSelectedSuggested(selectedSuggested.filter(id => id !== task.id));
                                }
                              }}
                              data-testid={`checkbox-suggested-${task.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{task.title || task.name}</div>
                            {task.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                                {task.description}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            {epic ? (
                              <Badge variant="outline" className="font-normal">
                                {epic.title || epic.name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{task.effort || "-"} pts</span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter>
            <div className="flex items-center gap-2 mr-auto text-sm text-muted-foreground">
              {selectedSuggested.length} of {suggestedTasks.length} selected
            </div>
            <Button variant="outline" onClick={() => setShowSuggestedDrawer(false)} data-testid="button-cancel-suggested">
              Cancel
            </Button>
            <Button 
              onClick={handleAddSuggestedTasks} 
              disabled={selectedSuggested.length === 0}
              data-testid="button-add-suggested"
            >
              Add to Sprint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scope Mode Change Confirmation Dialog */}
      <Dialog open={showScopeModeChangeDialog} onOpenChange={setShowScopeModeChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Change Scope Mode?
            </DialogTitle>
            <DialogDescription>
              This sprint is currently <strong>active</strong>. Changing the scope mode will clear your current 
              {currentScopeMode && ` ${currentScopeMode}`} selections ({scopeTargets.data.length} selected). 
              Tasks already in the sprint will not be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowScopeModeChangeDialog(false);
                setPendingScopeMode(null);
              }}
              data-testid="button-cancel-scope-change"
            >
              Keep Current Mode
            </Button>
            <Button 
              onClick={handleConfirmScopeModeChange}
              data-testid="button-confirm-scope-change"
            >
              Change to {pendingScopeMode && pendingScopeMode.charAt(0).toUpperCase() + pendingScopeMode.slice(1)}s
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
