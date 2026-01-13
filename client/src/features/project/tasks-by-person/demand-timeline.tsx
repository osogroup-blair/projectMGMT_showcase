import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, TrendingUp, Calendar } from "lucide-react";
import { 
  differenceInDays, 
  parseISO, 
  startOfWeek, 
  endOfWeek, 
  addWeeks, 
  format,
  isWithinInterval,
  addDays
} from "date-fns";
import { cn } from "@/lib/utils";

interface DemandTimelineProps {
  tasks: any[];
  users: any[];
}

interface WeekDemand {
  weekStart: Date;
  weekEnd: Date;
  label: string;
  taskCount: number;
  byUser: Map<string, number>;
  peakUsers: string[];
}

export function DemandTimeline({ tasks, users }: DemandTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const completedStatuses = ["Done", "Completed", "COMPLETED", "DONE"];
  
  const weeklyDemand = useMemo(() => {
    const now = new Date();
    const weeks: WeekDemand[] = [];
    
    const openTasks = tasks.filter(t => 
      !completedStatuses.includes(t.status) && t.deadline
    );
    
    for (let i = 0; i < 6; i++) {
      const weekStart = startOfWeek(addWeeks(now, i));
      const weekEnd = endOfWeek(addWeeks(now, i));
      
      const weekTasks = openTasks.filter(t => {
        const deadline = parseISO(t.deadline);
        return isWithinInterval(deadline, { start: weekStart, end: weekEnd });
      });
      
      const byUser = new Map<string, number>();
      weekTasks.forEach(t => {
        if (t.assigneeId) {
          byUser.set(t.assigneeId, (byUser.get(t.assigneeId) || 0) + 1);
        }
      });
      
      const sortedUsers = Array.from(byUser.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([userId]) => {
          const user = users.find(u => u.id === userId);
          return user?.name || user?.firstName || "Unknown";
        });
      
      let label = "";
      if (i === 0) label = "This Week";
      else if (i === 1) label = "Next Week";
      else label = format(weekStart, "MMM d");
      
      weeks.push({
        weekStart,
        weekEnd,
        label,
        taskCount: weekTasks.length,
        byUser,
        peakUsers: sortedUsers,
      });
    }
    
    return weeks;
  }, [tasks, users]);
  
  const maxTasks = Math.max(...weeklyDemand.map(w => w.taskCount), 1);
  
  const getDemandLevel = (count: number): { level: string; color: string } => {
    const ratio = count / maxTasks;
    if (ratio >= 0.8) return { level: "High", color: "bg-red-500" };
    if (ratio >= 0.5) return { level: "Medium", color: "bg-amber-500" };
    if (ratio > 0) return { level: "Low", color: "bg-green-500" };
    return { level: "None", color: "bg-slate-200 dark:bg-slate-700" };
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card className="mb-6" data-testid="demand-timeline">
        <CollapsibleTrigger asChild>
          <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Demand Timeline</CardTitle>
                <Badge variant="outline" className="text-[10px]">Next 6 weeks</Badge>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isExpanded && "rotate-180"
              )} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4">
            <div className="grid grid-cols-6 gap-2">
              {weeklyDemand.map((week, i) => {
                const { level, color } = getDemandLevel(week.taskCount);
                const heightPercent = week.taskCount > 0 ? Math.max(20, (week.taskCount / maxTasks) * 100) : 10;
                
                return (
                  <div key={i} className="flex flex-col items-center">
                    <div className="h-24 w-full flex items-end justify-center mb-2">
                      <div 
                        className={cn("w-full max-w-[40px] rounded-t-md transition-all", color)}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{week.taskCount}</div>
                      <div className="text-[10px] text-muted-foreground">{week.label}</div>
                    </div>
                    {week.peakUsers.length > 0 && (
                      <div className="mt-1.5 text-center">
                        <div className="text-[9px] text-muted-foreground truncate max-w-[80px]">
                          {week.peakUsers[0]}
                        </div>
                        {week.peakUsers.length > 1 && (
                          <div className="text-[9px] text-muted-foreground">
                            +{week.peakUsers.length - 1} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-3 h-3 rounded-sm bg-green-500" />
                <span>Low</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-3 h-3 rounded-sm bg-amber-500" />
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-3 h-3 rounded-sm bg-red-500" />
                <span>High</span>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
