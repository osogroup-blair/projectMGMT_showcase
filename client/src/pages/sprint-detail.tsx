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
  ArrowRight,
  Users,
  AlertTriangle,
  BarChart3,
  Settings,
  Trash2,
  Archive,
  Link as LinkIcon
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
import { useSprints, useTasks, useProject, useUsers, useEpics, useMilestones, useDeliverables, useSprintScopeTargets, useSuggestedTasks, useProjectStages } from "@/hooks/use-nexus-data";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const { data: allTasks, update: updateTask } = useTasks();
  const { data: users } = useUsers();
  const { data: allEpics } = useEpics();
  const { data: allMilestones } = useMilestones();
  const { data: allDeliverables } = useDeliverables();
  const { data: allStages } = useProjectStages();

  const scopeTargets = useSprintScopeTargets(sprintId);
  const { data: suggestedTasks = [], isLoading: loadingSuggested } = useSuggestedTasks(sprintId);

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
  const nameInputRef = useRef<HTMLInputElement>(null);
  const goalInputRef = useRef<HTMLTextAreaElement>(null);

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
  const projectEpics = useMemo(() => 
    (allEpics || []).filter((e: any) => e.projectId === projectId),
    [allEpics, projectId]
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

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 bg-muted/30 rounded-lg border">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.done}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-600">{stats.toDo}</div>
            <div className="text-xs text-muted-foreground">To Do</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.percent}%</div>
            <div className="text-xs text-muted-foreground">Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.totalEffort}</div>
            <div className="text-xs text-muted-foreground">Story Points</div>
          </div>
        </div>

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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      Sprint Goal & Success Criteria
                      {!isEditingGoal && !isReadOnly && (
                        <Button variant="ghost" size="sm" onClick={() => setIsEditingGoal(true)} data-testid="button-edit-goal">
                          <Pencil className="h-3 w-3" />
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {sprint.goal || "No goal set for this sprint. Define what you want to achieve."}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Sprint Scope Planner */}
                {!isReadOnly && (
                  <Card data-testid="card-scope-planner">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Sprint Scope Planner
                        </div>
                        {(scopeMode || currentScopeMode) && suggestedTasks.length > 0 && (
                          <Button 
                            size="sm" 
                            onClick={() => setShowSuggestedDrawer(true)}
                            data-testid="button-view-suggested"
                          >
                            View {suggestedTasks.length} Suggested Tasks
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Define sprint scope by selecting Epics, Milestones, or Stages to pull tasks from
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Mode Toggle */}
                      <div className="flex gap-2">
                        <Button
                          variant={(scopeMode || currentScopeMode) === "epic" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleScopeModeChange("epic")}
                          data-testid="button-scope-epic"
                        >
                          Epics ({projectEpics.length})
                        </Button>
                        <Button
                          variant={(scopeMode || currentScopeMode) === "milestone" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleScopeModeChange("milestone")}
                          data-testid="button-scope-milestone"
                        >
                          Milestones ({projectMilestones.length})
                        </Button>
                        <Button
                          variant={(scopeMode || currentScopeMode) === "stage" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleScopeModeChange("stage")}
                          data-testid="button-scope-stage"
                        >
                          Stages ({projectStages.length})
                        </Button>
                      </div>

                      {/* Selected Targets Chips */}
                      {scopeTargets.data.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {scopeTargets.data.map((target: any) => (
                            <Badge 
                              key={target.id} 
                              variant="secondary" 
                              className="px-2 py-1 flex items-center gap-1"
                            >
                              {getScopeEntityName(target.targetType, target.targetId)}
                              <button 
                                onClick={() => scopeTargets.removeTarget(target.id)}
                                className="ml-1 hover:text-destructive"
                                data-testid={`button-remove-target-${target.targetId}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Entity Selector */}
                      {(scopeMode || currentScopeMode) && (
                        <div className="border rounded-lg">
                          <div className="p-2 border-b">
                            <div className="relative">
                              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder={`Search ${scopeMode || currentScopeMode}s...`}
                                value={scopeSearch}
                                onChange={(e) => setScopeSearch(e.target.value)}
                                className="pl-8 h-9"
                                data-testid="input-scope-search"
                              />
                            </div>
                          </div>
                          <ScrollArea className="h-48">
                            <div className="p-2 space-y-1">
                              {filteredScopeEntities.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  No {scopeMode || currentScopeMode}s found
                                </p>
                              ) : (
                                filteredScopeEntities.map((entity: any) => {
                                  const isSelected = selectedScopeIds.includes(entity.id);
                                  return (
                                    <div 
                                      key={entity.id}
                                      className={cn(
                                        "flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted",
                                        isSelected && "bg-muted"
                                      )}
                                      onClick={() => handleToggleScopeTarget(entity.id)}
                                      data-testid={`scope-entity-${entity.id}`}
                                    >
                                      <Checkbox checked={isSelected} />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                          {entity.title || entity.name}
                                        </p>
                                        {entity.description && (
                                          <p className="text-xs text-muted-foreground truncate">
                                            {entity.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      )}

                      {/* Empty State */}
                      {!scopeMode && !currentScopeMode && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Select a scope type above to filter available tasks
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

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
                            <TableHead className="w-[40%]">Task</TableHead>
                            <TableHead>Epic</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Effort</TableHead>
                            <TableHead>Assignee</TableHead>
                            {!isReadOnly && <TableHead className="w-[50px]"></TableHead>}
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
                                  <Badge variant="outline" className={cn(taskStatus.bgColor, taskStatus.color, "border-0")}>
                                    <TaskStatusIcon className="h-3 w-3 mr-1" />
                                    {task.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm">{task.effort || "-"}</span>
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
                                {!isReadOnly && (
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
                                )}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {(linkedEpics.length > 0 || linkedMilestones.length > 0) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        Linked Entities
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {linkedEpics.length > 0 && (
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
                )}
              </div>

              <div className="space-y-6">
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
          </TabsContent>

          <TabsContent value="run" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Active Task Board</CardTitle>
                    {!isReadOnly && (
                      <Button size="sm" onClick={() => setShowAddTasksDialog(true)} data-testid="button-add-tasks-run">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Tasks
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 font-medium text-sm text-slate-600 pb-2 border-b">
                        <Circle className="h-4 w-4" />
                        To Do ({stats.toDo})
                      </div>
                      <div className="space-y-2 min-h-[200px]">
                        {sprintTasks.filter((t: any) => t.status === "To Do" || t.status === "Pending").map((task: any) => (
                          <Card key={task.id} className="p-3">
                            <Link href={`/projects/${projectId}/tasks/${task.id}`} className="font-medium text-sm hover:text-primary">
                              {task.title || task.name}
                            </Link>
                            <div className="flex items-center justify-between mt-2">
                              {task.effort && <Badge variant="outline" className="text-xs">{task.effort} pts</Badge>}
                              {getUser(task.assigneeId) && (
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-xs">
                                    {getUser(task.assigneeId)?.name?.charAt(0) || "?"}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 font-medium text-sm text-blue-600 pb-2 border-b">
                        <Clock className="h-4 w-4" />
                        In Progress ({stats.inProgress})
                      </div>
                      <div className="space-y-2 min-h-[200px]">
                        {sprintTasks.filter((t: any) => t.status === "In Progress").map((task: any) => (
                          <Card key={task.id} className="p-3 border-l-2 border-l-blue-500">
                            <Link href={`/projects/${projectId}/tasks/${task.id}`} className="font-medium text-sm hover:text-primary">
                              {task.title || task.name}
                            </Link>
                            <div className="flex items-center justify-between mt-2">
                              {task.effort && <Badge variant="outline" className="text-xs">{task.effort} pts</Badge>}
                              {getUser(task.assigneeId) && (
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-xs">
                                    {getUser(task.assigneeId)?.name?.charAt(0) || "?"}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 font-medium text-sm text-green-600 pb-2 border-b">
                        <CheckCircle2 className="h-4 w-4" />
                        Done ({stats.done})
                      </div>
                      <div className="space-y-2 min-h-[200px]">
                        {sprintTasks.filter((t: any) => t.status === "Done" || t.status === "Completed").map((task: any) => (
                          <Card key={task.id} className="p-3 border-l-2 border-l-green-500 bg-green-50/30">
                            <Link href={`/projects/${projectId}/tasks/${task.id}`} className="font-medium text-sm hover:text-primary">
                              {task.title || task.name}
                            </Link>
                            <div className="flex items-center justify-between mt-2">
                              {task.effort && <Badge variant="outline" className="text-xs">{task.effort} pts</Badge>}
                              {getUser(task.assigneeId) && (
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-xs">
                                    {getUser(task.assigneeId)?.name?.charAt(0) || "?"}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Planned vs Actual</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Committed Tasks</span>
                      <span className="font-medium">{stats.total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Completed Tasks</span>
                      <span className="font-medium text-green-600">{stats.done}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Completion Rate</span>
                      <span className="font-medium">{stats.percent}%</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Committed Effort</span>
                      <span className="font-medium">{stats.totalEffort} pts</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivered Effort</span>
                      <span className="font-medium text-green-600">{stats.doneEffort} pts</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sprint Velocity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-40 text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Velocity chart coming soon</p>
                      <p className="text-xs">Compare across sprints to track team capacity</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Retrospective</CardTitle>
                  <CardDescription>Reflect on what worked well and what can be improved</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                      <h4 className="font-medium text-green-800 mb-2">What went well</h4>
                      <p className="text-sm text-green-700">Add retrospective notes after sprint completion.</p>
                    </div>
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                      <h4 className="font-medium text-amber-800 mb-2">What could improve</h4>
                      <p className="text-sm text-amber-700">Identify areas for improvement in future sprints.</p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2">Action items</h4>
                      <p className="text-sm text-blue-700">Track improvement commitments for the next sprint.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTasksDialog(false)} data-testid="button-cancel-add-tasks">
              Cancel
            </Button>
            <Button onClick={handleAddTasks} disabled={selectedTasks.length === 0} data-testid="button-confirm-add-tasks">
              Add {selectedTasks.length} Task{selectedTasks.length !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
