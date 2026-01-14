import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useCurrentUser } from "@/context/current-user-context";
import { format as formatDate } from "date-fns";

interface UseSprintActionsProps {
  sprintId: string;
  projectId: string;
  sprint: any;
  projectSprints: any[];
  updateSprint: (params: { id: string; updates: any }) => void;
  deleteSprint: (id: string) => void;
  updateTask: (params: { id: string; updates: any }) => void;
  createTask: (task: any) => Promise<any>;
  taskTypes: any[];
  setLocation: (path: string) => void;
}

export function useSprintActions({
  sprintId,
  projectId,
  sprint,
  projectSprints,
  updateSprint,
  deleteSprint,
  updateTask,
  createTask,
  taskTypes,
  setLocation,
}: UseSprintActionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();

  const addCommentMutation = useMutation({
    mutationFn: async ({ taskId, comment, authorId, authorName }: { taskId: string; comment: string; authorId: string; authorName: string }) => {
      const response = await apiRequest("POST", `/api/comments`, {
        taskId,
        body: comment,
        authorId,
        authorName,
      });
      return response.json();
    },
  });

  const postPulseMutation = useMutation({
    mutationFn: async (data: { didText: string; nextText: string; blockersText: string; referencedTaskIds: string[] }) => {
      const res = await fetch(`/api/sprints/${sprintId}/pulse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id,
          date: formatDate(new Date(), "yyyy-MM-dd"),
          ...data,
        }),
      });
      if (!res.ok) throw new Error("Failed to post pulse update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprint-pulse", sprintId] });
      toast({ title: "Pulse update posted" });
    },
  });

  const handleStatusChange = useCallback((taskId: string, newStatus: string) => {
    updateTask({ id: taskId, updates: { status: newStatus } });
  }, [updateTask]);

  const handleBlockedToggle = useCallback((taskId: string, blocked: boolean) => {
    updateTask({ id: taskId, updates: { blocked } });
  }, [updateTask]);

  const handleDueDateChange = useCallback((taskId: string, date: Date | null) => {
    const deadline = date ? formatDate(date, "yyyy-MM-dd") : undefined;
    updateTask({ id: taskId, updates: { deadline } });
  }, [updateTask]);

  const handleAddComment = useCallback((taskId: string, comment: string) => {
    if (currentUser?.id && currentUser?.name) {
      addCommentMutation.mutate({ taskId, comment, authorId: currentUser.id, authorName: currentUser.name });
    }
  }, [currentUser, addCommentMutation]);

  const handleAssigneeChange = useCallback((taskId: string, assigneeId: string | null) => {
    updateTask({ id: taskId, updates: { assigneeId } });
  }, [updateTask]);

  const handleSaveName = useCallback((editName: string, setIsEditingName: (v: boolean) => void) => {
    if (editName.trim() && editName !== sprint?.name) {
      updateSprint({ id: sprintId, updates: { name: editName.trim() } });
      toast({ title: "Sprint name updated" });
    }
    setIsEditingName(false);
  }, [sprint, sprintId, updateSprint, toast]);

  const handleSaveGoal = useCallback((editGoal: string, setIsEditingGoal: (v: boolean) => void) => {
    if (editGoal !== sprint?.goal) {
      updateSprint({ id: sprintId, updates: { goal: editGoal || null } });
      toast({ title: "Sprint goal updated" });
    }
    setIsEditingGoal(false);
  }, [sprint, sprintId, updateSprint, toast]);

  const handleSaveDates = useCallback((editStartDate: string, editEndDate: string, setIsEditingDates: (v: boolean) => void) => {
    updateSprint({ 
      id: sprintId, 
      updates: { 
        startDate: editStartDate || null, 
        endDate: editEndDate || null 
      } 
    });
    setIsEditingDates(false);
    toast({ title: "Sprint dates updated" });
  }, [sprintId, updateSprint, toast]);

  const handleAutoStartToggle = useCallback(async (checked: boolean) => {
    try {
      await fetch(`/api/sprints/${sprintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoStart: checked }),
      });
      updateSprint({ id: sprintId, updates: { autoStart: checked } });
      toast({ title: checked ? "Auto-start enabled" : "Auto-start disabled" });
    } catch (error: any) {
      toast({ title: "Failed to update auto-start setting", variant: "destructive" });
    }
  }, [sprintId, updateSprint, toast]);

  const handleSaveCapacity = useCallback((editCapacity: string, setIsEditingCapacity: (v: boolean) => void) => {
    const hours = parseInt(editCapacity) || null;
    updateSprint({ id: sprintId, updates: { capacityHours: hours } });
    setIsEditingCapacity(false);
    toast({ title: "Team capacity updated" });
  }, [sprintId, updateSprint, toast]);

  const handleStartSprint = useCallback(async () => {
    const hasActive = projectSprints.some((s: any) => s.status === "active" && s.id !== sprintId);
    if (hasActive) {
      toast({ title: "Another sprint is already active", description: "Close the active sprint first.", variant: "destructive" });
      return;
    }
    try {
      const response = await fetch(`/api/sprints/${sprintId}/start`, { method: "POST" });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error);
      }
      updateSprint({ id: sprintId, updates: { status: "active" } });
      toast({ title: "Sprint started" });
    } catch (error: any) {
      toast({ title: "Failed to start sprint", description: error.message, variant: "destructive" });
    }
  }, [projectSprints, sprintId, updateSprint, toast]);

  const handleCloseSprint = useCallback(async () => {
    try {
      const response = await fetch(`/api/sprints/${sprintId}/close`, { method: "POST" });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error);
      }
      const result = await response.json();
      updateSprint({ id: sprintId, updates: { status: "closed", closedAt: new Date().toISOString() } });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      
      // Show rollover summary if tasks were moved
      if (result.rolloverSummary) {
        const { completedTasks, rolledOverTasks, movedToBacklog, nextSprintName } = result.rolloverSummary;
        let description = `${completedTasks} tasks completed.`;
        if (rolledOverTasks > 0) {
          description += ` ${rolledOverTasks} tasks rolled over to ${nextSprintName}.`;
        }
        if (movedToBacklog > 0) {
          description += ` ${movedToBacklog} tasks moved to backlog.`;
        }
        toast({ title: "Sprint closed", description });
      } else {
        toast({ title: "Sprint closed" });
      }
    } catch (error: any) {
      toast({ title: "Failed to close sprint", description: error.message, variant: "destructive" });
    }
  }, [sprintId, updateSprint, queryClient, toast]);

  const handleCloseSprintWithRollover = useCallback(async () => {
    const response = await fetch(`/api/sprints/${sprintId}/close`, { method: "POST" });
    if (!response.ok) {
      const err = await response.json();
      toast({ title: "Failed to close sprint", description: err.error, variant: "destructive" });
      throw new Error(err.error);
    }
    const result = await response.json();
    updateSprint({ id: sprintId, updates: { status: "closed", closedAt: new Date().toISOString() } });
    queryClient.invalidateQueries({ queryKey: ["sprints"] });
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    
    // Show rollover summary
    if (result.rolloverSummary) {
      const { completedTasks, rolledOverTasks, movedToBacklog, nextSprintName } = result.rolloverSummary;
      let description = `${completedTasks} tasks completed.`;
      if (rolledOverTasks > 0) {
        description += ` ${rolledOverTasks} tasks rolled over to ${nextSprintName}.`;
      }
      if (movedToBacklog > 0) {
        description += ` ${movedToBacklog} tasks moved to backlog.`;
      }
      toast({ title: "Sprint closed successfully", description });
    } else {
      toast({ title: "Sprint closed successfully" });
    }
    setLocation(`/projects/${projectId}?tab=sprints`);
  }, [sprintId, projectId, updateSprint, queryClient, toast, setLocation]);

  const handleNotesChange = useCallback(async (notes: string) => {
    try {
      await fetch(`/api/sprints/${sprintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      updateSprint({ id: sprintId, updates: { notes } });
      toast({ title: "Sprint notes saved" });
    } catch (error: any) {
      toast({ title: "Failed to save notes", description: error.message, variant: "destructive" });
    }
  }, [sprintId, updateSprint, toast]);

  const handleRolloverTasks = useCallback(async (decisions: { taskId: string; action: string; targetSprintId?: string }[]) => {
    const nextSprint = projectSprints
      .filter((s: any) => s.id !== sprintId && s.status === "planned")
      .sort((a: any, b: any) => (a.startDate || "").localeCompare(b.startDate || ""))[0];

    for (const decision of decisions) {
      let response: Response;
      if (decision.action === "next_sprint") {
        const targetId = decision.targetSprintId || nextSprint?.id;
        if (targetId) {
          response = await fetch(`/api/tasks/${decision.taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sprintId: targetId }),
          });
          if (!response.ok) {
            toast({ title: "Failed to rollover tasks", description: "Could not move task to next sprint", variant: "destructive" });
            throw new Error("Failed to move task to next sprint");
          }
          updateTask({ id: decision.taskId, updates: { sprintId: targetId } });
        } else {
          response = await fetch(`/api/tasks/${decision.taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sprintId: null }),
          });
          if (!response.ok) {
            toast({ title: "Failed to rollover tasks", description: "Could not move task to backlog", variant: "destructive" });
            throw new Error("Failed to move task to backlog");
          }
          updateTask({ id: decision.taskId, updates: { sprintId: null } });
        }
      } else if (decision.action === "backlog") {
        response = await fetch(`/api/tasks/${decision.taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sprintId: null }),
        });
        if (!response.ok) {
          toast({ title: "Failed to rollover tasks", description: "Could not move task to backlog", variant: "destructive" });
          throw new Error("Failed to move task to backlog");
        }
        updateTask({ id: decision.taskId, updates: { sprintId: null } });
      } else if (decision.action === "close") {
        response = await fetch(`/api/tasks/${decision.taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Done", sprintId: null }),
        });
        if (!response.ok) {
          toast({ title: "Failed to rollover tasks", description: "Could not close task", variant: "destructive" });
          throw new Error("Failed to close task");
        }
        updateTask({ id: decision.taskId, updates: { status: "Done", sprintId: null } });
      }
    }
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  }, [projectSprints, sprintId, updateTask, queryClient, toast]);

  const handleAddTasks = useCallback(async (selectedTasks: string[], clearSelection: () => void, closeDialog: () => void) => {
    if (selectedTasks.length === 0) return;
    try {
      await fetch(`/api/sprints/${sprintId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: selectedTasks })
      });
      const updates: any = { sprintId };
      if (sprint?.endDate) {
        updates.dueDate = sprint.endDate;
      }
      selectedTasks.forEach(taskId => {
        updateTask({ id: taskId, updates });
      });
      clearSelection();
      closeDialog();
      toast({ title: `${selectedTasks.length} task(s) added to sprint` });
    } catch (error: any) {
      toast({ title: "Failed to add tasks", description: error.message, variant: "destructive" });
    }
  }, [sprintId, sprint, updateTask, toast]);

  const handleCreateNewTask = useCallback(async (
    newTaskTitle: string,
    newTaskEpicId: string,
    newTaskStageId: string,
    clearForm: () => void,
    closeDialog: () => void
  ) => {
    if (!newTaskTitle.trim() || !newTaskEpicId || !newTaskStageId) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    const actionType = (taskTypes || []).find((tt: any) => tt.name === "Action");
    const defaultTaskType = actionType || (taskTypes || []).find((tt: any) => tt.isDefault) || (taskTypes || [])[0];
    
    try {
      const newTask = {
        title: newTaskTitle,
        epicId: newTaskEpicId,
        stageId: newTaskStageId,
        projectId,
        sprintId,
        status: "BACKLOGGED",
        deadline: sprint?.endDate || null,
        taskTypeId: defaultTaskType?.id || null,
        assigneeId: currentUser?.id || null,
      };
      await createTask(newTask);
      closeDialog();
      clearForm();
      toast({ title: "Task created and added to sprint" });
    } catch (error: any) {
      toast({ title: "Failed to create task", description: error.message, variant: "destructive" });
    }
  }, [taskTypes, projectId, sprintId, sprint, currentUser, createTask, toast]);

  const handleRemoveTask = useCallback(async (taskId: string) => {
    try {
      await fetch(`/api/sprints/${sprintId}/tasks/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: [taskId] })
      });
      updateTask({ id: taskId, updates: { sprintId: null } });
      toast({ title: "Task removed from sprint" });
    } catch (error: any) {
      toast({ title: "Failed to remove task", description: error.message, variant: "destructive" });
    }
  }, [sprintId, updateTask, toast]);

  const handleDeleteSprint = useCallback(async () => {
    if (!confirm("Are you sure you want to delete this sprint? This action cannot be undone.")) return;
    try {
      await fetch(`/api/sprints/${sprintId}`, { method: "DELETE" });
      deleteSprint(sprintId);
      toast({ title: "Sprint deleted" });
      setLocation(`/projects/${projectId}?tab=sprints`);
    } catch (error: any) {
      toast({ title: "Failed to delete sprint", description: error.message, variant: "destructive" });
    }
  }, [sprintId, projectId, deleteSprint, toast, setLocation]);

  const handleTaskMove = useCallback(async (taskId: string, newStatus: string, blockerReason?: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === "Blocked") {
        updates.blocked = true;
        updates.blockerReason = blockerReason || null;
      } else {
        updates.blocked = false;
        updates.blockerReason = null;
      }
      updates.updatedAt = new Date().toISOString();
      
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      updateTask({ id: taskId, updates });
      toast({ title: `Task moved to ${newStatus}` });
    } catch (error: any) {
      toast({ title: "Failed to move task", description: error.message, variant: "destructive" });
    }
  }, [updateTask, toast]);

  return {
    handleStatusChange,
    handleBlockedToggle,
    handleDueDateChange,
    handleAddComment,
    handleAssigneeChange,
    handleSaveName,
    handleSaveGoal,
    handleSaveDates,
    handleAutoStartToggle,
    handleSaveCapacity,
    handleStartSprint,
    handleCloseSprint,
    handleCloseSprintWithRollover,
    handleNotesChange,
    handleRolloverTasks,
    handleAddTasks,
    handleCreateNewTask,
    handleRemoveTask,
    handleDeleteSprint,
    handleTaskMove,
    postPulseMutation,
    currentUser,
  };
}
