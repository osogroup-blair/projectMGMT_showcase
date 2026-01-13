import { Shell } from "@/components/layout/shell";
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  Kanban,
  Settings,
  Flag,
  ListTodo,
  Layers,
  Eye,
  Briefcase,
  Loader2,
  Pencil,
  Check,
  X,
  Plus,
  Zap,
  ClipboardList,
  Users as UsersIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRoute, Link, useSearch, useLocation } from "wouter";
import { useProject, useProjects, useTasks, useMilestones, useUsers, useDeliverables, useEpics, useProjectStages, useFrameworkTemplates, useSprints, useResolvedTaskTypes, useStatusOptions } from "@/hooks/use-nexus-data";
import { useCompletedStatuses } from "@/hooks/use-completed-statuses";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useCurrentUser } from "@/context/current-user-context";
import { EFFORT_VALUES } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { UnifiedTimeline } from "@/features/project/timeline/unified-timeline";
import { useMemo, useState, useEffect } from "react";
import { ProjectDashboard } from "@/features/project/dashboard/types";
import { differenceInDays, parseISO, format } from "date-fns";
import { TimeHorizonDashboard, DashboardFilterControls, type DashboardFilters } from "@/features/dashboard";

// Mock Data Types
interface TaskStats {
  total: number;
  completed: number;
  atRisk: number;
  inProgress: number;
}

import { DeliverablesContent } from "@/pages/deliverables";
import { TaskListContent } from "@/features/project/tasks/task-list-content";
import { MilestonesContent } from "@/features/project/milestones/milestones-content";
import { StagesContent } from "@/features/project/stages/stages-content";
import { SprintsContent } from "@/features/project/sprints/sprints-content";
import { PortableKanban } from "@/components/kanban";
import { BlockerReasonDialog } from "@/features/project/sprints/blocker-reason-dialog";
import { LivePulseCheck } from "@/features/project/sprints/live-pulse-check";
import { NextSprintBacklog } from "@/features/project/sprints/next-sprint-backlog";
import { TasksByPerson } from "@/features/project/tasks-by-person";
import { Activity, PanelLeft, Send, BarChart3, ChevronLeftIcon, ChevronRightIcon, Search, Filter, MessageSquare } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ProjectOverview() {
  const [match, params] = useRoute("/projects/:projectId");
  const projectId = params?.projectId || "1";
  const searchString = useSearch();
  const [, setLocation] = useLocation();
  
  // Parse tab from URL search params - always ensure we have a valid default
  const tabFromUrl = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return params.get("tab") || "overview";
  }, [searchString]);
  
  // Initialize state from URL
  const [activeTab, setActiveTab] = useState<string>(() => {
    const params = new URLSearchParams(searchString);
    return params.get("tab") || "overview";
  });
  
  // Sync tab state when URL changes externally (e.g., navigation from task board)
  useEffect(() => {
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl, activeTab]);
  
  // Handle tab changes and sync URL
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    // Update URL to reflect the tab change for deep linking
    if (newTab === "overview") {
      setLocation(`/projects/${projectId}`);
    } else {
      setLocation(`/projects/${projectId}?tab=${newTab}`);
    }
  };

  const { data: project, isLoading: isProjectLoading, refetch: refetchProject } = useProject(projectId);
  const { update: updateProject } = useProjects();
  const { data: allTasks, isLoading: isTasksLoading } = useTasks();
  const { data: allMilestones, isLoading: isMilestonesLoading } = useMilestones();
  const { data: users, isLoading: isUsersLoading } = useUsers();
  const { data: allDeliverables, isLoading: isDeliverablesLoading } = useDeliverables();
  const { data: allEpics, isLoading: isEpicsLoading } = useEpics();
  const { data: projectStages, isLoading: isStagesLoading } = useProjectStages();
  const { data: frameworkTemplates, isLoading: isFrameworksLoading } = useFrameworkTemplates();
  const { data: allSprints, isLoading: isSprintsLoading } = useSprints();
  const { data: taskTypes } = useResolvedTaskTypes(projectId);
  const { createAsync: createTaskAsync, update: updateTask } = useTasks();
  const { toast } = useToast();
  const { data: statusOptions = [] } = useStatusOptions();
  const { currentUser } = useCurrentUser();
  const { isTaskComplete } = useCompletedStatuses();

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
    (statusOptions || [])
      .filter((s: any) => s.type === "task")
      .map((s: any) => ({ id: s.id, label: s.label, color: s.color })),
    [statusOptions]
  );

  const handleHoverStatusChange = (taskId: string, newStatus: string) => {
    updateTask({ id: taskId, updates: { status: newStatus } });
  };

  const handleHoverBlockedToggle = (taskId: string, blocked: boolean) => {
    updateTask({ id: taskId, updates: { blocked } });
  };

  const handleHoverDueDateChange = (taskId: string, date: Date | null) => {
    const deadline = date ? format(date, "yyyy-MM-dd") : undefined;
    updateTask({ id: taskId, updates: { deadline } });
  };

  const handleHoverAddComment = (taskId: string, comment: string) => {
    if (currentUser?.id && currentUser?.name) {
      addCommentMutation.mutate({ taskId, comment, authorId: currentUser.id, authorName: currentUser.name });
    }
  };

  const handleHoverAssigneeChange = (taskId: string, assigneeId: string | null) => {
    updateTask({ id: taskId, updates: { assigneeId } });
  };

  // Inline editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingStartDate, setIsEditingStartDate] = useState(false);
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editDeadline, setEditDeadline] = useState("");

  // Dashboard filters state (lifted up for tab row display)
  const [dashboardFilters, setDashboardFilters] = useState<DashboardFilters>({
    range: 'week',
    projectIds: projectId ? [projectId] : [],
    assigneeScope: 'all',
  });

  // Metrics accordion state
  const [metricsOpen, setMetricsOpen] = useState(false);
  
  // Blocker dialog for flow board
  const [blockerTaskId, setBlockerTaskId] = useState<string | null>(null);
  
  // Team Pulse sidebar state
  const [teamPulseOpen, setTeamPulseOpen] = useState(true);
  
  // Team Pulse input state
  const [pulseDid, setPulseDid] = useState("");
  const [pulseNext, setPulseNext] = useState("");
  const [pulseBlockers, setPulseBlockers] = useState("");
  
  // Team Pulse updates filter state
  const [pulseSearch, setPulseSearch] = useState("");
  const [pulseTypeFilter, setPulseTypeFilter] = useState<"all" | "accomplishments" | "blockers" | "next-steps">("all");
  const [pulseUserFilter, setPulseUserFilter] = useState<string>("all");
  
  // Mock pulse updates data (in a real app, this would come from an API)
  const [pulseUpdates, setPulseUpdates] = useState<Array<{
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    type: "accomplishment" | "blocker" | "next-step";
    content: string;
    timestamp: Date;
  }>>([
    {
      id: "1",
      userId: "user1",
      userName: "Alex Chen",
      type: "accomplishment",
      content: "Completed the user authentication flow and integration tests",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: "2",
      userId: "user2",
      userName: "Sarah Miller",
      type: "blocker",
      content: "Waiting on API documentation from the backend team",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
    {
      id: "3",
      userId: "user1",
      userName: "Alex Chen",
      type: "next-step",
      content: "Will start working on the dashboard analytics component",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
    {
      id: "4",
      userId: "user3",
      userName: "Jordan Lee",
      type: "accomplishment",
      content: "Fixed critical bug in payment processing module",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  ]);
  
  // Dashboard sidebar state
  const [dashboardSidebarOpen, setDashboardSidebarOpen] = useState(true);
  const [dashboardSection, setDashboardSection] = useState<"team-pulse" | "assigned-work" | "current-sprint" | "upcoming-work" | "activity">("current-sprint");

  // Add Task to Sprint Dialog state
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [addTaskMode, setAddTaskMode] = useState<"link" | "create">("link");
  const [selectedExistingTaskId, setSelectedExistingTaskId] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [newTaskEffort, setNewTaskEffort] = useState<number>(3);
  const [newTaskEpicId, setNewTaskEpicId] = useState("");
  const [newTaskStageId, setNewTaskStageId] = useState("");
  const [newTaskTypeId, setNewTaskTypeId] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Initialize edit values when project loads
  useEffect(() => {
    if (project) {
      setEditTitle(project.name || "");
      setEditDescription(project.description || "");
      setEditStartDate(project.startDate || "");
      setEditDeadline(project.deadline || "");
    }
  }, [project]);

  const handleSaveTitle = () => {
    if (!editTitle.trim()) {
      toast({ title: "Error", description: "Project title cannot be empty.", variant: "destructive" });
      return;
    }
    updateProject({ id: projectId, updates: { name: editTitle.trim() } });
    setIsEditingTitle(false);
    toast({ title: "Updated", description: "Project title has been updated." });
    refetchProject();
  };

  const handleSaveDescription = () => {
    updateProject({ id: projectId, updates: { description: editDescription.trim() } });
    setIsEditingDescription(false);
    toast({ title: "Updated", description: "Project description has been updated." });
    refetchProject();
  };

  const handleSaveStartDate = () => {
    updateProject({ id: projectId, updates: { startDate: editStartDate } });
    setIsEditingStartDate(false);
    toast({ title: "Updated", description: "Start date has been updated." });
    refetchProject();
  };

  const handleSaveDeadline = () => {
    updateProject({ id: projectId, updates: { deadline: editDeadline } });
    setIsEditingDeadline(false);
    toast({ title: "Updated", description: "Due date has been updated." });
    refetchProject();
  };

  // Derived Data
  const { tasks, milestones, stats, dashboardData } = useMemo(() => {
    if (!project) return { tasks: [], milestones: [], stats: { total: 0, completed: 0, inProgress: 0, atRisk: 0 }, dashboardData: null };

    const projectTasks = allTasks.filter((t: any) => t.project === project.name || t.projectId === project.id);
    const projectMilestones = allMilestones.filter((m: any) => m.projectId === project.id);
    const projectDeliverables = allDeliverables.filter((d: any) => d.projectId === project.id);
    const projectEpics = allEpics.filter((e: any) => 
      projectDeliverables.some((d: any) => d.id === e.deliverableId)
    );
    
    const stats = {
      total: projectTasks.length,
      completed: projectTasks.filter((t: any) => isTaskComplete(t.status)).length,
      inProgress: projectTasks.filter((t: any) => t.status === "In Progress").length,
      atRisk: projectTasks.filter((t: any) => t.priority === "High" && !isTaskComplete(t.status)).length
    };

    const percentComplete = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    const daysRemaining = project.deadline ? differenceInDays(parseISO(project.deadline), new Date()) : 0;
    
    const getAssigneeName = (id?: string) => {
      const user = users.find((u: any) => u.id === id);
      return user?.name || "Unassigned";
    };

    const upcomingItems = projectTasks
      .filter((t: any) => t.deadline && !isTaskComplete(t.status))
      .sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 5)
      .map((t: any) => ({
        id: t.id,
        type: "task" as const,
        title: t.title,
        dueDate: t.deadline,
        horizon: differenceInDays(parseISO(t.deadline), new Date()) <= 7 ? "short" as const : "long" as const,
        status: (t.status === "In Progress" ? "in_progress" : "not_started") as "in_progress" | "not_started" | "blocked" | "complete",
        owner: getAssigneeName(t.assigneeId),
        priority: t.priority?.toLowerCase() || "medium",
        progress: isTaskComplete(t.status) ? 100 : t.status === "In Progress" ? 50 : 0
      }));

    const milestoneItems = projectMilestones
      .filter((m: any) => m.date && m.status !== "Completed")
      .slice(0, 3)
      .map((m: any) => ({
        id: m.id,
        type: "milestone" as const,
        title: m.name,
        dueDate: m.date,
        horizon: differenceInDays(parseISO(m.date), new Date()) <= 7 ? "short" as const : "long" as const,
        status: "not_started" as "in_progress" | "not_started" | "blocked" | "complete",
        priority: "high" as "high" | "medium" | "low" | "critical",
        progress: 0
      }));

    const recentActivityItems = projectTasks
      .filter((t: any) => isTaskComplete(t.status))
      .slice(0, 5)
      .map((t: any) => ({
        id: t.id,
        type: "task_completed" as const,
        title: t.title,
        timestamp: new Date().toISOString(),
        actor: getAssigneeName(t.assigneeId)
      }));

    const dashboardData: ProjectDashboard = {
      projectId: project.id,
      projectName: project.name,
      lastUpdated: new Date().toISOString(),
      statusSnapshot: {
        health: stats.atRisk > 2 ? "red" : stats.atRisk > 0 ? "yellow" : "green",
        phase: "develop_solution",
        percentComplete,
        originalEndDate: project.deadline || "",
        projectedEndDate: project.deadline || "",
        daysRemaining: Math.max(0, daysRemaining),
        openRisksCount: 0,
        openIssuesCount: stats.atRisk,
        pendingDecisionsCount: 0,
        upcomingMilestonesCount: projectMilestones.filter((m: any) => m.status !== "Completed").length
      },
      financialResourceSnapshot: {
        currency: "USD",
        budgetPlanned: project.budget || 0,
        budgetUsed: Math.round((project.budget || 0) * (percentComplete / 100)),
        budgetForecastFinal: project.budget || 0,
        hoursPlanned: 0,
        hoursUsed: 0,
        hoursForecastFinal: 0,
        spendByPhase: [],
        resourceUtilization: users.slice(0, 4).map((u: any) => ({
          entityId: u.id,
          entityType: "person" as const,
          name: u.name,
          monthlyBudgetedHours: 160,
          monthlyActualHours: 140,
          totalBudgetedHours: 480,
          totalActualHours: 400,
          status: "healthy" as const
        }))
      },
      upcomingWork: {
        horizonDaysShort: 7,
        horizonDaysLong: 21,
        items: [...upcomingItems, ...milestoneItems]
      },
      riskIssuePanel: {
        trend: "stable" as const,
        risks: [],
        issues: projectTasks
          .filter((t: any) => t.priority === "High" && !isTaskComplete(t.status))
          .slice(0, 3)
          .map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description || "",
            severity: "high" as const,
            owner: getAssigneeName(t.assigneeId),
            status: "open" as const,
            targetResolutionDate: t.deadline || ""
          }))
      },
      recentActivity: {
        windowDays: 7,
        completedCount: stats.completed,
        completedChangePercentVsPrevWindow: 0,
        items: recentActivityItems
      }
    };

    return { tasks: projectTasks, milestones: projectMilestones, stats, dashboardData };
  }, [project, allTasks, allMilestones, users, allDeliverables, allEpics]);

  // Use actual project stages from database, filtered by project and sorted by order
  const stages = useMemo(() => {
    if (!projectStages) return [];
    return [...projectStages]
      .filter((s: any) => s.projectId === projectId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [projectStages, projectId]);

  // Filter sprints for this project
  const projectSprints = useMemo(() => {
    if (!allSprints) return [];
    return allSprints.filter((s: any) => s.projectId === projectId);
  }, [allSprints, projectId]);

  // Filter deliverables and epics for the timeline
  const projectDeliverables = useMemo(() => {
    if (!allDeliverables) return [];
    return allDeliverables.filter((d: any) => d.projectId === projectId);
  }, [allDeliverables, projectId]);

  const projectEpics = useMemo(() => {
    if (!allEpics || !projectDeliverables) return [];
    const deliverableIds = new Set(projectDeliverables.map((d: any) => d.id));
    return allEpics.filter((e: any) => deliverableIds.has(e.deliverableId));
  }, [allEpics, projectDeliverables]);

  // Find the default sprint for this project (active sprint whose dates include today, or first sprint)
  const defaultSprintId = useMemo(() => {
    if (!projectSprints || projectSprints.length === 0) return null;
    const today = new Date();
    // First try to find an active sprint that covers today
    const activeSprint = projectSprints.find((s: any) => {
      if (s.status !== "active") return false;
      if (!s.startDate) return true; // If no dates, include it
      const startDate = parseISO(s.startDate);
      const endDate = s.endDate ? parseISO(s.endDate) : null;
      return startDate <= today && (!endDate || endDate >= today);
    });
    if (activeSprint) return activeSprint.id;
    // Fall back to any active sprint
    const anyActive = projectSprints.find((s: any) => s.status === "active");
    if (anyActive) return anyActive.id;
    // Fall back to first sprint
    return projectSprints[0]?.id || null;
  }, [projectSprints]);

  // Selected sprint state (for the dropdown)
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);

  // Update selected sprint when default changes
  useEffect(() => {
    if (defaultSprintId && !selectedSprintId) {
      setSelectedSprintId(defaultSprintId);
    }
  }, [defaultSprintId, selectedSprintId]);

  // Get the currently selected sprint object
  const selectedSprint = useMemo(() => {
    if (!projectSprints || !selectedSprintId) return null;
    return projectSprints.find((s: any) => s.id === selectedSprintId) || projectSprints[0] || null;
  }, [projectSprints, selectedSprintId]);

  // Get tasks for the selected sprint
  const sprintTasks = useMemo(() => {
    if (!selectedSprint || !allTasks) return [];
    return allTasks.filter((t: any) => t.sprintId === selectedSprint.id);
  }, [selectedSprint, allTasks]);

  // Find the next sprint (first planned/upcoming sprint after active)
  const nextSprint = useMemo(() => {
    if (!projectSprints || projectSprints.length === 0) return null;
    const plannedSprints = projectSprints.filter((s: any) => 
      s.status === "planned" || s.status === "upcoming"
    );
    if (plannedSprints.length === 0) return null;
    return plannedSprints.sort((a: any, b: any) => {
      if (!a.startDate || !b.startDate) return 0;
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    })[0];
  }, [projectSprints]);

  // Get tasks for the next sprint
  const nextSprintTasks = useMemo(() => {
    if (!nextSprint || !allTasks) return [];
    return allTasks.filter((t: any) => t.sprintId === nextSprint.id);
  }, [nextSprint, allTasks]);

  // Get project tasks (for backlog display when no next sprint)
  const projectTasks = useMemo(() => {
    if (!allTasks) return [];
    return allTasks.filter((t: any) => t.projectId === projectId);
  }, [allTasks, projectId]);

  // Get tasks assigned to current user for "Assigned Work" section
  const myAssignedTasks = useMemo(() => {
    if (!allTasks || !currentUser?.id) return [];
    return allTasks.filter((t: any) => 
      t.projectId === projectId && 
      t.assigneeId === currentUser.id &&
      !isTaskComplete(t.status)
    );
  }, [allTasks, projectId, currentUser?.id]);

  // Sprint metrics for the selected sprint
  const sprintMetrics = useMemo(() => {
    if (!selectedSprint || !sprintTasks) return null;
    
    const totalTasks = sprintTasks.length;
    const completedTasks = sprintTasks.filter((t: any) => isTaskComplete(t.status)).length;
    const inProgressTasks = sprintTasks.filter((t: any) => t.status === "In Progress").length;
    const blockedTasks = sprintTasks.filter((t: any) => t.status === "Blocked" || t.blocked).length;
    const todoTasks = sprintTasks.filter((t: any) => t.status === "Todo" || t.status === "BACKLOGGED").length;
    
    // Calculate workload by assignee
    const workloadByUser: Record<string, { name: string; total: number; completed: number; inProgress: number; blocked: number }> = {};
    sprintTasks.forEach((task: any) => {
      const userId = task.assigneeId || "unassigned";
      const userName = users?.find((u: any) => u.id === task.assigneeId)?.name || "Unassigned";
      
      if (!workloadByUser[userId]) {
        workloadByUser[userId] = { name: userName, total: 0, completed: 0, inProgress: 0, blocked: 0 };
      }
      workloadByUser[userId].total++;
      if (isTaskComplete(task.status)) workloadByUser[userId].completed++;
      if (task.status === "In Progress") workloadByUser[userId].inProgress++;
      if (task.status === "Blocked" || task.blocked) workloadByUser[userId].blocked++;
    });
    
    // Calculate total effort/story points
    const totalEffort = sprintTasks.reduce((sum: number, t: any) => sum + (t.effort || 0), 0);
    const completedEffort = sprintTasks.filter((t: any) => isTaskComplete(t.status)).reduce((sum: number, t: any) => sum + (t.effort || 0), 0);
    
    const percentComplete = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      todoTasks,
      totalEffort,
      completedEffort,
      percentComplete,
      workloadByUser: Object.values(workloadByUser).sort((a, b) => b.total - a.total)
    };
  }, [selectedSprint, sprintTasks, users]);

  // Get available tasks (any project task not already in the selected sprint)
  const availableTasks = useMemo(() => {
    if (!allTasks || !selectedSprint) return [];
    return allTasks.filter((t: any) => 
      t.projectId === projectId && 
      t.sprintId !== selectedSprint.id
    );
  }, [allTasks, selectedSprint, projectId]);

  // Add Task dialog handlers
  const openAddTaskDialog = () => {
    setAddTaskMode("link");
    setSelectedExistingTaskId("");
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskPriority("Medium");
    setNewTaskEffort(3);
    setNewTaskEpicId(projectEpics[0]?.id || "");
    setNewTaskStageId(stages[0]?.id || "");
    // Default to "Action" task type, or isDefault, or first available
    const actionType = (taskTypes || []).find((tt: any) => tt.name === "Action");
    const defaultTaskType = actionType || (taskTypes || []).find((tt: any) => tt.isDefault) || (taskTypes || [])[0];
    setNewTaskTypeId(defaultTaskType?.id || "");
    setAddTaskDialogOpen(true);
  };

  const handleAddTaskToSprint = async () => {
    if (!selectedSprint) return;
    setIsAddingTask(true);
    
    try {
      if (addTaskMode === "link") {
        if (!selectedExistingTaskId) {
          toast({ title: "Error", description: "Please select a task to add.", variant: "destructive" });
          setIsAddingTask(false);
          return;
        }
        await updateTask({ id: selectedExistingTaskId, updates: { sprintId: selectedSprint.id } });
        toast({ title: "Task Added", description: "Task has been added to the sprint." });
      } else {
        if (!newTaskTitle.trim()) {
          toast({ title: "Error", description: "Task title is required.", variant: "destructive" });
          setIsAddingTask(false);
          return;
        }
        if (!newTaskEpicId) {
          toast({ title: "Error", description: "Please select an epic.", variant: "destructive" });
          setIsAddingTask(false);
          return;
        }
        if (!newTaskStageId) {
          toast({ title: "Error", description: "Please select a stage.", variant: "destructive" });
          setIsAddingTask(false);
          return;
        }
        if (!newTaskTypeId) {
          toast({ title: "Error", description: "Please select a task type.", variant: "destructive" });
          setIsAddingTask(false);
          return;
        }
        await createTaskAsync({
          title: newTaskTitle,
          description: newTaskDescription || "",
          project: project?.name,
          projectId: project?.id,
          epicId: newTaskEpicId,
          stageId: newTaskStageId,
          sprintId: selectedSprint.id,
          status: "BACKLOGGED",
          priority: newTaskPriority,
          effort: newTaskEffort,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          tags: [],
          taskTypeId: newTaskTypeId || null,
          assigneeId: currentUser?.id || null
        });
        toast({ title: "Task Created", description: "New task has been added to the sprint." });
      }
      setAddTaskDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add task.", variant: "destructive" });
    } finally {
      setIsAddingTask(false);
    }
  };

  // Handle task move in flow board
  const handleTaskMove = (taskId: string, newStatus: string, blockerReason?: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === "Blocked" && blockerReason) {
      updates.blocked = true;
      updates.blockerReason = blockerReason;
    } else if (newStatus !== "Blocked") {
      updates.blocked = false;
      updates.blockerReason = null;
    }
    updateTask({ id: taskId, updates });
    toast({ title: "Updated", description: `Task moved to ${newStatus}` });
  };

  // Handle blocker request
  const handleBlockerRequested = (taskId: string) => {
    setBlockerTaskId(taskId);
  };

  // Get the framework name from the framework ID
  const frameworkName = useMemo(() => {
    if (!project?.frameworkId || !frameworkTemplates) return "Not set";
    const framework = frameworkTemplates.find((f: any) => f.id === project.frameworkId);
    return framework?.name || "Unknown Framework";
  }, [project?.frameworkId, frameworkTemplates]);

  if (isProjectLoading || isTasksLoading || isMilestonesLoading || isUsersLoading || isDeliverablesLoading || isEpicsLoading || isStagesLoading || isFrameworksLoading || isSprintsLoading) {
    return (
      <Shell>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  if (!project) {
    return (
      <Shell>
         <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
            <h1 className="text-2xl font-bold">Project Not Found</h1>
            <p className="text-muted-foreground">The project you are looking for does not exist.</p>
            <Link href="/projects">
              <Button>Return to Projects</Button>
            </Link>
         </div>
      </Shell>
    );
  }

  const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <Shell noPadding>
      <div className="flex flex-col">
        {/* Header Section - Wrapped in padding */}
        <div className="px-6 py-8 space-y-8 pt-[10px] pb-[10px]">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3 w-full">
                  {isEditingTitle ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="text-3xl font-bold tracking-tight h-auto py-0 px-0 bg-transparent border-0 border-b-2 border-primary/30 focus:border-primary rounded-none shadow-none focus-visible:ring-0 flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveTitle();
                          if (e.key === "Escape") { setIsEditingTitle(false); setEditTitle(project.name); }
                        }}
                        data-testid="input-edit-title"
                      />
                      <Button size="icon" variant="ghost" onClick={handleSaveTitle} data-testid="button-save-title">
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => { setIsEditingTitle(false); setEditTitle(project.name); }} data-testid="button-cancel-title">
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group flex-1">
                      <h1 className="text-3xl font-bold tracking-tight text-primary" data-testid="text-project-title">{project.name}</h1>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity" 
                        onClick={() => setIsEditingTitle(true)}
                        data-testid="button-edit-title"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  )}
                  <Badge variant="outline" className={cn(
                    "px-2.5 py-0.5 text-sm font-medium border-0 shrink-0",
                    project.status === 'In Progress' && "bg-blue-50 text-blue-700",
                    project.status === 'Upcoming' && "bg-purple-50 text-purple-700",
                    project.status === 'Overdue' && "bg-red-50 text-red-700",
                    project.status === 'Completed' && "bg-green-50 text-green-700"
                  )}>
                    {project.status}
                  </Badge>
                </div>

                {isEditingDescription ? (
                  <div className="flex items-start gap-2 max-w-xl">
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Add a project description..."
                      className="min-h-[60px] text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Escape") { setIsEditingDescription(false); setEditDescription(project.description || ""); }
                      }}
                      data-testid="input-edit-description"
                    />
                    <Button size="icon" variant="ghost" onClick={handleSaveDescription} data-testid="button-save-description">
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => { setIsEditingDescription(false); setEditDescription(project.description || ""); }} data-testid="button-cancel-description">
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <p className="text-sm text-muted-foreground max-w-xl" data-testid="text-project-description">
                      {project.description || <span className="italic">Click to add description...</span>}
                    </p>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6" 
                      onClick={() => setIsEditingDescription(true)}
                      data-testid="button-edit-description"
                    >
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5" data-testid="text-framework-name">
                    <Briefcase className="h-4 w-4" />
                    {frameworkName}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  {isEditingStartDate ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <Input
                        type="date"
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                        className="h-7 w-36 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveStartDate();
                          if (e.key === "Escape") { setIsEditingStartDate(false); setEditStartDate(project.startDate || ""); }
                        }}
                        data-testid="input-edit-start-date"
                      />
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSaveStartDate} data-testid="button-save-start-date">
                        <Check className="h-3 w-3 text-green-600" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setIsEditingStartDate(false); setEditStartDate(project.startDate || ""); }} data-testid="button-cancel-start-date">
                        <X className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 group">
                      <Calendar className="h-4 w-4" />
                      <span data-testid="text-start-date">Start: {project.startDate || "Not set"}</span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5" 
                        onClick={() => setIsEditingStartDate(true)}
                        data-testid="button-edit-start-date"
                      >
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  )}
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                  {isEditingDeadline ? (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <Input
                        type="date"
                        value={editDeadline}
                        onChange={(e) => setEditDeadline(e.target.value)}
                        className="h-7 w-36 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveDeadline();
                          if (e.key === "Escape") { setIsEditingDeadline(false); setEditDeadline(project.deadline || ""); }
                        }}
                        data-testid="input-edit-deadline"
                      />
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSaveDeadline} data-testid="button-save-deadline">
                        <Check className="h-3 w-3 text-green-600" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setIsEditingDeadline(false); setEditDeadline(project.deadline || ""); }} data-testid="button-cancel-deadline">
                        <X className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 group">
                      <Calendar className="h-4 w-4" />
                      <span data-testid="text-deadline">Due {project.deadline || "Not set"}</span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5" 
                        onClick={() => setIsEditingDeadline(true)}
                        data-testid="button-edit-deadline"
                      >
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Collapsible open={metricsOpen} onOpenChange={setMetricsOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2" data-testid="button-toggle-metrics">
                      <ChevronDown className={cn("h-4 w-4 transition-transform", metricsOpen && "rotate-180")} />
                      Project Metrics
                    </Button>
                  </CollapsibleTrigger>
                </Collapsible>
                <Link href={`/projects/${projectId}/edit`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Project Settings
                  </Button>
                </Link>
              </div>
            </div>

            <Collapsible open={metricsOpen} onOpenChange={setMetricsOpen}>
              <CollapsibleContent className="mt-[-6px] mb-[-6px] pt-[1px] pb-[1px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-muted-foreground">Completion</p>
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold" data-testid="text-completion-percent">{completionPercentage}%</h3>
                      </div>
                      <Progress value={completionPercentage} className="h-2 mt-4" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                        <ListTodo className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold" data-testid="text-total-tasks">{stats.total}</h3>
                        <p className="text-xs text-muted-foreground">across all epics</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-4">
                        {stats.completed} completed, {stats.inProgress} in progress
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-muted-foreground">At Risk</p>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-red-600" data-testid="text-at-risk-tasks">{stats.atRisk}</h3>
                        <p className="text-xs text-muted-foreground">tasks needing attention</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-4">
                        High priority items past due
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-muted-foreground">Milestones</p>
                        <Flag className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold" data-testid="text-milestone-count">{milestones.length}</h3>
                        <p className="text-xs text-muted-foreground">defined</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-4">
                        Next: {milestones[0]?.name || "None scheduled"}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        {/* Tabs Navigation - Sticky to Breadcrumbs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="sticky top-0 z-30 bg-background border-b shadow-sm">
            <div className="px-6 flex items-center justify-between">
              <TabsList className="justify-start rounded-none h-auto p-0 bg-transparent gap-6 overflow-x-auto no-scrollbar">
                <TabsTrigger 
                  value="overview" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 font-medium transition-none shadow-none"
                >
                  Dashboard
                </TabsTrigger>

                <TabsTrigger 
                  value="timeline" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 font-medium transition-none shadow-none"
                >
                  Timeline
                </TabsTrigger>

                <TabsTrigger 
                  value="sprints" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 font-medium transition-none shadow-none"
                >
                  Sprints
                </TabsTrigger>

                <TabsTrigger 
                  value="milestones" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 font-medium transition-none shadow-none"
                >
                  Milestones
                </TabsTrigger>

                <TabsTrigger 
                  value="tasks" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 font-medium transition-none shadow-none"
                >
                  Tasks
                </TabsTrigger>

                <TabsTrigger 
                  value="deliverables" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 font-medium transition-none shadow-none"
                >
                  Deliverables
                </TabsTrigger>

                <TabsTrigger 
                  value="stages" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 font-medium transition-none shadow-none"
                >
                  Stages
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <div className="px-6 py-6">
            <TabsContent value="overview" className="mt-0 outline-none">
              <div className="flex gap-0">
                {dashboardSidebarOpen ? (
                  <div className="w-56 border-r pr-4 shrink-0">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dashboard</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => setDashboardSidebarOpen(false)}
                        data-testid="button-collapse-dashboard-nav"
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    <nav className="space-y-1">
                      <button
                        onClick={() => setDashboardSection("current-sprint")}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                          dashboardSection === "current-sprint" 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                        data-testid="nav-current-sprint"
                      >
                        <Zap className="h-4 w-4" />
                        Current Sprint
                      </button>
                      <button
                        onClick={() => setDashboardSection("team-pulse")}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                          dashboardSection === "team-pulse" 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                        data-testid="nav-team-pulse"
                      >
                        <Send className="h-4 w-4" />
                        Team Pulse
                      </button>
                      <button
                        onClick={() => setDashboardSection("assigned-work")}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                          dashboardSection === "assigned-work" 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                        data-testid="nav-assigned-work"
                      >
                        <ClipboardList className="h-4 w-4" />
                        Assigned Work
                      </button>
                      <button
                        onClick={() => setDashboardSection("upcoming-work")}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                          dashboardSection === "upcoming-work" 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                        data-testid="nav-upcoming-work"
                      >
                        <Clock className="h-4 w-4" />
                        Upcoming Sprints
                      </button>
                      <button
                        onClick={() => setDashboardSection("activity")}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                          dashboardSection === "activity" 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                        data-testid="nav-activity"
                      >
                        <Activity className="h-4 w-4" />
                        Activity
                      </button>
                    </nav>
                  </div>
                ) : (
                  <div className="flex flex-col items-center border-r shrink-0 w-10 py-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 mb-1"
                      onClick={() => setDashboardSidebarOpen(true)}
                      data-testid="button-expand-dashboard-nav"
                    >
                      <ChevronRightIcon className="h-3.5 w-3.5" />
                    </Button>
                    <div className="flex flex-col items-center gap-0.5">
                      <Button 
                        variant={dashboardSection === "current-sprint" ? "default" : "ghost"} 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => setDashboardSection("current-sprint")}
                      >
                        <Zap className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant={dashboardSection === "team-pulse" ? "default" : "ghost"} 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => setDashboardSection("team-pulse")}
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant={dashboardSection === "assigned-work" ? "default" : "ghost"} 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => setDashboardSection("assigned-work")}
                      >
                        <ClipboardList className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant={dashboardSection === "upcoming-work" ? "default" : "ghost"} 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => setDashboardSection("upcoming-work")}
                      >
                        <Clock className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant={dashboardSection === "activity" ? "default" : "ghost"} 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => setDashboardSection("activity")}
                      >
                        <Activity className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className={cn("flex-1 min-w-0", dashboardSidebarOpen ? "pl-6" : "pl-4")}>
                  {dashboardSection === "assigned-work" && (
                    <TasksByPerson
                      config={{
                        projectId,
                        showJustMyTasksToggle: true,
                        defaultJustMyTasks: false,
                        allowedScopes: ["all", "sprint", "milestone", "deliverable", "unscoped"],
                        allowInlineEditing: false,
                        defaultExpanded: false,
                        currentUserId: currentUser?.id,
                      }}
                      tasks={allTasks}
                      users={users || []}
                      epics={projectEpics}
                      sprints={projectSprints}
                      milestones={milestones}
                      deliverables={projectDeliverables}
                      isLoading={isTasksLoading || isUsersLoading}
                      onCreateTask={async (taskData) => {
                        const epic = projectEpics.find((e: any) => e.id === taskData.epicId);
                        await createTaskAsync({
                          id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                          title: taskData.title,
                          description: taskData.description,
                          project: project?.name || "",
                          projectId,
                          assigneeId: taskData.assigneeId || null,
                          epicId: taskData.epicId || null,
                          sprintId: taskData.sprintId || null,
                          milestoneId: taskData.milestoneId || null,
                          priority: taskData.priority,
                          status: taskData.status,
                          deadline: format(new Date(), "yyyy-MM-dd"),
                          createdBy: currentUser?.id,
                        });
                        toast({ title: "Task created", description: `"${taskData.title}" has been created successfully.` });
                      }}
                    />
                  )}

                  {dashboardSection === "current-sprint" && (
                    <>
                      {projectSprints.length > 0 ? (
                        <div className="space-y-4">
                          {/* Sprint Metrics Accordion */}
                          {sprintMetrics && (
                            <Collapsible defaultOpen={false}>
                              <Card className="bg-muted/30 border-primary/20 shadow-sm overflow-hidden">
                                <CollapsibleTrigger asChild>
                                  <button type="button" className="group w-full py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors text-left flex items-center justify-between border-b border-primary/10">
                                    <div className="flex items-center gap-2">
                                      <BarChart3 className="h-4 w-4 text-primary" />
                                      <span className="font-semibold text-sm text-primary">Sprint Metrics</span>
                                      <Badge variant="outline" className="text-xs border-primary/20 bg-primary/5 text-primary">
                                        {sprintMetrics.percentComplete}% Complete
                                      </Badge>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-primary transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                  </button>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <CardContent className="pt-0 pb-4 px-4">
                                    <div className="space-y-4">
                                      {/* Task Status Metrics */}
                                      <div className="grid grid-cols-5 gap-3">
                                        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-center">
                                          <div className="text-2xl font-bold">{sprintMetrics.totalTasks}</div>
                                          <div className="text-xs text-muted-foreground">Total</div>
                                        </div>
                                        <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg text-center">
                                          <div className="text-2xl font-bold text-green-600">{sprintMetrics.completedTasks}</div>
                                          <div className="text-xs text-muted-foreground">Done</div>
                                        </div>
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-center">
                                          <div className="text-2xl font-bold text-blue-600">{sprintMetrics.inProgressTasks}</div>
                                          <div className="text-xs text-muted-foreground">In Progress</div>
                                        </div>
                                        <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-center">
                                          <div className="text-2xl font-bold text-amber-600">{sprintMetrics.todoTasks}</div>
                                          <div className="text-xs text-muted-foreground">To Do</div>
                                        </div>
                                        <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg text-center">
                                          <div className="text-2xl font-bold text-red-600">{sprintMetrics.blockedTasks}</div>
                                          <div className="text-xs text-muted-foreground">Blocked</div>
                                        </div>
                                      </div>

                                      {/* Progress Bar */}
                                      <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                          <span>Sprint Progress</span>
                                          <span>{sprintMetrics.completedEffort} / {sprintMetrics.totalEffort} effort points</span>
                                        </div>
                                        <Progress value={sprintMetrics.percentComplete} className="h-2" />
                                      </div>

                                      {/* Workload by Team Member */}
                                      {sprintMetrics.workloadByUser.length > 0 && (
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2 text-sm font-medium">
                                            <UsersIcon className="h-4 w-4 text-muted-foreground" />
                                            Team Workload
                                          </div>
                                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                            {sprintMetrics.workloadByUser.slice(0, 8).map((user, idx) => (
                                              <div key={idx} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                                                <Avatar className="h-6 w-6">
                                                  <AvatarFallback className="text-xs">
                                                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                  </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                  <div className="text-xs font-medium truncate">{user.name}</div>
                                                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                    <span className="text-green-600">{user.completed}</span>
                                                    <span>/</span>
                                                    <span>{user.total}</span>
                                                    {user.blocked > 0 && (
                                                      <span className="text-red-600 ml-1">({user.blocked} blocked)</span>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </CollapsibleContent>
                              </Card>
                            </Collapsible>
                          )}
                          
                          <PortableKanban
                            tasks={sprintTasks}
                            users={users || []}
                            epics={projectEpics || []}
                            milestones={milestones}
                            projectId={projectId}
                            boardId={`project-dashboard-${projectId}`}
                            titleSlot={
                              <div className="flex items-center gap-2">
                                <SearchableSelect
                                  value={selectedSprintId || ""}
                                  onValueChange={(val) => setSelectedSprintId(val)}
                                  placeholder="Select sprint..."
                                  options={projectSprints.map((sprint: any) => ({
                                    value: sprint.id,
                                    label: sprint.name,
                                  }))}
                                  triggerClassName="h-7 text-sm font-medium min-w-[160px]"
                                />
                                {selectedSprint && (
                                  <>
                                    <Badge variant={selectedSprint.status === "active" ? "default" : "secondary"} className="capitalize text-xs h-5">
                                      {selectedSprint.status}
                                    </Badge>
                                    {selectedSprint.startDate && selectedSprint.endDate && (
                                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {format(parseISO(selectedSprint.startDate), "MMM d")} - {format(parseISO(selectedSprint.endDate), "MMM d")}
                                      </span>
                                    )}
                                    {selectedSprint.endDate && (
                                      <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 min-w-[80px] text-center">
                                        {Math.max(0, differenceInDays(parseISO(selectedSprint.endDate), new Date()))} days left
                                      </span>
                                    )}
                                    <Link href={`/projects/${projectId}/sprints/${selectedSprint.id}?tab=run`}>
                                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1">
                                        <Settings className="h-3 w-3" />
                                        Details
                                      </Button>
                                    </Link>
                                  </>
                                )}
                              </div>
                            }
                            timeframe={selectedSprint?.startDate && selectedSprint?.endDate 
                              ? `${format(parseISO(selectedSprint.startDate), "MMM d")} - ${format(parseISO(selectedSprint.endDate), "MMM d, yyyy")}`
                              : undefined}
                            showAddTask={true}
                            onAddTask={openAddTaskDialog}
                            hoverCard={{
                              enabled: true,
                              users: users || [],
                              onAssigneeChange: handleHoverAssigneeChange,
                              onAddComment: handleHoverAddComment,
                              onDueDateChange: (taskId, date) => {
                                updateTask({ id: taskId, updates: { deadline: date?.toISOString().split('T')[0] || null } });
                              },
                            }}
                            onTaskMove={handleTaskMove}
                            onBlockerRequested={handleBlockerRequested}
                          />

                          <BlockerReasonDialog
                            open={!!blockerTaskId}
                            onOpenChange={(open) => !open && setBlockerTaskId(null)}
                            onConfirm={(reason) => {
                              if (blockerTaskId) {
                                handleTaskMove(blockerTaskId, "Blocked", reason);
                                setBlockerTaskId(null);
                              }
                            }}
                            onCancel={() => setBlockerTaskId(null)}
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[400px] text-center">
                          <Zap className="h-12 w-12 text-muted-foreground/50 mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No Active Sprint</h3>
                          <p className="text-muted-foreground mb-4">Create a sprint to start tracking your work</p>
                          <Link href={`/projects/${projectId}/sprints`}>
                            <Button>
                              <Plus className="h-4 w-4 mr-2" />
                              Go to Sprints
                            </Button>
                          </Link>
                        </div>
                      )}
                    </>
                  )}

                  {dashboardSection === "upcoming-work" && (
                    <NextSprintBacklog
                      projectId={projectId}
                      sprints={projectSprints}
                      allTasks={projectTasks}
                      users={users || []}
                      epics={projectEpics || []}
                    />
                  )}

                  {dashboardSection === "activity" && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5" />
                          Recent Activity
                        </CardTitle>
                        <CardDescription>Track updates and changes across the project</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {tasks.filter((t: any) => isTaskComplete(t.status)).length > 0 ? (
                            tasks
                              .filter((t: any) => isTaskComplete(t.status))
                              .slice(0, 10)
                              .map((task: any) => (
                                <div key={task.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{task.title}</p>
                                    <p className="text-xs text-muted-foreground">Task completed</p>
                                  </div>
                                </div>
                              ))
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <Activity className="h-10 w-10 mx-auto mb-3 opacity-50" />
                              <p className="text-sm">No recent activity</p>
                              <p className="text-xs mt-1">Activity will appear here as work progresses</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {dashboardSection === "team-pulse" && (
                    <div className="space-y-3">
                      {/* Share Update Panel */}
                      <Collapsible defaultOpen={false}>
                        <div className="border rounded-lg bg-muted/20">
                          <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              <span className="font-medium text-sm">Share an Update</span>
                            </div>
                            <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="px-4 pb-4 space-y-4">
                              <div className="space-y-2">
                                <Label className="text-xs text-green-600 font-medium">What did you accomplish?</Label>
                                <Textarea 
                                  placeholder="Completed tasks, delivered features, resolved issues..."
                                  className="min-h-[60px] text-sm resize-none"
                                  value={pulseDid}
                                  onChange={(e) => setPulseDid(e.target.value)}
                                  data-testid="input-pulse-did"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-blue-600 font-medium">What's next?</Label>
                                <Textarea 
                                  placeholder="Upcoming tasks, goals for today/tomorrow..."
                                  className="min-h-[60px] text-sm resize-none"
                                  value={pulseNext}
                                  onChange={(e) => setPulseNext(e.target.value)}
                                  data-testid="input-pulse-next"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-amber-600 font-medium">Any blockers?</Label>
                                <Textarea 
                                  placeholder="Issues preventing progress, dependencies needed..."
                                  className="min-h-[60px] text-sm resize-none"
                                  value={pulseBlockers}
                                  onChange={(e) => setPulseBlockers(e.target.value)}
                                  data-testid="input-pulse-blockers"
                                />
                              </div>
                              <Button 
                                size="sm" 
                                className="gap-2" 
                                data-testid="button-send-pulse"
                                disabled={!pulseDid.trim() && !pulseNext.trim() && !pulseBlockers.trim()}
                                onClick={() => {
                                  const newUpdates: typeof pulseUpdates = [];
                                  if (pulseDid.trim()) {
                                    newUpdates.push({
                                      id: `pulse-${Date.now()}-1`,
                                      userId: currentUser?.id || "current",
                                      userName: currentUser?.name || currentUser?.firstName || "You",
                                      type: "accomplishment",
                                      content: pulseDid.trim(),
                                      timestamp: new Date(),
                                    });
                                  }
                                  if (pulseNext.trim()) {
                                    newUpdates.push({
                                      id: `pulse-${Date.now()}-2`,
                                      userId: currentUser?.id || "current",
                                      userName: currentUser?.name || currentUser?.firstName || "You",
                                      type: "next-step",
                                      content: pulseNext.trim(),
                                      timestamp: new Date(),
                                    });
                                  }
                                  if (pulseBlockers.trim()) {
                                    newUpdates.push({
                                      id: `pulse-${Date.now()}-3`,
                                      userId: currentUser?.id || "current",
                                      userName: currentUser?.name || currentUser?.firstName || "You",
                                      type: "blocker",
                                      content: pulseBlockers.trim(),
                                      timestamp: new Date(),
                                    });
                                  }
                                  setPulseUpdates(prev => [...newUpdates, ...prev]);
                                  toast({ title: "Update sent", description: "Your pulse update has been shared with the team." });
                                  setPulseDid("");
                                  setPulseNext("");
                                  setPulseBlockers("");
                                }}
                              >
                                <Send className="h-3 w-3" />
                                Send Update
                              </Button>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>

                      {/* Recent Updates Panel */}
                      <Collapsible defaultOpen={true}>
                        <div className="border rounded-lg">
                          <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted/30 rounded-lg">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              <span className="font-medium text-sm">Recent Updates</span>
                              <Badge variant="secondary" className="text-xs ml-1">
                                {pulseUpdates.length}
                              </Badge>
                            </div>
                            <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="px-4 pb-4 space-y-3">
                              {/* Search and Filter Row */}
                              <div className="flex flex-col sm:flex-row gap-2">
                                <div className="relative flex-1">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    placeholder="Search updates..."
                                    className="pl-9 h-9"
                                    value={pulseSearch}
                                    onChange={(e) => setPulseSearch(e.target.value)}
                                    data-testid="input-pulse-search"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Select value={pulseTypeFilter} onValueChange={(v) => setPulseTypeFilter(v as typeof pulseTypeFilter)}>
                                    <SelectTrigger className="w-[140px] h-9" data-testid="select-pulse-type-filter">
                                      <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                      <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">All Types</SelectItem>
                                      <SelectItem value="accomplishments">Accomplishments</SelectItem>
                                      <SelectItem value="next-steps">Next Steps</SelectItem>
                                      <SelectItem value="blockers">Blockers</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Select value={pulseUserFilter} onValueChange={setPulseUserFilter}>
                                    <SelectTrigger className="w-[140px] h-9" data-testid="select-pulse-user-filter">
                                      <UsersIcon className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                                      <SelectValue placeholder="Team Member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">All Members</SelectItem>
                                      {Array.from(new Set(pulseUpdates.map(u => u.userName))).map(name => (
                                        <SelectItem key={name} value={name}>{name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {/* Updates List */}
                              <div className="space-y-3">
                                {(() => {
                                  const filtered = pulseUpdates.filter(update => {
                                    const matchesSearch = !pulseSearch || 
                                      update.content.toLowerCase().includes(pulseSearch.toLowerCase()) ||
                                      update.userName.toLowerCase().includes(pulseSearch.toLowerCase());
                                    
                                    const matchesType = pulseTypeFilter === "all" || 
                                      (pulseTypeFilter === "accomplishments" && update.type === "accomplishment") ||
                                      (pulseTypeFilter === "next-steps" && update.type === "next-step") ||
                                      (pulseTypeFilter === "blockers" && update.type === "blocker");
                                    
                                    const matchesUser = pulseUserFilter === "all" || update.userName === pulseUserFilter;
                                    
                                    return matchesSearch && matchesType && matchesUser;
                                  });

                                  if (filtered.length === 0) {
                                    return (
                                      <div className="text-center py-8 text-muted-foreground">
                                        <Send className="h-10 w-10 mx-auto mb-3 opacity-50" />
                                        <p className="text-sm">No updates found</p>
                                        <p className="text-xs mt-1">
                                          {pulseSearch || pulseTypeFilter !== "all" || pulseUserFilter !== "all" 
                                            ? "Try adjusting your filters" 
                                            : "Be the first to share progress with your team!"}
                                        </p>
                                      </div>
                                    );
                                  }

                                  return filtered.map(update => {
                                    const typeConfig = {
                                      accomplishment: { 
                                        icon: CheckCircle2, 
                                        color: "text-green-600", 
                                        bg: "bg-green-50 dark:bg-green-900/20",
                                        label: "Accomplishment"
                                      },
                                      blocker: { 
                                        icon: AlertTriangle, 
                                        color: "text-amber-600", 
                                        bg: "bg-amber-50 dark:bg-amber-900/20",
                                        label: "Blocker"
                                      },
                                      "next-step": { 
                                        icon: ChevronRight, 
                                        color: "text-blue-600", 
                                        bg: "bg-blue-50 dark:bg-blue-900/20",
                                        label: "Next Step"
                                      },
                                    }[update.type];
                                    
                                    const Icon = typeConfig.icon;
                                    const timeAgo = (() => {
                                      const diff = Date.now() - update.timestamp.getTime();
                                      const hours = Math.floor(diff / (1000 * 60 * 60));
                                      if (hours < 1) return "Just now";
                                      if (hours < 24) return `${hours}h ago`;
                                      const days = Math.floor(hours / 24);
                                      return `${days}d ago`;
                                    })();

                                    return (
                                      <div 
                                        key={update.id} 
                                        className={cn("p-3 rounded-lg border", typeConfig.bg)}
                                        data-testid={`pulse-update-${update.id}`}
                                      >
                                        <div className="flex items-start gap-3">
                                          <Avatar className="h-8 w-8">
                                            {update.userAvatar && <AvatarImage src={update.userAvatar} />}
                                            <AvatarFallback className="text-xs">
                                              {update.userName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                              <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm">{update.userName}</span>
                                                <Badge 
                                                  variant="outline" 
                                                  className={cn("text-[10px] px-1.5 py-0", typeConfig.color)}
                                                >
                                                  <Icon className="h-3 w-3 mr-1" />
                                                  {typeConfig.label}
                                                </Badge>
                                              </div>
                                              <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo}</span>
                                            </div>
                                            <p className="text-sm mt-1">{update.content}</p>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-0 outline-none">
              <UnifiedTimeline 
                project={project}
                sprints={projectSprints}
                milestones={milestones}
                stages={stages}
                deliverables={projectDeliverables}
                epics={projectEpics}
              />
            </TabsContent>

            <TabsContent value="sprints" className="mt-0 outline-none">
              <SprintsContent projectId={projectId} />
            </TabsContent>

            <TabsContent value="milestones" className="mt-0 outline-none">
              <MilestonesContent projectId={projectId} />
            </TabsContent>

            <TabsContent value="tasks" className="mt-0 outline-none">
              <TaskListContent projectId={projectId} />
            </TabsContent>
            
            <TabsContent value="deliverables" className="mt-0 outline-none">
              <DeliverablesContent projectId={projectId} />
            </TabsContent>

            <TabsContent value="stages" className="mt-0 outline-none">
              <StagesContent projectId={projectId} />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <Dialog open={addTaskDialogOpen} onOpenChange={setAddTaskDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Task to Sprint</DialogTitle>
            <DialogDescription>
              Add an existing task or create a new one for {selectedSprint?.name}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={addTaskMode} onValueChange={(v) => setAddTaskMode(v as "link" | "create")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="link">Link Existing</TabsTrigger>
              <TabsTrigger value="create">Create New</TabsTrigger>
            </TabsList>
            
            <TabsContent value="link" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Select Existing Task</Label>
                <Select value={selectedExistingTaskId} onValueChange={setSelectedExistingTaskId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a task..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTasks.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableTasks.length === 0 && (
                  <p className="text-sm text-muted-foreground">No available tasks to add. All tasks are already in this sprint.</p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="create" className="mt-4 space-y-4">
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
                  placeholder="Optional description"
                  className="min-h-[80px]"
                  data-testid="input-new-task-description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Epic *</Label>
                  <SearchableSelect
                    options={projectEpics.map((e: any) => ({
                      value: e.id,
                      label: e.title
                    }))}
                    value={newTaskEpicId}
                    onValueChange={setNewTaskEpicId}
                    placeholder="Select epic"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Stage</Label>
                  <SearchableSelect
                    options={stages.map((s: any) => ({
                      value: s.id,
                      label: s.name
                    }))}
                    value={newTaskStageId}
                    onValueChange={setNewTaskStageId}
                    placeholder="Select stage"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <SearchableSelect
                    options={[
                      { value: "Low", label: "Low" },
                      { value: "Medium", label: "Medium" },
                      { value: "High", label: "High" },
                      { value: "Critical", label: "Critical" }
                    ]}
                    value={newTaskPriority}
                    onValueChange={setNewTaskPriority}
                    placeholder="Select priority"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Effort (1-5)</Label>
                  <SearchableSelect
                    options={EFFORT_VALUES.map((v) => ({
                      value: v.toString(),
                      label: v.toString()
                    }))}
                    value={newTaskEffort.toString()}
                    onValueChange={(v) => setNewTaskEffort(parseInt(v))}
                    placeholder="Select effort"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddTaskToSprint} 
              disabled={isAddingTask}
              data-testid="button-confirm-add-task"
            >
              {isAddingTask ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                addTaskMode === "link" ? "Add to Sprint" : "Create & Add"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}