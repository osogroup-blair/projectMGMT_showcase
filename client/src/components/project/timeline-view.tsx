import { useState, useMemo, useRef, useEffect } from "react";
import { 
  format, 
  addDays, 
  subDays,
  addWeeks,
  subWeeks,
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  eachWeekOfInterval,
  eachMonthOfInterval, 
  isSameDay, 
  differenceInDays,
  parseISO,
  isValid,
  startOfQuarter,
  endOfQuarter,
  eachQuarterOfInterval,
  startOfYear,
  endOfYear,
  eachYearOfInterval,
  isSameMonth,
  isSameQuarter,
  isSameYear,
  addQuarters,
  subQuarters,
  addYears,
  subYears
} from "date-fns";
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Flag,
  Filter,
  Plus,
  MoreVertical,
  Calendar,
  Trash2,
  Edit2,
  CheckSquare,
  Square
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ProjectStage, Milestone, Project, Task } from "@/lib/mock-data";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface TimelineViewProps {
  stages: ProjectStage[];
  milestones: Milestone[];
  project: Project;
  tasks?: Task[];
}

// Helper to calculate stage dates based on project start
const generateStageDates = (stages: ProjectStage[], projectStartDate?: string) => {
  // Default to 2 months ago if no start date provided
  const start = projectStartDate ? parseISO(projectStartDate) : addMonths(new Date(), -2);
  
  let currentStart = start;
  
  return stages.map((stage) => {
    // Defined durations: Plan (4w), Validate (4w), Develop (16w/4m), Enable (4w)
    // We map strictly by the stage ID or name pattern for this prototype
    let durationWeeks = 4;
    
    if (stage.id.includes('develop') || stage.name.includes('Develop')) {
      durationWeeks = 16;
    }
    
    const startDate = currentStart;
    const endDate = addWeeks(startDate, durationWeeks);
    
    // Set next stage start (next day)
    currentStart = addDays(endDate, 1);

    return {
      ...stage,
      startDate,
      endDate
    };
  });
};

const getSmartInitialDate = (project: Project, milestones: Milestone[]) => {
  // 1. Look for first In Progress or Pending milestone
  const activeMilestones = milestones
    .filter(m => m.status === 'In Progress' || m.status === 'Pending')
    .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
  
  if (activeMilestones.length > 0) {
    return parseISO(activeMilestones[0].targetDate);
  }

  // 2. Look for any milestone
  const allMilestones = [...milestones].sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
  if (allMilestones.length > 0) {
    return parseISO(allMilestones[0].targetDate);
  }

  // 3. Project Start
  if (project.startDate) {
    return parseISO(project.startDate);
  }

  // 4. Today
  return new Date();
};

type ViewMode = "day" | "week" | "month" | "quarter" | "year";

export function TimelineView({ stages, milestones: initialMilestones, project, tasks: initialTasks = [] }: TimelineViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  
  // Smart default date
  const [currentDate, setCurrentDate] = useState(() => getSmartInitialDate(project, initialMilestones));
  
  const [filter, setFilter] = useState<"all" | "stages" | "milestones">("all");
  
  // Local state for milestones and tasks
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  
  const [isMilestoneDialogOpen, setIsMilestoneDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [milestoneForm, setMilestoneForm] = useState({
    name: "",
    date: format(new Date(), "yyyy-MM-dd"),
    stageId: stages[0]?.id || "",
    description: "",
    assignedTaskIds: [] as string[]
  });

  const stagesWithDates = useMemo(() => generateStageDates(stages, project.startDate), [stages, project.startDate]);
  
  // Calculate milestone progress based on assigned tasks
  const getMilestoneProgress = (milestoneId: string) => {
    const assignedTasks = tasks.filter(t => t.milestoneId === milestoneId);
    if (assignedTasks.length === 0) return 0;
    
    const doneTasks = assignedTasks.filter(t => t.status === 'Done');
    return Math.round((doneTasks.length / assignedTasks.length) * 100);
  };

  const getMilestoneTaskStats = (milestoneId: string) => {
    const assignedTasks = tasks.filter(t => t.milestoneId === milestoneId);
    const doneTasks = assignedTasks.filter(t => t.status === 'Done');
    return { total: assignedTasks.length, completed: doneTasks.length };
  };

  // View Configuration
  const viewConfig = useMemo(() => {
    switch (viewMode) {
      case "day":
        return {
          dayWidth: 100, // Very wide for daily view
          tickInterval: eachDayOfInterval,
          tickFormat: "EEE, MMM d",
          subTickFormat: "", // No sub-ticks needed
          timeAdd: addDays,
          timeSub: subDays,
          headerUnit: "day"
        };
      case "week":
        return {
          dayWidth: 40, // Wide enough for week view
          tickInterval: eachWeekOfInterval,
          tickFormat: "'Week of' MMM d",
          subTickFormat: "EEE",
          timeAdd: addWeeks,
          timeSub: subWeeks,
          headerUnit: "week"
        };
      case "month":
        return {
          dayWidth: 15, // ~3 months visible in standard desktop view
          tickInterval: eachMonthOfInterval,
          tickFormat: "MMMM yyyy",
          subTickFormat: "d",
          timeAdd: addMonths,
          timeSub: subMonths,
          headerUnit: "month"
        };
      case "quarter":
        return {
          dayWidth: 4, // ~1 year visible
          tickInterval: eachQuarterOfInterval,
          tickFormat: "QQQ yyyy", // Q1 2024
          subTickFormat: "MMM",
          timeAdd: addQuarters,
          timeSub: subQuarters,
          headerUnit: "quarter"
        };
      case "year":
        return {
          dayWidth: 1.5, // ~3 years visible
          tickInterval: eachYearOfInterval,
          tickFormat: "yyyy",
          subTickFormat: "QQQ",
          timeAdd: addYears,
          timeSub: subYears,
          headerUnit: "year"
        };
    }
  }, [viewMode]);

  // Calculate total timeline range based on data, but padded generously
  const timelineStart = useMemo(() => {
    const baseStart = stagesWithDates[0].startDate;
    // Pad significantly to allow scrolling around
    return startOfYear(subYears(baseStart, 1)); 
  }, [stagesWithDates]);

  const timelineEnd = useMemo(() => {
    const baseEnd = stagesWithDates[stagesWithDates.length - 1].endDate;
    return endOfYear(addYears(baseEnd, 2));
  }, [stagesWithDates]);

  // Generate ticks based on view mode
  const timeTicks = useMemo(() => {
    return viewConfig.tickInterval({ start: timelineStart, end: timelineEnd });
  }, [timelineStart, timelineEnd, viewConfig]);

  const days = useMemo(() => {
    return eachDayOfInterval({ start: timelineStart, end: timelineEnd });
  }, [timelineStart, timelineEnd]);

  const getPosition = (date: Date) => {
    const diff = differenceInDays(date, timelineStart);
    return diff * viewConfig.dayWidth;
  };

  const getWidth = (start: Date, end: Date) => {
    const diff = differenceInDays(end, start) + 1; // Include end day
    return diff * viewConfig.dayWidth;
  };

  // Scroll to current date on mount and when date changes
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollContainerRef.current) {
      const targetPos = getPosition(currentDate);
      const containerWidth = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollTo({
        left: targetPos - (containerWidth / 2),
        behavior: 'smooth'
      });
    }
  }, [currentDate, viewMode]); // Re-center when view mode changes too

  // Milestone Management
  const handleSaveMilestone = () => {
    let savedMilestoneId = editingMilestone?.id;

    if (editingMilestone) {
      setMilestones(prev => prev.map(m => m.id === editingMilestone.id ? {
        ...m,
        name: milestoneForm.name,
        targetDate: milestoneForm.date,
        stageId: milestoneForm.stageId,
        description: milestoneForm.description,
        progressPercent: getMilestoneProgress(m.id)
      } : m));
    } else {
      savedMilestoneId = `m-${Date.now()}`;
      const newMilestone: Milestone = {
        id: savedMilestoneId,
        name: milestoneForm.name,
        targetDate: milestoneForm.date,
        stageId: milestoneForm.stageId,
        description: milestoneForm.description,
        status: "Pending",
        ownerId: "1",
        progressPercent: 0,
        isBillingGate: false,
        requiredCompletionRatio: 0
      };
      setMilestones(prev => [...prev, newMilestone]);
    }

    if (savedMilestoneId) {
      const currentId = savedMilestoneId;
      setTasks(prevTasks => prevTasks.map(task => {
        if (milestoneForm.assignedTaskIds.includes(task.id)) {
          return { ...task, milestoneId: currentId };
        }
        if (task.milestoneId === currentId && !milestoneForm.assignedTaskIds.includes(task.id)) {
           return { ...task, milestoneId: undefined };
        }
        return task;
      }));
    }

    setIsMilestoneDialogOpen(false);
    resetForm();
  };

  const handleDeleteMilestone = (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
    setTasks(prev => prev.map(t => t.milestoneId === id ? { ...t, milestoneId: undefined } : t));
  };

  const openAddDialog = () => {
    setEditingMilestone(null);
    resetForm();
    setIsMilestoneDialogOpen(true);
  };

  const openEditDialog = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    const assignedIds = tasks.filter(t => t.milestoneId === milestone.id).map(t => t.id);

    setMilestoneForm({
      name: milestone.name,
      date: milestone.targetDate,
      stageId: milestone.stageId,
      description: milestone.description,
      assignedTaskIds: assignedIds
    });
    setIsMilestoneDialogOpen(true);
  };

  const toggleTaskAssignment = (taskId: string) => {
    setMilestoneForm(prev => {
      const exists = prev.assignedTaskIds.includes(taskId);
      if (exists) {
        return { ...prev, assignedTaskIds: prev.assignedTaskIds.filter(id => id !== taskId) };
      } else {
        return { ...prev, assignedTaskIds: [...prev.assignedTaskIds, taskId] };
      }
    });
  };

  const resetForm = () => {
    setMilestoneForm({
      name: "",
      date: format(new Date(), "yyyy-MM-dd"),
      stageId: stages[0]?.id || "",
      description: "",
      assignedTaskIds: []
    });
  };

  // Helper for rendering sub-ticks (days/months/quarters)
  const renderSubTicks = (parentTickStart: Date, parentTickEnd: Date) => {
    if (viewMode === 'day') {
      // For Day View, maybe show hours? Or nothing for now to keep it clean.
      // Let's just return null or maybe a simple divider
      return null;
    }

    if (viewMode === 'week') {
      // Render Days
      const days = eachDayOfInterval({ start: parentTickStart, end: parentTickEnd });
      return days.map(d => (
        <div key={d.toISOString()} className="flex-1 text-center text-xs border-r border-border/10 last:border-0">
          {format(d, "EEE")}
        </div>
      ));
    }

    if (viewMode === 'month') {
      // Render days - but sparse to avoid clutter if too zoomed out? 
      // With width 15, we can render every few days or just day numbers
      const intervalDays = eachDayOfInterval({ start: parentTickStart, end: parentTickEnd });
      return intervalDays.map((d) => (
         <div 
          key={d.toISOString()} 
          className="flex-1 text-center text-[10px] border-r border-border/10 last:border-0"
          style={{ width: viewConfig.dayWidth }}
         >
           {/* Only show dates for 1, 5, 10, 15, 20, 25 */}
           {(d.getDate() === 1 || d.getDate() % 5 === 0) ? format(d, "d") : ""}
         </div>
      ));
    }
    
    if (viewMode === 'quarter') {
      // Render Months
      const months = eachMonthOfInterval({ start: parentTickStart, end: parentTickEnd });
      return months.map(m => (
        <div key={m.toISOString()} className="flex-1 text-center border-r border-border/10 last:border-0">
          {format(m, "MMM")}
        </div>
      ));
    }

    if (viewMode === 'year') {
      // Render Quarters
      const quarters = eachQuarterOfInterval({ start: parentTickStart, end: parentTickEnd });
      return quarters.map(q => (
        <div key={q.toISOString()} className="flex-1 text-center border-r border-border/10 last:border-0">
          {format(q, "QQQ")}
        </div>
      ));
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-2 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
             Today
           </Button>
           <div className="flex items-center border rounded-md bg-background">
             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none rounded-l-md" onClick={() => setCurrentDate(prev => viewConfig.timeSub(prev, 1))}>
               <ChevronLeft className="h-4 w-4" />
             </Button>
             
             <Popover>
               <PopoverTrigger asChild>
                 <Button variant="ghost" className="px-3 py-1 h-8 rounded-none min-w-[140px] font-medium border-x hover:bg-muted/50">
                   {format(currentDate, (viewMode === 'year' || viewMode === 'quarter') ? "yyyy" : "MMMM yyyy")}
                 </Button>
               </PopoverTrigger>
               <PopoverContent className="w-auto p-0" align="center">
                 <CalendarComponent
                   mode="single"
                   selected={currentDate}
                   onSelect={(date) => date && setCurrentDate(date)}
                   initialFocus
                 />
               </PopoverContent>
             </Popover>

             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none rounded-r-md" onClick={() => setCurrentDate(prev => viewConfig.timeAdd(prev, 1))}>
               <ChevronRight className="h-4 w-4" />
             </Button>
           </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={openAddDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Milestone
          </Button>

          <div className="w-px h-6 bg-border mx-2" />

          <Select value={viewMode} onValueChange={(v: ViewMode) => setViewMode(v)}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="quarter">Quarterly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-[120px] h-8">
              <Filter className="w-3 h-3 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="stages">Stages Only</SelectItem>
              <SelectItem value="milestones">Milestones Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-4 h-[600px] w-full">
        {/* Gantt Chart Area - Full Width */}
        <Card className="flex-1 overflow-hidden border-none shadow-none bg-transparent flex flex-col">
          <div 
            className="flex-1 w-full overflow-x-auto overflow-y-hidden border rounded-lg bg-background relative" 
            ref={scrollContainerRef}
          >
            <div 
              className="relative" 
              style={{ width: `${days.length * viewConfig.dayWidth}px`, minHeight: "100%" }}
            >
              {/* Grid Background */}
              <div className="absolute inset-0 flex pointer-events-none">
                {timeTicks.map((tick) => {
                  let tickStart, tickEnd;
                  if (viewMode === 'day') {
                    tickStart = tick;
                    tickEnd = tick;
                  } else if (viewMode === 'week') {
                    tickStart = startOfWeek(tick);
                    tickEnd = endOfWeek(tick);
                  } else if (viewMode === 'month') {
                    tickStart = startOfMonth(tick);
                    tickEnd = endOfMonth(tick);
                  } else if (viewMode === 'quarter') {
                    tickStart = startOfQuarter(tick);
                    tickEnd = endOfQuarter(tick);
                  } else {
                    tickStart = startOfYear(tick);
                    tickEnd = endOfYear(tick);
                  }

                  const width = (differenceInDays(tickEnd, tickStart) + 1) * viewConfig.dayWidth;
                  
                  return (
                    <div 
                      key={tick.toISOString()} 
                      className="h-full border-r border-border/20 box-content"
                      style={{ width: width }} 
                    />
                  );
                })}
              </div>

              {/* Current Day Marker Line */}
              <div 
                className="absolute top-0 bottom-0 w-px bg-red-500 z-30"
                style={{ left: getPosition(new Date()) + (viewConfig.dayWidth / 2) }}
              >
                <div className="absolute -top-1 -translate-x-1/2 bg-red-500 text-white text-[10px] px-1 rounded-sm whitespace-nowrap z-50">
                  Today
                </div>
              </div>

              {/* Header */}
              <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b h-[60px] flex">
                {timeTicks.map(tick => {
                   let tickStart, tickEnd;
                   if (viewMode === 'day') {
                     tickStart = tick;
                     tickEnd = tick;
                   } else if (viewMode === 'week') {
                     tickStart = startOfWeek(tick);
                     tickEnd = endOfWeek(tick);
                   } else if (viewMode === 'month') {
                     tickStart = startOfMonth(tick);
                     tickEnd = endOfMonth(tick);
                   } else if (viewMode === 'quarter') {
                     tickStart = startOfQuarter(tick);
                     tickEnd = endOfQuarter(tick);
                   } else {
                     tickStart = startOfYear(tick);
                     tickEnd = endOfYear(tick);
                   }

                   const width = (differenceInDays(tickEnd, tickStart) + 1) * viewConfig.dayWidth;
                  
                   return (
                    <div 
                      key={tick.toISOString()} 
                      className="flex-shrink-0 border-r px-2 py-2 font-medium text-sm text-muted-foreground bg-muted/20 overflow-hidden"
                      style={{ width }} 
                    >
                      {format(tick, viewConfig.tickFormat)}
                      <div className="flex mt-2 text-[10px] text-muted-foreground/60 font-normal">
                        {renderSubTicks(tickStart, tickEnd)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Content Body */}
              <div className="p-4 space-y-6 pt-8">
                
                {/* Stages */}
                {(filter === 'all' || filter === 'stages') && (
                  <div className="space-y-4">
                    {stagesWithDates.map((stage) => {
                      const left = getPosition(stage.startDate);
                      const width = getWidth(stage.startDate, stage.endDate);
                      const isCompleted = stage.status === 'completed';
                      const isActive = stage.status === 'active';

                      return (
                        <div key={stage.id} className="relative h-[60px] group">
                          {/* Stage Bar */}
                          <div 
                            className={cn(
                              "absolute top-2 h-10 rounded-lg shadow-sm border flex items-center px-4 transition-all hover:shadow-md cursor-pointer",
                              isCompleted ? "bg-green-50 border-green-200 text-green-800" :
                              isActive ? "bg-blue-50 border-blue-200 text-blue-800" :
                              "bg-slate-50 border-slate-200 text-slate-600"
                            )}
                            style={{ left, width }}
                          >
                            <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border shrink-0",
                                isCompleted ? "bg-green-200 border-green-300" :
                                isActive ? "bg-blue-200 border-blue-300" :
                                "bg-slate-200 border-slate-300"
                              )}>
                                {stage.order}
                              </div>
                              <span className="font-semibold text-sm truncate">{stage.name}</span>
                            </div>
                            
                            {/* Duration Label */}
                            <div className="absolute -bottom-5 left-0 text-[10px] text-muted-foreground whitespace-nowrap">
                                {format(stage.startDate, "MMM d")} - {format(stage.endDate, "MMM d")}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Milestones on Gantt */}
                {(filter === 'all' || filter === 'milestones') && (
                   <div className="relative h-[40px] mt-8">
                     <div className="absolute top-1/2 left-0 right-0 h-px bg-border -z-10" />
                     {milestones.map((milestone) => {
                       const mDate = parseISO(milestone.targetDate);
                       if (!isValid(mDate)) return null;

                       const left = getPosition(mDate);
                       const progress = getMilestoneProgress(milestone.id);
                       const isCompleted = progress === 100;
                       
                       return (
                          <Popover key={milestone.id}>
                            <PopoverTrigger asChild>
                              <div 
                                className={cn(
                                  "absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform z-20 shadow-sm",
                                  isCompleted ? "bg-green-100 border-green-500 text-green-700" :
                                  "bg-background border-primary text-primary"
                                )}
                                style={{ left }}
                              >
                                <Flag className="h-4 w-4" fill={isCompleted ? "currentColor" : "none"} />
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <div className="space-y-2">
                                <h4 className="font-semibold leading-none">{milestone.name}</h4>
                                <p className="text-sm text-muted-foreground">{milestone.description}</p>
                                
                                <div className="py-2">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>Progress</span>
                                    <span>{progress}%</span>
                                  </div>
                                  <Progress value={progress} className="h-2" />
                                </div>
                                
                                <div className="flex gap-2 justify-end pt-2">
                                  <Button variant="outline" size="sm" onClick={() => openEditDialog(milestone)}>Edit</Button>
                                  <Button variant="destructive" size="sm" onClick={() => handleDeleteMilestone(milestone.id)}>Delete</Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                       );
                     })}
                   </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Milestone Dialog */}
      <Dialog open={isMilestoneDialogOpen} onOpenChange={setIsMilestoneDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingMilestone ? "Edit Milestone" : "Add Milestone"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={milestoneForm.name}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={milestoneForm.date}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, date: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stage" className="text-right">
                Stage
              </Label>
              <Select 
                value={milestoneForm.stageId} 
                onValueChange={(v) => setMilestoneForm({ ...milestoneForm, stageId: v })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Desc
              </Label>
              <Textarea
                id="description"
                value={milestoneForm.description}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                className="col-span-3"
              />
            </div>

            {/* Task Assignment */}
            <div className="grid grid-cols-4 gap-4 pt-4 border-t">
              <Label className="text-right pt-2">Tasks</Label>
              <div className="col-span-3 border rounded-md max-h-[150px] overflow-y-auto p-2 bg-muted/20">
                <div className="space-y-1">
                  {tasks.map(task => {
                    const isAssigned = milestoneForm.assignedTaskIds.includes(task.id);
                    const assignedToOther = task.milestoneId && task.milestoneId !== editingMilestone?.id && !isAssigned;
                    
                    return (
                      <div 
                        key={task.id} 
                        className={cn(
                          "flex items-start space-x-2 p-2 rounded hover:bg-muted/50 transition-colors cursor-pointer",
                          assignedToOther ? "opacity-50" : ""
                        )}
                        onClick={() => !assignedToOther && toggleTaskAssignment(task.id)}
                      >
                        <div className={cn(
                          "h-4 w-4 rounded border flex items-center justify-center mt-0.5",
                          isAssigned ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"
                        )}>
                           {isAssigned && <CheckSquare className="h-3 w-3" />}
                        </div>
                        <div className="flex-1 text-sm">
                          <div className="font-medium leading-none mb-1">{task.title}</div>
                          <div className="text-xs text-muted-foreground">{task.status}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMilestoneDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveMilestone}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}