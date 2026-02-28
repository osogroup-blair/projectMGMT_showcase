import { useState, useRef, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserPlus } from "lucide-react";
import {
  Clock,
  Flag,
  User,
  Check,
  Pencil,
  ChevronDown,
  Link2Off,
  Link2,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isValid, parseISO } from "date-fns";
import { EFFORT_VALUES } from "@shared/schema";
import { useTaskStatuses } from "@/hooks/use-task-statuses";

function safeParseDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
}

function formatDate(date: Date | null, formatStr: string): string {
  if (!date) return "No date";
  try {
    return format(date, formatStr);
  } catch {
    return "Invalid";
  }
}

export type LayoutVariant = "one-column" | "two-column" | "three-column";

const PRIORITY_COLORS: Record<string, string> = {
  "High": "text-red-600 bg-red-50",
  "Medium": "text-amber-600 bg-amber-50",
  "Low": "text-slate-600 bg-slate-50"
};

export interface TaskCardTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigneeId?: string;
  deadline: string;
  effort?: number;
  epicId?: string;
  stageId?: string;
  milestoneId?: string;
  blocked?: boolean;
  blocker?: boolean;
  subtaskCount?: number;
  completedSubtaskCount?: number;
}

export interface TaskCardProps {
  task: TaskCardTask;
  epicName?: string;
  stageName?: string;
  milestoneName?: string;
  assigneeName?: string;
  users?: Array<{ id: string; name: string }>;
  stages?: Array<{ id: string; name: string }>;
  layoutVariant?: LayoutVariant;
  onUpdateTask: (taskId: string, updates: Partial<TaskCardTask>) => void;
  onOpenEpic?: (epicId: string) => void;
  onOpenMilestone?: (milestoneId: string) => void;
  onOpenTask?: (taskId: string) => void;
  teamMemberUserIds?: string[];
  onAddToTeam?: (userId: string) => Promise<void>;
}

export function TaskCard({
  task,
  epicName,
  stageName,
  milestoneName,
  assigneeName,
  users = [],
  stages = [],
  layoutVariant = "three-column",
  onUpdateTask,
  onOpenEpic,
  onOpenMilestone,
  onOpenTask,
  teamMemberUserIds,
  onAddToTeam
}: TaskCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState(false);
  const [addToTeamConfirmOpen, setAddToTeamConfirmOpen] = useState(false);
  const [pendingAssigneeId, setPendingAssigneeId] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const { statusLabels, getStatusColor, isCompletedStatus } = useTaskStatuses();

  const deadlineDate = useMemo(() => safeParseDate(task.deadline), [task.deadline]);
  const isOverdue = deadlineDate && deadlineDate < new Date() && !isCompletedStatus(task.status);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== task.title) {
      onUpdateTask(task.id, { title: editedTitle.trim() });
    } else {
      setEditedTitle(task.title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setEditedTitle(task.title);
      setIsEditingTitle(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    onUpdateTask(task.id, { status: newStatus });
  };

  const handleAssigneeChange = (userId: string) => {
    if (userId === "unassigned") {
      onUpdateTask(task.id, { assigneeId: undefined });
      setAssigneePopoverOpen(false);
      return;
    }

    const isTeamMember = !teamMemberUserIds || teamMemberUserIds.includes(userId);

    if (!isTeamMember) {
      if (onAddToTeam) {
        setPendingAssigneeId(userId);
        setAddToTeamConfirmOpen(true);
        setAssigneePopoverOpen(false);
      } else {
        onUpdateTask(task.id, { assigneeId: userId });
        setAssigneePopoverOpen(false);
      }
    } else {
      onUpdateTask(task.id, { assigneeId: userId });
      setAssigneePopoverOpen(false);
    }
  };

  const handleConfirmAddToTeam = async () => {
    if (pendingAssigneeId && onAddToTeam) {
      try {
        await onAddToTeam(pendingAssigneeId);
        onUpdateTask(task.id, { assigneeId: pendingAssigneeId });
      } catch (error) {
        console.error("Failed to add user to team:", error);
      }
    }
    setAddToTeamConfirmOpen(false);
    setPendingAssigneeId(null);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      onUpdateTask(task.id, { deadline: date.toISOString().split('T')[0] });
    }
    setDatePopoverOpen(false);
  };

  const handleEffortChange = (effort: string) => {
    onUpdateTask(task.id, { effort: parseInt(effort) });
  };

  const isCompact = layoutVariant === "three-column";
  const isWide = layoutVariant === "one-column";

  return (
    <Card
      className={cn(
        "group transition-all hover:shadow-md border-l-4",
        isCompletedStatus(task.status) ? "border-l-green-500" : "border-l-primary/50",
        isWide && "flex flex-row items-stretch"
      )}
      data-testid={`task-card-${task.id}`}
    >
      <CardContent className={cn(
        "p-3 space-y-2",
        isWide && "flex-1 flex flex-row items-center gap-4 p-4"
      )}>
        {isWide ? (
          <>
            {/* Wide Layout - Single Row */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Status Dropdown */}
              <SearchableSelect
                value={task.status}
                onValueChange={handleStatusChange}
                placeholder="Select status"
                options={statusLabels.map(s => ({ value: s, label: s }))}
                triggerClassName={cn("h-7 w-[110px] text-xs border-0 font-medium", getStatusColor(task.status))}
              />

              {/* Epic Context */}
              {epicName && (
                <button
                  className="text-xs text-muted-foreground hover:text-purple-600 hover:underline truncate max-w-[100px] shrink-0"
                  onClick={(e) => { e.stopPropagation(); onOpenEpic?.(task.epicId!); }}
                  aria-label={`Open epic ${epicName}`}
                >
                  {epicName}
                </button>
              )}

              {/* Title (Editable) */}
              <div className="flex-1 min-w-0">
                {isEditingTitle ? (
                  <Input
                    ref={titleInputRef}
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={handleTitleKeyDown}
                    className="h-7 text-sm font-medium"
                    aria-label="Edit task title"
                  />
                ) : (
                  <button
                    className="text-left w-full font-medium text-sm truncate hover:text-primary group-hover:underline"
                    onClick={(e) => { e.stopPropagation(); onOpenTask?.(task.id); }}
                    onDoubleClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }}
                    aria-label={`Task: ${task.title}. Double-click to edit.`}
                  >
                    {task.title}
                  </button>
                )}
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Milestone */}
              {milestoneName && (
                <button
                  className="flex items-center gap-1 text-xs text-amber-600 hover:underline"
                  onClick={(e) => { e.stopPropagation(); onOpenMilestone?.(task.milestoneId!); }}
                  aria-label={`Milestone: ${milestoneName}`}
                >
                  <Flag className="h-3 w-3" />
                  <span className="truncate max-w-[80px]">{milestoneName}</span>
                </button>
              )}

              {/* Effort */}
              <SearchableSelect
                value={task.effort?.toString() || ""}
                onValueChange={handleEffortChange}
                placeholder="—"
                options={EFFORT_VALUES.map(v => ({ value: v.toString(), label: `${v} pts` }))}
                triggerClassName="h-7 w-[60px] text-xs"
              />

              {/* Due Date */}
              <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-7 text-xs gap-1 px-2",
                      isOverdue && "text-red-500"
                    )}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Due date: ${formatDate(deadlineDate, "MMM d, yyyy")}`}
                  >
                    <Clock className="h-3 w-3" />
                    {formatDate(deadlineDate, "MMM d")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={deadlineDate || undefined}
                    onSelect={handleDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Assignee */}
              <Popover open={assigneePopoverOpen} onOpenChange={setAssigneePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={assigneeName ? `Assigned to ${assigneeName}` : "Unassigned"}
                  >
                    {assigneeName ? (
                      <>
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[9px]">
                            {assigneeName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs max-w-[60px] truncate">{assigneeName.split(' ')[0]}</span>
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Assign</span>
                      </>
                    )}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1" align="end">
                  <div className="space-y-0.5">
                    <button
                      className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted flex items-center gap-2"
                      onClick={() => handleAssigneeChange("unassigned")}
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      Unassigned
                      {!task.assigneeId && <Check className="h-4 w-4 ml-auto" />}
                    </button>
                    {users.map(u => (
                      <button
                        key={u.id}
                        className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted flex items-center gap-2"
                        onClick={() => handleAssigneeChange(u.id)}
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[9px]">{u.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        {u.name}
                        {task.assigneeId === u.id && <Check className="h-4 w-4 ml-auto" />}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Stage */}
              {stageName && (
                <Badge variant="outline" className="text-[10px] shrink-0">{stageName}</Badge>
              )}

              {/* Priority Badge */}
              <Badge className={cn("text-[10px] px-1.5 shrink-0", PRIORITY_COLORS[task.priority])}>
                {task.priority}
              </Badge>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-2">
            {/* Top Row: Epic, Stage, Status, Dep Icons */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                {epicName && (
                  <button
                    className="text-[10px] font-medium text-purple-600 bg-purple-50 px-1.5 rounded truncate max-w-[100px] hover:underline"
                    onClick={(e) => { e.stopPropagation(); onOpenEpic?.(task.epicId!); }}
                  >
                    {epicName}
                  </button>
                )}
                {stageName && (
                  <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                    {stageName}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {task.blocked && <span title="Blocked"><Link2Off className="h-3 w-3 text-red-500" /></span>}
                {task.blocker && <span title="Blocking others"><Link2 className="h-3 w-3 text-amber-500" /></span>}
                {task.subtaskCount !== undefined && task.subtaskCount > 0 && (
                  <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground" title="Subtasks">
                    <Layers className="h-3 w-3" />
                    <span>{task.completedSubtaskCount || 0}/{task.subtaskCount}</span>
                  </div>
                )}
                <SearchableSelect
                  value={task.status}
                  onValueChange={handleStatusChange}
                  placeholder="Status"
                  options={statusLabels.map(s => ({ value: s, label: s }))}
                  triggerClassName={cn("h-5 w-auto min-w-[70px] text-[9px] border-0 font-medium px-1.5 py-0 h-auto", getStatusColor(task.status))}
                />
              </div>
            </div>

            {/* Middle Row: Title */}
            <div className="relative group/title min-h-[40px]">
              {isEditingTitle ? (
                <Input
                  ref={titleInputRef}
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  className="h-7 text-sm font-medium w-full"
                />
              ) : (
                <div className="flex items-start gap-1">
                  <button
                    className="text-left font-medium text-sm leading-snug line-clamp-2 hover:text-primary w-full"
                    onClick={(e) => { e.stopPropagation(); onOpenTask?.(task.id); }}
                    onDoubleClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }}
                  >
                    {task.title}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover/title:opacity-100 shrink-0 -mt-0.5"
                    onClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Bottom Row: Assignee, Date, Effort, Priority, Milestone */}
            <div className="flex items-center flex-wrap gap-x-3 gap-y-2 pt-1 mt-1 border-t border-border/40 justify-between">

              <div className="flex items-center gap-2">
                {/* Assignee */}
                <Popover open={assigneePopoverOpen} onOpenChange={setAssigneePopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className="flex items-center gap-1.5 text-xs hover:text-primary shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {assigneeName ? (
                        <div className="flex items-center gap-1" title={assigneeName}>
                          <Avatar className="h-5 w-5 border border-border">
                            <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-medium">
                              {assigneeName.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {!isCompact && <span className="text-xs text-muted-foreground truncate max-w-[60px]">{assigneeName.split(' ')[0]}</span>}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors" title="Assign">
                          <div className="h-5 w-5 rounded-full border border-dashed border-muted-foreground/50 flex items-center justify-center">
                            <User className="h-3 w-3" />
                          </div>
                          {!isCompact && <span className="text-[10px] italic">Assign</span>}
                        </div>
                      )}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-1" align="start">
                    <div className="space-y-0.5">
                      <button
                        className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted flex items-center gap-2"
                        onClick={() => handleAssigneeChange("unassigned")}
                      >
                        <User className="h-4 w-4 text-muted-foreground" />
                        Unassigned
                        {!task.assigneeId && <Check className="h-4 w-4 ml-auto" />}
                      </button>
                      {users.map(u => (
                        <button
                          key={u.id}
                          className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted flex items-center gap-2"
                          onClick={() => handleAssigneeChange(u.id)}
                        >
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[9px]">{u.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          {u.name}
                          {task.assigneeId === u.id && <Check className="h-4 w-4 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Due Date */}
                <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "flex items-center gap-1 text-[10px] shrink-0 font-medium px-1.5 py-0.5 rounded transition-colors",
                        isOverdue
                          ? "text-red-600 bg-red-50 hover:bg-red-100"
                          : "text-slate-500 hover:bg-slate-100"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Clock className="h-3 w-3" />
                      {formatDate(deadlineDate, "MMM d")}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={deadlineDate || undefined}
                      onSelect={handleDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-2">
                {/* Effort */}
                <SearchableSelect
                  value={task.effort?.toString() || ""}
                  onValueChange={handleEffortChange}
                  placeholder="—"
                  options={EFFORT_VALUES.map(v => ({ value: v.toString(), label: v.toString() }))}
                  triggerClassName="h-5 w-10 min-w-10 text-[10px] px-1 py-0 h-auto border-transparent hover:border-border text-center justify-center shrink-0 bg-transparent text-muted-foreground font-medium"
                />

                {/* Priority */}
                <Badge className={cn("text-[9px] px-1 py-0 h-4 rounded-sm border-0 font-semibold tracking-wide uppercase shrink-0", PRIORITY_COLORS[task.priority])}>
                  {task.priority.charAt(0)}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <AlertDialog open={addToTeamConfirmOpen} onOpenChange={setAddToTeamConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add User to Project Team</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAssigneeId && (() => {
                const user = users.find(u => u.id === pendingAssigneeId);
                return `"${user?.name || 'This user'}" is not currently a member of this project's team. Would you like to add them as a team member and assign this task to them?`;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingAssigneeId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAddToTeam}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add to Team & Assign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
