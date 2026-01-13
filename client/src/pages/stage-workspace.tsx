import { useState, useEffect, useMemo } from "react";
import { Shell } from "@/components/layout/shell";
import { ListHeader, LayoutVariant, getGridClassName } from "@/components/ui/list-header";
import { 
  ArrowLeft, 
  ArrowDown,
  Search, 
  Filter, 
  MoreHorizontal, 
  Plus,
  Kanban,
  List,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Info,
  ChevronDown,
  Pencil,
  Check,
  X,
  Target,
  Loader2
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRoute, Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  useProject,
  useProjectStages,
  useTasks,
  useMilestones,
  useMilestoneTaskLinks,
  useGuidanceItems,
  useSavedViews,
  useUsers,
  useEpics,
  useDeliverables,
  useResolvedTaskTypes
} from "@/hooks/use-nexus-data";
import { useTaskStatuses } from "@/hooks/use-task-statuses";
import { useCompletedStatuses } from "@/hooks/use-completed-statuses";
import { useCurrentUser } from "@/context/current-user-context";
import { EFFORT_VALUES } from "@shared/schema";
import { PortableKanban } from "@/components/kanban";

export default function StageWorkspace() {
  const [match, params] = useRoute("/projects/:projectId/stages/:stageId");
  const projectId = params?.projectId || "1";
  const stageId = params?.stageId || "st_plan";

  const { toast } = useToast();

  // Database hooks
  const { data: project, isLoading: isProjectLoading } = useProject(projectId);
  const { data: allStages, isLoading: isStagesLoading, update: updateStage } = useProjectStages();
  const { data: allTasks, isLoading: isTasksLoading, create: createTask, update: updateTask } = useTasks();
  const { data: allEpics, isLoading: isEpicsLoading } = useEpics();
  const { data: allDeliverables, isLoading: isDeliverablesLoading } = useDeliverables();
  const { data: allMilestones, isLoading: isMilestonesLoading, createAsync: createMilestone } = useMilestones();
  const { data: allMilestoneLinks, isLoading: isMilestoneLinksLoading } = useMilestoneTaskLinks();
  const { data: allGuidance, isLoading: isGuidanceLoading } = useGuidanceItems();
  const { data: allSavedViews, isLoading: isSavedViewsLoading } = useSavedViews();
  const { data: allUsers, isLoading: isUsersLoading } = useUsers();
  const { data: taskTypes } = useResolvedTaskTypes(projectId);
  const { currentUser } = useCurrentUser();
  const { statusLabels, getStatusBgColor, defaultStatus } = useTaskStatuses();
  const { isTaskComplete } = useCompletedStatuses();

  // Memoized filtered data - stages filtered by current project
  const projectStages = useMemo(() => 
    (allStages || [])
      .filter((s: any) => s.projectId === projectId)
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0)),
    [allStages, projectId]
  );

  const stage = useMemo(() => 
    projectStages.find((s: any) => s.id === stageId) || projectStages[0],
    [projectStages, stageId]
  );

  // Find prev/next stages within the project only
  const stageIndex = useMemo(() => 
    projectStages.findIndex((s: any) => s.id === stageId),
    [projectStages, stageId]
  );

  const nextStage = useMemo(() => 
    stageIndex >= 0 && stageIndex < projectStages.length - 1 ? projectStages[stageIndex + 1] : null,
    [projectStages, stageIndex]
  );

  const prevStage = useMemo(() => 
    stageIndex > 0 ? projectStages[stageIndex - 1] : null,
    [projectStages, stageIndex]
  );

  // Filter Data
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [taskViewMode, setTaskViewMode] = useState<"list" | "kanban">("kanban");
  const [currentViewId, setCurrentViewId] = useState<string>("default");
  const [activeTab, setActiveTab] = useState("tasks");

  const tasks = useMemo(() => {
    return (allTasks || []).filter((t: any) => {
      const matchStage = t.stageId === stageId;
      const matchProject = t.projectId === projectId || t.project === projectId;
      const matchSearch = t.title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      const matchAssignee = assigneeFilter === "all" || t.assigneeId === assigneeFilter;
      return matchStage && matchProject && matchSearch && matchStatus && matchAssignee;
    });
  }, [allTasks, stageId, projectId, searchQuery, statusFilter, assigneeFilter]);

  const milestones = useMemo(() => 
    (allMilestones || []).filter((m: any) => m.stageId === stageId && m.projectId === projectId),
    [allMilestones, stageId, projectId]
  );

  const guidance = useMemo(() => 
    (allGuidance || []).filter((g: any) => g.stageId === stageId),
    [allGuidance, stageId]
  );

  const savedViews = useMemo(() => 
    (allSavedViews || []).filter((v: any) => v.stageIds?.includes(stageId) || v.stageIds?.length === 0),
    [allSavedViews, stageId]
  );

  const team = allUsers || [];

  // Filter deliverables and epics for this project
  const projectDeliverables = useMemo(() => 
    (allDeliverables || []).filter((d: any) => d.projectId === projectId),
    [allDeliverables, projectId]
  );
  
  const projectEpics = useMemo(() => {
    const deliverableIds = new Set(projectDeliverables.map((d: any) => d.id));
    return (allEpics || []).filter((e: any) => deliverableIds.has(e.deliverableId));
  }, [allEpics, projectDeliverables]);

  const getAssignee = (id?: string) => team.find((u: any) => u.id === id);

  // Inline editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<"pending" | "active" | "completed">("pending");
  
  // Date editing state
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [editStartDate, setEditStartDate] = useState<string>("");
  const [editEndDate, setEditEndDate] = useState<string>("");
  const [cascadeToTasks, setCascadeToTasks] = useState(true);
  const [isSavingDates, setIsSavingDates] = useState(false);

  // Add/Link Milestone modal state
  const [, setLocation] = useLocation();
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [milestoneModalMode, setMilestoneModalMode] = useState<"link" | "create">("link");
  const [newMilestoneName, setNewMilestoneName] = useState("");
  const [newMilestoneStageId, setNewMilestoneStageId] = useState(stageId);
  const [isCreatingMilestone, setIsCreatingMilestone] = useState(false);
  const [milestoneSearchQuery, setMilestoneSearchQuery] = useState("");
  
  // All project milestones that aren't already linked to this stage
  const availableMilestones = useMemo(() => {
    const stageMilestoneIds = new Set(milestones.map((m: any) => m.id));
    return (allMilestones || [])
      .filter((m: any) => m.projectId === projectId && !stageMilestoneIds.has(m.id));
  }, [allMilestones, projectId, milestones]);
  
  const filteredAvailableMilestones = useMemo(() => {
    if (!milestoneSearchQuery.trim()) return availableMilestones;
    const q = milestoneSearchQuery.toLowerCase();
    return availableMilestones.filter((m: any) => m.name?.toLowerCase().includes(q));
  }, [availableMilestones, milestoneSearchQuery]);
  
  const { update: updateMilestone } = useMilestones();

  // Create task modal state
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskEpicId, setNewTaskEpicId] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [newTaskEffort, setNewTaskEffort] = useState(3);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const handleOpenCreateTask = () => {
    if (projectEpics.length === 0) {
      toast({
        title: "Cannot Create Task",
        description: "This project has no epics. Create an epic first before adding tasks.",
        variant: "destructive"
      });
      return;
    }
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskEpicId(projectEpics[0]?.id || "");
    setNewTaskPriority("Medium");
    setNewTaskEffort(3);
    setShowCreateTaskModal(true);
  };

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) {
      toast({ title: "Error", description: "Task title is required.", variant: "destructive" });
      return;
    }
    if (!newTaskEpicId) {
      toast({ title: "Error", description: "Epic is required.", variant: "destructive" });
      return;
    }
    
    // Default to "Action" task type, or isDefault, or first available
    const actionType = (taskTypes || []).find((tt: any) => tt.name === "Action");
    const defaultTaskType = actionType || (taskTypes || []).find((tt: any) => tt.isDefault) || (taskTypes || [])[0];

    setIsCreatingTask(true);
    try {
      createTask({
        title: newTaskTitle.trim(),
        description: newTaskDescription,
        project: project?.name,
        projectId: projectId,
        epicId: newTaskEpicId,
        stageId: stageId, // Pre-filled from context
        status: "BACKLOGGED",
        priority: newTaskPriority,
        effort: newTaskEffort,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tags: [],
        taskTypeId: defaultTaskType?.id || null,
        assigneeId: currentUser?.id || null
      });
      
      toast({ title: "Success", description: "Task created successfully." });
      setShowCreateTaskModal(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create task.", variant: "destructive" });
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleCreateMilestone = async () => {
    if (!newMilestoneName.trim()) {
      toast({ title: "Error", description: "Milestone name is required.", variant: "destructive" });
      return;
    }
    
    setIsCreatingMilestone(true);
    try {
      const newMilestone = {
        projectId,
        name: newMilestoneName.trim(),
        description: "",
        phase: "plan_strategy",
        stageId: stageId, // Always use current stage
        targetDate: new Date().toISOString().split('T')[0],
        status: "planned",
        ownerId: "1",
        scopeType: "manual",
        completionMode: "all_tasks",
        completionTargetPercent: 100,
        tags: [],
      };
      
      await createMilestone(newMilestone);
      setShowMilestoneModal(false);
      setNewMilestoneName("");
      toast({ title: "Success", description: "Milestone created and added to this stage." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create milestone.", variant: "destructive" });
    } finally {
      setIsCreatingMilestone(false);
    }
  };
  
  const handleLinkMilestone = async (milestoneId: string) => {
    try {
      await updateMilestone({ id: milestoneId, updates: { stageId } });
      toast({ title: "Success", description: "Milestone linked to this stage." });
      setShowMilestoneModal(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to link milestone.", variant: "destructive" });
    }
  };
  
  const openMilestoneModal = (mode: "link" | "create") => {
    setMilestoneModalMode(mode);
    setMilestoneSearchQuery("");
    setNewMilestoneName("");
    setShowMilestoneModal(true);
  };

  // Sync edit values when stage changes
  useEffect(() => {
    if (stage) {
      setEditName(stage.name || "");
      setEditDescription(stage.description || "");
      setEditStatus(stage.status || "pending");
      setEditStartDate(stage.startDate || "");
      setEditEndDate(stage.endDate || "");
    }
  }, [stage]);

  const handleSaveName = async () => {
    if (!editName.trim()) {
      toast({ title: "Error", description: "Stage name cannot be empty.", variant: "destructive" });
      return;
    }
    if (stage) {
      await updateStage({ id: stage.id, updates: { name: editName.trim() } });
      setIsEditingName(false);
      toast({ title: "Updated", description: "Stage name has been updated." });
    }
  };

  const handleSaveDescription = async () => {
    if (stage) {
      await updateStage({ id: stage.id, updates: { description: editDescription } });
      setIsEditingDescription(false);
      toast({ title: "Updated", description: "Stage description has been updated." });
    }
  };

  const handleSaveStatus = async (newStatus: "pending" | "active" | "completed") => {
    if (stage) {
      await updateStage({ id: stage.id, updates: { status: newStatus } });
      setEditStatus(newStatus);
      setIsEditingStatus(false);
      toast({ title: "Updated", description: "Stage status has been updated." });
    }
  };

  const handleSaveDates = async () => {
    if (!stage) return;
    
    setIsSavingDates(true);
    let tasksUpdated = 0;
    let tasksFailed = 0;
    
    try {
      // Update stage dates
      await updateStage({ 
        id: stage.id, 
        updates: { 
          startDate: editStartDate || null, 
          endDate: editEndDate || null 
        } 
      });
      
      // Cascade to tasks if enabled and end date is set
      if (cascadeToTasks && tasks.length > 0 && editEndDate) {
        // Update all tasks in this stage using the updateTask hook
        const updatePromises = tasks.map(async (task: any) => {
          try {
            await updateTask({ 
              id: task.id, 
              updates: { 
                deadline: editEndDate,
                inheritedFromStage: true
              } 
            });
            return { success: true };
          } catch (error) {
            console.error(`Failed to update task ${task.id}:`, error);
            return { success: false };
          }
        });
        
        const results = await Promise.all(updatePromises);
        tasksUpdated = results.filter(r => r.success).length;
        tasksFailed = results.filter(r => !r.success).length;
        
        if (tasksFailed > 0) {
          toast({ 
            title: "Partially Updated", 
            description: `Stage dates updated. ${tasksUpdated} task(s) updated, ${tasksFailed} failed.`,
            variant: "destructive"
          });
        } else {
          toast({ 
            title: "Dates Updated", 
            description: `Stage dates updated and ${tasksUpdated} task deadline(s) inherited.` 
          });
        }
      } else {
        toast({ title: "Updated", description: "Stage dates have been updated." });
      }
      
      setIsEditingDates(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update dates.", variant: "destructive" });
    } finally {
      setIsSavingDates(false);
    }
  };

  const STATUS_OPTIONS = [
    { value: "pending", label: "Pending", color: "text-muted-foreground" },
    { value: "active", label: "Active", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { value: "completed", label: "Completed", color: "bg-green-50 text-green-700 border-green-200" },
  ];

  const isLoading = isProjectLoading || isStagesLoading || isTasksLoading || isMilestonesLoading || isMilestoneLinksLoading || isGuidanceLoading || isUsersLoading;

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  if (!stage) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Stage not found</h2>
          <p className="text-muted-foreground mt-2">The stage you're looking for doesn't exist.</p>
          <Link href={`/projects/${projectId}?tab=stages`}>
            <Button className="mt-4">Back to Project</Button>
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 shrink-0">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-2xl font-bold h-10 w-80"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveName();
                        if (e.key === "Escape") { setIsEditingName(false); setEditName(stage.name || ""); }
                      }}
                      data-testid="input-edit-stage-name"
                    />
                    <Button size="icon" variant="ghost" onClick={handleSaveName} data-testid="button-save-stage-name">
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { setIsEditingName(false); setEditName(stage.name || ""); }} data-testid="button-cancel-stage-name">
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h1 className="text-2xl font-bold tracking-tight text-primary" data-testid="text-stage-name">{editName}</h1>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8" 
                      onClick={() => setIsEditingName(true)}
                      data-testid="button-edit-stage-name"
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                )}

                {/* Status and Dates together */}
                <div className="flex items-center gap-3 px-3 py-1.5 bg-muted/30 rounded-lg border">
                  {isEditingStatus ? (
                    <div className="flex items-center gap-1">
                      {STATUS_OPTIONS.map(opt => (
                        <Button
                          key={opt.value}
                          variant="outline"
                          size="sm"
                          className={cn("text-xs h-7", editStatus === opt.value && opt.color)}
                          onClick={() => handleSaveStatus(opt.value as "pending" | "active" | "completed")}
                          data-testid={`button-status-${opt.value}`}
                        >
                          {opt.label}
                        </Button>
                      ))}
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsEditingStatus(false)}>
                        <X className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 group">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "font-normal text-xs cursor-pointer",
                          editStatus === 'active' ? "bg-blue-50 text-blue-700 border-blue-200" :
                          editStatus === 'completed' ? "bg-green-50 text-green-700 border-green-200" :
                          "text-muted-foreground"
                        )}
                        onClick={() => setIsEditingStatus(true)}
                        data-testid="badge-stage-status"
                      >
                        {editStatus}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="w-px h-5 bg-border" />
                  
                  {/* Inline Date Display */}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {editStartDate || editEndDate ? (
                      <span className="text-xs">
                        {editStartDate ? format(parseISO(editStartDate), "MMM d") : "Start"} 
                        <span className="text-muted-foreground mx-1">→</span> 
                        {editEndDate ? format(parseISO(editEndDate), "MMM d") : "End"}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No dates</span>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 px-1.5 text-xs" 
                      onClick={() => setIsEditingDates(true)}
                      data-testid="button-edit-stage-dates-inline"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Stage Navigation - Redesigned */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-muted/50 rounded-lg p-1">
                  <Link href={`/projects/${projectId}/stages/${prevStage?.id || stageId}`}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0"
                      disabled={!prevStage}
                      data-testid="button-prev-stage"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </Link>
                  <span className="px-2 text-xs font-medium text-muted-foreground min-w-[80px] text-center">
                    {stageIndex + 1} / {projectStages.length}
                  </span>
                  <Link href={`/projects/${projectId}/stages/${nextStage?.id || stageId}`}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0"
                      disabled={!nextStage}
                      data-testid="button-next-stage"
                    >
                      <ArrowLeft className="h-4 w-4 rotate-180" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Description */}
            {isEditingDescription ? (
              <div className="flex items-start gap-2 max-w-xl">
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Add a stage description..."
                  className="min-h-[60px] text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Escape") { setIsEditingDescription(false); setEditDescription(stage.description || ""); }
                  }}
                  data-testid="input-edit-stage-description"
                />
                <Button size="icon" variant="ghost" onClick={handleSaveDescription} data-testid="button-save-stage-description">
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => { setIsEditingDescription(false); setEditDescription(stage.description || ""); }} data-testid="button-cancel-stage-description">
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <p className="text-sm text-muted-foreground max-w-xl" data-testid="text-stage-description">
                  {editDescription || <span className="italic">Click to add description...</span>}
                </p>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6" 
                  onClick={() => setIsEditingDescription(true)}
                  data-testid="button-edit-stage-description"
                >
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            )}

          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-fit shrink-0">
            <TabsTrigger value="tasks" data-testid="tab-tasks">Tasks</TabsTrigger>
            <TabsTrigger value="milestones" data-testid="tab-milestones">Milestones</TabsTrigger>
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">Dashboard</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="flex-1 mt-4 overflow-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stats Cards */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{tasks.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tasks.filter((t: any) => isTaskComplete(t.status)).length} completed
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{tasks.filter((t: any) => t.status === "In Progress").length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Active tasks</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Milestones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{milestones.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {milestones.filter((m: any) => m.status === "Completed" || m.status === "achieved").length} completed
                  </p>
                </CardContent>
              </Card>

              {/* Guidance Panel */}
              <Card className="bg-amber-50/50 border-amber-100 lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-amber-800 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Guidance & Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {guidance.length > 0 ? guidance.map((item: any) => (
                    <div key={item.id} className="bg-white p-3 rounded-md border border-amber-100 shadow-sm">
                      <h4 className="text-sm font-medium text-amber-900 mb-1 flex items-center gap-2">
                        {item.title}
                        {item.priority === 'High' && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                      </h4>
                      <p className="text-xs text-amber-800/80 leading-relaxed">
                        {item.body || item.description}
                      </p>
                    </div>
                  )) : (
                    <div className="text-sm text-amber-800/60 italic text-center py-2">
                      No specific guidance available.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Milestone Overview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Upcoming Sprints
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {milestones.filter((m: any) => m.status !== 'Completed' && m.status !== 'achieved').slice(0, 3).map((m: any) => (
                    <div key={m.id} className="flex justify-between items-center">
                      <span className="text-sm truncate">{m.name}</span>
                      <span className="text-xs text-muted-foreground">{m.targetDate}</span>
                    </div>
                  ))}
                  {milestones.filter((m: any) => m.status !== 'Completed' && m.status !== 'achieved').length === 0 && (
                    <p className="text-sm text-muted-foreground italic">All milestones completed!</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="flex-1 mt-4 overflow-auto">
            <MilestonesTabContent
              milestones={milestones}
              allTasks={allTasks || []}
              allMilestoneLinks={allMilestoneLinks || []}
              projectId={projectId}
              getAssignee={getAssignee}
              openMilestoneModal={openMilestoneModal}
              isTaskComplete={isTaskComplete}
            />
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="flex-1 mt-4 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0 bg-background border rounded-lg shadow-xs overflow-hidden">
              {/* Kanban with full filter capabilities */}
              {taskViewMode === "kanban" ? (
                <div className="flex-1 bg-muted/10 h-[calc(100vh-350px)] min-h-[400px]">
                  <PortableKanban
                    tasks={(allTasks || []).filter((t: any) => t.stageId === stageId && (t.projectId === projectId || t.project === projectId))}
                    users={team}
                    epics={projectEpics}
                    milestones={milestones || []}
                    projectId={projectId}
                    boardId={`stage-${stageId}`}
                    showFilters={true}
                    showAddTask={true}
                    onAddTask={handleOpenCreateTask}
                    hoverCard={{
                      enabled: true,
                      users: team,
                      onAssigneeChange: (taskId, assigneeId) => {
                        updateTask({ id: taskId, updates: { assigneeId } });
                      },
                      onDueDateChange: (taskId, date) => {
                        updateTask({ id: taskId, updates: { deadline: date?.toISOString().split('T')[0] || null } });
                      },
                    }}
                    onTaskMove={(taskId, newStatus) => {
                      updateTask({ id: taskId, updates: { status: newStatus } });
                      toast({ title: "Task Updated", description: `Task moved to ${newStatus}` });
                    }}
                  />
                </div>
              ) : (
                <ScrollArea className="flex-1 p-4 bg-muted/10">
                  <div className="space-y-2">
                    {tasks.map((task: any) => {
                      const assignee = getAssignee(task.assigneeId);
                      return (
                        <Card key={task.id} className="shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-3 flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <Link href={`/projects/${projectId}/tasks/${task.id}`}>
                                <h4 className="text-sm font-medium hover:text-primary truncate hover:underline">
                                  {task.title}
                                </h4>
                              </Link>
                            </div>
                            <Badge variant="outline" className={cn("text-xs", getStatusBgColor(task.status))}>
                              {task.status}
                            </Badge>
                            {assignee && (
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[10px]">
                                  {assignee.name?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            {task.deadline && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">
                                  {format(parseISO(task.deadline), "MMM d")}
                                </span>
                                {task.inheritedFromStage && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge variant="outline" className="text-[9px] px-1 py-0 bg-blue-50 text-blue-600 border-blue-200">
                                        Stage
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">Date inherited from stage</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                    {tasks.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No tasks in this stage yet.</p>
                        <Button variant="outline" className="mt-2" onClick={handleOpenCreateTask}>
                          <Plus className="h-4 w-4 mr-2" /> Create Task
                        </Button>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Link Milestone Modal */}
      <Dialog open={showMilestoneModal} onOpenChange={setShowMilestoneModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Milestone to Stage</DialogTitle>
            <DialogDescription>
              Link an existing milestone or create a new one for this stage.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={milestoneModalMode} onValueChange={(v) => setMilestoneModalMode(v as "link" | "create")} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="link" data-testid="tab-link-milestone">
                <Search className="h-4 w-4 mr-2" />
                Link Existing
              </TabsTrigger>
              <TabsTrigger value="create" data-testid="tab-create-milestone">
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </TabsTrigger>
            </TabsList>

            {/* Link Existing Tab */}
            <TabsContent value="link" className="flex-1 overflow-hidden flex flex-col mt-4">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search milestones by name..."
                    className="pl-9"
                    value={milestoneSearchQuery}
                    onChange={e => setMilestoneSearchQuery(e.target.value)}
                    data-testid="input-search-milestone"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto mt-3 border rounded-md">
                {filteredAvailableMilestones.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No available milestones found.</p>
                    <p className="text-xs mt-1">Create a new one or check other projects.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredAvailableMilestones.map((m: any) => {
                      const currentStage = projectStages.find((s: any) => s.id === m.stageId);
                      return (
                        <div 
                          key={m.id} 
                          className="p-3 flex items-center justify-between hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleLinkMilestone(m.id)}
                          data-testid={`milestone-link-${m.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <Target className={cn(
                              "h-5 w-5 shrink-0",
                              m.status === 'Completed' || m.status === 'achieved' ? "text-green-600" :
                              m.status === 'In Progress' || m.status === 'in_progress' ? "text-blue-600" :
                              "text-muted-foreground"
                            )} />
                            <div>
                              <h4 className="font-medium text-sm">{m.name}</h4>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {m.targetDate && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {m.targetDate}
                                  </span>
                                )}
                                {currentStage && (
                                  <Badge variant="outline" className="text-[10px]">
                                    {currentStage.name}
                                  </Badge>
                                )}
                              </div>
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

            {/* Create New Tab */}
            <TabsContent value="create" className="flex-1 overflow-y-auto mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="milestone-name">Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="milestone-name"
                    placeholder="Enter milestone name..."
                    value={newMilestoneName}
                    onChange={(e) => setNewMilestoneName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isCreatingMilestone && newMilestoneName.trim()) handleCreateMilestone();
                    }}
                    data-testid="input-new-milestone-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stage</Label>
                  <Input value={stage?.name || stageId} disabled className="bg-muted" />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setShowMilestoneModal(false)} disabled={isCreatingMilestone}>
                  Cancel
                </Button>
                <Button onClick={handleCreateMilestone} disabled={isCreatingMilestone || !newMilestoneName.trim()} data-testid="button-create-milestone">
                  {isCreatingMilestone ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Milestone
                    </>
                  )}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Create Task Modal */}
      <Dialog open={showCreateTaskModal} onOpenChange={setShowCreateTaskModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to the {stage?.name} stage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title <span className="text-red-500">*</span></Label>
              <Input
                id="task-title"
                placeholder="Enter task title..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                data-testid="input-new-task-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Input
                id="task-description"
                placeholder="Enter task description..."
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                data-testid="input-new-task-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-epic">Epic <span className="text-red-500">*</span></Label>
                <SearchableSelect 
                  value={newTaskEpicId} 
                  onValueChange={setNewTaskEpicId}
                  data-testid="select-new-task-epic"
                  placeholder="Select epic"
                  options={projectEpics.map((e: any) => ({ value: e.id, label: e.title }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Stage</Label>
                <Input value={stage?.name || stageId} disabled className="bg-muted" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-priority">Priority</Label>
                <SearchableSelect 
                  value={newTaskPriority} 
                  onValueChange={setNewTaskPriority}
                  data-testid="select-new-task-priority"
                  options={[
                    { value: "Low", label: "Low" },
                    { value: "Medium", label: "Medium" },
                    { value: "High", label: "High" }
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-effort">Effort <span className="text-red-500">*</span></Label>
                <SearchableSelect 
                  value={newTaskEffort.toString()} 
                  onValueChange={(v) => setNewTaskEffort(parseInt(v))}
                  data-testid="select-new-task-effort"
                  options={EFFORT_VALUES.map((val) => ({ value: val.toString(), label: val.toString() }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTaskModal(false)} disabled={isCreatingTask}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} disabled={isCreatingTask || !newTaskTitle.trim() || !newTaskEpicId} data-testid="button-create-task">
              {isCreatingTask ? (
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

      {/* Stage Date Editing Dialog */}
      <Dialog open={isEditingDates} onOpenChange={(open) => {
        if (!open) {
          setIsEditingDates(false);
          setEditStartDate(stage?.startDate || "");
          setEditEndDate(stage?.endDate || "");
        }
      }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Stage Dates</DialogTitle>
            <DialogDescription>
              Set the start and end dates for this stage. Task deadlines can be automatically updated to match.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal" data-testid="button-start-date-picker">
                      <Calendar className="mr-2 h-4 w-4" />
                      {editStartDate ? format(parseISO(editStartDate), "MMM d, yyyy") : <span className="text-muted-foreground">Pick date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={editStartDate ? parseISO(editStartDate) : undefined}
                      onSelect={(date) => date && setEditStartDate(format(date, "yyyy-MM-dd"))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal" data-testid="button-end-date-picker">
                      <Calendar className="mr-2 h-4 w-4" />
                      {editEndDate ? format(parseISO(editEndDate), "MMM d, yyyy") : <span className="text-muted-foreground">Pick date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={editEndDate ? parseISO(editEndDate) : undefined}
                      onSelect={(date) => date && setEditEndDate(format(date, "yyyy-MM-dd"))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {tasks.length > 0 && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Switch 
                  id="cascade-dates" 
                  checked={cascadeToTasks} 
                  onCheckedChange={setCascadeToTasks}
                  data-testid="switch-cascade-dates"
                />
                <div className="flex-1">
                  <Label htmlFor="cascade-dates" className="text-sm font-medium text-blue-800 cursor-pointer">
                    Update task deadlines
                  </Label>
                  <p className="text-xs text-blue-600 mt-0.5">
                    {tasks.length} task{tasks.length !== 1 ? 's' : ''} will have deadlines set to the stage end date
                  </p>
                </div>
                {cascadeToTasks && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
                    Inherited
                  </Badge>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditingDates(false);
                setEditStartDate(stage?.startDate || "");
                setEditEndDate(stage?.endDate || "");
              }} 
              disabled={isSavingDates}
              data-testid="button-cancel-dates"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveDates} 
              disabled={isSavingDates}
              data-testid="button-save-dates"
            >
              {isSavingDates ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Dates
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

function MilestonesTabContent({
  milestones,
  allTasks,
  allMilestoneLinks,
  projectId,
  getAssignee,
  openMilestoneModal,
  isTaskComplete
}: {
  milestones: any[];
  allTasks: any[];
  allMilestoneLinks: any[];
  projectId: string;
  getAssignee: (id?: string) => any;
  openMilestoneModal: (mode: "link" | "create") => void;
  isTaskComplete: (status: string | undefined | null) => boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Stage Milestones</h2>
        <Button onClick={() => openMilestoneModal("link")} className="gap-2" data-testid="button-add-milestone">
          <Plus className="h-4 w-4" />
          Add Milestone
        </Button>
      </div>
      
      {milestones.length > 0 ? (
        <Accordion type="multiple" defaultValue={milestones.map((m: any) => m.id)} className="space-y-3">
          {milestones.map((m: any) => {
            const linkedTaskIds = allMilestoneLinks
              .filter((link: any) => link.milestoneId === m.id)
              .map((link: any) => link.taskId);
            const milestoneTasks = allTasks.filter((t: any) => linkedTaskIds.includes(t.id));
            const completedTasks = milestoneTasks.filter((t: any) => isTaskComplete(t.status)).length;
            const progressPercent = milestoneTasks.length > 0 ? Math.round((completedTasks / milestoneTasks.length) * 100) : 0;
            
            return (
              <AccordionItem key={m.id} value={m.id} className="border rounded-lg bg-background shadow-sm">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-2">
                    <div className="flex items-center gap-3">
                      <Target className={cn(
                        "h-5 w-5",
                        m.status === 'Completed' || m.status === 'achieved' ? "text-green-600" :
                        m.status === 'In Progress' || m.status === 'in_progress' ? "text-blue-600" :
                        "text-muted-foreground"
                      )} />
                      <div className="text-left">
                        <h3 className="font-medium text-base">{m.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {m.targetDate}
                          </span>
                          <span>{milestoneTasks.length} tasks</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        m.status === 'Completed' || m.status === 'achieved' ? "bg-green-50 text-green-700 border-green-200" :
                        m.status === 'In Progress' || m.status === 'in_progress' ? "bg-blue-50 text-blue-700 border-blue-200" :
                        "bg-slate-50 text-slate-700 border-slate-200"
                      )}>
                        {m.status}
                      </Badge>
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all" style={{ width: `${progressPercent}%` }} />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground w-8">{progressPercent}%</span>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-2 pt-2">
                    {milestoneTasks.length > 0 ? milestoneTasks.map((task: any) => {
                      const assignee = getAssignee(task.assigneeId);
                      return (
                        <div 
                          key={task.id} 
                          className="flex items-center gap-3 p-3 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            task.status === "Done" ? "bg-green-500" :
                            task.status === "In Progress" ? "bg-blue-500" :
                            task.status === "Review" ? "bg-amber-500" :
                            "bg-slate-400"
                          )} />
                          <Link href={`/projects/${projectId}/tasks/${task.id}`} className="flex-1 min-w-0">
                            <span className="text-sm font-medium hover:text-primary hover:underline decoration-primary/30 underline-offset-2 truncate block">
                              {task.title}
                            </span>
                          </Link>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {task.status}
                          </Badge>
                          {assignee && (
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                {assignee.name?.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      );
                    }) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <p className="text-sm">No tasks linked to this milestone</p>
                        <Link href={`/projects/${projectId}/milestones/${m.id}`}>
                          <Button variant="outline" size="sm" className="mt-2 gap-2">
                            View Milestone
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-medium mb-1">
              {milestones.length === 0 ? "No milestones yet" : "No milestones match your search"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {milestones.length === 0 ? "Create your first milestone to track progress" : "Try adjusting your search terms"}
            </p>
            {milestones.length === 0 && (
              <Button size="sm" className="gap-2" onClick={() => openMilestoneModal("link")}>
                <Plus className="h-4 w-4" />
                Add Milestone
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
