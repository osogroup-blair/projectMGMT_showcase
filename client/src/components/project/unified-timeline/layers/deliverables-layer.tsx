import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
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
      <div className="sticky left-0 top-0 h-8 bg-background border-b flex items-center px-3 z-10">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Deliverables & Epics
        </span>
      </div>

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
    <div className="relative h-12 border-b bg-blue-50/20 hover:bg-blue-50/40 transition-colors">
      <div className="absolute left-0 top-0 h-full w-32 bg-background border-r flex items-center gap-1 px-2 z-10">
        {hasEpics && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="p-0.5 hover:bg-muted rounded"
            data-testid={`btn-toggle-deliverable-${deliverable.id}`}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        )}
        <span className="text-xs font-medium truncate" style={{ color: deliverable.color }}>
          {deliverable.title}
        </span>
      </div>

      <div className="ml-32 relative h-full">
        {start && (
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                initial={{ opacity: 0, scaleX: 0.9 }}
                animate={{ opacity: 1, scaleX: 1 }}
                className={cn(
                  "absolute top-2 h-8 rounded-md px-3 flex items-center gap-2 cursor-pointer transition-all",
                  "hover:ring-2 hover:ring-primary/50 focus:ring-2 focus:ring-primary focus:outline-none",
                  isHighlighted && "ring-2 ring-primary ring-offset-2"
                )}
                style={{
                  left,
                  width: Math.max(width, 100),
                  backgroundColor: deliverable.color,
                }}
                onClick={onClick}
                data-testid={`timeline-deliverable-${deliverable.id}`}
              >
                <span className="text-xs font-medium text-white truncate flex-1">
                  {deliverable.title}
                </span>
                {typeof deliverable.progress === "number" && (
                  <span className="text-[10px] text-white/80">{deliverable.progress}%</span>
                )}
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-2">
                <p className="font-medium">{deliverable.title}</p>
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
    <div className="relative h-10 border-b bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
      <div className="absolute left-0 top-0 h-full w-32 bg-background border-r flex items-center gap-1 pl-8 pr-2 z-10">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs text-muted-foreground truncate">{epic.title}</span>
      </div>

      <div className="ml-32 relative h-full">
        {start && (
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "absolute top-1.5 h-7 rounded px-2 flex items-center gap-2 cursor-pointer transition-all border-2",
                  "hover:ring-2 hover:ring-primary/50 focus:ring-2 focus:ring-primary focus:outline-none",
                  isHighlighted && "ring-2 ring-primary ring-offset-1"
                )}
                style={{
                  left,
                  width: Math.max(width, 60),
                  borderColor: color,
                  backgroundColor: `${color}20`,
                }}
                onClick={onClick}
                data-testid={`timeline-epic-${epic.id}`}
              >
                <span className="text-xs font-medium truncate" style={{ color }}>
                  {epic.title}
                </span>
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-1">
                <p className="font-medium">{epic.title}</p>
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
