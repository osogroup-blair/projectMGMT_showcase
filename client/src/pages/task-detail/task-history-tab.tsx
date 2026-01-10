import { History, Clock, User, FileText, Tag, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskHistoryTabProps {
  task: any;
  projectId: string;
}

interface HistoryEntry {
  id: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  userName: string;
  timestamp: string;
}

export function TaskHistoryTab({ task, projectId }: TaskHistoryTabProps) {
  const historyEntries: HistoryEntry[] = [
    {
      id: "h1",
      action: "created",
      userName: "System",
      timestamp: task.createdAt || new Date().toISOString()
    },
  ];

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return <FileText className="h-4 w-4" />;
      case "status_change":
        return <Tag className="h-4 w-4" />;
      case "assignment":
        return <User className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActionLabel = (entry: HistoryEntry) => {
    switch (entry.action) {
      case "created":
        return "Task created";
      case "status_change":
        return (
          <span className="flex items-center gap-2">
            Status changed from 
            <Badge variant="outline" className="text-xs">{entry.oldValue}</Badge>
            <ArrowRight className="h-3 w-3" />
            <Badge variant="outline" className="text-xs">{entry.newValue}</Badge>
          </span>
        );
      case "assignment":
        return `Assigned to ${entry.newValue}`;
      case "field_update":
        return `Updated ${entry.field}`;
      default:
        return entry.action;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <History className="h-5 w-5" />
        <h3 className="text-base font-medium text-foreground">Activity History</h3>
      </div>

      {historyEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <History className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-sm">No history available for this task.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          
          <div className="space-y-6">
            {historyEntries.map((entry) => (
              <div 
                key={entry.id} 
                className="flex gap-4 relative"
                data-testid={`history-entry-${entry.id}`}
              >
                <div className={cn(
                  "relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-background border",
                  entry.action === "created" ? "border-green-500 text-green-500" : "border-muted-foreground/30"
                )}>
                  {getActionIcon(entry.action)}
                </div>
                
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px]">
                        {entry.userName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{entry.userName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getActionLabel(entry)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
