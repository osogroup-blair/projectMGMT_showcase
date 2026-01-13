import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Calendar
} from "lucide-react";
import { differenceInDays, parseISO, startOfWeek, endOfWeek, addWeeks, format } from "date-fns";
import type { PersonWorkload } from "./types";

interface TeamWorkloadSummaryProps {
  workloads: PersonWorkload[];
  tasks: any[];
}

export function TeamWorkloadSummary({ workloads, tasks }: TeamWorkloadSummaryProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const completedStatuses = ["Done", "Completed", "COMPLETED", "DONE"];
    
    const openTasks = tasks.filter(t => !completedStatuses.includes(t.status));
    const completedTasks = tasks.filter(t => completedStatuses.includes(t.status));
    
    const overdueTasks = openTasks.filter(t => {
      if (!t.deadline) return false;
      return differenceInDays(parseISO(t.deadline), now) < 0;
    });

    const thisWeekEnd = endOfWeek(now);
    const nextWeekEnd = endOfWeek(addWeeks(now, 1));
    
    const dueThisWeek = openTasks.filter(t => {
      if (!t.deadline) return false;
      const deadline = parseISO(t.deadline);
      return deadline <= thisWeekEnd && deadline >= now;
    });
    
    const dueNextWeek = openTasks.filter(t => {
      if (!t.deadline) return false;
      const deadline = parseISO(t.deadline);
      return deadline > thisWeekEnd && deadline <= nextWeekEnd;
    });

    const atRiskMembers = workloads.filter(w => w.status === "at-risk" || w.status === "off-track");
    const onTrackMembers = workloads.filter(w => w.status === "on-track");

    return {
      totalTasks: tasks.length,
      openTasks: openTasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      dueThisWeek: dueThisWeek.length,
      dueNextWeek: dueNextWeek.length,
      atRiskMembers: atRiskMembers.length,
      onTrackMembers: onTrackMembers.length,
      totalMembers: workloads.length,
      completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
    };
  }, [workloads, tasks]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6" data-testid="team-workload-summary">
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
              <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs text-muted-foreground">Open Tasks</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{stats.openTasks}</span>
            <span className="text-xs text-muted-foreground">of {stats.totalTasks}</span>
          </div>
          <div className="mt-1">
            <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
              {stats.completionRate}% complete
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/30">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="text-xs text-muted-foreground">Upcoming</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{stats.dueThisWeek}</span>
            <span className="text-xs text-muted-foreground">this week</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {stats.dueNextWeek} due next week
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-xs text-muted-foreground">At Risk</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{stats.overdueTasks}</span>
            <span className="text-xs text-muted-foreground">overdue</span>
          </div>
          {stats.atRiskMembers > 0 && (
            <div className="mt-1">
              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                {stats.atRiskMembers} member{stats.atRiskMembers !== 1 ? "s" : ""} at risk
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/30">
              <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs text-muted-foreground">Team Health</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{stats.onTrackMembers}</span>
            <span className="text-xs text-muted-foreground">on track</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            of {stats.totalMembers} member{stats.totalMembers !== 1 ? "s" : ""}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
