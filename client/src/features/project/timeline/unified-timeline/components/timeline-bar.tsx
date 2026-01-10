import { useState, useRef, useCallback, useMemo, useEffect } from "react";
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
  const [isHovered, setIsHovered] = useState(false);
  const [dragMode, setDragMode] = useState<DragMode>("none");
  const [tempLeft, setTempLeft] = useState(left);
  const [tempWidth, setTempWidth] = useState(width);
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStateRef = useRef({
    startX: 0,
    initialLeft: left,
    initialWidth: width,
    mode: "none" as DragMode,
    startDate,
    endDate,
    id,
    dayWidth,
    left,
    width,
    onDateChange,
  });

  useEffect(() => {
    dragStateRef.current.startDate = startDate;
    dragStateRef.current.endDate = endDate;
    dragStateRef.current.id = id;
    dragStateRef.current.dayWidth = dayWidth;
    dragStateRef.current.left = left;
    dragStateRef.current.width = width;
    dragStateRef.current.onDateChange = onDateChange;
  }, [startDate, endDate, id, dayWidth, left, width, onDateChange]);

  const duration = useMemo(() => differenceInDays(endDate, startDate), [startDate, endDate]);

  const pixelsToDays = useCallback((pixels: number, dw: number) => {
    return Math.round(pixels / dw);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { startX, initialLeft, initialWidth, mode, dayWidth: dw } = dragStateRef.current;
      const deltaX = e.clientX - startX;
      
      if (mode === "move") {
        setTempLeft(initialLeft + deltaX);
      } else if (mode === "resize-left") {
        const newLeft = initialLeft + deltaX;
        const newWidth = initialWidth - deltaX;
        if (newWidth > dw) {
          setTempLeft(newLeft);
          setTempWidth(newWidth);
        }
      } else if (mode === "resize-right") {
        const newWidth = initialWidth + deltaX;
        if (newWidth > dw) {
          setTempWidth(newWidth);
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const state = dragStateRef.current;
      const deltaX = e.clientX - state.startX;
      const daysDelta = pixelsToDays(deltaX, state.dayWidth);
      
      let newStartDate = state.startDate;
      let newEndDate = state.endDate;
      
      if (state.mode === "move") {
        newStartDate = addDays(state.startDate, daysDelta);
        newEndDate = addDays(state.endDate, daysDelta);
      } else if (state.mode === "resize-left") {
        newStartDate = addDays(state.startDate, daysDelta);
        if (newStartDate >= state.endDate) {
          newStartDate = addDays(state.endDate, -1);
        }
      } else if (state.mode === "resize-right") {
        newEndDate = addDays(state.endDate, daysDelta);
        if (newEndDate <= state.startDate) {
          newEndDate = addDays(state.startDate, 1);
        }
      }
      
      if (state.onDateChange && (newStartDate.getTime() !== state.startDate.getTime() || newEndDate.getTime() !== state.endDate.getTime())) {
        state.onDateChange(state.id, newStartDate, newEndDate);
      }
      
      setTempLeft(state.left);
      setTempWidth(state.width);
      setDragMode("none");
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, pixelsToDays]);

  const handleMouseDown = useCallback((_e: React.MouseEvent, _mode: DragMode) => {
    // Drag functionality temporarily disabled - use hover card date pickers instead
  }, []);

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
          animate={{ 
            opacity: 1, 
            scaleX: 1,
            scale: isHovered ? 1.02 : 1,
            y: isHovered ? -2 : 0,
          }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 25,
            scale: { duration: 0.15 },
            y: { duration: 0.15 }
          }}
          className={cn(
            "absolute rounded-md flex items-center group select-none",
            "transition-all duration-150",
            colorClass,
            isHighlighted && "ring-2 ring-primary ring-offset-2",
            isDragging && "z-50 shadow-lg",
            isHovered && !isDragging && "z-40 shadow-xl ring-2 ring-white/50",
            canEdit ? "cursor-grab" : "cursor-pointer",
            isDragging && "cursor-grabbing"
          )}
          style={{ 
            left: displayLeft, 
            width: displayWidth, 
            top, 
            height,
            backgroundColor,
            filter: isHovered ? 'brightness(1.1)' : 'brightness(1)',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => !isDragging && setIsHovered(false)}
          data-testid={testId}
        >
          {canEdit && (
            <div
              className={cn(
                "absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize flex items-center justify-center",
                "opacity-0 group-hover:opacity-100 transition-opacity",
                "hover:bg-black/20 rounded-l-md"
              )}
              onMouseDown={(e) => handleMouseDown(e, "resize-left")}
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
            onMouseDown={(e) => canEdit && handleMouseDown(e, "move")}
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
              onMouseDown={(e) => handleMouseDown(e, "resize-right")}
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
  const [isHovered, setIsHovered] = useState(false);
  
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
          animate={{ 
            opacity: 1, 
            scale: isHovered ? 1.3 : 1,
            y: isHovered ? -3 : 0,
          }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 20,
          }}
          className={cn(
            "absolute cursor-pointer",
            "transition-all",
            isHighlighted && "ring-2 ring-primary ring-offset-2 rounded-sm",
            isHovered && "z-50"
          )}
          style={{ 
            left: left - size / 2, 
            top,
            width: size,
            height: size,
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          data-testid={testId}
        >
          <div 
            className={cn(
              "w-full h-full rotate-45 rounded-sm transition-shadow duration-150",
              colorClass,
              isHovered && "shadow-lg"
            )}
            style={{
              filter: isHovered ? 'brightness(1.15)' : 'brightness(1)',
            }}
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
