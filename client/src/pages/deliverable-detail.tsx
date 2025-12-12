import { useMemo, useState } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Package,
  Layers,
  User as UserIcon,
  Loader2,
  ChevronRight,
  Clock,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRoute, Link } from "wouter";
import { cn } from "@/lib/utils";
import { useDeliverables, useEpics, useUsers, useTasks, useProjectStages } from "@/hooks/use-nexus-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

export default function DeliverableDetail() {
  const [match, params] = useRoute("/projects/:projectId/deliverables/:deliverableId");
  const projectId = params?.projectId || "1";
  const deliverableId = params?.deliverableId || "d1";

  const { data: allDeliverables, isLoading: isDeliverablesLoading } = useDeliverables();
  const { data: allEpics, isLoading: isEpicsLoading, create: createEpic } = useEpics();
  const { data: users, isLoading: isUsersLoading } = useUsers();
  const { data: allTasks, isLoading: isTasksLoading } = useTasks();
  const { data: projectStages } = useProjectStages();
  const { toast } = useToast();

  // Create Epic dialog state
  const [isCreateEpicOpen, setIsCreateEpicOpen] = useState(false);
  const [newEpicData, setNewEpicData] = useState({
    title: "",
    description: "",
    status: "Not Started",
    ownerId: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    stageIds: [] as string[],
  });

  const handleCreateEpic = () => {
    if (!newEpicData.title) {
      toast({
        title: "Validation Error",
        description: "Please provide an epic title.",
        variant: "destructive"
      });
      return;
    }

    const epicId = `e${Date.now()}`;
    createEpic({
      id: epicId,
      deliverableId: deliverableId,
      title: newEpicData.title,
      description: newEpicData.description || "",
      status: newEpicData.status,
      ownerId: newEpicData.ownerId || "1",
      startDate: newEpicData.startDate,
      endDate: newEpicData.endDate,
      progress: 0,
      stageIds: newEpicData.stageIds,
    });

    toast({
      title: "Epic Created",
      description: `"${newEpicData.title}" has been added.`
    });

    setNewEpicData({
      title: "",
      description: "",
      status: "Not Started",
      ownerId: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      stageIds: [],
    });
    setIsCreateEpicOpen(false);
  };

  const toggleStageSelection = (stageId: string) => {
    setNewEpicData(prev => ({
      ...prev,
      stageIds: prev.stageIds.includes(stageId)
        ? prev.stageIds.filter(id => id !== stageId)
        : [...prev.stageIds, stageId]
    }));
  };

  const deliverable = useMemo(() => 
    allDeliverables?.find((d: any) => d.id === deliverableId), 
    [allDeliverables, deliverableId]
  );

  const epics = useMemo(() => 
    allEpics?.filter((e: any) => e.deliverableId === deliverableId) || [], 
    [allEpics, deliverableId]
  );

  const owner = useMemo(() => 
    users?.find((u: any) => u.id === deliverable?.ownerId), 
    [users, deliverable]
  );

  const getTasksForEpic = (epicId: string) => {
    return allTasks?.filter((t: any) => t.epicId === epicId) || [];
  };

  const getEpicProgress = (epicId: string) => {
    const epicTasks = getTasksForEpic(epicId);
    if (epicTasks.length === 0) return 0;
    const doneTasks = epicTasks.filter((t: any) => t.status === "Done").length;
    return Math.round((doneTasks / epicTasks.length) * 100);
  };

  const getEpicTaskCounts = (epicId: string) => {
    const epicTasks = getTasksForEpic(epicId);
    const doneTasks = epicTasks.filter((t: any) => t.status === "Done").length;
    return { done: doneTasks, total: epicTasks.length };
  };

  const getEpicOwner = (ownerId: string) => 
    users?.find((u: any) => u.id === ownerId);

  const totalTaskCounts = useMemo(() => {
    let done = 0;
    let total = 0;
    epics.forEach((epic: any) => {
      const counts = getEpicTaskCounts(epic.id);
      done += counts.done;
      total += counts.total;
    });
    return { done, total };
  }, [epics, allTasks]);

  const overallProgress = useMemo(() => {
    if (totalTaskCounts.total === 0) return 0;
    return Math.round((totalTaskCounts.done / totalTaskCounts.total) * 100);
  }, [totalTaskCounts]);

  const totalEffort = useMemo(() => {
    let effort = 0;
    epics.forEach((epic: any) => {
      const epicTasks = getTasksForEpic(epic.id);
      epicTasks.forEach((t: any) => {
        effort += t.effort || 0;
      });
    });
    return effort;
  }, [epics, allTasks]);

  const isLoading = isDeliverablesLoading || isEpicsLoading || isUsersLoading || isTasksLoading;

  if (isLoading) {
    return (
      <Shell>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  if (!deliverable) {
    return (
      <Shell>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Deliverable not found</h2>
            <p className="text-muted-foreground">The deliverable you're looking for doesn't exist.</p>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href={`/projects/${projectId}?tab=deliverables`} className="hover:text-primary transition-colors flex items-center gap-1" data-testid="link-back-deliverables">
            <ArrowLeft className="h-4 w-4" />
            Deliverables
          </Link>
          <span className="text-border">/</span>
          <span className="text-foreground font-medium">{deliverable.title}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <div className="flex items-start gap-4">
              <div className={cn(
                "p-3 rounded-lg",
                deliverable.status === "Completed" ? "bg-green-100 text-green-700" :
                deliverable.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                "bg-slate-100 text-slate-700"
              )}>
                <Package className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold tracking-tight">{deliverable.title}</h1>
                  <Badge variant="outline" className={cn(
                    "font-normal",
                    deliverable.status === "Completed" ? "bg-green-50 text-green-700 border-green-200" :
                    deliverable.status === "In Progress" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    "bg-slate-50 text-slate-700 border-slate-200"
                  )}>
                    {deliverable.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{deliverable.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-muted/20 border-none shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold" data-testid="text-epic-count">{epics.length}</div>
                      <div className="text-xs text-muted-foreground">Epics</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/20 border-none shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-700">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold" data-testid="text-task-counts">{totalTaskCounts.done}/{totalTaskCounts.total}</div>
                      <div className="text-xs text-muted-foreground">Tasks Complete</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/20 border-none shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold" data-testid="text-total-effort">{totalEffort}</div>
                      <div className="text-xs text-muted-foreground">Total Effort</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/20 border-none shadow-none">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Progress</span>
                      <span className="text-sm font-bold" data-testid="text-progress">{overallProgress}%</span>
                    </div>
                    <Progress value={overallProgress} className="h-2" data-testid="progress-bar" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="w-full lg:w-72 shrink-0">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-sm">Details</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Owner</div>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[9px]">
                          {owner?.name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span data-testid="text-owner">{owner?.name || "Unassigned"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Due Date</div>
                    <div data-testid="text-due-date">{deliverable.dueDate}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Epics ({epics.length})</h2>
            <Button onClick={() => setIsCreateEpicOpen(true)} className="gap-1.5" data-testid="button-add-epic">
              <Plus className="h-4 w-4" />
              Add Epic
            </Button>
          </div>

          {epics.length > 0 ? (
            <div className="grid gap-4">
              {epics.map((epic: any) => {
                const epicProgress = getEpicProgress(epic.id);
                const epicTaskCounts = getEpicTaskCounts(epic.id);
                const epicOwner = getEpicOwner(epic.ownerId);

                return (
                  <Link key={epic.id} href={`/projects/${projectId}/epics/${epic.id}`}>
                    <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer" data-testid={`card-epic-${epic.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary/10 text-primary rounded-lg">
                              <Layers className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{epic.title}</h3>
                                <Badge variant="secondary" className="text-xs">
                                  {epic.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-1">{epic.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                  <Avatar className="h-4 w-4">
                                    <AvatarFallback className="text-[8px]">
                                      {epicOwner?.name?.charAt(0) || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{epicOwner?.name || "Unassigned"}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="h-3 w-3" />
                                  <span>{epic.startDate} - {epic.endDate}</span>
                                </div>
                                {epic.stageIds && (
                                  <span className="px-1.5 py-0.5 rounded bg-muted">
                                    {epic.stageIds.length} Stages
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="flex items-center gap-1.5 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{epicTaskCounts.done}/{epicTaskCounts.total}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">Tasks</div>
                            </div>
                            <div className="w-24">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">{epicProgress}%</span>
                              </div>
                              <Progress value={epicProgress} className="h-1.5" />
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Card className="bg-muted/10 border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Layers className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium">No epics yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-2">
                  This deliverable doesn't have any epics. Create an epic to start tracking work.
                </p>
                <Button onClick={() => setIsCreateEpicOpen(true)} className="mt-4 gap-1.5" data-testid="button-add-epic-empty">
                  <Plus className="h-4 w-4" />
                  Add Epic
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={isCreateEpicOpen} onOpenChange={setIsCreateEpicOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Epic</DialogTitle>
            <DialogDescription>
              Add a new epic to "{deliverable?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="epic-title">Title *</Label>
              <Input
                id="epic-title"
                placeholder="Epic title..."
                value={newEpicData.title}
                onChange={(e) => setNewEpicData(prev => ({ ...prev, title: e.target.value }))}
                data-testid="input-epic-title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="epic-description">Description</Label>
              <Textarea
                id="epic-description"
                placeholder="Describe the epic..."
                value={newEpicData.description}
                onChange={(e) => setNewEpicData(prev => ({ ...prev, description: e.target.value }))}
                data-testid="input-epic-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="epic-owner">Owner</Label>
                <Select
                  value={newEpicData.ownerId}
                  onValueChange={(value) => setNewEpicData(prev => ({ ...prev, ownerId: value }))}
                >
                  <SelectTrigger data-testid="select-epic-owner">
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="epic-status">Status</Label>
                <Select
                  value={newEpicData.status}
                  onValueChange={(value) => setNewEpicData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger data-testid="select-epic-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="epic-start">Start Date</Label>
                <Input
                  id="epic-start"
                  type="date"
                  value={newEpicData.startDate}
                  onChange={(e) => setNewEpicData(prev => ({ ...prev, startDate: e.target.value }))}
                  data-testid="input-epic-start-date"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="epic-end">End Date</Label>
                <Input
                  id="epic-end"
                  type="date"
                  value={newEpicData.endDate}
                  onChange={(e) => setNewEpicData(prev => ({ ...prev, endDate: e.target.value }))}
                  data-testid="input-epic-end-date"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Stages</Label>
              <ScrollArea className="h-32 rounded-md border p-3">
                <div className="space-y-2">
                  {projectStages?.map((stage: any) => (
                    <div key={stage.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`stage-${stage.id}`}
                        checked={newEpicData.stageIds.includes(stage.id)}
                        onCheckedChange={() => toggleStageSelection(stage.id)}
                      />
                      <label htmlFor={`stage-${stage.id}`} className="text-sm cursor-pointer">
                        {stage.name}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateEpicOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateEpic} data-testid="button-create-epic-submit">Create Epic</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
