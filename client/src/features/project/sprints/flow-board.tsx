import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";
import { Circle, Clock, CheckCircle2, AlertOctagon, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  status: string;
  effort?: number;
  assigneeId?: string;
  epicId?: string;
  deadline?: string;
  blocked?: boolean;
  blockerReason?: string;
  updatedAt?: string;
}

interface User {
  id: string;
  name: string;
}

interface Epic {
  id: string;
  title: string;
}

interface FlowBoardProps {
  tasks: Task[];
  users: User[];
  epics: Epic[];
  projectId: string;
  isReadOnly?: boolean;
  signalFilter?: "blocked" | "overdue" | "stale" | null;
  onTaskMove: (taskId: string, newStatus: string, blockerReason?: string) => void;
  onBlockerRequested: (taskId: string) => void;
}

const COLUMNS = [
  { id: "todo", title: "To Do", statuses: ["To Do", "Todo", "Pending", "Backlog"], icon: Circle, color: "text-slate-500", bgColor: "bg-slate-50", borderColor: "border-slate-200" },
  { id: "inprogress", title: "In Progress", statuses: ["In Progress", "Review", "In Review"], icon: Clock, color: "text-blue-500", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
  { id: "blocked", title: "Blocked", statuses: ["Blocked"], icon: AlertOctagon, color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-300" },
  { id: "done", title: "Done", statuses: ["Done", "Completed"], icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-50", borderColor: "border-green-200" },
];

function DroppableColumn({ 
  id, 
  children 
}: { 
  id: string; 
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ 
    id: `column-${id}`,
    data: { type: 'column', columnId: id }
  });
  
  return (
    <div 
      ref={setNodeRef} 
      className={cn(
        "space-y-2 min-h-[150px] p-1 rounded transition-colors",
        isOver && "bg-primary/10 ring-2 ring-primary/30"
      )}
      data-column={id}
    >
      {children}
    </div>
  );
}

function SortableTaskCard({ 
  task, 
  user, 
  epic,
  projectId,
  columnId,
  isOverdue,
  isStale
}: { 
  task: Task; 
  user?: User; 
  epic?: Epic;
  projectId: string;
  columnId: string;
  isOverdue: boolean;
  isStale: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    data: { type: 'task', columnId }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group",
        isDragging && "opacity-50"
      )}
      {...attributes}
    >
      <Card className={cn(
        "p-3 cursor-grab active:cursor-grabbing transition-all",
        task.blocked && "border-l-4 border-l-amber-500",
        isOverdue && !task.blocked && "border-l-4 border-l-red-500",
        isStale && !task.blocked && !isOverdue && "border-l-4 border-l-orange-400"
      )}>
        <div className="flex items-start gap-2">
          <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity" {...listeners}>
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            {epic && (
              <p className="text-[10px] text-muted-foreground mb-0.5 truncate">
                {epic.title}
              </p>
            )}
            <Link 
              href={`/projects/${projectId}/tasks/${task.id}`} 
              className="font-medium text-sm hover:text-primary line-clamp-2"
              data-testid={`task-link-${task.id}`}
            >
              {task.title}
            </Link>
            {task.blocked && task.blockerReason && (
              <p className="text-xs text-amber-600 mt-1 line-clamp-1">
                {task.blockerReason}
              </p>
            )}
            <div className="flex items-center justify-between mt-2 gap-2">
              <div className="flex items-center gap-1.5">
                {task.effort && (
                  <Badge variant="outline" className="text-xs px-1.5">
                    {task.effort} pts
                  </Badge>
                )}
                {isOverdue && (
                  <Badge variant="destructive" className="text-[10px] px-1">
                    Overdue
                  </Badge>
                )}
                {isStale && !isOverdue && (
                  <Badge variant="secondary" className="text-[10px] px-1 bg-orange-100 text-orange-700">
                    Stale
                  </Badge>
                )}
              </div>
              {user && (
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px]">
                    {user.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function TaskCard({ task, user, epic, projectId, isOverdue, isStale }: { 
  task: Task; 
  user?: User; 
  epic?: Epic;
  projectId: string;
  isOverdue: boolean;
  isStale: boolean;
}) {
  return (
    <Card className={cn(
      "p-3",
      task.blocked && "border-l-4 border-l-amber-500",
      isOverdue && !task.blocked && "border-l-4 border-l-red-500",
      isStale && !task.blocked && !isOverdue && "border-l-4 border-l-orange-400"
    )}>
      <div className="flex-1 min-w-0">
        {epic && (
          <p className="text-[10px] text-muted-foreground mb-0.5 truncate">
            {epic.title}
          </p>
        )}
        <Link 
          href={`/projects/${projectId}/tasks/${task.id}`} 
          className="font-medium text-sm hover:text-primary line-clamp-2"
        >
          {task.title}
        </Link>
        {task.blocked && task.blockerReason && (
          <p className="text-xs text-amber-600 mt-1 line-clamp-1">
            {task.blockerReason}
          </p>
        )}
        <div className="flex items-center justify-between mt-2 gap-2">
          <div className="flex items-center gap-1.5">
            {task.effort && (
              <Badge variant="outline" className="text-xs px-1.5">
                {task.effort} pts
              </Badge>
            )}
          </div>
          {user && (
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[10px]">
                {user.name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </Card>
  );
}

export function FlowBoard({ 
  tasks, 
  users, 
  epics,
  projectId, 
  isReadOnly,
  signalFilter,
  onTaskMove,
  onBlockerRequested
}: FlowBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getUser = (userId?: string) => users.find(u => u.id === userId);
  const getEpic = (epicId?: string) => epicId ? epics?.find(e => e.id === epicId) : undefined;

  const isTaskOverdue = (task: Task) => {
    if (!task.deadline) return false;
    const deadline = new Date(task.deadline);
    return deadline < new Date() && task.status !== "Done" && task.status !== "Completed";
  };

  const isTaskStale = (task: Task) => {
    if (!task.updatedAt) return false;
    const updated = new Date(task.updatedAt);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return updated < threeDaysAgo && task.status === "In Progress";
  };

  const filteredTasks = useMemo(() => {
    if (!signalFilter) return tasks;
    return tasks.filter(t => {
      if (signalFilter === "blocked") return t.blocked;
      if (signalFilter === "overdue") return isTaskOverdue(t);
      if (signalFilter === "stale") return isTaskStale(t);
      return true;
    });
  }, [tasks, signalFilter]);

  const columnTasks = useMemo(() => {
    return COLUMNS.reduce((acc, col) => {
      acc[col.id] = filteredTasks.filter(t => col.statuses.includes(t.status));
      return acc;
    }, {} as Record<string, Task[]>);
  }, [filteredTasks]);

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  const findColumnByTaskId = (taskId: string): string | undefined => {
    for (const col of COLUMNS) {
      if (columnTasks[col.id]?.some(t => t.id === taskId)) {
        return col.id;
      }
    }
    return undefined;
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (isReadOnly) return;
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || isReadOnly) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;
    const overData = over.data.current as { type?: string; columnId?: string } | undefined;

    const sourceColumn = findColumnByTaskId(activeTaskId);
    
    let targetColumn: string | undefined;
    
    if (overData?.columnId) {
      targetColumn = overData.columnId;
    } else if (overId.startsWith('column-')) {
      targetColumn = overId.replace('column-', '');
    } else {
      targetColumn = findColumnByTaskId(overId);
    }

    if (!sourceColumn || !targetColumn || sourceColumn === targetColumn) return;

    const targetColConfig = COLUMNS.find(c => c.id === targetColumn);
    if (!targetColConfig) return;

    const newStatus = targetColConfig.statuses[0];

    if (newStatus === "Blocked") {
      onBlockerRequested(activeTaskId);
    } else {
      onTaskMove(activeTaskId, newStatus);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-4 gap-3 h-full">
        {COLUMNS.map((col) => {
          const Icon = col.icon;
          const colTasks = columnTasks[col.id] || [];

          return (
            <div 
              key={col.id} 
              className={cn("flex flex-col rounded-lg", col.bgColor, col.borderColor, "border")}
              data-testid={`column-${col.id}`}
            >
              <div className={cn("flex items-center gap-2 p-3 border-b", col.borderColor)}>
                <Icon className={cn("h-4 w-4", col.color)} />
                <span className={cn("font-medium text-sm", col.color)}>
                  {col.title}
                </span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {colTasks.length}
                </Badge>
              </div>
              <ScrollArea className="flex-1 p-2">
                <SortableContext
                  items={colTasks.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                  id={col.id}
                >
                  <DroppableColumn id={col.id}>
                    {colTasks.map((task) => (
                      <SortableTaskCard
                        key={task.id}
                        task={task}
                        user={getUser(task.assigneeId)}
                        epic={getEpic(task.epicId)}
                        projectId={projectId}
                        columnId={col.id}
                        isOverdue={isTaskOverdue(task)}
                        isStale={isTaskStale(task)}
                      />
                    ))}
                  </DroppableColumn>
                </SortableContext>
              </ScrollArea>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask && (
          <TaskCard
            task={activeTask}
            user={getUser(activeTask.assigneeId)}
            epic={getEpic(activeTask.epicId)}
            projectId={projectId}
            isOverdue={isTaskOverdue(activeTask)}
            isStale={isTaskStale(activeTask)}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
