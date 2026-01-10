import { useState, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { format, addDays, differenceInDays } from "date-fns";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, GripVertical, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

export interface TimelineBarProps {
  id: string;
  name: string;
  description?: string | null;
  startDate: Date;
  endDate: Date;
  left: number;
  width: number;
  top: number;
  height: number;
  dayWidth: number;
  colorClass?: string;
  backgroundColor?: string;
  textColorClass?: string;
  isHighlighted?: boolean;
  onClick?: () => void;
  onDateChange?: (id: string, startDate: Date, endDate: Date) => void;
  renderBadge?: React.ReactNode;
  testId?: string;
}

type DragMode = "none" | "move" | "resize-left" | "resize-right";

export function TimelineBar({
  id,
  name,
  description,
  startDate,
  endDate,
  left,
  width,
  top,
  height,
  dayWidth,
  colorClass = "",
  backgroundColor,
  textColorClass = "text-white",
  isHighlighted,
  onClick,
  onDateChange,
  renderBadge,
  testId,
}: TimelineBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const captureElementRef = useRef<HTMLElement | null>(null);
  const capturePointerIdRef = useRef<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [dragMode, setDragMode] = useState<DragMode>("none");
  const [dragStartX, setDragStartX] = useState(0);
  const [initialLeft, setInitialLeft] = useState(left);
  const [initialWidth, setInitialWidth] = useState(width);
  const [tempLeft, setTempLeft] = useState(left);
  const [tempWidth, setTempWidth] = useState(width);
  const [isDragging, setIsDragging] = useState(false);

  const duration = useMemo(() => differenceInDays(endDate, startDate), [startDate, endDate]);

  const pixelsToDays = useCallback((pixels: number) => {
    return Math.round(pixels / dayWidth);
  }, [dayWidth]);

  const handlePointerDown = useCallback((e: React.PointerEvent, mode: DragMode) => {
    if (!onDateChange) return;
    e.preventDefault();
    e.stopPropagation();
    
    setDragMode(mode);
    setDragStartX(e.clientX);
    setInitialLeft(left);
    setInitialWidth(width);
    setTempLeft(left);
    setTempWidth(width);
    setIsDragging(true);
    
    const target = e.currentTarget as HTMLElement;
    captureElementRef.current = target;
    capturePointerIdRef.current = e.pointerId;
    target.setPointerCapture(e.pointerId);
  }, [left, width, onDateChange]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragMode === "none" || !isDragging) return;
    
    const deltaX = e.clientX - dragStartX;
    
    if (dragMode === "move") {
      setTempLeft(initialLeft + deltaX);
    } else if (dragMode === "resize-left") {
      const newLeft = initialLeft + deltaX;
      const newWidth = initialWidth - deltaX;
      if (newWidth > dayWidth * 1) {
        setTempLeft(newLeft);
        setTempWidth(newWidth);
      }
    } else if (dragMode === "resize-right") {
      const newWidth = initialWidth + deltaX;
      if (newWidth > dayWidth * 1) {
        setTempWidth(newWidth);
      }
    }
  }, [dragMode, isDragging, dragStartX, initialLeft, initialWidth, dayWidth]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (dragMode === "none" || !isDragging || !onDateChange) {
      setDragMode("none");
      setIsDragging(false);
      return;
    }
    
    if (captureElementRef.current && capturePointerIdRef.current !== null) {
      try {
        captureElementRef.current.releasePointerCapture(capturePointerIdRef.current);
      } catch {
        // Pointer capture may have been released already
      }
      captureElementRef.current = null;
      capturePointerIdRef.current = null;
    }
    
    const deltaX = e.clientX - dragStartX;
    const daysDelta = pixelsToDays(deltaX);
    
    let newStartDate = startDate;
    let newEndDate = endDate;
    
    if (dragMode === "move") {
      newStartDate = addDays(startDate, daysDelta);
      newEndDate = addDays(endDate, daysDelta);
    } else if (dragMode === "resize-left") {
      newStartDate = addDays(startDate, daysDelta);
      if (newStartDate >= endDate) {
        newStartDate = addDays(endDate, -1);
      }
    } else if (dragMode === "resize-right") {
      newEndDate = addDays(endDate, daysDelta);
      if (newEndDate <= startDate) {
        newEndDate = addDays(startDate, 1);
      }
    }
    
    if (newStartDate.getTime() !== startDate.getTime() || newEndDate.getTime() !== endDate.getTime()) {
      onDateChange(id, newStartDate, newEndDate);
    }
    
    setTempLeft(left);
    setTempWidth(width);
    setDragMode("none");
    setIsDragging(false);
  }, [dragMode, isDragging, dragStartX, pixelsToDays, startDate, endDate, id, onDateChange, left, width]);

  const handleQuickAdjust = useCallback((startDelta: number, endDelta: number) => {
    if (!onDateChange) return;
    const newStart = addDays(startDate, startDelta);
    const newEnd = addDays(endDate, endDelta);
    if (newEnd > newStart) {
      onDateChange(id, newStart, newEnd);
    }
  }, [onDateChange, id, startDate, endDate]);

  const handleStartDateSelect = useCallback((date: Date | undefined) => {
    if (!date || !onDateChange) return;
    if (date < endDate) {
      onDateChange(id, date, endDate);
    }
  }, [onDateChange, id, endDate]);

  const handleEndDateSelect = useCallback((date: Date | undefined) => {
    if (!date || !onDateChange) return;
    if (date > startDate) {
      onDateChange(id, startDate, date);
    }
  }, [onDateChange, id, startDate]);

  const displayLeft = isDragging ? tempLeft : left;
  const displayWidth = isDragging ? tempWidth : width;

  const canEdit = !!onDateChange;

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <motion.div
          ref={barRef}
          initial={{ opacity: 0, scaleX: 0.8 }}
          animate={{ opacity: 1, scaleX: 1 }}
          className={cn(
            "absolute rounded-md flex items-center group select-none",
            "transition-shadow",
            colorClass,
            isHighlighted && "ring-2 ring-primary ring-offset-2",
            isDragging && "z-50 shadow-lg",
            canEdit ? "cursor-grab" : "cursor-pointer",
            isDragging && "cursor-grabbing"
          )}
          style={{ 
            left: displayLeft, 
            width: displayWidth, 
            top, 
            height,
            backgroundColor,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => !isDragging && setIsHovered(false)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          data-testid={testId}
        >
          {canEdit && (
            <div
              className={cn(
                "absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize flex items-center justify-center",
                "opacity-0 group-hover:opacity-100 transition-opacity",
                "hover:bg-black/20 rounded-l-md"
              )}
              onPointerDown={(e) => handlePointerDown(e, "resize-left")}
              data-testid={`${testId}-resize-left`}
            >
              <GripVertical className="h-3 w-3 text-white/70" />
            </div>
          )}

          <div 
            className={cn(
              "flex-1 px-3 flex items-center min-w-0",
              canEdit && "cursor-grab"
            )}
            onPointerDown={(e) => canEdit && handlePointerDown(e, "move")}
          >
            <span className={cn("text-xs font-medium truncate", textColorClass)}>
              {name}
            </span>
            {renderBadge}
          </div>

          {canEdit && (
            <div
              className={cn(
                "absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize flex items-center justify-center",
                "opacity-0 group-hover:opacity-100 transition-opacity",
                "hover:bg-black/20 rounded-r-md"
              )}
              onPointerDown={(e) => handlePointerDown(e, "resize-right")}
              data-testid={`${testId}-resize-right`}
            >
              <GripVertical className="h-3 w-3 text-white/70" />
            </div>
          )}
        </motion.div>
      </HoverCardTrigger>

      <HoverCardContent side="top" align="center" className="w-80 p-3" sideOffset={8}>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm">{name}</h4>
              {description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
              )}
            </div>
            {onClick && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                data-testid={`${testId}-view-details`}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                <span className="text-xs">View</span>
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{duration + 1} days</span>
            <span>{format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}</span>
          </div>

          {canEdit && (
            <>
              <div className="border-t pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal h-8">
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          <span className="text-xs">{format(startDate, "MMM d, yyyy")}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={handleStartDateSelect}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal h-8">
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          <span className="text-xs">{format(endDate, "MMM d, yyyy")}</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={handleEndDateSelect}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-1">
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => handleQuickAdjust(-7, 0)}
                    title="Move start 1 week earlier"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    <span className="text-xs">1w</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => handleQuickAdjust(-1, 0)}
                    title="Move start 1 day earlier"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    <span className="text-xs">1d</span>
                  </Button>
                </div>
                <span className="text-xs text-muted-foreground">Quick Adjust</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => handleQuickAdjust(0, 1)}
                    title="Move end 1 day later"
                  >
                    <span className="text-xs">1d</span>
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => handleQuickAdjust(0, 7)}
                    title="Move end 1 week later"
                  >
                    <span className="text-xs">1w</span>
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export interface MilestoneMarkerProps {
  id: string;
  name: string;
  description?: string | null;
  targetDate: Date;
  left: number;
  top: number;
  size: number;
  colorClass: string;
  isHighlighted?: boolean;
  onClick?: () => void;
  onDateChange?: (id: string, date: Date) => void;
  testId?: string;
}

export function MilestoneMarker({
  id,
  name,
  description,
  targetDate,
  left,
  top,
  size,
  colorClass,
  isHighlighted,
  onClick,
  onDateChange,
  testId,
}: MilestoneMarkerProps) {
  const handleDateSelect = useCallback((date: Date | undefined) => {
    if (!date || !onDateChange) return;
    onDateChange(id, date);
  }, [onDateChange, id]);

  const canEdit = !!onDateChange;

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "absolute cursor-pointer",
            "transition-all hover:scale-110",
            isHighlighted && "ring-2 ring-primary ring-offset-2 rounded-sm"
          )}
          style={{ 
            left: left - size / 2, 
            top,
            width: size,
            height: size,
          }}
          data-testid={testId}
        >
          <div 
            className={cn(
              "w-full h-full rotate-45 rounded-sm",
              colorClass
            )}
          />
        </motion.div>
      </HoverCardTrigger>

      <HoverCardContent side="top" align="center" className="w-64 p-3" sideOffset={8}>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm">{name}</h4>
              {description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
              )}
            </div>
            {onClick && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                data-testid={`${testId}-view-details`}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                <span className="text-xs">View</span>
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            Target: {format(targetDate, "MMM d, yyyy")}
          </div>

          {canEdit && (
            <div className="border-t pt-3">
              <label className="text-xs text-muted-foreground mb-1 block">Change Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal h-8">
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    <span className="text-xs">{format(targetDate, "MMM d, yyyy")}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={targetDate}
                    onSelect={handleDateSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
