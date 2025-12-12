import { useMemo } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  Flag, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Circle,
  Calendar as CalendarIcon,
  ChevronRight,
  ListTodo,
  Target,
  User,
  Loader2,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useRoute } from "wouter";
import { cn } from "@/lib/utils";
import { useMilestones, useMilestoneTaskLinks, useTasks, useUsers, useEpics, useProject } from "@/hooks/use-nexus-data";

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

export default function MilestoneOverview() {
  const [, params] = useRoute("/projects/:projectId/milestones/:milestoneId");
  const projectId = params?.projectId || "";
  const milestoneId = params?.milestoneId || "";

  const { data: project } = useProject(projectId);
  const { data: allMilestones, isLoading: isMilestonesLoading } = useMilestones();
  const { data: allTaskLinks, isLoading: isLinksLoading } = useMilestoneTaskLinks();
  const { data: allTasks, isLoading: isTasksLoading } = useTasks();
  const { data: users, isLoading: isUsersLoading } = useUsers();
  const { data: allEpics, isLoading: isEpicsLoading } = useEpics();

  const milestone = useMemo(() => 
    (allMilestones || []).find((m: any) => m.id === milestoneId),
    [allMilestones, milestoneId]
  );

  const linkedTasks = useMemo(() => {
    const links = (allTaskLinks || []).filter((l: any) => l.milestoneId === milestoneId);
    return links.map((link: any) => {
      const task = (allTasks || []).find((t: any) => t.id === link.taskId);
      return task;
    }).filter(Boolean);
  }, [allTaskLinks, allTasks, milestoneId]);

  const progress = useMemo(() => {
    if (linkedTasks.length === 0) return { done: 0, total: 0, percent: 0 };
    const done = linkedTasks.filter((t: any) => t.status === "Done").length;
    return { done, total: linkedTasks.length, percent: Math.round((done / linkedTasks.length) * 100) };
  }, [linkedTasks]);

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
      <Shell>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  if (!milestone) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Milestone not found</h2>
          <p className="text-muted-foreground mt-2">The milestone you're looking for doesn't exist.</p>
          <Link href={`/projects/${projectId}?tab=milestones`}>
            <Button className="mt-4">Back to Milestones</Button>
          </Link>
        </div>
      </Shell>
    );
  }

  const status = STATUS_CONFIG[milestone.status] || STATUS_CONFIG.planned;
  const StatusIcon = status.icon;
  const owner = getOwner(milestone.ownerId);

  return (
    <Shell>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className={cn("p-3 rounded-lg", status.bgColor, status.color)}>
              <Target className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">{milestone.name}</h1>
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
                <p className="text-muted-foreground">{milestone.description}</p>
              )}
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Target Date</p>
                    <p className="font-medium">{milestone.targetDate || "Not set"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Owner</p>
                    <p className="font-medium">{owner?.name || "Unassigned"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tasks</p>
                    <p className="font-medium">{progress.done} / {progress.total} completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Progress</p>
                    <p className="text-sm font-medium">{progress.percent}%</p>
                  </div>
                  <Progress value={progress.percent} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Linked Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                Linked Tasks ({linkedTasks.length})
              </CardTitle>
              <Button size="sm" variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Link Task
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {linkedTasks.length > 0 ? (
              <div className="space-y-3">
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
                          <div className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            task.status === "Done" ? "bg-green-500" :
                            task.status === "In Progress" ? "bg-blue-500" :
                            task.status === "Review" ? "bg-amber-500" :
                            "bg-slate-400"
                          )} />
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
              <div className="p-8 border border-dashed rounded-md text-center bg-muted/20">
                <ListTodo className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                <h3 className="font-medium mb-1">No tasks linked</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Link tasks to this milestone to track progress.
                </p>
                <Button size="sm" variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Link Task
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
