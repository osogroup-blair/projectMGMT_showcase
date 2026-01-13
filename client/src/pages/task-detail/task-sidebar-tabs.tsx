import { useState, useMemo } from "react";
import { MessageSquare, Layers, Loader2, GitBranch, ArrowRight, ArrowLeft, Search, Plus, X, Trash2, Check, CheckCircle2, Flag, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskCommentsPanel } from "./task-comments-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { useTaskStatuses } from "@/hooks/use-task-statuses";
import { useCurrentUser } from "@/context/current-user-context";

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
  users?: any[];
  addDependency?: (taskId: string) => void;
  removeDependency?: (depId: string) => void;
  createSubtask?: (data: any) => void;
  updateTask?: (data: { id: string; updates: any }) => void;
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
  users = [],
  addDependency,
  removeDependency,
  createSubtask,
  updateTask
}: TaskSidebarTabsProps) {
  const { isCompletedStatus, isInProgressStatus, getStatusColor } = useTaskStatuses();
  
  const completedSubtasks = subtasks.filter((s: any) => isCompletedStatus(s.status)).length;
  const totalSubtasks = subtasks.length;
  const totalDependencies = dependsOn.length + dependents.length;
  const subtaskProgress = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

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
          Subtasks
          {totalSubtasks > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
              {completedSubtasks}/{totalSubtasks}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="dependencies" className="text-xs" data-testid="sidebar-tab-dependencies">
          <GitBranch className="h-3.5 w-3.5 mr-1.5" />
          Deps
          {totalDependencies > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
              {totalDependencies}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="comments" className="mt-4">
        <TaskCommentsPanel task={task} projectId={projectId} />
      </TabsContent>

      <TabsContent value="subtasks" className="mt-4">
        <SubtasksSection
          task={task}
          projectId={projectId}
          subtasks={subtasks}
          isLoadingSubtasks={isLoadingSubtasks}
          completedSubtasks={completedSubtasks}
          totalSubtasks={totalSubtasks}
          subtaskProgress={subtaskProgress}
          createSubtask={createSubtask}
          updateTask={updateTask}
          getStatusDotColor={getStatusDotColor}
          isCompletedStatus={isCompletedStatus}
          users={users}
        />
      </TabsContent>

      <TabsContent value="dependencies" className="mt-4 space-y-4">
        <DependenciesSection
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

function SubtasksSection({
  task,
  projectId,
  subtasks,
  isLoadingSubtasks,
  completedSubtasks,
  totalSubtasks,
  subtaskProgress,
  createSubtask,
  updateTask,
  getStatusDotColor,
  isCompletedStatus,
  users = []
}: {
  task: any;
  projectId: string;
  subtasks: any[];
  isLoadingSubtasks?: boolean;
  completedSubtasks: number;
  totalSubtasks: number;
  subtaskProgress: number;
  createSubtask?: (data: any) => void;
  updateTask?: (data: { id: string; updates: any }) => void;
  getStatusDotColor: (status: string) => string;
  isCompletedStatus: (status: string) => boolean;
  users?: any[];
}) {
  const { currentUserId } = useCurrentUser();
  const { getStatusColor } = useTaskStatuses();
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const getUser = (userId?: string | null) => users.find((u: any) => u.id === userId);

  const handleCreateSubtask = () => {
    if (!newSubtaskTitle.trim() || !createSubtask) return;
    createSubtask({
      title: newSubtaskTitle.trim(),
      epicId: task.epicId,
      stageId: task.stageId,
      taskTypeId: task.taskTypeId,
      status: "BACKLOGGED",
      assigneeId: currentUserId || task.assigneeId,
      projectId: projectId,
    });
    setNewSubtaskTitle("");
    setIsAdding(false);
  };

  const handleToggleComplete = (subtask: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!updateTask) return;
    const newStatus = isCompletedStatus(subtask.status) ? "BACKLOGGED" : "DONE";
    updateTask({ id: subtask.id, updates: { status: newStatus } });
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-amber-500';
      case 'low': return 'text-slate-400';
      default: return 'text-muted-foreground/30';
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const isOverdue = date < now;
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    return { text: `${month} ${day}`, isOverdue };
  };

  if (isLoadingSubtasks) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {totalSubtasks > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{subtaskProgress}% complete</span>
            <span>{completedSubtasks} of {totalSubtasks}</span>
          </div>
          <Progress value={subtaskProgress} className="h-1.5" />
        </div>
      )}

      <div className="space-y-2">
        {subtasks.map((subtask: any) => {
          const isComplete = isCompletedStatus(subtask.status);
          const assignee = getUser(subtask.assigneeId);
          const deadline = formatDate(subtask.deadline);
          
          return (
            <Link
              key={subtask.id}
              href={`/projects/${projectId}/tasks/${subtask.id}`}
              className="block"
            >
              <div
                className={cn(
                  "group p-3 rounded-lg border bg-card hover:bg-muted/50 transition-all hover:shadow-sm",
                  isComplete && "opacity-60 bg-muted/20"
                )}
                data-testid={`sidebar-subtask-${subtask.id}`}
              >
                <div className="flex items-start gap-2">
                  <button
                    onClick={(e) => handleToggleComplete(subtask, e)}
                    className={cn(
                      "flex-shrink-0 w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center transition-colors",
                      isComplete 
                        ? "bg-green-500 border-green-500 text-white" 
                        : "border-muted-foreground/40 hover:border-green-500"
                    )}
                    data-testid={`checkbox-subtask-${subtask.id}`}
                  >
                    {isComplete && <Check className="h-3 w-3" />}
                  </button>
                  <div className="flex-1 min-w-0 space-y-2">
                    <span className={cn(
                      "text-sm font-medium block",
                      isComplete && "line-through text-muted-foreground"
                    )}>
                      {subtask.title}
                    </span>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        variant="outline"
                        className={cn("text-[10px] px-1.5 py-0", getStatusColor(subtask.status))}
                      >
                        {subtask.status}
                      </Badge>
                      
                      {subtask.priority && (
                        <span className={cn("text-xs flex items-center gap-1", getPriorityColor(subtask.priority))}>
                          <Flag className="h-3 w-3" />
                          {subtask.priority}
                        </span>
                      )}
                      
                      {deadline && (
                        <span className={cn(
                          "text-xs flex items-center gap-1",
                          deadline.isOverdue && !isComplete ? "text-red-500" : "text-muted-foreground"
                        )}>
                          <Calendar className="h-3 w-3" />
                          {deadline.text}
                        </span>
                      )}
                      
                      {assignee && (
                        <div className="flex items-center gap-1 ml-auto">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[10px] bg-primary/10">
                              {(assignee.name || assignee.email || '?').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {isAdding ? (
        <div className="flex gap-2 items-center">
          <Input
            placeholder="Subtask title..."
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateSubtask();
              if (e.key === "Escape") {
                setIsAdding(false);
                setNewSubtaskTitle("");
              }
            }}
            className="h-8 text-sm"
            autoFocus
            data-testid="input-new-subtask"
          />
          <Button
            size="sm"
            onClick={handleCreateSubtask}
            disabled={!newSubtaskTitle.trim()}
            className="h-8 px-2"
            data-testid="button-confirm-subtask"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsAdding(false);
              setNewSubtaskTitle("");
            }}
            className="h-8 px-2"
            data-testid="button-cancel-subtask"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          data-testid="button-add-subtask"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add subtask
        </Button>
      )}
    </div>
  );
}

function DependenciesSection({
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
      !subtaskIds.includes(t.id) &&
      t.projectId === task.projectId
    ),
    [allTasks, task.id, task.projectId, subtaskIds]
  );

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return availableTasks.filter((t: any) => 
      (t.title || t.name || "").toLowerCase().includes(query)
    ).slice(0, 10);
  }, [availableTasks, searchQuery]);

  const handleAddDep = (taskId: string) => {
    addDependency?.(taskId);
    setSearchQuery("");
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

  const blockedByComplete = dependsOn.filter((d: any) => d.status && isCompletedStatus(d.status)).length;
  const blockedByTotal = dependsOn.length;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">Blocked by</span>
            {blockedByTotal > 0 && (
              <Badge 
                variant={blockedByComplete === blockedByTotal ? "default" : "secondary"}
                className="text-[10px] h-5"
              >
                {blockedByComplete}/{blockedByTotal} done
              </Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowAddSection(!showAddSection)}
            className="h-7 px-2"
            data-testid="button-toggle-add-deps"
          >
            {showAddSection ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>

        {showAddSection && (
          <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search tasks to add..." 
                className="pl-9 h-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                data-testid="input-dep-search"
              />
            </div>
            {searchQuery && (
              <ScrollArea className="max-h-[180px]">
                <div className="space-y-1">
                  {filteredTasks.map((t: any) => {
                    const isLinked = dependsOnTaskIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        className={cn(
                          "w-full flex items-center gap-2 p-2 rounded-md text-left text-sm transition-colors",
                          isLinked 
                            ? "bg-green-50 text-green-700 cursor-default" 
                            : "hover:bg-muted/50 cursor-pointer"
                        )}
                        onClick={() => !isLinked && handleAddDep(t.id)}
                        disabled={isLinked}
                        data-testid={`dep-task-${t.id}`}
                      >
                        <div className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          getStatusDotColor(t.status)
                        )} />
                        <span className="truncate flex-1">{t.title || t.name}</span>
                        {isLinked ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                  {filteredTasks.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-3">No tasks found</p>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
        
        {dependsOn.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No blocking tasks</p>
        ) : (
          <div className="space-y-1">
            {dependsOn.map((dep: any) => (
              <div 
                key={dep.id}
                className="group flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                data-testid={`sidebar-depends-on-${dep.id}`}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  getStatusDotColor(dep.status)
                )} />
                <Link 
                  href={`/projects/${projectId}/tasks/${dep.id}`}
                  className="flex-1 min-w-0"
                >
                  <span className={cn(
                    "text-sm truncate block hover:underline",
                    dep.status && isCompletedStatus(dep.status) && "line-through text-muted-foreground"
                  )}>
                    {dep.title}
                  </span>
                </Link>
                {dep.status && isCompletedStatus(dep.status) && (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                )}
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
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">Blocking</span>
          {dependents.length > 0 && (
            <Badge variant="secondary" className="text-[10px] h-5">
              {dependents.length}
            </Badge>
          )}
        </div>
        
        {dependents.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Not blocking any tasks</p>
        ) : (
          <div className="space-y-1">
            {dependents.map((dep: any) => (
              <Link
                key={dep.id}
                href={`/projects/${projectId}/tasks/${dep.id}`}
                className="block"
              >
                <div 
                  className="group flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                  data-testid={`sidebar-dependent-${dep.id}`}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    getStatusDotColor(dep.status)
                  )} />
                  <span className={cn(
                    "text-sm truncate flex-1",
                    dep.status && isCompletedStatus(dep.status) && "line-through text-muted-foreground"
                  )}>
                    {dep.title}
                  </span>
                  <Badge variant="outline" className="text-[10px] shrink-0 opacity-0 group-hover:opacity-100">
                    {dep.status}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
