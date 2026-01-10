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
  Zap
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
import { useRoute, Link, useSearch, useLocation } from "wouter";
import { useProject, useProjects, useTasks, useMilestones, useUsers, useDeliverables, useEpics, useProjectStages, useFrameworkTemplates, useSprints } from "@/hooks/use-nexus-data";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { UnifiedTimeline } from "@/features/project/timeline/unified-timeline";
import { useMemo, useState, useEffect } from "react";
import { ProjectDashboard } from "@/features/project/dashboard/types";
import { differenceInDays, parseISO } from "date-fns";
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
import { FlowBoard } from "@/features/project/sprints/flow-board";
import { BlockerReasonDialog } from "@/features/project/sprints/blocker-reason-dialog";

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
  const { toast } = useToast();

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
  const [metricsOpen, setMetricsOpen] = useState(true);
  
  // Blocker dialog for flow board
  const [blockerTaskId, setBlockerTaskId] = useState<string | null>(null);

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
      completed: projectTasks.filter((t: any) => t.status === "Done").length,
      inProgress: projectTasks.filter((t: any) => t.status === "In Progress").length,
      atRisk: projectTasks.filter((t: any) => t.priority === "High" && t.status !== "Done").length
    };

    const percentComplete = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    const daysRemaining = project.deadline ? differenceInDays(parseISO(project.deadline), new Date()) : 0;
    
    const getAssigneeName = (id?: string) => {
      const user = users.find((u: any) => u.id === id);
      return user?.name || "Unassigned";
    };

    const upcomingItems = projectTasks
      .filter((t: any) => t.deadline && t.status !== "Done")
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
        progress: t.status === "Done" ? 100 : t.status === "In Progress" ? 50 : 0
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
      .filter((t: any) => t.status === "Done")
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
          .filter((t: any) => t.priority === "High" && t.status !== "Done")
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

  // Find the active sprint for this project
  const activeSprint = useMemo(() => {
    if (!projectSprints || projectSprints.length === 0) return null;
    return projectSprints.find((s: any) => s.status === "active") || projectSprints[0];
  }, [projectSprints]);

  // Get tasks for the active sprint
  const sprintTasks = useMemo(() => {
    if (!activeSprint || !allTasks) return [];
    return allTasks.filter((t: any) => t.sprintId === activeSprint.id);
  }, [activeSprint, allTasks]);

  const { update: updateTask } = useTasks();

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
        <div className="px-6 py-8 space-y-8">
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

              <div className="flex gap-2 w-full lg:w-auto">
                <Link href={`/projects/${projectId}/management`}>
                  <Button variant="outline" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Management
                  </Button>
                </Link>
                <Button size="icon" variant="ghost">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Collapsible open={metricsOpen} onOpenChange={setMetricsOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent" data-testid="button-toggle-metrics">
                  <span className="text-sm font-medium text-muted-foreground">Project Metrics</span>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", metricsOpen && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
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
                  value="current-sprint" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 font-medium transition-none shadow-none gap-1.5"
                  data-testid="tab-current-sprint"
                >
                  <Zap className="h-4 w-4" />
                  Current Sprint
                </TabsTrigger>

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
              {activeTab === "overview" && (
                <DashboardFilterControls
                  filters={dashboardFilters}
                  onFiltersChange={setDashboardFilters}
                />
              )}
            </div>
          </div>

          <div className="px-6 py-6">
            <TabsContent value="current-sprint" className="mt-0 outline-none">
              {activeSprint ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold">{activeSprint.name}</h2>
                      <Badge variant={activeSprint.status === "active" ? "default" : "secondary"} className="capitalize">
                        {activeSprint.status}
                      </Badge>
                      {activeSprint.endDate && (
                        <span className="text-sm text-muted-foreground">
                          {Math.max(0, differenceInDays(parseISO(activeSprint.endDate), new Date()))} days remaining
                        </span>
                      )}
                    </div>
                    <Link href={`/projects/${projectId}/sprints/${activeSprint.id}?tab=run`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Settings className="h-4 w-4" />
                        Sprint Details
                      </Button>
                    </Link>
                  </div>
                  <FlowBoard
                    tasks={sprintTasks}
                    users={users || []}
                    epics={projectEpics || []}
                    projectId={projectId}
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
            </TabsContent>

            <TabsContent value="overview" className="mt-0 outline-none">
              <TimeHorizonDashboard 
                projectId={projectId}
                externalFilters={dashboardFilters}
                onFiltersChange={setDashboardFilters}
              />
            </TabsContent>

            <TabsContent value="timeline" className="h-[700px] mt-0 outline-none">
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
    </Shell>
  );
}