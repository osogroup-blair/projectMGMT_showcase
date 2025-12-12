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
