import { useMemo } from "react";
import { useStatusOptions } from "./use-nexus-data";
import { Circle, Clock, CheckCircle2, AlertOctagon, type LucideIcon } from "lucide-react";

export interface KanbanColumn {
  id: string;
  title: string;
  statuses: string[];
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  order: number;
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: "todo", title: "To Do", statuses: ["To Do", "Todo", "Pending", "Backlog", "Not Started", "Open", "New"], icon: Circle, color: "text-slate-500", bgColor: "bg-slate-50", borderColor: "border-slate-200", order: 0 },
  { id: "inprogress", title: "In Progress", statuses: ["In Progress", "Active", "Review", "In Review", "Ready for QA", "QA", "Testing"], icon: Clock, color: "text-blue-500", bgColor: "bg-blue-50", borderColor: "border-blue-200", order: 1 },
  { id: "blocked", title: "Blocked", statuses: ["Blocked", "On Hold"], icon: AlertOctagon, color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-300", order: 2 },
  { id: "done", title: "Done", statuses: ["Done", "Completed", "Closed", "Resolved"], icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-50", borderColor: "border-green-200", order: 3 },
];

const COLOR_TO_CONFIG: Record<string, { icon: LucideIcon; color: string; bgColor: string; borderColor: string }> = {
  "bg-slate-100 text-slate-700": { icon: Circle, color: "text-slate-500", bgColor: "bg-slate-50", borderColor: "border-slate-200" },
  "bg-blue-50 text-blue-700": { icon: Clock, color: "text-blue-500", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
  "bg-green-50 text-green-700": { icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-50", borderColor: "border-green-200" },
  "bg-purple-50 text-purple-700": { icon: Circle, color: "text-purple-500", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
  "bg-red-50 text-red-700": { icon: AlertOctagon, color: "text-red-500", bgColor: "bg-red-50", borderColor: "border-red-200" },
  "bg-amber-50 text-amber-700": { icon: AlertOctagon, color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-300" },
};

function getIconForStatus(label: string): LucideIcon {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes("done") || lowerLabel.includes("complete") || lowerLabel.includes("closed") || lowerLabel.includes("resolved")) {
    return CheckCircle2;
  }
  if (lowerLabel.includes("progress") || lowerLabel.includes("active") || lowerLabel.includes("review") || lowerLabel.includes("qa") || lowerLabel.includes("testing")) {
    return Clock;
  }
  if (lowerLabel.includes("block") || lowerLabel.includes("hold")) {
    return AlertOctagon;
  }
  return Circle;
}

export function useKanbanColumns(): { columns: KanbanColumn[]; isLoading: boolean } {
  const { data: statusOptions = [], isLoading } = useStatusOptions();

  const columns = useMemo(() => {
    const taskStatuses = statusOptions.filter((s: any) => s.type === "task");
    
    if (taskStatuses.length === 0) {
      return DEFAULT_COLUMNS;
    }

    const sortedStatuses = [...taskStatuses].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

    return sortedStatuses.map((status: any, index: number) => {
      const colorConfig = COLOR_TO_CONFIG[status.color] || {
        icon: getIconForStatus(status.label),
        color: "text-slate-500",
        bgColor: "bg-slate-50",
        borderColor: "border-slate-200",
      };

      return {
        id: status.id,
        title: status.label,
        statuses: [status.label],
        icon: colorConfig.icon,
        color: colorConfig.color,
        bgColor: colorConfig.bgColor,
        borderColor: colorConfig.borderColor,
        order: status.order ?? index,
      };
    });
  }, [statusOptions]);

  return { columns, isLoading };
}

export function findColumnForStatus(columns: KanbanColumn[], status: string): KanbanColumn | undefined {
  return columns.find(col => 
    col.statuses.some(s => s.toLowerCase() === status.toLowerCase())
  );
}

export function getTargetStatusForColumn(column: KanbanColumn): string {
  return column.statuses[0];
}
