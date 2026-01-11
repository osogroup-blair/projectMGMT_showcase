import { QueryClient } from "@tanstack/react-query";

export function invalidateTaskQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["tasks"] });
  queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
  queryClient.invalidateQueries({ queryKey: ["/api/home/tasks"] });
  queryClient.invalidateQueries({ 
    predicate: (query) => {
      const key = query.queryKey;
      if (Array.isArray(key)) {
        if (key[0] === "tasks") return true;
        if (typeof key[0] === "string" && key[0].includes("/tasks")) return true;
      }
      return false;
    }
  });
}

export function invalidateProjectQueries(queryClient: QueryClient, projectId?: string) {
  queryClient.invalidateQueries({ queryKey: ["projects"] });
  queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
  if (projectId) {
    queryClient.invalidateQueries({ queryKey: ["projects", projectId] });
    queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
    queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/tasks`] });
    queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/epics`] });
  }
}

export function invalidateSubtaskQueries(queryClient: QueryClient, parentTaskId?: string) {
  queryClient.invalidateQueries({ queryKey: ["subtasks"] });
  if (parentTaskId) {
    queryClient.invalidateQueries({ queryKey: ["subtasks", parentTaskId] });
  }
  invalidateTaskQueries(queryClient);
}
