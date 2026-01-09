import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertOctagon, Clock, AlertTriangle, MessageSquare, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { PulseComposer } from "./pulse-composer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Task {
  id: string;
  title: string;
  status: string;
  deadline?: string;
  blocked?: boolean;
  blockerReason?: string;
  updatedAt?: string;
  assigneeId?: string;
}

interface User {
  id: string;
  name: string;
}

interface PulseUpdate {
  id: string;
  userId: string;
  date: string;
  didText?: string | null;
  nextText?: string | null;
  blockersText?: string | null;
  createdAt?: string;
}

interface SprintSignals {
  blocked: number;
  overdue: number;
  stale: number;
}

interface PulsePanelProps {
  tasks: Task[];
  users: User[];
  pulseUpdates: PulseUpdate[];
  currentUserId: string;
  sprintId: string;
  onPostPulse: (data: { didText: string; nextText: string; blockersText: string; referencedTaskIds: string[] }) => void;
}

function SignalCard({ 
  icon: Icon, 
  label, 
  count, 
  color,
  bgColor,
}: { 
  icon: typeof AlertOctagon; 
  label: string; 
  count: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 p-2 rounded-lg", bgColor)}>
      <Icon className={cn("h-4 w-4", color)} />
      <span className="text-xs font-medium">{label}</span>
      <Badge variant="secondary" className={cn("ml-auto text-xs", count > 0 && color)}>
        {count}
      </Badge>
    </div>
  );
}

function formatPulseDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
}

export function PulsePanel({
  tasks,
  users,
  pulseUpdates,
  currentUserId,
  sprintId,
  onPostPulse,
}: PulsePanelProps) {
  const [composerOpen, setComposerOpen] = useState(false);

  const getUser = (userId: string) => users.find(u => u.id === userId);

  const signals: SprintSignals = useMemo(() => {
    const now = new Date();
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    return {
      blocked: tasks.filter(t => t.blocked).length,
      overdue: tasks.filter(t => {
        if (!t.deadline) return false;
        const deadline = new Date(t.deadline);
        return deadline < now && t.status !== "Done" && t.status !== "Completed";
      }).length,
      stale: tasks.filter(t => {
        if (!t.updatedAt) return false;
        const updated = new Date(t.updatedAt);
        return updated < threeDaysAgo && t.status === "In Progress";
      }).length,
    };
  }, [tasks]);

  const groupedUpdates = useMemo(() => {
    const groups: Record<string, PulseUpdate[]> = {};
    
    const sorted = [...pulseUpdates].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    sorted.forEach(update => {
      const dateKey = update.date;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(update);
    });

    return Object.entries(groups).map(([date, updates]) => ({
      date,
      label: formatPulseDate(date),
      updates,
    }));
  }, [pulseUpdates]);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const hasPostedToday = pulseUpdates.some(
    p => p.userId === currentUserId && p.date === todayStr
  );

  return (
    <div className="flex flex-col h-full">
      <Card className="mb-3">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Sprint Signals
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-2">
          <SignalCard
            icon={AlertOctagon}
            label="Blocked"
            count={signals.blocked}
            color="text-amber-600"
            bgColor="bg-amber-50"
          />
          <SignalCard
            icon={Clock}
            label="Overdue"
            count={signals.overdue}
            color="text-red-600"
            bgColor="bg-red-50"
          />
          <SignalCard
            icon={AlertTriangle}
            label="Stale (3+ days)"
            count={signals.stale}
            color="text-orange-600"
            bgColor="bg-orange-50"
          />
        </CardContent>
      </Card>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="py-3 px-4 flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Team Pulse
          </CardTitle>
          {!hasPostedToday && (
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
              Post your update
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-3 pt-0 flex-1 flex flex-col min-h-0">
          <PulseComposer
            open={composerOpen}
            onOpenChange={setComposerOpen}
            tasks={tasks.filter(t => t.assigneeId === currentUserId)}
            sprintId={sprintId}
            onSubmit={onPostPulse}
          />

          <Separator className="my-3" />

          <ScrollArea className="flex-1">
            <div className="space-y-4">
              {groupedUpdates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No pulse updates yet. Be the first to share!
                </p>
              ) : (
                groupedUpdates.map(({ date, label, updates }) => (
                  <Collapsible key={date} defaultOpen={isToday(parseISO(date))}>
                    <CollapsibleTrigger className="flex items-center gap-2 w-full text-left mb-2 group">
                      <ChevronRight className="h-3 w-3 text-muted-foreground group-data-[state=open]:hidden" />
                      <ChevronDown className="h-3 w-3 text-muted-foreground hidden group-data-[state=open]:block" />
                      <span className="text-xs font-medium text-muted-foreground">{label}</span>
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {updates.length}
                      </Badge>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 pl-5">
                      {updates.map((update) => {
                        const user = getUser(update.userId);
                        return (
                          <div key={update.id} className="border rounded-lg p-3 space-y-2 bg-slate-50/50">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[10px]">
                                  {user?.name?.charAt(0) || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium">{user?.name || "Unknown"}</span>
                            </div>
                            {update.didText && (
                              <div className="text-xs">
                                <span className="text-green-600 font-medium">Did: </span>
                                <span className="text-muted-foreground">{update.didText}</span>
                              </div>
                            )}
                            {update.nextText && (
                              <div className="text-xs">
                                <span className="text-blue-600 font-medium">Next: </span>
                                <span className="text-muted-foreground">{update.nextText}</span>
                              </div>
                            )}
                            {update.blockersText && (
                              <div className="text-xs">
                                <span className="text-amber-600 font-medium">Blockers: </span>
                                <span className="text-muted-foreground">{update.blockersText}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
