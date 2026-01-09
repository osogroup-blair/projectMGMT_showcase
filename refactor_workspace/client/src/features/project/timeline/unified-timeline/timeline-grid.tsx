import { useMemo } from "react";
import type { ViewMode, TimelineRange } from "./types";
import { VIEW_MODE_CONFIGS, getPosition } from "./timeline-utils";

interface TimelineGridProps {
  viewMode: ViewMode;
  timelineRange: TimelineRange;
  totalWidth: number;
  totalHeight: number;
}

export function TimelineGrid({ viewMode, timelineRange, totalWidth, totalHeight }: TimelineGridProps) {
  const config = VIEW_MODE_CONFIGS[viewMode];
  
  const ticks = useMemo(() => {
    return config.tickInterval({ start: timelineRange.start, end: timelineRange.end });
  }, [config, timelineRange]);

  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{ width: totalWidth, height: totalHeight }}
    >
      {ticks.map((tick, idx) => {
        const pos = getPosition(tick, timelineRange.start, config.dayWidth);
        return (
          <div
            key={idx}
            className="absolute top-0 bottom-0 border-l border-border/30"
            style={{ left: pos }}
          />
        );
      })}
    </div>
  );
}
