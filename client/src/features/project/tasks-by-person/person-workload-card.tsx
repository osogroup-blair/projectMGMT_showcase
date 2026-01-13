import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Zap, 
  Flag, 
  Package, 
  Search,
  LayoutList,
  LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskListItem } from "./task-list-item";
import { ScopeFilter } from "./scope-filter";
import { QuickFilters } from "./quick-filters";
import { filterTasks, groupTasksByScope } from "./use-person-workload";
import type { PersonWorkload, TasksByPersonFilters, ScopeType, ViewMode } from "./types";

interface PersonWorkloadCardProps {
  person: PersonWorkload;
  projectId: string;
  defaultExpanded?: boolean;
  sprints?: Array<{ id: string; name: string }>;
  milestones?: Array<{ id: string; name: string }>;
  deliverables?: Array<{ id: string; name: string }>;
  allowInlineEditing?: boolean;
}

const statusConfig = {
  "on-track": { label: "On Track", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  "at-risk": { label: "At Risk", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  "off-track": { label: "Off Track", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export function PersonWorkloadCard({
  person,
  projectId,
  defaultExpanded = false,
  sprints = [],
  milestones = [],
  deliverables = [],
  allowInlineEditing = false,
}: PersonWorkloadCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filters, setFilters] = useState<TasksByPersonFilters>({
    scope: "all",
    statuses: [],
    priorities: [],
    dueDateFilter: "all",
    blockedOnly: false,
    search: "",
  });

  const filteredTasks = useMemo(() => {
    return filterTasks(person.tasks, filters);
  }, [person.tasks, filters]);

  const groupedTasks = useMemo(() => {
    if (filters.scope === "all" || filters.scope === "unscoped") {
      return null;
    }
    return groupTasksByScope(filteredTasks, filters.scope);
  }, [filteredTasks, filters.scope]);

  const updateFilters = (partial: Partial<TasksByPersonFilters>) => {
    setFilters(prev => ({ ...prev, ...partial }));
  };

  const { metrics, status } = person;
  const statusInfo = statusConfig[status];
  const initials = person.userName.split(" ").map(n => n[0]).join("").slice(0, 2);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="overflow-hidden" data-testid={`person-card-${person.userId}`}>
        <CollapsibleTrigger asChild>
          <CardHeader className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10">
                {person.userAvatar && <AvatarImage src={person.userAvatar} />}
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{person.userName}</span>
                  {person.userRole && (
                    <span className="text-xs text-muted-foreground">{person.userRole}</span>
                  )}
                  <Badge variant="outline" className={cn("text-xs", statusInfo.color)}>
                    {statusInfo.label}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    {metrics.completedTasks}/{metrics.totalTasks} done
                  </span>
                  {metrics.overdueTasks > 0 && (
                    <span className="flex items-center gap-1 text-red-600">
                      <Clock className="h-3.5 w-3.5" />
                      {metrics.overdueTasks} overdue
                    </span>
                  )}
                  {metrics.blockedTasks > 0 && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {metrics.blockedTasks} blocked
                    </span>
                  )}
                  {metrics.dueSoonTasks > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {metrics.dueSoonTasks} due soon
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5">
                  {metrics.hasSprintTasks && (
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                      <Zap className="h-3 w-3 mr-0.5" />
                      Sprint
                    </Badge>
                  )}
                  {metrics.hasMilestoneTasks && (
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                      <Flag className="h-3 w-3 mr-0.5" />
                      Milestone
                    </Badge>
                  )}
                  {metrics.hasDeliverableTasks && (
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                      <Package className="h-3 w-3 mr-0.5" />
                      Deliverable
                    </Badge>
                  )}
                </div>

                <div className="w-20">
                  <Progress value={metrics.completionPercent} className="h-2" />
                  <span className="text-[10px] text-muted-foreground">{metrics.completionPercent}%</span>
                </div>

                <ChevronDown className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform",
                  isExpanded && "rotate-180"
                )} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="p-4 pt-0 border-t">
            <div className="space-y-4 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    className="pl-9 h-8 text-sm"
                    value={filters.search}
                    onChange={(e) => updateFilters({ search: e.target.value })}
                    data-testid={`search-tasks-${person.userId}`}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode("list")}
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "card" ? "secondary" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode("card")}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <ScopeFilter
                value={filters.scope}
                onChange={(scope) => updateFilters({ scope, scopeId: undefined })}
                scopeId={filters.scopeId}
                onScopeIdChange={(scopeId) => updateFilters({ scopeId })}
                sprints={sprints}
                milestones={milestones}
                deliverables={deliverables}
                hasSprintTasks={metrics.hasSprintTasks}
                hasMilestoneTasks={metrics.hasMilestoneTasks}
                hasDeliverableTasks={metrics.hasDeliverableTasks}
                hasUnscopedTasks={metrics.hasUnscopedTasks}
              />

              <QuickFilters
                filters={filters}
                onFiltersChange={updateFilters}
              />

              <div>
                {filteredTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-8">
                    <Search className="h-10 w-10 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No tasks match your filters</p>
                    <Button 
                      variant="link" 
                      size="sm"
                      onClick={() => setFilters({
                        scope: "all",
                        statuses: [],
                        priorities: [],
                        dueDateFilter: "all",
                        blockedOnly: false,
                        search: "",
                      })}
                    >
                      Clear all filters
                    </Button>
                  </div>
                ) : groupedTasks ? (
                  <div className="space-y-4">
                    {groupedTasks.map(group => (
                      <div key={group.id}>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {group.name}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {group.tasks.length} task{group.tasks.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {group.tasks.map(task => (
                            <TaskListItem
                              key={task.id}
                              task={task}
                              projectId={projectId}
                              showScopeBreadcrumb={false}
                              compact={viewMode === "card"}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTasks.map(task => (
                      <TaskListItem
                        key={task.id}
                        task={task}
                        projectId={projectId}
                        compact={viewMode === "card"}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
