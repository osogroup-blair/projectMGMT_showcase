import { useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addWeeks } from "date-fns";
import type { ProjectStage } from "@shared/schema";
import type { ViewMode, TimelineRange } from "../types";
import { getPosition, getWidth, parseDate, VIEW_MODE_CONFIGS, assignLanes, getLaneCount, type PositionedItem } from "../timeline-utils";
import { TimelineBar } from "../components/timeline-bar";
import { useToast } from "@/hooks/use-toast";

interface StagesLayerProps {
  stages: ProjectStage[];
  projectId: string;
  projectStartDate?: string | null;
  viewMode: ViewMode;
  timelineRange: TimelineRange;
  highlightId?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-400",
  active: "bg-emerald-500",
  completed: "bg-emerald-700",
};

const LANE_HEIGHT = 44;
const VERTICAL_PADDING = 8;
const BAR_HEIGHT = 32;

interface StageWithDates extends ProjectStage {
  computedStartDate: Date;
  computedEndDate: Date;
}

interface StageWithPosition extends PositionedItem {
  stage: StageWithDates;
}

const generateStageDates = (stages: ProjectStage[], projectStartDate?: string | null): StageWithDates[] => {
  const projectStart = projectStartDate ? parseDate(projectStartDate) : new Date();
  if (!projectStart) return [];
  
  let currentStart = projectStart;
  
  return stages
    .sort((a, b) => a.order - b.order)
    .map((stage) => {
      const stageStart = stage.startDate ? parseDate(stage.startDate) : null;
      const stageEnd = stage.endDate ? parseDate(stage.endDate) : null;

      if (stageStart && stageEnd) {
        return { ...stage, computedStartDate: stageStart, computedEndDate: stageEnd };
      }
      
      let durationWeeks = 4;
      if (stage.name.toLowerCase().includes("develop")) {
        durationWeeks = 16;
      }
      
      const startDate = stageStart || currentStart;
      const endDate = stageEnd || addWeeks(startDate, durationWeeks);
      currentStart = endDate;

      return { ...stage, computedStartDate: startDate, computedEndDate: endDate };
    });
};

export function StagesLayer({ stages, projectId, projectStartDate, viewMode, timelineRange, highlightId }: StagesLayerProps) {
  const [, navigate] = useLocation();
  const config = VIEW_MODE_CONFIGS[viewMode];
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateStageMutation = useMutation({
    mutationFn: async ({ stageId, startDate, endDate }: { stageId: string; startDate: string; endDate: string }) => {
      const res = await fetch(`/api/projects/${projectId}/stages/${stageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      });
      if (!res.ok) throw new Error("Failed to update stage dates");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/stages`] });
      toast({ title: "Stage Updated", description: "Stage dates have been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update stage dates.", variant: "destructive" });
    },
  });

  const stagesWithDates = useMemo(() => generateStageDates(stages, projectStartDate), [stages, projectStartDate]);

  const handleClick = useCallback((stageId: string) => {
    navigate(`/projects/${projectId}/stages/${stageId}`);
  }, [navigate, projectId]);

  const handleDateChange = useCallback((stageId: string, startDate: Date, endDate: Date) => {
    updateStageMutation.mutate({
      stageId,
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    });
  }, [updateStageMutation]);

  const stagesWithPositions = useMemo(() => {
    return stagesWithDates.map((stage) => {
      const left = getPosition(stage.computedStartDate, timelineRange.start, config.dayWidth);
      const width = getWidth(stage.computedStartDate, stage.computedEndDate, config.dayWidth);
      return {
        id: stage.id,
        left,
        width: Math.max(width, 80),
        stage,
      };
    });
  }, [stagesWithDates, timelineRange, config.dayWidth]);

  const withLanes = useMemo(() => assignLanes(stagesWithPositions), [stagesWithPositions]);
  const laneCount = useMemo(() => getLaneCount(stagesWithPositions), [stagesWithPositions]);
  const totalHeight = laneCount * LANE_HEIGHT + VERTICAL_PADDING * 2;

  return (
    <div className="relative border-b bg-emerald-50/30" style={{ height: totalHeight }}>
      <div className="relative h-full">
        {withLanes.map(({ item, lane }) => {
          const isHighlighted = highlightId === item.stage.id;
          const statusColor = STATUS_COLORS[item.stage.status] || STATUS_COLORS.pending;
          const top = VERTICAL_PADDING + lane * LANE_HEIGHT + (LANE_HEIGHT - BAR_HEIGHT) / 2;

          return (
            <TimelineBar
              key={item.stage.id}
              id={item.stage.id}
              name={item.stage.name}
              description={item.stage.description}
              startDate={item.stage.computedStartDate}
              endDate={item.stage.computedEndDate}
              left={item.left}
              width={item.width}
              top={top}
              height={BAR_HEIGHT}
              dayWidth={config.dayWidth}
              colorClass={statusColor}
              isHighlighted={isHighlighted}
              onClick={() => handleClick(item.stage.id)}
              onDateChange={handleDateChange}
              testId={`timeline-stage-${item.stage.id}`}
            />
          );
        })}
      </div>
    </div>
  );
}

export function getStagesLayerHeight(stages: ProjectStage[], projectStartDate: string | null | undefined, timelineRange: TimelineRange, dayWidth: number): number {
  const stagesWithDates = generateStageDates(stages, projectStartDate);
  
  const stagesWithPositions = stagesWithDates.map((stage) => {
    const left = getPosition(stage.computedStartDate, timelineRange.start, dayWidth);
    const width = getWidth(stage.computedStartDate, stage.computedEndDate, dayWidth);
    return { id: stage.id, left, width: Math.max(width, 80) };
  });

  const laneCount = getLaneCount(stagesWithPositions);
  return laneCount * LANE_HEIGHT + VERTICAL_PADDING * 2;
}
