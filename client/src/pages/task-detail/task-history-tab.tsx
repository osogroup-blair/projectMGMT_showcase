import { History, Clock, User, FileText, Tag, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTaskHistory, useUsers } from "@/hooks/use-nexus-data";
import { useMemo } from "react";

interface TaskHistoryTabProps {
  task: any;
  projectId: string;
}

interface HistoryEntry {
  id: string;
  taskId: string;
  field: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changedAt: string;
}

const FIELD_LABELS: Record<string, string> = {
  status: "Status",
  priority: "Priority",
  assigneeId: "Assignee",
  title: "Title",
  description: "Description",
  deadline: "Deadline",
  dueDate: "Due Date",
  targetDate: "Target Date",
  effort: "Effort",
  epicId: "Epic",
  stageId: "Stage",
  milestoneId: "Milestone",
  sprintId: "Sprint",
};

export function TaskHistoryTab({ task, projectId }: TaskHistoryTabProps) {
  const { data: historyData, isLoading, refetch } = useTaskHistory(task.id);
  const { data: users } = useUsers();

  const getUserName = (userId: string) => {
    if (!userId || userId === 'system') return 'System';
    const user = users?.find((u: any) => u.id === userId);
    return user?.name || user?.email || userId;
  };

  const getUserInitials = (userId: string) => {
    const name = getUserName(userId);
    if (name === 'System') return 'SY';
    return name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const historyEntries = useMemo(() => {
    const entries: Array<HistoryEntry & { action: string }> = [];
    
    if (task.createdAt) {
      entries.push({
        id: 'created',
        taskId: task.id,
        field: 'created',
        oldValue: '',
        newValue: '',
        changedBy: task.createdBy || 'system',
        changedAt: task.createdAt,
        action: 'created',
      });
    }

    if (historyData && Array.isArray(historyData)) {
      historyData.forEach((entry: HistoryEntry) => {
        entries.push({
          ...entry,
          action: 'field_update',
        });
      });
    }

    entries.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
    
    return entries;
  }, [task, historyData]);

  const getActionIcon = (action: string, field?: string) => {
    if (action === "created") {
      return <FileText className="h-4 w-4" />;
    }
    if (field === "status") {
      return <Tag className="h-4 w-4" />;
    }
    if (field === "assigneeId") {
      return <User className="h-4 w-4" />;
    }
    return <Clock className="h-4 w-4" />;
  };

  const getActionLabel = (entry: HistoryEntry & { action: string }) => {
    if (entry.action === "created") {
      return "Task created";
    }

    const fieldLabel = FIELD_LABELS[entry.field] || entry.field;

    if (entry.field === "status" || entry.field === "priority") {
      return (
        <span className="flex items-center gap-2 flex-wrap">
          {fieldLabel} changed from 
          <Badge variant="outline" className="text-xs">{entry.oldValue || "(empty)"}</Badge>
          <ArrowRight className="h-3 w-3 shrink-0" />
          <Badge variant="outline" className="text-xs">{entry.newValue || "(empty)"}</Badge>
        </span>
      );
    }

    if (entry.field === "assigneeId") {
      const oldName = entry.oldValue ? getUserName(entry.oldValue) : "(unassigned)";
      const newName = entry.newValue ? getUserName(entry.newValue) : "(unassigned)";
      return (
        <span className="flex items-center gap-2 flex-wrap">
          Assignee changed from 
          <Badge variant="outline" className="text-xs">{oldName}</Badge>
          <ArrowRight className="h-3 w-3 shrink-0" />
          <Badge variant="outline" className="text-xs">{newName}</Badge>
        </span>
      );
    }

    if (entry.field === "effort") {
      return (
        <span className="flex items-center gap-2 flex-wrap">
          Effort changed from 
          <Badge variant="outline" className="text-xs">{entry.oldValue || "0"} pts</Badge>
          <ArrowRight className="h-3 w-3 shrink-0" />
          <Badge variant="outline" className="text-xs">{entry.newValue || "0"} pts</Badge>
        </span>
      );
    }

    if (entry.field === "title" || entry.field === "description") {
      return `${fieldLabel} updated`;
    }

    if (entry.oldValue && entry.newValue) {
      return (
        <span className="flex items-center gap-2 flex-wrap">
          {fieldLabel} changed from 
          <span className="text-muted-foreground">"{entry.oldValue.substring(0, 30)}{entry.oldValue.length > 30 ? '...' : ''}"</span>
          <ArrowRight className="h-3 w-3 shrink-0" />
          <span className="text-foreground">"{entry.newValue.substring(0, 30)}{entry.newValue.length > 30 ? '...' : ''}"</span>
        </span>
      );
    }

    if (!entry.oldValue && entry.newValue) {
      return `${fieldLabel} set to "${entry.newValue.substring(0, 50)}${entry.newValue.length > 50 ? '...' : ''}"`;
    }

    if (entry.oldValue && !entry.newValue) {
      return `${fieldLabel} cleared`;
    }

    return `${fieldLabel} updated`;
  };

  const getIconColor = (action: string) => {
    switch (action) {
      case "created":
        return "border-green-500 text-green-500";
      default:
        return "border-blue-400 text-blue-500";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <History className="h-5 w-5" />
          <h3 className="text-base font-medium text-foreground">Activity History</h3>
          <Badge variant="secondary" className="ml-2">{historyEntries.length}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
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
            {historyEntries.map((entry, index) => (
              <div 
                key={entry.id || `history-${index}`} 
                className="flex gap-4 relative"
                data-testid={`history-entry-${entry.id || index}`}
              >
                <div className={cn(
                  "relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-background border",
                  getIconColor(entry.action)
                )}>
                  {getActionIcon(entry.action, entry.field)}
                </div>
                
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[10px]">
                        {getUserInitials(entry.changedBy)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{getUserName(entry.changedBy)}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.changedAt).toLocaleString()}
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
