import { cn } from "@/lib/utils";
import type { LayerVisibility } from "./types";

interface TimelineSidebarProps {
  layers: LayerVisibility;
  layerHeights: {
    milestones: number;
    sprints: number;
    stages: number;
    deliverables: number;
  };
  axisHeight: number;
}

const LAYER_CONFIG = [
  { key: "milestones" as const, label: "Milestones", bgColor: "bg-amber-50/30" },
  { key: "sprints" as const, label: "Sprints", bgColor: "bg-slate-50/50" },
  { key: "stages" as const, label: "Stages", bgColor: "bg-emerald-50/30" },
  { key: "deliverables" as const, label: "Deliverables", bgColor: "bg-blue-50/30" },
];

export function TimelineSidebar({ layers, layerHeights, axisHeight }: TimelineSidebarProps) {
  return (
    <div className="flex-shrink-0 w-36 border-r bg-background z-20 flex flex-col">
      <div 
        className="h-12 border-b flex items-center px-3 bg-muted/30 sticky top-0 z-10 shrink-0"
        style={{ height: axisHeight }}
      >
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Layers
        </span>
      </div>

      <div className="flex flex-col">
        {LAYER_CONFIG.map(({ key, label, bgColor }) => {
          if (!layers[key] || layerHeights[key] === 0) return null;
          
          return (
            <div
              key={key}
              className={cn(
                "flex items-center px-3 border-b",
                bgColor
              )}
              style={{ height: layerHeights[key] }}
              data-testid={`sidebar-label-${key}`}
            >
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
