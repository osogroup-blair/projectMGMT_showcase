import { useState } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Clock, 
  MoreHorizontal,
  Plus,
  Filter,
  Layers,
  Package,
  User as UserIcon
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRoute, Link } from "wouter";
import { 
  PROJECTS, 
  DELIVERABLES, 
  EPICS, 
  TASKS, 
  PROJECT_STAGES, 
  TEAM 
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function EpicDetail() {
  const [match, params] = useRoute("/projects/:projectId/epics/:epicId");
  const projectId = params?.projectId || "1";
  const epicId = params?.epicId || "e1";

  const project = PROJECTS.find(p => p.id === projectId) || PROJECTS[0];
  const epic = EPICS.find(e => e.id === epicId) || EPICS[0];
  const deliverable = DELIVERABLES.find(d => d.id === epic.deliverableId);
  const tasks = TASKS.filter(t => t.epicId === epicId);
  const owner = TEAM.find(t => t.id === epic.ownerId);

  const getAssignee = (id?: string) => TEAM.find(u => u.id === id);

  return (
    <Shell>
      <div className="mx-auto max-w-7xl h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 shrink-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={`/projects/${projectId}/deliverables`} className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Deliverables
            </Link>
            <span className="text-border">/</span>
            <span>{deliverable?.title}</span>
            <span className="text-border">/</span>
            <span className="text-foreground font-medium">{epic.title}</span>
          </div>

          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-primary">{epic.title}</h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {epic.startDate} - {epic.endDate}
                    </span>
                    <span>•</span>
                    <Badge variant="outline" className={cn(
                      "font-normal text-xs",
                      epic.status === "In Progress" ? "bg-blue-50 text-blue-700 border-blue-200" :
                      epic.status === "Completed" ? "bg-green-50 text-green-700 border-green-200" :
                      "bg-slate-50 text-slate-700 border-slate-200"
                    )}>
                      {epic.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter Tasks
              </Button>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="text-muted-foreground max-w-3xl">
            {epic.description}
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
            <Card className="bg-muted/20 border-none shadow-none">
              <CardContent className="p-3 flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{owner?.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-xs text-muted-foreground">Owner</div>
                  <div className="text-sm font-medium">{owner?.name}</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/20 border-none shadow-none">
              <CardContent className="p-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{epic.progress}%</span>
                </div>
                <Progress value={epic.progress} className="h-2" />
              </CardContent>
            </Card>
            <Card className="bg-muted/20 border-none shadow-none">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Total Tasks</div>
                  <div className="text-lg font-bold">{tasks.length}</div>
                </div>
                <div className="h-8 w-8 bg-background rounded-full flex items-center justify-center text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-muted/20 border-none shadow-none">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Est. Hours</div>
                  <div className="text-lg font-bold">
                    {tasks.reduce((acc, t) => acc + (t.estimateHours || 0), 0)}h
                  </div>
                </div>
                <div className="h-8 w-8 bg-background rounded-full flex items-center justify-center text-muted-foreground">
                  <Clock className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tasks grouped by Stage */}
        <div className="flex-1 min-h-0 border rounded-lg bg-muted/5 overflow-hidden flex flex-col">
          <div className="p-3 border-b bg-background font-medium text-sm flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            Tasks by Stage
          </div>
          <ScrollArea className="flex-1 p-6">
            <div className="flex gap-6 min-w-max pb-4">
              {PROJECT_STAGES.map((stage) => {
                const stageTasks = tasks.filter(t => t.stageId === stage.id);
                
                return (
                  <div key={stage.id} className="w-[320px] shrink-0 flex flex-col gap-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border",
                        stage.status === 'completed' ? "bg-primary text-primary-foreground border-primary" :
                        stage.status === 'active' ? "bg-background text-primary border-primary" :
                        "bg-muted text-muted-foreground border-transparent"
                      )}>
                        {stage.order}
                      </div>
                      <h3 className="font-semibold text-sm">{stage.name}</h3>
                      <Badge variant="secondary" className="ml-auto text-[10px] h-5">
                        {stageTasks.length}
                      </Badge>
                    </div>

                    <div className="flex flex-col gap-3">
                      {stageTasks.length > 0 ? (
                        stageTasks.map(task => {
                          const assignee = getAssignee(task.assigneeId);
                          return (
                            <Card key={task.id} className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                              <CardContent className="p-3 space-y-3">
                                <div className="space-y-1">
                                  <div className="flex justify-between items-start gap-2">
                                    <Link href={`/projects/${projectId}/tasks/${task.id}`}>
                                      <h4 className="text-sm font-medium hover:text-primary leading-tight hover:underline decoration-primary/30 underline-offset-2 line-clamp-2">
                                        {task.title}
                                      </h4>
                                    </Link>
                                    <Badge variant={
                                      task.priority === "High" ? "destructive" : 
                                      task.priority === "Medium" ? "default" : "secondary"
                                    } className="text-[10px] h-5 px-1.5 shrink-0">
                                      {task.priority}
                                    </Badge>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {task.tags?.map(tag => (
                                      <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between pt-1 border-t border-dashed mt-2">
                                  <div className="flex items-center gap-2">
                                    {assignee ? (
                                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Avatar className="h-5 w-5 border border-background">
                                          <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                            {assignee.name.substring(0, 2).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="truncate max-w-[80px]">{assignee.name.split(' ')[0]}</span>
                                      </div>
                                    ) : (
                                      <div className="text-xs text-muted-foreground italic">Unassigned</div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {task.estimateHours && (
                                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {task.estimateHours}h
                                      </span>
                                    )}
                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-muted-foreground/20">
                                      {task.status}
                                    </Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      ) : (
                        <div className="h-24 rounded-lg border border-dashed flex flex-col items-center justify-center text-muted-foreground/50 text-xs bg-muted/10">
                          <span>No tasks in this stage</span>
                          <Button variant="link" size="sm" className="h-auto p-0 text-primary opacity-50 hover:opacity-100">
                            + Add Task
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </Shell>
  );
}
