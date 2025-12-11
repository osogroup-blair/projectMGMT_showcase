import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db, NexusDB } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

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
      queryClient.invalidateQueries({ queryKey: [collection] });
      toast({ title: "Created successfully" });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => db.update(collection, id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [collection] });
      toast({ title: "Updated successfully" });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => db.delete(collection, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [collection] });
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
