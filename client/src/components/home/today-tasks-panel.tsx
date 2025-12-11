import { HomeTask } from "@/types/home";
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
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

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
  } = useSortable({ id: task.id, data: { task } });

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

export function TodayTasksPanel({ tasks: initialTasks }: TodayTasksPanelProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<HomeTask | null>(null);

  // Update local state when props change
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const overdueTasks = tasks.filter((t) => t.isOverdue);
  const activeTasks = tasks.filter(
    (t) => !t.isOverdue && t.status !== "complete"
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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

  const handleDragStart = (event: any) => {
    const { active } = event;
    setActiveId(active.id);
    setActiveTask(active.data.current?.task || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // Find containers (buckets)
    const activeTask = tasks.find((t) => t.id === activeId);
    const overTask = tasks.find((t) => t.id === overId);
    
    // If dragging over a bucket container (droppable)
    if (!overTask) {
        // Handle dropping directly onto an empty bucket if we implemented that
        // For now, we rely on sorting within lists
        return; 
    }

    if (!activeTask || !overTask) return;

    // If moving between different buckets
    if (activeTask.durationBucket !== overTask.durationBucket) {
      setTasks((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId);
        const overIndex = prev.findIndex((t) => t.id === overId);
        
        // Clone and update bucket
        const newTasks = [...prev];
        const updatedTask = { ...newTasks[activeIndex], durationBucket: overTask.durationBucket };
        newTasks[activeIndex] = updatedTask;
        
        return arrayMove(newTasks, activeIndex, overIndex);
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId !== overId) {
      setTasks((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId);
        const overIndex = prev.findIndex((t) => t.id === overId);
        return arrayMove(prev, activeIndex, overIndex);
      });
    }
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
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
      
      {createPortal(
        <DragOverlay dropAnimation={dropAnimation}>
          {activeTask ? <TaskCard task={activeTask} /> : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}
