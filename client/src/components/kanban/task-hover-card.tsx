import { Link } from "wouter";
import { format, parseISO, differenceInDays } from "date-fns";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ExternalLink,
  Calendar,
  Clock,
  AlertTriangle,
  Folder,
  Layers,
  Target,
  User,
  Flag,
  Hash,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface EnrichedTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  effort?: number;
  estimateHours?: number;
  assigneeId?: string;
  assigneeName?: string;
  deadline?: string;
  blocked?: boolean;
  blockerReason?: string;
  projectId: string;
  projectName?: string;
  epicId?: string;
  epicName?: string;
  deliverableId?: string;
  deliverableName?: string;
  sprintId?: string;
  sprintName?: string;
  milestoneId?: string;
  milestoneName?: string;
  stageId?: string;
  stageName?: string;
  tags?: string[];
  updatedAt?: string;
}

interface StatusOption {
  id: string;
  label: string;
  color?: string;
}

interface Sprint {
  id: string;
  name: string;
}

interface TaskHoverCardProps {
  task: EnrichedTask;
  children: React.ReactNode;
  statusOptions?: StatusOption[];
  sprints?: Sprint[];
  onStatusChange?: (taskId: string, newStatus: string) => void;
  onBlockedToggle?: (taskId: string, blocked: boolean, reason?: string) => void;
  onSprintChange?: (taskId: string, sprintId: string | null) => void;
  disabled?: boolean;
}

export function TaskHoverCard({
  task,
  children,
  statusOptions = [],
  sprints = [],
  onStatusChange,
  onBlockedToggle,
  onSprintChange,
  disabled = false,
}: TaskHoverCardProps) {
  const dueDate = task.deadline ? parseISO(task.deadline) : null;
  const daysUntilDue = dueDate ? differenceInDays(dueDate, new Date()) : null;
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0 && task.status !== "Done";

  const priorityColors: Record<string, string> = {
    critical: "text-red-600 bg-red-50",
    urgent: "text-red-600 bg-red-50",
    high: "text-orange-600 bg-orange-50",
    medium: "text-blue-600 bg-blue-50",
    low: "text-slate-600 bg-slate-50",
  };

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-80 p-0" side="right" align="start">
        <div className="p-4 space-y-3">
          <div>
            <h4 className="font-semibold text-sm line-clamp-2">{task.title}</h4>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {task.blocked && (
              <Badge variant="destructive" className="text-[10px] gap-1">
                <AlertTriangle className="h-3 w-3" />
                Blocked
              </Badge>
            )}
            {isOverdue && (
              <Badge variant="destructive" className="text-[10px]">
                {Math.abs(daysUntilDue!)} days overdue
              </Badge>
            )}
            {task.priority && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] capitalize border-0",
                  priorityColors[task.priority.toLowerCase()]
                )}
              >
                <Flag className="h-3 w-3 mr-1" />
                {task.priority}
              </Badge>
            )}
            {task.effort && (
              <Badge variant="outline" className="text-[10px]">
                <Hash className="h-3 w-3 mr-1" />
                {task.effort} pts
              </Badge>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-2 text-xs">
            {task.projectName && (
              <div className="flex items-start gap-1.5">
                <Folder className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <span className="text-muted-foreground">Project</span>
                  <p className="font-medium truncate">{task.projectName}</p>
                </div>
              </div>
            )}
            {task.epicName && (
              <div className="flex items-start gap-1.5">
                <Layers className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <span className="text-muted-foreground">Epic</span>
                  <p className="font-medium truncate">{task.epicName}</p>
                </div>
              </div>
            )}
            {task.deliverableName && (
              <div className="flex items-start gap-1.5">
                <Target className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <span className="text-muted-foreground">Deliverable</span>
                  <p className="font-medium truncate">{task.deliverableName}</p>
                </div>
              </div>
            )}
            {task.sprintName && (
              <div className="flex items-start gap-1.5">
                <Clock className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <span className="text-muted-foreground">Sprint</span>
                  <p className="font-medium truncate">{task.sprintName}</p>
                </div>
              </div>
            )}
            {task.assigneeName && (
              <div className="flex items-start gap-1.5">
                <User className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <span className="text-muted-foreground">Assignee</span>
                  <p className="font-medium truncate">{task.assigneeName}</p>
                </div>
              </div>
            )}
            {dueDate && (
              <div className="flex items-start gap-1.5">
                <Calendar className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <span className="text-muted-foreground">Due Date</span>
                  <p className={cn("font-medium", isOverdue && "text-red-600")}>
                    {format(dueDate, "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {task.blocked && task.blockerReason && (
            <>
              <Separator />
              <div className="text-xs">
                <span className="text-muted-foreground">Blocker Reason:</span>
                <p className="text-amber-600 mt-0.5">{task.blockerReason}</p>
              </div>
            </>
          )}

          {!disabled && (statusOptions.length > 0 || sprints.length > 0 || onBlockedToggle) && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Quick Actions
                </p>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.length > 0 && onStatusChange && (
                    <Select
                      value={task.status}
                      onValueChange={(value) => onStatusChange(task.id, value)}
                    >
                      <SelectTrigger className="h-7 text-xs w-auto min-w-[100px]" data-testid={`hover-status-select-${task.id}`}>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.id} value={opt.label} className="text-xs">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {onBlockedToggle && (
                    <Button
                      variant={task.blocked ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => onBlockedToggle(task.id, !task.blocked)}
                      data-testid={`hover-toggle-blocked-${task.id}`}
                    >
                      {task.blocked ? (
                        <>
                          <ShieldCheck className="h-3 w-3" />
                          Unblock
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="h-3 w-3" />
                          Block
                        </>
                      )}
                    </Button>
                  )}

                  {sprints.length > 0 && onSprintChange && (
                    <Select
                      value={task.sprintId || "none"}
                      onValueChange={(value) =>
                        onSprintChange(task.id, value === "none" ? null : value)
                      }
                    >
                      <SelectTrigger className="h-7 text-xs w-auto min-w-[100px]" data-testid={`hover-sprint-select-${task.id}`}>
                        <SelectValue placeholder="Sprint" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-xs">
                          No Sprint
                        </SelectItem>
                        {sprints.map((sprint) => (
                          <SelectItem key={sprint.id} value={sprint.id} className="text-xs">
                            {sprint.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="border-t px-4 py-2 bg-muted/30">
          <Link href={`/projects/${task.projectId}/tasks/${task.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-xs gap-1.5 justify-center"
              data-testid={`hover-view-details-${task.id}`}
            >
              <ExternalLink className="h-3 w-3" />
              View Full Details
            </Button>
          </Link>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
