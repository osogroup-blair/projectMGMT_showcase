import { useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import type { Sprint } from "@shared/schema";
import type { ViewMode, TimelineRange } from "../types";
import { getPosition, getWidth, parseDate, VIEW_MODE_CONFIGS, assignLanes, getLaneCount, type PositionedItem } from "../timeline-utils";
import { TimelineBar } from "../components/timeline-bar";
import { useToast } from "@/hooks/use-toast";

interface SprintsLayerProps {
  sprints: Sprint[];
  projectId: string;
  viewMode: ViewMode;
  timelineRange: TimelineRange;
  highlightId?: string;
}

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-slate-400",
  active: "bg-indigo-500",
  closed: "bg-green-500",
};

const LANE_HEIGHT = 40;
const VERTICAL_PADDING = 6;
const BAR_HEIGHT = 32;

interface SprintWithPosition extends PositionedItem {
  sprint: Sprint;
  start: Date;
  end: Date;
}

export function SprintsLayer({ sprints, projectId, viewMode, timelineRange, highlightId }: SprintsLayerProps) {
  const [, navigate] = useLocation();
  const config = VIEW_MODE_CONFIGS[viewMode];
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateSprintMutation = useMutation({
    mutationFn: async ({ sprintId, startDate, endDate }: { sprintId: string; startDate: string; endDate: string }) => {
      const res = await fetch(`/api/sprints/${sprintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      });
      if (!res.ok) throw new Error("Failed to update sprint dates");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/sprints`] });
      toast({ title: "Sprint Updated", description: "Sprint dates have been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update sprint dates.", variant: "destructive" });
    },
  });

  const handleClick = useCallback((sprintId: string) => {
    navigate(`/projects/${projectId}/sprints/${sprintId}`);
  }, [navigate, projectId]);

  const handleDateChange = useCallback((sprintId: string, startDate: Date, endDate: Date) => {
    updateSprintMutation.mutate({
      sprintId,
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
    });
  }, [updateSprintMutation]);

  const sprintsWithPositions = useMemo(() => {
    return sprints
      .map((sprint) => {
        const start = parseDate(sprint.startDate);
        const end = parseDate(sprint.endDate);
        if (!start || !end) return null;
        const left = getPosition(start, timelineRange.start, config.dayWidth);
        const width = getWidth(start, end, config.dayWidth);
        return {
          id: sprint.id,
          left,
          width: Math.max(width, 60),
          sprint,
          start,
          end,
        };
      })
      .filter((s): s is SprintWithPosition => s !== null);
  }, [sprints, timelineRange, config.dayWidth]);

  const withLanes = useMemo(() => assignLanes(sprintsWithPositions), [sprintsWithPositions]);
  const laneCount = useMemo(() => getLaneCount(sprintsWithPositions), [sprintsWithPositions]);
  const totalHeight = laneCount * LANE_HEIGHT + VERTICAL_PADDING * 2;

  return (
    <div className="relative border-b bg-slate-50/50" style={{ height: totalHeight }}>
      <div className="relative h-full">
        {withLanes.map(({ item, lane }) => {
          const isHighlighted = highlightId === item.sprint.id;
          const statusColor = STATUS_COLORS[item.sprint.status] || STATUS_COLORS.planned;
          const top = VERTICAL_PADDING + lane * LANE_HEIGHT + (LANE_HEIGHT - BAR_HEIGHT) / 2;

          return (
            <TimelineBar
              key={item.sprint.id}
              id={item.sprint.id}
              name={item.sprint.name}
              description={item.sprint.goal}
              startDate={item.start}
              endDate={item.end}
              left={item.left}
              width={item.width}
              top={top}
              height={BAR_HEIGHT}
              dayWidth={config.dayWidth}
              colorClass={statusColor}
              isHighlighted={isHighlighted}
              onClick={() => handleClick(item.sprint.id)}
              onDateChange={handleDateChange}
              testId={`timeline-sprint-${item.sprint.id}`}
            />
          );
        })}
      </div>
    </div>
  );
}

export function getSprintsLayerHeight(sprints: Sprint[], timelineRange: TimelineRange, dayWidth: number): number {
  const sprintsWithPositions = sprints
    .map((sprint) => {
      const start = parseDate(sprint.startDate);
      const end = parseDate(sprint.endDate);
      if (!start) return null;
      const left = getPosition(start, timelineRange.start, dayWidth);
      const width = end ? getWidth(start, end, dayWidth) : dayWidth * 14;
      return { id: sprint.id, left, width: Math.max(width, 60) };
    })
    .filter((s): s is PositionedItem => s !== null);

  const laneCount = getLaneCount(sprintsWithPositions);
  return laneCount * LANE_HEIGHT + VERTICAL_PADDING * 2;
}
