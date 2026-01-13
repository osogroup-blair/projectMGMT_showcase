import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { differenceInDays } from "date-fns";
import { TimelineHeader } from "./timeline-header";
import { TimelineAxis } from "./timeline-axis";
import { TimelineGrid } from "./timeline-grid";
import { SprintsLayer, getSprintsLayerHeight } from "./layers/sprints-layer";
import { MilestonesLayer, getMilestonesLayerHeight } from "./layers/milestones-layer";
import { StagesLayer, getStagesLayerHeight } from "./layers/stages-layer";
import { DeliverablesLayer, getDeliverablesLayerHeight, DELIVERABLE_ROW_HEIGHT, EPIC_ROW_HEIGHT } from "./layers/deliverables-layer";
import { ScheduleSyncPrompt } from "./components/schedule-sync-prompt";
import { useScheduleSync } from "@/hooks/use-schedule-sync";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getDeliverableColor } from "./types";
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

  const {
    evaluateChange,
    isEvaluating,
    changePlan,
    isPromptOpen,
    handlePromptComplete,
    handlePromptOpenChange,
  } = useScheduleSync();

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
    stages: layers.stages && stages.length > 0 
      ? getStagesLayerHeight(stages, project.startDate, timelineRange, config.dayWidth)
      : 0,
    sprints: layers.sprints && sprints.length > 0 
      ? getSprintsLayerHeight(sprints, timelineRange, config.dayWidth)
      : 0,
    milestones: layers.milestones && milestones.length > 0 
      ? getMilestonesLayerHeight(milestones, timelineRange, config.dayWidth)
      : 0,
    deliverables: layers.deliverables && deliverables.length > 0 
      ? getDeliverablesLayerHeight(deliverables, epics, expandedDeliverables) 
      : 0,
  }), [layers, milestones, sprints, stages, deliverables, epics, expandedDeliverables, timelineRange, config.dayWidth, project.startDate]);

  const totalHeight = Object.values(layerHeights).reduce((a, b) => a + b, 0) + 100;

  useEffect(() => {
    if (scrollContainerRef.current) {
      const today = new Date();
      const targetPos = differenceInDays(today, timelineRange.start) * config.dayWidth;
      const containerWidth = scrollContainerRef.current.clientWidth;
      // Position "today" at 2/8ths (25%) from the left edge
      scrollContainerRef.current.scrollTo({
        left: Math.max(0, targetPos - containerWidth * 0.25),
        behavior: "smooth",
      });
    }
  }, [viewMode, config.dayWidth, timelineRange.start]);

  useEffect(() => {
    if (highlightItemId && scrollContainerRef.current) {
      const element = document.querySelector(`[data-testid*="${highlightItemId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      }
    }
  }, [highlightItemId]);

  const handleScroll = useCallback(() => {
    // Horizontal scroll only - no vertical sync needed since content expands naturally
  }, []);

  const hasAnyLayers = layerHeights.milestones > 0 || layerHeights.sprints > 0 || 
                       layerHeights.stages > 0 || layerHeights.deliverables > 0;

  return (
    <TooltipProvider>
      <div className="flex flex-col bg-background rounded-lg border">
        <TimelineHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onTodayClick={handleTodayClick}
          layers={layers}
          onLayerToggle={handleLayerToggle}
        />

        <div className="flex">
          <div 
            className="flex-shrink-0 w-48 border-r bg-background flex flex-col"
          >
            <div 
              className="h-12 border-b flex items-center px-3 bg-muted/30 shrink-0 sticky top-0 z-10"
              style={{ height: AXIS_HEIGHT }}
            >
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Layers
              </span>
            </div>

            <div 
              ref={sidebarRef}
              data-testid="sidebar-scroll-container"
            >
              <div className="flex flex-col" style={{ paddingBottom: 100 }}>
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
                
                {layers.deliverables && deliverables.length > 0 && (
                  <div data-testid="sidebar-label-deliverables">
                    {deliverables.map((deliverable) => {
                      const isExpanded = expandedDeliverables.has(deliverable.id);
                      const deliverableEpics = epics.filter((e) => e.deliverableId === deliverable.id);
                      const hasEpics = deliverableEpics.length > 0;
                      const color = getDeliverableColor(deliverable.id);

                      return (
                        <div key={deliverable.id}>
                          <div
                            className="flex items-center gap-1.5 px-2 border-b hover:opacity-80 transition-colors cursor-pointer"
                            style={{ 
                              height: DELIVERABLE_ROW_HEIGHT,
                              borderLeft: `4px solid ${color}`,
                              backgroundColor: `${color}08`,
                            }}
                            onClick={() => hasEpics && handleToggleDeliverable(deliverable.id)}
                            data-testid={`sidebar-deliverable-${deliverable.id}`}
                          >
                            {hasEpics ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleDeliverable(deliverable.id);
                                }}
                                className="p-0.5 hover:bg-muted rounded shrink-0"
                                data-testid={`btn-sidebar-toggle-${deliverable.id}`}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                )}
                              </button>
                            ) : (
                              <div className="w-4 shrink-0" />
                            )}
                            <div 
                              className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" 
                              style={{ backgroundColor: color }} 
                            />
                            <span 
                              className="text-xs font-semibold truncate"
                              style={{ color }}
                            >
                              {deliverable.title}
                            </span>
                          </div>

                          {isExpanded && hasEpics && deliverableEpics.map((epic) => (
                            <div
                              key={epic.id}
                              className="flex items-center gap-1.5 pl-7 pr-2 border-b hover:opacity-80 transition-colors"
                              style={{ 
                                height: EPIC_ROW_HEIGHT,
                                borderLeft: `4px solid ${color}`,
                                backgroundColor: `${color}05`,
                              }}
                              data-testid={`sidebar-epic-${epic.id}`}
                            >
                              <div 
                                className="w-1.5 h-1.5 rounded-full shrink-0" 
                                style={{ backgroundColor: color }} 
                              />
                              <span 
                                className="text-xs text-muted-foreground truncate"
                              >
                                {epic.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-x-auto"
            style={{ overflowY: 'visible' }}
            onScroll={handleScroll}
            data-testid="timeline-scroll-container"
          >
            <div style={{ width: totalWidth + 200, minHeight: totalHeight }}>
              <div className="sticky top-0 z-30">
                <TimelineAxis
                  viewMode={viewMode}
                  timelineRange={timelineRange}
                  totalWidth={totalWidth}
                />
              </div>

              <div className="relative">
                <TimelineGrid
                  viewMode={viewMode}
                  timelineRange={timelineRange}
                  totalWidth={totalWidth}
                  totalHeight={totalHeight}
                />

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
                    onScheduleSyncEvaluate={evaluateChange}
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
      <ScheduleSyncPrompt
        open={isPromptOpen}
        onOpenChange={handlePromptOpenChange}
        changePlan={changePlan}
        onComplete={handlePromptComplete}
      />
    </TooltipProvider>
  );
}
