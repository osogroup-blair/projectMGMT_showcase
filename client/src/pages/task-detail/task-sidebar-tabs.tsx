import { MessageSquare, Layers, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskCommentsPanel } from "./task-comments-panel";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface TaskSidebarTabsProps {
  task: any;
  projectId: string;
  subtasks: any[];
  isLoadingSubtasks?: boolean;
}

export function TaskSidebarTabs({ task, projectId, subtasks, isLoadingSubtasks }: TaskSidebarTabsProps) {
  const completedSubtasks = subtasks.filter((s: any) => s.status === "Done" || s.status === "Completed").length;
  const totalSubtasks = subtasks.length;

  return (
    <Tabs defaultValue="comments" className="w-full">
      <TabsList className="w-full grid grid-cols-2">
        <TabsTrigger value="comments" className="text-xs" data-testid="sidebar-tab-comments">
          <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
          Comments
        </TabsTrigger>
        <TabsTrigger value="nested" className="text-xs" data-testid="sidebar-tab-nested">
          <Layers className="h-3.5 w-3.5 mr-1.5" />
          Nested ({totalSubtasks})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="comments" className="mt-4">
        <TaskCommentsPanel task={task} projectId={projectId} />
      </TabsContent>

      <TabsContent value="nested" className="mt-4">
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
                        subtask.status === "Done" || subtask.status === "Completed" ? "bg-green-500" :
                        subtask.status === "In Progress" ? "bg-blue-500" : "bg-gray-300"
                      )} />
                      <span className={cn(
                        "text-sm truncate flex-1",
                        (subtask.status === "Done" || subtask.status === "Completed") && "line-through text-muted-foreground"
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
    </Tabs>
  );
}
