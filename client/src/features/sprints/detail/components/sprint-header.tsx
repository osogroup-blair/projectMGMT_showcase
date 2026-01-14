import { useState, useRef, useEffect } from "react";
import { 
  Zap, 
  Play, 
  Square, 
  Calendar as CalendarIcon,
  ChevronDown,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format, differenceInDays, isWithinInterval, addDays, isBefore, isAfter } from "date-fns";
import type { SprintStats } from "../types";

interface SprintHeaderProps {
  sprint: any;
  stats: SprintStats;
  linkedEpics: any[];
  linkedMilestones: any[];
  projectId: string;
  isReadOnly: boolean;
  ownerUser: any;
  onSaveName: (name: string, setEditing: (v: boolean) => void) => void;
  onSaveGoal: (goal: string, setEditing: (v: boolean) => void) => void;
  onSaveDates: (start: string, end: string, setEditing: (v: boolean) => void) => void;
  onSaveCapacity: (capacity: string, setEditing: (v: boolean) => void) => void;
  onStartSprint: () => void;
  onCloseSprint: () => void;
}

type SprintPhase = "planned" | "starting" | "active" | "closing" | "closed";

const STATUS_CONFIG: Record<SprintPhase, { color: string; bgColor: string; label: string; description?: string }> = {
  "planned": { color: "text-slate-500", bgColor: "bg-slate-100", label: "Planned", description: "Sprint is scheduled" },
  "starting": { color: "text-amber-500", bgColor: "bg-amber-100", label: "Starting Soon", description: "Sprint begins within 3 days" },
  "active": { color: "text-blue-500", bgColor: "bg-blue-100", label: "Active", description: "Sprint is in progress" },
  "closing": { color: "text-orange-500", bgColor: "bg-orange-100", label: "Closing Soon", description: "Sprint ends within 3 days" },
  "closed": { color: "text-green-500", bgColor: "bg-green-100", label: "Closed", description: "Sprint completed" },
};

function getSprintPhase(sprint: any): SprintPhase {
  if (!sprint) return "planned";
  
  const today = new Date();
  const startDate = sprint.startDate ? new Date(sprint.startDate) : null;
  const endDate = sprint.endDate ? new Date(sprint.endDate) : null;
  
  if (sprint.status === "closed") return "closed";
  
  if (sprint.status === "active") {
    if (endDate && differenceInDays(endDate, today) <= 3 && differenceInDays(endDate, today) >= 0) {
      return "closing";
    }
    return "active";
  }
  
  if (sprint.status === "planned") {
    if (startDate && differenceInDays(startDate, today) <= 3 && differenceInDays(startDate, today) >= 0) {
      return "starting";
    }
    return "planned";
  }
  
  return "planned";
}

export function SprintHeader({
  sprint,
  stats,
  linkedEpics,
  linkedMilestones,
  projectId,
  isReadOnly,
  ownerUser,
  onSaveName,
  onSaveGoal,
  onSaveDates,
  onSaveCapacity,
  onStartSprint,
  onCloseSprint,
}: SprintHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(sprint?.name || "");
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editGoal, setEditGoal] = useState(sprint?.goal || "");
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [editStartDate, setEditStartDate] = useState(sprint?.startDate || "");
  const [editEndDate, setEditEndDate] = useState(sprint?.endDate || "");
  const [isEditingCapacity, setIsEditingCapacity] = useState(false);
  const [editCapacity, setEditCapacity] = useState(sprint?.capacityHours?.toString() || "");
  const [goalMetricsOpen, setGoalMetricsOpen] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const goalInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (sprint) {
      setEditName(sprint.name || "");
      setEditGoal(sprint.goal || "");
      setEditStartDate(sprint.startDate || "");
      setEditEndDate(sprint.endDate || "");
      setEditCapacity(sprint.capacityHours?.toString() || "");
    }
  }, [sprint]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    if (isEditingGoal && goalInputRef.current) {
      goalInputRef.current.focus();
    }
  }, [isEditingGoal]);

  const sprintPhase = getSprintPhase(sprint);
  const statusConfig = STATUS_CONFIG[sprintPhase];

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={cn("p-3 rounded-lg", statusConfig.bgColor)}>
            <Zap className={cn("h-6 w-6", statusConfig.color)} />
          </div>
          <div className="space-y-1">
            {isEditingName && !isReadOnly ? (
              <div className="flex items-center gap-2">
                <Input
                  ref={nameInputRef}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSaveName(editName, setIsEditingName);
                    if (e.key === "Escape") setIsEditingName(false);
                  }}
                  className="h-9 text-xl font-semibold w-[300px]"
                  data-testid="input-sprint-name"
                />
                <Button size="icon" variant="ghost" onClick={() => onSaveName(editName, setIsEditingName)}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setIsEditingName(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <h1 
                className={cn("text-2xl font-bold", !isReadOnly && "cursor-pointer hover:text-muted-foreground")}
                onClick={() => !isReadOnly && setIsEditingName(true)}
                data-testid="text-sprint-name"
              >
                {sprint?.name}
              </h1>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className={cn(statusConfig.bgColor, statusConfig.color, "border-0")}>
                {statusConfig.label}
              </Badge>
              {sprint?.startDate && sprint?.endDate && (
                <span>
                  {format(new Date(sprint.startDate), "MMM d")} - {format(new Date(sprint.endDate), "MMM d, yyyy")}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sprint?.status === "planned" && (
            <Button onClick={onStartSprint} data-testid="button-start-sprint">
              <Play className="h-4 w-4 mr-2" />
              Start Sprint
            </Button>
          )}
          {sprint?.status === "active" && (
            <Button variant="secondary" onClick={onCloseSprint} data-testid="button-close-sprint">
              <Square className="h-4 w-4 mr-2" />
              Close Sprint
            </Button>
          )}
        </div>
      </div>

      <Collapsible open={goalMetricsOpen} onOpenChange={setGoalMetricsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <ChevronDown className={cn("h-4 w-4 transition-transform", goalMetricsOpen && "rotate-180")} />
            {goalMetricsOpen ? "Hide Details" : "Show Details"}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Sprint Goal</Label>
              {isEditingGoal && !isReadOnly ? (
                <div className="space-y-2">
                  <Textarea
                    ref={goalInputRef}
                    value={editGoal}
                    onChange={(e) => setEditGoal(e.target.value)}
                    className="min-h-[80px]"
                    data-testid="textarea-sprint-goal"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => onSaveGoal(editGoal, setIsEditingGoal)}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditingGoal(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <p 
                  className={cn("text-sm", !isReadOnly && "cursor-pointer hover:bg-muted/50 p-2 rounded -m-2", !sprint?.goal && "text-muted-foreground italic")}
                  onClick={() => !isReadOnly && setIsEditingGoal(true)}
                >
                  {sprint?.goal || "No goal set"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Progress</Label>
              <div className="space-y-1">
                <Progress value={stats.percent} className="h-2" />
                <p className="text-sm">{stats.done} of {stats.total} tasks ({stats.percent}%)</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Story Points</Label>
              <p className="text-sm">{stats.doneEffort} / {stats.totalEffort} completed</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Linked Entities</Label>
              <div className="text-sm space-y-1">
                <p>{linkedEpics.length} Epics</p>
                <p>{linkedMilestones.length} Milestones</p>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
