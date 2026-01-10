import { useCallback } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Package, GitBranch, ChevronRight, ChevronDown, AlertTriangle } from "lucide-react";
import type { Deliverable, Epic } from "@shared/schema";
import type { ViewMode, TimelineRange, DeliverableWithEpics } from "../types";
import { getPosition, getWidth, parseDate, VIEW_MODE_CONFIGS } from "../timeline-utils";
import { getDeliverableColor } from "../types";
import { TimelineBar } from "../components/timeline-bar";
import { useToast } from "@/hooks/use-toast";
import type { EntityType, DateChange } from "../components/schedule-sync-prompt";

function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}

interface DeliverablesLayerProps {
  deliverables: Deliverable[];
  epics: Epic[];
  projectId: string;
  viewMode: ViewMode;
  timelineRange: TimelineRange;
  highlightId?: string;
  expandedDeliverables: Set<string>;
  onToggleDeliverable: (id: string) => void;
  onScheduleSyncEvaluate?: (
    entityType: EntityType,
    entityId: string,
    proposedDates: DateChange,
    onApply: (dates: DateChange) => void
  ) => void;
}

export const DELIVERABLE_ROW_HEIGHT = 48;
export const EPIC_ROW_HEIGHT = 40;
export const DELIVERABLES_HEADER_HEIGHT = 32;

export function DeliverablesLayer({
  deliverables,
  epics,
  projectId,
  viewMode,
  timelineRange,
  highlightId,
  expandedDeliverables,
  onToggleDeliverable,
  onScheduleSyncEvaluate,
}: DeliverablesLayerProps) {
  const [, navigate] = useLocation();
  const config = VIEW_MODE_CONFIGS[viewMode];
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateDeliverableMutation = useMutation({
    mutationFn: async ({ deliverableId, startDate, dueDate }: { deliverableId: string; startDate: string; dueDate: string }) => {
      const res = await fetch(`/api/deliverables/${deliverableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, dueDate }),
      });
      if (!res.ok) throw new Error("Failed to update deliverable dates");
      return res.json();
    },
    onMutate: async ({ deliverableId, startDate, dueDate }) => {
      await queryClient.cancelQueries({ queryKey: ["deliverables"] });
      const previousDeliverables = queryClient.getQueryData(["deliverables"]);
      queryClient.setQueryData(["deliverables"], (old: any[] | undefined) => {
        if (!old) return old;
        return old.map((d: any) => 
          d.id === deliverableId ? { ...d, startDate, dueDate } : d
        );
      });
      return { previousDeliverables };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverables"] });
      toast({ title: "Deliverable Updated", description: "Deliverable dates have been updated." });
    },
    onError: (err, variables, context) => {
      if (context?.previousDeliverables) {
        queryClient.setQueryData(["deliverables"], context.previousDeliverables);
      }
      toast({ title: "Error", description: "Failed to update deliverable dates.", variant: "destructive" });
    },
  });

  const updateEpicMutation = useMutation({
    mutationFn: async ({ epicId, startDate, endDate }: { epicId: string; startDate: string; endDate: string }) => {
      const res = await fetch(`/api/epics/${epicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      });
      if (!res.ok) throw new Error("Failed to update epic dates");
      return res.json();
    },
    onMutate: async ({ epicId, startDate, endDate }) => {
      await queryClient.cancelQueries({ queryKey: ["epics"] });
      const previousEpics = queryClient.getQueryData(["epics"]);
      queryClient.setQueryData(["epics"], (old: any[] | undefined) => {
        if (!old) return old;
        return old.map((e: any) => 
          e.id === epicId ? { ...e, startDate, endDate } : e
        );
      });
      return { previousEpics };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["epics"] });
      toast({ title: "Epic Updated", description: "Epic dates have been updated." });
    },
    onError: (err, variables, context) => {
      if (context?.previousEpics) {
        queryClient.setQueryData(["epics"], context.previousEpics);
      }
      toast({ title: "Error", description: "Failed to update epic dates.", variant: "destructive" });
    },
  });

  const deliverablesWithEpics: DeliverableWithEpics[] = deliverables.map((d) => ({
    ...d,
    epics: epics.filter((e) => e.deliverableId === d.id),
    color: getDeliverableColor(d.id),
  }));

  const handleDeliverableClick = useCallback((deliverableId: string) => {
    navigate(`/projects/${projectId}/deliverables/${deliverableId}`);
  }, [navigate, projectId]);

  const handleEpicClick = useCallback((epicId: string) => {
    navigate(`/projects/${projectId}/epics/${epicId}`);
  }, [navigate, projectId]);

  const handleDeliverableDateChange = useCallback((deliverableId: string, startDate: Date, endDate: Date) => {
    updateDeliverableMutation.mutate({
      deliverableId,
      startDate: format(startDate, "yyyy-MM-dd"),
      dueDate: format(endDate, "yyyy-MM-dd"),
    });
  }, [updateDeliverableMutation]);

  const applyEpicDateChange = useCallback((epicId: string, startDate: string, endDate: string) => {
    updateEpicMutation.mutate({ epicId, startDate, endDate });
  }, [updateEpicMutation]);

  const handleEpicDateChange = useCallback((epicId: string, startDate: Date, endDate: Date) => {
    const formattedStart = format(startDate, "yyyy-MM-dd");
    const formattedEnd = format(endDate, "yyyy-MM-dd");
    
    if (onScheduleSyncEvaluate) {
      onScheduleSyncEvaluate(
        'epic',
        epicId,
        { startDate: formattedStart, endDate: formattedEnd },
        () => applyEpicDateChange(epicId, formattedStart, formattedEnd)
      );
    } else {
      applyEpicDateChange(epicId, formattedStart, formattedEnd);
    }
  }, [onScheduleSyncEvaluate, applyEpicDateChange]);

  return (
    <div className="border-b">
      {deliverablesWithEpics.map((deliverable) => {
        const isExpanded = expandedDeliverables.has(deliverable.id);
        const hasEpics = deliverable.epics.length > 0;
        const start = parseDate(deliverable.startDate);
        const end = parseDate(deliverable.dueDate);
        const hasDates = start !== null && end !== null;
        const isHighlighted = highlightId === deliverable.id;

        const left = start ? getPosition(start, timelineRange.start, config.dayWidth) : 16;
        const width = start && end ? getWidth(start, end, config.dayWidth) : 150;

        return (
          <div key={deliverable.id}>
            <div 
              className="relative border-b hover:bg-blue-50/40 transition-colors"
              style={{ 
                height: DELIVERABLE_ROW_HEIGHT,
                borderLeft: `4px solid ${deliverable.color}`,
                backgroundColor: hexToRgba(deliverable.color, 0.03),
              }}
            >
              <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
                {hasEpics && (
                  <button
                    onClick={() => onToggleDeliverable(deliverable.id)}
                    className="p-1 hover:bg-white/50 rounded"
                    data-testid={`toggle-deliverable-${deliverable.id}`}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                )}
              </div>

              <div className="relative h-full">
                {hasDates ? (
                  <TimelineBar
                    id={deliverable.id}
                    name={deliverable.title}
                    description={deliverable.description}
                    startDate={start}
                    endDate={end}
                    left={left}
                    width={Math.max(width, 120)}
                    top={8}
                    height={32}
                    dayWidth={config.dayWidth}
                    backgroundColor={deliverable.color}
                    textColorClass="text-white"
                    isHighlighted={isHighlighted}
                    onClick={() => handleDeliverableClick(deliverable.id)}
                    onDateChange={handleDeliverableDateChange}
                    testId={`timeline-deliverable-${deliverable.id}`}
                    renderBadge={
                      typeof deliverable.progress === "number" ? (
                        <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white font-medium ml-1">
                          {deliverable.progress}%
                        </span>
                      ) : undefined
                    }
                  />
                ) : (
                  <motion.button
                    initial={{ opacity: 0, scaleX: 0.9 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    className={cn(
                      "absolute top-2 h-8 rounded-md px-3 flex items-center gap-2 cursor-pointer transition-all",
                      "hover:ring-2 hover:ring-offset-1 focus:ring-2 focus:ring-primary focus:outline-none",
                      "border-2 border-dashed",
                      isHighlighted && "ring-2 ring-primary ring-offset-2"
                    )}
                    style={{
                      left,
                      width: Math.max(width, 120),
                      backgroundColor: hexToRgba(deliverable.color, 0.25),
                      borderColor: deliverable.color,
                    }}
                    onClick={() => handleDeliverableClick(deliverable.id)}
                    data-testid={`timeline-deliverable-${deliverable.id}`}
                  >
                    <Package className="w-3.5 h-3.5 shrink-0 text-white" />
                    <span className="text-xs font-semibold truncate flex-1 text-white">
                      {deliverable.title}
                    </span>
                    <span className="text-[10px] bg-white/30 px-1.5 py-0.5 rounded text-white font-medium">
                      No dates
                    </span>
                  </motion.button>
                )}
              </div>
            </div>

            <AnimatePresence>
              {isExpanded && hasEpics && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {deliverable.epics.map((epic) => {
                    const epicStart = parseDate(epic.startDate);
                    const epicEnd = parseDate(epic.endDate);
                    const epicHasDates = epicStart !== null && epicEnd !== null;
                    const epicIsHighlighted = highlightId === epic.id;

                    const epicLeft = epicStart ? getPosition(epicStart, timelineRange.start, config.dayWidth) : 0;
                    const epicWidth = epicStart && epicEnd ? getWidth(epicStart, epicEnd, config.dayWidth) : 60;

                    return (
                      <div 
                        key={epic.id}
                        className="relative border-b hover:bg-slate-100/50 transition-colors"
                        style={{ 
                          height: EPIC_ROW_HEIGHT,
                          borderLeft: `4px solid ${deliverable.color}`,
                          backgroundColor: hexToRgba(deliverable.color, 0.02),
                        }}
                      >
                        <div className="relative h-full">
                          {epicHasDates ? (
                            <TimelineBar
                              id={epic.id}
                              name={epic.title}
                              description={epic.description}
                              startDate={epicStart}
                              endDate={epicEnd}
                              left={epicLeft}
                              width={Math.max(epicWidth, 80)}
                              top={4}
                              height={28}
                              dayWidth={config.dayWidth}
                              backgroundColor={hexToRgba(deliverable.color, 0.15)}
                              textColorClass="text-foreground"
                              isHighlighted={epicIsHighlighted}
                              onClick={() => handleEpicClick(epic.id)}
                              onDateChange={handleEpicDateChange}
                              testId={`timeline-epic-${epic.id}`}
                              renderBadge={
                                epic.scheduleOverride ? (
                                  <span 
                                    className="inline-flex items-center gap-0.5 text-[9px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded border border-amber-200 ml-1"
                                    title={epic.overrideReason || "Dates out of sync with hierarchy"}
                                  >
                                    <AlertTriangle className="h-2.5 w-2.5" />
                                    Override
                                  </span>
                                ) : undefined
                              }
                            />
                          ) : (
                            <motion.button
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={cn(
                                "absolute top-1 h-7 rounded px-2 flex items-center gap-1.5 cursor-pointer transition-all border-l-2",
                                "hover:ring-2 hover:ring-primary/50 focus:ring-2 focus:ring-primary focus:outline-none",
                                epicIsHighlighted && "ring-2 ring-primary ring-offset-1"
                              )}
                              style={{
                                left: 16,
                                width: 100,
                                borderLeftColor: deliverable.color,
                                backgroundColor: hexToRgba(deliverable.color, 0.08),
                              }}
                              onClick={() => handleEpicClick(epic.id)}
                              data-testid={`timeline-epic-${epic.id}`}
                            >
                              <GitBranch className="w-3 h-3 shrink-0" style={{ color: deliverable.color }} />
                              <span className="text-xs font-medium truncate" style={{ color: deliverable.color }}>
                                {epic.title}
                              </span>
                            </motion.button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export function getDeliverablesLayerHeight(
  deliverables: Deliverable[],
  epics: Epic[],
  expandedDeliverables: Set<string>
): number {
  let height = deliverables.length * DELIVERABLE_ROW_HEIGHT;
  
  deliverables.forEach((d) => {
    if (expandedDeliverables.has(d.id)) {
      const epicCount = epics.filter((e) => e.deliverableId === d.id).length;
      height += epicCount * EPIC_ROW_HEIGHT;
    }
  });
  
  return height;
}
