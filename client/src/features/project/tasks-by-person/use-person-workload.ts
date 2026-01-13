import { useMemo } from "react";
import { differenceInDays, parseISO, startOfWeek, endOfWeek, addDays } from "date-fns";
import type { PersonWorkload, PersonWorkloadMetrics, TaskWithContext, TasksByPersonFilters, ScopeGroup } from "./types";

interface UsePersonWorkloadParams {
  tasks: any[];
  users: any[];
  epics: any[];
  sprints: any[];
  milestones: any[];
  deliverables: any[];
  projectId: string;
  currentUserId?: string;
  justMyTasks: boolean;
}

export function usePersonWorkload({
  tasks,
  users,
  epics,
  sprints,
  milestones,
  deliverables,
  projectId,
  currentUserId,
  justMyTasks,
}: UsePersonWorkloadParams): PersonWorkload[] {
  return useMemo(() => {
    const projectTasks = tasks.filter((t: any) => t.projectId === projectId);
    
    const userTasksMap = new Map<string, any[]>();
    
    projectTasks.forEach((task: any) => {
      if (task.assigneeId) {
        const existing = userTasksMap.get(task.assigneeId) || [];
        existing.push(task);
        userTasksMap.set(task.assigneeId, existing);
      }
    });

    const relevantUserIds = justMyTasks && currentUserId 
      ? [currentUserId]
      : Array.from(userTasksMap.keys());

    const workloads: PersonWorkload[] = relevantUserIds.map((userId) => {
      const user = users.find((u: any) => u.id === userId);
      const userTasks = userTasksMap.get(userId) || [];
      
      const tasksWithContext: TaskWithContext[] = userTasks.map((task: any) => {
        const epic = epics.find((e: any) => e.id === task.epicId);
        const sprint = sprints.find((s: any) => s.id === task.sprintId);
        const milestone = milestones.find((m: any) => m.id === task.milestoneId);
        const deliverable = epic ? deliverables.find((d: any) => d.id === epic.deliverableId) : null;
        
        return {
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          deadline: task.deadline,
          blocked: task.blocked || false,
          blockerReason: task.blockerReason,
          epicId: task.epicId,
          epicTitle: epic?.title,
          sprintId: task.sprintId,
          sprintName: sprint?.name,
          milestoneId: task.milestoneId,
          milestoneName: milestone?.name,
          deliverableId: deliverable?.id,
          deliverableName: deliverable?.name,
          effort: task.effort,
        };
      });

      const metrics = calculateMetrics(tasksWithContext);
      const status = determineStatus(metrics);

      return {
        userId,
        userName: user?.name || user?.firstName || "Unknown User",
        userAvatar: user?.avatarUrl,
        userRole: user?.role,
        metrics,
        status,
        tasks: tasksWithContext,
      };
    });

    return workloads.sort((a, b) => b.metrics.totalTasks - a.metrics.totalTasks);
  }, [tasks, users, epics, sprints, milestones, deliverables, projectId, currentUserId, justMyTasks]);
}

function calculateMetrics(tasks: TaskWithContext[]): PersonWorkloadMetrics {
  const now = new Date();
  const weekEnd = endOfWeek(now);
  
  const completedStatuses = ["Done", "Completed", "COMPLETED", "DONE"];
  
  const completed = tasks.filter(t => completedStatuses.includes(t.status));
  const open = tasks.filter(t => !completedStatuses.includes(t.status));
  
  const overdue = open.filter(t => {
    if (!t.deadline) return false;
    return differenceInDays(parseISO(t.deadline), now) < 0;
  });
  
  const dueSoon = open.filter(t => {
    if (!t.deadline) return false;
    const deadline = parseISO(t.deadline);
    const daysUntil = differenceInDays(deadline, now);
    return daysUntil >= 0 && daysUntil <= 7;
  });
  
  const blocked = open.filter(t => t.blocked);
  
  return {
    totalTasks: tasks.length,
    completedTasks: completed.length,
    overdueTasks: overdue.length,
    blockedTasks: blocked.length,
    dueSoonTasks: dueSoon.length,
    completionPercent: tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0,
    hasSprintTasks: tasks.some(t => t.sprintId),
    hasMilestoneTasks: tasks.some(t => t.milestoneId),
    hasDeliverableTasks: tasks.some(t => t.deliverableId),
    hasUnscopedTasks: tasks.some(t => !t.sprintId && !t.milestoneId && !t.deliverableId),
  };
}

function determineStatus(metrics: PersonWorkloadMetrics): "on-track" | "at-risk" | "off-track" {
  if (metrics.overdueTasks > 0 || metrics.blockedTasks >= 3) {
    return "off-track";
  }
  if (metrics.blockedTasks > 0 || metrics.dueSoonTasks >= 3) {
    return "at-risk";
  }
  return "on-track";
}

export function filterTasks(
  tasks: TaskWithContext[],
  filters: TasksByPersonFilters
): TaskWithContext[] {
  return tasks.filter(task => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (!task.title.toLowerCase().includes(search)) {
        return false;
      }
    }

    if (filters.scope !== "all") {
      if (filters.scope === "sprint" && !task.sprintId) return false;
      if (filters.scope === "milestone" && !task.milestoneId) return false;
      if (filters.scope === "deliverable" && !task.deliverableId) return false;
      if (filters.scope === "unscoped" && (task.sprintId || task.milestoneId || task.deliverableId)) return false;
      
      if (filters.scopeId) {
        if (filters.scope === "sprint" && task.sprintId !== filters.scopeId) return false;
        if (filters.scope === "milestone" && task.milestoneId !== filters.scopeId) return false;
        if (filters.scope === "deliverable" && task.deliverableId !== filters.scopeId) return false;
      }
    }

    if (filters.statuses.length > 0 && !filters.statuses.includes(task.status)) {
      return false;
    }

    if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) {
      return false;
    }

    if (filters.blockedOnly && !task.blocked) {
      return false;
    }

    if (filters.dueDateFilter !== "all" && task.deadline) {
      const now = new Date();
      const deadline = parseISO(task.deadline);
      const daysUntil = differenceInDays(deadline, now);
      
      if (filters.dueDateFilter === "overdue" && daysUntil >= 0) return false;
      if (filters.dueDateFilter === "this-week" && (daysUntil < 0 || daysUntil > 7)) return false;
      if (filters.dueDateFilter === "upcoming" && daysUntil <= 7) return false;
    }

    return true;
  });
}

export function groupTasksByScope(
  tasks: TaskWithContext[],
  scope: "sprint" | "milestone" | "deliverable"
): ScopeGroup[] {
  const groups = new Map<string, ScopeGroup>();
  
  tasks.forEach(task => {
    let groupId: string | undefined;
    let groupName: string | undefined;
    
    if (scope === "sprint") {
      groupId = task.sprintId;
      groupName = task.sprintName;
    } else if (scope === "milestone") {
      groupId = task.milestoneId;
      groupName = task.milestoneName;
    } else if (scope === "deliverable") {
      groupId = task.deliverableId;
      groupName = task.deliverableName;
    }
    
    if (!groupId) {
      groupId = "unscoped";
      groupName = "Unscoped";
    }
    
    const existing = groups.get(groupId);
    if (existing) {
      existing.tasks.push(task);
    } else {
      groups.set(groupId, {
        id: groupId,
        name: groupName || "Unknown",
        type: groupId === "unscoped" ? "unscoped" : scope,
        tasks: [task],
      });
    }
  });
  
  return Array.from(groups.values());
}
