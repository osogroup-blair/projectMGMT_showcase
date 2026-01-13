import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ChevronRight, Calendar, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInDays } from "date-fns";
import type { TaskWithContext } from "./types";

interface TaskListItemProps {
  task: TaskWithContext;
  projectId: string;
  showScopeBreadcrumb?: boolean;
  compact?: boolean;
}

export function TaskListItem({ task, projectId, showScopeBreadcrumb = true, compact = false }: TaskListItemProps) {
  const isOverdue = task.deadline && differenceInDays(parseISO(task.deadline), new Date()) < 0;
  const isDueSoon = task.deadline && !isOverdue && differenceInDays(parseISO(task.deadline), new Date()) <= 3;
  
  const priorityColors: Record<string, string> = {
    Critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    High: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    Medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    Low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };

  const statusColors: Record<string, string> = {
    "Done": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    "Completed": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    "In Progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "IN_PROGRESS": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "Blocked": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    "BLOCKED": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const scopeBreadcrumb = [];
  if (task.deliverableName) scopeBreadcrumb.push(task.deliverableName);
  if (task.milestoneName) scopeBreadcrumb.push(task.milestoneName);
  if (task.sprintName) scopeBreadcrumb.push(task.sprintName);

  return (
    <Link href={`/projects/${projectId}/tasks/${task.id}`}>
      <div 
        className={cn(
          "group flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer",
          task.blocked && "border-amber-300 dark:border-amber-700",
          compact && "p-2"
        )}
        data-testid={`task-item-${task.id}`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {task.blocked && (
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            )}
            <span className={cn("font-medium truncate", compact ? "text-sm" : "text-sm")}>
              {task.title}
            </span>
          </div>
          
          {showScopeBreadcrumb && scopeBreadcrumb.length > 0 && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              {scopeBreadcrumb.map((item, index) => (
                <span key={index} className="flex items-center gap-1">
                  {index > 0 && <ChevronRight className="h-3 w-3" />}
                  <span className="truncate max-w-[120px]">{item}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {task.deadline && (
            <div className={cn(
              "flex items-center gap-1 text-xs",
              isOverdue && "text-red-600 font-medium",
              isDueSoon && !isOverdue && "text-amber-600"
            )}>
              <Calendar className="h-3 w-3" />
              {format(parseISO(task.deadline), "MMM d")}
            </div>
          )}
          
          <Badge 
            variant="outline" 
            className={cn("text-xs capitalize", statusColors[task.status] || "")}
          >
            {task.status.replace(/_/g, " ")}
          </Badge>
          
          {task.priority && (
            <Badge 
              variant="outline"
              className={cn("text-xs", priorityColors[task.priority] || "")}
            >
              {task.priority}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
