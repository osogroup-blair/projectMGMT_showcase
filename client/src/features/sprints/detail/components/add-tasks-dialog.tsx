import { useState, useMemo } from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface AddTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backlogTasks: any[];
  onAddTasks: (taskIds: string[], clearSelection: () => void, closeDialog: () => void) => void;
  onCreateNew: () => void;
}

export function AddTasksDialog({
  open,
  onOpenChange,
  backlogTasks,
  onAddTasks,
  onCreateNew,
}: AddTasksDialogProps) {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBacklogTasks = useMemo(() => {
    if (!searchQuery) return backlogTasks;
    const query = searchQuery.toLowerCase();
    return backlogTasks.filter((t: any) => 
      t.title?.toLowerCase().includes(query) || 
      t.name?.toLowerCase().includes(query)
    );
  }, [backlogTasks, searchQuery]);

  const handleAdd = () => {
    onAddTasks(
      selectedTasks,
      () => setSelectedTasks([]),
      () => onOpenChange(false)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Tasks to Sprint</DialogTitle>
          <DialogDescription>
            Select tasks from the backlog to add to this sprint.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-tasks"
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto border rounded-md">
            {filteredBacklogTasks.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>No tasks available in backlog</p>
              </div>
            ) : (
              <Table>
                <TableBody>
                  {filteredBacklogTasks.map((task: any) => (
                    <TableRow key={task.id} data-testid={`row-backlog-task-${task.id}`}>
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
                        <div className="font-medium">{task.title || task.name}</div>
                        {task.effort && <span className="text-xs text-muted-foreground">{task.effort} pts</span>}
                      </TableCell>
                    </TableRow>
                  ))}
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
