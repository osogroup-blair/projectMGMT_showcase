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
import { Bell, Search, Plus, SlidersHorizontal, CalendarDays, LayoutDashboard, Target, Briefcase, ClipboardList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="bg-transparent p-0 border-b w-full justify-start rounded-none h-auto gap-6">
            <TabsTrigger 
              value="tasks" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium"
              data-testid="tab-current-tasks"
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Current Tasks
            </TabsTrigger>
            <TabsTrigger 
              value="projects" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium"
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Current Projects
            </TabsTrigger>
            <TabsTrigger 
              value="upcoming" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium"
            >
              <Target className="w-4 h-4 mr-2" />
              Upcoming Sprints
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-0">
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Upcoming Sprints</h2>
              <p className="text-muted-foreground text-sm">Key milestones and upcoming deadlines across your projects.</p>
              <div className="mt-6 space-y-6">
                 {homeState.upcomingMilestones.map(milestone => (
                   <div key={milestone.id} className="flex items-start gap-4 p-4 border rounded-lg bg-background hover:border-primary/50 transition-colors">
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
                 ))}
                 {homeState.upcomingMilestones.length === 0 && (
                   <div className="text-center py-8">
                     <p className="text-muted-foreground">No upcoming sprints found.</p>
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
