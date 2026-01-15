import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Clock } from "lucide-react";

interface Task {
  id: string;
  title: string;
  status?: string;
  assigneeId?: string;
  effort?: number;
}

interface RowItem {
  id: string;
  title?: string;
  name?: string;
  description?: string;
}

interface ColumnItem {
  id: string;
  name?: string;
  label?: string;
}

interface User {
  id: string;
  name?: string;
}

interface CoverageMatrixProps {
  rows: RowItem[];
  columns: ColumnItem[];
  tasks: Task[];
  users?: User[];
  rowLabel?: string;
  getTasksForCell: (rowId: string, columnId: string) => Task[];
  getIncludedCount: (rowId: string, columnId: string) => number;
  isTaskIncluded?: (taskId: string) => boolean;
  onCellClick?: (rowId: string, columnId: string) => void;
  showRowDescription?: boolean;
  displayStyle?: "text" | "circle";
  emptyRowsMessage?: string;
  emptyColumnsMessage?: string;
  className?: string;
}

const STATUS_ICONS: Record<string, typeof Circle> = {
  "Done": CheckCircle2,
  "Completed": CheckCircle2,
  "In Progress": Clock,
  "Review": Clock,
};

function getStatusColor(status?: string): string {
  if (!status) return "text-slate-500";
  if (status === "Done" || status === "Completed") return "text-green-600";
  if (status === "In Progress" || status === "Review") return "text-blue-600";
  return "text-slate-500";
}

function TaskHoverList({ 
  tasks, 
  users, 
  isTaskIncluded 
}: { 
  tasks: Task[]; 
  users?: User[]; 
  isTaskIncluded?: (taskId: string) => boolean;
}) {
  if (tasks.length === 0) return null;

  const getUser = (id?: string) => users?.find(u => u.id === id);

  return (
    <ScrollArea className="max-h-[300px]">
      <div className="space-y-2 p-1">
        {tasks.map(task => {
          const user = getUser(task.assigneeId);
          const included = isTaskIncluded?.(task.id) ?? false;
          const StatusIcon = STATUS_ICONS[task.status || ""] || Circle;

          return (
            <div 
              key={task.id} 
              className={cn(
                "flex items-start gap-2 p-2 rounded-md border text-sm",
                included ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"
              )}
            >
              <StatusIcon className={cn("h-4 w-4 mt-0.5 shrink-0", getStatusColor(task.status))} />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{task.title}</div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  {task.status && (
                    <Badge variant="outline" className="text-[10px] h-5">
                      {task.status}
                    </Badge>
                  )}
                  {task.effort && (
                    <span>{task.effort} pts</span>
                  )}
                  {user && (
                    <div className="flex items-center gap-1">
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="text-[8px]">
                          {user.name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate max-w-[80px]">{user.name?.split(' ')[0]}</span>
                    </div>
                  )}
                </div>
              </div>
              {included && (
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

export function CoverageMatrix({
  rows,
  columns,
  tasks,
  users,
  rowLabel = "Item",
  getTasksForCell,
  getIncludedCount,
  isTaskIncluded,
  onCellClick,
  showRowDescription = false,
  displayStyle = "text",
  emptyRowsMessage = "No items found.",
  emptyColumnsMessage = "No stages found.",
  className,
}: CoverageMatrixProps) {
  
  if (rows.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground border rounded-md">
        {emptyRowsMessage}
      </div>
    );
  }

  if (columns.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground border rounded-md">
        {emptyColumnsMessage}
      </div>
    );
  }

  return (
    <div className={cn("border rounded-md overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/10">
              <th className="p-3 text-left font-medium min-w-[200px]">
                {rowLabel}
              </th>
              {columns.map(col => (
                <th key={col.id} className="p-3 text-center font-medium border-l min-w-[100px]">
                  {col.label || col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id} className="border-b last:border-0 hover:bg-muted/5">
                <td className="p-3 font-medium">
                  {row.title || row.name}
                  {showRowDescription && row.description && (
                    <div className="text-xs text-muted-foreground font-normal line-clamp-1">
                      {row.description}
                    </div>
                  )}
                </td>
                {columns.map(col => {
                  const cellTasks = getTasksForCell(row.id, col.id);
                  const hasTasks = cellTasks.length > 0;
                  const includedCount = getIncludedCount(row.id, col.id);
                  const isFullyIncluded = hasTasks && includedCount === cellTasks.length;
                  const isPartiallyIncluded = hasTasks && includedCount > 0 && includedCount < cellTasks.length;

                  const cellContent = (
                    <td 
                      key={col.id} 
                      className={cn(
                        "p-3 text-center border-l transition-colors relative",
                        hasTasks ? "cursor-pointer hover:bg-muted/20 active:bg-muted/30" : "opacity-50 cursor-default",
                        !hasTasks && "bg-muted/10",
                        displayStyle === "text" && isFullyIncluded && "bg-green-50",
                        displayStyle === "text" && isPartiallyIncluded && "bg-amber-50"
                      )}
                      onClick={() => hasTasks && onCellClick?.(row.id, col.id)}
                    >
                      {hasTasks ? (
                        displayStyle === "circle" ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                              isFullyIncluded ? "bg-green-100 text-green-700" :
                              isPartiallyIncluded ? "bg-amber-100 text-amber-700" :
                              "bg-slate-100 text-slate-500"
                            )}>
                              {includedCount}/{cellTasks.length}
                            </div>
                          </div>
                        ) : (
                          <span className={cn(
                            "text-sm font-medium",
                            isFullyIncluded && "text-green-700",
                            isPartiallyIncluded && "text-amber-700"
                          )}>
                            {includedCount}/{cellTasks.length}
                          </span>
                        )
                      ) : (
                        <span className="text-muted-foreground/30">-</span>
                      )}
                    </td>
                  );

                  if (!hasTasks) {
                    return cellContent;
                  }

                  return (
                    <HoverCard key={col.id} openDelay={200} closeDelay={100}>
                      <HoverCardTrigger asChild>
                        {cellContent}
                      </HoverCardTrigger>
                      <HoverCardContent 
                        side="top" 
                        align="center" 
                        className="w-[320px] p-3"
                        sideOffset={5}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">
                              {row.title || row.name} × {col.label || col.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {includedCount}/{cellTasks.length} included
                            </Badge>
                          </div>
                          <TaskHoverList 
                            tasks={cellTasks} 
                            users={users} 
                            isTaskIncluded={isTaskIncluded}
                          />
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
