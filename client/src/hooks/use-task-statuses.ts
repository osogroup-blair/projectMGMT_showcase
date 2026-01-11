import { useMemo } from "react";
import { useStatusOptions } from "./use-nexus-data";

export interface TaskStatus {
  id: string;
  label: string;
  color: string;
  order: number;
  isDefault?: boolean;
}

interface TaskStatusUtils {
  statuses: TaskStatus[];
  statusLabels: string[];
  defaultStatus: string;
  isLoading: boolean;
  getStatusColor: (status: string) => string;
  getStatusBgColor: (status: string) => string;
  getStatusTextColor: (status: string) => string;
  getStatusAccentColor: (status: string) => string;
  isNotStartedStatus: (status: string) => boolean;
  isInProgressStatus: (status: string) => boolean;
  isCompletedStatus: (status: string) => boolean;
}

const NOT_STARTED_PATTERNS = ["todo", "to do", "pending", "backlog", "not started", "open", "new"];
const IN_PROGRESS_PATTERNS = ["in progress", "working", "active", "doing", "review", "testing"];
const COMPLETED_PATTERNS = ["done", "completed", "complete", "finished", "closed", "resolved"];

function matchesPattern(status: string | null | undefined, patterns: string[]): boolean {
  if (!status) return false;
  const normalized = status.toLowerCase().trim();
  return patterns.some(p => normalized === p || normalized.includes(p));
}

function extractBgColor(colorString: string): string {
  if (!colorString) return "bg-slate-100";
  const match = colorString.match(/bg-[\w-]+/);
  return match ? match[0] : "bg-slate-100";
}

function extractTextColor(colorString: string): string {
  if (!colorString) return "text-slate-700";
  const match = colorString.match(/text-[\w-]+/);
  return match ? match[0] : "text-slate-700";
}

function bgClassToHex(bgClass: string): string {
  const colorMap: Record<string, string> = {
    "green": "#22c55e",
    "emerald": "#10b981",
    "teal": "#14b8a6",
    "cyan": "#06b6d4",
    "blue": "#3b82f6",
    "indigo": "#6366f1",
    "purple": "#a855f7",
    "violet": "#8b5cf6",
    "pink": "#ec4899",
    "rose": "#f43f5e",
    "red": "#ef4444",
    "orange": "#f97316",
    "amber": "#f59e0b",
    "yellow": "#eab308",
    "lime": "#84cc16",
    "slate": "#64748b",
    "gray": "#6b7280",
    "grey": "#6b7280",
    "zinc": "#71717a",
    "neutral": "#737373",
    "stone": "#78716c",
  };
  
  const normalized = bgClass.toLowerCase();
  for (const [colorName, hex] of Object.entries(colorMap)) {
    if (normalized.includes(colorName)) {
      return hex;
    }
  }
  return "#94a3b8";
}

export function useTaskStatuses(): TaskStatusUtils {
  const { data: allStatusOptions = [], isLoading } = useStatusOptions();

  const taskStatuses = useMemo(() => {
    const filtered = allStatusOptions
      .filter((s: any) => s.type === "task")
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
      .map((s: any) => ({
        id: s.id,
        label: s.label,
        color: s.color || "bg-slate-100 text-slate-700",
        order: s.order ?? 0,
        isDefault: s.isDefault,
      }));
    return filtered as TaskStatus[];
  }, [allStatusOptions]);

  const statusLabels = useMemo(() => {
    return taskStatuses.map(s => s.label);
  }, [taskStatuses]);

  const defaultStatus = useMemo(() => {
    const defaultOne = taskStatuses.find(s => s.isDefault);
    if (defaultOne) return defaultOne.label;
    const notStarted = taskStatuses.find(s => matchesPattern(s.label, NOT_STARTED_PATTERNS));
    if (notStarted) return notStarted.label;
    return taskStatuses[0]?.label || "Todo";
  }, [taskStatuses]);

  const statusColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    taskStatuses.forEach(s => {
      map[s.label] = s.color;
    });
    return map;
  }, [taskStatuses]);

  const getStatusColor = (status: string): string => {
    return statusColorMap[status] || "bg-slate-100 text-slate-700";
  };

  const getStatusBgColor = (status: string): string => {
    return extractBgColor(statusColorMap[status] || "");
  };

  const getStatusTextColor = (status: string): string => {
    return extractTextColor(statusColorMap[status] || "");
  };

  const getStatusAccentColor = (status: string): string => {
    const bgClass = getStatusBgColor(status);
    return bgClassToHex(bgClass);
  };

  const isNotStartedStatus = (status: string): boolean => {
    return matchesPattern(status, NOT_STARTED_PATTERNS);
  };

  const isInProgressStatus = (status: string): boolean => {
    return matchesPattern(status, IN_PROGRESS_PATTERNS);
  };

  const isCompletedStatus = (status: string): boolean => {
    return matchesPattern(status, COMPLETED_PATTERNS);
  };

  return {
    statuses: taskStatuses,
    statusLabels,
    defaultStatus,
    isLoading,
    getStatusColor,
    getStatusBgColor,
    getStatusTextColor,
    getStatusAccentColor,
    isNotStartedStatus,
    isInProgressStatus,
    isCompletedStatus,
  };
}

export function useTaskStatusOptions() {
  const { statuses } = useTaskStatuses();
  return useMemo(() => {
    return statuses.map(s => ({ value: s.label, label: s.label }));
  }, [statuses]);
}
