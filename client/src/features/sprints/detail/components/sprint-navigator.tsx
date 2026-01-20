import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { computeSprintStatus } from "@/lib/constants";

interface Sprint {
  id: string;
  name: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
}

interface SprintNavigatorProps {
  currentSprintId: string;
  sprints: Sprint[];
  projectId: string;
  onNavigate: (sprintId: string) => void;
}

export function SprintNavigator({
  currentSprintId,
  sprints,
  projectId,
  onNavigate,
}: SprintNavigatorProps) {
  const sortedSprints = [...sprints].sort((a, b) => {
    if (a.startDate && b.startDate) {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    }
    return a.name.localeCompare(b.name);
  });

  const currentIndex = sortedSprints.findIndex((s) => s.id === currentSprintId);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < sortedSprints.length - 1;

  const handlePrevious = () => {
    if (hasPrevious) {
      onNavigate(sortedSprints[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onNavigate(sortedSprints[currentIndex + 1].id);
    }
  };

  const formatSprintLabel = (sprint: Sprint) => {
    let label = sprint.name;
    if (sprint.startDate && sprint.endDate) {
      const start = format(new Date(sprint.startDate), "MMM d");
      const end = format(new Date(sprint.endDate), "MMM d");
      label += ` (${start} - ${end})`;
    }
    return label;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-blue-100 text-blue-700">Active</span>;
      case "closed":
        return <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-green-100 text-green-700">Closed</span>;
      default:
        return <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-slate-100 text-slate-600">Planned</span>;
    }
  };

  if (sprints.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 py-3 px-4 bg-muted/50 rounded-lg border mb-6">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevious}
        disabled={!hasPrevious}
        data-testid="sprint-nav-previous"
        className="shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Select value={currentSprintId} onValueChange={onNavigate}>
        <SelectTrigger className="w-[320px]" data-testid="sprint-nav-select">
          <SelectValue placeholder="Select sprint" />
        </SelectTrigger>
        <SelectContent>
          {sortedSprints.map((sprint) => (
            <SelectItem key={sprint.id} value={sprint.id} data-testid={`sprint-nav-option-${sprint.id}`}>
              <div className="flex items-center">
                <span>{formatSprintLabel(sprint)}</span>
                {getStatusBadge(computeSprintStatus(sprint))}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={handleNext}
        disabled={!hasNext}
        data-testid="sprint-nav-next"
        className="shrink-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <span className="text-xs text-muted-foreground ml-2">
        {currentIndex + 1} of {sortedSprints.length}
      </span>
    </div>
  );
}
