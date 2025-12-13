import { useMemo, useState } from "react";
import { 
  Layers,
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Circle,
  ChevronRight,
  ListTodo,
  ArrowRight,
  ExternalLink
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
import { useTasks, useUsers, useEpics } from "@/hooks/use-nexus-data";
import { PROJECT_STAGES, STAGE_STATUS_OPTIONS } from "@/lib/mock-data";
import { Loader2 } from "lucide-react";

const PRIORITY_CONFIG: Record<string, string> = {
  "Low": "bg-slate-50 text-slate-700 border-slate-200",
  "Medium": "bg-blue-50 text-blue-700 border-blue-200",
  "High": "bg-orange-50 text-orange-700 border-orange-200",
  "Critical": "bg-red-50 text-red-700 border-red-200",
};

export function StagesContent({ projectId }: { projectId: string }) {
  const { data: allTasks, isLoading: isTasksLoading } = useTasks();
  const { data: users, isLoading: isUsersLoading } = useUsers();
  const { data: allEpics, isLoading: isEpicsLoading } = useEpics();

  const stages = PROJECT_STAGES;

  const getTasksForStage = (stageId: string) => {
    if (!allTasks) return [];
    return allTasks.filter((t: any) => t.stageId === stageId && t.projectId === projectId);
  };

  const getStageProgress = (stageId: string) => {
    const tasks = getTasksForStage(stageId);
    if (tasks.length === 0) return { done: 0, total: 0, percent: 0 };
    const done = tasks.filter((t: any) => t.status === "Done").length;
    return { done, total: tasks.length, percent: Math.round((done / tasks.length) * 100) };
  };

  const getEpic = (epicId?: string) => {
    if (!epicId) return null;
    return (allEpics || []).find((e: any) => e.id === epicId);
  };

  const getAssignee = (assigneeId?: string) => {
    if (!assigneeId) return null;
    return (users || []).find((u: any) => u.id === assigneeId);
  };

  const isLoading = isTasksLoading || isUsersLoading || isEpicsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight">Stages</h2>
        <p className="text-sm text-muted-foreground">View project stages and their associated tasks.</p>
      </div>

      <div className="space-y-6">
        <Accordion type="multiple" defaultValue={stages.map((s: any) => s.id)} className="space-y-4">
          {stages.map((stage: any) => {
            const statusConfig = STAGE_STATUS_OPTIONS.find(s => s.label === stage.status);
            const statusColorClass = statusConfig?.color || "bg-muted/50 text-muted-foreground border-muted";
            const progress = getStageProgress(stage.id);
            const stageTasks = getTasksForStage(stage.id);

            return (
              <AccordionItem 
                key={stage.id} 
                value={stage.id} 
                className="border rounded-lg bg-card px-4 relative" 
                data-testid={`accordion-stage-${stage.id}`}
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-start gap-4 text-left w-full">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold mt-1",
                      statusColorClass
                    )}>
                      {stage.order}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{stage.name}</h3>
                        <Badge variant="outline" className={cn("font-normal", statusColorClass)}>
                          {stage.status}
                        </Badge>
                      </div>
                      {stage.description && (
                        <p className="text-sm text-muted-foreground">{stage.description}</p>
                      )}
                      <div className="flex items-center gap-6 pt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <ListTodo className="h-3.5 w-3.5" />
                          <span>{progress.total} Tasks</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{progress.done} Completed</span>
                        </div>
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Progress value={progress.percent} className="h-1.5 w-16" />
                          <span>{progress.percent}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>

                <div className="absolute right-12 top-4">
                  <Link href={`/projects/${projectId}/stages/${stage.id}`}>
                    <Button variant="outline" size="sm" className="gap-2" data-testid={`open-workspace-${stage.id}`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Workspace
                    </Button>
                  </Link>
                </div>

                <AccordionContent className="pt-0 pb-4 pl-14">
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Tasks ({stageTasks.length})
                      </span>
                    </div>
                    {stageTasks.length > 0 ? (
                      <div className="grid gap-3">
                        {stageTasks.map((task: any) => {
                          const epic = getEpic(task.epicId);
                          const assignee = getAssignee(task.assigneeId);
                          const priorityClass = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
                          
                          return (
                            <Link key={task.id} href={`/projects/${projectId}/tasks/${task.id}`}>
                              <div 
                                className="group flex items-center justify-between p-3 rounded-md border bg-background hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
                                data-testid={`stage-task-${task.id}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-1.5 bg-primary/10 text-primary rounded">
                                    <ListTodo className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium group-hover:text-primary transition-colors">{task.title}</h4>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      {epic && <span>{epic.title}</span>}
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
                                      task.status === "Review" ? "bg-amber-100 text-amber-700" :
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
                          No tasks in this stage yet.
                        </p>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </>
  );
}
