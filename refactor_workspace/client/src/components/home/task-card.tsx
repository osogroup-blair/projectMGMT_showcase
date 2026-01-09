import { HomeTask } from "@/types/home";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface TaskCardProps {
  task: HomeTask;
  compact?: boolean;
}

export function TaskCard({ task, compact = false }: TaskCardProps) {
  const isOverdue = task.isOverdue;
  const isComplete = task.status === "complete";

  const priorityColor = {
    low: "bg-slate-100 text-slate-700",
    medium: "bg-blue-50 text-blue-700",
    high: "bg-orange-50 text-orange-700",
    critical: "bg-red-50 text-red-700",
  };

  const durationLabel = {
    quick_win: "Quick Win (<30m)",
    small: "Small (~1h)",
    medium: "Medium (~2-3h)",
    deep_work: "Deep Work (4h+)",
  };

  return (
    <Card className={cn("hover:shadow-md transition-shadow group border-l-4", 
      isOverdue ? "border-l-red-500" : 
      isComplete ? "border-l-green-500" : 
      "border-l-primary/50"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <span className="font-medium text-foreground">{task.projectName}</span>
              {task.epicName && (
                <>
                  <span>•</span>
                  <span>{task.epicName}</span>
                </>
              )}
            </div>
            
            <div className="flex items-start gap-2">
              <Link href={task.links?.taskUrl || "#"} className="font-semibold text-sm hover:underline hover:text-primary transition-colors line-clamp-2">
                {task.title}
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              {task.priority && (
                <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0 h-5 font-normal", priorityColor[task.priority])}>
                  {task.priority}
                </Badge>
              )}
              
              {task.durationBucket && !compact && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal text-muted-foreground">
                  <Clock className="w-3 h-3 mr-1" />
                  {durationLabel[task.durationBucket].split(' ')[0]}
                </Badge>
              )}

              {isOverdue && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                  Overdue
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
             {/* Actions or Status Icon */}
             {isComplete ? (
               <CheckCircle2 className="w-5 h-5 text-green-500" />
             ) : (
               <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 group-hover:border-primary transition-colors cursor-pointer" />
             )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
