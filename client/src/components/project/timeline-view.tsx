import { useState, useMemo, useRef, useEffect } from "react";
import { 
  format, 
  addDays, 
  addMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  eachMonthOfInterval, 
  isSameDay, 
  isWithinInterval,
  differenceInDays,
  startOfWeek,
  endOfWeek,
  parseISO,
  isValid
} from "date-fns";
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Calendar as CalendarIcon,
  Flag,
  MoreHorizontal,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ProjectStage, Milestone, Project } from "@/lib/mock-data";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TimelineViewProps {
  stages: ProjectStage[];
  milestones: Milestone[];
  project: Project;
}

// Mock date generator for stages since they don't have dates in the interface yet
const generateStageDates = (stages: ProjectStage[]) => {
  const today = new Date();
  const start = addMonths(today, -1); // Project started 1 month ago
  
  let currentStart = start;
  
  return stages.map((stage, index) => {
    // Variable duration based on stage type
    const durationDays = stage.type === 'planning' ? 14 : 
                         stage.type === 'execution' ? 30 : 
                         stage.type === 'review' ? 7 : 14;
    
    const startDate = currentStart;
    const endDate = addDays(startDate, durationDays);
    
    // Set next stage start
    currentStart = addDays(endDate, 1);

    return {
      ...stage,
      startDate,
      endDate
    };
  });
};

type ViewMode = "month" | "week" | "day";

export function TimelineView({ stages, milestones, project }: TimelineViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filter, setFilter] = useState<"all" | "stages" | "milestones">("all");
  
  const stagesWithDates = useMemo(() => generateStageDates(stages), [stages]);
  
  // Calculate total timeline range
  const timelineStart = startOfMonth(addMonths(stagesWithDates[0].startDate, -1));
  const timelineEnd = endOfMonth(addMonths(stagesWithDates[stagesWithDates.length - 1].endDate, 1));

  // Generate ticks based on view mode
  const timeTicks = useMemo(() => {
    if (viewMode === "month") {
      return eachMonthOfInterval({ start: timelineStart, end: timelineEnd });
    } else {
      // For week/day views, we'd generate differently, keeping simple for now
      return eachMonthOfInterval({ start: timelineStart, end: timelineEnd });
    }
  }, [viewMode, timelineStart, timelineEnd]);

  const days = useMemo(() => {
    return eachDayOfInterval({ start: timelineStart, end: timelineEnd });
  }, [timelineStart, timelineEnd]);

  // Dimensions
  const dayWidth = viewMode === "month" ? 40 : viewMode === "week" ? 80 : 120;
  const headerHeight = 60;
  const rowHeight = 64;

  const getPosition = (date: Date) => {
    const diff = differenceInDays(date, timelineStart);
    return diff * dayWidth;
  };

  const getWidth = (start: Date, end: Date) => {
    const diff = differenceInDays(end, start) + 1; // Include end day
    return diff * dayWidth;
  };

  // Scroll to current date on mount
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (scrollContainerRef.current) {
      const todayPos = getPosition(new Date());
      const containerWidth = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollLeft = todayPos - (containerWidth / 2);
    }
  }, []);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-2 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
             Today
           </Button>
           <div className="flex items-center border rounded-md bg-background">
             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none rounded-l-md" onClick={() => setViewMode("month")}>
               <ChevronLeft className="h-4 w-4" />
             </Button>
             <div className="px-3 py-1 text-sm font-medium min-w-[120px] text-center border-x">
               {format(currentDate, "MMMM yyyy")}
             </div>
             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none rounded-r-md" onClick={() => setViewMode("month")}>
               <ChevronRight className="h-4 w-4" />
             </Button>
           </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month View</SelectItem>
              <SelectItem value="week">Week View</SelectItem>
              <SelectItem value="day">Day View</SelectItem>
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

          <div className="flex items-center border rounded-md bg-background ml-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={() => setViewMode(prev => prev === 'month' ? 'week' : 'day')}
              disabled={viewMode === 'day'}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setViewMode(prev => prev === 'day' ? 'week' : 'month')}
              disabled={viewMode === 'month'}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <Card className="flex-1 overflow-hidden border-none shadow-none bg-transparent">
        <ScrollArea className="h-[600px] w-full border rounded-lg bg-background" ref={scrollContainerRef}>
          <div 
            className="relative" 
            style={{ width: `${days.length * dayWidth}px`, minHeight: "100%" }}
          >
            {/* Grid Background */}
            <div className="absolute inset-0 flex pointer-events-none">
              {days.map((day, i) => (
                <div 
                  key={day.toISOString()} 
                  className={cn(
                    "h-full border-r border-dashed border-border/40 box-content",
                    isSameDay(day, new Date()) ? "bg-primary/5" : ""
                  )}
                  style={{ width: dayWidth - 1 }} // -1 for border
                />
              ))}
            </div>

            {/* Current Day Marker Line */}
            <div 
              className="absolute top-0 bottom-0 w-px bg-red-500 z-30"
              style={{ left: getPosition(new Date()) + (dayWidth / 2) }}
            >
              <div className="absolute -top-1 -translate-x-1/2 bg-red-500 text-white text-[10px] px-1 rounded-sm">
                Today
              </div>
            </div>

            {/* Header */}
            <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b h-[60px] flex">
              {timeTicks.map(month => (
                <div 
                  key={month.toISOString()} 
                  className="flex-shrink-0 border-r px-2 py-2 font-medium text-sm text-muted-foreground bg-muted/20"
                  style={{ width: differenceInDays(endOfMonth(month), startOfMonth(month)) * dayWidth + dayWidth }} // Approx
                >
                  {format(month, "MMMM yyyy")}
                  <div className="flex mt-2 text-[10px] text-muted-foreground/60 font-normal">
                    {eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }).map((d, i) => {
                      if (viewMode === 'month' && i % 7 !== 0) return null; // Only show some dates in month view
                      return (
                         <div 
                          key={d.toISOString()} 
                          className="flex-1 text-center"
                          style={{ width: viewMode === 'month' ? dayWidth * 7 : dayWidth }}
                         >
                           {format(d, "d")}
                         </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Content Body */}
            <div className="p-4 space-y-6">
              
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
                              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border",
                              isCompleted ? "bg-green-200 border-green-300" :
                              isActive ? "bg-blue-200 border-blue-300" :
                              "bg-slate-200 border-slate-300"
                            )}>
                              {stage.order}
                            </div>
                            <span className="font-semibold text-sm truncate">{stage.name}</span>
                          </div>
                          
                          {/* Progress Bar inside */}
                          {isActive && (
                            <div className="absolute bottom-0 left-0 h-1 bg-blue-500 rounded-bl-lg animate-pulse" style={{ width: '45%' }} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Milestones */}
              {(filter === 'all' || filter === 'milestones') && (
                 <div className="relative h-[40px] mt-8">
                   <div className="absolute top-1/2 left-0 right-0 h-px bg-border -z-10" />
                   {milestones.map((milestone) => {
                     // Parse milestone date - mocking standard format if needed
                     let mDate = new Date();
                     try {
                        // Assuming milestones dates in mock data might need better parsing or fixed
                        // Just distributing them for demo if parsing fails or using stages
                        const stage = stagesWithDates.find(s => s.id === milestone.stageId) || stagesWithDates[0];
                        mDate = addDays(stage.startDate, 5); // Mock position within stage
                     } catch (e) {
                       mDate = new Date();
                     }

                     const left = getPosition(mDate);
                     
                     return (
                        <Popover key={milestone.id}>
                          <PopoverTrigger asChild>
                            <div 
                              className={cn(
                                "absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform z-20 shadow-sm",
                                milestone.status === 'Completed' ? "bg-green-100 border-green-500 text-green-700" :
                                "bg-background border-primary text-primary"
                              )}
                              style={{ left }}
                            >
                              <Flag className="h-4 w-4" fill={milestone.status === 'Completed' ? "currentColor" : "none"} />
                            </div>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="space-y-2">
                              <h4 className="font-semibold leading-none">{milestone.name}</h4>
                              <p className="text-sm text-muted-foreground">{milestone.description}</p>
                              <div className="flex items-center gap-2 pt-2">
                                <Badge variant={milestone.status === 'Completed' ? "default" : "secondary"}>
                                  {milestone.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{milestone.targetDate}</span>
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
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Card>
      
      {/* Legend / Info */}
      <div className="flex gap-6 text-sm text-muted-foreground px-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-50 border border-green-200" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-50 border border-blue-200" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-50 border border-slate-200" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <Flag className="w-3 h-3 text-primary" />
          <span>Milestone</span>
        </div>
      </div>
    </div>
  );
}
