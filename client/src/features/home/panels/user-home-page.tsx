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

  return (
    <Shell>
      <div className="space-y-8 pb-8">
        {/* Top Bar / Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border shadow-sm">
           <div>
             <h1 className="text-2xl font-bold tracking-tight text-primary">Good morning, {currentUser.name.split(' ')[0]}</h1>
             <p className="text-muted-foreground">Here's what's on your plate for today, {new Date(homeState.today).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}.</p>
           </div>
           
           <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative w-full md:w-64">
               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input placeholder="Search tasks, projects..." className="pl-9 bg-background/50" />
             </div>
             <Button size="icon" variant="outline" className="shrink-0">
               <Bell className="h-4 w-4" />
             </Button>
             <Button className="shrink-0 gap-2">
               <Plus className="h-4 w-4" />
               <span className="hidden sm:inline">New Task</span>
             </Button>
           </div>
        </div>

        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="bg-transparent p-0 border-b w-full justify-start rounded-none h-auto gap-6">
            <TabsTrigger 
              value="projects" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium"
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Current Projects
            </TabsTrigger>
            <TabsTrigger 
              value="today" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Today
            </TabsTrigger>
            <TabsTrigger 
              value="week" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              My Week
            </TabsTrigger>
            <TabsTrigger 
              value="quarter" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium"
            >
              <Target className="w-4 h-4 mr-2" />
              This Quarter
            </TabsTrigger>
            <TabsTrigger 
              value="tasks" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 py-2 font-medium"
              data-testid="tab-current-tasks"
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Current Tasks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="mt-0">
             <div className="bg-card/50 rounded-xl p-6 border shadow-sm">
                <CurrentProjectsPanel />
             </div>
          </TabsContent>

          <TabsContent value="today" className="mt-0">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Daily Calendar (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="h-[800px]">
                     <DailyCalendar 
                       date={homeState.today} 
                       events={todayEvents} 
                       tasks={tasks}
                     />
                  </div>
                </div>

                {/* Right Column: Today's Tasks & Focus (7 cols) */}
                <div className="lg:col-span-7 space-y-8">
                  <div className="bg-card/50 rounded-xl p-1">
                    <TodayTasksPanel tasks={tasks} />
                  </div>
                </div>
              </div>
              
              {createPortal(
                <DragOverlay dropAnimation={dropAnimation}>
                  {activeTask ? <TaskCard task={activeTask} /> : null}
                </DragOverlay>,
                document.body
              )}
            </DndContext>
          </TabsContent>

          <TabsContent value="week" className="mt-0">
             <div className="space-y-6">
               <div className="bg-card/50 rounded-xl p-6 border shadow-sm">
                  <WeekPlanner dayPlans={dayPlans} />
               </div>
             </div>
          </TabsContent>

          <TabsContent value="quarter" className="mt-0">
            <div className="bg-card rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Quarterly Roadmap</h2>
              <p className="text-muted-foreground text-sm">Milestones and key deliverables for Q4 2024.</p>
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
                         <span>Due: {new Date(milestone.targetDate).toLocaleDateString()}</span>
                         <span>{milestone.percentComplete}% Complete</span>
                       </div>
                     </div>
                   </div>
                 ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="mt-0" data-testid="tab-content-current-tasks">
            <div className="bg-card/50 rounded-xl p-6 border shadow-sm">
              <CurrentTasksPanel />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
}
