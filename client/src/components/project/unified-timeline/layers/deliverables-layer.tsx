import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Package, GitBranch } from "lucide-react";
import type { Deliverable, Epic } from "@shared/schema";
import type { ViewMode, TimelineRange, DeliverableWithEpics } from "../types";
import { getPosition, getWidth, parseDate, formatDateRange, VIEW_MODE_CONFIGS } from "../timeline-utils";
import { getDeliverableColor } from "../types";

interface DeliverablesLayerProps {
  deliverables: Deliverable[];
  epics: Epic[];
  projectId: string;
  viewMode: ViewMode;
  timelineRange: TimelineRange;
  highlightId?: string;
  expandedDeliverables: Set<string>;
  onToggleDeliverable: (id: string) => void;
}

export const DELIVERABLE_ROW_HEIGHT = 48;
export const EPIC_ROW_HEIGHT = 40;
export const DELIVERABLES_HEADER_HEIGHT = 32;

export function DeliverablesLayer({
  deliverables,
  epics,
  projectId,
  viewMode,
  timelineRange,
  highlightId,
  expandedDeliverables,
  onToggleDeliverable,
}: DeliverablesLayerProps) {
  const [, navigate] = useLocation();
  const config = VIEW_MODE_CONFIGS[viewMode];

  const deliverablesWithEpics: DeliverableWithEpics[] = deliverables.map((d) => ({
    ...d,
    epics: epics.filter((e) => e.deliverableId === d.id),
    color: getDeliverableColor(d.id),
  }));

  const handleDeliverableClick = (deliverableId: string) => {
    navigate(`/projects/${projectId}/deliverables/${deliverableId}`);
  };

  const handleEpicClick = (epicId: string) => {
    navigate(`/projects/${projectId}/epics/${epicId}`);
  };

  return (
    <div className="border-b">
      {deliverablesWithEpics.map((deliverable) => {
        const isExpanded = expandedDeliverables.has(deliverable.id);
        const hasEpics = deliverable.epics.length > 0;

        return (
          <div key={deliverable.id}>
            <DeliverableRow
              deliverable={deliverable}
              projectId={projectId}
              viewMode={viewMode}
              timelineRange={timelineRange}
              highlightId={highlightId}
              isExpanded={isExpanded}
              hasEpics={hasEpics}
              onToggle={() => onToggleDeliverable(deliverable.id)}
              onClick={() => handleDeliverableClick(deliverable.id)}
              config={config}
            />

            <AnimatePresence>
              {isExpanded && hasEpics && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {deliverable.epics.map((epic) => (
                    <EpicRow
                      key={epic.id}
                      epic={epic}
                      color={deliverable.color}
                      viewMode={viewMode}
                      timelineRange={timelineRange}
                      highlightId={highlightId}
                      onClick={() => handleEpicClick(epic.id)}
                      config={config}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

interface DeliverableRowProps {
  deliverable: DeliverableWithEpics;
  projectId: string;
  viewMode: ViewMode;
  timelineRange: TimelineRange;
  highlightId?: string;
  isExpanded: boolean;
  hasEpics: boolean;
  onToggle: () => void;
  onClick: () => void;
  config: typeof VIEW_MODE_CONFIGS["month"];
}

function DeliverableRow({
  deliverable,
  viewMode,
  timelineRange,
  highlightId,
  isExpanded,
  hasEpics,
  onToggle,
  onClick,
  config,
}: DeliverableRowProps) {
  const start = parseDate(deliverable.startDate);
  const end = parseDate(deliverable.dueDate);
  const isHighlighted = highlightId === deliverable.id;

  const left = start ? getPosition(start, timelineRange.start, config.dayWidth) : 0;
  const width = start && end ? getWidth(start, end, config.dayWidth) : 100;

  return (
    <div 
      className="relative border-b hover:bg-blue-50/40 transition-colors"
      style={{ 
        height: DELIVERABLE_ROW_HEIGHT,
        borderLeft: `4px solid ${deliverable.color}`,
        backgroundColor: `${deliverable.color}08`,
      }}
    >
      <div className="relative h-full">
        {start && (
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                initial={{ opacity: 0, scaleX: 0.9 }}
                animate={{ opacity: 1, scaleX: 1 }}
                className={cn(
                  "absolute top-2 h-8 rounded-md px-3 flex items-center gap-2 cursor-pointer transition-all shadow-sm",
                  "hover:ring-2 hover:ring-offset-1 focus:ring-2 focus:ring-primary focus:outline-none",
                  isHighlighted && "ring-2 ring-primary ring-offset-2"
                )}
                style={{
                  left,
                  width: Math.max(width, 120),
                  backgroundColor: deliverable.color,
                  boxShadow: `0 2px 4px ${deliverable.color}40`,
                }}
                onClick={onClick}
                data-testid={`timeline-deliverable-${deliverable.id}`}
              >
                <Package className="w-3.5 h-3.5 text-white/90 shrink-0" />
                <span className="text-xs font-semibold text-white truncate flex-1">
                  {deliverable.title}
                </span>
                {typeof deliverable.progress === "number" && (
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white font-medium">
                    {deliverable.progress}%
                  </span>
                )}
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full shrink-0" 
                    style={{ backgroundColor: deliverable.color }} 
                  />
                  <p className="font-medium">{deliverable.title}</p>
                </div>
                <p className="text-xs text-muted-foreground">{deliverable.description}</p>
                {start && end && (
                  <p className="text-xs">{formatDateRange(start, end)}</p>
                )}
                <p className="text-xs capitalize">Status: {deliverable.status}</p>
                {typeof deliverable.progress === "number" && (
                  <div className="space-y-1">
                    <p className="text-xs">Progress: {deliverable.progress}%</p>
                    <Progress value={deliverable.progress} className="h-1.5" />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {deliverable.epics.length} epic{deliverable.epics.length !== 1 ? "s" : ""}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

interface EpicRowProps {
  epic: Epic;
  color: string;
  viewMode: ViewMode;
  timelineRange: TimelineRange;
  highlightId?: string;
  onClick: () => void;
  config: typeof VIEW_MODE_CONFIGS["month"];
}

function EpicRow({
  epic,
  color,
  viewMode,
  timelineRange,
  highlightId,
  onClick,
  config,
}: EpicRowProps) {
  const start = parseDate(epic.startDate);
  const end = parseDate(epic.endDate);
  const isHighlighted = highlightId === epic.id;

  const left = start ? getPosition(start, timelineRange.start, config.dayWidth) : 0;
  const width = start && end ? getWidth(start, end, config.dayWidth) : 60;

  return (
    <div 
      className="relative border-b hover:bg-slate-100/50 transition-colors"
      style={{ 
        height: EPIC_ROW_HEIGHT,
        borderLeft: `4px solid ${color}`,
        backgroundColor: `${color}05`,
      }}
    >
      <div className="relative h-full">
        {start && (
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "absolute top-1 h-7 rounded px-2 flex items-center gap-1.5 cursor-pointer transition-all border-l-2",
                  "hover:ring-2 hover:ring-primary/50 focus:ring-2 focus:ring-primary focus:outline-none",
                  isHighlighted && "ring-2 ring-primary ring-offset-1"
                )}
                style={{
                  left,
                  width: Math.max(width, 80),
                  borderLeftColor: color,
                  backgroundColor: `${color}15`,
                }}
                onClick={onClick}
                data-testid={`timeline-epic-${epic.id}`}
              >
                <GitBranch className="w-3 h-3 shrink-0" style={{ color }} />
                <span className="text-xs font-medium truncate" style={{ color }}>
                  {epic.title}
                </span>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full shrink-0" 
                    style={{ backgroundColor: color }} 
                  />
                  <p className="font-medium">{epic.title}</p>
                </div>
                <p className="text-xs text-muted-foreground">{epic.description}</p>
                {start && end && (
                  <p className="text-xs">{formatDateRange(start, end)}</p>
                )}
                <p className="text-xs capitalize">Status: {epic.status}</p>
                {typeof epic.progress === "number" && (
                  <p className="text-xs">Progress: {epic.progress}%</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

export function getDeliverablesLayerHeight(
  deliverables: Deliverable[],
  epics: Epic[],
  expandedDeliverables: Set<string>
): number {
  let height = deliverables.length * DELIVERABLE_ROW_HEIGHT;
  
  deliverables.forEach((d) => {
    if (expandedDeliverables.has(d.id)) {
      const epicCount = epics.filter((e) => e.deliverableId === d.id).length;
      height += epicCount * EPIC_ROW_HEIGHT;
    }
  });
  
  return height;
}
