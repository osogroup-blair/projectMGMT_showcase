import { DayPlan } from "@/types/home";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkBlockCard } from "./work-block-card";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";

interface WeekPlannerProps {
  dayPlans: DayPlan[];
}

export function WeekPlanner({ dayPlans }: WeekPlannerProps) {
  // Sort plans by date
  const sortedPlans = [...dayPlans].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary" />
          My Week
        </h2>
        <div className="flex gap-2">
          {/* Week navigation could go here */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {sortedPlans.map(plan => {
          const date = parseISO(plan.date);
          const isToday = new Date().toDateString() === date.toDateString();
          
          return (
             <Card key={plan.date} className={`flex flex-col h-full ${isToday ? 'border-primary/50 shadow-sm' : ''}`}>
               <CardHeader className="p-3 pb-2 border-b bg-muted/20">
                 <div className="flex justify-between items-center">
                   <div className="flex flex-col">
                     <span className="text-xs font-medium text-muted-foreground uppercase">{format(date, 'EEE')}</span>
                     <span className={`text-lg font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                       {format(date, 'd')}
                     </span>
                   </div>
                   {isToday && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Today</span>}
                 </div>
               </CardHeader>
               <CardContent className="p-2 flex-1 flex flex-col gap-2 min-h-[150px]">
                 {plan.workBlocks.length > 0 ? (
                   plan.workBlocks.map(block => (
                     <WorkBlockCard key={block.id} block={block} />
                   ))
                 ) : (
                   <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/40 border-2 border-dashed border-muted rounded-md m-1">
                     <span className="text-xs">No blocks</span>
                   </div>
                 )}
                 <Button variant="ghost" size="sm" className="w-full h-7 text-xs text-muted-foreground hover:text-primary border border-dashed border-transparent hover:border-primary/30">
                   <Plus className="w-3 h-3 mr-1" /> Add Block
                 </Button>
               </CardContent>
             </Card>
          );
        })}
      </div>
    </div>
  );
}
