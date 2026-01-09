import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db, NexusDB } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

// Helper to invalidate all queries related to a collection
function invalidateCollectionQueries(queryClient: ReturnType<typeof useQueryClient>, collection: string) {
  // Invalidate all queries that start with the collection name
  queryClient.invalidateQueries({ 
    predicate: (query) => {
      const key = query.queryKey;
      if (Array.isArray(key) && key[0] === collection) return true;
      // Also invalidate related collections for nested data
      if (collection === 'projects') {
        return key[0] === 'deliverables' || key[0] === 'epics' || key[0] === 'tasks' || key[0] === 'milestones';
      }
      if (collection === 'deliverables') {
        return key[0] === 'epics' || key[0] === 'tasks';
      }
      if (collection === 'epics') {
        return key[0] === 'tasks';
      }
      return false;
    }
  });
}

// Generic Hook Factory
function useCollection<K extends keyof NexusDB>(collection: K, sortFn?: (a: any, b: any) => number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: [collection],
    queryFn: async () => {
      const data = await db.getAll(collection);
      return sortFn ? [...data].sort(sortFn) : data;
    },
  });

  const create = useMutation({
    mutationFn: (newItem: any) => db.create(collection, newItem),
    onSuccess: () => {
      invalidateCollectionQueries(queryClient, collection as string);
      toast({ title: "Created successfully" });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => db.update(collection, id, updates),
    onSuccess: (_, variables) => {
      invalidateCollectionQueries(queryClient, collection as string);
      // Also invalidate the specific item query
      queryClient.invalidateQueries({ queryKey: [collection, variables.id] });
      toast({ title: "Updated successfully" });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => db.delete(collection, id),
    onSuccess: (_, id) => {
      invalidateCollectionQueries(queryClient, collection as string);
      // Also remove the specific item from cache
      queryClient.removeQueries({ queryKey: [collection, id] });
      toast({ title: "Deleted successfully" });
    },
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    create: create.mutate,
    createAsync: create.mutateAsync,
    update: update.mutate,
    updateAsync: update.mutateAsync,
    remove: remove.mutate,
    removeAsync: remove.mutateAsync,
    refetch: query.refetch,
  };
}

// Specialized Hooks
export const useProjects = () => useCollection("projects");
export const useDeliverables = () => useCollection("deliverables");
export const useEpics = () => useCollection("epics");
export const useTasks = () => useCollection("tasks");
export const useMilestones = () => useCollection("milestones");
export const useUsers = () => useCollection("users");
export const useActivity = () => useCollection("activity");
export const useProjectRoles = () => useCollection("projectRoles");
export const useRoleAssignments = () => useCollection("roleAssignments");
export const useSavedViews = () => useCollection("savedViews");
export const useGuidanceItems = () => useCollection("guidanceItems");
export const useProjectStages = () => useCollection("projectStages");
export const useFrameworkTemplates = () => useCollection("frameworkTemplates");
export const useStageTemplates = () => useCollection("stageTemplates");
export const useProjectTemplates = () => useCollection("projectTemplates");
export const useDeliverableTemplates = () => useCollection("deliverableTemplates");
export const useEpicTemplates = () => useCollection("epicTemplates");
export const useTaskTemplates = () => useCollection("taskTemplates");
export const useRoleTemplates = () => useCollection("roleTemplates");
export const useMappingTemplates = () => useCollection("mappingTemplates");
export const useStatusOptions = () => useCollection("statusOptions");
export const useMilestoneScopeRules = () => useCollection("milestoneScopeRules");
export const useMilestoneTaskLinks = () => useCollection("milestoneTaskLinks");
export const useRoleTypes = () => useCollection("roleTypes");
export const useSprints = () => useCollection("sprints");
export const useSprintMembers = () => useCollection("sprintMembers");
export const useTaskTypes = () => useCollection("taskTypes");

// Single Item Hooks
export function useProject(id: string) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: () => db.getById("projects", id),
    enabled: !!id,
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ["tasks", id],
    queryFn: () => db.getById("tasks", id),
    enabled: !!id,
  });
}

// Sprint Scope Targets Hook
export function useSprintScopeTargets(sprintId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["sprintScopeTargets", sprintId],
    queryFn: async () => {
      if (!sprintId) return [];
      const response = await fetch(`/api/sprints/${sprintId}/scope-targets`);
      if (!response.ok) throw new Error("Failed to fetch scope targets");
      return response.json();
    },
    enabled: !!sprintId,
  });

  const addTarget = useMutation({
    mutationFn: async (target: { targetType: string; targetId: string; autoSyncTasks?: boolean }) => {
      const response = await fetch(`/api/sprints/${sprintId}/scope-targets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(target),
      });
      if (!response.ok) throw new Error("Failed to add scope target");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprintScopeTargets", sprintId] });
      queryClient.invalidateQueries({ queryKey: ["suggestedTasks", sprintId] });
    },
  });

  const removeTarget = useMutation({
    mutationFn: async (targetId: string) => {
      const response = await fetch(`/api/sprints/${sprintId}/scope-targets/${targetId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to remove scope target");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprintScopeTargets", sprintId] });
      queryClient.invalidateQueries({ queryKey: ["suggestedTasks", sprintId] });
    },
  });

  const clearAllTargets = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/sprints/${sprintId}/scope-targets`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to clear scope targets");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sprintScopeTargets", sprintId] });
      queryClient.invalidateQueries({ queryKey: ["suggestedTasks", sprintId] });
    },
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    addTarget: addTarget.mutate,
    addTargetAsync: addTarget.mutateAsync,
    removeTarget: removeTarget.mutate,
    removeTargetAsync: removeTarget.mutateAsync,
    clearAllTargets: clearAllTargets.mutate,
    clearAllTargetsAsync: clearAllTargets.mutateAsync,
    refetch: query.refetch,
  };
}

// Suggested Tasks Hook (based on scope targets)
export function useSuggestedTasks(sprintId: string) {
  return useQuery({
    queryKey: ["suggestedTasks", sprintId],
    queryFn: async () => {
      if (!sprintId) return [];
      const response = await fetch(`/api/sprints/${sprintId}/suggested-tasks`);
      if (!response.ok) throw new Error("Failed to fetch suggested tasks");
      return response.json();
    },
    enabled: !!sprintId,
  });
}

// Task Dependencies Hook
export function useTaskDependencies(taskId: string) {
  const queryClient = useQueryClient();

  const dependsOn = useQuery({
    queryKey: ["taskDependencies", taskId, "dependsOn"],
    queryFn: async () => {
      if (!taskId) return [];
      const response = await fetch(`/api/tasks/${taskId}/dependencies`);
      if (!response.ok) throw new Error("Failed to fetch dependencies");
      return response.json();
    },
    enabled: !!taskId,
  });

  const dependents = useQuery({
    queryKey: ["taskDependencies", taskId, "dependents"],
    queryFn: async () => {
      if (!taskId) return [];
      const response = await fetch(`/api/tasks/${taskId}/dependents`);
      if (!response.ok) throw new Error("Failed to fetch dependents");
      return response.json();
    },
    enabled: !!taskId,
  });

  const addDependency = useMutation({
    mutationFn: async (dependsOnTaskId: string) => {
      const response = await fetch(`/api/tasks/${taskId}/dependencies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dependsOnTaskId }),
      });
      if (!response.ok) throw new Error("Failed to add dependency");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taskDependencies", taskId] });
    },
  });

  const removeDependency = useMutation({
    mutationFn: async (dependencyId: string) => {
      const response = await fetch(`/api/tasks/${taskId}/dependencies/${dependencyId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to remove dependency");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["taskDependencies", taskId] });
    },
  });

  return {
    dependsOn: dependsOn.data || [],
    dependents: dependents.data || [],
    isLoading: dependsOn.isLoading || dependents.isLoading,
    addDependency: addDependency.mutate,
    addDependencyAsync: addDependency.mutateAsync,
    removeDependency: removeDependency.mutate,
    removeDependencyAsync: removeDependency.mutateAsync,
    refetch: () => {
      dependsOn.refetch();
      dependents.refetch();
    },
  };
}

// Subtasks Hook
export function useSubtasks(parentTaskId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["subtasks", parentTaskId],
    queryFn: async () => {
      if (!parentTaskId) return [];
      const response = await fetch(`/api/tasks/${parentTaskId}/subtasks`);
      if (!response.ok) throw new Error("Failed to fetch subtasks");
      return response.json();
    },
    enabled: !!parentTaskId,
  });

  const create = useMutation({
    mutationFn: async (subtask: any) => {
      const response = await fetch(`/api/tasks/${parentTaskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subtask),
      });
      if (!response.ok) throw new Error("Failed to create subtask");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subtasks", parentTaskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Subtask created" });
    },
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    create: create.mutate,
    createAsync: create.mutateAsync,
    refetch: query.refetch,
  };
}

// Resolved Task Types Hook (project-specific > global fallback)
export function useResolvedTaskTypes(projectId: string) {
  return useQuery({
    queryKey: ["resolvedTaskTypes", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await fetch(`/api/projects/${projectId}/resolved-task-types`);
      if (!response.ok) throw new Error("Failed to fetch resolved task types");
      return response.json();
    },
    enabled: !!projectId,
  });
}

// Helper to get nested data (e.g. project with deliverables)
export function useProjectDetails(projectId: string) {
  const project = useProject(projectId);
  const deliverables = useQuery({
    queryKey: ["deliverables", { projectId }],
    queryFn: async () => {
      const all = await db.getAll("deliverables");
      return all.filter((d: any) => d.projectId === projectId);
    }
  });
  
  // This is a simplified "join" - in a real app this might be more complex
  return {
    project: project.data,
    deliverables: deliverables.data || [],
    isLoading: project.isLoading || deliverables.isLoading
  };
}
