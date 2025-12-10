import { useState } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Plus,
  Kanban,
  List,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Info,
  ChevronDown
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRoute, Link } from "wouter";
import { cn } from "@/lib/utils";
import { 
  PROJECTS, 
  PROJECT_STAGES, 
  TASKS, 
  MILESTONES, 
  SAVED_VIEWS, 
  GUIDANCE_ITEMS,
  TEAM,
  Task
} from "@/lib/mock-data";

export default function StageWorkspace() {
  const [match, params] = useRoute("/projects/:projectId/stages/:stageId");
  const projectId = params?.projectId || "1";
  const stageId = params?.stageId || "s1";

  const project = PROJECTS.find(p => p.id === projectId) || PROJECTS[0];
  const stage = PROJECT_STAGES.find(s => s.id === stageId) || PROJECT_STAGES[0];
  const nextStage = PROJECT_STAGES.find(s => s.order === stage.order + 1);
  const prevStage = PROJECT_STAGES.find(s => s.order === stage.order - 1);

  // Filter Data
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [currentViewId, setCurrentViewId] = useState<string>("default");

  const tasks = TASKS.filter(t => {
    const matchStage = t.stageId === stageId;
    const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchAssignee = assigneeFilter === "all" || t.assigneeId === assigneeFilter;
    return matchStage && matchSearch && matchStatus && matchAssignee;
  });

  const milestones = MILESTONES.filter(m => m.stageId === stageId);
  const guidance = GUIDANCE_ITEMS.filter(g => g.stageId === stageId);
  const savedViews = SAVED_VIEWS.filter(v => v.stageIds.includes(stageId) || v.stageIds.length === 0);

  const getAssignee = (id?: string) => TEAM.find(u => u.id === id);

  return (
    <Shell>
      <div className="mx-auto max-w-7xl h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 shrink-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={`/projects/${projectId}`} className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              {project.name}
            </Link>
            <span className="text-border">/</span>
            <span className="text-foreground font-medium">{stage.name} Workspace</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-3">
                {stage.name}
                <Badge variant="outline" className={cn(
                  "font-normal text-sm",
                  stage.status === 'active' ? "bg-blue-50 text-blue-700 border-blue-200" :
                  stage.status === 'completed' ? "bg-green-50 text-green-700 border-green-200" :
                  "text-muted-foreground"
                )}>
                  {stage.status}
                </Badge>
              </h1>
              
              <div className="flex items-center border rounded-md bg-background shadow-xs">
                {prevStage && (
                  <Link href={`/projects/${projectId}/stages/${prevStage.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 px-2 rounded-r-none border-r">
                      <ArrowLeft className="h-4 w-4 mr-1" /> Prev
                    </Button>
                  </Link>
                )}
                <span className="px-3 text-xs font-medium text-muted-foreground">
                  Stage {stage.order} of {PROJECT_STAGES.length}
                </span>
                {nextStage && (
                  <Link href={`/projects/${projectId}/stages/${nextStage.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 px-2 rounded-l-none border-l">
                      Next <ArrowLeft className="h-4 w-4 ml-1 rotate-180" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select value={currentViewId} onValueChange={setCurrentViewId}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Select View" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default View</SelectItem>
                  {savedViews.map(view => (
                    <SelectItem key={view.id} value={view.id}>
                      {view.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button className="h-9 gap-2">
                <Plus className="h-4 w-4" />
                New Task
              </Button>
            </div>
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Main Task Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-background border rounded-lg shadow-xs overflow-hidden">
            {/* Toolbar */}
            <div className="p-3 border-b flex items-center justify-between gap-4 bg-muted/20">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filter tasks..."
                    className="pl-9 h-9 bg-background"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 border-dashed">
                      <Filter className="mr-2 h-4 w-4" />
                      Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuCheckboxItem checked={statusFilter === "all"} onCheckedChange={() => setStatusFilter("all")}>
                      All Statuses
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    {["Todo", "In Progress", "Review", "Done"].map(status => (
                      <DropdownMenuCheckboxItem 
                        key={status} 
                        checked={statusFilter === status}
                        onCheckedChange={() => setStatusFilter(status)}
                      >
                        {status}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 border-dashed">
                      <Filter className="mr-2 h-4 w-4" />
                      Assignee
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuCheckboxItem checked={assigneeFilter === "all"} onCheckedChange={() => setAssigneeFilter("all")}>
                      All Assignees
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    {TEAM.map(member => (
                      <DropdownMenuCheckboxItem 
                        key={member.id} 
                        checked={assigneeFilter === member.id}
                        onCheckedChange={() => setAssigneeFilter(member.id)}
                      >
                        {member.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center border rounded-md overflow-hidden bg-background">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none hover:bg-muted">
                  <List className="h-4 w-4" />
                </Button>
                <div className="w-px h-4 bg-border" />
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none bg-muted hover:bg-muted">
                  <Kanban className="h-4 w-4" />
                </Button>
                <div className="w-px h-4 bg-border" />
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none hover:bg-muted">
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Task List/Board */}
            <ScrollArea className="flex-1 p-4 bg-muted/10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-full">
                {["Todo", "In Progress", "Review", "Done"].map(columnStatus => (
                  <div key={columnStatus} className="flex flex-col gap-3 min-w-[280px]">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          columnStatus === "Todo" ? "bg-slate-400" :
                          columnStatus === "In Progress" ? "bg-blue-500" :
                          columnStatus === "Review" ? "bg-amber-500" :
                          "bg-green-500"
                        )} />
                        {columnStatus}
                      </h3>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">
                        {tasks.filter(t => t.status === columnStatus).length}
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      {tasks.filter(t => t.status === columnStatus).map(task => {
                        const assignee = getAssignee(task.assigneeId);
                        return (
                          <Card key={task.id} className="shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4" style={{ borderLeftColor: task.priority === 'High' ? '#ef4444' : task.priority === 'Medium' ? '#f59e0b' : '#3b82f6' }}>
                            <CardContent className="p-3 space-y-3">
                              <div className="space-y-1">
                                <Link href={`/projects/${projectId}/tasks/${task.id}`}>
                                  <h4 className="text-sm font-medium hover:text-primary leading-tight hover:underline decoration-primary/30 underline-offset-2">
                                    {task.title}
                                  </h4>
                                </Link>
                                <div className="flex flex-wrap gap-1">
                                  {task.tags?.map(tag => (
                                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-2">
                                  {assignee ? (
                                    <Avatar className="h-6 w-6 border border-background">
                                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                        {assignee.name.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                  ) : (
                                    <div className="h-6 w-6 rounded-full border border-dashed flex items-center justify-center">
                                      <Plus className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                {task.estimateHours && (
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded">
                                    <Clock className="h-3 w-3" />
                                    {task.estimateHours}h
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                      <Button variant="ghost" className="w-full justify-start text-muted-foreground text-sm h-8 hover:bg-muted/50 border border-transparent border-dashed hover:border-border">
                        <Plus className="h-3 w-3 mr-2" /> Add Task
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right Sidebar: Context & Guidance */}
          <div className="w-80 shrink-0 flex flex-col gap-6">
            {/* Milestones Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Stage Milestones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {milestones.length > 0 ? milestones.map(m => (
                  <div key={m.id} className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-sm font-medium leading-tight">{m.name}</span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap",
                        m.status === 'Completed' ? "bg-green-100 text-green-700" :
                        m.status === 'In Progress' ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-700"
                      )}>{m.status}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {m.targetDate}
                    </div>
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${m.progressPercent}%` }} />
                    </div>
                  </div>
                )) : (
                  <div className="text-sm text-muted-foreground italic text-center py-4">
                    No milestones defined for this stage.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Guidance Panel */}
            <Card className="bg-amber-50/50 border-amber-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-amber-800 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Guidance & Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {guidance.length > 0 ? guidance.map(item => (
                  <div key={item.id} className="bg-white p-3 rounded-md border border-amber-100 shadow-sm">
                    <h4 className="text-sm font-medium text-amber-900 mb-1 flex items-center gap-2">
                      {item.title}
                      {item.priority === 'High' && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                    </h4>
                    <p className="text-xs text-amber-800/80 leading-relaxed">
                      {item.body}
                    </p>
                  </div>
                )) : (
                  <div className="text-sm text-amber-800/60 italic text-center py-2">
                    No specific guidance available.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  );
}
