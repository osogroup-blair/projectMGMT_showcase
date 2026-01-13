import { useQuery } from "@tanstack/react-query";

interface CompletedStatusesConfig {
  completedStatusIds: string[];
  completedStatusLabels: string[];
  allTaskStatuses: { id: string; label: string }[];
}

const DEFAULT_COMPLETED_LABELS = ["Done", "Complete", "Completed", "Closed"];

export function useCompletedStatuses() {
  const { data, isLoading } = useQuery<CompletedStatusesConfig>({
    queryKey: ["completedStatuses"],
    queryFn: async () => {
      const res = await fetch("/api/completed-statuses");
      if (!res.ok) throw new Error("Failed to fetch completed statuses");
      return res.json();
    },
    staleTime: 60000,
  });

  const completedLabels = data?.completedStatusLabels || DEFAULT_COMPLETED_LABELS;
  const completedIds = data?.completedStatusIds || [];

  const isTaskComplete = (status: string | undefined | null): boolean => {
    if (!status) return false;
    
    if (completedLabels.length > 0) {
      return completedLabels.some(label => 
        label.toLowerCase() === status.toLowerCase()
      );
    }
    
    return DEFAULT_COMPLETED_LABELS.some(label => 
      label.toLowerCase() === status.toLowerCase()
    );
  };

  const getCompletedCount = <T extends { status?: string | null }>(tasks: T[]): number => {
    return tasks.filter(t => isTaskComplete(t.status)).length;
  };

  const getProgressPercent = <T extends { status?: string | null }>(tasks: T[]): number => {
    if (tasks.length === 0) return 0;
    return Math.round((getCompletedCount(tasks) / tasks.length) * 100);
  };

  return {
    completedLabels,
    completedIds,
    isTaskComplete,
    getCompletedCount,
    getProgressPercent,
    isLoading,
  };
}

export function isTaskCompleteByLabels(status: string | undefined | null, completedLabels: string[]): boolean {
  if (!status) return false;
  
  const labels = completedLabels.length > 0 ? completedLabels : DEFAULT_COMPLETED_LABELS;
  return labels.some(label => label.toLowerCase() === status.toLowerCase());
}
