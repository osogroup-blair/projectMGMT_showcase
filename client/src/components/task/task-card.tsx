import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { 
  Clock, 
  Flag, 
  User, 
  Check,
  Pencil,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { EFFORT_VALUES } from "@shared/schema";

export type LayoutVariant = "one-column" | "two-column" | "three-column";

const STATUS_OPTIONS = ["Todo", "In Progress", "Review", "Done"];

const STATUS_COLORS: Record<string, string> = {
  "Todo": "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200",
  "In Progress": "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200",
  "Review": "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200",
  "Done": "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
};

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
  onOpenTask
}: TaskCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

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
    onUpdateTask(task.id, { assigneeId: userId === "unassigned" ? undefined : userId });
    setAssigneePopoverOpen(false);
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
        task.status === "Done" ? "border-l-green-500" : "border-l-primary/50",
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
              <Select value={task.status} onValueChange={handleStatusChange}>
                <SelectTrigger 
                  className={cn("h-7 w-[110px] text-xs border-0 font-medium", STATUS_COLORS[task.status])}
                  aria-label="Change status"
                  onClick={(e) => e.stopPropagation()}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Epic & Stage Context */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                {epicName && (
                  <button 
                    className="hover:text-purple-600 hover:underline truncate max-w-[100px]"
                    onClick={(e) => { e.stopPropagation(); onOpenEpic?.(task.epicId!); }}
                    aria-label={`Open epic ${epicName}`}
                  >
                    {epicName}
                  </button>
                )}
                {stageName && (
                  <Badge variant="outline" className="text-[10px] shrink-0">{stageName}</Badge>
                )}
              </div>

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
              <Select value={task.effort?.toString() || ""} onValueChange={handleEffortChange}>
                <SelectTrigger 
                  className="h-7 w-[60px] text-xs"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Change effort estimate"
                >
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {EFFORT_VALUES.map(v => (
                    <SelectItem key={v} value={v.toString()} className="text-xs">{v} pts</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Due Date */}
              <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-7 text-xs gap-1 px-2",
                      new Date(task.deadline) < new Date() && task.status !== "Done" && "text-red-500"
                    )}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Due date: ${format(new Date(task.deadline), "MMM d, yyyy")}`}
                  >
                    <Clock className="h-3 w-3" />
                    {format(new Date(task.deadline), "MMM d")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={new Date(task.deadline)}
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

              {/* Priority Badge */}
              <Badge className={cn("text-[10px] px-1.5 shrink-0", PRIORITY_COLORS[task.priority])}>
                {task.priority}
              </Badge>
            </div>
          </>
        ) : (
          <>
            {/* Compact/Grid Layout - Stacked Rows */}
            {/* Top Row: Epic, Stage, Status */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground min-w-0">
                {epicName && (
                  <button 
                    className="hover:text-purple-600 truncate max-w-[80px]"
                    onClick={(e) => { e.stopPropagation(); onOpenEpic?.(task.epicId!); }}
                  >
                    {epicName}
                  </button>
                )}
                {epicName && stageName && <span>•</span>}
                {stageName && (
                  <span className="truncate max-w-[60px]">{stageName}</span>
                )}
              </div>
              <Select value={task.status} onValueChange={handleStatusChange}>
                <SelectTrigger 
                  className={cn("h-6 w-auto min-w-[80px] text-[10px] border-0 font-medium px-1.5", STATUS_COLORS[task.status])}
                  onClick={(e) => e.stopPropagation()}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Middle Row: Title */}
            <div className="relative group/title">
              {isEditingTitle ? (
                <Input
                  ref={titleInputRef}
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  className="h-7 text-sm font-medium"
                />
              ) : (
                <div className="flex items-start gap-1">
                  <button
                    className="text-left font-medium text-sm leading-tight line-clamp-2 hover:text-primary flex-1"
                    onClick={(e) => { e.stopPropagation(); onOpenTask?.(task.id); }}
                    onDoubleClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }}
                  >
                    {task.title}
                  </button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 opacity-0 group-hover/title:opacity-100 shrink-0"
                    onClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Milestone Row (if exists) */}
            {milestoneName && (
              <button
                className="flex items-center gap-1 text-[10px] text-amber-600 hover:underline"
                onClick={(e) => { e.stopPropagation(); onOpenMilestone?.(task.milestoneId!); }}
              >
                <Flag className="h-2.5 w-2.5" />
                {milestoneName}
              </button>
            )}

            {/* Bottom Row: Assignee, Date, Effort, Priority */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50 gap-2">
              {/* Assignee */}
              <Popover open={assigneePopoverOpen} onOpenChange={setAssigneePopoverOpen}>
                <PopoverTrigger asChild>
                  <button 
                    className="flex items-center gap-1.5 text-xs hover:text-primary"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {assigneeName ? (
                      <>
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[9px]">
                            {assigneeName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-muted-foreground truncate max-w-[60px]">{assigneeName.split(' ')[0]}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground italic text-xs">Assign</span>
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

              <div className="flex items-center gap-2">
                {/* Effort */}
                {!isCompact && (
                  <Select value={task.effort?.toString() || ""} onValueChange={handleEffortChange}>
                    <SelectTrigger 
                      className="h-6 w-[50px] text-[10px] px-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {EFFORT_VALUES.map(v => (
                        <SelectItem key={v} value={v.toString()} className="text-xs">{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Due Date */}
                <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "flex items-center gap-1 text-xs",
                        new Date(task.deadline) < new Date() && task.status !== "Done" 
                          ? "text-red-500 font-medium" 
                          : "text-muted-foreground"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Clock className="h-3 w-3" />
                      {format(new Date(task.deadline), "MMM d")}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={new Date(task.deadline)}
                      onSelect={handleDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {/* Priority */}
                <Badge className={cn("text-[10px] px-1 h-5", PRIORITY_COLORS[task.priority])}>
                  {task.priority}
                </Badge>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
