import { useMemo, useState, useRef, useEffect } from "react";
import { 
  Flag, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Circle,
  Calendar as CalendarIcon,
  ChevronRight,
  ListTodo,
  Plus,
  Loader2,
  Pencil,
  Check,
  X,
  User,
  Search,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useMilestones, useMilestoneTaskLinks, useTasks, useUsers, useEpics, useDeliverables, useProjectStages } from "@/hooks/use-nexus-data";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabToolbar, ViewMode } from "@/components/ui/tab-toolbar";

const STATUS_CONFIG: Record<string, { icon: typeof Circle; color: string; bgColor: string; label: string }> = {
  "planned": { icon: Circle, color: "text-slate-500", bgColor: "bg-slate-100", label: "Planned" },
  "in_progress": { icon: Clock, color: "text-blue-500", bgColor: "bg-blue-100", label: "In Progress" },
  "achieved": { icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-100", label: "Achieved" },
  "slipped": { icon: AlertCircle, color: "text-red-500", bgColor: "bg-red-100", label: "Slipped" },
  "cancelled": { icon: Flag, color: "text-slate-400", bgColor: "bg-slate-100", label: "Cancelled" },
  "Pending": { icon: Circle, color: "text-slate-500", bgColor: "bg-slate-100", label: "Planned" },
  "In Progress": { icon: Clock, color: "text-blue-500", bgColor: "bg-blue-100", label: "In Progress" },
  "Completed": { icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-100", label: "Achieved" },
  "Blocked": { icon: AlertCircle, color: "text-red-500", bgColor: "bg-red-100", label: "Blocked" },
};

const PRIORITY_CONFIG: Record<string, string> = {
  "Low": "bg-slate-50 text-slate-700 border-slate-200",
  "Medium": "bg-blue-50 text-blue-700 border-blue-200",
  "High": "bg-orange-50 text-orange-700 border-orange-200",
  "Critical": "bg-red-50 text-red-700 border-red-200",
};

const EFFORT_VALUES = [1, 2, 3, 5, 8, 13, 21];

interface MilestoneTaskLink {
  id: string;
  milestoneId: string;
  taskId: string;
  projectId?: string;
  source: string;
  locked?: boolean;
  createdAt?: string;
}

export function MilestonesContent({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { data: allMilestones, isLoading: isMilestonesLoading, createAsync: createMilestoneAsync, update: updateMilestone } = useMilestones();
  const { data: allTaskLinks, isLoading: isLinksLoading, create: createLink } = useMilestoneTaskLinks();
  const { data: allTasks, isLoading: isTasksLoading, createAsync: createTaskAsync } = useTasks();
  const { data: users, isLoading: isUsersLoading } = useUsers();
  const { data: allEpics, isLoading: isEpicsLoading } = useEpics();
  const { data: allDeliverables, isLoading: isDeliverablesLoading } = useDeliverables();
  const { data: allStages, isLoading: isStagesLoading } = useProjectStages();

  // Inline editing state
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Add Task Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMilestoneId, setDialogMilestoneId] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<"search" | "create">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEpicId, setSelectedEpicId] = useState<string>("");
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [newTaskEffort, setNewTaskEffort] = useState<number | null>(3);

  // Milestone search state
  const [milestoneSearchQuery, setMilestoneSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  const milestones = useMemo(() => 
    (allMilestones || []).filter((m: any) => m.projectId === projectId),
    [allMilestones, projectId]
  );

  const filteredMilestones = useMemo(() => {
    if (!milestoneSearchQuery.trim()) return milestones;
    const q = milestoneSearchQuery.toLowerCase();
    return milestones.filter((m: any) => 
      m.name?.toLowerCase().includes(q) || 
      m.description?.toLowerCase().includes(q)
    );
  }, [milestones, milestoneSearchQuery]);

  const projectTasks = useMemo(() => 
    (allTasks || []).filter((t: any) => t.projectId === projectId || t.project === projectId),
    [allTasks, projectId]
  );

  const projectDeliverables = useMemo(() => 
    (allDeliverables || []).filter((d: any) => d.projectId === projectId),
    [allDeliverables, projectId]
  );

  const projectDeliverableIds = useMemo(() => 
    projectDeliverables.map((d: any) => d.id),
    [projectDeliverables]
  );

  const projectEpics = useMemo(() => 
    (allEpics || []).filter((e: any) => projectDeliverableIds.includes(e.deliverableId)),
    [allEpics, projectDeliverableIds]
  );

  const projectStages = useMemo(() => {
    const stageIds = Array.from(new Set(projectTasks.map((t: any) => t.stageId).filter(Boolean)));
    return stageIds.map(id => {
      const stage = (allStages || []).find((s: any) => s.id === id);
      return stage ? { id: stage.id, label: stage.name, order: stage.order } : null;
    }).filter(Boolean).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  }, [projectTasks, allStages]);

  const getTasksForMilestone = (milestoneId: string) => {
    const links = (allTaskLinks || []).filter((l: any) => l.milestoneId === milestoneId);
    return links.map((link: any) => {
      const task = (allTasks || []).find((t: any) => t.id === link.taskId);
      return task;
    }).filter(Boolean);
  };

  const getLinksForMilestone = (milestoneId: string) => {
    return (allTaskLinks || []).filter((l: any) => l.milestoneId === milestoneId);
  };

  const getMilestoneProgress = (milestoneId: string) => {
    const tasks = getTasksForMilestone(milestoneId);
    if (tasks.length === 0) return { done: 0, total: 0, percent: 0 };
    const done = tasks.filter((t: any) => t.status === "Done").length;
    return { done, total: tasks.length, percent: Math.round((done / tasks.length) * 100) };
  };

  const getOwner = (ownerId?: string) => {
    if (!ownerId) return null;
    return (users || []).find((u: any) => u.id === ownerId);
  };

  const getEpic = (epicId?: string) => {
    if (!epicId) return null;
    return (allEpics || []).find((e: any) => e.id === epicId);
  };

  const getAssignee = (assigneeId?: string) => {
    if (!assigneeId) return null;
    return (users || []).find((u: any) => u.id === assigneeId);
  };

  const isLoading = isMilestonesLoading || isLinksLoading || isTasksLoading || isUsersLoading || isEpicsLoading || isDeliverablesLoading || isStagesLoading;

  const handleCreateMilestone = async () => {
    try {
      const newMilestone = await createMilestoneAsync({
        projectId: projectId,
        name: "New Milestone",
        description: "",
        phase: "plan_strategy",
        targetDate: new Date().toISOString().split('T')[0],
        status: "planned",
        ownerId: users?.[0]?.id || "1",
        scopeType: "manual",
        completionMode: "all_tasks",
        completionTargetPercent: 100,
        tags: []
      });
      
      if (newMilestone?.id) {
        toast({ title: "Milestone Created", description: "Redirecting to edit details..." });
        navigate(`/projects/${projectId}/milestones/${newMilestone.id}`);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create milestone.", variant: "destructive" });
    }
  };

  // Inline editing handlers
  const startEditing = (milestoneId: string, field: string, currentValue: string) => {
    setEditingMilestoneId(milestoneId);
    setEditingField(field);
    setEditValue(currentValue || "");
  };

  const cancelEditing = () => {
    setEditingMilestoneId(null);
    setEditingField(null);
    setEditValue("");
  };

  const saveEdit = (milestoneId: string, field: string) => {
    const milestone = milestones.find((m: any) => m.id === milestoneId);
    if (!milestone) return;

    const updates: Record<string, any> = {};
    if (field === "name" && editValue.trim()) {
      updates.name = editValue.trim();
    } else if (field === "description") {
      updates.description = editValue;
    } else if (field === "targetDate") {
      updates.targetDate = editValue;
    }

    if (Object.keys(updates).length > 0) {
      updateMilestone({ id: milestoneId, updates });
      toast({ title: "Updated", description: `${field.charAt(0).toUpperCase() + field.slice(1)} has been updated.` });
    }
    cancelEditing();
  };

  const handleOwnerChange = (milestoneId: string, newOwnerId: string) => {
    updateMilestone({ id: milestoneId, updates: { ownerId: newOwnerId } });
    toast({ title: "Owner updated" });
    cancelEditing();
  };

  useEffect(() => {
    if (editingField === "name" || editingField === "targetDate") {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (editingField === "description") {
      textareaRef.current?.focus();
    }
  }, [editingField]);

  // Add Task Dialog handlers
  const openAddTaskDialog = (milestoneId: string) => {
    setDialogMilestoneId(milestoneId);
    setDialogMode("search");
    setSearchQuery("");
    setSelectedEpicId("");
    setSelectedStageId("");
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskPriority("Medium");
    setNewTaskEffort(3);
    setDialogOpen(true);
  };

  const currentLinkedTaskIds = useMemo(() => {
    if (!dialogMilestoneId) return [];
    const links = getLinksForMilestone(dialogMilestoneId);
    return links.map((l: any) => l.taskId);
  }, [dialogMilestoneId, allTaskLinks]);

  const searchableTasks = useMemo(() => {
    return projectTasks.filter((t: any) => !currentLinkedTaskIds.includes(t.id));
  }, [projectTasks, currentLinkedTaskIds]);

  const filteredSearchTasks = useMemo(() => {
    let result = searchableTasks;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t: any) => 
        t.title?.toLowerCase().includes(q) || 
        t.description?.toLowerCase().includes(q)
      );
    }
    
    if (selectedEpicId) {
      result = result.filter((t: any) => t.epicId === selectedEpicId);
    }
    
    if (selectedStageId) {
      result = result.filter((t: any) => t.stageId === selectedStageId);
    }
    
    return result.slice(0, 20);
  }, [searchableTasks, searchQuery, selectedEpicId, selectedStageId]);

  const handleLinkTask = (taskId: string) => {
    if (!dialogMilestoneId) return;
    
    createLink({
      milestoneId: dialogMilestoneId,
      taskId,
      projectId,
      source: "manual_add",
      locked: false
    });
    
    toast({ title: "Task linked", description: "Task has been added to the milestone." });
    setDialogOpen(false);
  };

  const handleCreateTask = async () => {
    if (!dialogMilestoneId) return;
    
    if (!newTaskTitle.trim()) {
      toast({ title: "Error", description: "Task title is required.", variant: "destructive" });
      return;
    }
    if (!selectedEpicId) {
      toast({ title: "Error", description: "Epic is required.", variant: "destructive" });
      return;
    }
    if (!selectedStageId) {
      toast({ title: "Error", description: "Stage is required.", variant: "destructive" });
      return;
    }
    if (!newTaskEffort) {
      toast({ title: "Error", description: "Effort is required.", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      const newTask = await createTaskAsync({
        title: newTaskTitle,
        description: newTaskDescription || "",
        project: projectId,
        projectId: projectId,
        epicId: selectedEpicId,
        stageId: selectedStageId,
        status: "Todo",
        priority: newTaskPriority,
        effort: newTaskEffort,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tags: []
      });

      createLink({
        milestoneId: dialogMilestoneId,
        taskId: newTask.id,
        projectId,
        source: "manual_add",
        locked: false
      });
      
      toast({ title: "Task created and linked", description: "New task has been created and added to the milestone." });
      setDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create task.", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {/* Hidden trigger for tab-level Add button */}
      <button 
        data-testid="button-create-milestones" 
        onClick={handleCreateMilestone} 
        className="hidden" 
        aria-hidden="true"
      />

      <TabToolbar
        searchQuery={milestoneSearchQuery}
        onSearchChange={setMilestoneSearchQuery}
        searchPlaceholder="Search milestones..."
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showFilter={false}
        addButtonLabel="Add Milestone"
        onAddClick={handleCreateMilestone}
      />

      <div className="space-y-4 pt-4">
        {filteredMilestones.length === 0 ? (
          <Card className="bg-muted/10 border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Flag className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium">
                {milestones.length === 0 ? "No milestones defined" : "No milestones match your search"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
                {milestones.length === 0 
                  ? "Milestones help track key project deliverables and deadlines."
                  : "Try adjusting your search terms."}
              </p>
            </CardContent>
          </Card>
        ) : viewMode === "list" ? (
          <div className="border rounded-lg bg-card overflow-x-auto">
            <Table style={{ minWidth: "800px" }}>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead style={{ width: "25%" }}>Milestone</TableHead>
                  <TableHead style={{ width: "12%" }}>Status</TableHead>
                  <TableHead style={{ width: "15%" }}>Target Date</TableHead>
                  <TableHead style={{ width: "15%" }}>Owner</TableHead>
                  <TableHead style={{ width: "10%" }}>Tasks</TableHead>
                  <TableHead style={{ width: "15%" }}>Progress</TableHead>
                  <TableHead style={{ width: "8%" }} className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMilestones.map((milestone: any) => {
                  const status = STATUS_CONFIG[milestone.status] || STATUS_CONFIG.planned;
                  const StatusIcon = status.icon;
                  const owner = getOwner(milestone.ownerId);
                  const progress = getMilestoneProgress(milestone.id);

                  return (
                    <TableRow key={milestone.id} className="hover:bg-muted/50" data-testid={`row-milestone-${milestone.id}`}>
                      <TableCell>
                        <div className="space-y-0.5">
                          <Link href={`/projects/${projectId}/milestones/${milestone.id}`}>
                            <span className="font-medium hover:text-primary cursor-pointer">{milestone.name}</span>
                          </Link>
                          {milestone.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{milestone.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "font-normal text-xs",
                          milestone.status === "achieved" || milestone.status === "Completed" 
                            ? "bg-green-50 text-green-700 border-green-200" 
                            : milestone.status === "in_progress" || milestone.status === "In Progress"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : milestone.status === "slipped" || milestone.status === "Blocked"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        )}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {milestone.targetDate ? (
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            {new Date(milestone.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        ) : (
                          <span className="italic">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {owner ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-[8px]">
                                {owner.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs truncate max-w-[80px]">{owner.name?.split(' ')[0]}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {progress.total} <span className="text-muted-foreground">({progress.done} done)</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={progress.percent} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-8">{progress.percent}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/projects/${projectId}/milestones/${milestone.id}`}>
                          <Button variant="ghost" size="sm" className="h-7">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMilestones.map((milestone: any) => {
              const status = STATUS_CONFIG[milestone.status] || STATUS_CONFIG.planned;
              const StatusIcon = status.icon;
              const owner = getOwner(milestone.ownerId);
              const progress = getMilestoneProgress(milestone.id);

              return (
                <Card 
                  key={milestone.id} 
                  className="hover:shadow-md transition-shadow group"
                  data-testid={`card-milestone-${milestone.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={cn("p-2 rounded-lg shrink-0", status.bgColor, status.color)}>
                          <StatusIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/projects/${projectId}/milestones/${milestone.id}`}>
                            <h4 className="font-semibold text-sm hover:text-primary truncate">
                              {milestone.name}
                            </h4>
                          </Link>
                          {milestone.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {milestone.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <Link href={`/projects/${projectId}/milestones/${milestone.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{progress.done}/{progress.total} tasks</span>
                      </div>
                      <Progress value={progress.percent} className="h-1.5" />

                      <div className="flex flex-wrap gap-1.5">
                        <Badge 
                          variant="secondary"
                          className={cn(
                            "text-[10px]",
                            milestone.status === "achieved" || milestone.status === "Completed" 
                              ? "bg-green-100 text-green-700" 
                              : milestone.status === "in_progress" || milestone.status === "In Progress"
                              ? "bg-blue-100 text-blue-700"
                              : milestone.status === "slipped" || milestone.status === "Blocked"
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-700"
                          )}
                        >
                          {status.label}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                        <div className="flex items-center gap-1.5">
                          {owner ? (
                            <>
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[8px]">
                                  {owner.name?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate max-w-[80px]">{owner.name?.split(' ')[0]}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">No owner</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {milestone.targetDate 
                            ? new Date(milestone.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                            : '—'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Task Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Task to Milestone</DialogTitle>
            <DialogDescription>
              Search for an existing task or create a new one.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={dialogMode} onValueChange={(v) => setDialogMode(v as "search" | "create")} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search" data-testid="tab-search-task">
                <Search className="h-4 w-4 mr-2" />
                Search Existing
              </TabsTrigger>
              <TabsTrigger value="create" data-testid="tab-create-task">
                <Plus className="h-4 w-4 mr-2" />
                Create New
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="flex-1 overflow-hidden flex flex-col mt-4">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search tasks by title..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    data-testid="input-search-task"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={selectedEpicId || "all"} onValueChange={(v) => setSelectedEpicId(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-[200px]" data-testid="select-search-epic">
                      <SelectValue placeholder="Filter by Epic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Epics</SelectItem>
                      {projectEpics.map((epic: any) => (
                        <SelectItem key={epic.id} value={epic.id}>{epic.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedStageId || "all"} onValueChange={(v) => setSelectedStageId(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-[200px]" data-testid="select-search-stage">
                      <SelectValue placeholder="Filter by Stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stages</SelectItem>
                      {projectStages.map((stage: any) => (
                        <SelectItem key={stage.id} value={stage.id}>{stage.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto mt-3 border rounded-md">
                {filteredSearchTasks.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No matching tasks found.</p>
                    <p className="text-xs mt-1">Try adjusting your search or filters.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredSearchTasks.map((task: any) => {
                      const epic = getEpic(task.epicId);
                      const stage = projectStages.find((s: any) => s.id === task.stageId);
                      return (
                        <div 
                          key={task.id} 
                          className="p-3 hover:bg-muted/50 flex items-center justify-between cursor-pointer"
                          onClick={() => handleLinkTask(task.id)}
                          data-testid={`search-result-task-${task.id}`}
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{task.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              {epic && <span>{epic.title}</span>}
                              {stage && (
                                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                  {stage.label}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="shrink-0">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="create" className="flex-1 overflow-y-auto mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-task-title">Title <span className="text-red-500">*</span></Label>
                  <Input 
                    id="new-task-title"
                    placeholder="Enter task title..."
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    data-testid="input-new-task-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-task-description">Description</Label>
                  <Textarea 
                    id="new-task-description"
                    placeholder="Enter task description..."
                    value={newTaskDescription}
                    onChange={e => setNewTaskDescription(e.target.value)}
                    rows={2}
                    data-testid="input-new-task-description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Epic <span className="text-red-500">*</span></Label>
                    <Select value={selectedEpicId} onValueChange={(v) => { setSelectedEpicId(v); setSelectedStageId(""); }}>
                      <SelectTrigger data-testid="select-new-task-epic">
                        <SelectValue placeholder="Select Epic first" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectEpics.map((epic: any) => (
                          <SelectItem key={epic.id} value={epic.id}>{epic.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Stage <span className="text-red-500">*</span></Label>
                    <Select 
                      value={selectedStageId} 
                      onValueChange={setSelectedStageId}
                      disabled={!selectedEpicId}
                    >
                      <SelectTrigger data-testid="select-new-task-stage">
                        <SelectValue placeholder={selectedEpicId ? "Select Stage" : "Select Epic first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {projectStages.map((stage: any) => (
                          <SelectItem key={stage.id} value={stage.id}>{stage.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                      <SelectTrigger data-testid="select-new-task-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Effort (Fibonacci) <span className="text-red-500">*</span></Label>
                    <Select 
                      value={newTaskEffort?.toString() || ""} 
                      onValueChange={(v) => setNewTaskEffort(v ? parseInt(v) : null)}
                    >
                      <SelectTrigger data-testid="select-new-task-effort">
                        <SelectValue placeholder="Select effort" />
                      </SelectTrigger>
                      <SelectContent>
                        {EFFORT_VALUES.map((val) => (
                          <SelectItem key={val} value={val.toString()}>{val}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleCreateTask}
                  disabled={!newTaskTitle.trim() || !selectedEpicId || !selectedStageId || !newTaskEffort || isCreating}
                  data-testid="button-create-task"
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Create & Link
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
