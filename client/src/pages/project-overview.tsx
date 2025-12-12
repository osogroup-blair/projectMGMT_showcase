import { Shell } from "@/components/layout/shell";
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MoreHorizontal,
  ChevronRight,
  LayoutDashboard,
  Kanban,
  Settings,
  Flag,
  ListTodo,
  Layers,
  Users,
  Eye,
  Briefcase,
  Banknote,
  Loader2,
  Pencil,
  Check,
  X
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
import { useRoute, Link, useSearch, useLocation } from "wouter";
import { PROJECT_STAGES, STAGE_STATUS_OPTIONS } from "@/lib/mock-data";
import { useProject, useProjects, useTasks, useMilestones, useUsers, useDeliverables, useEpics } from "@/hooks/use-nexus-data";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { StageTabContent } from "@/components/project/stage-tab-content";
import { TimelineView } from "@/components/project/timeline-view";
import { useMemo, useState, useEffect } from "react";
import { ProjectDashboard } from "@/types/dashboard";
import { differenceInDays, parseISO } from "date-fns";

// Mock Data Types
interface TaskStats {
  total: number;
  completed: number;
  atRisk: number;
  inProgress: number;
}

import { DeliverablesContent } from "@/pages/deliverables";
import ProjectDashboardPage from "@/components/project/project-dashboard-page";
import { TaskBoardContent } from "@/pages/task-board";
import { MilestonesContent } from "@/components/project/milestones-content";

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
  const { toast } = useToast();

  // Inline editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingStartDate, setIsEditingStartDate] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStartDate, setEditStartDate] = useState("");

  // Initialize edit values when project loads
  useEffect(() => {
    if (project) {
      setEditTitle(project.name || "");
      setEditDescription(project.description || "");
      setEditStartDate(project.startDate || "");
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

  const stages = PROJECT_STAGES; // Keep using static stages for now as they are structural

  if (isProjectLoading || isTasksLoading || isMilestonesLoading || isUsersLoading || isDeliverablesLoading || isEpicsLoading) {
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
    <Shell>
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/projects" className="hover:text-primary transition-colors">Projects</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-foreground">{project.name}</span>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-2xl font-bold h-10 w-80"
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
                  <div className="flex items-center gap-2 group">
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
                  "px-2.5 py-0.5 text-sm font-medium border-0",
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
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  Nymbl Implementation
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
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Due {project.deadline}
                </span>
              </div>
            </div>

            <div className="flex gap-2 w-full lg:w-auto">
              <Link href={`/projects/${projectId}/team`}>
                <Button variant="outline" className="gap-2">
                  <Users className="h-4 w-4" />
                  Team
                </Button>
              </Link>
              <Link href={`/projects/${projectId}/finance`}>
                <Button variant="outline" className="gap-2">
                  <Banknote className="h-4 w-4" />
                  Finance
                </Button>
              </Link>
              <Link href={`/projects/${projectId}/settings`}>
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </Link>
              <Button size="icon" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>


        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6 overflow-x-auto">
            <TabsTrigger 
              value="overview" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
            >
              Dashboard
            </TabsTrigger>

            <TabsTrigger 
              value="tasks" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
            >
              Tasks
            </TabsTrigger>

            <TabsTrigger 
              value="deliverables" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
            >
              Deliverables
            </TabsTrigger>

             <TabsTrigger 
              value="timeline" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
            >
              Timeline
            </TabsTrigger>

            <TabsTrigger 
              value="milestones" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
            >
              Milestones
            </TabsTrigger>
            
            {stages.map(stage => {
              const statusConfig = STAGE_STATUS_OPTIONS.find(s => s.label === stage.status);
              // Extract base color from config or default to muted
              // Assuming config.color follows "bg-X-50 text-X-700 border-X-200" pattern
              const statusColorClass = statusConfig?.color || "bg-muted/50 text-muted-foreground border-muted";
              
              // For the tab text/border, we need to adapt slightly or use the config directly
              // We'll extract the text color part for the tab label
              const textClass = statusConfig ? statusConfig.color.split(' ').find(c => c.startsWith('text-')) : 'text-muted-foreground';
              // For the active border, we'll try to match the text color but as a border
              const borderClass = textClass?.replace('text-', 'data-[state=active]:border-');

              return (
                <TabsTrigger 
                  key={stage.id}
                  value={`stage-${stage.id}`}
                  className={cn(
                    "rounded-none border-b-2 border-transparent data-[state=active]:bg-transparent px-0 py-2 font-medium",
                    textClass,
                    borderClass
                  )}
                >
                  <span className={cn(
                    "mr-2 flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
                    statusColorClass
                  )}>
                    {stage.order}
                  </span>
                  {stage.name}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="mt-6">
            {/* Project Overview Tab Content */}
            <TabsContent value="overview" className="space-y-8">
               {dashboardData && <ProjectDashboardPage dashboard={dashboardData} />}
            </TabsContent>

            {/* Tasks Tab Content */}
            <TabsContent value="tasks" className="mt-6">
              <TaskBoardContent projectId={projectId} />
            </TabsContent>
            
            {/* Timeline Tab Content */}
            <TabsContent value="timeline" className="h-[700px] mt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Timeline</h2>
                  <p className="text-sm text-muted-foreground">Visualize milestones and dependencies over time.</p>
                </div>
              </div>
               <TimelineView stages={stages} milestones={milestones} project={project} tasks={tasks} />
            </TabsContent>

            {/* Dynamic Stage Tabs */}
            {stages.map(stage => (
              <TabsContent key={stage.id} value={`stage-${stage.id}`} className="mt-6">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                      <h2 className="text-xl font-semibold tracking-tight">{stage.name}</h2>
                      <p className="text-sm text-muted-foreground">{stage.description || "Manage tasks, milestones, and configuration for this stage."}</p>
                    </div>
                  </div>
                 <StageTabContent stage={stage} projectId={projectId} />
              </TabsContent>
            ))}

            {/* Deliverables Tab */}
            <TabsContent value="deliverables">
              <div className="mt-6">
                <DeliverablesContent projectId={projectId} />
              </div>
            </TabsContent>

            {/* Milestones Tab */}
            <TabsContent value="milestones">
              <div className="mt-6">
                <MilestonesContent projectId={projectId} />
              </div>
            </TabsContent>

          </div>
        </Tabs>
      </div>
    </Shell>
  );
}