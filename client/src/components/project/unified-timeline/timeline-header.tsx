import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { ViewMode, LayerVisibility, LayerType } from "./types";
import { VIEW_MODE_CONFIGS } from "./timeline-utils";

interface TimelineHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onTodayClick: () => void;
  layers: LayerVisibility;
  onLayerToggle: (layer: LayerType) => void;
}

const LAYER_LABELS: Record<LayerType, string> = {
  milestones: "Milestones",
  sprints: "Sprints",
  stages: "Stages",
  deliverables: "Deliverables & Epics",
};

const LAYER_ORDER: LayerType[] = ["milestones", "sprints", "stages", "deliverables"];

export function TimelineHeader({
  viewMode,
  onViewModeChange,
  currentDate,
  onDateChange,
  onTodayClick,
  layers,
  onLayerToggle,
}: TimelineHeaderProps) {
  const config = VIEW_MODE_CONFIGS[viewMode];

  const handlePrev = () => {
    onDateChange(config.sub(currentDate, 1));
  };

  const handleNext = () => {
    onDateChange(config.add(currentDate, 1));
  };

  return (
    <div className="flex flex-col gap-3 p-4 border-b bg-background sticky top-0 z-20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrev} data-testid="btn-timeline-prev">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" onClick={onTodayClick} className="gap-2" data-testid="btn-timeline-today">
            <Calendar className="h-4 w-4" />
            Today
          </Button>
          
          <Button variant="outline" size="icon" onClick={handleNext} data-testid="btn-timeline-next">
            <ChevronRight className="h-4 w-4" />
          </Button>

          <span className="text-sm font-medium text-muted-foreground ml-2" data-testid="text-current-date">
            {format(currentDate, "MMMM yyyy")}
          </span>
        </div>

        <Select value={viewMode} onValueChange={(v) => onViewModeChange(v as ViewMode)}>
          <SelectTrigger className="w-32" data-testid="select-view-mode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="quarter">Quarter</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-6 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">Show:</span>
        {LAYER_ORDER.map((layer) => (
          <div key={layer} className="flex items-center gap-2">
            <Switch
              id={`layer-${layer}`}
              checked={layers[layer]}
              onCheckedChange={() => onLayerToggle(layer)}
              data-testid={`switch-layer-${layer}`}
              className="scale-90"
            />
            <Label 
              htmlFor={`layer-${layer}`} 
              className="text-sm cursor-pointer whitespace-nowrap"
            >
              {LAYER_LABELS[layer]}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
