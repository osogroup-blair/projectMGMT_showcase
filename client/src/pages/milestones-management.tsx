import { useState, useMemo, useEffect, useCallback } from "react";
import { Shell } from "@/components/layout/shell";
import { CoverageMatrix } from "@/components/coverage-matrix";
import { 
  Plus, Search, Filter, MoreVertical, Edit, Trash2, 
  CheckCircle2, Circle, Clock, AlertCircle, Calendar, 
  User, Flag, CheckSquare, Target, Briefcase, Layers,
  ListTodo, SlidersHorizontal, ArrowRight, Copy, Lock, Unlock,
  Grid3X3, Eye, Loader2, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter 
} from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useRoute, Link, useLocation } from "wouter";
import { 
  useMilestones, useTasks, useEpics, useUsers, useProject,
  useMilestoneScopeRules, useMilestoneTaskLinks
} from "@/hooks/use-nexus-data";
import { useCompletedStatuses } from "@/hooks/use-completed-statuses";

// Types for local use
interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description: string;
  phase: string;
  stageId?: string;
  targetDate: string;
  status: string;
  ownerId: string;
  scopeType?: string;
  completionMode?: string;
  completionTargetPercent?: number;
  tags?: string[];
  progress?: {
    totalTasks: number;
    completedTasks: number;
    percentComplete: number;
  };
  progressPercent?: number;
  isBillingGate?: boolean;
  requiredCompletionRatio?: number;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  project: string;
  projectId?: string;
  stageId?: string;
  epicId?: string;
  status: string;
  assigneeId?: string;
  deadline?: string;
  priority?: string;
  milestoneId?: string;
  estimateHours?: number;
  effort?: number;
  tags?: string[];
}

interface Epic {
  id: string;
  deliverableId: string;
  title: string;
  description: string;
  status: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  progress: number;
  stageIds?: string[];
}

interface MilestoneScopeRules {
  milestoneId: string;
  rules: any[];
}

interface MilestoneTaskLink {
  id: string;
  milestoneId: string;
  taskId: string;
  projectId?: string;
  source: string;
  locked?: boolean;
  createdAt?: string;
}

// --- Types & Constants ---

const PHASES = [
  { id: "plan_strategy", label: "Plan Strategy", color: "bg-purple-100 text-purple-800" },
  { id: "validate_blueprints", label: "Validate Blueprints", color: "bg-blue-100 text-blue-800" },
  { id: "develop_solution", label: "Develop Solution", color: "bg-indigo-100 text-indigo-800" },
  { id: "enable_users", label: "Enable Users", color: "bg-green-100 text-green-800" }
];

const TASK_STAGES = [
  { id: "st_plan", label: "Plan Strategy", color: "bg-purple-100 text-purple-800" },
  { id: "st_validate", label: "Validate Blueprints", color: "bg-blue-100 text-blue-800" },
  { id: "st_develop", label: "Develop Solution", color: "bg-indigo-100 text-indigo-800" },
  { id: "st_enable", label: "Enable Users", color: "bg-green-100 text-green-800" }
];

const STATUS_CONFIG = {
  "planned": { icon: Circle, color: "text-slate-500", label: "Planned" },
  "in_progress": { icon: Clock, color: "text-blue-500", label: "In Progress" },
  "achieved": { icon: CheckCircle2, color: "text-green-500", label: "Achieved" },
  "slipped": { icon: AlertCircle, color: "text-red-500", label: "Slipped" },
  "cancelled": { icon: Flag, color: "text-slate-400", label: "Cancelled" },
  // Legacy mappings
  "Pending": { icon: Circle, color: "text-slate-500", label: "Planned" },
  "In Progress": { icon: Clock, color: "text-blue-500", label: "In Progress" },
  "Completed": { icon: CheckCircle2, color: "text-green-500", label: "Achieved" },
  "Blocked": { icon: AlertCircle, color: "text-red-500", label: "Slipped" },
  "Skipped": { icon: Flag, color: "text-slate-400", label: "Cancelled" }
};

// --- Sub-Components ---

function TaskDialog({
  open,
  onOpenChange,
  task,
  epics,
  team,
  onSave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  epics: Epic[];
  team: any[];
  onSave: (task: Partial<Task>) => void;
}) {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: "",
    status: "Todo",
    epicId: "",
    stageId: "",
    assigneeId: ""
  });

  // Reset form when dialog opens/closes or task changes
  useMemo(() => {
    if (open) {
      if (task) {
        setFormData({
          title: task.title,
          status: task.status,
          epicId: task.epicId,
          stageId: task.stageId,
          assigneeId: task.assigneeId
        });
      } else {
        setFormData({
          title: "",
          status: "Todo",
          epicId: "",
          stageId: "",
          assigneeId: ""
        });
      }
    }
  }, [open, task]);

  // Filter stages based on selected epic
  const availableStages = useMemo(() => {
    if (!formData.epicId) return TASK_STAGES;
    const epic = epics.find(e => e.id === formData.epicId);
    if (!epic || !epic.stageIds) return TASK_STAGES;
    return TASK_STAGES.filter(s => epic.stageIds.includes(s.id));
  }, [formData.epicId, epics]);

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create Task"}</DialogTitle>
          <DialogDescription>
            {task ? "Update task details." : "Add a new task to an epic and stage."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Task title"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="task-epic">Epic</Label>
              <SearchableSelect 
                value={formData.epicId || ""} 
                onValueChange={(v) => setFormData({ ...formData, epicId: v, stageId: "" })}
                placeholder="Select Epic"
                options={epics.map(e => ({ value: e.id, label: e.title }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-stage">Stage</Label>
              <SearchableSelect 
                value={formData.stageId || ""} 
                onValueChange={(v) => setFormData({ ...formData, stageId: v })}
                disabled={!formData.epicId}
                placeholder="Select Stage"
                options={availableStages.map(s => ({ value: s.id, label: s.label }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="task-status">Status</Label>
              <SearchableSelect 
                value={formData.status || ""} 
                onValueChange={(v) => setFormData({ ...formData, status: v as any })}
                options={[
                  { value: "Todo", label: "Todo" },
                  { value: "In Progress", label: "In Progress" },
                  { value: "Review", label: "Review" },
                  { value: "Done", label: "Done" }
                ]}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-assignee">Assignee</Label>
              <SearchableSelect 
                value={formData.assigneeId || ""} 
                onValueChange={(v) => setFormData({ ...formData, assigneeId: v })}
                placeholder="Unassigned"
                options={team.map(t => ({ value: t.id, label: t.name }))}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!formData.title || !formData.epicId || !formData.stageId}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MilestoneListPanel({ 
  milestones, 
  selectedId, 
  onSelect, 
  onCreate, 
  onDelete 
}: { 
  milestones: Milestone[], 
  selectedId?: string, 
  onSelect: (id: string) => void,
  onCreate: () => void,
  onDelete: (id: string) => void
}) {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = milestones.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full border-r bg-muted/10 w-full md:w-80 lg:w-96 shrink-0">
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Milestones</h2>
          <Button size="sm" variant="ghost" onClick={onCreate}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search milestones..." 
            className="pl-9 bg-background"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col p-2 gap-2">
          {filtered.map(m => {
            const status = STATUS_CONFIG[m.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.planned;
            const StatusIcon = status.icon;
            
            return (
              <div 
                key={m.id}
                onClick={() => onSelect(m.id)}
                className={cn(
                  "p-3 rounded-lg cursor-pointer border transition-all hover:shadow-sm",
                  selectedId === m.id 
                    ? "bg-background border-primary shadow-sm ring-1 ring-primary/20" 
                    : "bg-card border-transparent hover:bg-background hover:border-border"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm line-clamp-1">{m.name}</span>
                  {selectedId === m.id && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 text-muted-foreground hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); setDeleteId(m.id); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <StatusIcon className={cn("h-3 w-3", status.color)} />
                  <span>{status.label}</span>
                  <span className="mx-1">•</span>
                  <span>{new Date(m.targetDate).toLocaleDateString()}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Progress</span>
                    <span>{m.progress?.percentComplete || 0}%</span>
                  </div>
                  <Progress value={m.progress?.percentComplete || 0} className="h-1" />
                </div>
              </div>
            );
          })}
          
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No milestones found.
            </div>
          )}
        </div>
      </ScrollArea>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the milestone and remove all task associations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deleteId) onDelete(deleteId);
              setDeleteId(null);
            }} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ActiveTasksList({
  milestone,
  tasks,
  links,
  epics,
  team,
  projectId,
  onCreateTask,
  onUpdateTask
}: {
  milestone: Milestone,
  tasks: Task[],
  links: MilestoneTaskLink[],
  epics: Epic[],
  team: any[],
  projectId: string,
  onCreateTask: (task: Partial<Task>) => void,
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const activeTasks = useMemo(() => {
    return links
      .filter(l => l.milestoneId === milestone.id)
      .map(l => {
        const task = tasks.find(t => t.id === l.taskId);
        return task ? { ...task, link: l } : null;
      })
      .filter(Boolean) as (Task & { link: MilestoneTaskLink })[];
  }, [milestone.id, links, tasks]);

  const handleCreate = (data: Partial<Task>) => {
    onCreateTask(data);
  };

  const handleUpdate = (data: Partial<Task>) => {
    if (editingTask) {
      onUpdateTask(editingTask.id, data);
    }
  };

  const openCreate = () => {
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4 mt-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Active Tasks ({activeTasks.length})</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Filter className="h-3 w-3 mr-2" /> Filter</Button>
          <Button size="sm" onClick={openCreate}><Plus className="h-3 w-3 mr-2" /> Create Task</Button>
        </div>
      </div>

      <TaskDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        task={editingTask}
        epics={epics}
        team={team}
        onSave={editingTask ? handleUpdate : handleCreate}
      />

      {activeTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-lg bg-muted/5">
          <ListTodo className="h-12 w-12 opacity-20 mb-4" />
          <h3 className="text-lg font-medium text-foreground">No Active Tasks</h3>
          <p className="max-w-xs text-center mt-2 text-sm">
             Use the create button or "Scope Definition" tab to add tasks.
          </p>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Epic</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead className="text-right">Source</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeTasks.map(task => {
                const epic = epics.find(e => e.id === task.epicId);
                const stage = TASK_STAGES.find(p => p.id === task.stageId) || { label: "Unknown", color: "bg-gray-100 text-gray-800" };
                
                return (
                  <TableRow key={task.id} className="group">
                    <TableCell className="font-medium">
                      <Link href={`/projects/${projectId}/tasks/${task.id}`} className="hover:text-primary hover:underline">
                        {task.title}
                      </Link>
                      <div className="text-xs text-muted-foreground">{task.id}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {epic?.title || "No Epic"}
                    </TableCell>
                    <TableCell>
                      {task.stageId ? (
                        <Badge variant="outline" className={cn("text-xs font-normal border-transparent", stage.color)}>
                          {stage.label}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {team.find(t => t.id === task.assigneeId)?.name || "Unassigned"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted font-normal text-[10px]">
                        {task.link.source === 'rule' ? 'Rule' : 'Manual'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openEdit(task)}>
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function ScopeBuilder({ 
  milestone, 
  tasks, 
  epics, 
  links, 
  rules, 
  onUpdateLinks,
  onUpdateRules 
}: {
  milestone: Milestone,
  tasks: Task[],
  epics: Epic[],
  links: MilestoneTaskLink[],
  rules: MilestoneScopeRules,
  onUpdateLinks: (links: MilestoneTaskLink[]) => void,
  onUpdateRules: (rules: MilestoneScopeRules) => void
}) {
  // Manual Scope State
  const [manualSearch, setManualSearch] = useState("");
  
  // Rule Builder State
  const [activeRuleId, setActiveRuleId] = useState<string | null>(null);

  // Filtered tasks for manual selection
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(manualSearch.toLowerCase()) || 
                            t.project.toLowerCase().includes(manualSearch.toLowerCase());
      return matchesSearch;
    });
  }, [tasks, manualSearch]);

  const handleToggleTask = (taskId: string) => {
    const existingLink = links.find(l => l.taskId === taskId && l.milestoneId === milestone.id);
    
    if (existingLink) {
      if (existingLink.locked) return; // Prevent unlocking via simple toggle, need unlock action
      // Remove link
      onUpdateLinks(links.filter(l => l.id !== existingLink.id));
    } else {
      // Add link
      const newLink: MilestoneTaskLink = {
        id: `l-${Date.now()}`,
        milestoneId: milestone.id,
        taskId,
        source: "manual_add",
        locked: true,
        createdAt: new Date().toISOString()
      };
      onUpdateLinks([...links, newLink]);
    }
  };

  const handleToggleLock = (link: MilestoneTaskLink) => {
    const updated = { ...link, locked: !link.locked };
    onUpdateLinks(links.map(l => l.id === link.id ? updated : l));
  };

  const handleAddRule = () => {
    const newRule = {
      id: `r-${Date.now()}`,
      label: "New Scope Rule",
      active: true,
      filters: {}
    };
    onUpdateRules({
      ...rules,
      rules: [...(rules.rules || []), newRule]
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    onUpdateRules({
      ...rules,
      rules: rules.rules.filter(r => r.id !== ruleId)
    });
  };

  const handleUpdateRule = (ruleId: string, updates: any) => {
    onUpdateRules({
      ...rules,
      rules: rules.rules.map(r => r.id === ruleId ? { ...r, ...updates } : r)
    });
  };

  const getMatrixTasksForCell = useCallback((epicId: string, stageId: string) => {
    return tasks.filter(t => t.epicId === epicId && t.stageId === stageId);
  }, [tasks]);

  const getMatrixIncludedCount = useCallback((epicId: string, stageId: string) => {
    const cellTasks = getMatrixTasksForCell(epicId, stageId);
    return cellTasks.filter(t => 
      links.some(l => l.taskId === t.id && l.milestoneId === milestone.id)
    ).length;
  }, [getMatrixTasksForCell, links, milestone.id]);

  const isTaskLinkedToMilestone = useCallback((taskId: string) => {
    return links.some(l => l.taskId === taskId && l.milestoneId === milestone.id);
  }, [links, milestone.id]);

  const handleToggleCellTasks = useCallback((epicId: string, stageId: string) => {
    const cellTasks = tasks.filter(t => t.epicId === epicId && t.stageId === stageId);
    if (cellTasks.length === 0) return;

    const linkedCount = cellTasks.filter(t => 
      links.some(l => l.taskId === t.id && l.milestoneId === milestone.id)
    ).length;
    const isFullyIncluded = linkedCount === cellTasks.length;

    if (isFullyIncluded) {
      const taskIdsToRemove = cellTasks.map(t => t.id);
      onUpdateLinks(links.filter(l => 
        !(l.milestoneId === milestone.id && taskIdsToRemove.includes(l.taskId))
      ));
    } else {
      const existingLinks = links.filter(l => l.milestoneId === milestone.id);
      const newLinks = cellTasks
        .filter(t => !existingLinks.some(l => l.taskId === t.id))
        .map(t => ({
          id: `l-${Date.now()}-${t.id}`,
          milestoneId: milestone.id,
          taskId: t.id,
          source: "manual_add" as const,
          locked: true,
          createdAt: new Date().toISOString()
        }));
      onUpdateLinks([...links, ...newLinks]);
    }
  }, [tasks, links, milestone.id, onUpdateLinks]);

  return (
    <div className="space-y-6 mt-6">
      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
          <TabsTrigger 
            value="rules" 
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Rule-Based Scope
          </TabsTrigger>
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
        </TabsList>

        <div className="mt-6">
          <TabsContent value="rules" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Definition Rules</h3>
              <Button size="sm" variant="outline" onClick={handleAddRule} className="gap-2">
                <Plus className="h-4 w-4" /> Add Rule
              </Button>
            </div>
            
            <div className="space-y-3">
              {(rules.rules || []).length === 0 ? (
                 <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm bg-muted/10">
                   No rules defined. Add a rule to automatically include tasks in this milestone.
                 </div>
              ) : (
                rules.rules.map((rule) => (
                  <Card key={rule.id} className="relative overflow-hidden group">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                      <div className="flex-1 mr-4">
                         <Input 
                           value={rule.label} 
                           onChange={(e) => handleUpdateRule(rule.id, { label: e.target.value })}
                           className="h-8 font-medium border-transparent hover:border-input focus:border-input px-0"
                         />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={rule.active} onCheckedChange={(c) => handleUpdateRule(rule.id, { active: c })} />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteRule(rule.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 text-sm text-muted-foreground space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <Label className="text-xs">Task Type</Label>
                           <SearchableSelect 
                             value={rule.taskTemplateKey || "all"} 
                             onValueChange={(v) => handleUpdateRule(rule.id, { taskTemplateKey: v })}
                             className="h-8"
                             placeholder="Any Type"
                             options={[
                               { value: "all", label: "Any Type" },
                               { value: "backend", label: "Backend Task" },
                               { value: "frontend", label: "Frontend Task" },
                               { value: "design", label: "Design Task" }
                             ]}
                           />
                        </div>
                        <div className="space-y-1">
                           <Label className="text-xs">Stage</Label>
                           <SearchableSelect 
                             value={rule.stage || "all"} 
                             onValueChange={(v) => handleUpdateRule(rule.id, { stage: v })}
                             className="h-8"
                             placeholder="Any Stage"
                             options={[
                               { value: "all", label: "Any Stage" },
                               { value: "develop_solution", label: "Develop Solution" },
                               { value: "validate_blueprints", label: "Validate Blueprints" },
                               { value: "plan_strategy", label: "Plan Strategy" },
                               { value: "enable_users", label: "Enable Users" }
                             ]}
                           />
                        </div>
                        <div className="space-y-1">
                           <Label className="text-xs">Epic Type</Label>
                           <SearchableSelect 
                             value={rule.epicType || "all"} 
                             onValueChange={(v) => handleUpdateRule(rule.id, { epicType: v })}
                             className="h-8"
                             placeholder="Any Epic Type"
                             options={[
                               { value: "all", label: "Any Epic Type" },
                               { value: "use_case", label: "Use Case" },
                               { value: "technical", label: "Technical" }
                             ]}
                           />
                        </div>
                      </div>
                      <div className="bg-muted/30 p-2 rounded text-xs flex items-center gap-2 mt-2">
                         <ArrowRight className="h-3 w-3" />
                         <span>Matches roughly <strong>{Math.floor(Math.random() * 10)} tasks</strong> across <strong>{Math.floor(Math.random() * 3)} epics</strong></span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="flex gap-2">
               <div className="relative flex-1">
                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                 <Input 
                   placeholder="Search tasks to add..." 
                   className="pl-9"
                   value={manualSearch}
                   onChange={e => setManualSearch(e.target.value)}
                 />
               </div>
               <Button variant="outline"><Filter className="h-4 w-4 mr-2" /> Filter</Button>
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
                  {filteredTasks.map(task => {
                    const link = links.find(l => l.taskId === task.id && l.milestoneId === milestone.id);
                    const isLinked = !!link;
                    const epic = epics.find(e => e.id === task.epicId);

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
            </div>
          </TabsContent>

          <TabsContent value="matrix" className="space-y-4">
             <div className="border rounded-md overflow-hidden">
               <div className="bg-muted/30 p-4 border-b">
                 <h4 className="font-medium text-sm">Coverage Matrix</h4>
                 <p className="text-xs text-muted-foreground">Click on cells to toggle task inclusion. Hover to see task details.</p>
               </div>
               <CoverageMatrix
                 rows={epics}
                 columns={TASK_STAGES}
                 tasks={tasks}
                 rowLabel="Epic"
                 getTasksForCell={getMatrixTasksForCell}
                 getIncludedCount={getMatrixIncludedCount}
                 isTaskIncluded={isTaskLinkedToMilestone}
                 onCellClick={handleToggleCellTasks}
                 showRowDescription={true}
                 displayStyle="circle"
                 emptyRowsMessage="No epics found in this project."
                 emptyColumnsMessage="No stages found."
                 cellTestIdPrefix="cell-milestone"
               />
             </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function MilestoneDetailPanel({ 
  milestone, 
  onSave, 
  tasks,
  epics,
  team,
  projectId,
  scopeRules,
  taskLinks,
  onUpdateScopeRules,
  onUpdateTaskLinks,
  onCreateTask,
  onUpdateTask
}: { 
  milestone: Milestone, 
  onSave: (m: Milestone) => void,
  tasks: Task[],
  epics: Epic[],
  team: any[],
  projectId: string,
  scopeRules: MilestoneScopeRules,
  taskLinks: MilestoneTaskLink[],
  onUpdateScopeRules: (rules: MilestoneScopeRules) => void,
  onUpdateTaskLinks: (links: MilestoneTaskLink[]) => void,
  onCreateTask: (task: Partial<Task>) => void,
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void
}) {
  const [formData, setFormData] = useState<Milestone>({ ...milestone });
  const [isDirty, setIsDirty] = useState(false);

  // Update local state when prop changes (selection change)
  useMemo(() => {
    setFormData({ ...milestone });
    setIsDirty(false);
  }, [milestone.id]);

  const handleChange = (field: keyof Milestone, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    onSave(formData);
    setIsDirty(false);
  };

  const status = STATUS_CONFIG[formData.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.planned;
  const phase = PHASES.find(p => p.id === formData.phase) || PHASES[0];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header Section */}
      <div className="p-6 border-b space-y-6">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1 flex-1">
             <div className="flex items-center gap-2 mb-2">
               <Badge variant="outline" className={cn("font-normal", phase.color)}>
                 {phase.label}
               </Badge>
               <Badge variant="outline" className={cn("font-normal border-transparent", status.color, "bg-opacity-10")}>
                 {status.label}
               </Badge>
             </div>
             <Input 
               value={formData.name} 
               onChange={e => handleChange('name', e.target.value)}
               className="text-2xl font-bold border-transparent px-0 hover:border-input focus:border-input h-auto py-1 shadow-none"
             />
             <Input 
               value={formData.description} 
               onChange={e => handleChange('description', e.target.value)}
               className="text-muted-foreground border-transparent px-0 hover:border-input focus:border-input shadow-none h-auto py-1"
               placeholder="Add a description..."
             />
          </div>
          <div className="flex flex-col gap-2 items-end">
             <Button onClick={handleSave} disabled={!isDirty}>
               {isDirty ? "Save Changes" : "Saved"}
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Target Date</Label>
            <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-card">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <input 
                type="date" 
                value={formData.targetDate}
                onChange={e => handleChange('targetDate', e.target.value)}
                className="bg-transparent text-sm focus:outline-none w-full"
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Owner</Label>
            <SearchableSelect 
              value={formData.ownerId} 
              onValueChange={v => handleChange('ownerId', v)}
              triggerClassName="bg-card"
              options={team.map(t => ({ value: t.id, label: t.name }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <SearchableSelect 
              value={formData.status} 
              onValueChange={v => handleChange('status', v)}
              triggerClassName="bg-card"
              options={Object.entries(STATUS_CONFIG).slice(0, 5).map(([key, conf]) => ({ value: key, label: conf.label }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Phase</Label>
            <SearchableSelect 
              value={formData.phase} 
              onValueChange={v => handleChange('phase', v)}
              triggerClassName="bg-card"
              options={PHASES.map(p => ({ value: p.id, label: p.label }))}
            />
          </div>
        </div>
        
        <div className="pt-2">
            <div className="h-10 flex flex-col justify-center gap-1.5">
              <div className="flex justify-between text-xs">
                <span>{formData.progress?.completedTasks || 0}/{formData.progress?.totalTasks || 0} tasks completed</span>
                <span className="font-medium">{formData.progress?.percentComplete || 0}%</span>
              </div>
              <Progress value={formData.progress?.percentComplete || 0} className="h-2" />
            </div>
        </div>
      </div>

      {/* Main Content Tabs: Active Tasks vs Scope Definition */}
      <div className="flex-1 overflow-auto bg-muted/5 p-6">
         <div className="w-full">
            <Tabs defaultValue="tasks" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="tasks" className="gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Active Tasks
                </TabsTrigger>
                <TabsTrigger value="scope" className="gap-2">
                  <Target className="h-4 w-4" />
                  Scope Definition
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tasks">
                <ActiveTasksList 
                  milestone={formData}
                  tasks={tasks}
                  links={taskLinks}
                  epics={epics}
                  team={team}
                  projectId={projectId}
                  onCreateTask={onCreateTask}
                  onUpdateTask={onUpdateTask}
                />
              </TabsContent>

              <TabsContent value="scope">
                <ScopeBuilder 
                   milestone={formData}
                   tasks={tasks}
                   epics={epics}
                   links={taskLinks}
                   rules={scopeRules}
                   onUpdateLinks={onUpdateTaskLinks}
                   onUpdateRules={onUpdateScopeRules}
                />
              </TabsContent>
            </Tabs>
         </div>
      </div>
    </div>
  );
}

// --- Main Page Component ---

export default function MilestonesManagementPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/projects/:projectId/milestones");
  const projectId = params?.projectId || "1";

  // Database Hooks
  const { data: project, isLoading: isProjectLoading } = useProject(projectId);
  const { data: allMilestones, isLoading: isMilestonesLoading, createAsync: createMilestoneAsync, update: updateMilestone, remove: deleteMilestone } = useMilestones();
  const { data: allTasks, isLoading: isTasksLoading, createAsync: createTaskAsync, update: updateTask } = useTasks();
  const { data: allEpics, isLoading: isEpicsLoading } = useEpics();
  const { data: users, isLoading: isUsersLoading } = useUsers();
  const { data: allScopeRules, create: createScopeRule, update: updateScopeRule } = useMilestoneScopeRules();
  const { data: allTaskLinks, create: createTaskLink, createAsync: createTaskLinkAsync, remove: deleteTaskLink } = useMilestoneTaskLinks();
  const { isTaskComplete } = useCompletedStatuses();

  // Filter data by project
  const milestones = useMemo(() => 
    (allMilestones || []).filter((m: any) => m.projectId === projectId) as Milestone[],
    [allMilestones, projectId]
  );

  const tasks = useMemo(() => 
    (allTasks || []).filter((t: any) => t.projectId === projectId) as Task[],
    [allTasks, projectId]
  );

  const epics = useMemo(() => (allEpics || []) as Epic[], [allEpics]);
  const team = useMemo(() => (users || []) as any[], [users]);

  // Local UI State
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Select first milestone when data loads
  useEffect(() => {
    if (milestones.length > 0 && !selectedId) {
      setSelectedId(milestones[0].id);
    }
  }, [milestones, selectedId]);

  const selectedMilestone = useMemo(() => 
    milestones.find(m => m.id === selectedId), 
    [milestones, selectedId]
  );

  const scopeRules = useMemo(() => 
    (allScopeRules || []).filter((r: any) => r.milestoneId === selectedId),
    [allScopeRules, selectedId]
  );

  const selectedRules = useMemo(() => 
    scopeRules[0] || { milestoneId: selectedId!, rules: [] },
    [scopeRules, selectedId]
  );

  const taskLinks = useMemo(() => 
    (allTaskLinks || []).filter((l: any) => l.milestoneId === selectedId) as MilestoneTaskLink[],
    [allTaskLinks, selectedId]
  );

  // Calculate milestone progress from linked tasks
  const milestonesWithProgress = useMemo(() => {
    return milestones.map(m => {
      const links = (allTaskLinks || []).filter((l: any) => l.milestoneId === m.id);
      const linkedTasks = links.map((l: any) => tasks.find(t => t.id === l.taskId)).filter(Boolean);
      const totalTasks = linkedTasks.length;
      const completedTasks = linkedTasks.filter((t: any) => isTaskComplete(t?.status)).length;
      const percentComplete = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      return {
        ...m,
        progress: { totalTasks, completedTasks, percentComplete },
        progressPercent: percentComplete
      };
    });
  }, [milestones, allTaskLinks, tasks]);

  // Loading state
  const isLoading = isProjectLoading || isMilestonesLoading || isTasksLoading || isEpicsLoading || isUsersLoading;

  if (isLoading) {
    return (
      <Shell>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  // Handlers
  const handleCreateMilestone = async () => {
    try {
      const newMilestone = await createMilestoneAsync({
        projectId: projectId,
        name: "New Milestone",
        description: "",
        phase: "plan_strategy",
        targetDate: new Date().toISOString().split('T')[0],
        status: "planned",
        ownerId: team[0]?.id || "1",
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

  const handleDelete = (id: string) => {
    deleteMilestone(id);
    if (selectedId === id) setSelectedId(null);
    toast({ title: "Milestone Deleted" });
  };

  const handleUpdateMilestone = (updated: Milestone) => {
    updateMilestone({ id: updated.id, updates: updated });
    toast({ title: "Milestone Updated" });
  };

  const handleUpdateRules = (updatedRules: MilestoneScopeRules) => {
    const existing = scopeRules.find((r: any) => r.milestoneId === updatedRules.milestoneId);
    if (existing) {
      updateScopeRule({ id: existing.id, updates: { rules: updatedRules.rules } });
    } else {
      createScopeRule({
        id: `sr-${Date.now()}`,
        milestoneId: updatedRules.milestoneId,
        rules: updatedRules.rules
      });
    }
    toast({ title: "Scope Rules Updated", description: "Milestone scope has been recalculated." });
  };

  const handleUpdateLinks = (updatedLinks: MilestoneTaskLink[]) => {
    // For simplicity, we'll handle link changes one at a time
    // In a real app you might want batch operations
    const currentLinkIds = taskLinks.map(l => l.id);
    const newLinkIds = updatedLinks.map(l => l.id);
    
    // Delete removed links
    currentLinkIds.forEach(id => {
      if (!newLinkIds.includes(id)) {
        deleteTaskLink(id);
      }
    });
    
    // Add new links
    updatedLinks.forEach(link => {
      if (!currentLinkIds.includes(link.id)) {
        createTaskLink({
          id: link.id,
          milestoneId: link.milestoneId,
          taskId: link.taskId,
          projectId: projectId,
          source: link.source,
          locked: link.locked || false
        });
      }
    });

    // Update milestone progress
    if (selectedMilestone) {
      const total = updatedLinks.length;
      const completed = updatedLinks.filter(l => {
         const t = tasks.find(task => task.id === l.taskId);
         return isTaskComplete(t?.status);
      }).length;
      
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

      updateMilestone({
        id: selectedMilestone.id,
        updates: {
          progressTotalTasks: total,
          progressCompletedTasks: completed,
          progressPercentComplete: percent,
          progressPercent: percent
        }
      });
    }
  };

  const handleCreateTask = async (taskData: Partial<Task>) => {
    try {
      const createdTask = await createTaskAsync({
        title: taskData.title || "New Task",
        description: taskData.description || "",
        project: project?.name || "Project",
        projectId: projectId,
        stageId: taskData.stageId,
        epicId: taskData.epicId,
        status: taskData.status || "Todo",
        assigneeId: taskData.assigneeId || null,
        deadline: new Date().toISOString().split('T')[0],
        priority: "Medium",
        estimateHours: 0,
        effort: 1,
        tags: []
      });

      if (selectedId && createdTask?.id) {
        const newLinkId = `l-${Date.now()}`;
        await createTaskLinkAsync({
          id: newLinkId,
          milestoneId: selectedId,
          taskId: createdTask.id,
          projectId: projectId,
          source: "manual_add",
          locked: true
        });
      }
      toast({ title: "Task Created", description: "Task added to project and milestone." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create task.", variant: "destructive" });
    }
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    updateTask({ id: taskId, updates });
    toast({ title: "Task Updated" });
  };

  return (
    <Shell>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
        <MilestoneListPanel 
          milestones={milestonesWithProgress}
          selectedId={selectedId || undefined}
          onSelect={setSelectedId}
          onCreate={handleCreateMilestone}
          onDelete={handleDelete}
        />
        
        <div className="flex-1 flex flex-col min-w-0">
          {selectedMilestone ? (
            <MilestoneDetailPanel 
              milestone={selectedMilestone}
              onSave={handleUpdateMilestone}
              tasks={tasks}
              epics={epics}
              team={team}
              projectId={projectId}
              scopeRules={selectedRules}
              taskLinks={taskLinks}
              onUpdateScopeRules={handleUpdateRules}
              onUpdateTaskLinks={handleUpdateLinks}
              onCreateTask={handleCreateTask}
              onUpdateTask={handleUpdateTask}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <div className="bg-muted/30 p-6 rounded-full mb-4">
                <Target className="h-12 w-12 opacity-50" />
              </div>
              <h3 className="text-lg font-medium text-foreground">No Milestone Selected</h3>
              <p className="max-w-xs text-center mt-2">Select a milestone from the list or create a new one to get started.</p>
              <Button onClick={handleCreateMilestone} className="mt-6">Create Milestone</Button>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}