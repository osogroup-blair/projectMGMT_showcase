import { useMemo } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Sprint } from "@shared/schema";
import type { ViewMode, TimelineRange } from "../types";
import { getPosition, getWidth, parseDate, formatDateRange, VIEW_MODE_CONFIGS, assignLanes, getLaneCount, type PositionedItem } from "../timeline-utils";

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
  end: Date | null;
}

export function SprintsLayer({ sprints, projectId, viewMode, timelineRange, highlightId }: SprintsLayerProps) {
  const [, navigate] = useLocation();
  const config = VIEW_MODE_CONFIGS[viewMode];

  const handleClick = (sprintId: string) => {
    navigate(`/projects/${projectId}/sprints/${sprintId}`);
  };

  const sprintsWithPositions = useMemo(() => {
    return sprints
      .map((sprint) => {
        const start = parseDate(sprint.startDate);
        const end = parseDate(sprint.endDate);
        if (!start) return null;
        const left = getPosition(start, timelineRange.start, config.dayWidth);
        const width = end 
          ? getWidth(start, end, config.dayWidth) 
          : config.dayWidth * 14;
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
            <Tooltip key={item.sprint.id}>
              <TooltipTrigger asChild>
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "absolute rounded-md px-2 flex items-center gap-1 cursor-pointer transition-all",
                    "hover:ring-2 hover:ring-primary/50 focus:ring-2 focus:ring-primary focus:outline-none",
                    statusColor,
                    isHighlighted && "ring-2 ring-primary ring-offset-2"
                  )}
                  style={{ left: item.left, width: item.width, top, height: BAR_HEIGHT }}
                  onClick={() => handleClick(item.sprint.id)}
                  data-testid={`timeline-sprint-${item.sprint.id}`}
                >
                  <span className="text-xs font-medium text-white truncate">
                    {item.sprint.name}
                  </span>
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">{item.sprint.name}</p>
                  {item.sprint.goal && <p className="text-xs text-muted-foreground">{item.sprint.goal}</p>}
                  <p className="text-xs">
                    {item.start && item.end ? formatDateRange(item.start, item.end) : "No dates set"}
                  </p>
                  <p className="text-xs capitalize">Status: {item.sprint.status}</p>
                </div>
              </TooltipContent>
            </Tooltip>
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
