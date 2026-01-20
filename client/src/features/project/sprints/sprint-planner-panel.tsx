import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { computeSprintStatus } from "@/lib/constants";
import { PlanTab } from "@/features/sprints/detail/tabs/plan-tab";
import { useSprintData } from "@/features/sprints/detail/hooks/use-sprint-data";
import { AddTasksDialog, CreateTaskDialog } from "@/features/sprints/detail";

interface SprintPlannerPanelProps {
  projectId: string;
  sprints: any[];
  initialSprintId?: string;
}

export function SprintPlannerPanel({
  projectId,
  sprints,
  initialSprintId,
}: SprintPlannerPanelProps) {
  const sortedSprints = useMemo(() => {
    return [...sprints].sort((a, b) => {
      if (a.startDate && b.startDate) {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }
      return a.name.localeCompare(b.name);
    });
  }, [sprints]);

  const [selectedSprintId, setSelectedSprintId] = useState(() => {
    if (initialSprintId && sprints.some(s => s.id === initialSprintId)) {
      return initialSprintId;
    }
    const activeSprint = sprints.find(s => computeSprintStatus(s) === "active");
    if (activeSprint) return activeSprint.id;
    const plannedSprints = sortedSprints.filter(s => computeSprintStatus(s) === "planned");
    if (plannedSprints.length > 0) return plannedSprints[0].id;
    return sortedSprints[0]?.id || "";
  });

  const [showAddTasksDialog, setShowAddTasksDialog] = useState(false);
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);

  const sprintData = useSprintData(projectId, selectedSprintId);

  const currentIndex = sortedSprints.findIndex(s => s.id === selectedSprintId);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < sortedSprints.length - 1;

  const handlePrevious = () => {
    if (hasPrevious) {
      setSelectedSprintId(sortedSprints[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      setSelectedSprintId(sortedSprints[currentIndex + 1].id);
    }
  };

  const formatSprintLabel = (sprint: any) => {
    let label = sprint.name;
    if (sprint.startDate && sprint.endDate) {
      const start = format(new Date(sprint.startDate), "MMM d");
      const end = format(new Date(sprint.endDate), "MMM d");
      label += ` (${start} - ${end})`;
    }
    return label;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="text-[10px] bg-blue-500">Active</Badge>;
      case "closed":
        return <Badge variant="secondary" className="text-[10px]">Closed</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">Planned</Badge>;
    }
  };

  const createTaskAsync = useCallback(async (task: any) => {
    return new Promise<any>((resolve, reject) => {
      sprintData.createTask(task, {
        onSuccess: (data: any) => resolve(data),
        onError: (error: any) => reject(error),
      });
    });
  }, [sprintData.createTask]);

  const handleAddTasks = useCallback((taskIds: string[]) => {
    taskIds.forEach(taskId => {
      sprintData.updateTask({ id: taskId, updates: { sprintId: selectedSprintId } });
    });
    setShowAddTasksDialog(false);
  }, [sprintData.updateTask, selectedSprintId]);

  const handleCreateNewTask = useCallback(async (taskData: any) => {
    await createTaskAsync({
      ...taskData,
      sprintId: selectedSprintId,
      projectId,
    });
    setShowCreateTaskDialog(false);
  }, [createTaskAsync, selectedSprintId, projectId]);

  const handleRemoveTask = useCallback((taskId: string) => {
    sprintData.updateTask({ id: taskId, updates: { sprintId: null } });
  }, [sprintData.updateTask]);

  if (sprints.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Zap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Sprints</h3>
        <p className="text-muted-foreground mb-4">Create sprints to start planning your work</p>
        <Link href={`/projects/${projectId}/sprints`}>
          <Button>
            <Zap className="h-4 w-4 mr-2" />
            Go to Sprints
          </Button>
        </Link>
      </Card>
    );
  }

  if (!sprintData.sprint) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const selectedSprint = sprintData.sprint;

  return (
    <div className="space-y-4" data-testid="sprint-planner-panel">
      <div className="flex items-center justify-between gap-4 p-3 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
            disabled={!hasPrevious}
            className="h-8 w-8"
            data-testid="sprint-planner-prev"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
            <SelectTrigger className="w-[280px]" data-testid="sprint-planner-select">
              <SelectValue placeholder="Select sprint" />
            </SelectTrigger>
            <SelectContent>
              {sortedSprints.map((sprint) => (
                <SelectItem key={sprint.id} value={sprint.id}>
                  <div className="flex items-center gap-2">
                    <span>{formatSprintLabel(sprint)}</span>
                    {getStatusBadge(sprint.status)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={!hasNext}
            className="h-8 w-8"
            data-testid="sprint-planner-next"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <span className="text-xs text-muted-foreground">
            {currentIndex + 1} of {sortedSprints.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge(selectedSprint.status)}
          <Link href={`/projects/${projectId}/sprints/${selectedSprintId}`}>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
              <ExternalLink className="h-3.5 w-3.5" />
              Open Full View
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Tasks:</span>
          <Badge variant="outline">{sprintData.stats.total}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Done:</span>
          <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
            {sprintData.stats.done}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Progress:</span>
          <Badge variant="outline">{sprintData.stats.percent}%</Badge>
        </div>
        {sprintData.stats.totalEffort > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Effort:</span>
            <Badge variant="outline">{sprintData.stats.doneEffort}/{sprintData.stats.totalEffort}h</Badge>
          </div>
        )}
      </div>

      <PlanTab
        projectId={projectId}
        sprintId={selectedSprintId}
        sprint={sprintData.sprint}
        sprintTasks={sprintData.sprintTasks}
        projectTasks={sprintData.projectTasks}
        projectEpics={sprintData.projectEpics}
        projectMilestones={sprintData.projectMilestones}
        projectStages={sprintData.projectStages}
        sprintTaskIds={sprintData.sprintTaskIds}
        stats={sprintData.stats}
        users={sprintData.users || []}
        formattedStatusOptions={sprintData.formattedStatusOptions}
        taskTypes={sprintData.taskTypes || []}
        isReadOnly={sprintData.isReadOnly}
        getUser={sprintData.getUser}
        getEpic={sprintData.getEpic}
        updateTask={sprintData.updateTask}
        onRemoveTask={handleRemoveTask}
        onShowAddTasks={() => setShowAddTasksDialog(true)}
      />

      <AddTasksDialog
        open={showAddTasksDialog}
        onOpenChange={setShowAddTasksDialog}
        backlogTasks={sprintData.backlogTasks}
        projectTasks={sprintData.projectTasks}
        currentSprintId={selectedSprintId}
        projectStages={sprintData.projectStages}
        onAddTasks={handleAddTasks}
        onCreateNew={() => {
          setShowAddTasksDialog(false);
          setShowCreateTaskDialog(true);
        }}
      />

      <CreateTaskDialog
        open={showCreateTaskDialog}
        onOpenChange={setShowCreateTaskDialog}
        projectEpics={sprintData.projectEpics}
        projectStages={sprintData.projectStages}
        onCreateTask={handleCreateNewTask}
      />
    </div>
  );
}
