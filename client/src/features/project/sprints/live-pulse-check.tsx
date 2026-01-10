import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users,
  Zap,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { differenceInDays, parseISO, isAfter } from "date-fns";

interface Task {
  id: string;
  title: string;
  status: string;
  assigneeId?: string;
  deadline?: string;
  blocked?: boolean;
  effort?: number;
  updatedAt?: string;
}

interface Sprint {
  id: string;
  name: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

interface User {
  id: string;
  name: string;
}

interface LivePulseCheckProps {
  sprint: Sprint;
  tasks: Task[];
  users: User[];
}

export function LivePulseCheck({ sprint, tasks, users }: LivePulseCheckProps) {
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => 
      ["Done", "Completed", "Closed"].includes(t.status)
    ).length;
    const inProgress = tasks.filter(t => 
      ["In Progress", "Active", "Review", "In Review"].includes(t.status)
    ).length;
    const blocked = tasks.filter(t => t.blocked || t.status === "Blocked").length;
    const notStarted = total - completed - inProgress - blocked;
    
    const overdue = tasks.filter(t => {
      if (!t.deadline) return false;
      return isAfter(new Date(), parseISO(t.deadline)) && 
             !["Done", "Completed", "Closed"].includes(t.status);
    }).length;

    const totalEffort = tasks.reduce((sum, t) => sum + (t.effort || 1), 0);
    const completedEffort = tasks
      .filter(t => ["Done", "Completed", "Closed"].includes(t.status))
      .reduce((sum, t) => sum + (t.effort || 1), 0);

    const assigneeIds = new Set(tasks.map(t => t.assigneeId).filter(Boolean));
    const activeContributors = assigneeIds.size;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const velocityRate = totalEffort > 0 ? Math.round((completedEffort / totalEffort) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      blocked,
      notStarted,
      overdue,
      completionRate,
      velocityRate,
      activeContributors,
      totalEffort,
      completedEffort
    };
  }, [tasks]);

  const sprintHealth = useMemo(() => {
    if (!sprint.startDate || !sprint.endDate) return { status: "unknown", message: "Dates not set" };
    
    const now = new Date();
    const start = parseISO(sprint.startDate);
    const end = parseISO(sprint.endDate);
    const totalDays = differenceInDays(end, start);
    const elapsedDays = differenceInDays(now, start);
    const timeProgress = totalDays > 0 ? Math.min(100, Math.round((elapsedDays / totalDays) * 100)) : 0;
    
    const expectedCompletion = timeProgress;
    const actualCompletion = metrics.completionRate;
    const gap = actualCompletion - expectedCompletion;

    if (metrics.blocked > 0 && metrics.blocked >= metrics.total * 0.2) {
      return { status: "critical", message: "Multiple blockers detected", color: "text-red-600", bg: "bg-red-50" };
    }
    if (gap >= 10) {
      return { status: "ahead", message: "Ahead of schedule", color: "text-green-600", bg: "bg-green-50" };
    }
    if (gap >= -10) {
      return { status: "on-track", message: "On track", color: "text-blue-600", bg: "bg-blue-50" };
    }
    if (gap >= -25) {
      return { status: "at-risk", message: "Slightly behind", color: "text-amber-600", bg: "bg-amber-50" };
    }
    return { status: "behind", message: "Behind schedule", color: "text-red-600", bg: "bg-red-50" };
  }, [sprint, metrics]);

  const daysRemaining = useMemo(() => {
    if (!sprint.endDate) return null;
    return Math.max(0, differenceInDays(parseISO(sprint.endDate), new Date()));
  }, [sprint.endDate]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Live Pulse Check</h3>
        </div>
        <Badge className={cn("gap-1", sprintHealth.bg, sprintHealth.color)} variant="outline">
          {sprintHealth.status === "ahead" && <TrendingUp className="h-3 w-3" />}
          {sprintHealth.status === "behind" && <TrendingDown className="h-3 w-3" />}
          {sprintHealth.status === "critical" && <AlertTriangle className="h-3 w-3" />}
          {sprintHealth.message}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Completion</span>
              <Target className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{metrics.completionRate}%</div>
            <Progress value={metrics.completionRate} className="h-1.5 mt-2" />
            <p className="text-[10px] text-muted-foreground mt-1">
              {metrics.completed} of {metrics.total} tasks
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Velocity</span>
              <Zap className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">{metrics.velocityRate}%</div>
            <Progress value={metrics.velocityRate} className="h-1.5 mt-2 [&>div]:bg-green-500" />
            <p className="text-[10px] text-muted-foreground mt-1">
              {metrics.completedEffort} of {metrics.totalEffort} effort pts
            </p>
          </CardContent>
        </Card>

        <Card className={cn(
          "bg-gradient-to-br border",
          metrics.blocked > 0 ? "from-amber-50 to-white border-amber-200" : "from-slate-50 to-white border-slate-100"
        )}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Blockers</span>
              <AlertTriangle className={cn("h-4 w-4", metrics.blocked > 0 ? "text-amber-500" : "text-slate-400")} />
            </div>
            <div className={cn("text-2xl font-bold", metrics.blocked > 0 ? "text-amber-600" : "text-slate-600")}>
              {metrics.blocked}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              {metrics.overdue > 0 ? `${metrics.overdue} overdue` : "No overdue tasks"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Time Left</span>
              <Clock className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {daysRemaining !== null ? `${daysRemaining}d` : "—"}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">
              <Users className="h-3 w-3 inline mr-1" />
              {metrics.activeContributors} contributors
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Done: {metrics.completed}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>In Progress: {metrics.inProgress}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Blocked: {metrics.blocked}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-slate-300" />
          <span>Not Started: {metrics.notStarted}</span>
        </div>
      </div>
    </div>
  );
}
