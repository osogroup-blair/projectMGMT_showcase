import { useState } from "react";
import { Link } from "wouter";
import { ListTodo, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useCompletedStatuses } from "@/hooks/use-completed-statuses";

interface TaskSubtasksTabProps {
  task: any;
  projectId: string;
  subtasks: any[];
  createSubtask: (data: { title: string; epicId: string; stageId: string; taskTypeId: string; status: string; assigneeId?: string; projectId: string }) => void;
  updateTask: (data: { id: string; updates: any }) => void;
}

export function TaskSubtasksTab({
  task,
  projectId,
  subtasks,
  createSubtask,
  updateTask,
}: TaskSubtasksTabProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const { isTaskComplete } = useCompletedStatuses();

  const completedCount = subtasks?.filter((s: any) => isTaskComplete(s.status)).length || 0;
  const totalCount = subtasks?.length || 0;
  const subtaskProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleCreateSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    // Inherit parent task's epicId, stageId, taskTypeId, and assigneeId for subtasks
    createSubtask({
      title: newSubtaskTitle.trim(),
      epicId: task.epicId,
      stageId: task.stageId,
      taskTypeId: task.taskTypeId,
      status: "BACKLOGGED",
      assigneeId: task.assigneeId,
      projectId: projectId,
    });
    setNewSubtaskTitle("");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ListTodo className="h-4 w-4" />
            Subtasks
            {subtasks && subtasks.length > 0 && (
              <Badge variant="secondary" className="ml-2 font-normal">
                {completedCount}/{totalCount}
              </Badge>
            )}
          </CardTitle>
        </div>
        {subtasks && subtasks.length > 0 && (
          <Progress value={subtaskProgress} className="h-1 mt-2" />
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {subtasks && subtasks.length > 0 ? (
          <div className="space-y-2">
            {subtasks.map((subtask: any) => (
              <Link
                key={subtask.id}
                href={`/projects/${projectId}/tasks/${subtask.id}`}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors group"
                data-testid={`subtask-${subtask.id}`}
              >
                <Checkbox
                  checked={isTaskComplete(subtask.status)}
                  onCheckedChange={(checked) => {
                    updateTask({
                      id: subtask.id,
                      updates: { status: checked ? "Done" : "Todo" },
                    });
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <span
                  className={cn(
                    "flex-1 text-sm",
                    isTaskComplete(subtask.status) && "line-through text-muted-foreground"
                  )}
                >
                  {subtask.title}
                </span>
                <Badge variant="outline" className="text-xs opacity-0 group-hover:opacity-100">
                  {subtask.status}
                </Badge>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No subtasks yet.</p>
        )}

        <div className="flex gap-2 pt-2">
          <Input
            placeholder="Add a subtask..."
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateSubtask()}
            data-testid="input-new-subtask"
          />
          <Button
            size="sm"
            onClick={handleCreateSubtask}
            disabled={!newSubtaskTitle.trim()}
            data-testid="button-add-subtask"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
