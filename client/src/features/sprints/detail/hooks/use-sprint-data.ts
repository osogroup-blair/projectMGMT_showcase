import { useMemo } from "react";
import { useSprints, useTasks, useProject, useUsers, useEpics, useMilestones, useDeliverables, useSprintScopeTargets, useSuggestedTasks, useProjectStages, useResolvedTaskTypes } from "@/hooks/use-nexus-data";
import { useTaskStatuses } from "@/hooks/use-task-statuses";
import { useCompletedStatuses } from "@/hooks/use-completed-statuses";
import { useQuery } from "@tanstack/react-query";
import type { SprintStats } from "../types";

export function useSprintData(projectId: string, sprintId: string) {
  const { data: project } = useProject(projectId);
  const { data: allSprints, update: updateSprint, remove: deleteSprint } = useSprints();
  const { data: allTasks, update: updateTask, create: createTask } = useTasks();
  const { data: users } = useUsers();
  const { data: allEpics } = useEpics();
  const { data: allMilestones } = useMilestones();
  const { data: allDeliverables } = useDeliverables();
  const { data: allStages } = useProjectStages();

  const scopeTargets = useSprintScopeTargets(sprintId);
  const { data: suggestedTasks = [], isLoading: loadingSuggested } = useSuggestedTasks(sprintId);
  const { data: taskTypes } = useResolvedTaskTypes(projectId);
  const { statuses: taskStatuses, statusLabels, getStatusColor, defaultStatus, isNotStartedStatus, isInProgressStatus, isCompletedStatus } = useTaskStatuses();
  const { isTaskComplete } = useCompletedStatuses();

  const { data: pulseUpdates = [] } = useQuery({
    queryKey: ["sprint-pulse", sprintId],
    queryFn: async () => {
      const res = await fetch(`/api/sprints/${sprintId}/pulse`);
      if (!res.ok) throw new Error("Failed to fetch pulse updates");
      return res.json();
    },
    enabled: !!sprintId,
  });

  const sprint = useMemo(() => 
    (allSprints || []).find((s: any) => s.id === sprintId),
    [allSprints, sprintId]
  );

  const projectSprints = useMemo(() => 
    (allSprints || []).filter((s: any) => s.projectId === projectId),
    [allSprints, projectId]
  );

  const sprintTasks = useMemo(() => 
    (allTasks || []).filter((t: any) => t.sprintId === sprintId),
    [allTasks, sprintId]
  );

  const backlogTasks = useMemo(() => 
    (allTasks || []).filter((t: any) => 
      (t.projectId === projectId || t.project === projectId) && 
      !t.sprintId
    ),
    [allTasks, projectId]
  );

  const projectTasks = useMemo(() => 
    (allTasks || []).filter((t: any) => t.projectId === projectId || t.project === projectId),
    [allTasks, projectId]
  );

  const sprintTaskIds = useMemo(() => 
    sprintTasks.map((t: any) => t.id),
    [sprintTasks]
  );

  const projectDeliverables = useMemo(() => 
    (allDeliverables || []).filter((d: any) => d.projectId === projectId),
    [allDeliverables, projectId]
  );

  const projectDeliverableIds = useMemo(() => 
    new Set(projectDeliverables.map((d: any) => d.id)),
    [projectDeliverables]
  );

  const projectEpics = useMemo(() => 
    (allEpics || []).filter((e: any) => projectDeliverableIds.has(e.deliverableId)),
    [allEpics, projectDeliverableIds]
  );

  const projectMilestones = useMemo(() => 
    (allMilestones || []).filter((m: any) => m.projectId === projectId),
    [allMilestones, projectId]
  );

  const projectStages = useMemo(() => 
    (allStages || []).filter((s: any) => s.projectId === projectId),
    [allStages, projectId]
  );

  const stats: SprintStats = useMemo(() => {
    const total = sprintTasks.length;
    const done = sprintTasks.filter((t: any) => isTaskComplete(t.status)).length;
    const inProgress = sprintTasks.filter((t: any) => t.status === "In Progress").length;
    const toDo = sprintTasks.filter((t: any) => t.status === "To Do" || t.status === "Pending").length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    const totalEffort = sprintTasks.reduce((sum: number, t: any) => sum + (t.effort || 0), 0);
    const doneEffort = sprintTasks.filter((t: any) => isTaskComplete(t.status))
      .reduce((sum: number, t: any) => sum + (t.effort || 0), 0);
    return { total, done, inProgress, toDo, percent, totalEffort, doneEffort };
  }, [sprintTasks]);

  const linkedEpics = useMemo(() => {
    const epicIds = new Set(sprintTasks.map((t: any) => t.epicId).filter(Boolean));
    return (allEpics || []).filter((e: any) => epicIds.has(e.id));
  }, [sprintTasks, allEpics]);

  const linkedMilestones = useMemo(() => {
    const milestoneIds = new Set(sprintTasks.map((t: any) => t.milestoneId).filter(Boolean));
    return (allMilestones || []).filter((m: any) => milestoneIds.has(m.id));
  }, [sprintTasks, allMilestones]);

  const formattedStatusOptions = useMemo(() => 
    taskStatuses.map((s) => ({ id: s.id, label: s.label, color: s.color })),
    [taskStatuses]
  );

  const getUser = (userId?: string) => {
    if (!userId) return null;
    return (users || []).find((u: any) => u.id === userId);
  };

  const getEpic = (epicId?: string) => {
    if (!epicId) return null;
    return (allEpics || []).find((e: any) => e.id === epicId);
  };

  const currentScopeMode = useMemo(() => {
    if (scopeTargets.data.length === 0) return null;
    return scopeTargets.data[0].targetType as "epic" | "milestone" | "stage";
  }, [scopeTargets.data]);

  const selectedScopeIds = useMemo(() => 
    scopeTargets.data.map((t: any) => t.targetId),
    [scopeTargets.data]
  );

  return {
    project,
    sprint,
    projectSprints,
    sprintTasks,
    backlogTasks,
    projectTasks,
    sprintTaskIds,
    projectDeliverables,
    projectEpics,
    projectMilestones,
    projectStages,
    stats,
    linkedEpics,
    linkedMilestones,
    users,
    taskTypes,
    taskStatuses,
    formattedStatusOptions,
    scopeTargets,
    suggestedTasks,
    loadingSuggested,
    pulseUpdates,
    currentScopeMode,
    selectedScopeIds,
    getUser,
    getEpic,
    updateSprint,
    deleteSprint,
    updateTask,
    createTask,
    isReadOnly: sprint?.status === "closed",
    isPartiallyLocked: sprint?.status === "active",
  };
}
