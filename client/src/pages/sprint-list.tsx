import { useMemo, useState } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  Zap, 
  Plus, 
  Play, 
  Square, 
  Calendar as CalendarIcon,
  Target,
  Users,
  Clock,
  CheckCircle2,
  Circle,
  ChevronRight,
  MoreVertical,
  Trash2,
  Pencil,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link, useRoute } from "wouter";
import { cn } from "@/lib/utils";
import { useSprints, useTasks, useProject } from "@/hooks/use-nexus-data";
import { useToast } from "@/hooks/use-toast";
import { useCompletedStatuses } from "@/hooks/use-completed-statuses";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ContextPanel } from "@/components/ui/context-panel";

const STATUS_CONFIG: Record<string, { icon: typeof Circle; color: string; bgColor: string; label: string }> = {
  "planned": { icon: Circle, color: "text-slate-500", bgColor: "bg-slate-100", label: "Planned" },
  "active": { icon: Play, color: "text-blue-500", bgColor: "bg-blue-100", label: "Active" },
  "closed": { icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-100", label: "Closed" },
};

export default function SprintList() {
  const [, params] = useRoute("/projects/:projectId/sprints");
  const projectId = params?.projectId || "";
  const { toast } = useToast();
  const { isTaskComplete } = useCompletedStatuses();

  const { data: project } = useProject(projectId);
  const { data: allSprints, isLoading: isSprintsLoading, create: createSprint, update: updateSprint, remove: removeSprint } = useSprints();
  const { data: allTasks } = useTasks();

  const sprints = useMemo(() => 
    (allSprints || []).filter((s: any) => s.projectId === projectId),
    [allSprints, projectId]
  );

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newSprint, setNewSprint] = useState({
    name: "",
    goal: "",
    startDate: "",
    endDate: "",
  });

  const handleCreateSprint = async () => {
    if (!newSprint.name.trim()) {
      toast({ title: "Sprint name is required", variant: "destructive" });
      return;
    }
    setIsCreating(true);
    try {
      createSprint({
        projectId,
        name: newSprint.name,
        goal: newSprint.goal || null,
        startDate: newSprint.startDate || null,
        endDate: newSprint.endDate || null,
        status: "planned",
        capacityHours: null,
      });
      setShowCreateDialog(false);
      setNewSprint({ name: "", goal: "", startDate: "", endDate: "" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartSprint = async (sprintId: string) => {
    const hasActive = sprints.some((s: any) => s.status === "active");
    if (hasActive) {
      toast({ title: "Another sprint is already active", description: "Close the active sprint first.", variant: "destructive" });
      return;
    }
    try {
      const response = await fetch(`/api/sprints/${sprintId}/start`, { method: "POST" });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error);
      }
      updateSprint({ id: sprintId, updates: { status: "active" } });
      toast({ title: "Sprint started" });
    } catch (error: any) {
      toast({ title: "Failed to start sprint", description: error.message, variant: "destructive" });
    }
  };

  const handleCloseSprint = async (sprintId: string) => {
    try {
      const response = await fetch(`/api/sprints/${sprintId}/close`, { method: "POST" });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error);
      }
      updateSprint({ id: sprintId, updates: { status: "closed" } });
      toast({ title: "Sprint closed" });
    } catch (error: any) {
      toast({ title: "Failed to close sprint", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteSprint = (sprintId: string) => {
    removeSprint(sprintId);
    setShowDeleteDialog(null);
  };

  const getSprintStats = (sprintId: string) => {
    const tasks = (allTasks || []).filter((t: any) => t.sprintId === sprintId);
    const total = tasks.length;
    const done = tasks.filter((t: any) => isTaskComplete(t.status)).length;
    const inProgress = tasks.filter((t: any) => t.status === "In Progress").length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, inProgress, percent };
  };

  if (isSprintsLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <ContextPanel contextType="sprint" className="space-y-6 rounded-none">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-sprint-list-title">
              Sprints
            </h1>
            <p className="text-muted-foreground">
              Manage time-boxed iterations for {project?.name || "this project"}
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-sprint">
            <Plus className="h-4 w-4 mr-2" />
            New Sprint
          </Button>
        </div>

        <div className="grid gap-4">
          {sprints.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No sprints yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first sprint to organize work into time-boxed iterations.
                </p>
                <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-first-sprint">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Sprint
                </Button>
              </CardContent>
            </Card>
          ) : (
            sprints.map((sprint: any) => {
              const stats = getSprintStats(sprint.id);
              const statusConfig = STATUS_CONFIG[sprint.status] || STATUS_CONFIG["planned"];
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={sprint.id} className="hover:shadow-md transition-shadow" data-testid={`card-sprint-${sprint.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-md", statusConfig.bgColor)}>
                          <Zap className={cn("h-5 w-5", statusConfig.color)} />
                        </div>
                        <div>
                          <Link href={`/projects/${projectId}/sprints/${sprint.id}`}>
                            <CardTitle className="text-lg hover:text-primary cursor-pointer" data-testid={`link-sprint-${sprint.id}`}>
                              {sprint.name}
                            </CardTitle>
                          </Link>
                          {sprint.goal && (
                            <CardDescription className="mt-1">{sprint.goal}</CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn(statusConfig.bgColor, statusConfig.color, "border-0")}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-sprint-menu-${sprint.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {sprint.status === "planned" && (
                              <DropdownMenuItem onClick={() => handleStartSprint(sprint.id)} data-testid={`button-start-sprint-${sprint.id}`}>
                                <Play className="h-4 w-4 mr-2" />
                                Start Sprint
                              </DropdownMenuItem>
                            )}
                            {sprint.status === "active" && (
                              <DropdownMenuItem onClick={() => handleCloseSprint(sprint.id)} data-testid={`button-close-sprint-${sprint.id}`}>
                                <Square className="h-4 w-4 mr-2" />
                                Close Sprint
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setShowDeleteDialog(sprint.id)} className="text-red-600" data-testid={`button-delete-sprint-${sprint.id}`}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Sprint
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                      {sprint.startDate && (
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{new Date(sprint.startDate).toLocaleDateString()}</span>
                          {sprint.endDate && (
                            <>
                              <span>→</span>
                              <span>{new Date(sprint.endDate).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Target className="h-4 w-4" />
                        <span>{stats.total} tasks</span>
                      </div>
                      {stats.done > 0 && (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span>{stats.done} done</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{stats.percent}%</span>
                      </div>
                      <Progress value={stats.percent} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ContextPanel>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Sprint</DialogTitle>
            <DialogDescription>
              Plan a new time-boxed iteration for your project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sprint-name">Sprint Name</Label>
              <Input
                id="sprint-name"
                placeholder="e.g., Sprint 1"
                value={newSprint.name}
                onChange={(e) => setNewSprint({ ...newSprint, name: e.target.value })}
                data-testid="input-sprint-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sprint-goal">Sprint Goal (optional)</Label>
              <Textarea
                id="sprint-goal"
                placeholder="What do you want to achieve in this sprint?"
                value={newSprint.goal}
                onChange={(e) => setNewSprint({ ...newSprint, goal: e.target.value })}
                data-testid="input-sprint-goal"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sprint-start">Start Date</Label>
                <Input
                  id="sprint-start"
                  type="date"
                  value={newSprint.startDate}
                  onChange={(e) => setNewSprint({ ...newSprint, startDate: e.target.value })}
                  data-testid="input-sprint-start"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sprint-end">End Date</Label>
                <Input
                  id="sprint-end"
                  type="date"
                  value={newSprint.endDate}
                  onChange={(e) => setNewSprint({ ...newSprint, endDate: e.target.value })}
                  data-testid="input-sprint-end"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} data-testid="button-cancel-create-sprint">
              Cancel
            </Button>
            <Button onClick={handleCreateSprint} disabled={isCreating} data-testid="button-confirm-create-sprint">
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Sprint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sprint</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this sprint? Tasks assigned to this sprint will be unassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-sprint">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => showDeleteDialog && handleDeleteSprint(showDeleteDialog)} className="bg-red-600" data-testid="button-confirm-delete-sprint">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
}
