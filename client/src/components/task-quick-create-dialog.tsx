import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentUser } from "@/context/current-user-context";
import { format, addDays } from "date-fns";

interface TaskQuickCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
  defaultProjectName?: string;
  onSuccess?: () => void;
}

export function TaskQuickCreateDialog({ open, onOpenChange, defaultProjectId, defaultProjectName, onSuccess }: TaskQuickCreateDialogProps) {
  const queryClient = useQueryClient();
  const { currentUserId } = useCurrentUser();
  
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId || "");
  const [epicId, setEpicId] = useState("");
  const [stageId, setStageId] = useState("");
  const [deadline, setDeadline] = useState(format(addDays(new Date(), 7), "yyyy-MM-dd"));
  const [priority, setPriority] = useState("Medium");
  const [error, setError] = useState("");
  
  useEffect(() => {
    if (defaultProjectId) {
      setProjectId(defaultProjectId);
    }
  }, [defaultProjectId]);

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
  });

  const { data: epics = [], isLoading: epicsLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "epics"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/epics`);
      if (!response.ok) throw new Error("Failed to fetch epics");
      return response.json();
    },
    enabled: !!projectId,
  });

  const { data: stages = [], isLoading: stagesLoading } = useQuery({
    queryKey: ["/api/projects", projectId, "stages"],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/stages`);
      if (!response.ok) throw new Error("Failed to fetch stages");
      return response.json();
    },
    enabled: !!projectId,
  });

  useEffect(() => {
    setEpicId("");
    setStageId("");
  }, [projectId]);

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await fetch("/api/tasks/quick-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create task");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/home/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const resetForm = () => {
    setTitle("");
    setProjectId(defaultProjectId || "");
    setEpicId("");
    setStageId("");
    setDeadline(format(addDays(new Date(), 7), "yyyy-MM-dd"));
    setPriority("Medium");
    setError("");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Task title is required");
      return;
    }
    if (!projectId) {
      setError("Please select a project");
      return;
    }
    if (!epicId) {
      setError("Please select an epic");
      return;
    }
    if (!stageId) {
      setError("Please select a stage");
      return;
    }

    const selectedProject = projects.find((p: any) => p.id === projectId);
    const projectName = defaultProjectName || selectedProject?.name || "Unknown Project";
    
    createTaskMutation.mutate({
      title: title.trim(),
      projectId,
      project: projectName,
      epicId,
      stageId,
      deadline,
      priority,
      assigneeId: currentUserId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]" data-testid="task-quick-create-dialog">
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
          <DialogDescription>
            Select a project first, then choose the epic and stage for your task.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                data-testid="input-task-title"
                placeholder="Enter task title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project">Project</Label>
              {defaultProjectId ? (
                <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                  {defaultProjectName || projects.find((p: any) => p.id === defaultProjectId)?.name || "Selected Project"}
                </div>
              ) : (
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger data-testid="select-project">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project: any) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            {projectId && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="epic">Epic</Label>
                  <Select value={epicId} onValueChange={setEpicId} disabled={epicsLoading}>
                    <SelectTrigger data-testid="select-epic">
                      <SelectValue placeholder={epicsLoading ? "Loading epics..." : "Select an epic"} />
                    </SelectTrigger>
                    <SelectContent>
                      {epics.map((epic: any) => (
                        <SelectItem key={epic.id} value={epic.id}>
                          {epic.title}
                        </SelectItem>
                      ))}
                      {epics.length === 0 && !epicsLoading && (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No epics found for this project
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="stage">Stage</Label>
                  <Select value={stageId} onValueChange={setStageId} disabled={stagesLoading}>
                    <SelectTrigger data-testid="select-stage">
                      <SelectValue placeholder={stagesLoading ? "Loading stages..." : "Select a stage"} />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage: any) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                      {stages.length === 0 && !stagesLoading && (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No stages found for this project
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="grid gap-2">
              <Label htmlFor="deadline">Due Date</Label>
              <Input
                id="deadline"
                type="date"
                data-testid="input-deadline"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger data-testid="select-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && (
              <p className="text-sm text-destructive" data-testid="error-message">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTaskMutation.isPending}
              data-testid="button-create-task"
            >
              {createTaskMutation.isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
