import { UserHomeState, HomeTask, WorkBlock } from "../types";
import { Shell } from "@/components/layout/shell";
import { TodayTasksPanel } from "./today-tasks-panel";
import { WeekPlanner } from "./week-planner";
import { UpcomingMilestonesPanel } from "./upcoming-milestones-panel";
import { DailyCalendar } from "./daily-calendar";
import { TaskCard } from "./task-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Search, Plus, SlidersHorizontal, CalendarDays, LayoutDashboard, Target, Briefcase, ClipboardList, BarChart3, ChevronDown, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTasks, useProjects, useSprints } from "@/hooks/use-nexus-data";
import { useCompletedStatuses } from "@/hooks/use-completed-statuses";
import { useMemo } from "react";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, isWithinInterval, parseISO, isValid } from "date-fns";
import { useCurrentUser } from "@/context/current-user-context";
import { useState } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CurrentProjectsPanel } from "./current-projects-panel";
import { CurrentTasksPanel } from "./current-tasks-panel";
import { TaskQuickCreateDialog } from "@/components/task-quick-create-dialog";

interface UserHomePageProps {
  homeState: UserHomeState;
}

export function UserHomePage({ homeState }: UserHomePageProps) {
  const { currentUser } = useCurrentUser();
  const [tasks, setTasks] = useState(homeState.todayTasks);
  const [dayPlans, setDayPlans] = useState(homeState.dayPlans);
  const { isTaskComplete } = useCompletedStatuses();

  // Fetch data for metrics
  const { data: allTasks } = useTasks();
  const { data: allProjects } = useProjects();
  const { data: allSprints } = useSprints();

  // Calculate workload metrics
  const workloadMetrics = useMemo(() => {
    if (!allTasks || !allProjects) return null;

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const quarterStart = startOfQuarter(now);
    const quarterEnd = endOfQuarter(now);

    // Filter tasks assigned to current user
    const myTasks = allTasks.filter((t: any) => t.assigneeId === currentUser?.id);
    const activeProjects = allProjects.filter((p: any) => p.status === "active");

    // Helper to check if a task deadline falls within a range
    const isInRange = (task: any, start: Date, end: Date) => {
      if (!task.deadline) return false;
      const deadline = parseISO(task.deadline);
      return isValid(deadline) && isWithinInterval(deadline, { start, end });
    };

    // Tasks by time period
    const tasksThisWeek = myTasks.filter((t: any) => isInRange(t, weekStart, weekEnd));
    const tasksThisMonth = myTasks.filter((t: any) => isInRange(t, monthStart, monthEnd));
    const tasksThisQuarter = myTasks.filter((t: any) => isInRange(t, quarterStart, quarterEnd));

    // Completed vs assigned
    const completedThisWeek = tasksThisWeek.filter((t: any) => isTaskComplete(t.status));
    const completedThisMonth = tasksThisMonth.filter((t: any) => isTaskComplete(t.status));
    const completedThisQuarter = tasksThisQuarter.filter((t: any) => isTaskComplete(t.status));

    // Story points (effort)
    const effortThisWeek = tasksThisWeek.reduce((sum: number, t: any) => sum + (t.effort || 0), 0);
    const effortCompletedThisWeek = completedThisWeek.reduce((sum: number, t: any) => sum + (t.effort || 0), 0);
    const effortThisMonth = tasksThisMonth.reduce((sum: number, t: any) => sum + (t.effort || 0), 0);
    const effortCompletedThisMonth = completedThisMonth.reduce((sum: number, t: any) => sum + (t.effort || 0), 0);

    return {
      totalProjects: activeProjects.length,
      totalAssignedTasks: myTasks.length,
      tasksThisWeek: tasksThisWeek.length,
      completedThisWeek: completedThisWeek.length,
      tasksThisMonth: tasksThisMonth.length,
      completedThisMonth: completedThisMonth.length,
      tasksThisQuarter: tasksThisQuarter.length,
      completedThisQuarter: completedThisQuarter.length,
      effortThisWeek,
      effortCompletedThisWeek,
      effortThisMonth,
      effortCompletedThisMonth,
      weekCompletionRate: tasksThisWeek.length > 0 ? Math.round((completedThisWeek.length / tasksThisWeek.length) * 100) : 0,
      monthCompletionRate: tasksThisMonth.length > 0 ? Math.round((completedThisMonth.length / tasksThisMonth.length) * 100) : 0,
    };
  }, [allTasks, allProjects, currentUser?.id]);
  
  // DnD State
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<HomeTask | null>(null);
  
  // Task creation dialog state
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: any) => {
    const { active } = event;
    setActiveId(active.id);
    setActiveTask(active.data.current?.task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    // Logic for drag over can be added here if needed for visual feedback
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // 1. Dropped on a Calendar Slot
    if (over.data.current?.type === 'calendar-slot') {
      const time = over.data.current.time;
      const task = active.data.current?.task as HomeTask;
      
      if (task) {
        // Create a new event (WorkBlock)
        const newBlock: WorkBlock = {
          id: `wb-${Date.now()}`,
          userId: currentUser.id,
          date: homeState.today,
          startTime: time,
          endTime: time, // Logic to add duration would go here, defaulting to slot start
          label: task.title,
          taskIds: [task.id],
          totalPlannedMinutes: task.estimatedDurationMinutes || 30,
          status: "planned"
        };

        setDayPlans(prev => {
           const updated = [...prev];
           const todayPlan = updated.find(p => p.date === homeState.today);
           if (todayPlan) {
             todayPlan.workBlocks.push(newBlock);
           }
           return updated;
        });
      }
      return;
    }

    // 2. Reordering within Tasks Panel
    if (activeId !== overId) {
       // Check if we are reordering tasks
       const activeTaskIndex = tasks.findIndex(t => t.id === activeId);
       const overTaskIndex = tasks.findIndex(t => t.id === overId);
       
       if (activeTaskIndex !== -1 && overTaskIndex !== -1) {
          setTasks((prev) => {
            // Also handle bucket change if needed
            const newTasks = [...prev];
            const activeT = newTasks[activeTaskIndex];
            const overT = newTasks[overTaskIndex];
            
            if (activeT.durationBucket !== overT.durationBucket) {
              activeT.durationBucket = overT.durationBucket;
            }
            
            return arrayMove(newTasks, activeTaskIndex, overTaskIndex);
          });
       }
    }
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: { opacity: '0.5' },
      },
    }),
  };

  const todayPlan = dayPlans.find(p => p.date === homeState.today);
  const todayEvents = todayPlan?.workBlocks || [];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = currentUser?.firstName || currentUser?.name?.split(' ')[0] || "there";

  return (
    <Shell>
      <div className="space-y-8 pb-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between" data-testid="welcome-section">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight" data-testid="welcome-greeting">
              {getGreeting()}, {firstName}
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's on your plate today
            </p>
          </div>
          <Button data-testid="button-add-task" className="gap-2" onClick={() => setIsCreateTaskOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>

        {/* Workload Metrics Accordion */}
        {workloadMetrics && (
          <Collapsible defaultOpen={true}>
            <Card className="bg-muted/30 border-primary/20 shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <button type="button" className="group w-full py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors text-left flex items-center justify-between border-b border-primary/10">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm text-primary">Workload Overview</span>
                    <Badge variant="outline" className="text-xs border-primary/20 bg-primary/5 text-primary">
                      {workloadMetrics.totalAssignedTasks} tasks assigned
                    </Badge>
                  </div>
                  <ChevronDown className="h-4 w-4 text-primary transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-4 pb-4 px-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {/* Active Projects */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-center">
                      <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">{workloadMetrics.totalProjects}</div>
                      <div className="text-xs text-muted-foreground">Active Projects</div>
                    </div>

                    {/* This Week */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-2xl font-bold text-green-600">{workloadMetrics.completedThisWeek}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-lg font-semibold text-blue-600">{workloadMetrics.tasksThisWeek}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Tasks This Week</div>
                      <Progress value={workloadMetrics.weekCompletionRate} className="h-1 mt-1" />
                    </div>

                    {/* This Month */}
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-2xl font-bold text-green-600">{workloadMetrics.completedThisMonth}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-lg font-semibold text-purple-600">{workloadMetrics.tasksThisMonth}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Tasks This Month</div>
                      <Progress value={workloadMetrics.monthCompletionRate} className="h-1 mt-1" />
                    </div>

                    {/* This Quarter */}
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-2xl font-bold text-green-600">{workloadMetrics.completedThisQuarter}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-lg font-semibold text-amber-600">{workloadMetrics.tasksThisQuarter}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Tasks This Quarter</div>
                    </div>

                    {/* Effort This Week */}
                    <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-2xl font-bold text-green-600">{workloadMetrics.effortCompletedThisWeek}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-lg font-semibold text-slate-600">{workloadMetrics.effortThisWeek}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Points This Week</div>
                    </div>

                    {/* Effort This Month */}
                    <div className="p-3 bg-teal-50 dark:bg-teal-900/30 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-2xl font-bold text-green-600">{workloadMetrics.effortCompletedThisMonth}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-lg font-semibold text-slate-600">{workloadMetrics.effortThisMonth}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Points This Month</div>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="bg-transparent p-0 border-b w-full justify-start rounded-none h-auto gap-6">
            <TabsTrigger 
              value="projects" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium"
              data-testid="tab-current-projects"
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Current Projects
            </TabsTrigger>
            <TabsTrigger 
              value="tasks" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium"
              data-testid="tab-current-tasks"
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Current Tasks
            </TabsTrigger>
            <TabsTrigger 
              value="upcoming" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium"
            >
              <Target className="w-4 h-4 mr-2" />
              Upcoming Milestones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-0">
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Upcoming Milestones</h2>
              <p className="text-muted-foreground text-sm">Key milestones and upcoming deadlines across your projects.</p>
              <div className="mt-6 space-y-6">
                   <Link key={milestone.id} href={`/projects/${milestone.projectId}/milestones/${milestone.id}`} className="block">
                     <div className="flex items-start gap-4 p-4 border rounded-lg bg-background hover:border-primary/50 transition-colors">
                       <div className="mt-1">
                          <Target className="w-5 h-5 text-primary" />
                       </div>
                       <div className="flex-1 space-y-2">
                         <div className="flex justify-between">
                           <h3 className="font-medium">{milestone.name}</h3>
                           <Badge variant="outline">{milestone.status}</Badge>
                         </div>
                         <p className="text-sm text-muted-foreground">{milestone.projectName}</p>
                         <div className="flex items-center gap-4 text-xs text-muted-foreground">
                           <span>Due: {milestone.targetDate ? new Date(milestone.targetDate).toLocaleDateString() : 'No date'}</span>
                           <span>{milestone.percentComplete}% Complete</span>
                         </div>
                       </div>
                     </div>
                   </Link>
                 {homeState.upcomingMilestones.length === 0 && (
                   <div className="text-center py-8">
                     <p className="text-muted-foreground">No upcoming milestones found.</p>
                   </div>
                 )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="mt-0" data-testid="tab-content-current-tasks">
            <CurrentTasksPanel />
          </TabsContent>

          <TabsContent value="projects" className="mt-0" data-testid="tab-content-current-projects">
            <CurrentProjectsPanel />
          </TabsContent>
        </Tabs>
      </div>

      <TaskQuickCreateDialog 
        open={isCreateTaskOpen} 
        onOpenChange={setIsCreateTaskOpen} 
      />
    </Shell>
  );
}
