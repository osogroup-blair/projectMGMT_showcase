import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { differenceInDays } from "date-fns";
import { TimelineHeader } from "./timeline-header";
import { TimelineAxis } from "./timeline-axis";
import { TimelineGrid } from "./timeline-grid";
import { SprintsLayer } from "./layers/sprints-layer";
import { MilestonesLayer } from "./layers/milestones-layer";
import { StagesLayer } from "./layers/stages-layer";
import { DeliverablesLayer } from "./layers/deliverables-layer";
import { VIEW_MODE_CONFIGS, calculateTimelineRange, parseDate } from "./timeline-utils";
import type { 
  UnifiedTimelineProps, 
  ViewMode, 
  LayerVisibility, 
  LayerType,
  DEFAULT_LAYER_VISIBILITY 
} from "./types";

export function UnifiedTimeline({
  project,
  sprints = [],
  milestones = [],
  stages = [],
  deliverables = [],
  epics = [],
  initialLayers,
  highlightItemId,
}: UnifiedTimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(() => {
    if (project.startDate) {
      const start = parseDate(project.startDate);
      if (start) return start;
    }
    return new Date();
  });

  const [layers, setLayers] = useState<LayerVisibility>({
    sprints: initialLayers?.sprints ?? true,
    milestones: initialLayers?.milestones ?? true,
    stages: initialLayers?.stages ?? true,
    deliverables: initialLayers?.deliverables ?? true,
  });

  const [expandedDeliverables, setExpandedDeliverables] = useState<Set<string>>(new Set());

  const handleLayerToggle = useCallback((layer: LayerType) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const handleToggleDeliverable = useCallback((id: string) => {
    setExpandedDeliverables((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleTodayClick = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const allDates = useMemo(() => {
    const dates: (Date | null)[] = [];
    
    if (project.startDate) dates.push(parseDate(project.startDate));
    if (project.deadline) dates.push(parseDate(project.deadline));
    
    sprints.forEach((s) => {
      dates.push(parseDate(s.startDate));
      dates.push(parseDate(s.endDate));
    });
    
    milestones.forEach((m) => {
      dates.push(parseDate(m.targetDate));
    });
    
    deliverables.forEach((d) => {
      dates.push(parseDate(d.startDate));
      dates.push(parseDate(d.dueDate));
    });
    
    epics.forEach((e) => {
      dates.push(parseDate(e.startDate));
      dates.push(parseDate(e.endDate));
    });
    
    return dates;
  }, [project, sprints, milestones, deliverables, epics]);

  const timelineRange = useMemo(() => calculateTimelineRange(allDates), [allDates]);

  const config = VIEW_MODE_CONFIGS[viewMode];
  const totalDays = differenceInDays(timelineRange.end, timelineRange.start);
  const totalWidth = totalDays * config.dayWidth;

  const expandedEpicsCount = useMemo(() => {
    return deliverables.reduce((count, d) => {
      if (expandedDeliverables.has(d.id)) {
        return count + epics.filter((e) => e.deliverableId === d.id).length;
      }
      return count;
    }, 0);
  }, [deliverables, epics, expandedDeliverables]);

  const layerHeights = {
    sprints: layers.sprints ? 48 : 0,
    milestones: layers.milestones ? 64 : 0,
    stages: layers.stages ? 56 : 0,
    deliverables: layers.deliverables ? 32 + deliverables.length * 48 + expandedEpicsCount * 40 : 0,
  };

  const totalHeight = Object.values(layerHeights).reduce((a, b) => a + b, 0) + 100;

  useEffect(() => {
    if (scrollContainerRef.current) {
      const targetPos = differenceInDays(currentDate, timelineRange.start) * config.dayWidth;
      const containerWidth = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollTo({
        left: Math.max(0, targetPos - containerWidth / 2),
        behavior: "smooth",
      });
    }
  }, [currentDate, viewMode, config.dayWidth, timelineRange.start]);

  useEffect(() => {
    if (highlightItemId && scrollContainerRef.current) {
      const element = document.querySelector(`[data-testid*="${highlightItemId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      }
    }
  }, [highlightItemId]);

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-background rounded-lg border overflow-hidden">
        <TimelineHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onTodayClick={handleTodayClick}
          layers={layers}
          onLayerToggle={handleLayerToggle}
        />

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto relative"
          data-testid="timeline-scroll-container"
        >
          <div style={{ width: totalWidth + 200, minHeight: totalHeight }}>
            <TimelineAxis
              viewMode={viewMode}
              timelineRange={timelineRange}
              totalWidth={totalWidth}
            />

            <div className="relative" style={{ marginLeft: 0 }}>
              <TimelineGrid
                viewMode={viewMode}
                timelineRange={timelineRange}
                totalWidth={totalWidth}
                totalHeight={totalHeight}
              />

              {layers.sprints && sprints.length > 0 && (
                <SprintsLayer
                  sprints={sprints}
                  projectId={project.id}
                  viewMode={viewMode}
                  timelineRange={timelineRange}
                  highlightId={highlightItemId}
                />
              )}

              {layers.milestones && milestones.length > 0 && (
                <MilestonesLayer
                  milestones={milestones}
                  projectId={project.id}
                  viewMode={viewMode}
                  timelineRange={timelineRange}
                  highlightId={highlightItemId}
                />
              )}

              {layers.stages && stages.length > 0 && (
                <StagesLayer
                  stages={stages}
                  projectId={project.id}
                  projectStartDate={project.startDate}
                  viewMode={viewMode}
                  timelineRange={timelineRange}
                  highlightId={highlightItemId}
                />
              )}

              {layers.deliverables && deliverables.length > 0 && (
                <DeliverablesLayer
                  deliverables={deliverables}
                  epics={epics}
                  projectId={project.id}
                  viewMode={viewMode}
                  timelineRange={timelineRange}
                  highlightId={highlightItemId}
                  expandedDeliverables={expandedDeliverables}
                  onToggleDeliverable={handleToggleDeliverable}
                />
              )}

              {!layers.sprints && !layers.milestones && !layers.stages && !layers.deliverables && (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <p>No layers selected. Use the Layers button to show timeline content.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
