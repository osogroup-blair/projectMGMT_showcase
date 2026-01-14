import { useState, useMemo } from "react";
import { Search, Plus, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface AddTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backlogTasks: any[];
  projectTasks?: any[];
  currentSprintId?: string;
  projectStages?: any[];
  onAddTasks: (taskIds: string[], clearSelection: () => void, closeDialog: () => void) => void;
  onCreateNew: () => void;
}

function isOverdue(task: any): boolean {
  if (!task.deadline) return false;
  const deadline = new Date(task.deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return deadline < today;
}

function getDaysOverdue(task: any): number {
  if (!task.deadline) return 0;
  const deadline = new Date(task.deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - deadline.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function AddTasksDialog({
  open,
  onOpenChange,
  backlogTasks,
  projectTasks = [],
  currentSprintId,
  projectStages = [],
  onAddTasks,
  onCreateNew,
}: AddTasksDialogProps) {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllTasks, setShowAllTasks] = useState(false);

  const availableTasks = useMemo(() => {
    let tasks: any[];
    
    if (showAllTasks && projectTasks.length > 0) {
      tasks = projectTasks.filter((t: any) => t.sprintId !== currentSprintId);
    } else {
      tasks = backlogTasks;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      tasks = tasks.filter((t: any) => 
        t.title?.toLowerCase().includes(query) || 
        t.name?.toLowerCase().includes(query)
      );
    }

    return tasks.sort((a, b) => {
      const aOverdue = isOverdue(a);
      const bOverdue = isOverdue(b);
      
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      
      if (aOverdue && bOverdue) {
        return getDaysOverdue(b) - getDaysOverdue(a);
      }
      
      if (a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (a.deadline && !b.deadline) return -1;
      if (!a.deadline && b.deadline) return 1;
      
      return 0;
    });
  }, [backlogTasks, projectTasks, currentSprintId, searchQuery, showAllTasks]);

  const overdueCount = useMemo(() => {
    return availableTasks.filter(isOverdue).length;
  }, [availableTasks]);

  const handleAdd = () => {
    onAddTasks(
      selectedTasks,
      () => setSelectedTasks([]),
      () => onOpenChange(false)
    );
  };

  const getStage = (stageId?: string) => {
    if (!stageId) return null;
    return projectStages.find((s: any) => s.id === stageId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add Tasks to Sprint</DialogTitle>
          <DialogDescription>
            Select tasks to add to this sprint. {overdueCount > 0 && (
              <span className="text-amber-600 font-medium">
                {overdueCount} overdue task{overdueCount !== 1 ? "s" : ""} shown first.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-tasks"
              />
            </div>
            {projectTasks.length > 0 && (
              <Button
                variant={showAllTasks ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAllTasks(!showAllTasks)}
                data-testid="button-toggle-all-tasks"
              >
                {showAllTasks ? "Showing All Tasks" : "Show All Tasks"}
              </Button>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto border rounded-md">
            {availableTasks.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>No tasks available</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Effort</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableTasks.map((task: any) => {
                    const taskOverdue = isOverdue(task);
                    const daysOverdue = getDaysOverdue(task);
                    const stage = getStage(task.stageId);
                    
                    return (
                      <TableRow 
                        key={task.id} 
                        data-testid={`row-backlog-task-${task.id}`}
                        className={cn(taskOverdue && "bg-amber-50")}
                      >
                        <TableCell className="w-[40px]">
                          <Checkbox
                            checked={selectedTasks.includes(task.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTasks([...selectedTasks, task.id]);
                              } else {
                                setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                              }
                            }}
                            data-testid={`checkbox-task-${task.id}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {taskOverdue && (
                              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                            )}
                            <span className="font-medium">{task.title || task.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {stage ? (
                            <Badge variant="outline" className="font-normal">
                              {stage.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {task.deadline ? (
                            <div className={cn("flex items-center gap-1 text-sm", taskOverdue && "text-amber-600 font-medium")}>
                              <Clock className="h-3 w-3" />
                              {new Date(task.deadline).toLocaleDateString()}
                              {taskOverdue && (
                                <span className="text-xs">({daysOverdue}d overdue)</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {task.effort ? (
                            <span className="text-sm">{task.effort} pts</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button 
            variant="secondary" 
            onClick={() => {
              onOpenChange(false);
              onCreateNew();
            }} 
            data-testid="button-create-new-task"
          >
            <Plus className="h-4 w-4 mr-1" />
            Create New Task
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-add-tasks">
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={selectedTasks.length === 0} data-testid="button-confirm-add-tasks">
              Add {selectedTasks.length} Task{selectedTasks.length !== 1 ? "s" : ""}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
