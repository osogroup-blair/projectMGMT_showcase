import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "table" | "kanban";

interface TaskViewToggleProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  className?: string;
}

export function TaskViewToggle({ view, onViewChange, className }: TaskViewToggleProps) {
  return (
    <div className={cn("flex items-center border rounded-md", className)}>
      <Button
        variant={view === "table" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 rounded-r-none gap-1.5"
        onClick={() => onViewChange("table")}
        data-testid="button-view-table"
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">Table</span>
      </Button>
      <Button
        variant={view === "kanban" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 rounded-l-none gap-1.5"
        onClick={() => onViewChange("kanban")}
        data-testid="button-view-kanban"
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">Kanban</span>
      </Button>
    </div>
  );
}
