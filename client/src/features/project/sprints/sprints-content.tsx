import { useMemo, useState } from "react";
import { 
  Zap, 
  Plus, 
  Play, 
  Square, 
  Calendar as CalendarIcon,
  Target,
  CheckCircle2,
  Circle,
  MoreVertical,
  Trash2,
  Loader2,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useSprints, useTasks } from "@/hooks/use-nexus-data";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TabToolbar, ViewMode } from "@/components/ui/tab-toolbar";

const STATUS_CONFIG: Record<string, { icon: typeof Circle; color: string; bgColor: string; label: string }> = {
  "planned": { icon: Circle, color: "text-slate-500", bgColor: "bg-slate-100", label: "Planned" },
  "active": { icon: Play, color: "text-blue-500", bgColor: "bg-blue-100", label: "Active" },
  "closed": { icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-100", label: "Closed" },
};

export function SprintsContent({ projectId }: { projectId: string }) {
  const { toast } = useToast();
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

  // Toolbar state
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  // Filter sprints by search query
  const filteredSprints = useMemo(() => {
    if (!searchQuery.trim()) return sprints;
    const query = searchQuery.toLowerCase();
    return sprints.filter((sprint: any) => 
      sprint.name?.toLowerCase().includes(query) ||
      sprint.goal?.toLowerCase().includes(query)
    );
  }, [sprints, searchQuery]);

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
    const done = tasks.filter((t: any) => t.status === "Done" || t.status === "Completed").length;
    const inProgress = tasks.filter((t: any) => t.status === "In Progress").length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, inProgress, percent };
  };

  if (isSprintsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* Hidden trigger for tab-level Add button */}
      <button 
        data-testid="button-create-sprints" 
        onClick={() => setShowCreateDialog(true)} 
        className="hidden" 
        aria-hidden="true"
      />

      <TabToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search sprints..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showFilter={false}
        addButtonLabel="Add Sprint"
        onAddClick={() => setShowCreateDialog(true)}
      />

      <div className="space-y-4 pt-4">
        {filteredSprints.length === 0 && sprints.length > 0 ? (
          <Card className="bg-muted/10 border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Zap className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No sprints match your search</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-2">
                Try adjusting your search terms.
              </p>
            </CardContent>
          </Card>
        ) : sprints.length === 0 ? (
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
        ) : viewMode === "list" ? (
          <div className="border rounded-lg bg-card overflow-x-auto">
            <Table style={{ minWidth: "800px" }}>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead style={{ width: "25%" }}>Sprint</TableHead>
                  <TableHead style={{ width: "12%" }}>Status</TableHead>
                  <TableHead style={{ width: "20%" }}>Dates</TableHead>
                  <TableHead style={{ width: "10%" }}>Tasks</TableHead>
                  <TableHead style={{ width: "18%" }}>Progress</TableHead>
                  <TableHead style={{ width: "15%" }} className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSprints.map((sprint: any) => {
                  const stats = getSprintStats(sprint.id);
                  const statusConfig = STATUS_CONFIG[sprint.status] || STATUS_CONFIG["planned"];
                  const StatusIcon = statusConfig.icon;

                  return (
                    <TableRow key={sprint.id} className="hover:bg-muted/50" data-testid={`row-sprint-${sprint.id}`}>
                      <TableCell>
                        <div className="space-y-0.5">
                          <Link href={`/projects/${projectId}/sprints/${sprint.id}`}>
                            <span className="font-medium hover:text-primary cursor-pointer">{sprint.name}</span>
                          </Link>
                          {sprint.goal && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{sprint.goal}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(statusConfig.bgColor, statusConfig.color, "border-0 text-xs")}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sprint.startDate ? (
                          <span>
                            {new Date(sprint.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            {sprint.endDate && ` → ${new Date(sprint.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
                          </span>
                        ) : (
                          <span className="italic">Not set</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {stats.total} <span className="text-muted-foreground">({stats.done} done)</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={stats.percent} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-8">{stats.percent}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/projects/${projectId}/sprints/${sprint.id}`}>
                            <Button variant="ghost" size="sm" className="h-7">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {sprint.status === "planned" && (
                                <DropdownMenuItem onClick={() => handleStartSprint(sprint.id)}>
                                  <Play className="h-4 w-4 mr-2" />
                                  Start Sprint
                                </DropdownMenuItem>
                              )}
                              {sprint.status === "active" && (
                                <DropdownMenuItem onClick={() => handleCloseSprint(sprint.id)}>
                                  <Square className="h-4 w-4 mr-2" />
                                  Close Sprint
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => setShowDeleteDialog(sprint.id)} className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Sprint
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredSprints.map((sprint: any) => {
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
                        <div className="flex items-center gap-3">
                          <Link href={`/projects/${projectId}/sprints/${sprint.id}`}>
                            <CardTitle className="text-lg hover:text-primary cursor-pointer" data-testid={`link-sprint-${sprint.id}`}>
                              {sprint.name}
                            </CardTitle>
                          </Link>
                          <Link href={`/projects/${projectId}/sprints/${sprint.id}`}>
                            <Button variant="outline" size="sm" className="gap-1.5 h-7" data-testid={`open-sprint-${sprint.id}`}>
                              <ExternalLink className="h-3 w-3" />
                              Overview
                            </Button>
                          </Link>
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
                    {sprint.goal && (
                      <CardDescription className="mt-1">{sprint.goal}</CardDescription>
                    )}
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
            })}
          </div>
        )}
      </div>

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
    </>
  );
}
