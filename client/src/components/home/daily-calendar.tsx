import { WorkBlock, HomeTask } from "@/types/home";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import { Calendar, Clock, Plus } from "lucide-react";
import { format, addMinutes, parse, set } from "date-fns";

interface DailyCalendarProps {
  date: string; // YYYY-MM-DD
  events: WorkBlock[];
  tasks: HomeTask[]; // To lookup task details for events
}

// Generate time slots from 8:00 AM to 6:00 PM
const TIME_SLOTS = Array.from({ length: 20 }, (_, i) => {
  const startHour = 8;
  const minutes = i * 30;
  const hour = startHour + Math.floor(minutes / 60);
  const min = minutes % 60;
  return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`;
});

function CalendarSlot({ time, events, tasks }: { time: string, events: WorkBlock[], tasks: HomeTask[] }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${time}`,
    data: { type: 'calendar-slot', time }
  });

  // Find events starting at this time
  const slotEvents = events.filter(e => e.startTime.startsWith(time.substring(0, 5)));

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "relative flex border-b border-border/50 min-h-[60px] group transition-colors",
        isOver ? "bg-primary/10" : "hover:bg-muted/20"
      )}
    >
      {/* Time Label */}
      <div className="w-16 flex-none py-2 px-2 text-xs text-muted-foreground text-right border-r border-border/50">
        {time.substring(0, 5)}
      </div>

      {/* Content Area */}
      <div className="flex-1 relative p-1">
        {/* Placeholder/Guide */}
        {slotEvents.length === 0 && (
           <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
             <div className="flex items-center text-xs text-muted-foreground/50">
               <Plus className="w-3 h-3 mr-1" />
               Drop task here
             </div>
           </div>
        )}

        {/* Events */}
        {slotEvents.map(event => {
          // Calculate height based on duration (30min = 60px approx)
          // Simple estimation for prototype
          const durationMinutes = event.totalPlannedMinutes || 30;
          const height = Math.max((durationMinutes / 30) * 60 - 4, 56); 
          
          return (
            <div 
              key={event.id}
              className={cn(
                "absolute left-1 right-1 top-1 rounded-md border p-2 text-xs shadow-sm overflow-hidden z-10",
                event.status === 'in_progress' ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-card-foreground"
              )}
              style={{ height: `${height}px` }}
            >
              <div className="font-semibold truncate">{event.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                {event.taskIds.length} tasks • {durationMinutes}m
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DailyCalendar({ date, events, tasks }: DailyCalendarProps) {
  return (
    <Card className="h-full flex flex-col overflow-hidden border shadow-sm">
      <CardHeader className="py-4 px-6 border-b bg-muted/20">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Schedule
          <span className="text-xs font-normal text-muted-foreground ml-auto">
            {format(parse(date, 'yyyy-MM-dd', new Date()), 'MMMM d, yyyy')}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden relative">
        <ScrollArea className="h-[600px]">
          <div className="flex flex-col bg-background">
             {TIME_SLOTS.map(time => (
               <CalendarSlot key={time} time={time} events={events} tasks={tasks} />
             ))}
          </div>
        </ScrollArea>
        
        {/* Current Time Indicator (Mock) */}
        <div 
          className="absolute left-0 right-0 border-t-2 border-red-400 z-20 pointer-events-none flex items-center"
          style={{ top: '180px' }} // Mock position ~9:30 AM
        >
           <div className="w-2 h-2 rounded-full bg-red-400 -ml-1" />
        </div>
      </CardContent>
    </Card>
  );
}
