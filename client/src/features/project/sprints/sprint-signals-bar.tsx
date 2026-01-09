import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertOctagon, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  status: string;
  deadline?: string;
  blocked?: boolean;
  updatedAt?: string;
}

interface SprintSignalsBarProps {
  tasks: Task[];
  activeFilter: "blocked" | "overdue" | "stale" | null;
  onFilterChange: (filter: "blocked" | "overdue" | "stale" | null) => void;
}

export function SprintSignalsBar({ tasks, activeFilter, onFilterChange }: SprintSignalsBarProps) {
  const signals = useMemo(() => {
    const now = new Date();
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    return {
      blocked: tasks.filter(t => t.blocked).length,
      overdue: tasks.filter(t => {
        if (!t.deadline) return false;
        const deadline = new Date(t.deadline);
        return deadline < now && t.status !== "Done" && t.status !== "Completed";
      }).length,
      stale: tasks.filter(t => {
        if (!t.updatedAt) return false;
        const updated = new Date(t.updatedAt);
        return updated < threeDaysAgo && t.status === "In Progress";
      }).length,
    };
  }, [tasks]);

  const hasAnySignals = signals.blocked > 0 || signals.overdue > 0 || signals.stale > 0;

  if (!hasAnySignals) return null;

  const handleClick = (filter: "blocked" | "overdue" | "stale") => {
    if (activeFilter === filter) {
      onFilterChange(null);
    } else {
      onFilterChange(filter);
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b" data-testid="sprint-signals-bar">
      <span className="text-xs text-muted-foreground font-medium mr-1">Signals:</span>
      
      {signals.blocked > 0 && (
        <Badge 
          variant={activeFilter === "blocked" ? "default" : "outline"}
          className={cn(
            "cursor-pointer gap-1 text-xs py-0.5 transition-colors",
            activeFilter === "blocked" 
              ? "bg-amber-500 hover:bg-amber-600 text-white" 
              : "text-amber-600 border-amber-300 hover:bg-amber-50"
          )}
          onClick={() => handleClick("blocked")}
          data-testid="signal-blocked"
        >
          <AlertOctagon className="h-3 w-3" />
          {signals.blocked} Blocked
        </Badge>
      )}

      {signals.overdue > 0 && (
        <Badge 
          variant={activeFilter === "overdue" ? "default" : "outline"}
          className={cn(
            "cursor-pointer gap-1 text-xs py-0.5 transition-colors",
            activeFilter === "overdue" 
              ? "bg-red-500 hover:bg-red-600 text-white" 
              : "text-red-600 border-red-300 hover:bg-red-50"
          )}
          onClick={() => handleClick("overdue")}
          data-testid="signal-overdue"
        >
          <Clock className="h-3 w-3" />
          {signals.overdue} Overdue
        </Badge>
      )}

      {signals.stale > 0 && (
        <Badge 
          variant={activeFilter === "stale" ? "default" : "outline"}
          className={cn(
            "cursor-pointer gap-1 text-xs py-0.5 transition-colors",
            activeFilter === "stale" 
              ? "bg-orange-500 hover:bg-orange-600 text-white" 
              : "text-orange-600 border-orange-300 hover:bg-orange-50"
          )}
          onClick={() => handleClick("stale")}
          data-testid="signal-stale"
        >
          <AlertTriangle className="h-3 w-3" />
          {signals.stale} Stale
        </Badge>
      )}

      {activeFilter && (
        <button 
          onClick={() => onFilterChange(null)}
          className="text-xs text-muted-foreground hover:text-foreground ml-auto"
          data-testid="button-clear-filter"
        >
          Clear filter
        </button>
      )}
    </div>
  );
}
