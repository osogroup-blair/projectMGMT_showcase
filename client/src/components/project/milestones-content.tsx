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
  User
} from "lucide-react";
import { ListHeader, LayoutVariant, getGridClassName } from "@/components/ui/list-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
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
  const [layoutVariant, setLayoutVariant] = useState<LayoutVariant>("three-column");
  const [selectedEpicId, setSelectedEpicId] = useState<string>("");
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [newTaskEffort, setNewTaskEffort] = useState<number | null>(3);

  const milestones = useMemo(() => 
    (allMilestones || []).filter((m: any) => m.projectId === projectId),
    [allMilestones, projectId]
  );

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Milestones</h2>
          <p className="text-sm text-muted-foreground">Track key project milestones and their associated tasks.</p>
        </div>
        <Button onClick={handleCreateMilestone} className="gap-2" data-testid="button-create-milestone">
          <Plus className="h-4 w-4" />
          New Milestone
        </Button>
      </div>

      <div className="space-y-6">
        {milestones.length === 0 ? (
          <Card className="bg-muted/10 border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Flag className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No milestones defined</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
                Milestones help track key project deliverables and deadlines.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="multiple" defaultValue={milestones.map((m: any) => m.id)} className="space-y-4">
            {milestones.map((milestone: any) => {
              const status = STATUS_CONFIG[milestone.status] || STATUS_CONFIG.planned;
              const StatusIcon = status.icon;
              const owner = getOwner(milestone.ownerId);
              const progress = getMilestoneProgress(milestone.id);
              const linkedTasks = getTasksForMilestone(milestone.id);
              const isEditingThis = editingMilestoneId === milestone.id;

              return (
                <AccordionItem 
                  key={milestone.id} 
                  value={milestone.id} 
                  className="border rounded-lg bg-card px-4" 
                  data-testid={`accordion-milestone-${milestone.id}`}
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-start gap-4 text-left w-full">
                      <div className={cn("p-2 rounded-lg mt-1", status.bgColor, status.color)}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-3">
                          {isEditingThis && editingField === "name" ? (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Input
                                ref={inputRef}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEdit(milestone.id, "name");
                                  if (e.key === "Escape") cancelEditing();
                                }}
                                className="h-8 w-64 text-lg font-semibold"
                                data-testid={`input-milestone-name-${milestone.id}`}
                              />
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveEdit(milestone.id, "name")}>
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEditing}>
                                <X className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group" onClick={(e) => e.stopPropagation()}>
                              <Link 
                                href={`/projects/${projectId}/milestones/${milestone.id}`}
                              >
                                <h3 className="text-lg font-semibold hover:text-primary hover:underline decoration-primary/30 underline-offset-2 transition-colors">
                                  {milestone.name}
                                </h3>
                              </Link>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => startEditing(milestone.id, "name", milestone.name)}
                                data-testid={`button-edit-name-${milestone.id}`}
                              >
                                <Pencil className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                          )}
                          <Badge variant="outline" className={cn(
                            "font-normal",
                            milestone.status === "achieved" || milestone.status === "Completed" 
                              ? "bg-green-50 text-green-700 border-green-200" 
                              : milestone.status === "in_progress" || milestone.status === "In Progress"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : milestone.status === "slipped" || milestone.status === "Blocked"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-slate-50 text-slate-700 border-slate-200"
                          )}>
                            {status.label}
                          </Badge>
                        </div>
                        
                        {/* Description - inline editable */}
                        {isEditingThis && editingField === "description" ? (
                          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                            <Textarea
                              ref={textareaRef}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Escape") cancelEditing();
                              }}
                              placeholder="Add a description..."
                              className="min-h-[60px] text-sm"
                              data-testid={`input-milestone-description-${milestone.id}`}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => saveEdit(milestone.id, "description")}>Save</Button>
                              <Button size="sm" variant="ghost" onClick={cancelEditing}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="flex items-center gap-2 group cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(milestone.id, "description", milestone.description || "");
                            }}
                          >
                            <p className={cn(
                              "text-sm",
                              milestone.description ? "text-muted-foreground" : "text-muted-foreground/50 italic"
                            )}>
                              {milestone.description || "Click to add description..."}
                            </p>
                            <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 text-muted-foreground transition-opacity" />
                          </div>
                        )}

                        <div className="flex items-center gap-6 pt-2 text-xs text-muted-foreground">
                          {/* Owner - inline editable */}
                          {isEditingThis && editingField === "owner" ? (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <User className="h-3.5 w-3.5" />
                              <Select 
                                value={milestone.ownerId || ""} 
                                onValueChange={(value) => handleOwnerChange(milestone.id, value)}
                              >
                                <SelectTrigger className="h-6 text-xs w-32" data-testid={`select-owner-${milestone.id}`}>
                                  <SelectValue placeholder="Select owner" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(users || []).map((u: any) => (
                                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={cancelEditing}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="flex items-center gap-2 cursor-pointer group"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(milestone.id, "owner", milestone.ownerId || "");
                              }}
                            >
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[9px]">{owner?.name?.charAt(0) || "?"}</AvatarFallback>
                              </Avatar>
                              <span>Owner: {owner?.name || "Unassigned"}</span>
                              <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-50 transition-opacity" />
                            </div>
                          )}

                          {/* Target Date - inline editable */}
                          {isEditingThis && editingField === "targetDate" ? (
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <CalendarIcon className="h-3.5 w-3.5" />
                              <Input
                                ref={inputRef}
                                type="date"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveEdit(milestone.id, "targetDate");
                                  if (e.key === "Escape") cancelEditing();
                                }}
                                className="h-6 text-xs w-32"
                                data-testid={`input-milestone-date-${milestone.id}`}
                              />
                              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => saveEdit(milestone.id, "targetDate")}>
                                <Check className="h-3 w-3 text-green-600" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={cancelEditing}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="flex items-center gap-1.5 cursor-pointer group"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(milestone.id, "targetDate", milestone.targetDate || "");
                              }}
                            >
                              <CalendarIcon className="h-3.5 w-3.5" />
                              <span>Target: {milestone.targetDate || "Not set"}</span>
                              <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-50 transition-opacity" />
                            </div>
                          )}

                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{progress.done}/{progress.total} Tasks</span>
                          </div>
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <Progress value={progress.percent} className="h-1.5 w-16" />
                            <span>{progress.percent}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="pt-0 pb-4 pl-[3.25rem]">
                    <div className="space-y-3 mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Linked Tasks ({linkedTasks.length})
                        </span>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="gap-2 h-7"
                          onClick={() => openAddTaskDialog(milestone.id)}
                          data-testid={`button-add-task-${milestone.id}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Tasks
                        </Button>
                      </div>
                      {linkedTasks.length > 0 ? (
                        <div className="grid gap-3">
                          {linkedTasks.map((task: any) => {
                            const epic = getEpic(task.epicId);
                            const assignee = getAssignee(task.assigneeId);
                            const priorityClass = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
                            
                            return (
                              <Link key={task.id} href={`/projects/${projectId}/tasks/${task.id}`}>
                                <div 
                                  className="group flex items-center justify-between p-3 rounded-md border bg-background hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
                                  data-testid={`milestone-task-${task.id}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-primary/10 text-primary rounded">
                                      <ListTodo className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <h4 className="font-medium group-hover:text-primary transition-colors">{task.title}</h4>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        {epic && <span>{epic.title}</span>}
                                        {task.stageId && (
                                          <span className="px-1.5 py-0.5 rounded bg-muted">
                                            {task.stageId}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <Badge variant="outline" className={cn("font-normal text-xs", priorityClass)}>
                                      {task.priority}
                                    </Badge>
                                    <Badge 
                                      variant="secondary" 
                                      className={cn(
                                        "font-normal text-xs",
                                        task.status === "Done" ? "bg-green-100 text-green-700" :
                                        task.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                                        "bg-slate-100 text-slate-700"
                                      )}
                                    >
                                      {task.status}
                                    </Badge>
                                    {assignee && (
                                      <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-[9px]">
                                          {assignee.name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                        </AvatarFallback>
                                      </Avatar>
                                    )}
                                    <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-6 border border-dashed rounded-md text-center bg-muted/20">
                          <ListTodo className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground mb-3">
                            No tasks linked to this milestone yet.
                          </p>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="gap-2"
                            onClick={() => openAddTaskDialog(milestone.id)}
                            data-testid={`button-add-task-empty-${milestone.id}`}
                          >
                            <Plus className="h-4 w-4" />
                            Add Tasks
                          </Button>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
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
