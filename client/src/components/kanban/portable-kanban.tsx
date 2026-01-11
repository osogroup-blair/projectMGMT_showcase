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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { GripVertical, ChevronLeft, ChevronRight, Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKanbanColumns, type KanbanColumn, getTargetStatusForColumn } from "@/hooks/use-kanban-columns";

interface Task {
  id: string;
  title: string;
  status: string;
  effort?: number;
  assigneeId?: string;
  epicId?: string;
  milestoneId?: string;
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

interface Milestone {
  id: string;
  title: string;
}

interface PortableKanbanProps {
  tasks: Task[];
  users?: User[];
  epics?: Epic[];
  milestones?: Milestone[];
  projectId: string;
  isReadOnly?: boolean;
  signalFilter?: "blocked" | "overdue" | "stale" | null;
  showFilters?: boolean;
  onTaskMove?: (taskId: string, newStatus: string, blockerReason?: string) => void;
  onBlockerRequested?: (taskId: string) => void;
  className?: string;
}

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${id}`,
    data: { type: "column", columnId: id },
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
  columnIndex,
  columnsCount,
  isOverdue,
  isStale,
  onMoveLeft,
  onMoveRight,
  isReadOnly,
}: {
  task: Task;
  user?: User;
  epic?: Epic;
  projectId: string;
  columnId: string;
  columnIndex: number;
  columnsCount: number;
  isOverdue: boolean;
  isStale: boolean;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  isReadOnly?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", columnId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const canMoveLeft = columnIndex > 0;
  const canMoveRight = columnIndex < columnsCount - 1;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("group", isDragging && "opacity-50")}
      {...attributes}
    >
      <Card
        className={cn(
          "p-3 cursor-grab active:cursor-grabbing transition-all",
          task.blocked && "border-l-4 border-l-amber-500",
          isOverdue && !task.blocked && "border-l-4 border-l-red-500",
          isStale && !task.blocked && !isOverdue && "border-l-4 border-l-orange-400"
        )}
      >
        <div className="flex items-start gap-2">
          <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity" {...listeners}>
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            {epic && (
              <p className="text-[10px] text-muted-foreground mb-0.5 truncate">{epic.title}</p>
            )}
            <Link
              href={`/projects/${projectId}/tasks/${task.id}`}
              className="font-medium text-sm hover:text-primary line-clamp-2"
              data-testid={`task-link-${task.id}`}
            >
              {task.title}
            </Link>
            {task.blocked && task.blockerReason && (
              <p className="text-xs text-amber-600 mt-1 line-clamp-1">{task.blockerReason}</p>
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
              <div className="flex items-center gap-1">
                {!isReadOnly && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canMoveLeft && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onMoveLeft?.();
                        }}
                        data-testid={`task-move-left-${task.id}`}
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                    )}
                    {canMoveRight && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onMoveRight?.();
                        }}
                        data-testid={`task-move-right-${task.id}`}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
                {user && (
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px]">{user.name?.charAt(0) || "?"}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function TaskCard({
  task,
  user,
  epic,
  projectId,
  isOverdue,
  isStale,
}: {
  task: Task;
  user?: User;
  epic?: Epic;
  projectId: string;
  isOverdue: boolean;
  isStale: boolean;
}) {
  return (
    <Card
      className={cn(
        "p-3",
        task.blocked && "border-l-4 border-l-amber-500",
        isOverdue && !task.blocked && "border-l-4 border-l-red-500",
        isStale && !task.blocked && !isOverdue && "border-l-4 border-l-orange-400"
      )}
    >
      <div className="flex-1 min-w-0">
        {epic && <p className="text-[10px] text-muted-foreground mb-0.5 truncate">{epic.title}</p>}
        <Link
          href={`/projects/${projectId}/tasks/${task.id}`}
          className="font-medium text-sm hover:text-primary line-clamp-2"
        >
          {task.title}
        </Link>
        {task.blocked && task.blockerReason && (
          <p className="text-xs text-amber-600 mt-1 line-clamp-1">{task.blockerReason}</p>
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
              <AvatarFallback className="text-[10px]">{user.name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </Card>
  );
}

export function PortableKanban({
  tasks,
  users = [],
  epics = [],
  milestones = [],
  projectId,
  isReadOnly,
  signalFilter,
  showFilters = true,
  onTaskMove,
  onBlockerRequested,
  className,
}: PortableKanbanProps) {
  const { columns, isLoading: columnsLoading } = useKanbanColumns();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [epicFilter, setEpicFilter] = useState<string>("all");
  const [milestoneFilter, setMilestoneFilter] = useState<string>("all");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getUser = (userId?: string) => users.find((u) => u.id === userId);
  const getEpic = (epicId?: string) => (epicId ? epics?.find((e) => e.id === epicId) : undefined);

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

  const hasActiveFilters = searchQuery || assigneeFilter !== "all" || epicFilter !== "all" || milestoneFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setAssigneeFilter("all");
    setEpicFilter("all");
    setMilestoneFilter("all");
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (signalFilter) {
      result = result.filter((t) => {
        if (signalFilter === "blocked") return t.blocked;
        if (signalFilter === "overdue") return isTaskOverdue(t);
        if (signalFilter === "stale") return isTaskStale(t);
        return true;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(query) || t.id.toLowerCase().includes(query));
    }

    if (assigneeFilter !== "all") {
      result = result.filter((t) => t.assigneeId === assigneeFilter);
    }

    if (epicFilter !== "all") {
      result = result.filter((t) => t.epicId === epicFilter);
    }

    if (milestoneFilter !== "all") {
      result = result.filter((t) => t.milestoneId === milestoneFilter);
    }

    return result;
  }, [tasks, signalFilter, searchQuery, assigneeFilter, epicFilter, milestoneFilter]);

  const columnTasks = useMemo(() => {
    return columns.reduce((acc, col) => {
      acc[col.id] = filteredTasks.filter((t) =>
        col.statuses.some((s) => s.toLowerCase() === t.status.toLowerCase())
      );
      return acc;
    }, {} as Record<string, Task[]>);
  }, [filteredTasks, columns]);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  const findColumnByTaskId = (taskId: string): string | undefined => {
    for (const col of columns) {
      if (columnTasks[col.id]?.some((t) => t.id === taskId)) {
        return col.id;
      }
    }
    return undefined;
  };

  const getColumnIndex = (columnId: string): number => {
    return columns.findIndex((c) => c.id === columnId);
  };

  const handleMoveTask = (taskId: string, direction: "left" | "right") => {
    const currentColumnId = findColumnByTaskId(taskId);
    if (!currentColumnId) return;

    const currentIndex = getColumnIndex(currentColumnId);
    const targetIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= columns.length) return;

    const targetColumn = columns[targetIndex];
    const newStatus = getTargetStatusForColumn(targetColumn);

    if (newStatus.toLowerCase() === "blocked") {
      onBlockerRequested?.(taskId);
    } else {
      onTaskMove?.(taskId, newStatus);
    }
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
    } else if (overId.startsWith("column-")) {
      targetColumn = overId.replace("column-", "");
    } else {
      targetColumn = findColumnByTaskId(overId);
    }

    if (!sourceColumn || !targetColumn || sourceColumn === targetColumn) return;

    const targetColConfig = columns.find((c) => c.id === targetColumn);
    if (!targetColConfig) return;

    const newStatus = getTargetStatusForColumn(targetColConfig);

    if (newStatus.toLowerCase() === "blocked") {
      onBlockerRequested?.(activeTaskId);
    } else {
      onTaskMove?.(activeTaskId, newStatus);
    }
  };

  if (columnsLoading) {
    return (
      <div className={cn("flex flex-col h-full gap-3", className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const gridCols = columns.length <= 4 ? `grid-cols-${columns.length}` : "grid-cols-4";

  return (
    <div className={cn("flex flex-col h-full gap-3", className)}>
      {showFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
              data-testid="input-search-kanban"
            />
          </div>
          {users.length > 0 && (
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-[140px] h-9" data-testid="select-assignee-filter">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {epics.length > 0 && (
            <Select value={epicFilter} onValueChange={setEpicFilter}>
              <SelectTrigger className="w-[140px] h-9" data-testid="select-epic-filter">
                <SelectValue placeholder="Epic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Epics</SelectItem>
                {epics.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {milestones.length > 0 && (
            <Select value={milestoneFilter} onValueChange={setMilestoneFilter}>
              <SelectTrigger className="w-[140px] h-9" data-testid="select-milestone-filter">
                <SelectValue placeholder="Milestone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Milestones</SelectItem>
                {milestones.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 gap-1" data-testid="button-clear-filters">
              <X className="h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className="grid gap-3 flex-1 min-h-0"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
        >
          {columns.map((col, colIndex) => {
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
                  <span className={cn("font-medium text-sm", col.color)}>{col.title}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {colTasks.length}
                  </Badge>
                </div>
                <ScrollArea className="flex-1 p-2">
                  <SortableContext items={colTasks.map((t) => t.id)} strategy={verticalListSortingStrategy} id={col.id}>
                    <DroppableColumn id={col.id}>
                      {colTasks.map((task) => (
                        <SortableTaskCard
                          key={task.id}
                          task={task}
                          user={getUser(task.assigneeId)}
                          epic={getEpic(task.epicId)}
                          projectId={projectId}
                          columnId={col.id}
                          columnIndex={colIndex}
                          columnsCount={columns.length}
                          isOverdue={isTaskOverdue(task)}
                          isStale={isTaskStale(task)}
                          onMoveLeft={() => handleMoveTask(task.id, "left")}
                          onMoveRight={() => handleMoveTask(task.id, "right")}
                          isReadOnly={isReadOnly}
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
    </div>
  );
}
