import { useState, useMemo } from "react";
import { 
  Calendar, 
  CheckCircle2, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  List, 
  Kanban, 
  Clock, 
  User,
  ArrowRight,
  Target,
  X,
  Check,
  ChevronsUpDown,
  Flag,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  ProjectStage,
  Task
} from "@/lib/mock-data";
import { useTasks, useUsers, useMilestones } from "@/hooks/use-nexus-data";
import { useCompletedStatuses } from "@/hooks/use-completed-statuses";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface StageTabContentProps {
  stage: ProjectStage;
  projectId: string;
}

export function StageTabContent({ stage, projectId }: StageTabContentProps) {
  // Fetch data from database
  const { data: allTasks, isLoading: isTasksLoading } = useTasks();
  const { isTaskComplete } = useCompletedStatuses();
  const { data: allMilestones, isLoading: isMilestonesLoading } = useMilestones();
  const { data: users, isLoading: isUsersLoading } = useUsers();
  
  // Stage Attributes State
  const [startDate, setStartDate] = useState<Date | undefined>(
    stage.id === 'st_plan' ? new Date(2023, 10, 1) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    stage.id === 'st_plan' ? new Date(2023, 11, 15) : undefined
  );
  
  const [entryMilestones, setEntryMilestones] = useState<string[]>([]);
  const [exitMilestones, setExitMilestones] = useState<string[]>([]);

  const [openEntry, setOpenEntry] = useState(false);
  const [openExit, setOpenExit] = useState(false);

  // Task Board State
  const [viewType, setViewType] = useState<"board" | "list">("board");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter tasks by project and stage
  const stageTasks = useMemo(() => {
    if (!allTasks) return [];
    return allTasks.filter((t: any) => 
      t.stageId === stage.id && 
      t.projectId === projectId &&
      (t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
       (t.description?.toLowerCase() || "").includes(searchQuery.toLowerCase()))
    );
  }, [allTasks, stage.id, projectId, searchQuery]);

  // Filter milestones by project and stage (for display)
  const stageMilestones = useMemo(() => {
    if (!allMilestones) return [];
    return allMilestones.filter((m: any) => m.stageId === stage.id && m.projectId === projectId);
  }, [allMilestones, stage.id, projectId]);
  
  // All milestones for the current project (for selector dropdowns)
  const projectMilestones = useMemo(() => {
    if (!allMilestones) return [];
    return allMilestones.filter((m: any) => m.projectId === projectId);
  }, [allMilestones, projectId]);

  const getAssignee = (id?: string) => users?.find((u: any) => u.id === id);

  const toggleMilestone = (id: string, current: string[], setFn: (val: string[]) => void) => {
    if (current.includes(id)) {
      setFn(current.filter(i => i !== id));
    } else {
      setFn([...current, id]);
    }
  };

  const removeMilestone = (id: string, current: string[], setFn: (val: string[]) => void) => {
     setFn(current.filter(i => i !== id));
  };

  const getMilestoneProgress = (milestoneId: string) => {
    if (!allTasks) return 0;
    // Filter by both milestoneId AND projectId to avoid cross-project contamination
    const assignedTasks = allTasks.filter((t: any) => t.milestoneId === milestoneId && t.projectId === projectId);
    if (assignedTasks.length === 0) return 0;
    const doneTasks = assignedTasks.filter((t: any) => isTaskComplete(t.status));
    return Math.round((doneTasks.length / assignedTasks.length) * 100);
  };
  
  // Show loading state
  if (isTasksLoading || isMilestonesLoading || isUsersLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="milestones" className="w-full flex flex-col md:flex-row gap-6">
        <TabsList className="w-full md:w-64 flex-col h-auto justify-start border-r rounded-none p-0 bg-transparent space-y-1">
          <div className="px-2 py-2 mb-2">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Stage Views</h4>
          </div>
          <TabsTrigger 
            value="milestones" 
            className="w-full justify-start rounded-md border-0 px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/50 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <Flag className="mr-2 h-4 w-4" />
            Milestones
          </TabsTrigger>
          <TabsTrigger 
            value="tasks" 
            className="w-full justify-start rounded-md border-0 px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/50 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            All Tasks
          </TabsTrigger>
          <TabsTrigger 
            value="config" 
            className="w-full justify-start rounded-md border-0 px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/50 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            <Target className="mr-2 h-4 w-4" />
            Configuration
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 mt-0">
          {/* Milestones Tab */}
          <TabsContent value="milestones" className="mt-0 space-y-6">
          {stageMilestones.length === 0 ? (
             <div className="text-center py-12 border rounded-lg bg-muted/10 border-dashed">
               <Flag className="h-10 w-10 mx-auto text-muted-foreground mb-4 opacity-50" />
               <h3 className="text-lg font-medium">No Milestones Defined</h3>
               <p className="text-muted-foreground mt-2 text-sm max-w-sm mx-auto">
                 There are no milestones associated with this stage yet. Add milestones in the Milestones tab or Timeline view.
               </p>
             </div>
          ) : (
            <div className="grid gap-6">
              {stageMilestones.map(milestone => {
                // Filter milestone tasks by both milestoneId AND projectId
                const milestoneTasks = allTasks?.filter((t: any) => t.milestoneId === milestone.id && t.projectId === projectId) || [];
                const progress = getMilestoneProgress(milestone.id);
                
                return (
                  <Card key={milestone.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Flag className="h-4 w-4 text-primary" />
                            {milestone.name}
                          </CardTitle>
                          <CardDescription>{milestone.description}</CardDescription>
                        </div>
                        <Badge variant={progress === 100 ? "default" : "secondary"}>
                          {milestone.status}
                        </Badge>
                      </div>
                      <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                           <Calendar className="h-3.5 w-3.5" />
                           Target: {milestone.targetDate}
                        </div>
                        <div className="flex items-center gap-1.5">
                           <List className="h-3.5 w-3.5" />
                           {milestoneTasks.length} Tasks
                        </div>
                      </div>
                      <div className="mt-4 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {milestoneTasks.length > 0 ? (
                        <div className="divide-y">
                          {milestoneTasks.map(task => {
                            const assignee = getAssignee(task.assigneeId);
                            return (
                              <div key={task.id} className="p-3 flex items-center justify-between hover:bg-muted/20 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    task.status === "Todo" ? "bg-slate-400" :
                                    task.status === "In Progress" ? "bg-blue-500" :
                                    task.status === "Review" ? "bg-amber-500" :
                                    "bg-green-500"
                                  )} />
                                  <span className="text-sm font-medium">{task.title}</span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <Badge variant="outline" className="font-normal text-[10px]">
                                    {task.priority}
                                  </Badge>
                                  {assignee && (
                                    <div className="flex items-center gap-1.5">
                                      <Avatar className="h-4 w-4">
                                        <AvatarFallback className="text-[8px]">{assignee.name.substring(0,2).toUpperCase()}</AvatarFallback>
                                      </Avatar>
                                      <span className="truncate max-w-[80px]">{assignee.name}</span>
                                    </div>
                                  )}
                                  <div className="w-16 text-right">
                                    {task.status}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-sm text-muted-foreground italic">
                          No tasks assigned to this milestone.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* All Tasks Tab */}
        <TabsContent value="tasks" className="mt-0">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{stage.name} Tasks</h3>
                <Badge variant="secondary">{stageTasks.length} Tasks</Badge>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center border rounded-md bg-background">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-8 w-8 rounded-none rounded-l-md", viewType === "board" && "bg-muted")}
                    onClick={() => setViewType("board")}
                  >
                    <Kanban className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-full bg-border" />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn("h-8 w-8 rounded-none rounded-r-md", viewType === "list" && "bg-muted")}
                    onClick={() => setViewType("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Filter tasks..."
                    className="pl-8 h-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button size="sm" className="h-8 gap-2">
                  <Plus className="h-3.5 w-3.5" /> New Task
                </Button>
              </div>
            </div>

            {viewType === "board" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {["Todo", "In Progress", "Review", "Done"].map(status => (
                  <div key={status} className="flex flex-col gap-3 min-w-[250px]">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          status === "Todo" ? "bg-slate-400" :
                          status === "In Progress" ? "bg-blue-500" :
                          status === "Review" ? "bg-amber-500" :
                          "bg-green-500"
                        )} />
                        {status}
                      </span>
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                        {stageTasks.filter(t => t.status === status).length}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {stageTasks.filter(t => t.status === status).map(task => {
                        const assignee = getAssignee(task.assigneeId);
                        return (
                          <Card key={task.id} className="shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4" 
                            style={{ borderLeftColor: task.priority === 'High' ? '#ef4444' : task.priority === 'Medium' ? '#f59e0b' : '#3b82f6' }}>
                            <CardContent className="p-3 space-y-2">
                              <h4 className="text-sm font-medium leading-tight">{task.title}</h4>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {assignee ? (
                                    <Avatar className="h-5 w-5">
                                      <AvatarFallback className="text-[9px]">{assignee.name.substring(0,2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                  ) : (
                                    <User className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                {task.estimateHours && (
                                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                    {task.estimateHours}h
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                      <Button variant="ghost" className="justify-start text-xs text-muted-foreground border border-dashed h-8">
                        <Plus className="h-3 w-3 mr-2" /> Add Task
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border rounded-lg bg-card">
                {stageTasks.map((task, i) => {
                  const assignee = getAssignee(task.assigneeId);
                  return (
                    <div key={task.id} className={cn(
                      "flex items-center justify-between p-3 hover:bg-muted/30 transition-colors",
                      i !== stageTasks.length - 1 && "border-b"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          task.status === "Todo" ? "bg-slate-400" :
                          task.status === "In Progress" ? "bg-blue-500" :
                          task.status === "Review" ? "bg-amber-500" :
                          "bg-green-500"
                        )} />
                        <span className="text-sm font-medium">{task.title}</span>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                         <div className="flex items-center gap-2 w-32">
                            {assignee ? (
                               <>
                                  <Avatar className="h-5 w-5">
                                     <AvatarFallback className="text-[9px]">{assignee.name.substring(0,2).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs truncate">{assignee.name}</span>
                               </>
                            ) : (
                               <span className="text-xs italic">Unassigned</span>
                            )}
                         </div>
                         <Badge variant="outline" className="text-[10px] font-normal w-20 justify-center">
                            {task.priority}
                         </Badge>
                         <div className="flex items-center gap-1 w-20 justify-end">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs">{task.estimateHours || 0}h</span>
                         </div>
                      </div>
                    </div>
                  );
                })}
                 {stageTasks.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground text-sm italic">
                       No tasks found for this stage.
                    </div>
                 )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Stage Configuration Tab */}
        <TabsContent value="config" className="mt-0">
          <Card className="bg-muted/10 border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                Stage Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Dates */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="grid gap-1.5 flex-1">
                      <span className="text-xs font-medium text-muted-foreground">Start Date</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal h-9",
                              !startDate && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground mt-5" />
                    <div className="grid gap-1.5 flex-1">
                      <span className="text-xs font-medium text-muted-foreground">End Date</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal h-9",
                              !endDate && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                {/* Criteria Mapping */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {/* Entry Criteria Multi-Select */}
                    <div className="grid gap-1.5 flex-1">
                      <span className="text-xs font-medium text-muted-foreground">Entry Criteria (Milestones)</span>
                      <Popover open={openEntry} onOpenChange={setOpenEntry}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openEntry}
                            className="w-full justify-between h-auto min-h-[2.25rem] px-3 py-2"
                          >
                            <div className="flex flex-wrap gap-1 items-center">
                              {entryMilestones.length === 0 && <span className="text-muted-foreground font-normal">Select Milestones...</span>}
                              {entryMilestones.map((id) => (
                                <Badge key={id} variant="secondary" className="mr-1 font-normal">
                                  {projectMilestones?.find((m: any) => m.id === id)?.name}
                                  <div
                                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      removeMilestone(id, entryMilestones, setEntryMilestones);
                                    }}
                                  >
                                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                  </div>
                                </Badge>
                              ))}
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search milestones..." />
                            <CommandEmpty>No milestone found.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {(projectMilestones || []).map((milestone: any) => (
                                <CommandItem
                                  key={milestone.id}
                                  value={milestone.name}
                                  onSelect={() => toggleMilestone(milestone.id, entryMilestones, setEntryMilestones)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      entryMilestones.includes(milestone.id) ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {milestone.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="w-px h-10 bg-border mt-4" />

                    {/* Exit Criteria Multi-Select */}
                    <div className="grid gap-1.5 flex-1">
                      <span className="text-xs font-medium text-muted-foreground">Exit Criteria (Milestones)</span>
                      <Popover open={openExit} onOpenChange={setOpenExit}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openExit}
                            className="w-full justify-between h-auto min-h-[2.25rem] px-3 py-2"
                          >
                            <div className="flex flex-wrap gap-1 items-center">
                              {exitMilestones.length === 0 && <span className="text-muted-foreground font-normal">Select Milestones...</span>}
                              {exitMilestones.map((id) => (
                                <Badge key={id} variant="secondary" className="mr-1 font-normal">
                                  {projectMilestones?.find((m: any) => m.id === id)?.name}
                                  <div
                                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      removeMilestone(id, exitMilestones, setExitMilestones);
                                    }}
                                  >
                                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                  </div>
                                </Badge>
                              ))}
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search milestones..." />
                            <CommandEmpty>No milestone found.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {(projectMilestones || []).map((milestone: any) => (
                                <CommandItem
                                  key={milestone.id}
                                  value={milestone.name}
                                  onSelect={() => toggleMilestone(milestone.id, exitMilestones, setExitMilestones)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      exitMilestones.includes(milestone.id) ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {milestone.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
