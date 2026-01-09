import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Milestone } from "@shared/schema";
import type { ViewMode, TimelineRange } from "../types";
import { getPosition, parseDate, VIEW_MODE_CONFIGS } from "../timeline-utils";
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

export function MilestonesLayer({ milestones, projectId, viewMode, timelineRange, highlightId }: MilestonesLayerProps) {
  const [, navigate] = useLocation();
  const config = VIEW_MODE_CONFIGS[viewMode];

  const handleClick = (milestoneId: string) => {
    navigate(`/projects/${projectId}/milestones/${milestoneId}`);
  };

  const sortedMilestones = [...milestones].sort((a, b) => {
    const aDate = parseDate(a.targetDate);
    const bDate = parseDate(b.targetDate);
    if (!aDate || !bDate) return 0;
    return aDate.getTime() - bDate.getTime();
  });

  return (
    <div className="relative h-16 border-b bg-amber-50/30">
      <div className="absolute left-0 top-0 h-full w-32 bg-background border-r flex items-center px-3 z-10">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Milestones</span>
      </div>
      
      <div className="ml-32 relative h-full">
        {sortedMilestones.map((milestone, idx) => {
          const date = parseDate(milestone.targetDate);
          if (!date) return null;
          
          const left = getPosition(date, timelineRange.start, config.dayWidth);
          const isHighlighted = highlightId === milestone.id;
          const statusStyle = STATUS_COLORS[milestone.status] || STATUS_COLORS.planned;

          const verticalOffset = (idx % 2) * 24;

          return (
            <Tooltip key={milestone.id}>
              <TooltipTrigger asChild>
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "absolute flex flex-col items-center cursor-pointer transition-all group",
                    "hover:scale-110 focus:scale-110 focus:outline-none",
                    isHighlighted && "scale-110"
                  )}
                  style={{ left: left - 12, top: 8 + verticalOffset }}
                  onClick={() => handleClick(milestone.id)}
                  data-testid={`timeline-milestone-${milestone.id}`}
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
                  <p className="font-medium">{milestone.name}</p>
                  <p className="text-xs text-muted-foreground">{milestone.description}</p>
                  <p className="text-xs">Target: {format(date, "MMM d, yyyy")}</p>
                  <p className="text-xs capitalize">Status: {milestone.status.replace("_", " ")}</p>
                  {typeof milestone.progressPercentComplete === "number" && (
                    <p className="text-xs">Progress: {milestone.progressPercentComplete}%</p>
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
