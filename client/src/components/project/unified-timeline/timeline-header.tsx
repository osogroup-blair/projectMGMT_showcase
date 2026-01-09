import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar, Layers } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  sprints: "Sprints",
  milestones: "Milestones",
  stages: "Stages",
  deliverables: "Deliverables & Epics",
};

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
    <div className="flex items-center justify-between gap-4 p-4 border-b bg-background sticky top-0 z-20">
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

      <div className="flex items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2" data-testid="btn-layer-toggle">
              <Layers className="h-4 w-4" />
              Layers
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Timeline Layers</h4>
              {(Object.keys(layers) as LayerType[]).map((layer) => (
                <div key={layer} className="flex items-center justify-between">
                  <Label htmlFor={`layer-${layer}`} className="text-sm">
                    {LAYER_LABELS[layer]}
                  </Label>
                  <Switch
                    id={`layer-${layer}`}
                    checked={layers[layer]}
                    onCheckedChange={() => onLayerToggle(layer)}
                    data-testid={`switch-layer-${layer}`}
                  />
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

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
    </div>
  );
}
