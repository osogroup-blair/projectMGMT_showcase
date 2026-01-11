import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PortableKanban } from "@/components/kanban/portable-kanban";
import { useCurrentUser } from "@/context/current-user-context";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { useStatusOptions } from "@/hooks/use-nexus-data";

interface StatusOption {
  id: string;
  label: string;
  color?: string;
}

interface Sprint {
  id: string;
  name: string;
  projectId: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  effort?: number;
  estimateHours?: number;
  assigneeId?: string;
  deadline?: string;
  blocked?: boolean;
  blockerReason?: string;
  updatedAt?: string;
  projectId: string;
  projectName?: string;
  epicId?: string;
  epicName?: string;
  deliverableId?: string;
  deliverableName?: string;
  sprintId?: string;
  sprintName?: string;
  milestoneId?: string;
  milestoneName?: string;
  stageId?: string;
  stageName?: string;
}

interface User {
  id: string;
  name: string;
}

export function CurrentTasksPanel() {
  const { currentUserId } = useCurrentUser();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/home/tasks", currentUserId],
    queryFn: async () => {
      const response = await fetch(`/api/home/tasks/${currentUserId}`);
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    },
    enabled: !!currentUserId,
  });

  const { data: statusOptions = [] } = useStatusOptions();

  const { data: sprints = [] } = useQuery({
    queryKey: ["/api/sprints"],
    queryFn: async () => {
      const response = await fetch("/api/sprints");
      if (!response.ok) throw new Error("Failed to fetch sprints");
      return response.json();
    },
  });

  const { data: usersData } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });
  const users = usersData?.users || [];

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
  });

  // Create a stable lookup map for task projectIds
  const taskProjectMap = useMemo(() => {
    const map = new Map<string, string>();
    tasks.forEach((t: any) => {
      if (t.id && t.projectId) {
        map.set(t.id, t.projectId);
      }
    });
    return map;
  }, [tasks]);

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, projectId, updates }: { taskId: string; projectId: string; updates: Partial<Task> }) => {
      const response = await apiRequest("PATCH", `/api/projects/${projectId}/tasks/${taskId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/home/tasks"] });
    },
  });

  const currentUser = users.find((u: User) => u.id === currentUserId);

  const addCommentMutation = useMutation({
    mutationFn: async ({ taskId, comment }: { taskId: string; comment: string }) => {
      const response = await apiRequest("POST", `/api/comments`, {
        taskId,
        body: comment,
        authorId: currentUserId,
        authorName: currentUser?.name || "Unknown User",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/home/tasks"] });
    },
  });

  const handleStatusChange = (taskId: string, newStatus: string) => {
    const projectId = taskProjectMap.get(taskId);
    if (!projectId) return;
    updateTaskMutation.mutate({ taskId, projectId, updates: { status: newStatus } });
  };

  const handleBlockedToggle = (taskId: string, blocked: boolean) => {
    const projectId = taskProjectMap.get(taskId);
    if (!projectId) return;
    updateTaskMutation.mutate({ taskId, projectId, updates: { blocked } });
  };

  const handleDueDateChange = (taskId: string, date: Date | null) => {
    const projectId = taskProjectMap.get(taskId);
    if (!projectId) return;
    const deadline = date ? format(date, "yyyy-MM-dd") : undefined;
    updateTaskMutation.mutate({ taskId, projectId, updates: { deadline } });
  };

  const handleAddComment = (taskId: string, comment: string) => {
    addCommentMutation.mutate({ taskId, comment });
  };

  const handleAssigneeChange = (taskId: string, assigneeId: string | null) => {
    const projectId = taskProjectMap.get(taskId);
    if (!projectId) return;
    updateTaskMutation.mutate({ taskId, projectId, updates: { assigneeId: assigneeId ?? undefined } });
  };

  const handleTaskMove = (taskId: string, newStatus: string) => {
    const projectId = taskProjectMap.get(taskId);
    if (!projectId) return;
    updateTaskMutation.mutate({ taskId, projectId, updates: { status: newStatus } });
  };

  const enrichedTasks: Task[] = tasks.map((t: any) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    priority: t.priority,
    effort: t.effort,
    estimateHours: t.estimateHours,
    assigneeId: t.assigneeId,
    assigneeName: users.find((u: User) => u.id === t.assigneeId)?.name,
    deadline: t.deadline,
    blocked: t.blocked,
    blockerReason: t.blockerReason,
    updatedAt: t.updatedAt,
    projectId: t.projectId,
    projectName: t.projectName || t.project,
    epicId: t.epicId,
    epicName: t.epicTitle,
    deliverableId: t.deliverableId,
    deliverableName: t.deliverableTitle,
    sprintId: t.sprintId,
    sprintName: sprints.find((s: Sprint) => s.id === t.sprintId)?.name,
    milestoneId: t.milestoneId,
    stageId: t.stageId,
  }));

  const formattedStatusOptions: StatusOption[] = statusOptions.map((s: any) => ({
    id: s.id,
    label: s.label,
    color: s.color,
  }));

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (enrichedTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <p className="text-lg font-medium text-muted-foreground">No tasks assigned</p>
        <p className="text-sm text-muted-foreground mt-1">
          Tasks assigned to you will appear here across all projects.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-280px)] min-h-[500px]">
      <PortableKanban
        tasks={enrichedTasks}
        users={users}
        projects={projects}
        projectId="cross-project"
        boardId="home-current-tasks"
        showFilters={true}
        showAssigneeFilter={false}
        hoverCard={{
          enabled: true,
          users: users,
          onAssigneeChange: handleAssigneeChange,
          onAddComment: handleAddComment,
          onDueDateChange: handleDueDateChange,
        }}
        onTaskMove={handleTaskMove}
      />
    </div>
  );
}
