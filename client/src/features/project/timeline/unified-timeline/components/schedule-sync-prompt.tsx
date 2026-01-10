import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, X, CalendarDays, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export type EntityType = 'task' | 'epic' | 'deliverable';
export type SyncAction = 'sync_applied' | 'override_saved' | 'cancelled';

export interface DateChange {
  startDate?: string;
  endDate?: string;
  dueDate?: string;
}

export interface ChangePlanItem {
  entityType: EntityType;
  entityId: string;
  entityTitle: string;
  currentDates: DateChange;
  proposedDates: DateChange;
  reason: string;
  warningCode: 'out_of_bounds' | 'cascade_expansion' | 'max_expansion_exceeded';
}

export interface ChangePlan {
  triggeredBy: {
    entityType: EntityType;
    entityId: string;
    proposedDates: DateChange;
  };
  items: ChangePlanItem[];
  impactedCount: number;
  warnings: string[];
  maxExpansionDays: number;
}

interface ScheduleSyncPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changePlan: ChangePlan | null;
  onComplete: (action: SyncAction, success: boolean) => void;
  userId?: string;
}

const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
};

const getEntityTypeLabel = (type: EntityType) => {
  const labels: Record<EntityType, string> = {
    task: "Task",
    epic: "Epic",
    deliverable: "Deliverable",
  };
  return labels[type];
};

const getWarningBadgeColor = (code: string) => {
  switch (code) {
    case 'max_expansion_exceeded':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'cascade_expansion':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    default:
      return 'bg-blue-100 text-blue-800 border-blue-200';
  }
};

export function ScheduleSyncPrompt({
  open,
  onOpenChange,
  changePlan,
  onComplete,
  userId,
}: ScheduleSyncPromptProps) {
  const [overrideReason, setOverrideReason] = useState("");
  const queryClient = useQueryClient();

  const applyMutation = useMutation({
    mutationFn: async ({ action, overrideReason }: { action: SyncAction; overrideReason?: string }) => {
      const response = await apiRequest("POST", "/api/schedule-sync/apply", {
        action,
        changePlan,
        overrideReason,
        userId,
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["epics"] });
      queryClient.invalidateQueries({ queryKey: ["deliverables"] });
      
      onComplete(variables.action, true);
      onOpenChange(false);
      setOverrideReason("");
    },
    onError: (error) => {
      console.error("Schedule sync apply error:", error);
      onComplete('cancelled', false);
    },
  });

  const handleSyncApply = () => {
    applyMutation.mutate({ action: 'sync_applied' });
  };

  const handleOverrideSave = () => {
    applyMutation.mutate({ action: 'override_saved', overrideReason });
  };

  const handleCancel = () => {
    onComplete('cancelled', true);
    onOpenChange(false);
    setOverrideReason("");
  };

  if (!changePlan) return null;

  const hasMaxExpansionWarning = changePlan.items.some(
    (item) => item.warningCode === 'max_expansion_exceeded'
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="schedule-sync-prompt-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Schedule Changes Will Cascade
          </DialogTitle>
          <DialogDescription>
            Your date change will affect parent entities in the hierarchy. Review the changes below and choose how to proceed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {changePlan.warnings.length > 0 && (
            <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm text-amber-800">
                  {changePlan.warnings.map((warning, idx) => (
                    <p key={idx}>{warning}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md border">
            <div className="bg-muted px-4 py-2 text-sm font-medium border-b">
              Affected Entities ({changePlan.impactedCount})
            </div>
            <ScrollArea className="max-h-[240px]">
              <div className="divide-y">
                {changePlan.items.map((item, idx) => (
                  <div key={`${item.entityType}-${item.entityId}-${idx}`} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {getEntityTypeLabel(item.entityType)}
                          </Badge>
                          <span className="font-medium text-sm truncate">{item.entityTitle}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.reason}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`shrink-0 text-xs ${getWarningBadgeColor(item.warningCode)}`}
                      >
                        {item.warningCode === 'max_expansion_exceeded' ? 'Exceeds Limit' : 'Cascade'}
                      </Badge>
                    </div>

                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        <span>
                          {formatDate(item.currentDates.startDate || item.currentDates.dueDate)} — {formatDate(item.currentDates.endDate || item.currentDates.dueDate)}
                        </span>
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <div className="flex items-center gap-1 text-primary font-medium">
                        <span>
                          {formatDate(item.proposedDates.startDate || item.proposedDates.dueDate || item.currentDates.startDate)} — {formatDate(item.proposedDates.endDate || item.proposedDates.dueDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <Label htmlFor="override-reason" className="text-sm">
              Override Reason (optional, used if saving without sync)
            </Label>
            <Textarea
              id="override-reason"
              placeholder="Why are you saving without syncing parent dates?"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              className="h-20 resize-none"
              data-testid="override-reason-input"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={applyMutation.isPending}
            data-testid="button-cancel-sync"
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>

          <Button
            variant="secondary"
            onClick={handleOverrideSave}
            disabled={applyMutation.isPending}
            data-testid="button-save-override"
          >
            Save Without Sync
          </Button>

          <Button
            onClick={handleSyncApply}
            disabled={applyMutation.isPending || hasMaxExpansionWarning}
            className="bg-primary"
            data-testid="button-apply-sync"
          >
            <Check className="h-4 w-4 mr-1" />
            Apply All Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
