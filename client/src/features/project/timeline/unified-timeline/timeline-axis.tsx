import { useMemo } from "react";
import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import type { ViewMode, TimelineRange } from "./types";
import { VIEW_MODE_CONFIGS, getPosition } from "./timeline-utils";

interface TimelineAxisProps {
  viewMode: ViewMode;
  timelineRange: TimelineRange;
  totalWidth: number;
}

export function TimelineAxis({ viewMode, timelineRange, totalWidth }: TimelineAxisProps) {
  const config = VIEW_MODE_CONFIGS[viewMode];
  const today = new Date();
  
  const ticks = useMemo(() => {
    return config.tickInterval({ start: timelineRange.start, end: timelineRange.end });
  }, [config, timelineRange]);

  const todayPosition = getPosition(today, timelineRange.start, config.dayWidth);

  return (
    <div 
      className="bg-background border-b sticky top-0 z-30"
      style={{ width: totalWidth }}
    >
      <div className="relative h-12 flex">
        {ticks.map((tick, idx) => {
          const pos = getPosition(tick, timelineRange.start, config.dayWidth);
          const isToday = isSameDay(tick, today);
          
          return (
            <div
              key={idx}
              className={cn(
                "absolute top-0 h-full border-l border-border/50 flex items-end pb-2 pl-2",
                isToday && "bg-primary/5"
              )}
              style={{ left: pos }}
            >
              <span className={cn(
                "text-xs font-medium whitespace-nowrap",
                isToday ? "text-primary" : "text-muted-foreground"
              )}>
                {config.format(tick)}
              </span>
            </div>
          );
        })}
      </div>
      
      {todayPosition > 0 && todayPosition < totalWidth && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary z-20"
          style={{ left: todayPosition }}
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-medium">
            Today
          </div>
        </div>
      )}
    </div>
  );
}
