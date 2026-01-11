import { Link } from "wouter";
import { format, parseISO, differenceInDays } from "date-fns";
import { useState } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ExternalLink,
  Calendar as CalendarIcon,
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
  MessageSquarePlus,
  Send,
  ChevronRight,
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

interface TaskHoverCardProps {
  task: EnrichedTask;
  children: React.ReactNode;
  statusOptions?: StatusOption[];
  onStatusChange?: (taskId: string, newStatus: string) => void;
  onBlockedToggle?: (taskId: string, blocked: boolean, reason?: string) => void;
  onDueDateChange?: (taskId: string, date: Date | null) => void;
  onAddComment?: (taskId: string, comment: string) => void;
  disabled?: boolean;
}

export function TaskHoverCard({
  task,
  children,
  statusOptions = [],
  onStatusChange,
  onBlockedToggle,
  onDueDateChange,
  onAddComment,
  disabled = false,
}: TaskHoverCardProps) {
  const [commentText, setCommentText] = useState("");
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

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

  const handleSubmitComment = () => {
    if (commentText.trim() && onAddComment) {
      onAddComment(task.id, commentText.trim());
      setCommentText("");
      setShowCommentInput(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (onDueDateChange) {
      onDueDateChange(task.id, date || null);
    }
    setDatePickerOpen(false);
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

          <div className="space-y-2 text-xs">
            {task.projectName && (
              <div className="flex items-center gap-2">
                <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground shrink-0">Project:</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={`/projects/${task.projectId}`}
                        className="font-medium text-primary hover:underline truncate flex-1 min-w-0"
                        data-testid={`hover-project-link-${task.id}`}
                      >
                        {task.projectName}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[300px]">
                      <p>{task.projectName}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
              </div>
            )}

            {task.deliverableName && (
              <div className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground shrink-0">Deliverable:</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={`/projects/${task.projectId}/deliverables/${task.deliverableId}`}
                        className="font-medium text-primary hover:underline truncate flex-1 min-w-0"
                        data-testid={`hover-deliverable-link-${task.id}`}
                      >
                        {task.deliverableName}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[300px]">
                      <p>{task.deliverableName}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
              </div>
            )}

            {task.epicName && (
              <div className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground shrink-0">Epic:</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={`/projects/${task.projectId}/epics/${task.epicId}`}
                        className="font-medium text-primary hover:underline truncate flex-1 min-w-0"
                        data-testid={`hover-epic-link-${task.id}`}
                      >
                        {task.epicName}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[300px]">
                      <p>{task.epicName}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
              </div>
            )}

            <div className="flex items-center gap-4 pt-1">
              {task.assigneeName && (
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Assignee:</span>
                  <span className="font-medium">{task.assigneeName}</span>
                </div>
              )}
              {dueDate && (
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Due:</span>
                  <span className={cn("font-medium", isOverdue && "text-red-600")}>
                    {format(dueDate, "MMM d, yyyy")}
                  </span>
                </div>
              )}
            </div>

            {task.sprintName && (
              <div className="flex items-center gap-1.5 pt-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Sprint:</span>
                <span className="font-medium">{task.sprintName}</span>
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

          {!disabled && (statusOptions.length > 0 || onBlockedToggle || onDueDateChange || onAddComment) && (
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

                  {onDueDateChange && (
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          data-testid={`hover-due-date-${task.id}`}
                        >
                          <CalendarIcon className="h-3 w-3" />
                          Due Date
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dueDate || undefined}
                          onSelect={handleDateSelect}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}

                  {onAddComment && !showCommentInput && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => setShowCommentInput(true)}
                      data-testid={`hover-add-comment-${task.id}`}
                    >
                      <MessageSquarePlus className="h-3 w-3" />
                      Comment
                    </Button>
                  )}
                </div>

                {showCommentInput && onAddComment && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Add a quick comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmitComment();
                        }
                        if (e.key === "Escape") {
                          setShowCommentInput(false);
                          setCommentText("");
                        }
                      }}
                      className="h-7 text-xs flex-1"
                      autoFocus
                      data-testid={`hover-comment-input-${task.id}`}
                    />
                    <Button
                      size="sm"
                      className="h-7 px-2"
                      onClick={handleSubmitComment}
                      disabled={!commentText.trim()}
                      data-testid={`hover-comment-submit-${task.id}`}
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                )}
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
