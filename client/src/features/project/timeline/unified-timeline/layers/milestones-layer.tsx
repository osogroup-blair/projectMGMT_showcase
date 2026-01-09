import { useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import type { Milestone } from "@shared/schema";
import type { ViewMode, TimelineRange } from "../types";
import { getPosition, parseDate, VIEW_MODE_CONFIGS, assignLanes, getLaneCount, type PositionedItem } from "../timeline-utils";
import { MilestoneMarker } from "../components/timeline-bar";
import { useToast } from "@/hooks/use-toast";

interface MilestonesLayerProps {
  milestones: Milestone[];
  projectId: string;
  viewMode: ViewMode;
  timelineRange: TimelineRange;
  highlightId?: string;
}

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-slate-400",
  in_progress: "bg-amber-500",
  achieved: "bg-green-500",
  slipped: "bg-red-500",
  cancelled: "bg-gray-400",
};

const MILESTONE_SIZE = 28;
const LANE_HEIGHT = 36;
const VERTICAL_PADDING = 8;

interface MilestoneWithPosition extends PositionedItem {
  milestone: Milestone;
  date: Date;
}

export function MilestonesLayer({ milestones, projectId, viewMode, timelineRange, highlightId }: MilestonesLayerProps) {
  const [, navigate] = useLocation();
  const config = VIEW_MODE_CONFIGS[viewMode];
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateMilestoneMutation = useMutation({
    mutationFn: async ({ milestoneId, targetDate }: { milestoneId: string; targetDate: string }) => {
      const res = await fetch(`/api/projects/${projectId}/milestones/${milestoneId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetDate }),
      });
      if (!res.ok) throw new Error("Failed to update milestone date");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/milestones`] });
      toast({ title: "Milestone Updated", description: "Milestone date has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update milestone date.", variant: "destructive" });
    },
  });

  const handleClick = useCallback((milestoneId: string) => {
    navigate(`/projects/${projectId}/milestones/${milestoneId}`);
  }, [navigate, projectId]);

  const handleDateChange = useCallback((milestoneId: string, date: Date) => {
    updateMilestoneMutation.mutate({
      milestoneId,
      targetDate: format(date, "yyyy-MM-dd"),
    });
  }, [updateMilestoneMutation]);

  const milestonesWithPositions = useMemo(() => {
    return milestones
      .map((milestone) => {
        const date = parseDate(milestone.targetDate);
        if (!date) return null;
        const left = getPosition(date, timelineRange.start, config.dayWidth);
        return {
          id: milestone.id,
          left,
          width: MILESTONE_SIZE,
          milestone,
          date,
        };
      })
      .filter((m): m is MilestoneWithPosition => m !== null);
  }, [milestones, timelineRange, config.dayWidth]);

  const withLanes = useMemo(() => assignLanes(milestonesWithPositions), [milestonesWithPositions]);
  const laneCount = useMemo(() => getLaneCount(milestonesWithPositions), [milestonesWithPositions]);
  const totalHeight = laneCount * LANE_HEIGHT + VERTICAL_PADDING * 2;

  return (
    <div className="relative border-b bg-amber-50/30" style={{ height: totalHeight }}>
      <div className="relative h-full">
        {withLanes.map(({ item, lane }) => {
          const isHighlighted = highlightId === item.milestone.id;
          const statusColor = STATUS_COLORS[item.milestone.status] || STATUS_COLORS.planned;
          const top = VERTICAL_PADDING + lane * LANE_HEIGHT + (LANE_HEIGHT - MILESTONE_SIZE) / 2;

          return (
            <MilestoneMarker
              key={item.milestone.id}
              id={item.milestone.id}
              name={item.milestone.name}
              description={item.milestone.description}
              targetDate={item.date}
              left={item.left}
              top={top}
              size={MILESTONE_SIZE}
              colorClass={statusColor}
              isHighlighted={isHighlighted}
              onClick={() => handleClick(item.milestone.id)}
              onDateChange={handleDateChange}
              testId={`timeline-milestone-${item.milestone.id}`}
            />
          );
        })}
      </div>
    </div>
  );
}

export function getMilestonesLayerHeight(milestones: Milestone[], timelineRange: TimelineRange, dayWidth: number): number {
  const milestonesWithPositions = milestones
    .map((milestone) => {
      const date = parseDate(milestone.targetDate);
      if (!date) return null;
      const left = getPosition(date, timelineRange.start, dayWidth);
      return { id: milestone.id, left, width: MILESTONE_SIZE };
    })
    .filter((m): m is PositionedItem => m !== null);

  const laneCount = getLaneCount(milestonesWithPositions);
  return laneCount * LANE_HEIGHT + VERTICAL_PADDING * 2;
}
