import { useState, useMemo, useRef, useEffect } from "react";
import { 
  format, 
  addDays, 
  addMonths, 
  addWeeks,
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  eachMonthOfInterval, 
  isSameDay, 
  differenceInDays,
  parseISO,
  isValid
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
  Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ProjectStage, Milestone, Project } from "@/lib/mock-data";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TimelineViewProps {
  stages: ProjectStage[];
  milestones: Milestone[];
  project: Project;
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

type ViewMode = "month" | "week" | "day";

export function TimelineView({ stages, milestones: initialMilestones, project }: TimelineViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filter, setFilter] = useState<"all" | "stages" | "milestones">("all");
  
  // Local state for milestones to allow adding/editing
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [isMilestoneDialogOpen, setIsMilestoneDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [milestoneForm, setMilestoneForm] = useState({
    name: "",
    date: format(new Date(), "yyyy-MM-dd"),
    stageId: stages[0]?.id || "",
    description: ""
  });

  const stagesWithDates = useMemo(() => generateStageDates(stages, project.startDate), [stages, project.startDate]);
  
  // Calculate total timeline range
  const timelineStart = startOfMonth(addMonths(stagesWithDates[0].startDate, -1));
  const timelineEnd = endOfMonth(addMonths(stagesWithDates[stagesWithDates.length - 1].endDate, 1));

  // Generate ticks based on view mode
  const timeTicks = useMemo(() => {
    return eachMonthOfInterval({ start: timelineStart, end: timelineEnd });
  }, [timelineStart, timelineEnd]);

  const days = useMemo(() => {
    return eachDayOfInterval({ start: timelineStart, end: timelineEnd });
  }, [timelineStart, timelineEnd]);

  // Dimensions
  const dayWidth = viewMode === "month" ? 40 : viewMode === "week" ? 80 : 120;
  const headerHeight = 60;
  
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

  // Milestone Management
  const handleSaveMilestone = () => {
    if (editingMilestone) {
      setMilestones(prev => prev.map(m => m.id === editingMilestone.id ? {
        ...m,
        name: milestoneForm.name,
        targetDate: milestoneForm.date,
        stageId: milestoneForm.stageId,
        description: milestoneForm.description
      } : m));
    } else {
      const newMilestone: Milestone = {
        id: `m-${Date.now()}`,
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
    setIsMilestoneDialogOpen(false);
    resetForm();
  };

  const handleDeleteMilestone = (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
  };

  const openAddDialog = () => {
    setEditingMilestone(null);
    resetForm();
    setIsMilestoneDialogOpen(true);
  };

  const openEditDialog = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setMilestoneForm({
      name: milestone.name,
      date: milestone.targetDate,
      stageId: milestone.stageId,
      description: milestone.description
    });
    setIsMilestoneDialogOpen(true);
  };

  const resetForm = () => {
    setMilestoneForm({
      name: "",
      date: format(new Date(), "yyyy-MM-dd"),
      stageId: stages[0]?.id || "",
      description: ""
    });
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
          <Button size="sm" onClick={openAddDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Milestone
          </Button>

          <div className="w-px h-6 bg-border mx-2" />

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

      <div className="flex gap-4 h-[600px]">
        {/* Milestone Sidebar List */}
        <Card className="w-[300px] flex flex-col h-full border-none shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0 pb-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flag className="h-4 w-4 text-primary" />
              Milestones
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1 pr-4">
             <div className="space-y-3">
               {milestones.sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()).map(milestone => (
                 <div key={milestone.id} className="p-3 bg-card border rounded-lg hover:shadow-sm transition-all group relative">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="font-medium text-sm flex items-center gap-2">
                           {milestone.name}
                           {milestone.status === 'Completed' && <span className="text-green-600 text-[10px]"><Flag className="h-3 w-3 fill-current" /></span>}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(parseISO(milestone.targetDate), "MMM d, yyyy")}
                        </div>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-32 p-1">
                          <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8" onClick={() => openEditDialog(milestone)}>
                            <Edit2 className="h-3 w-3 mr-2" />
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteMilestone(milestone.id)}>
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete
                          </Button>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                       <Badge variant="outline" className="text-[10px] font-normal">
                         {stages.find(s => s.id === milestone.stageId)?.name || 'Unknown Stage'}
                       </Badge>
                    </div>
                 </div>
               ))}
             </div>
          </ScrollArea>
        </Card>

        {/* Gantt Chart Area */}
        <Card className="flex-1 overflow-hidden border-none shadow-none bg-transparent flex flex-col">
          <ScrollArea className="flex-1 w-full border rounded-lg bg-background" ref={scrollContainerRef}>
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
                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border",
                                isCompleted ? "bg-green-200 border-green-300" :
                                isActive ? "bg-blue-200 border-blue-300" :
                                "bg-slate-200 border-slate-300"
                              )}>
                                {stage.order}
                              </div>
                              <span className="font-semibold text-sm truncate">{stage.name}</span>
                            </div>
                            
                            {/* Duration Label */}
                            <div className="absolute -bottom-5 left-0 text-[10px] text-muted-foreground">
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
                                  <span className="text-xs text-muted-foreground">{format(mDate, "MMM d, yyyy")}</span>
                                </div>
                                <div className="pt-2 flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => openEditDialog(milestone)}>Edit</Button>
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
      </div>

      {/* Milestone Add/Edit Dialog */}
      <Dialog open={isMilestoneDialogOpen} onOpenChange={setIsMilestoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMilestone ? 'Edit Milestone' : 'Add New Milestone'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Milestone Name</Label>
              <Input 
                value={milestoneForm.name} 
                onChange={(e) => setMilestoneForm({...milestoneForm, name: e.target.value})}
                placeholder="e.g., Client Sign-off"
              />
            </div>
            <div className="space-y-2">
              <Label>Target Date</Label>
              <Input 
                type="date"
                value={milestoneForm.date} 
                onChange={(e) => setMilestoneForm({...milestoneForm, date: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Related Stage</Label>
              <Select 
                value={milestoneForm.stageId} 
                onValueChange={(val) => setMilestoneForm({...milestoneForm, stageId: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={milestoneForm.description} 
                onChange={(e) => setMilestoneForm({...milestoneForm, description: e.target.value})}
                placeholder="Brief description..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMilestoneDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveMilestone}>Save Milestone</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
