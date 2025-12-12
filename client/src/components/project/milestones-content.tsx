import { useMemo } from "react";
import { 
  Flag, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Circle,
  Calendar as CalendarIcon,
  ChevronRight,
  ListTodo
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useMilestones, useMilestoneTaskLinks, useTasks, useUsers, useEpics } from "@/hooks/use-nexus-data";
import { Loader2 } from "lucide-react";

const STATUS_CONFIG: Record<string, { icon: typeof Circle; color: string; bgColor: string; label: string }> = {
  "planned": { icon: Circle, color: "text-slate-500", bgColor: "bg-slate-100", label: "Planned" },
  "in_progress": { icon: Clock, color: "text-blue-500", bgColor: "bg-blue-100", label: "In Progress" },
  "achieved": { icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-100", label: "Achieved" },
  "slipped": { icon: AlertCircle, color: "text-red-500", bgColor: "bg-red-100", label: "Slipped" },
  "cancelled": { icon: Flag, color: "text-slate-400", bgColor: "bg-slate-100", label: "Cancelled" },
  "Pending": { icon: Circle, color: "text-slate-500", bgColor: "bg-slate-100", label: "Planned" },
  "In Progress": { icon: Clock, color: "text-blue-500", bgColor: "bg-blue-100", label: "In Progress" },
  "Completed": { icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-100", label: "Achieved" },
  "Blocked": { icon: AlertCircle, color: "text-red-500", bgColor: "bg-red-100", label: "Blocked" },
};

const PRIORITY_CONFIG: Record<string, string> = {
  "Low": "bg-slate-50 text-slate-700 border-slate-200",
  "Medium": "bg-blue-50 text-blue-700 border-blue-200",
  "High": "bg-orange-50 text-orange-700 border-orange-200",
  "Critical": "bg-red-50 text-red-700 border-red-200",
};

export function MilestonesContent({ projectId }: { projectId: string }) {
  const { data: allMilestones, isLoading: isMilestonesLoading } = useMilestones();
  const { data: allTaskLinks, isLoading: isLinksLoading } = useMilestoneTaskLinks();
  const { data: allTasks, isLoading: isTasksLoading } = useTasks();
  const { data: users, isLoading: isUsersLoading } = useUsers();
  const { data: allEpics, isLoading: isEpicsLoading } = useEpics();

  const milestones = useMemo(() => 
    (allMilestones || []).filter((m: any) => m.projectId === projectId),
    [allMilestones, projectId]
  );

  const getTasksForMilestone = (milestoneId: string) => {
    const links = (allTaskLinks || []).filter((l: any) => l.milestoneId === milestoneId);
    return links.map((link: any) => {
      const task = (allTasks || []).find((t: any) => t.id === link.taskId);
      return task;
    }).filter(Boolean);
  };

  const getMilestoneProgress = (milestoneId: string) => {
    const tasks = getTasksForMilestone(milestoneId);
    if (tasks.length === 0) return { done: 0, total: 0, percent: 0 };
    const done = tasks.filter((t: any) => t.status === "Done").length;
    return { done, total: tasks.length, percent: Math.round((done / tasks.length) * 100) };
  };

  const getOwner = (ownerId?: string) => {
    if (!ownerId) return null;
    return (users || []).find((u: any) => u.id === ownerId);
  };

  const getEpic = (epicId?: string) => {
    if (!epicId) return null;
    return (allEpics || []).find((e: any) => e.id === epicId);
  };

  const getAssignee = (assigneeId?: string) => {
    if (!assigneeId) return null;
    return (users || []).find((u: any) => u.id === assigneeId);
  };

  const isLoading = isMilestonesLoading || isLinksLoading || isTasksLoading || isUsersLoading || isEpicsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Milestones</h2>
          <p className="text-sm text-muted-foreground">Track key project milestones and their associated tasks.</p>
        </div>
      </div>

      <div className="space-y-6">
        {milestones.length === 0 ? (
          <Card className="bg-muted/10 border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Flag className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No milestones defined</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
                Milestones help track key project deliverables and deadlines.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" defaultValue={milestones.map((m: any) => m.id)} className="space-y-4">
            {milestones.map((milestone: any) => {
              const status = STATUS_CONFIG[milestone.status] || STATUS_CONFIG.planned;
              const StatusIcon = status.icon;
              const owner = getOwner(milestone.ownerId);
              const progress = getMilestoneProgress(milestone.id);
              const linkedTasks = getTasksForMilestone(milestone.id);

              return (
                <AccordionItem 
                  key={milestone.id} 
                  value={milestone.id} 
                  className="border rounded-lg bg-card px-4" 
                  data-testid={`accordion-milestone-${milestone.id}`}
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-start gap-4 text-left w-full">
                      <div className={cn("p-2 rounded-lg mt-1", status.bgColor, status.color)}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-3">
                          <Link 
                            href={`/projects/${projectId}/milestones/${milestone.id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <h3 className="text-lg font-semibold hover:text-primary hover:underline decoration-primary/30 underline-offset-2 transition-colors">
                              {milestone.name}
                            </h3>
                          </Link>
                          <Badge variant="outline" className={cn(
                            "font-normal",
                            milestone.status === "achieved" || milestone.status === "Completed" 
                              ? "bg-green-50 text-green-700 border-green-200" 
                              : milestone.status === "in_progress" || milestone.status === "In Progress"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : milestone.status === "slipped" || milestone.status === "Blocked"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-slate-50 text-slate-700 border-slate-200"
                          )}>
                            {status.label}
                          </Badge>
                        </div>
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground">{milestone.description}</p>
                        )}
                        <div className="flex items-center gap-6 pt-2 text-xs text-muted-foreground">
                          {owner && (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[9px]">{owner.name?.charAt(0) || "?"}</AvatarFallback>
                              </Avatar>
                              <span>Owner: {owner.name || "Unassigned"}</span>
                            </div>
                          )}
                          {milestone.targetDate && (
                            <div className="flex items-center gap-1.5">
                              <CalendarIcon className="h-3.5 w-3.5" />
                              <span>Target: {milestone.targetDate}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{progress.done}/{progress.total} Tasks</span>
                          </div>
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <Progress value={progress.percent} className="h-1.5 w-16" />
                            <span>{progress.percent}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="pt-0 pb-4 pl-[3.25rem]">
                    <div className="space-y-3 mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Linked Tasks ({linkedTasks.length})
                        </span>
                      </div>
                      {linkedTasks.length > 0 ? (
                        <div className="grid gap-3">
                          {linkedTasks.map((task: any) => {
                            const epic = getEpic(task.epicId);
                            const assignee = getAssignee(task.assigneeId);
                            const priorityClass = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
                            
                            return (
                              <Link key={task.id} href={`/projects/${projectId}/tasks/${task.id}`}>
                                <div 
                                  className="group flex items-center justify-between p-3 rounded-md border bg-background hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
                                  data-testid={`milestone-task-${task.id}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-primary/10 text-primary rounded">
                                      <ListTodo className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <h4 className="font-medium group-hover:text-primary transition-colors">{task.title}</h4>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        {epic && <span>{epic.title}</span>}
                                        {task.stageId && (
                                          <span className="px-1.5 py-0.5 rounded bg-muted">
                                            {task.stageId}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <Badge variant="outline" className={cn("font-normal text-xs", priorityClass)}>
                                      {task.priority}
                                    </Badge>
                                    <Badge 
                                      variant="secondary" 
                                      className={cn(
                                        "font-normal text-xs",
                                        task.status === "Done" ? "bg-green-100 text-green-700" :
                                        task.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                                        "bg-slate-100 text-slate-700"
                                      )}
                                    >
                                      {task.status}
                                    </Badge>
                                    {assignee && (
                                      <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-[9px]">
                                          {assignee.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                        </AvatarFallback>
                                      </Avatar>
                                    )}
                                    <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-6 border border-dashed rounded-md text-center bg-muted/20">
                          <ListTodo className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No tasks linked to this milestone yet.
                          </p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </>
  );
}
