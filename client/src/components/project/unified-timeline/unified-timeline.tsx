import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { differenceInDays } from "date-fns";
import { TimelineHeader } from "./timeline-header";
import { TimelineAxis } from "./timeline-axis";
import { TimelineGrid } from "./timeline-grid";
import { TimelineSidebar } from "./timeline-sidebar";
import { SprintsLayer, SPRINTS_LAYER_HEIGHT } from "./layers/sprints-layer";
import { MilestonesLayer, MILESTONES_LAYER_HEIGHT } from "./layers/milestones-layer";
import { StagesLayer, STAGES_LAYER_HEIGHT } from "./layers/stages-layer";
import { DeliverablesLayer, getDeliverablesLayerHeight } from "./layers/deliverables-layer";
import { VIEW_MODE_CONFIGS, calculateTimelineRange, parseDate } from "./timeline-utils";
import type { 
  UnifiedTimelineProps, 
  ViewMode, 
  LayerVisibility, 
  LayerType 
} from "./types";

const AXIS_HEIGHT = 48;

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
  const sidebarRef = useRef<HTMLDivElement>(null);
  
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

  const layerHeights = useMemo(() => ({
    milestones: layers.milestones && milestones.length > 0 ? MILESTONES_LAYER_HEIGHT : 0,
    sprints: layers.sprints && sprints.length > 0 ? SPRINTS_LAYER_HEIGHT : 0,
    stages: layers.stages && stages.length > 0 ? STAGES_LAYER_HEIGHT : 0,
    deliverables: layers.deliverables && deliverables.length > 0 
      ? getDeliverablesLayerHeight(deliverables, epics, expandedDeliverables) 
      : 0,
  }), [layers, milestones, sprints, stages, deliverables, epics, expandedDeliverables]);

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

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current && sidebarRef.current) {
      sidebarRef.current.scrollTop = scrollContainerRef.current.scrollTop;
    }
  }, []);

  const hasAnyLayers = layerHeights.milestones > 0 || layerHeights.sprints > 0 || 
                       layerHeights.stages > 0 || layerHeights.deliverables > 0;

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

        <div className="flex flex-1 overflow-hidden">
          <div 
            ref={sidebarRef}
            className="flex-shrink-0 w-36 border-r bg-background overflow-hidden"
          >
            <div 
              className="h-12 border-b flex items-center px-3 bg-muted/30"
              style={{ height: AXIS_HEIGHT }}
            >
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Layers
              </span>
            </div>

            <div className="flex flex-col">
              {layers.milestones && milestones.length > 0 && (
                <div
                  className="flex items-center px-3 border-b bg-amber-50/30"
                  style={{ height: layerHeights.milestones }}
                  data-testid="sidebar-label-milestones"
                >
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Milestones
                  </span>
                </div>
              )}
              
              {layers.sprints && sprints.length > 0 && (
                <div
                  className="flex items-center px-3 border-b bg-slate-50/50"
                  style={{ height: layerHeights.sprints }}
                  data-testid="sidebar-label-sprints"
                >
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Sprints
                  </span>
                </div>
              )}
              
              {layers.stages && stages.length > 0 && (
                <div
                  className="flex items-center px-3 border-b bg-emerald-50/30"
                  style={{ height: layerHeights.stages }}
                  data-testid="sidebar-label-stages"
                >
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Stages
                  </span>
                </div>
              )}
              
              {layers.deliverables && deliverables.length > 0 && (
                <div
                  className="flex items-center px-3 border-b bg-blue-50/30"
                  style={{ height: layerHeights.deliverables }}
                  data-testid="sidebar-label-deliverables"
                >
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Deliverables
                  </span>
                </div>
              )}
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-auto"
            onScroll={handleScroll}
            data-testid="timeline-scroll-container"
          >
            <div style={{ width: totalWidth + 200, minHeight: totalHeight }}>
              <TimelineAxis
                viewMode={viewMode}
                timelineRange={timelineRange}
                totalWidth={totalWidth}
              />

              <div className="relative">
                <TimelineGrid
                  viewMode={viewMode}
                  timelineRange={timelineRange}
                  totalWidth={totalWidth}
                  totalHeight={totalHeight}
                />

                {layers.milestones && milestones.length > 0 && (
                  <MilestonesLayer
                    milestones={milestones}
                    projectId={project.id}
                    viewMode={viewMode}
                    timelineRange={timelineRange}
                    highlightId={highlightItemId}
                  />
                )}

                {layers.sprints && sprints.length > 0 && (
                  <SprintsLayer
                    sprints={sprints}
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

                {!hasAnyLayers && (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <p>No layers selected. Use the toggles above to show timeline content.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
