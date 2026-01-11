import { useState, useMemo } from "react";
import { MessageSquare, Layers, Loader2, GitBranch, ArrowRight, ArrowLeft, Search, Plus, X, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskCommentsPanel } from "./task-comments-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { useTaskStatuses } from "@/hooks/use-task-statuses";

interface TaskSidebarTabsProps {
  task: any;
  projectId: string;
  subtasks: any[];
  isLoadingSubtasks?: boolean;
  dependsOn?: any[];
  dependents?: any[];
  isLoadingDeps?: boolean;
  allTasks?: any[];
  stages?: any[];
  allEpics?: any[];
  milestones?: any[];
  addDependency?: (taskId: string) => void;
  removeDependency?: (depId: string) => void;
}

export function TaskSidebarTabs({ 
  task, 
  projectId, 
  subtasks, 
  isLoadingSubtasks,
  dependsOn = [],
  dependents = [],
  isLoadingDeps,
  allTasks = [],
  stages = [],
  allEpics = [],
  milestones = [],
  addDependency,
  removeDependency
}: TaskSidebarTabsProps) {
  const { isCompletedStatus, isInProgressStatus, getStatusColor } = useTaskStatuses();
  
  const completedSubtasks = subtasks.filter((s: any) => isCompletedStatus(s.status)).length;
  const totalSubtasks = subtasks.length;
  const totalDependencies = dependsOn.length + dependents.length;

  const getStatusDotColor = (status: string) => {
    if (isCompletedStatus(status)) return "bg-green-500";
    if (isInProgressStatus(status)) return "bg-blue-500";
    return "bg-gray-300";
  };

  return (
    <Tabs defaultValue="comments" className="w-full">
      <TabsList className="w-full grid grid-cols-3">
        <TabsTrigger value="comments" className="text-xs" data-testid="sidebar-tab-comments">
          <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
          Comments
        </TabsTrigger>
        <TabsTrigger value="subtasks" className="text-xs" data-testid="sidebar-tab-subtasks">
          <Layers className="h-3.5 w-3.5 mr-1.5" />
          Subtasks ({totalSubtasks})
        </TabsTrigger>
        <TabsTrigger value="dependencies" className="text-xs" data-testid="sidebar-tab-dependencies">
          <GitBranch className="h-3.5 w-3.5 mr-1.5" />
          Deps ({totalDependencies})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="comments" className="mt-4">
        <TaskCommentsPanel task={task} projectId={projectId} />
      </TabsContent>

      <TabsContent value="subtasks" className="mt-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Subtasks ({completedSubtasks}/{totalSubtasks})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSubtasks ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : subtasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No subtasks</p>
            ) : (
              <div className="space-y-2">
                {subtasks.map((subtask: any) => (
                  <Link
                    key={subtask.id}
                    href={`/projects/${projectId}/tasks/${subtask.id}`}
                    className="block"
                  >
                    <div 
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors",
                        "border border-transparent hover:border-border"
                      )}
                      data-testid={`sidebar-subtask-${subtask.id}`}
                    >
                      <div className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        getStatusDotColor(subtask.status)
                      )} />
                      <span className={cn(
                        "text-sm truncate flex-1",
                        isCompletedStatus(subtask.status) && "line-through text-muted-foreground"
                      )}>
                        {subtask.title}
                      </span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {subtask.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="dependencies" className="mt-4 space-y-4">
        <DependenciesManager
          task={task}
          projectId={projectId}
          dependsOn={dependsOn}
          dependents={dependents}
          isLoadingDeps={isLoadingDeps}
          allTasks={allTasks}
          stages={stages}
          allEpics={allEpics}
          addDependency={addDependency}
          removeDependency={removeDependency}
          getStatusDotColor={getStatusDotColor}
          isCompletedStatus={isCompletedStatus}
        />
      </TabsContent>
    </Tabs>
  );
}

function DependenciesManager({
  task,
  projectId,
  dependsOn,
  dependents,
  isLoadingDeps,
  allTasks,
  stages,
  allEpics,
  addDependency,
  removeDependency,
  getStatusDotColor,
  isCompletedStatus
}: {
  task: any;
  projectId: string;
  dependsOn: any[];
  dependents: any[];
  isLoadingDeps?: boolean;
  allTasks: any[];
  stages: any[];
  allEpics: any[];
  addDependency?: (taskId: string) => void;
  removeDependency?: (depId: string) => void;
  getStatusDotColor: (status: string) => string;
  isCompletedStatus: (status: string) => boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [epicFilter, setEpicFilter] = useState<string>("all");
  const [showAddSection, setShowAddSection] = useState(false);

  const dependsOnTaskIds = useMemo(() => 
    dependsOn.map((d: any) => d.dependsOnTaskId),
    [dependsOn]
  );

  const subtaskIds = useMemo(() => 
    allTasks.filter((t: any) => t.parentTaskId === task.id).map((t: any) => t.id),
    [allTasks, task.id]
  );

  const availableTasks = useMemo(() => 
    allTasks.filter((t: any) => 
      t.id !== task.id && 
      t.parentTaskId !== task.id &&
      !subtaskIds.includes(t.id)
    ),
    [allTasks, task.id, subtaskIds]
  );

  const filteredTasks = useMemo(() => {
    return availableTasks.filter((t: any) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!(t.title || t.name || "").toLowerCase().includes(query)) {
          return false;
        }
      }
      if (stageFilter !== "all" && t.stageId !== stageFilter) {
        return false;
      }
      if (epicFilter !== "all" && t.epicId !== epicFilter) {
        return false;
      }
      return true;
    });
  }, [availableTasks, searchQuery, stageFilter, epicFilter]);

  const getStageName = (stageId: string | null | undefined) => {
    if (!stageId) return "No Stage";
    const stage = stages.find((s: any) => s.id === stageId);
    return stage?.label || stage?.name || "Unknown";
  };

  const getEpicName = (epicId: string | null | undefined) => {
    if (!epicId) return "No Epic";
    const epic = allEpics.find((e: any) => e.id === epicId);
    return epic?.title || epic?.name || "Unknown";
  };

  const handleToggleDependency = (taskId: string) => {
    const existingDep = dependsOn.find((d: any) => d.dependsOnTaskId === taskId);
    if (existingDep) {
      removeDependency?.(existingDep.id);
    } else {
      addDependency?.(taskId);
    }
  };

  const handleRemoveDep = (depId: string) => {
    removeDependency?.(depId);
  };

  if (isLoadingDeps) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Depends On ({dependsOn.length})
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAddSection(!showAddSection)}
              data-testid="button-toggle-add-deps"
            >
              {showAddSection ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showAddSection && (
            <div className="space-y-2 p-3 bg-muted/30 rounded-md border">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search tasks..." 
                  className="pl-9 h-8"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  data-testid="input-dep-search"
                />
              </div>
              <div className="flex gap-2">
                <SearchableSelect
                  value={stageFilter}
                  onValueChange={setStageFilter}
                  placeholder="Stage"
                  options={[
                    { value: "all", label: "All Stages" },
                    ...stages.map((stage: any) => ({ value: stage.id, label: stage.label || stage.name }))
                  ]}
                  triggerClassName="h-8 flex-1"
                  data-testid="select-dep-stage"
                />
                <SearchableSelect
                  value={epicFilter}
                  onValueChange={setEpicFilter}
                  placeholder="Epic"
                  options={[
                    { value: "all", label: "All Epics" },
                    ...allEpics.map((epic: any) => ({ value: epic.id, label: epic.title || epic.name }))
                  ]}
                  triggerClassName="h-8 flex-1"
                  data-testid="select-dep-epic"
                />
              </div>
              <ScrollArea className="h-[200px]">
                <div className="space-y-1">
                  {filteredTasks.slice(0, 30).map((t: any) => {
                    const isLinked = dependsOnTaskIds.includes(t.id);
                    return (
                      <div 
                        key={t.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer text-sm",
                          isLinked && "bg-green-50"
                        )}
                        onClick={() => handleToggleDependency(t.id)}
                        data-testid={`dep-task-${t.id}`}
                      >
                        <Checkbox checked={isLinked} className="pointer-events-none" />
                        <span className="truncate flex-1">{t.title || t.name}</span>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {t.status || "Pending"}
                        </Badge>
                      </div>
                    );
                  })}
                  {filteredTasks.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No tasks found</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
          
          {dependsOn.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">No dependencies</p>
          ) : (
            <div className="space-y-2">
              {dependsOn.map((dep: any) => (
                <div 
                  key={dep.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 group",
                    "border border-transparent hover:border-border"
                  )}
                  data-testid={`sidebar-depends-on-${dep.id}`}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    getStatusDotColor(dep.status)
                  )} />
                  <Link 
                    href={`/projects/${projectId}/tasks/${dep.id}`}
                    className="flex-1 truncate"
                  >
                    <span className={cn(
                      "text-sm truncate hover:underline",
                      isCompletedStatus(dep.status) && "line-through text-muted-foreground"
                    )}>
                      {dep.title}
                    </span>
                  </Link>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {dep.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveDep(dep.id)}
                    data-testid={`button-remove-dep-${dep.id}`}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Dependents ({dependents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dependents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">No dependents</p>
          ) : (
            <div className="space-y-2">
              {dependents.map((dep: any) => (
                <Link
                  key={dep.id}
                  href={`/projects/${projectId}/tasks/${dep.id}`}
                  className="block"
                >
                  <div 
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors",
                      "border border-transparent hover:border-border"
                    )}
                    data-testid={`sidebar-dependent-${dep.id}`}
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      getStatusDotColor(dep.status)
                    )} />
                    <span className={cn(
                      "text-sm truncate flex-1",
                      isCompletedStatus(dep.status) && "line-through text-muted-foreground"
                    )}>
                      {dep.title}
                    </span>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {dep.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
