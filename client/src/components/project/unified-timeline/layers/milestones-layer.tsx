import { useMemo } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Milestone } from "@shared/schema";
import type { ViewMode, TimelineRange } from "../types";
import { getPosition, parseDate, VIEW_MODE_CONFIGS, assignLanes, getLaneCount, type PositionedItem } from "../timeline-utils";
import { format } from "date-fns";

interface MilestonesLayerProps {
  milestones: Milestone[];
  projectId: string;
  viewMode: ViewMode;
  timelineRange: TimelineRange;
  highlightId?: string;
}

const STATUS_COLORS: Record<string, string> = {
  planned: "text-slate-400 bg-slate-100",
  "in_progress": "text-amber-500 bg-amber-50",
  achieved: "text-green-500 bg-green-50",
  slipped: "text-red-500 bg-red-50",
  cancelled: "text-gray-400 bg-gray-100",
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

  const handleClick = (milestoneId: string) => {
    navigate(`/projects/${projectId}/milestones/${milestoneId}`);
  };

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
          const statusStyle = STATUS_COLORS[item.milestone.status] || STATUS_COLORS.planned;
          const top = VERTICAL_PADDING + lane * LANE_HEIGHT;

          return (
            <Tooltip key={item.milestone.id}>
              <TooltipTrigger asChild>
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "absolute flex flex-col items-center cursor-pointer transition-all group",
                    "hover:scale-110 focus:scale-110 focus:outline-none",
                    isHighlighted && "scale-110"
                  )}
                  style={{ left: item.left - 12, top }}
                  onClick={() => handleClick(item.milestone.id)}
                  data-testid={`timeline-milestone-${item.milestone.id}`}
                >
                  <div className={cn(
                    "w-6 h-6 rotate-45 rounded-sm flex items-center justify-center border-2 border-current",
                    statusStyle,
                    isHighlighted && "ring-2 ring-primary ring-offset-1"
                  )}>
                    <Flag className="w-3 h-3 -rotate-45" />
                  </div>
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">{item.milestone.name}</p>
                  <p className="text-xs text-muted-foreground">{item.milestone.description}</p>
                  <p className="text-xs">Target: {format(item.date, "MMM d, yyyy")}</p>
                  <p className="text-xs capitalize">Status: {item.milestone.status.replace("_", " ")}</p>
                  {typeof item.milestone.progressPercentComplete === "number" && (
                    <p className="text-xs">Progress: {item.milestone.progressPercentComplete}%</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
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
