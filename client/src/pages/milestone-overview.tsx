import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { Shell } from "@/components/layout/shell";
import { ListHeader, LayoutVariant, getGridClassName } from "@/components/ui/list-header";
import { 
  Flag, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Circle,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronDown,
  ListTodo,
  Target,
  User,
  Loader2,
  Plus,
  Search,
  Filter,
  SlidersHorizontal,
  Layers,
  Trash2,
  Lock,
  Unlock,
  ArrowRight,
  CheckSquare,
  Pencil,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Link, useRoute } from "wouter";
import { cn } from "@/lib/utils";
import { useMilestones, useMilestoneTaskLinks, useTasks, useUsers, useEpics, useDeliverables, useProject, useMilestoneScopeRules, useProjectStages } from "@/hooks/use-nexus-data";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

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

interface MilestoneTaskLink {
  id: string;
  milestoneId: string;
  taskId: string;
  projectId?: string;
  source: string;
  locked?: boolean;
  createdAt?: string;
}

interface MilestoneScopeRules {
  milestoneId: string;
  rules: any[];
}

export default function MilestoneOverview() {
  const [, params] = useRoute("/projects/:projectId/milestones/:milestoneId");
  const projectId = params?.projectId || "";
  const milestoneId = params?.milestoneId || "";
  const { toast } = useToast();

  const { data: project } = useProject(projectId);
  const { data: allMilestones, isLoading: isMilestonesLoading, update: updateMilestone } = useMilestones();
  const { data: allTaskLinks, isLoading: isLinksLoading, create: createLink, remove: removeLink, update: updateLink } = useMilestoneTaskLinks();
  const { data: allTasks, isLoading: isTasksLoading } = useTasks();
  const { data: users, isLoading: isUsersLoading } = useUsers();
  const { data: allEpics, isLoading: isEpicsLoading } = useEpics();
  const { data: allDeliverables, isLoading: isDeliverablesLoading } = useDeliverables();
  const { data: allScopeRules, create: createScopeRule, update: updateScopeRule } = useMilestoneScopeRules();
  const { data: allStages, isLoading: isStagesLoading } = useProjectStages();

  const milestone = useMemo(() => 
    (allMilestones || []).find((m: any) => m.id === milestoneId),
    [allMilestones, milestoneId]
  );

  const links = useMemo(() => 
    (allTaskLinks || []).filter((l: any) => l.milestoneId === milestoneId),
    [allTaskLinks, milestoneId]
  );

  const linkedTasks = useMemo(() => {
    return links.map((link: any) => {
      const task = (allTasks || []).find((t: any) => t.id === link.taskId);
      return task ? { ...task, link } : null;
    }).filter(Boolean);
  }, [links, allTasks]);

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

  // Get unique stage IDs from project tasks and map to stage objects
  const projectStages = useMemo(() => {
    const stageIds = Array.from(new Set(projectTasks.map((t: any) => t.stageId).filter(Boolean)));
    return stageIds.map(id => {
      const stage = (allStages || []).find((s: any) => s.id === id);
      return stage ? { id: stage.id, label: stage.name, order: stage.order } : null;
    }).filter(Boolean).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  }, [projectTasks, allStages]);

  const scopeRules = useMemo(() => 
    (allScopeRules || []).filter((r: any) => r.milestoneId === milestoneId),
    [allScopeRules, milestoneId]
  );

  const selectedRules: MilestoneScopeRules = useMemo(() => 
    scopeRules[0] || { milestoneId, rules: [] },
    [scopeRules, milestoneId]
  );

  const progress = useMemo(() => {
    if (linkedTasks.length === 0) return { done: 0, total: 0, percent: 0 };
    const done = linkedTasks.filter((t: any) => t.status === "Done").length;
    return { done, total: linkedTasks.length, percent: Math.round((done / linkedTasks.length) * 100) };
  }, [linkedTasks]);

  // Date conflict detection - tasks with target date after milestone target date
  const dateConflicts = useMemo(() => {
    if (!milestone?.targetDate) return [];
    const milestoneDate = new Date(milestone.targetDate);
    return linkedTasks.filter((task: any) => {
      if (!task.targetDate && !task.dueDate) return false;
      const taskDate = new Date(task.targetDate || task.dueDate);
      return taskDate > milestoneDate;
    });
  }, [linkedTasks, milestone?.targetDate]);

  const hasDateConflicts = dateConflicts.length > 0;

  // Check if a specific task has a date conflict
  const hasTaskDateConflict = useCallback((task: any) => {
    if (!milestone?.targetDate) return false;
    if (!task.targetDate && !task.dueDate) return false;
    const milestoneDate = new Date(milestone.targetDate);
    const taskDate = new Date(task.targetDate || task.dueDate);
    return taskDate > milestoneDate;
  }, [milestone?.targetDate]);

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

  const handleUpdateLinks = (updatedLinks: MilestoneTaskLink[]) => {
    const currentIds = links.map((l: any) => l.id);
    const newIds = updatedLinks.map(l => l.id);
    
    // Find removed links
    const removed = links.filter((l: any) => !newIds.includes(l.id));
    removed.forEach((l: any) => removeLink(l.id));
    
    // Find added links - only send required fields, not auto-generated ones like createdAt
    const added = updatedLinks.filter(l => !currentIds.includes(l.id));
    added.forEach(l => createLink({
      milestoneId: l.milestoneId,
      taskId: l.taskId,
      projectId,
      source: l.source || 'manual_add',
      locked: l.locked
    }));
    
    // Find updated links
    const updated = updatedLinks.filter(l => currentIds.includes(l.id));
    updated.forEach(l => {
      const existing = links.find((el: any) => el.id === l.id);
      if (existing && existing.locked !== l.locked) {
        updateLink({ id: l.id, updates: { locked: l.locked } });
      }
    });
  };

  // Inline editing state - must be before any early returns
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [isEditingStage, setIsEditingStage] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  // Sync edit state with milestone data when it changes
  useEffect(() => {
    if (milestone) {
      setEditName(milestone.name || "");
      setEditDescription(milestone.description || "");
      setEditDate(milestone.targetDate || "");
    }
  }, [milestone?.name, milestone?.description, milestone?.targetDate]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    if (isEditingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
  }, [isEditingDescription]);

  const handleUpdateRules = (updatedRules: MilestoneScopeRules) => {
    const existing = scopeRules.find((r: any) => r.milestoneId === updatedRules.milestoneId);
    if (existing) {
      updateScopeRule({ id: existing.id, updates: { rules: updatedRules.rules } });
    } else {
      createScopeRule({
        milestoneId: updatedRules.milestoneId,
        rules: updatedRules.rules
      });
    }
    toast({ title: "Scope Rules Updated", description: "Milestone scope has been recalculated." });
  };

  const handleSaveName = () => {
    if (milestone && editName.trim() && editName !== milestone.name) {
      updateMilestone({ id: milestone.id, updates: { name: editName.trim() } });
      toast({ title: "Name updated" });
    }
    setIsEditingName(false);
  };

  const handleSaveDescription = () => {
    if (milestone && editDescription !== milestone.description) {
      updateMilestone({ id: milestone.id, updates: { description: editDescription } });
      toast({ title: "Description updated" });
    }
    setIsEditingDescription(false);
  };

  const handleSaveOwner = (newOwnerId: string) => {
    if (milestone && newOwnerId !== milestone.ownerId) {
      updateMilestone({ id: milestone.id, updates: { ownerId: newOwnerId } });
      toast({ title: "Owner updated" });
    }
    setIsEditingOwner(false);
  };

  const handleSaveDate = () => {
    if (milestone && editDate !== milestone.targetDate) {
      updateMilestone({ id: milestone.id, updates: { targetDate: editDate } });
      toast({ title: "Target date updated" });
    }
    setIsEditingDate(false);
  };

  const handleSaveStage = (newStageId: string) => {
    const stageValue = newStageId === "__none__" ? null : newStageId;
    if (milestone && stageValue !== milestone.stageId) {
      updateMilestone({ id: milestone.id, updates: { stageId: stageValue } });
      toast({ title: "Stage updated" });
    }
    setIsEditingStage(false);
  };

  const handleSaveStatus = (newStatus: string) => {
    if (milestone && newStatus !== milestone.status) {
      updateMilestone({ id: milestone.id, updates: { status: newStatus } });
      toast({ title: "Status updated" });
    }
    setIsEditingStatus(false);
  };

  const handleToggleBillingGate = () => {
    if (milestone) {
      updateMilestone({ id: milestone.id, updates: { isBillingGate: !milestone.isBillingGate } });
      toast({ title: milestone.isBillingGate ? "Billing gate removed" : "Marked as billing gate" });
    }
  };

  // Get stages for this project (not just from tasks)
  const milestoneStages = useMemo(() => {
    if (!allStages) return [];
    return [...allStages]
      .filter((s: any) => s.projectId === projectId)
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  }, [allStages, projectId]);

  const currentStage = useMemo(() => {
    if (!milestone?.stageId || !allStages) return null;
    return allStages.find((s: any) => s.id === milestone.stageId);
  }, [milestone?.stageId, allStages]);

  const isLoading = isMilestonesLoading || isLinksLoading || isTasksLoading || isUsersLoading || isEpicsLoading || isDeliverablesLoading || isStagesLoading;

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  if (!milestone) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Milestone not found</h2>
          <p className="text-muted-foreground mt-2">The milestone you're looking for doesn't exist.</p>
          <Link href={`/projects/${projectId}?tab=milestones`}>
            <Button className="mt-4">Back to Milestones</Button>
          </Link>
        </div>
      </Shell>
    );
  }

  const status = STATUS_CONFIG[milestone.status] || STATUS_CONFIG.planned;
  const StatusIcon = status.icon;
  const owner = getOwner(milestone.ownerId);

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className={cn("p-3 rounded-lg", status.bgColor, status.color)}>
              <Target className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      ref={nameInputRef}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') {
                          setEditName(milestone.name);
                          setIsEditingName(false);
                        }
                      }}
                      className="text-2xl font-bold h-10 w-80"
                      data-testid="input-milestone-name"
                    />
                    <Button size="icon" variant="ghost" onClick={handleSaveName} className="h-8 w-8">
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => {
                      setEditName(milestone.name);
                      setIsEditingName(false);
                    }} className="h-8 w-8">
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <h1 
                    className="text-2xl font-bold tracking-tight cursor-pointer hover:text-primary/80 transition-colors group flex items-center gap-2"
                    onClick={() => setIsEditingName(true)}
                    data-testid="text-milestone-name"
                  >
                    {milestone.name}
                    <Pencil className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                  </h1>
                )}
                {isEditingStatus ? (
                  <SearchableSelect 
                    value={milestone.status || "planned"} 
                    onValueChange={(value) => handleSaveStatus(value)}
                    className="h-7 w-32 text-sm"
                    data-testid="select-milestone-status"
                    options={[
                      { value: "planned", label: "Planned" },
                      { value: "in_progress", label: "In Progress" },
                      { value: "achieved", label: "Achieved" },
                      { value: "slipped", label: "Slipped" },
                      { value: "cancelled", label: "Cancelled" }
                    ]}
                  />
                ) : (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "font-normal cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all",
                      milestone.status === "achieved" || milestone.status === "Completed" 
                        ? "bg-green-50 text-green-700 border-green-200" 
                        : milestone.status === "in_progress" || milestone.status === "In Progress"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : milestone.status === "slipped" || milestone.status === "Blocked"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    )}
                    onClick={() => setIsEditingStatus(true)}
                    data-testid="badge-milestone-status"
                  >
                    {status.label}
                  </Badge>
                )}
                {milestone.isBillingGate && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-normal">
                    Billing Gate
                  </Badge>
                )}
              </div>
              
              {/* Description - inline editable */}
              {isEditingDescription ? (
                <div className="space-y-2">
                  <Textarea
                    ref={descriptionInputRef}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setEditDescription(milestone.description || "");
                        setIsEditingDescription(false);
                      }
                    }}
                    placeholder="Add a description..."
                    className="min-h-[80px] resize-none"
                    data-testid="input-milestone-description"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveDescription}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      setEditDescription(milestone.description || "");
                      setIsEditingDescription(false);
                    }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <p 
                  className={cn(
                    "cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 transition-colors group flex items-center gap-2",
                    !milestone.description && "text-muted-foreground italic"
                  )}
                  onClick={() => setIsEditingDescription(true)}
                  data-testid="text-milestone-description"
                >
                  {milestone.description || "Click to add description..."}
                  <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                </p>
              )}
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Target Date - inline editable */}
            <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => !isEditingDate && setIsEditingDate(true)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Target Date</p>
                    {isEditingDate ? (
                      <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                        <Input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveDate();
                            if (e.key === 'Escape') {
                              setEditDate(milestone.targetDate || "");
                              setIsEditingDate(false);
                            }
                          }}
                          className="h-7 text-sm"
                          autoFocus
                          data-testid="input-milestone-date"
                        />
                        <Button size="icon" variant="ghost" onClick={handleSaveDate} className="h-6 w-6">
                          <Check className="h-3 w-3 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => {
                          setEditDate(milestone.targetDate || "");
                          setIsEditingDate(false);
                        }} className="h-6 w-6">
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <p className="font-medium group flex items-center gap-1">
                        {milestone.targetDate || "Not set"}
                        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Owner - inline editable */}
            <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => !isEditingOwner && setIsEditingOwner(true)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Owner</p>
                    {isEditingOwner ? (
                      <div onClick={(e) => e.stopPropagation()}>
                        <SearchableSelect 
                          value={milestone.ownerId || ""} 
                          onValueChange={(value) => handleSaveOwner(value)}
                          className="h-7 text-sm mt-1"
                          data-testid="select-milestone-owner"
                          placeholder="Select owner"
                          options={(users || []).map((u: any) => ({ value: u.id, label: u.name }))}
                        />
                      </div>
                    ) : (
                      <p className="font-medium group flex items-center gap-1">
                        {owner?.name || "Unassigned"}
                        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stage - inline editable */}
            <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => !isEditingStage && setIsEditingStage(true)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Layers className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Stage</p>
                    {isEditingStage ? (
                      <div onClick={(e) => e.stopPropagation()}>
                        <SearchableSelect 
                          value={milestone.stageId || "__none__"} 
                          onValueChange={(value) => handleSaveStage(value)}
                          className="h-7 text-sm mt-1"
                          data-testid="select-milestone-stage"
                          placeholder="Select stage"
                          options={[
                            { value: "__none__", label: "No stage" },
                            ...milestoneStages.map((s: any) => ({ value: s.id, label: s.name }))
                          ]}
                        />
                      </div>
                    ) : (
                      <p className="font-medium group flex items-center gap-1">
                        {currentStage?.name || "Not assigned"}
                        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tasks</p>
                    <p className="font-medium">{progress.done} / {progress.total} completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Progress</p>
                    <p className="text-sm font-medium">{progress.percent}%</p>
                  </div>
                  <Progress value={progress.percent} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Billing Gate Toggle */}
            <Card className={cn(
              "hover:border-primary/50 transition-colors",
              milestone.isBillingGate && "border-amber-300 bg-amber-50/30"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Flag className={cn("h-5 w-5", milestone.isBillingGate ? "text-amber-600" : "text-muted-foreground")} />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Billing Gate</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Switch 
                        checked={milestone.isBillingGate || false} 
                        onCheckedChange={handleToggleBillingGate}
                        data-testid="switch-billing-gate"
                      />
                      <span className="text-sm font-medium">{milestone.isBillingGate ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Date Conflict Warning Banner */}
        {hasDateConflicts && (
          <Card className="border-amber-300 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-amber-800">Date Conflicts Detected</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    {dateConflicts.length} task{dateConflicts.length !== 1 ? 's have' : ' has'} target date{dateConflicts.length !== 1 ? 's' : ''} that fall{dateConflicts.length === 1 ? 's' : ''} after the milestone target date ({milestone.targetDate ? new Date(milestone.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set'}).
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {dateConflicts.slice(0, 5).map((task: any) => (
                      <Badge 
                        key={task.id} 
                        variant="outline" 
                        className="bg-white border-amber-300 text-amber-800 text-xs"
                      >
                        {task.title} ({new Date(task.targetDate || task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})
                      </Badge>
                    ))}
                    {dateConflicts.length > 5 && (
                      <Badge variant="outline" className="bg-white border-amber-300 text-amber-700 text-xs">
                        +{dateConflicts.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs: Tasks & Scope Definition */}
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="tasks" className="gap-2" data-testid="tab-tasks">
              <ListTodo className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="scope" className="gap-2" data-testid="tab-scope">
              <SlidersHorizontal className="h-4 w-4" />
              Scope Definition
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-6">
            <TasksTab 
              linkedTasks={linkedTasks}
              projectId={projectId}
              milestone={milestone}
              allTasks={projectTasks}
              epics={projectEpics}
              stages={projectStages}
              links={links}
              getEpic={getEpic}
              getAssignee={getAssignee}
              onUpdateLinks={handleUpdateLinks}
              hasTaskDateConflict={hasTaskDateConflict}
            />
          </TabsContent>

          <TabsContent value="scope" className="mt-6">
            <ScopeDefinitionTab
              milestone={milestone}
              tasks={projectTasks}
              epics={projectEpics}
              stages={projectStages}
              links={links}
              rules={selectedRules}
              onUpdateLinks={handleUpdateLinks}
              onUpdateRules={handleUpdateRules}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
}

const EFFORT_VALUES = [1, 2, 3, 5, 8, 13, 21];

function TasksTab({ 
  linkedTasks, 
  projectId,
  milestone,
  allTasks,
  epics,
  stages,
  links,
  getEpic, 
  getAssignee,
  onUpdateLinks,
  hasTaskDateConflict
}: { 
  linkedTasks: any[], 
  projectId: string,
  milestone: any,
  allTasks: any[],
  epics: any[],
  stages: any[],
  links: any[],
  getEpic: (id?: string) => any,
  getAssignee: (id?: string) => any,
  onUpdateLinks: (links: any[]) => void,
  hasTaskDateConflict: (task: any) => boolean
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"search" | "create">("search");
  const [dialogSearchQuery, setDialogSearchQuery] = useState("");
  const [selectedEpicId, setSelectedEpicId] = useState<string>("");
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const { toast } = useToast();
  const { createAsync: createTaskAsync } = useTasks();
  const [isCreating, setIsCreating] = useState(false);
  
  // ListHeader state for filtering linked tasks
  const [listSearchQuery, setListSearchQuery] = useState("");
  const [layoutVariant, setLayoutVariant] = useState<LayoutVariant>("one-column");
  
  // Filter linked tasks by search
  const filteredLinkedTasks = useMemo(() => {
    if (!listSearchQuery.trim()) return linkedTasks;
    const q = listSearchQuery.toLowerCase();
    return linkedTasks.filter((t: any) => 
      t.title?.toLowerCase().includes(q) || 
      t.description?.toLowerCase().includes(q)
    );
  }, [linkedTasks, listSearchQuery]);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [newTaskEffort, setNewTaskEffort] = useState<number | null>(3);

  const currentLinkedTaskIds = useMemo(() => 
    links.filter((l: any) => l.milestoneId === milestone?.id).map((l: any) => l.taskId),
    [links, milestone?.id]
  );

  // Filter tasks for search - exclude already linked tasks
  const searchableTasks = useMemo(() => {
    return allTasks.filter(t => !currentLinkedTaskIds.includes(t.id));
  }, [allTasks, currentLinkedTaskIds]);

  const filteredSearchTasks = useMemo(() => {
    let result = searchableTasks;
    
    if (dialogSearchQuery.trim()) {
      const q = dialogSearchQuery.toLowerCase();
      result = result.filter(t => 
        t.title?.toLowerCase().includes(q) || 
        t.description?.toLowerCase().includes(q)
      );
    }
    
    if (selectedEpicId) {
      result = result.filter(t => t.epicId === selectedEpicId);
    }
    
    if (selectedStageId) {
      result = result.filter(t => t.stageId === selectedStageId);
    }
    
    return result.slice(0, 20); // Limit results
  }, [searchableTasks, dialogSearchQuery, selectedEpicId, selectedStageId]);

  const handleLinkTask = (taskId: string) => {
    const newLink: MilestoneTaskLink = {
      id: `l-${Date.now()}`,
      milestoneId: milestone.id,
      taskId,
      source: "manual_add",
      locked: false,
      createdAt: new Date().toISOString()
    };
    onUpdateLinks([...links, newLink]);
    toast({ title: "Task linked", description: "Task has been added to the milestone." });
    setDialogOpen(false);
  };

  const handleCreateTask = async () => {
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

      // Link the new task to the milestone
      const newLink: MilestoneTaskLink = {
        id: `l-${Date.now()}`,
        milestoneId: milestone.id,
        taskId: newTask.id,
        source: "manual_add",
        locked: false,
        createdAt: new Date().toISOString()
      };
      onUpdateLinks([...links, newLink]);
      
      toast({ title: "Task created and linked", description: "New task has been created and added to the milestone." });
      
      // Reset form
      setNewTaskTitle("");
      setNewTaskDescription("");
      setSelectedEpicId("");
      setSelectedStageId("");
      setNewTaskPriority("Medium");
      setNewTaskEffort(3);
      setDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create task.", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const openDialog = (mode: "search" | "create") => {
    setDialogMode(mode);
    setDialogSearchQuery("");
    setSelectedEpicId("");
    setSelectedStageId("");
    setDialogOpen(true);
  };

  return (
    <>
    <div className="space-y-4">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            Linked Tasks ({linkedTasks.length})
          </h2>
        </div>
        <ListHeader
          searchPlaceholder="Search linked tasks..."
          searchValue={listSearchQuery}
          onSearchChange={setListSearchQuery}
          newButtonLabel="Add Tasks"
          newButtonTestId="button-link-task"
          onNewClick={() => openDialog("search")}
          layoutVariant={layoutVariant}
          onLayoutChange={setLayoutVariant}
        />
      </div>
      
      {filteredLinkedTasks.length > 0 ? (
        <div className={getGridClassName(layoutVariant)}>
          {filteredLinkedTasks.map((task: any) => {
              const epic = getEpic(task.epicId);
              const assignee = getAssignee(task.assigneeId);
              const priorityClass = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;
              const hasConflict = hasTaskDateConflict(task);
              
              return (
                <Link key={task.id} href={`/projects/${projectId}/tasks/${task.id}`}>
                  <div 
                    className={cn(
                      "group flex items-center justify-between p-3 rounded-md border bg-background hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer",
                      hasConflict && "border-amber-300 bg-amber-50/30"
                    )}
                    data-testid={`milestone-task-${task.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        task.status === "Done" ? "bg-green-500" :
                        task.status === "In Progress" ? "bg-blue-500" :
                        task.status === "Review" ? "bg-amber-500" :
                        "bg-slate-400"
                      )} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium group-hover:text-primary transition-colors">{task.title}</h4>
                          {hasConflict && (
                            <span className="flex items-center gap-1 text-amber-600" title="Task due date is after milestone target date">
                              <AlertTriangle className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {epic && <span>{epic.title}</span>}
                          {(task.targetDate || task.dueDate) && (
                            <span className={cn(
                              "flex items-center gap-1",
                              hasConflict && "text-amber-600 font-medium"
                            )}>
                              <CalendarIcon className="h-3 w-3" />
                              {new Date(task.targetDate || task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          )}
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
        <Card>
          <CardContent className="p-8 text-center">
            <ListTodo className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-medium mb-1">
              {linkedTasks.length === 0 ? "No tasks linked" : "No tasks match your search"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {linkedTasks.length === 0 
                ? "Link tasks to this milestone to track progress. Use the Scope Definition tab to define rules or manually add tasks."
                : "Try adjusting your search terms"
              }
            </p>
            {linkedTasks.length === 0 && (
              <Button 
                size="sm" 
                variant="outline" 
                className="gap-2"
                onClick={() => openDialog("search")}
                data-testid="button-link-task-empty"
              >
                <Plus className="h-4 w-4" />
                Add Tasks
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>

    {/* Link/Create Task Dialog */}
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
                  value={dialogSearchQuery}
                  onChange={e => setDialogSearchQuery(e.target.value)}
                  data-testid="input-search-task"
                />
              </div>
              <div className="flex gap-2">
                <SearchableSelect 
                  value={selectedEpicId || "all"} 
                  onValueChange={(v) => setSelectedEpicId(v === "all" ? "" : v)}
                  className="w-[200px]"
                  data-testid="select-search-epic"
                  placeholder="Filter by Epic"
                  options={[
                    { value: "all", label: "All Epics" },
                    ...epics.map((epic: any) => ({ value: epic.id, label: epic.title }))
                  ]}
                />
                <SearchableSelect 
                  value={selectedStageId || "all"} 
                  onValueChange={(v) => setSelectedStageId(v === "all" ? "" : v)}
                  className="w-[200px]"
                  data-testid="select-search-stage"
                  placeholder="Filter by Stage"
                  options={[
                    { value: "all", label: "All Stages" },
                    ...stages.map((stage: any) => ({ value: stage.id, label: stage.label || stage.name }))
                  ]}
                />
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
                    const stage = stages.find((s: any) => s.id === task.stageId);
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
                                {stage.label || stage.name}
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
                  <SearchableSelect 
                    value={selectedEpicId} 
                    onValueChange={(v) => { setSelectedEpicId(v); setSelectedStageId(""); }}
                    data-testid="select-new-task-epic"
                    placeholder="Select Epic first"
                    options={epics.map((epic: any) => ({ value: epic.id, label: epic.title }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Stage <span className="text-red-500">*</span></Label>
                  <SearchableSelect 
                    value={selectedStageId} 
                    onValueChange={setSelectedStageId}
                    disabled={!selectedEpicId}
                    data-testid="select-new-task-stage"
                    placeholder={selectedEpicId ? "Select Stage" : "Select Epic first"}
                    options={stages.map((stage: any) => ({ value: stage.id, label: stage.label || stage.name }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <SearchableSelect 
                    value={newTaskPriority} 
                    onValueChange={setNewTaskPriority}
                    data-testid="select-new-task-priority"
                    options={[
                      { value: "Low", label: "Low" },
                      { value: "Medium", label: "Medium" },
                      { value: "High", label: "High" },
                      { value: "Critical", label: "Critical" }
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Effort (Fibonacci) <span className="text-red-500">*</span></Label>
                  <SearchableSelect 
                    value={newTaskEffort?.toString() || ""} 
                    onValueChange={(v) => setNewTaskEffort(v ? parseInt(v) : null)}
                    data-testid="select-new-task-effort"
                    placeholder="Select effort"
                    options={EFFORT_VALUES.map((val) => ({ value: val.toString(), label: val.toString() }))}
                  />
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

function ScopeDefinitionTab({ 
  milestone, 
  tasks, 
  epics, 
  stages,
  links, 
  rules, 
  onUpdateLinks,
  onUpdateRules 
}: {
  milestone: any,
  tasks: any[],
  epics: any[],
  stages: any[],
  links: any[],
  rules: MilestoneScopeRules,
  onUpdateLinks: (links: MilestoneTaskLink[]) => void,
  onUpdateRules: (rules: MilestoneScopeRules) => void
}) {
  const [manualSearch, setManualSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [epicFilter, setEpicFilter] = useState<string>("all");
  const [showLinkedOnly, setShowLinkedOnly] = useState<boolean | null>(null);
  const [expandedRules, setExpandedRules] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const getEpicName = (epicId: string) => {
    const epic = epics.find((e: any) => e.id === epicId);
    return epic?.title || "";
  };

  const getStageName = (stageId: string) => {
    const stage = stages.find((s: any) => s.id === stageId);
    return stage?.label || stage?.name || stageId;
  };

  const evaluateRule = useCallback((rule: any): any[] => {
    if (!rule.active) return [];
    
    return tasks.filter(task => {
      if (rule.stage && rule.stage !== "all" && task.stageId !== rule.stage) {
        return false;
      }
      
      const epic = epics.find((e: any) => e.id === task.epicId);
      if (rule.epicType && rule.epicType !== "all") {
        const epicType = epic?.type || epic?.epicType || "";
        if (epicType !== rule.epicType) {
          return false;
        }
      }
      
      if (rule.taskTemplateKey && rule.taskTemplateKey !== "all") {
        const taskType = task.templateKey || task.type || "";
        if (!taskType.toLowerCase().includes(rule.taskTemplateKey.toLowerCase())) {
          return false;
        }
      }
      
      return true;
    });
  }, [tasks, epics]);

  const allMatchedTasksByRule = useMemo(() => {
    const result: Record<string, any[]> = {};
    (rules.rules || []).forEach((rule: any) => {
      result[rule.id] = evaluateRule(rule);
    });
    return result;
  }, [rules.rules, evaluateRule]);

  const allMatchedTasks = useMemo(() => {
    const taskSet = new Set<string>();
    Object.values(allMatchedTasksByRule).forEach((matchedTasks: any[]) => {
      matchedTasks.forEach(t => taskSet.add(t.id));
    });
    return tasks.filter(t => taskSet.has(t.id));
  }, [allMatchedTasksByRule, tasks]);

  const currentLinkedTaskIds = useMemo(() => {
    return links
      .filter((l: any) => l.milestoneId === milestone.id)
      .map((l: any) => l.taskId);
  }, [links, milestone.id]);

  const pendingTasks = useMemo(() => {
    return allMatchedTasks.filter(t => !currentLinkedTaskIds.includes(t.id));
  }, [allMatchedTasks, currentLinkedTaskIds]);

  const alreadyLinkedFromRules = useMemo(() => {
    return allMatchedTasks.filter(t => currentLinkedTaskIds.includes(t.id));
  }, [allMatchedTasks, currentLinkedTaskIds]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const epicName = getEpicName(t.epicId);
      const searchLower = manualSearch.toLowerCase();
      const matchesSearch = !manualSearch || 
        t.title?.toLowerCase().includes(searchLower) || 
        epicName.toLowerCase().includes(searchLower);
      
      const matchesStage = stageFilter === "all" || t.stageId === stageFilter;
      const matchesEpic = epicFilter === "all" || t.epicId === epicFilter;
      
      const isLinked = links.some((l: any) => l.taskId === t.id && l.milestoneId === milestone.id);
      const matchesLinkedFilter = showLinkedOnly === null || 
        (showLinkedOnly === true && isLinked) || 
        (showLinkedOnly === false && !isLinked);
      
      return matchesSearch && matchesStage && matchesEpic && matchesLinkedFilter;
    });
  }, [tasks, manualSearch, stageFilter, epicFilter, showLinkedOnly, links, milestone.id, epics]);

  const handleToggleTask = (taskId: string) => {
    const existingLink = links.find((l: any) => l.taskId === taskId && l.milestoneId === milestone.id);
    
    if (existingLink) {
      if (existingLink.locked) return;
      onUpdateLinks(links.filter((l: any) => l.id !== existingLink.id));
    } else {
      const newLink: MilestoneTaskLink = {
        id: `l-${Date.now()}`,
        milestoneId: milestone.id,
        taskId,
        source: "manual_add",
        locked: false,
        createdAt: new Date().toISOString()
      };
      onUpdateLinks([...links, newLink]);
    }
  };

  const handleToggleLock = (link: any) => {
    const updated = { ...link, locked: !link.locked };
    onUpdateLinks(links.map((l: any) => l.id === link.id ? updated : l));
  };

  const handleAddRule = () => {
    const newRule = {
      id: `r-${Date.now()}`,
      label: "New Scope Rule",
      active: true,
      stage: "all",
      epicType: "all",
      taskTemplateKey: "all"
    };
    onUpdateRules({
      ...rules,
      rules: [...(rules.rules || []), newRule]
    });
    setExpandedRules(prev => ({ ...prev, [newRule.id]: true }));
  };

  const handleDeleteRule = (ruleId: string) => {
    onUpdateRules({
      ...rules,
      rules: rules.rules.filter((r: any) => r.id !== ruleId)
    });
  };

  const handleUpdateRule = (ruleId: string, updates: any) => {
    onUpdateRules({
      ...rules,
      rules: rules.rules.map((r: any) => r.id === ruleId ? { ...r, ...updates } : r)
    });
  };

  const handleToggleRuleActive = (ruleId: string, newActive: boolean) => {
    handleUpdateRule(ruleId, { active: newActive });
    
    if (!newActive) {
      const rule = (rules.rules || []).find((r: any) => r.id === ruleId);
      if (!rule) return;
      
      const tasksMatchedByThisRule = evaluateRule({ ...rule, active: true });
      const tasksMatchedByOtherActiveRules = new Set<string>();
      
      (rules.rules || []).forEach((r: any) => {
        if (r.id !== ruleId && r.active) {
          evaluateRule(r).forEach(t => tasksMatchedByOtherActiveRules.add(t.id));
        }
      });
      
      const tasksToUnlink = tasksMatchedByThisRule.filter(t => 
        !tasksMatchedByOtherActiveRules.has(t.id)
      );
      
      if (tasksToUnlink.length > 0) {
        const taskIdsToUnlink = new Set(tasksToUnlink.map(t => t.id));
        const linksToRemove = links.filter((l: any) => 
          l.milestoneId === milestone.id && 
          taskIdsToUnlink.has(l.taskId) && 
          !l.locked &&
          typeof l.source === 'string' && 
          l.source.startsWith('rule:')
        );
        
        if (linksToRemove.length > 0) {
          const linkIdsToRemove = new Set(linksToRemove.map((l: any) => l.id));
          const updatedLinks = links.filter((l: any) => !linkIdsToRemove.has(l.id));
          onUpdateLinks(updatedLinks);
          toast({ 
            title: "Rule Disabled", 
            description: `Removed ${linksToRemove.length} task${linksToRemove.length !== 1 ? 's' : ''} from milestone scope.` 
          });
        }
      }
    }
  };

  const handleApplyRules = () => {
    if (pendingTasks.length === 0) {
      toast({ 
        title: "No Changes", 
        description: "All matched tasks are already linked to this milestone." 
      });
      return;
    }

    const newLinks = pendingTasks.map(t => {
      const matchingRuleIds = (rules.rules || [])
        .filter((r: any) => r.active && allMatchedTasksByRule[r.id]?.some((mt: any) => mt.id === t.id))
        .map((r: any) => r.id);
      
      return {
        id: `l-${Date.now()}-${t.id}`,
        milestoneId: milestone.id,
        taskId: t.id,
        source: `rule:${matchingRuleIds.join(',')}`,
        locked: false,
        createdAt: new Date().toISOString()
      };
    });

    onUpdateLinks([...links, ...newLinks]);
    toast({ 
      title: "Rules Applied", 
      description: `Added ${pendingTasks.length} task${pendingTasks.length !== 1 ? 's' : ''} to milestone scope.` 
    });
  };

  const handleToggleCellTasks = (epicId: string, stageId: string) => {
    const cellTasks = tasks.filter((t: any) => t.epicId === epicId && t.stageId === stageId);
    if (cellTasks.length === 0) return;

    const milestoneLinks = links.filter((l: any) => l.milestoneId === milestone.id);
    const linkedTaskIds = milestoneLinks.map((l: any) => l.taskId);
    
    const unlinkedTasks = cellTasks.filter((t: any) => !linkedTaskIds.includes(t.id));
    
    const cellTaskIds = cellTasks.map((t: any) => t.id);
    const removableLinks = milestoneLinks.filter((l: any) => 
      cellTaskIds.includes(l.taskId) && !l.locked
    );
    
    if (unlinkedTasks.length > 0) {
      const newLinks = unlinkedTasks.map((t: any) => ({
        id: `l-${Date.now()}-${t.id}`,
        milestoneId: milestone.id,
        taskId: t.id,
        source: "manual_add",
        locked: false
      }));
      onUpdateLinks([...links, ...newLinks]);
    } else if (removableLinks.length > 0) {
      const removableIds = removableLinks.map(l => l.id);
      const updatedLinks = links.filter((l: any) => !removableIds.includes(l.id));
      onUpdateLinks(updatedLinks);
    }
  };

  const toggleRuleExpanded = (ruleId: string) => {
    setExpandedRules(prev => ({ ...prev, [ruleId]: !prev[ruleId] }));
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
          <TabsTrigger 
            value="manual"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2"
          >
            <ListTodo className="w-4 h-4 mr-2" />
            Manual Adjustments
          </TabsTrigger>
          <TabsTrigger 
            value="matrix"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2"
          >
            <Layers className="w-4 h-4 mr-2" />
            Coverage Matrix
          </TabsTrigger>
          <TabsTrigger 
            value="rules" 
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Rule-Based Scope
            {pendingTasks.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700 text-xs">
                {pendingTasks.length} pending
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="rules" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium">Definition Rules</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Define criteria to automatically include tasks in this milestone
                </p>
              </div>
              <div className="flex gap-2">
                {pendingTasks.length > 0 && (
                  <Button 
                    size="sm" 
                    onClick={handleApplyRules}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                    data-testid="button-apply-rules"
                  >
                    <Zap className="h-4 w-4" /> 
                    Apply Rules ({pendingTasks.length} tasks)
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={handleAddRule} className="gap-2" data-testid="button-add-rule">
                  <Plus className="h-4 w-4" /> Add Rule
                </Button>
              </div>
            </div>

            {pendingTasks.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">
                    {pendingTasks.length} task{pendingTasks.length !== 1 ? 's' : ''} matched but not yet applied
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Click "Apply Rules" to add these tasks to the milestone scope.
                  </p>
                </div>
              </div>
            )}

            {alreadyLinkedFromRules.length > 0 && pendingTasks.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">
                    All matched tasks are linked
                  </p>
                  <p className="text-xs text-green-700 mt-0.5">
                    {alreadyLinkedFromRules.length} task{alreadyLinkedFromRules.length !== 1 ? 's' : ''} from rules are included in this milestone.
                  </p>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              {(rules.rules || []).length === 0 ? (
                 <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm bg-muted/10">
                   No rules defined. Add a rule to automatically include tasks in this milestone.
                 </div>
              ) : (
                rules.rules.map((rule: any) => {
                  const matchedTasks = allMatchedTasksByRule[rule.id] || [];
                  const linkedCount = matchedTasks.filter(t => currentLinkedTaskIds.includes(t.id)).length;
                  const pendingCount = matchedTasks.length - linkedCount;
                  const isExpanded = expandedRules[rule.id] || false;
                  
                  return (
                    <Card key={rule.id} className={cn(
                      "relative overflow-hidden transition-all",
                      !rule.active && "opacity-60"
                    )}>
                      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                        <div className="flex-1 mr-4">
                           <Input 
                             value={rule.label} 
                             onChange={(e) => handleUpdateRule(rule.id, { label: e.target.value })}
                             className="h-8 font-medium border-transparent hover:border-input focus:border-input px-0"
                             data-testid={`input-rule-label-${rule.id}`}
                           />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={rule.active} 
                            onCheckedChange={(c) => handleToggleRuleActive(rule.id, c)} 
                            data-testid={`switch-rule-active-${rule.id}`}
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive" 
                            onClick={() => handleDeleteRule(rule.id)}
                            data-testid={`button-delete-rule-${rule.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 text-sm text-muted-foreground space-y-3">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-1">
                             <Label className="text-xs">Stage</Label>
                             <SearchableSelect 
                               value={rule.stage || "all"} 
                               onValueChange={(v) => handleUpdateRule(rule.id, { stage: v })}
                               className="h-8"
                               data-testid={`select-rule-stage-${rule.id}`}
                               placeholder="Any Stage"
                               options={[
                                 { value: "all", label: "Any Stage" },
                                 ...stages.map((stage: any) => ({ value: stage.id, label: stage.label || stage.name }))
                               ]}
                             />
                          </div>
                          <div className="space-y-1">
                             <Label className="text-xs">Epic Type</Label>
                             <SearchableSelect 
                               value={rule.epicType || "all"} 
                               onValueChange={(v) => handleUpdateRule(rule.id, { epicType: v })}
                               className="h-8"
                               data-testid={`select-rule-epic-type-${rule.id}`}
                               placeholder="Any Epic Type"
                               options={[
                                 { value: "all", label: "Any Epic Type" },
                                 { value: "use_case", label: "Use Case" },
                                 { value: "technical", label: "Technical" }
                               ]}
                             />
                          </div>
                          <div className="space-y-1">
                             <Label className="text-xs">Task Type</Label>
                             <SearchableSelect 
                               value={rule.taskTemplateKey || "all"} 
                               onValueChange={(v) => handleUpdateRule(rule.id, { taskTemplateKey: v })}
                               className="h-8"
                               data-testid={`select-rule-task-type-${rule.id}`}
                               placeholder="Any Type"
                               options={[
                                 { value: "all", label: "Any Type" },
                                 { value: "backend", label: "Backend Task" },
                                 { value: "frontend", label: "Frontend Task" },
                                 { value: "design", label: "Design Task" }
                               ]}
                             />
                          </div>
                        </div>

                        <Collapsible open={isExpanded} onOpenChange={() => toggleRuleExpanded(rule.id)}>
                          <CollapsibleTrigger asChild>
                            <button 
                              className={cn(
                                "w-full p-3 rounded-lg text-xs flex items-center justify-between transition-colors",
                                matchedTasks.length > 0 
                                  ? pendingCount > 0
                                    ? "bg-amber-50 hover:bg-amber-100 border border-amber-200"
                                    : "bg-green-50 hover:bg-green-100 border border-green-200"
                                  : "bg-muted/30 hover:bg-muted/50"
                              )}
                              data-testid={`button-toggle-rule-preview-${rule.id}`}
                            >
                              <span className="flex items-center gap-2">
                                {matchedTasks.length > 0 ? (
                                  pendingCount > 0 ? (
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                  ) : (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                  )
                                ) : (
                                  <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                                <span>
                                  Matches <strong>{matchedTasks.length}</strong> task{matchedTasks.length !== 1 ? 's' : ''}
                                  {matchedTasks.length > 0 && (
                                    <span className="text-muted-foreground ml-1">
                                      ({linkedCount} linked{pendingCount > 0 && `, ${pendingCount} pending`})
                                    </span>
                                  )}
                                </span>
                              </span>
                              <ChevronDown className={cn(
                                "h-4 w-4 transition-transform",
                                isExpanded && "rotate-180"
                              )} />
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            {matchedTasks.length > 0 ? (
                              <div className="mt-2 border rounded-lg divide-y max-h-[200px] overflow-y-auto">
                                {matchedTasks.map((task: any) => {
                                  const isLinked = currentLinkedTaskIds.includes(task.id);
                                  return (
                                    <div 
                                      key={task.id} 
                                      className="px-3 py-2 flex items-center justify-between text-xs hover:bg-muted/30"
                                    >
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        {isLinked ? (
                                          <CheckSquare className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                                        ) : (
                                          <Circle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                                        )}
                                        <span className="truncate font-medium">{task.title}</span>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                        <Badge variant="outline" className="text-[10px]">
                                          {getStageName(task.stageId)}
                                        </Badge>
                                        <Badge 
                                          variant="secondary" 
                                          className={cn(
                                            "text-[10px]",
                                            isLinked ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                          )}
                                        >
                                          {isLinked ? "Linked" : "Pending"}
                                        </Badge>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="mt-2 p-4 border rounded-lg text-center text-muted-foreground text-xs">
                                No tasks match this rule's criteria
                              </div>
                            )}
                          </CollapsibleContent>
                        </Collapsible>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="flex flex-col gap-3">
               <div className="flex gap-2">
                 <div className="relative flex-1">
                   <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                   <Input 
                     placeholder="Search by task or epic name..." 
                     className="pl-9"
                     value={manualSearch}
                     onChange={e => setManualSearch(e.target.value)}
                     data-testid="input-manual-search"
                   />
                 </div>
               </div>
               <div className="flex flex-wrap gap-2 items-center">
                 <div className="flex items-center gap-2">
                   <Label className="text-xs text-muted-foreground whitespace-nowrap">Stage:</Label>
                   <SearchableSelect 
                     value={stageFilter} 
                     onValueChange={setStageFilter}
                     className="h-8 w-[180px]"
                     data-testid="select-stage-filter"
                     placeholder="All Stages"
                     options={[
                       { value: "all", label: "All Stages" },
                       ...stages.map((stage: any) => ({ value: stage.id, label: stage.label }))
                     ]}
                   />
                 </div>
                 <div className="flex items-center gap-2">
                   <Label className="text-xs text-muted-foreground whitespace-nowrap">Epic:</Label>
                   <SearchableSelect 
                     value={epicFilter} 
                     onValueChange={setEpicFilter}
                     className="h-8 w-[180px]"
                     data-testid="select-epic-filter"
                     placeholder="All Epics"
                     options={[
                       { value: "all", label: "All Epics" },
                       ...epics.map((epic: any) => ({ value: epic.id, label: epic.title }))
                     ]}
                   />
                 </div>
                 <div className="flex items-center gap-2">
                   <Label className="text-xs text-muted-foreground whitespace-nowrap">Show:</Label>
                   <SearchableSelect 
                     value={showLinkedOnly === null ? "all" : showLinkedOnly ? "linked" : "unlinked"} 
                     onValueChange={(v) => setShowLinkedOnly(v === "all" ? null : v === "linked")}
                     className="h-8 w-[130px]"
                     data-testid="select-linked-filter"
                     placeholder="All Tasks"
                     options={[
                       { value: "all", label: "All Tasks" },
                       { value: "linked", label: "Included" },
                       { value: "unlinked", label: "Not Included" }
                     ]}
                   />
                 </div>
                 {(stageFilter !== "all" || epicFilter !== "all" || showLinkedOnly !== null || manualSearch) && (
                   <Button 
                     variant="ghost" 
                     size="sm" 
                     className="h-8 text-xs"
                     onClick={() => {
                       setStageFilter("all");
                       setEpicFilter("all");
                       setShowLinkedOnly(null);
                       setManualSearch("");
                     }}
                     data-testid="button-clear-filters"
                   >
                     Clear Filters
                   </Button>
                 )}
               </div>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Epic</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Included</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.slice(0, 20).map((task: any) => {
                    const link = links.find((l: any) => l.taskId === task.id && l.milestoneId === milestone.id);
                    const isLinked = !!link;
                    const epic = epics.find((e: any) => e.id === task.epicId);

                    return (
                      <TableRow key={task.id}>
                        <TableCell>
                          <CheckSquare 
                            className={cn(
                              "h-4 w-4 cursor-pointer transition-colors", 
                              isLinked ? "text-primary" : "text-muted-foreground/30 hover:text-muted-foreground"
                            )}
                            onClick={() => handleToggleTask(task.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {task.title}
                          <div className="text-xs text-muted-foreground">{task.id}</div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {epic?.title || "No Epic"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-normal">
                            {task.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {isLinked ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                              {link?.source === 'rule' ? 'By Rule' : 'Manual'}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                           {isLinked && (
                             <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleToggleLock(link)}>
                               {link.locked ? (
                                 <Lock className="h-3 w-3 text-amber-500" />
                               ) : (
                                 <Unlock className="h-3 w-3 text-muted-foreground/30" />
                               )}
                             </Button>
                           )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {filteredTasks.length > 20 && (
                <div className="p-2 text-center text-xs text-muted-foreground border-t">
                  Showing 20 of {filteredTasks.length} tasks. Use search to find more.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="matrix" className="space-y-4">
             <div className="border rounded-md overflow-hidden">
               <div className="bg-muted/30 p-4 border-b">
                 <h4 className="font-medium text-sm">Coverage Matrix</h4>
                 <p className="text-xs text-muted-foreground">Click on cells to toggle task inclusion for that Epic & Stage.</p>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-sm">
                   <thead>
                     <tr className="border-b bg-muted/10">
                       <th className="p-3 text-left font-medium min-w-[200px]">Epic</th>
                       {stages.map((stage: any) => (
                         <th key={stage.id} className="p-3 text-center font-medium border-l min-w-[100px]">
                           {stage.label}
                         </th>
                       ))}
                     </tr>
                   </thead>
                   <tbody>
                     {epics.length === 0 ? (
                       <tr>
                         <td colSpan={stages.length + 1} className="p-8 text-center text-muted-foreground">
                           No epics found in this project.
                         </td>
                       </tr>
                     ) : stages.length === 0 ? (
                       <tr>
                         <td colSpan={2} className="p-8 text-center text-muted-foreground">
                           No stages found. Tasks must have stages assigned.
                         </td>
                       </tr>
                     ) : (
                       epics.map((epic: any) => (
                         <tr key={epic.id} className="border-b last:border-0 hover:bg-muted/5">
                           <td className="p-3 font-medium">
                             {epic.title}
                             <div className="text-xs text-muted-foreground font-normal line-clamp-1">{epic.description}</div>
                           </td>
                           {stages.map((stage: any) => {
                             const cellTasks = tasks.filter((t: any) => t.epicId === epic.id && t.stageId === stage.id);
                             const hasTasks = cellTasks.length > 0;
                             
                             const linkedCount = cellTasks.filter((t: any) => 
                               links.some((l: any) => l.taskId === t.id && l.milestoneId === milestone.id)
                             ).length;
                             
                             const isFullyIncluded = hasTasks && linkedCount === cellTasks.length;
                             const isPartiallyIncluded = hasTasks && linkedCount > 0 && linkedCount < cellTasks.length;

                             return (
                               <td 
                                 key={stage.id} 
                                 className={cn(
                                   "p-3 text-center border-l transition-colors relative",
                                   hasTasks ? "cursor-pointer hover:bg-muted/20 active:bg-muted/30" : "opacity-50 cursor-default"
                                 )}
                                 onClick={() => hasTasks && handleToggleCellTasks(epic.id, stage.id)}
                               >
                                 {hasTasks ? (
                                   <div className="flex flex-col items-center gap-1">
                                     <div className={cn(
                                       "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                                       isFullyIncluded ? "bg-green-100 text-green-700" :
                                       isPartiallyIncluded ? "bg-amber-100 text-amber-700" :
                                       "bg-slate-100 text-slate-500"
                                     )}>
                                       {linkedCount}/{cellTasks.length}
                                     </div>
                                   </div>
                                 ) : (
                                   <span className="text-muted-foreground/30">-</span>
                                 )}
                               </td>
                             );
                           })}
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
             </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
