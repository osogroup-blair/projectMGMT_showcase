import { useState, useEffect } from "react";
import { X, Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface TaskFilters {
  statuses: string[];
  priorities: string[];
  stageIds: string[];
  epicIds: string[];
  assigneeIds: string[];
  sprintIds: string[];
  dueDateRange: { from: string; to: string } | null;
}

interface Stage {
  id: string;
  name: string;
}

interface Epic {
  id: string;
  title: string;
}

interface User {
  id: string;
  name: string;
}

interface Sprint {
  id: string;
  name: string;
}

interface TaskFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  stages: Stage[];
  epics: Epic[];
  users: User[];
  sprints?: Sprint[];
}

const STATUS_OPTIONS = ["Todo", "In Progress", "Review", "Done"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];

export function TaskFilterModal({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  stages,
  epics,
  users,
  sprints = [],
}: TaskFilterModalProps) {
  const [localFilters, setLocalFilters] = useState<TaskFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, open]);

  const handleStatusToggle = (status: string) => {
    const updated = localFilters.statuses.includes(status)
      ? localFilters.statuses.filter(s => s !== status)
      : [...localFilters.statuses, status];
    setLocalFilters({ ...localFilters, statuses: updated });
  };

  const handlePriorityToggle = (priority: string) => {
    const updated = localFilters.priorities.includes(priority)
      ? localFilters.priorities.filter(p => p !== priority)
      : [...localFilters.priorities, priority];
    setLocalFilters({ ...localFilters, priorities: updated });
  };

  const handleStageToggle = (stageId: string) => {
    const updated = localFilters.stageIds.includes(stageId)
      ? localFilters.stageIds.filter(s => s !== stageId)
      : [...localFilters.stageIds, stageId];
    setLocalFilters({ ...localFilters, stageIds: updated });
  };

  const handleEpicToggle = (epicId: string) => {
    const updated = localFilters.epicIds.includes(epicId)
      ? localFilters.epicIds.filter(e => e !== epicId)
      : [...localFilters.epicIds, epicId];
    setLocalFilters({ ...localFilters, epicIds: updated });
  };

  const handleAssigneeToggle = (assigneeId: string) => {
    const updated = localFilters.assigneeIds.includes(assigneeId)
      ? localFilters.assigneeIds.filter(a => a !== assigneeId)
      : [...localFilters.assigneeIds, assigneeId];
    setLocalFilters({ ...localFilters, assigneeIds: updated });
  };

  const handleSprintToggle = (sprintId: string) => {
    const updated = localFilters.sprintIds.includes(sprintId)
      ? localFilters.sprintIds.filter(s => s !== sprintId)
      : [...localFilters.sprintIds, sprintId];
    setLocalFilters({ ...localFilters, sprintIds: updated });
  };

  const handleResetFilters = () => {
    setLocalFilters({
      statuses: [],
      priorities: [],
      stageIds: [],
      epicIds: [],
      assigneeIds: [],
      sprintIds: [],
      dueDateRange: null,
    });
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onOpenChange(false);
  };

  const activeFilterCount = 
    localFilters.statuses.length +
    localFilters.priorities.length +
    localFilters.stageIds.length +
    localFilters.epicIds.length +
    localFilters.assigneeIds.length +
    (localFilters.dueDateRange ? 1 : 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Tasks
          </DialogTitle>
          <DialogDescription>
            Apply filters to narrow down your task list
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Status</Label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => (
                <Badge
                  key={status}
                  variant={localFilters.statuses.includes(status) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors px-3 py-1.5",
                    localFilters.statuses.includes(status) 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => handleStatusToggle(status)}
                  data-testid={`filter-status-${status}`}
                >
                  {status}
                </Badge>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Priority</Label>
            <div className="flex flex-wrap gap-2">
              {PRIORITY_OPTIONS.map((priority) => (
                <Badge
                  key={priority}
                  variant={localFilters.priorities.includes(priority) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors px-3 py-1.5",
                    localFilters.priorities.includes(priority)
                      ? priority === "Critical" ? "bg-red-600 text-white"
                        : priority === "High" ? "bg-orange-500 text-white"
                        : priority === "Medium" ? "bg-blue-500 text-white"
                        : "bg-slate-500 text-white"
                      : "hover:bg-muted"
                  )}
                  onClick={() => handlePriorityToggle(priority)}
                  data-testid={`filter-priority-${priority}`}
                >
                  {priority}
                </Badge>
              ))}
            </div>
          </div>

          {/* Stage Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Stage</Label>
            <div className="flex flex-wrap gap-2">
              {stages.map((stage) => (
                <Badge
                  key={stage.id}
                  variant={localFilters.stageIds.includes(stage.id) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors px-3 py-1.5",
                    localFilters.stageIds.includes(stage.id) 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => handleStageToggle(stage.id)}
                  data-testid={`filter-stage-${stage.id}`}
                >
                  {stage.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Epic Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Epic</Label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {epics.map((epic) => (
                <Badge
                  key={epic.id}
                  variant={localFilters.epicIds.includes(epic.id) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors px-3 py-1.5",
                    localFilters.epicIds.includes(epic.id) 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => handleEpicToggle(epic.id)}
                  data-testid={`filter-epic-${epic.id}`}
                >
                  {epic.title}
                </Badge>
              ))}
            </div>
          </div>

          {/* Assignee Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Assignee</Label>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={localFilters.assigneeIds.includes("unassigned") ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-colors px-3 py-1.5",
                  localFilters.assigneeIds.includes("unassigned") 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted"
                )}
                onClick={() => handleAssigneeToggle("unassigned")}
                data-testid="filter-assignee-unassigned"
              >
                Unassigned
              </Badge>
              {users.map((user) => (
                <Badge
                  key={user.id}
                  variant={localFilters.assigneeIds.includes(user.id) ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors px-3 py-1.5",
                    localFilters.assigneeIds.includes(user.id) 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => handleAssigneeToggle(user.id)}
                  data-testid={`filter-assignee-${user.id}`}
                >
                  {user.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Sprint Filter */}
          {sprints.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Sprint</Label>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={localFilters.sprintIds.includes("backlog") ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer transition-colors px-3 py-1.5",
                    localFilters.sprintIds.includes("backlog") 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => handleSprintToggle("backlog")}
                  data-testid="filter-sprint-backlog"
                >
                  Backlog
                </Badge>
                {sprints.map((sprint) => (
                  <Badge
                    key={sprint.id}
                    variant={localFilters.sprintIds.includes(sprint.id) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-colors px-3 py-1.5",
                      localFilters.sprintIds.includes(sprint.id) 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted"
                    )}
                    onClick={() => handleSprintToggle(sprint.id)}
                    data-testid={`filter-sprint-${sprint.id}`}
                  >
                    {sprint.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Due Date Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Due Date</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">From</Label>
                <Input
                  type="date"
                  value={localFilters.dueDateRange?.from || ""}
                  onChange={(e) => setLocalFilters({
                    ...localFilters,
                    dueDateRange: {
                      from: e.target.value,
                      to: localFilters.dueDateRange?.to || ""
                    }
                  })}
                  data-testid="filter-date-from"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input
                  type="date"
                  value={localFilters.dueDateRange?.to || ""}
                  onChange={(e) => setLocalFilters({
                    ...localFilters,
                    dueDateRange: {
                      from: localFilters.dueDateRange?.from || "",
                      to: e.target.value
                    }
                  })}
                  data-testid="filter-date-to"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button 
            variant="ghost" 
            onClick={handleResetFilters}
            className="gap-2"
            data-testid="button-reset-filters"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-filters">
              Cancel
            </Button>
            <Button onClick={handleApplyFilters} data-testid="button-apply-filters">
              Apply Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function getActiveFilterCount(filters: TaskFilters): number {
  return (
    filters.statuses.length +
    filters.priorities.length +
    filters.stageIds.length +
    filters.epicIds.length +
    filters.assigneeIds.length +
    filters.sprintIds.length +
    (filters.dueDateRange && (filters.dueDateRange.from || filters.dueDateRange.to) ? 1 : 0)
  );
}

export const emptyFilters: TaskFilters = {
  statuses: [],
  priorities: [],
  stageIds: [],
  epicIds: [],
  assigneeIds: [],
  sprintIds: [],
  dueDateRange: null,
};
