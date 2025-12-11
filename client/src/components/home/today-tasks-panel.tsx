import { HomeTask } from "@/types/home";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCard } from "./task-card";
import { Filter, CheckSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TodayTasksPanelProps {
  tasks: HomeTask[];
}

export function TodayTasksPanel({ tasks }: TodayTasksPanelProps) {
  const overdueTasks = tasks.filter(t => t.isOverdue);
  const activeTasks = tasks.filter(t => !t.isOverdue && t.status !== "complete");

  // Group active tasks by duration bucket
  const groupedTasks = {
    deep_work: activeTasks.filter(t => t.durationBucket === "deep_work"),
    medium: activeTasks.filter(t => t.durationBucket === "medium"),
    small: activeTasks.filter(t => t.durationBucket === "small"),
    quick_win: activeTasks.filter(t => t.durationBucket === "quick_win"),
    uncategorized: activeTasks.filter(t => !t.durationBucket),
  };

  const hasActiveTasks = activeTasks.length > 0;

  const renderTaskGroup = (title: string, groupTasks: HomeTask[], icon?: React.ReactNode) => {
    if (groupTasks.length === 0) return null;
    return (
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          {icon}
          {title} <span className="text-muted-foreground/60">({groupTasks.length})</span>
        </h3>
        <div className="space-y-3">
          {groupTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-4 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-primary" />
          Today's Focus
          <Badge variant="secondary" className="ml-2 rounded-full px-2">
            {tasks.length}
          </Badge>
        </CardTitle>
        <Button variant="ghost" size="sm" className="h-8 gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        {overdueTasks.length > 0 && (
           <div className="space-y-2 mb-6">
             <h3 className="text-xs font-semibold text-red-600 uppercase tracking-wider flex items-center gap-2">
               Overdue ({overdueTasks.length})
             </h3>
             <div className="space-y-3">
               {overdueTasks.map(task => (
                 <TaskCard key={task.id} task={task} />
               ))}
             </div>
           </div>
        )}

        {!hasActiveTasks && overdueTasks.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground text-sm">No tasks scheduled for today.</p>
            <Button variant="link" className="mt-2 text-primary">Browse Backlog</Button>
          </div>
        )}

        {hasActiveTasks && (
          <div className="space-y-6">
            {renderTaskGroup("Deep Work (4h+)", groupedTasks.deep_work, <Clock className="w-3 h-3" />)}
            {renderTaskGroup("Medium Effort (2-3h)", groupedTasks.medium, <Clock className="w-3 h-3" />)}
            {renderTaskGroup("Small Tasks (~1h)", groupedTasks.small, <Clock className="w-3 h-3" />)}
            {renderTaskGroup("Quick Wins (<30m)", groupedTasks.quick_win, <Clock className="w-3 h-3" />)}
            {renderTaskGroup("Uncategorized", groupedTasks.uncategorized)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
