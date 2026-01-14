import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Epic {
  id: string;
  title?: string;
  name?: string;
  status?: string;
  deliverableId?: string;
}

interface EpicNavigatorProps {
  currentEpicId: string;
  epics: Epic[];
  projectId: string;
  onNavigate: (epicId: string) => void;
}

export function EpicNavigator({
  currentEpicId,
  epics,
  projectId,
  onNavigate,
}: EpicNavigatorProps) {
  const sortedEpics = [...epics].sort((a, b) => {
    const aName = a.title || a.name || "";
    const bName = b.title || b.name || "";
    return aName.localeCompare(bName);
  });

  const currentIndex = sortedEpics.findIndex((e) => e.id === currentEpicId);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < sortedEpics.length - 1;

  const handlePrevious = () => {
    if (hasPrevious) {
      onNavigate(sortedEpics[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onNavigate(sortedEpics[currentIndex + 1].id);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "In Progress":
        return <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-blue-100 text-blue-700">In Progress</span>;
      case "Completed":
      case "Done":
        return <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-green-100 text-green-700">Completed</span>;
      case "Blocked":
        return <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-red-100 text-red-700">Blocked</span>;
      default:
        return <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-slate-100 text-slate-600">Not Started</span>;
    }
  };

  if (epics.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 py-3 px-4 bg-muted/50 rounded-lg border mb-6">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevious}
        disabled={!hasPrevious}
        data-testid="epic-nav-previous"
        className="shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Select value={currentEpicId} onValueChange={onNavigate}>
        <SelectTrigger className="w-[320px]" data-testid="epic-nav-select">
          <SelectValue placeholder="Select epic" />
        </SelectTrigger>
        <SelectContent>
          {sortedEpics.map((epic) => (
            <SelectItem key={epic.id} value={epic.id} data-testid={`epic-nav-option-${epic.id}`}>
              <div className="flex items-center">
                <span>{epic.title || epic.name}</span>
                {getStatusBadge(epic.status)}
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
        data-testid="epic-nav-next"
        className="shrink-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <span className="text-xs text-muted-foreground ml-2">
        {currentIndex + 1} of {sortedEpics.length}
      </span>
    </div>
  );
}
