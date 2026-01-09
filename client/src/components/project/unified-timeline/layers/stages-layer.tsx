import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ProjectStage } from "@shared/schema";
import type { ViewMode, TimelineRange } from "../types";
import { getPosition, getWidth, parseDate, formatDateRange, VIEW_MODE_CONFIGS } from "../timeline-utils";
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

const generateStageDates = (stages: ProjectStage[], projectStartDate?: string | null) => {
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

  const stagesWithDates = generateStageDates(stages, projectStartDate);

  const handleClick = (stageId: string) => {
    navigate(`/projects/${projectId}/stages/${stageId}`);
  };

  return (
    <div className="relative h-14 border-b bg-emerald-50/30">
      <div className="absolute left-0 top-0 h-full w-32 bg-background border-r flex items-center px-3 z-10">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stages</span>
      </div>
      
      <div className="ml-32 relative h-full">
        {stagesWithDates.map((stage) => {
          const left = getPosition(stage.startDate, timelineRange.start, config.dayWidth);
          const width = getWidth(stage.startDate, stage.endDate, config.dayWidth);
          
          const isHighlighted = highlightId === stage.id;
          const statusColor = STATUS_COLORS[stage.status] || STATUS_COLORS.pending;

          return (
            <Tooltip key={stage.id}>
              <TooltipTrigger asChild>
                <motion.button
                  initial={{ opacity: 0, scaleX: 0.8 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  className={cn(
                    "absolute top-3 h-8 rounded-md px-3 flex items-center cursor-pointer transition-all",
                    "hover:ring-2 hover:ring-primary/50 focus:ring-2 focus:ring-primary focus:outline-none",
                    statusColor,
                    isHighlighted && "ring-2 ring-primary ring-offset-2"
                  )}
                  style={{ left, width: Math.max(width, 80) }}
                  onClick={() => handleClick(stage.id)}
                  data-testid={`timeline-stage-${stage.id}`}
                >
                  <span className="text-xs font-medium text-white truncate">
                    {stage.name}
                  </span>
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">{stage.name}</p>
                  {stage.description && <p className="text-xs text-muted-foreground">{stage.description}</p>}
                  <p className="text-xs">{formatDateRange(stage.startDate, stage.endDate)}</p>
                  <p className="text-xs capitalize">Status: {stage.status}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
