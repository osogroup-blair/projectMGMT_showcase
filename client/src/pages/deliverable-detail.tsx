import { useMemo, useState } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Package,
  Layers,
  User as UserIcon,
  Loader2,
  ChevronRight,
  Clock,
  Plus,
  Filter,
  X,
  ListTodo
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
import { useDeliverables, useEpics, useUsers, useTasks, useProjectStages, useDeliverableTypes, useEpicTypes, useProject } from "@/hooks/use-nexus-data";
import { useCompletedStatuses } from "@/hooks/use-completed-statuses";
import { useDeliverableStatuses, useEpicStatuses } from "@/hooks/use-task-statuses";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

export default function DeliverableDetail() {
  const [match, params] = useRoute("/projects/:projectId/deliverables/:deliverableId");
  const projectId = params?.projectId || "1";
  const deliverableId = params?.deliverableId || "d1";

  const { data: allDeliverables, isLoading: isDeliverablesLoading, update: updateDeliverable } = useDeliverables();
  const { data: allEpics, isLoading: isEpicsLoading, create: createEpic } = useEpics();
  const { data: users, isLoading: isUsersLoading } = useUsers();
  const { data: allTasks, isLoading: isTasksLoading, create: createTask } = useTasks();
  const { data: projectStages } = useProjectStages();
  const { data: deliverableTypes = [] } = useDeliverableTypes();
  const { data: epicTypes = [] } = useEpicTypes();
  const { data: project } = useProject(projectId);
  const { toast } = useToast();
  const { isTaskComplete } = useCompletedStatuses();
  const { statusLabels: deliverableStatusLabels, getStatusBgColor: getDeliverableStatusBgColor, getStatusTextColor: getDeliverableStatusTextColor, defaultStatus: defaultDeliverableStatus } = useDeliverableStatuses();
  const { statusLabels: epicStatusLabels, getStatusBgColor: getEpicStatusBgColor, getStatusTextColor: getEpicStatusTextColor, defaultStatus: defaultEpicStatus } = useEpicStatuses();

  // Edit dates state
  const [editingDates, setEditingDates] = useState({
    startDate: "",
    dueDate: ""
  });
  const [isEditingDates, setIsEditingDates] = useState(false);

  // Epic Type Filter state
  const [epicTypeFilter, setEpicTypeFilter] = useState<string | null>(null);

  // Inline task creation state
  const [creatingTaskForEpic, setCreatingTaskForEpic] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // Create Epic dialog state
  const [isCreateEpicOpen, setIsCreateEpicOpen] = useState(false);
  const [newEpicData, setNewEpicData] = useState({
    title: "",
    description: "",
    status: "Not Started",
    ownerId: "",
    typeId: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    stageIds: [] as string[],
  });

  const getEpicType = (typeId?: string | null) => epicTypes.find((t: any) => t.id === typeId);

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
      typeId: newEpicData.typeId || null,
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
      typeId: "",
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

  const deliverable = useMemo(() => {
    const d = allDeliverables?.find((d: any) => d.id === deliverableId);
    if (d && (!editingDates.startDate || !editingDates.dueDate)) {
      setEditingDates({
        startDate: d.startDate || "",
        dueDate: d.dueDate || ""
      });
    }
    return d;
  }, [allDeliverables, deliverableId]);

  const allDeliverableEpics = useMemo(() => 
    allEpics?.filter((e: any) => e.deliverableId === deliverableId) || [], 
    [allEpics, deliverableId]
  );

  const epics = useMemo(() => {
    if (!epicTypeFilter) return allDeliverableEpics;
    return allDeliverableEpics.filter((e: any) => e.typeId === epicTypeFilter);
  }, [allDeliverableEpics, epicTypeFilter]);

  const owner = useMemo(() => 
    users?.find((u: any) => u.id === deliverable?.ownerId), 
    [users, deliverable]
  );

  const deliverableType = useMemo(() => 
    deliverableTypes.find((t: any) => t.id === deliverable?.typeId), 
    [deliverableTypes, deliverable]
  );

  const handleUpdateDeliverableType = (typeId: string | null) => {
    if (deliverable) {
      updateDeliverable({ id: deliverable.id, updates: { typeId } });
      toast({
        title: "Deliverable Type Updated",
        description: typeId ? `Type set to "${deliverableTypes.find((t: any) => t.id === typeId)?.name}"` : "Type removed"
      });
    }
  };

  const handleUpdateDeliverableStatus = (status: string) => {
    if (deliverable) {
      updateDeliverable({ id: deliverable.id, updates: { status } });
      toast({
        title: "Status Updated",
        description: `Deliverable status changed to "${status}"`
      });
    }
  };

  const handleCreateTask = (epicId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!newTaskTitle.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a task title.",
        variant: "destructive"
      });
      return;
    }

    const taskId = `t${Date.now()}`;
    const defaultDeadline = deliverable?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    createTask({
      id: taskId,
      title: newTaskTitle.trim(),
      description: "",
      project: project?.name || "Project",
      projectId: projectId,
      status: "To Do",
      priority: "Medium",
      epicId: epicId,
      deadline: defaultDeadline,
      effort: 1,
    });

    toast({
      title: "Task Created",
      description: `"${newTaskTitle.trim()}" has been added to the epic.`
    });

    setNewTaskTitle("");
    setCreatingTaskForEpic(null);
  };

  const handleCancelTaskCreation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNewTaskTitle("");
    setCreatingTaskForEpic(null);
  };

  const handleStartTaskCreation = (epicId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCreatingTaskForEpic(epicId);
    setNewTaskTitle("");
  };

  const getTasksForEpic = (epicId: string) => {
    return allTasks?.filter((t: any) => t.epicId === epicId) || [];
  };

  const getEpicProgress = (epicId: string) => {
    const epicTasks = getTasksForEpic(epicId);
    if (epicTasks.length === 0) return 0;
    const doneTasks = epicTasks.filter((t: any) => isTaskComplete(t.status)).length;
    return Math.round((doneTasks / epicTasks.length) * 100);
  };

  const getEpicTaskCounts = (epicId: string) => {
    const epicTasks = getTasksForEpic(epicId);
    const doneTasks = epicTasks.filter((t: any) => isTaskComplete(t.status)).length;
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

  const handleSaveDates = () => {
    if (!editingDates.startDate || !editingDates.dueDate) {
      toast({
        title: "Validation Error",
        description: "Please provide both start and due dates.",
        variant: "destructive"
      });
      return;
    }
    
    updateDeliverable({
      id: deliverableId,
      updates: {
        startDate: editingDates.startDate,
        dueDate: editingDates.dueDate
      }
    });
    setIsEditingDates(false);
  };

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
      <div className="space-y-6">
        {/* Hierarchy Visual Indicator */}
        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded">
              <Package className="h-3.5 w-3.5" />
              <span>Deliverable</span>
            </div>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <div className="flex items-center gap-1 px-2 py-1 bg-muted text-muted-foreground rounded">
              <Layers className="h-3.5 w-3.5" />
              <span>Epics ({epics.length})</span>
            </div>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <div className="flex items-center gap-1 px-2 py-1 bg-muted text-muted-foreground rounded">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Tasks ({totalTaskCounts.total})</span>
            </div>
          </div>
          <div className="ml-auto text-xs text-muted-foreground">
            Hierarchy: Deliverable → Epic → Task
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <div className="flex items-start gap-4">
              <div className={cn(
                "p-3 rounded-lg",
                deliverableStatusLabels.length > 0 
                  ? cn(getDeliverableStatusBgColor(deliverable.status), getDeliverableStatusTextColor(deliverable.status))
                  : deliverable.status === "Completed" ? "bg-green-100 text-green-700" :
                    deliverable.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                    "bg-slate-100 text-slate-700"
              )}>
                <Package className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <Package className="h-6 w-6 text-primary/70 shrink-0" />
                  <h1 className="text-2xl font-bold tracking-tight">{deliverable.title}</h1>
                  <Select 
                    value={deliverable.status} 
                    onValueChange={handleUpdateDeliverableStatus}
                  >
                    <SelectTrigger className="h-7 text-xs border-none shadow-none px-2 w-auto" data-testid="select-deliverable-status">
                      <Badge variant="outline" className={cn(
                        "font-normal cursor-pointer",
                        deliverableStatusLabels.length > 0 
                          ? cn(getDeliverableStatusBgColor(deliverable.status), getDeliverableStatusTextColor(deliverable.status))
                          : deliverable.status === "Completed" ? "bg-green-50 text-green-700 border-green-200" :
                            deliverable.status === "In Progress" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            "bg-slate-50 text-slate-700 border-slate-200"
                      )}>
                        {deliverable.status}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {deliverableStatusLabels.length > 0 ? (
                        deliverableStatusLabels.map((status) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="Not Started">Not Started</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Blocked">Blocked</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {deliverableTypes.length > 0 && (
                    <SearchableSelect
                      value={deliverable.typeId || ""}
                      onValueChange={(v) => handleUpdateDeliverableType(v || null)}
                      placeholder="Set type..."
                      options={[
                        { value: "", label: "None" },
                        ...deliverableTypes.map((t: any) => ({ value: t.id, label: t.name }))
                      ]}
                      className="h-6 text-xs w-[120px]"
                      data-testid="select-deliverable-type-header"
                    />
                  )}
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
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Details</h3>
                {isEditingDates ? (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setIsEditingDates(false)}
                    data-testid="button-cancel-edit-dates"
                  >
                    Cancel
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setIsEditingDates(true)}
                    data-testid="button-edit-dates"
                  >
                    Edit
                  </Button>
                )}
              </div>
              
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

                {isEditingDates ? (
                  <>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1.5">Start Date</div>
                      <Input 
                        type="date" 
                        value={editingDates.startDate}
                        onChange={(e) => setEditingDates(prev => ({ ...prev, startDate: e.target.value }))}
                        data-testid="input-start-date"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1.5">Due Date</div>
                      <Input 
                        type="date" 
                        value={editingDates.dueDate}
                        onChange={(e) => setEditingDates(prev => ({ ...prev, dueDate: e.target.value }))}
                        data-testid="input-due-date"
                      />
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full mt-2" 
                      onClick={handleSaveDates}
                      data-testid="button-save-dates"
                    >
                      Save Dates
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Start Date</div>
                        <div data-testid="text-start-date">{deliverable.startDate || "Not set"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Due Date</div>
                        <div data-testid="text-due-date">{deliverable.dueDate}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold">
              Epics ({epics.length}{epicTypeFilter ? ` of ${allDeliverableEpics.length}` : ''})
            </h2>
            <div className="flex items-center gap-2">
              {epicTypes.length > 0 && (
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <SearchableSelect
                    value={epicTypeFilter || ""}
                    onValueChange={(value) => setEpicTypeFilter(value || null)}
                    placeholder="All Types"
                    data-testid="select-epic-type-filter"
                    options={[
                      { value: "", label: "All Types" },
                      ...epicTypes.map((type: any) => ({ value: type.id, label: type.name }))
                    ]}
                  />
                  {epicTypeFilter && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setEpicTypeFilter(null)}
                      data-testid="button-clear-epic-filter"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
              <Button onClick={() => setIsCreateEpicOpen(true)} className="gap-1.5" data-testid="button-add-epic">
                <Plus className="h-4 w-4" />
                Add Epic
              </Button>
            </div>
          </div>

          {epics.length > 0 ? (
            <div className="grid gap-4">
              {epics.map((epic: any) => {
                const epicProgress = getEpicProgress(epic.id);
                const epicTaskCounts = getEpicTaskCounts(epic.id);
                const epicOwner = getEpicOwner(epic.ownerId);
                const epicType = getEpicType(epic.typeId);

                return (
                  <Link key={epic.id} href={`/projects/${projectId}/epics/${epic.id}`}>
                    <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer" data-testid={`card-epic-${epic.id}`}>
                      <CardContent className="p-4">
                        {/* Hierarchy Context */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                          <span>{deliverable?.title}</span>
                          <ChevronRight className="h-3 w-3" />
                          <span className="text-foreground font-medium">Epic</span>
                          <ChevronRight className="h-3 w-3" />
                          <span>{epicTaskCounts.total} Tasks</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div 
                              className="p-2 rounded-lg"
                              style={{ 
                                backgroundColor: epicType?.color ? `${epicType.color}20` : 'hsl(var(--primary)/0.1)',
                                color: epicType?.color || 'hsl(var(--primary))'
                              }}
                            >
                              <Layers className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold">{epic.title}</h3>
                                {epicType && (
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs"
                                    style={{ borderColor: epicType.color, color: epicType.color }}
                                  >
                                    {epicType.name}
                                  </Badge>
                                )}
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

                        {/* Inline Task Creation */}
                        <div className="mt-4 pt-3 border-t">
                          {creatingTaskForEpic === epic.id ? (
                            <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                              <ListTodo className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <Input
                                placeholder="Enter task title..."
                                value={newTaskTitle}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setNewTaskTitle(e.target.value);
                                }}
                                onKeyDown={(e) => {
                                  e.stopPropagation();
                                  if (e.key === 'Enter') {
                                    handleCreateTask(epic.id, e as any);
                                  } else if (e.key === 'Escape') {
                                    handleCancelTaskCreation(e as any);
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                                className="flex-1 h-8"
                                data-testid={`input-new-task-${epic.id}`}
                              />
                              <Button 
                                size="sm" 
                                className="h-8"
                                onClick={(e) => handleCreateTask(epic.id, e)}
                                data-testid={`button-save-task-${epic.id}`}
                              >
                                Add
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8"
                                onClick={handleCancelTaskCreation}
                                data-testid={`button-cancel-task-${epic.id}`}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                              onClick={(e) => handleStartTaskCreation(epic.id, e)}
                              data-testid={`button-add-task-${epic.id}`}
                            >
                              <Plus className="h-4 w-4" />
                              Add Task
                            </Button>
                          )}
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
                <Label htmlFor="epic-type">Epic Type</Label>
                <SearchableSelect
                  value={newEpicData.typeId}
                  onValueChange={(value) => setNewEpicData(prev => ({ ...prev, typeId: value }))}
                  placeholder="Select type"
                  data-testid="select-epic-type"
                  options={epicTypes?.map((type: any) => ({ value: type.id, label: type.name })) || []}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="epic-owner">Owner</Label>
                <SearchableSelect
                  value={newEpicData.ownerId}
                  onValueChange={(value) => setNewEpicData(prev => ({ ...prev, ownerId: value }))}
                  placeholder="Select owner"
                  data-testid="select-epic-owner"
                  options={users?.map((user: any) => ({ value: user.id, label: user.name })) || []}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="epic-status">Status</Label>
                <SearchableSelect
                  value={newEpicData.status}
                  onValueChange={(value) => setNewEpicData(prev => ({ ...prev, status: value }))}
                  data-testid="select-epic-status"
                  placeholder="Select status"
                  options={epicStatusLabels.length > 0 
                    ? epicStatusLabels.map(s => ({ value: s, label: s }))
                    : [
                        { value: "Not Started", label: "Not Started" },
                        { value: "In Progress", label: "In Progress" },
                        { value: "Completed", label: "Completed" },
                      ]
                  }
                />
              </div>
              <div />
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
