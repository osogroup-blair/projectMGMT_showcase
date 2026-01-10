import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { EntityType, ChangePlan, SyncAction, DateChange } from "@/features/project/timeline/unified-timeline/components/schedule-sync-prompt";

interface EvaluateRequest {
  entityType: EntityType;
  entityId: string;
  proposedDates: DateChange;
  userId?: string;
}

interface UseScheduleSyncOptions {
  userId?: string;
  onSyncNeeded?: (plan: ChangePlan) => void;
  onNoSyncNeeded?: () => void;
  onError?: (error: Error) => void;
}

export function useScheduleSync(options: UseScheduleSyncOptions = {}) {
  const { userId, onSyncNeeded, onNoSyncNeeded, onError } = options;
  const [changePlan, setChangePlan] = useState<ChangePlan | null>(null);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [pendingChange, setPendingChange] = useState<{
    entityType: EntityType;
    entityId: string;
    proposedDates: DateChange;
    onApply: (dates: DateChange) => void;
  } | null>(null);

  const evaluateMutation = useMutation({
    mutationFn: async (request: EvaluateRequest) => {
      const response = await apiRequest("POST", "/api/schedule-sync/evaluate", {
        ...request,
        userId,
      });
      return response.json() as Promise<ChangePlan>;
    },
    onSuccess: (plan) => {
      if (plan.impactedCount > 0) {
        setChangePlan(plan);
        setIsPromptOpen(true);
        onSyncNeeded?.(plan);
      } else {
        if (pendingChange?.onApply) {
          pendingChange.onApply(pendingChange.proposedDates);
        }
        setPendingChange(null);
        onNoSyncNeeded?.();
      }
    },
    onError: (error) => {
      console.error("Schedule sync evaluation error:", error);
      onError?.(error as Error);
    },
  });

  const evaluateChange = useCallback(
    (
      entityType: EntityType,
      entityId: string,
      proposedDates: DateChange,
      onApply: (dates: DateChange) => void
    ) => {
      setPendingChange({ entityType, entityId, proposedDates, onApply });
      evaluateMutation.mutate({ entityType, entityId, proposedDates });
    },
    [evaluateMutation]
  );

  const handlePromptComplete = useCallback(
    (action: SyncAction, success: boolean) => {
      if (success && action !== 'cancelled' && pendingChange?.onApply) {
        pendingChange.onApply(pendingChange.proposedDates);
      }
      setChangePlan(null);
      setPendingChange(null);
      setIsPromptOpen(false);
    },
    [pendingChange]
  );

  const handlePromptOpenChange = useCallback((open: boolean) => {
    setIsPromptOpen(open);
    if (!open) {
      setChangePlan(null);
      setPendingChange(null);
    }
  }, []);

  return {
    evaluateChange,
    isEvaluating: evaluateMutation.isPending,
    changePlan,
    isPromptOpen,
    handlePromptComplete,
    handlePromptOpenChange,
    userId,
  };
}
