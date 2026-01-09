import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Sprint } from "@shared/schema";
import type { ViewMode, TimelineRange } from "../types";
import { getPosition, getWidth, parseDate, formatDateRange, VIEW_MODE_CONFIGS } from "../timeline-utils";

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

export function SprintsLayer({ sprints, projectId, viewMode, timelineRange, highlightId }: SprintsLayerProps) {
  const [, navigate] = useLocation();
  const config = VIEW_MODE_CONFIGS[viewMode];

  const sortedSprints = [...sprints].sort((a, b) => {
    const aStart = parseDate(a.startDate);
    const bStart = parseDate(b.startDate);
    if (!aStart || !bStart) return 0;
    return aStart.getTime() - bStart.getTime();
  });

  const handleClick = (sprintId: string) => {
    navigate(`/projects/${projectId}/sprints/${sprintId}`);
  };

  return (
    <div className="relative h-12 border-b bg-slate-50/50">
      <div className="absolute left-0 top-0 h-full w-32 bg-background border-r flex items-center px-3 z-10">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sprints</span>
      </div>
      
      <div className="ml-32 relative h-full">
        {sortedSprints.map((sprint) => {
          const start = parseDate(sprint.startDate);
          const end = parseDate(sprint.endDate);
          
          if (!start) return null;
          
          const left = getPosition(start, timelineRange.start, config.dayWidth);
          const width = end 
            ? getWidth(start, end, config.dayWidth) 
            : config.dayWidth * 14;
          
          const isHighlighted = highlightId === sprint.id;
          const statusColor = STATUS_COLORS[sprint.status] || STATUS_COLORS.planned;

          return (
            <Tooltip key={sprint.id}>
              <TooltipTrigger asChild>
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "absolute top-2 h-8 rounded-md px-2 flex items-center gap-1 cursor-pointer transition-all",
                    "hover:ring-2 hover:ring-primary/50 focus:ring-2 focus:ring-primary focus:outline-none",
                    statusColor,
                    isHighlighted && "ring-2 ring-primary ring-offset-2"
                  )}
                  style={{ left, width: Math.max(width, 60) }}
                  onClick={() => handleClick(sprint.id)}
                  data-testid={`timeline-sprint-${sprint.id}`}
                >
                  <span className="text-xs font-medium text-white truncate">
                    {sprint.name}
                  </span>
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">{sprint.name}</p>
                  {sprint.goal && <p className="text-xs text-muted-foreground">{sprint.goal}</p>}
                  <p className="text-xs">
                    {start && end ? formatDateRange(start, end) : "No dates set"}
                  </p>
                  <p className="text-xs capitalize">Status: {sprint.status}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
