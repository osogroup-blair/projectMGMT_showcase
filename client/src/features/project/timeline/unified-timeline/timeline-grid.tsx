import { useMemo } from "react";
import { isToday, isSameDay } from "date-fns";
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

  const today = new Date();
  const todayPos = getPosition(today, timelineRange.start, config.dayWidth);
  const showTodayLine = today >= timelineRange.start && today <= timelineRange.end;

  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{ width: totalWidth, height: totalHeight }}
    >
      {ticks.map((tick, idx) => {
        const pos = getPosition(tick, timelineRange.start, config.dayWidth);
        const isCurrentDay = isSameDay(tick, today);
        return (
          <div
            key={idx}
            className={`absolute top-0 bottom-0 border-l ${isCurrentDay ? 'border-transparent' : 'border-border/30'}`}
            style={{ left: pos }}
          />
        );
      })}
      
      {/* Today indicator line */}
      {showTodayLine && (
        <div
          className="absolute top-0 bottom-0 z-20"
          style={{ left: todayPos }}
          data-testid="timeline-today-indicator"
        >
          {/* Main vertical line */}
          <div className="absolute inset-y-0 w-0.5 bg-red-500 shadow-sm" />
          
          {/* Top marker label */}
          <div 
            className="absolute -top-1 -translate-x-1/2 flex flex-col items-center"
            style={{ left: '1px' }}
          >
            <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-md" />
            <div className="mt-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-semibold rounded shadow-sm whitespace-nowrap">
              Today
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
