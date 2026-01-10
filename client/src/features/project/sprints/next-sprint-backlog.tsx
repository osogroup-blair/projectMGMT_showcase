import { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar,
  Clock,
  ListTodo,
  Settings,
  Plus
} from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { Link } from "wouter";
import { FlowBoard } from "./flow-board";
import { BlockerReasonDialog } from "./blocker-reason-dialog";

interface Task {
  id: string;
  title: string;
  status: string;
  assigneeId?: string;
  epicId?: string;
  sprintId?: string;
  deadline?: string;
  effort?: number;
  priority?: string;
}

interface Sprint {
  id: string;
  name: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

interface User {
  id: string;
  name: string;
}

interface Epic {
  id: string;
  title: string;
}

interface NextSprintBacklogProps {
  projectId: string;
  sprints: Sprint[];
  allTasks: Task[];
  users: User[];
  epics: Epic[];
  onTaskMove: (taskId: string, newStatus: string, blockerReason?: string) => void;
  onAddTask: (sprintId: string) => void;
}

export function NextSprintBacklog({ 
  projectId, 
  sprints,
  allTasks,
  users, 
  epics,
  onTaskMove,
  onAddTask
}: NextSprintBacklogProps) {
  // Find the default sprint (first planned/upcoming, or first sprint)
  const defaultSprintId = useMemo(() => {
    if (!sprints || sprints.length === 0) return null;
    // First try to find a planned/upcoming sprint
    const upcomingSprint = sprints.find((s: Sprint) => 
      s.status === "planned" || s.status === "upcoming"
    );
    if (upcomingSprint) return upcomingSprint.id;
    // Fall back to first sprint
    return sprints[0]?.id || null;
  }, [sprints]);

  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [blockerTaskId, setBlockerTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (defaultSprintId && !selectedSprintId) {
      setSelectedSprintId(defaultSprintId);
    }
  }, [defaultSprintId, selectedSprintId]);

  const selectedSprint = useMemo(() => {
    if (!sprints || !selectedSprintId) return null;
    return sprints.find((s: Sprint) => s.id === selectedSprintId) || sprints[0] || null;
  }, [sprints, selectedSprintId]);

  const sprintTasks = useMemo(() => {
    if (!selectedSprint || !allTasks) return [];
    return allTasks.filter((t: Task) => t.sprintId === selectedSprint.id);
  }, [selectedSprint, allTasks]);

  const stats = useMemo(() => {
    const total = sprintTasks.length;
    const totalEffort = sprintTasks.reduce((sum, t) => sum + (t.effort || 1), 0);
    const highPriority = sprintTasks.filter(t => 
      t.priority === "High" || t.priority === "Critical"
    ).length;
    const completed = sprintTasks.filter(t => t.status === "Done" || t.status === "Completed").length;
    
    return { total, totalEffort, highPriority, completed };
  }, [sprintTasks]);

  const handleBlockerRequested = (taskId: string) => {
    setBlockerTaskId(taskId);
  };

  if (sprints.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <ListTodo className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <h4 className="font-medium text-muted-foreground">No sprints available</h4>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Create a sprint to start planning your work
          </p>
          <Link href={`/projects/${projectId}/sprints`}>
            <Button variant="outline" size="sm" className="mt-4 gap-2">
              <Calendar className="h-4 w-4" />
              Create Sprint
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select 
            value={selectedSprintId || ""} 
            onValueChange={(val) => setSelectedSprintId(val)}
          >
            <SelectTrigger className="w-auto min-w-[180px] h-9 text-lg font-semibold border-none shadow-none hover:bg-muted/50 focus:ring-0">
              <SelectValue placeholder="Select sprint..." />
            </SelectTrigger>
            <SelectContent>
              {sprints.map((sprint: Sprint) => (
                <SelectItem key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedSprint && (
            <>
              <Badge variant={selectedSprint.status === "active" ? "default" : "secondary"} className="capitalize">
                {selectedSprint.status}
              </Badge>
              {selectedSprint.endDate && (
                <span className="text-sm text-muted-foreground">
                  {Math.max(0, differenceInDays(parseISO(selectedSprint.endDate), new Date()))} days remaining
                </span>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            className="gap-2"
            onClick={() => selectedSprintId && onAddTask(selectedSprintId)}
            data-testid="button-add-task-upcoming"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
          {selectedSprint && (
            <Link href={`/projects/${projectId}/sprints/${selectedSprint.id}?tab=run`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Sprint Details
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <ListTodo className="h-4 w-4" />
          <span>{stats.total} tasks</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{stats.totalEffort} effort pts</span>
        </div>
        {stats.highPriority > 0 && (
          <Badge variant="destructive" className="text-xs">
            {stats.highPriority} high priority
          </Badge>
        )}
        {selectedSprint?.startDate && (
          <div className="flex items-center gap-1.5 text-muted-foreground ml-auto">
            <Calendar className="h-4 w-4" />
            <span>Starts {format(parseISO(selectedSprint.startDate), "MMM d")}</span>
          </div>
        )}
      </div>

      <FlowBoard
        tasks={sprintTasks}
        users={users}
        epics={epics}
        projectId={projectId}
        onTaskMove={onTaskMove}
        onBlockerRequested={handleBlockerRequested}
      />

      <BlockerReasonDialog
        open={!!blockerTaskId}
        onOpenChange={(open) => !open && setBlockerTaskId(null)}
        onConfirm={(reason) => {
          if (blockerTaskId) {
            onTaskMove(blockerTaskId, "Blocked", reason);
            setBlockerTaskId(null);
          }
        }}
        onCancel={() => setBlockerTaskId(null)}
      />

      {sprintTasks.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <ListTodo className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No tasks in this sprint</p>
          <p className="text-xs mt-1">Add tasks to start planning</p>
        </div>
      )}
    </div>
  );
}
