import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, ChevronDown, ChevronRight, Plus } from "lucide-react";
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

interface PulsePanelProps {
  tasks: Task[];
  users: User[];
  pulseUpdates: PulseUpdate[];
  currentUserId: string;
  sprintId: string;
  onPostPulse: (data: { didText: string; nextText: string; blockersText: string; referencedTaskIds: string[] }) => void;
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
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="py-3 px-4 flex-row items-center justify-between border-b shrink-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Team Pulse
        </CardTitle>
        {!hasPostedToday && !composerOpen && (
          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
            Post your update
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-3 flex-1 flex flex-col min-h-0 overflow-auto">
        {composerOpen ? (
          <div className="mb-3">
            <PulseComposer
              open={composerOpen}
              onOpenChange={setComposerOpen}
              tasks={tasks.filter(t => t.assigneeId === currentUserId)}
              sprintId={sprintId}
              onSubmit={(data) => {
                onPostPulse(data);
                setComposerOpen(false);
              }}
            />
          </div>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mb-3 justify-start gap-2"
            onClick={() => setComposerOpen(true)}
            data-testid="button-add-update"
          >
            <Plus className="h-4 w-4" />
            Add update...
          </Button>
        )}

        <ScrollArea className="flex-1 h-full">
          <div className="space-y-3 pb-4">
            {groupedUpdates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pulse updates yet. Be the first to share!
              </p>
            ) : (
              groupedUpdates.map(({ date, label, updates }, groupIndex) => (
                <Collapsible key={date} defaultOpen={groupIndex === 0}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-1 group hover:bg-slate-50 rounded px-1 -mx-1">
                    <ChevronRight className="h-3 w-3 text-muted-foreground group-data-[state=open]:hidden" />
                    <ChevronDown className="h-3 w-3 text-muted-foreground hidden group-data-[state=open]:block" />
                    <span className="text-xs font-medium text-muted-foreground">{label}</span>
                    <Badge variant="secondary" className="text-[10px] ml-auto">
                      {updates.length}
                    </Badge>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 pl-4 pt-2">
                    {updates.map((update) => {
                      const user = getUser(update.userId);
                      const hasMultipleFields = [update.didText, update.nextText, update.blockersText].filter(Boolean).length > 1;
                      
                      return (
                        <div key={update.id} className="border rounded p-2 space-y-1.5 bg-white">
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-4 w-4">
                              <AvatarFallback className="text-[8px]">
                                {user?.name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-[11px] font-medium text-muted-foreground">{user?.name || "Unknown"}</span>
                          </div>
                          {update.didText && (
                            <p className="text-xs leading-snug">
                              <span className="text-green-600 font-medium">✓ </span>
                              <span className="text-slate-600 line-clamp-2">{update.didText}</span>
                            </p>
                          )}
                          {update.nextText && (
                            <p className="text-xs leading-snug">
                              <span className="text-blue-600 font-medium">→ </span>
                              <span className="text-slate-600 line-clamp-2">{update.nextText}</span>
                            </p>
                          )}
                          {update.blockersText && (
                            <p className="text-xs leading-snug">
                              <span className="text-amber-600 font-medium">⚠ </span>
                              <span className="text-slate-600 line-clamp-2">{update.blockersText}</span>
                            </p>
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
  );
}
