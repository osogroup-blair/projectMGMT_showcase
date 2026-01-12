import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectEpics: any[];
  projectStages: any[];
  onCreateTask: (
    title: string,
    epicId: string,
    stageId: string,
    clearForm: () => void,
    closeDialog: () => void
  ) => void;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  projectEpics,
  projectStages,
  onCreateTask,
}: CreateTaskDialogProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskEpicId, setNewTaskEpicId] = useState("");
  const [newTaskStageId, setNewTaskStageId] = useState("");

  const clearForm = () => {
    setNewTaskTitle("");
    setNewTaskEpicId("");
    setNewTaskStageId("");
  };

  const handleCreate = () => {
    onCreateTask(
      newTaskTitle,
      newTaskEpicId,
      newTaskStageId,
      clearForm,
      () => onOpenChange(false)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Create a new task and add it directly to this sprint.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-task-title">Task Name *</Label>
            <Input
              id="new-task-title"
              placeholder="Enter task name..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              data-testid="input-new-task-title"
            />
          </div>
          <div className="space-y-2">
            <Label>Epic *</Label>
            <SearchableSelect
              value={newTaskEpicId}
              onValueChange={setNewTaskEpicId}
              placeholder="Select an epic..."
              options={projectEpics.map((epic: any) => ({
                value: epic.id,
                label: epic.title || epic.name
              }))}
              data-testid="select-new-task-epic"
            />
          </div>
          <div className="space-y-2">
            <Label>Stage *</Label>
            <SearchableSelect
              value={newTaskStageId}
              onValueChange={setNewTaskStageId}
              placeholder="Select a stage..."
              options={projectStages.map((stage: any) => ({
                value: stage.id,
                label: stage.label || stage.name
              }))}
              data-testid="select-new-task-stage"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-create-task">
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!newTaskTitle.trim() || !newTaskEpicId || !newTaskStageId}
            data-testid="button-confirm-create-task"
          >
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
