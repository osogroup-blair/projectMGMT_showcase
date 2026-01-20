import { useMemo } from "react";
import { X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  taskTypeIds: string[];
  dueDateRange: { from: string; to: string } | null;
}

export const emptyFilters: TaskFilters = {
  statuses: [],
  priorities: [],
  stageIds: [],
  epicIds: [],
  assigneeIds: [],
  sprintIds: [],
  taskTypeIds: [],
  dueDateRange: null,
};

export function getActiveFilterCount(filters: TaskFilters): number {
  return (
    filters.statuses.length +
    filters.priorities.length +
    filters.stageIds.length +
    filters.epicIds.length +
    filters.assigneeIds.length +
    filters.sprintIds.length +
    filters.taskTypeIds.length +
    (filters.dueDateRange ? 1 : 0)
  );
}

interface TaskInlineFiltersProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  tasks: any[];
  stages: { id: string; name: string }[];
  epics: { id: string; title: string }[];
  users: { id: string; name: string }[];
  sprints?: { id: string; name: string }[];
  taskTypes?: { id: string; name: string; color: string }[];
  statusLabels: string[];
}

export function TaskInlineFilters({
  filters,
  onFiltersChange,
  tasks,
  stages,
  epics,
  users,
  sprints = [],
  taskTypes = [],
  statusLabels,
}: TaskInlineFiltersProps) {
  const availableValues = useMemo(() => {
    const statuses = new Set<string>();
    const priorities = new Set<string>();
    const stageIds = new Set<string>();
    const epicIds = new Set<string>();
    const assigneeIds = new Set<string>();
    const sprintIds = new Set<string>();
    const taskTypeIds = new Set<string>();
    let hasUnassigned = false;
    let hasBacklog = false;

    tasks.forEach((task) => {
      if (task.status) statuses.add(task.status);
      if (task.priority) priorities.add(task.priority);
      if (task.stageId) stageIds.add(task.stageId);
      if (task.epicId) epicIds.add(task.epicId);
      if (task.assigneeId) {
        assigneeIds.add(task.assigneeId);
      } else {
        hasUnassigned = true;
      }
      if (task.sprintId) {
        sprintIds.add(task.sprintId);
      } else {
        hasBacklog = true;
      }
      if (task.taskTypeId) taskTypeIds.add(task.taskTypeId);
    });

    return {
      statuses: statusLabels.filter((s) => statuses.has(s)),
      priorities: ["Critical", "High", "Medium", "Low"].filter((p) => priorities.has(p)),
      stages: stages.filter((s) => stageIds.has(s.id)),
      epics: epics.filter((e) => epicIds.has(e.id)),
      users: users.filter((u) => assigneeIds.has(u.id)),
      sprints: sprints.filter((s) => sprintIds.has(s.id)),
      taskTypes: taskTypes.filter((t) => taskTypeIds.has(t.id)),
      hasUnassigned,
      hasBacklog,
    };
  }, [tasks, stages, epics, users, sprints, taskTypes, statusLabels]);

  const handleFilterChange = (
    key: keyof TaskFilters,
    value: string | null
  ) => {
    if (key === "dueDateRange") return;
    
    const current = filters[key] as string[];
    
    if (value === null || value === "all") {
      onFiltersChange({ ...filters, [key]: [] });
    } else {
      if (current.includes(value)) {
        onFiltersChange({ ...filters, [key]: current.filter((v) => v !== value) });
      } else {
        onFiltersChange({ ...filters, [key]: [value] });
      }
    }
  };

  const clearAllFilters = () => {
    onFiltersChange(emptyFilters);
  };

  const activeFilterCount = getActiveFilterCount(filters);

  const getDisplayValue = (filterKey: string, items: { id: string; label: string }[]) => {
    const filterValues = (filters as any)[filterKey] as string[];
    if (filterValues.length === 0) return undefined;
    if (filterValues.length === 1) {
      const item = items.find((i) => i.id === filterValues[0]);
      return item?.label || filterValues[0];
    }
    return `${filterValues.length} selected`;
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 text-muted-foreground mr-1">
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">Filters:</span>
      </div>

      {availableValues.statuses.length > 0 && (
        <Select
          value={filters.statuses[0] || "all"}
          onValueChange={(v) => handleFilterChange("statuses", v)}
        >
          <SelectTrigger 
            className={cn(
              "h-8 w-auto min-w-[100px] text-xs",
              filters.statuses.length > 0 && "border-primary bg-primary/5"
            )}
            data-testid="filter-status-dropdown"
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {availableValues.statuses.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {availableValues.priorities.length > 0 && (
        <Select
          value={filters.priorities[0] || "all"}
          onValueChange={(v) => handleFilterChange("priorities", v)}
        >
          <SelectTrigger 
            className={cn(
              "h-8 w-auto min-w-[100px] text-xs",
              filters.priorities.length > 0 && "border-primary bg-primary/5"
            )}
            data-testid="filter-priority-dropdown"
          >
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {availableValues.priorities.map((priority) => (
              <SelectItem key={priority} value={priority}>
                <span className={cn(
                  priority === "Critical" && "text-red-600",
                  priority === "High" && "text-orange-600",
                  priority === "Medium" && "text-blue-600",
                  priority === "Low" && "text-slate-600"
                )}>
                  {priority}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {availableValues.stages.length > 0 && (
        <Select
          value={filters.stageIds[0] || "all"}
          onValueChange={(v) => handleFilterChange("stageIds", v)}
        >
          <SelectTrigger 
            className={cn(
              "h-8 w-auto min-w-[90px] max-w-[140px] text-xs",
              filters.stageIds.length > 0 && "border-primary bg-primary/5"
            )}
            data-testid="filter-stage-dropdown"
          >
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {availableValues.stages.map((stage) => (
              <SelectItem key={stage.id} value={stage.id}>
                {stage.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {(availableValues.users.length > 0 || availableValues.hasUnassigned) && (
        <Select
          value={filters.assigneeIds[0] || "all"}
          onValueChange={(v) => handleFilterChange("assigneeIds", v)}
        >
          <SelectTrigger 
            className={cn(
              "h-8 w-auto min-w-[100px] max-w-[150px] text-xs",
              filters.assigneeIds.length > 0 && "border-primary bg-primary/5"
            )}
            data-testid="filter-assignee-dropdown"
          >
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            {availableValues.hasUnassigned && (
              <SelectItem value="unassigned">Unassigned</SelectItem>
            )}
            {availableValues.users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {(availableValues.sprints.length > 0 || availableValues.hasBacklog) && (
        <Select
          value={filters.sprintIds[0] || "all"}
          onValueChange={(v) => handleFilterChange("sprintIds", v)}
        >
          <SelectTrigger 
            className={cn(
              "h-8 w-auto min-w-[90px] max-w-[140px] text-xs",
              filters.sprintIds.length > 0 && "border-primary bg-primary/5"
            )}
            data-testid="filter-sprint-dropdown"
          >
            <SelectValue placeholder="Sprint" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sprints</SelectItem>
            {availableValues.hasBacklog && (
              <SelectItem value="backlog">Backlog</SelectItem>
            )}
            {availableValues.sprints.map((sprint) => (
              <SelectItem key={sprint.id} value={sprint.id}>
                {sprint.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {availableValues.epics.length > 0 && (
        <Select
          value={filters.epicIds[0] || "all"}
          onValueChange={(v) => handleFilterChange("epicIds", v)}
        >
          <SelectTrigger 
            className={cn(
              "h-8 w-auto min-w-[80px] max-w-[160px] text-xs",
              filters.epicIds.length > 0 && "border-primary bg-primary/5"
            )}
            data-testid="filter-epic-dropdown"
          >
            <SelectValue placeholder="Epic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Epics</SelectItem>
            {availableValues.epics.map((epic) => (
              <SelectItem key={epic.id} value={epic.id}>
                <span className="truncate">{epic.title}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {availableValues.taskTypes.length > 0 && (
        <Select
          value={filters.taskTypeIds[0] || "all"}
          onValueChange={(v) => handleFilterChange("taskTypeIds", v)}
        >
          <SelectTrigger 
            className={cn(
              "h-8 w-auto min-w-[90px] max-w-[130px] text-xs",
              filters.taskTypeIds.length > 0 && "border-primary bg-primary/5"
            )}
            data-testid="filter-tasktype-dropdown"
          >
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {availableValues.taskTypes.map((taskType) => (
              <SelectItem key={taskType.id} value={taskType.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: taskType.color }}
                  />
                  {taskType.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={clearAllFilters}
          data-testid="button-clear-all-filters"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Clear ({activeFilterCount})
        </Button>
      )}
    </div>
  );
}
