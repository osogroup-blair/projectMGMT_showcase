import { HomeTask } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCard } from "./task-card";
import { Filter, CheckSquare, Clock, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useEffect } from "react";

interface TodayTasksPanelProps {
  tasks: HomeTask[];
}

// Sortable Task Component
function SortableTask({ task }: { task: HomeTask }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task, type: 'task' } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="touch-none group relative">
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
      </div>
      <div className="pl-6 transition-all">
        <TaskCard task={task} />
      </div>
    </div>
  );
}

export function TodayTasksPanel({ tasks }: TodayTasksPanelProps) {
  const overdueTasks = tasks.filter((t) => t.isOverdue);
  const activeTasks = tasks.filter(
    (t) => !t.isOverdue && t.status !== "complete"
  );

  // Group active tasks by duration bucket
  const getTasksByBucket = (bucket: string) => {
    if (bucket === "uncategorized") {
      return activeTasks.filter((t) => !t.durationBucket);
    }
    return activeTasks.filter((t) => t.durationBucket === bucket);
  };

  const buckets = [
    { id: "deep_work", label: "Deep Work (4h+)", icon: <Clock className="w-3 h-3" /> },
    { id: "medium", label: "Medium Effort (2-3h)", icon: <Clock className="w-3 h-3" /> },
    { id: "small", label: "Small Tasks (~1h)", icon: <Clock className="w-3 h-3" /> },
    { id: "quick_win", label: "Quick Wins (<30m)", icon: <Clock className="w-3 h-3" /> },
    { id: "uncategorized", label: "Uncategorized", icon: null },
  ];

  return (
    <Card className="h-full border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-4 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-primary" />
          Today's Focus
          <Badge variant="secondary" className="ml-2 rounded-full px-2">
            {tasks.length}
          </Badge>
        </CardTitle>
        <Button variant="ghost" size="sm" className="h-8 gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        {overdueTasks.length > 0 && (
          <div className="space-y-2 mb-6">
            <h3 className="text-xs font-semibold text-red-600 uppercase tracking-wider flex items-center gap-2">
              Overdue ({overdueTasks.length})
            </h3>
            <div className="space-y-3">
              {overdueTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {activeTasks.length === 0 && overdueTasks.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground text-sm">
              No tasks scheduled for today.
            </p>
            <Button variant="link" className="mt-2 text-primary">
              Browse Backlog
            </Button>
          </div>
        ) : (
          <Accordion
            type="multiple"
            defaultValue={[]}
            className="space-y-4"
          >
            {buckets.map((bucket) => {
              const bucketTasks = getTasksByBucket(bucket.id);
              if (bucketTasks.length === 0) return null;

              return (
                <AccordionItem
                  key={bucket.id}
                  value={bucket.id}
                  className="border rounded-lg bg-card/50 px-4 shadow-sm"
                >
                  <AccordionTrigger className="hover:no-underline py-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {bucket.icon}
                      {bucket.label}
                      <Badge variant="secondary" className="ml-2 text-[10px] h-5 px-1.5">
                        {bucketTasks.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-4">
                    <SortableContext
                      items={bucketTasks.map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {bucketTasks.map((task) => (
                          <SortableTask key={task.id} task={task} />
                        ))}
                      </div>
                    </SortableContext>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
