import {
  format,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addQuarters,
  subQuarters,
  addYears,
  subYears,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachQuarterOfInterval,
  eachYearOfInterval,
  differenceInDays,
  parseISO,
  isValid,
  min,
  max,
} from "date-fns";
import type { ViewMode, ViewModeConfig, TimelineRange } from "./types";

export const VIEW_MODE_CONFIGS: Record<ViewMode, ViewModeConfig> = {
  day: {
    dayWidth: 60,
    tickInterval: ({ start, end }) => eachDayOfInterval({ start, end }),
    format: (date) => format(date, "EEE d"),
    subFormat: (date) => format(date, "h a"),
    add: addDays,
    sub: subDays,
  },
  week: {
    dayWidth: 20,
    tickInterval: ({ start, end }) => eachWeekOfInterval({ start, end }),
    format: (date) => format(date, "MMM d"),
    subFormat: (date) => format(date, "EEE"),
    add: addWeeks,
    sub: subWeeks,
  },
  month: {
    dayWidth: 6,
    tickInterval: ({ start, end }) => eachMonthOfInterval({ start, end }),
    format: (date) => format(date, "MMM yyyy"),
    add: addMonths,
    sub: subMonths,
  },
  quarter: {
    dayWidth: 2,
    tickInterval: ({ start, end }) => eachQuarterOfInterval({ start, end }),
    format: (date) => `Q${Math.floor(date.getMonth() / 3) + 1} ${format(date, "yyyy")}`,
    add: addQuarters,
    sub: subQuarters,
  },
  year: {
    dayWidth: 0.5,
    tickInterval: ({ start, end }) => eachYearOfInterval({ start, end }),
    format: (date) => format(date, "yyyy"),
    add: addYears,
    sub: subYears,
  },
};

export const parseDate = (dateStr: string | Date | null | undefined): Date | null => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return isValid(dateStr) ? dateStr : null;
  try {
    const parsed = parseISO(dateStr);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const getPosition = (
  date: Date,
  timelineStart: Date,
  dayWidth: number
): number => {
  const diff = differenceInDays(date, timelineStart);
  return diff * dayWidth;
};

export const getWidth = (
  start: Date,
  end: Date,
  dayWidth: number
): number => {
  const diff = differenceInDays(end, start) + 1;
  return Math.max(diff * dayWidth, dayWidth);
};

export const calculateTimelineRange = (
  dates: (Date | null)[]
): TimelineRange => {
  const validDates = dates.filter((d): d is Date => d !== null);
  
  if (validDates.length === 0) {
    const today = new Date();
    return {
      start: startOfYear(subYears(today, 1)),
      end: endOfYear(addYears(today, 1)),
    };
  }
  
  const minDate = min(validDates);
  const maxDate = max(validDates);
  
  return {
    start: startOfYear(subMonths(minDate, 3)),
    end: endOfYear(addMonths(maxDate, 6)),
  };
};

export const formatDateRange = (start: Date, end?: Date): string => {
  if (!end) {
    return format(start, "MMM d, yyyy");
  }
  
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  
  if (sameMonth) {
    return `${format(start, "MMM d")} - ${format(end, "d, yyyy")}`;
  }
  
  if (sameYear) {
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  }
  
  return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
};

export interface PositionedItem {
  id: string;
  left: number;
  width: number;
}

export interface ItemWithLane<T> {
  item: T;
  lane: number;
}

export function assignLanes<T extends PositionedItem>(items: T[]): ItemWithLane<T>[] {
  if (items.length === 0) return [];
  
  const sortedItems = [...items].sort((a, b) => a.left - b.left);
  const result: ItemWithLane<T>[] = [];
  const laneEnds: number[] = [];
  
  for (const item of sortedItems) {
    let assignedLane = -1;
    
    for (let i = 0; i < laneEnds.length; i++) {
      if (item.left >= laneEnds[i]) {
        assignedLane = i;
        laneEnds[i] = item.left + item.width;
        break;
      }
    }
    
    if (assignedLane === -1) {
      assignedLane = laneEnds.length;
      laneEnds.push(item.left + item.width);
    }
    
    result.push({ item, lane: assignedLane });
  }
  
  return result;
}

export function getLaneCount<T extends PositionedItem>(items: T[]): number {
  const withLanes = assignLanes(items);
  if (withLanes.length === 0) return 1;
  return Math.max(...withLanes.map(i => i.lane)) + 1;
}
