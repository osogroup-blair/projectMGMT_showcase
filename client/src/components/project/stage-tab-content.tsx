import { useState } from "react";
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
  Target
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  TASKS, 
  TEAM, 
  MILESTONES, 
  ProjectStage,
  Task
} from "@/lib/mock-data";

interface StageTabContentProps {
  stage: ProjectStage;
  projectId: string;
}

export function StageTabContent({ stage, projectId }: StageTabContentProps) {
  // Stage Attributes State
  const [startDate, setStartDate] = useState<Date | undefined>(
    stage.id === 'st_plan' ? new Date(2023, 10, 1) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    stage.id === 'st_plan' ? new Date(2023, 11, 15) : undefined
  );
  
  const [entryMilestone, setEntryMilestone] = useState<string>(
    stage.id === 'st_validate' ? 'm1' : 'none'
  );
  const [exitMilestone, setExitMilestone] = useState<string>(
    stage.id === 'st_plan' ? 'm1' : 'none'
  );

  // Task Board State
  const [viewType, setViewType] = useState<"board" | "list">("board");
  const [searchQuery, setSearchQuery] = useState("");
  
  const stageTasks = TASKS.filter(t => t.stageId === stage.id && 
    (t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     (t.description?.toLowerCase() || "").includes(searchQuery.toLowerCase()))
  );

  const getAssignee = (id?: string) => TEAM.find(u => u.id === id);

  return (
    <div className="space-y-6">
      {/* Stage Attributes & Criteria Panel */}
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
                <div className="grid gap-1.5 flex-1">
                  <span className="text-xs font-medium text-muted-foreground">Entry Criteria (Milestone)</span>
                  <Select value={entryMilestone} onValueChange={setEntryMilestone}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select Milestone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Entry Milestone</SelectItem>
                      {MILESTONES.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-px h-10 bg-border mt-4" />
                <div className="grid gap-1.5 flex-1">
                  <span className="text-xs font-medium text-muted-foreground">Exit Criteria (Milestone)</span>
                  <Select value={exitMilestone} onValueChange={setExitMilestone}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select Milestone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Exit Milestone</SelectItem>
                      {MILESTONES.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stage Workspace */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{stage.name} Workspace</h3>
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
    </div>
  );
}
