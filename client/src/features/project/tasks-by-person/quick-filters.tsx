import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Filter, X, AlertTriangle, Calendar, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TasksByPersonFilters, DueDateFilter } from "./types";

interface QuickFiltersProps {
  filters: TasksByPersonFilters;
  onFiltersChange: (filters: Partial<TasksByPersonFilters>) => void;
  availableStatuses?: string[];
  availablePriorities?: string[];
}

const defaultStatuses = ["To Do", "In Progress", "Done", "Blocked", "BACKLOGGED", "IN_PROGRESS", "COMPLETED"];
const defaultPriorities = ["Critical", "High", "Medium", "Low"];

const dueDateOptions: Array<{ value: DueDateFilter; label: string }> = [
  { value: "all", label: "Any Date" },
  { value: "overdue", label: "Overdue" },
  { value: "this-week", label: "This Week" },
  { value: "upcoming", label: "Upcoming" },
];

export function QuickFilters({
  filters,
  onFiltersChange,
  availableStatuses = defaultStatuses,
  availablePriorities = defaultPriorities,
}: QuickFiltersProps) {
  const activeFilterCount = 
    filters.statuses.length + 
    filters.priorities.length + 
    (filters.dueDateFilter !== "all" ? 1 : 0) + 
    (filters.blockedOnly ? 1 : 0);

  const clearFilters = () => {
    onFiltersChange({
      statuses: [],
      priorities: [],
      dueDateFilter: "all",
      blockedOnly: false,
    });
  };

  const toggleStatus = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    onFiltersChange({ statuses: newStatuses });
  };

  const togglePriority = (priority: string) => {
    const newPriorities = filters.priorities.includes(priority)
      ? filters.priorities.filter(p => p !== priority)
      : [...filters.priorities, priority];
    onFiltersChange({ priorities: newPriorities });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-2"
            data-testid="quick-filters-trigger"
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Quick Filters</span>
              {activeFilterCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs"
                  onClick={clearFilters}
                >
                  Clear all
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <div className="grid grid-cols-2 gap-2">
                {availableStatuses.slice(0, 6).map(status => (
                  <div key={status} className="flex items-center gap-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filters.statuses.includes(status)}
                      onCheckedChange={() => toggleStatus(status)}
                    />
                    <Label htmlFor={`status-${status}`} className="text-xs capitalize cursor-pointer">
                      {status.replace(/_/g, " ")}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Priority</Label>
              <div className="grid grid-cols-2 gap-2">
                {availablePriorities.map(priority => (
                  <div key={priority} className="flex items-center gap-2">
                    <Checkbox
                      id={`priority-${priority}`}
                      checked={filters.priorities.includes(priority)}
                      onCheckedChange={() => togglePriority(priority)}
                    />
                    <Label htmlFor={`priority-${priority}`} className="text-xs cursor-pointer">
                      {priority}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Due Date</Label>
              <div className="flex flex-wrap gap-1.5">
                {dueDateOptions.map(option => (
                  <Button
                    key={option.value}
                    variant={filters.dueDateFilter === option.value ? "secondary" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onFiltersChange({ dueDateFilter: option.value })}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t">
              <Checkbox
                id="blocked-only"
                checked={filters.blockedOnly}
                onCheckedChange={(checked) => onFiltersChange({ blockedOnly: !!checked })}
              />
              <Label htmlFor="blocked-only" className="text-xs cursor-pointer flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                Blocked tasks only
              </Label>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {filters.blockedOnly && (
        <Badge 
          variant="outline" 
          className="h-7 gap-1 text-xs cursor-pointer hover:bg-muted"
          onClick={() => onFiltersChange({ blockedOnly: false })}
        >
          <AlertTriangle className="h-3 w-3 text-amber-500" />
          Blocked
          <X className="h-3 w-3" />
        </Badge>
      )}

      {filters.dueDateFilter !== "all" && (
        <Badge 
          variant="outline" 
          className="h-7 gap-1 text-xs cursor-pointer hover:bg-muted"
          onClick={() => onFiltersChange({ dueDateFilter: "all" })}
        >
          <Calendar className="h-3 w-3" />
          {dueDateOptions.find(o => o.value === filters.dueDateFilter)?.label}
          <X className="h-3 w-3" />
        </Badge>
      )}

      {filters.statuses.map(status => (
        <Badge 
          key={status}
          variant="outline" 
          className="h-7 gap-1 text-xs cursor-pointer hover:bg-muted capitalize"
          onClick={() => toggleStatus(status)}
        >
          {status.replace(/_/g, " ")}
          <X className="h-3 w-3" />
        </Badge>
      ))}

      {filters.priorities.map(priority => (
        <Badge 
          key={priority}
          variant="outline" 
          className="h-7 gap-1 text-xs cursor-pointer hover:bg-muted"
          onClick={() => togglePriority(priority)}
        >
          <Flag className="h-3 w-3" />
          {priority}
          <X className="h-3 w-3" />
        </Badge>
      ))}
    </div>
  );
}
