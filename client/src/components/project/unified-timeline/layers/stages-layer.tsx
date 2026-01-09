import { useMemo } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ProjectStage } from "@shared/schema";
import type { ViewMode, TimelineRange } from "../types";
import { getPosition, getWidth, parseDate, formatDateRange, VIEW_MODE_CONFIGS, assignLanes, getLaneCount, type PositionedItem } from "../timeline-utils";
import { addWeeks } from "date-fns";

interface StagesLayerProps {
  stages: ProjectStage[];
  projectId: string;
  projectStartDate?: string | null;
  viewMode: ViewMode;
  timelineRange: TimelineRange;
  highlightId?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-300",
  active: "bg-emerald-500",
  completed: "bg-emerald-700",
};

const LANE_HEIGHT = 44;
const VERTICAL_PADDING = 8;
const BAR_HEIGHT = 32;

interface StageWithDates extends ProjectStage {
  startDate: Date;
  endDate: Date;
}

interface StageWithPosition extends PositionedItem {
  stage: StageWithDates;
}

const generateStageDates = (stages: ProjectStage[], projectStartDate?: string | null): StageWithDates[] => {
  const start = projectStartDate ? parseDate(projectStartDate) : new Date();
  if (!start) return [];
  
  let currentStart = start;
  
  return stages
    .sort((a, b) => a.order - b.order)
    .map((stage) => {
      let durationWeeks = 4;
      if (stage.name.toLowerCase().includes("develop")) {
        durationWeeks = 16;
      }
      
      const startDate = currentStart;
      const endDate = addWeeks(startDate, durationWeeks);
      currentStart = addWeeks(endDate, 0);

      return { ...stage, startDate, endDate };
    });
};

export function StagesLayer({ stages, projectId, projectStartDate, viewMode, timelineRange, highlightId }: StagesLayerProps) {
  const [, navigate] = useLocation();
  const config = VIEW_MODE_CONFIGS[viewMode];

  const stagesWithDates = useMemo(() => generateStageDates(stages, projectStartDate), [stages, projectStartDate]);

  const handleClick = (stageId: string) => {
    navigate(`/projects/${projectId}/stages/${stageId}`);
  };

  const stagesWithPositions = useMemo(() => {
    return stagesWithDates.map((stage) => {
      const left = getPosition(stage.startDate, timelineRange.start, config.dayWidth);
      const width = getWidth(stage.startDate, stage.endDate, config.dayWidth);
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
            <Tooltip key={item.stage.id}>
              <TooltipTrigger asChild>
                <motion.button
                  initial={{ opacity: 0, scaleX: 0.8 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  className={cn(
                    "absolute rounded-md px-3 flex items-center cursor-pointer transition-all",
                    "hover:ring-2 hover:ring-primary/50 focus:ring-2 focus:ring-primary focus:outline-none",
                    statusColor,
                    isHighlighted && "ring-2 ring-primary ring-offset-2"
                  )}
                  style={{ left: item.left, width: item.width, top, height: BAR_HEIGHT }}
                  onClick={() => handleClick(item.stage.id)}
                  data-testid={`timeline-stage-${item.stage.id}`}
                >
                  <span className="text-xs font-medium text-white truncate">
                    {item.stage.name}
                  </span>
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">{item.stage.name}</p>
                  {item.stage.description && <p className="text-xs text-muted-foreground">{item.stage.description}</p>}
                  <p className="text-xs">{formatDateRange(item.stage.startDate, item.stage.endDate)}</p>
                  <p className="text-xs capitalize">Status: {item.stage.status}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

export function getStagesLayerHeight(stages: ProjectStage[], projectStartDate: string | null | undefined, timelineRange: TimelineRange, dayWidth: number): number {
  const stagesWithDates = generateStageDates(stages, projectStartDate);
  
  const stagesWithPositions = stagesWithDates.map((stage) => {
    const left = getPosition(stage.startDate, timelineRange.start, dayWidth);
    const width = getWidth(stage.startDate, stage.endDate, dayWidth);
    return { id: stage.id, left, width: Math.max(width, 80) };
  });

  const laneCount = getLaneCount(stagesWithPositions);
  return laneCount * LANE_HEIGHT + VERTICAL_PADDING * 2;
}
