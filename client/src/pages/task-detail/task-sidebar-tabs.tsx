import { MessageSquare, Layers, Loader2, GitBranch, ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskCommentsPanel } from "./task-comments-panel";
import { Badge } from "@/components/ui/badge";
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
}

export function TaskSidebarTabs({ 
  task, 
  projectId, 
  subtasks, 
  isLoadingSubtasks,
  dependsOn = [],
  dependents = [],
  isLoadingDeps
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
        {isLoadingDeps ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Depends On ({dependsOn.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dependsOn.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">No dependencies</p>
                ) : (
                  <div className="space-y-2">
                    {dependsOn.map((dep: any) => (
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
                          data-testid={`sidebar-depends-on-${dep.id}`}
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
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}
