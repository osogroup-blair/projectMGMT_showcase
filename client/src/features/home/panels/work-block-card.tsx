import { WorkBlock } from "../types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MoreHorizontal, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface WorkBlockProps {
  block: WorkBlock;
}

export function WorkBlockCard({ block }: WorkBlockProps) {
  const isActive = block.status === "in_progress";
  
  // Parse time for display (simple HH:MM)
  const formatTime = (timeStr: string) => {
    // Assuming HH:MM:SS
    return timeStr.substring(0, 5);
  };

  return (
    <Card className={cn(
      "border-l-4 transition-all relative overflow-hidden",
      isActive ? "border-l-primary bg-primary/5 shadow-md ring-1 ring-primary/20" : "border-l-muted hover:border-l-primary/50"
    )}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* Time Column */}
          <div className="flex flex-col items-center justify-center w-14 shrink-0 text-xs font-medium text-muted-foreground border-r pr-3">
            <span>{formatTime(block.startTime)}</span>
            <div className="h-4 w-px bg-border my-0.5" />
            <span>{formatTime(block.endTime)}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className={cn("text-sm font-semibold truncate", isActive ? "text-primary" : "text-foreground")}>
                {block.label || "Focus Block"}
              </h4>
              {isActive && (
                <Badge variant="default" className="text-[10px] px-1.5 h-5 animate-pulse">
                  Active
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{block.totalPlannedMinutes}m planned</span>
              <span>•</span>
              <span>{block.taskIds.length} tasks</span>
            </div>
          </div>

          {/* Action */}
          <div className="shrink-0">
             {isActive ? (
                <Button size="icon" variant="ghost" className="h-8 w-8 text-primary">
                   <div className="w-3 h-3 bg-primary rounded-sm" />
                </Button>
             ) : (
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary">
                   <PlayCircle className="w-5 h-5" />
                </Button>
             )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
