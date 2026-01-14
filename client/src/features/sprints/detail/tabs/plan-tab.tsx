import { useState, useMemo, useCallback } from "react";
import { 
  Target,
  Plus,
  Pencil,
  X,
  Trash2,
  ListTodo,
  SlidersHorizontal,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ExternalLink,
  Calendar as CalendarIcon,
  Clock,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { SprintStats, ScopeRule } from "../types";

interface PlanTabProps {
  projectId: string;
  sprintId: string;
  sprint: any;
  sprintTasks: any[];
  projectTasks: any[];
  projectEpics: any[];
  projectMilestones: any[];
  projectStages: any[];
  sprintTaskIds: string[];
  stats: SprintStats;
  users: any[];
  formattedStatusOptions: any[];
  taskTypes: any[];
  isReadOnly: boolean;
  getUser: (id?: string) => any;
  getEpic: (id?: string) => any;
  updateTask: (params: { id: string; updates: any }) => void;
  onRemoveTask: (taskId: string) => void;
  onShowAddTasks: () => void;
}

const TASK_STATUS_CONFIG: Record<string, { icon: typeof Circle; color: string; bgColor: string }> = {
  "Pending": { icon: Circle, color: "text-slate-500", bgColor: "bg-slate-100" },
  "To Do": { icon: Circle, color: "text-slate-500", bgColor: "bg-slate-100" },
  "In Progress": { icon: Clock, color: "text-blue-500", bgColor: "bg-blue-100" },
  "Done": { icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-100" },
  "Completed": { icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-100" },
};

export function PlanTab({
  projectId,
  sprintId,
  sprint,
  sprintTasks,
  projectTasks,
  projectEpics,
  projectMilestones,
  projectStages,
  sprintTaskIds,
  stats,
  users,
  formattedStatusOptions,
  taskTypes,
  isReadOnly,
  getUser,
  getEpic,
  updateTask,
  onRemoveTask,
  onShowAddTasks,
}: PlanTabProps) {
  const [planSubTab, setPlanSubTab] = useState<"tasks" | "scope" | "details">("tasks");
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<"title" | "effort" | null>(null);
  const [scopeDefSubTab, setScopeDefSubTab] = useState<"manual" | "matrix" | "rules">("rules");
  const [manualScopeSearch, setManualScopeSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [epicFilter, setEpicFilter] = useState<string>("all");
  const [milestoneFilter, setMilestoneFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [taskTypeFilter, setTaskTypeFilter] = useState<string>("all");
  const [showIncludedOnly, setShowIncludedOnly] = useState<boolean | null>(null);
  const [matrixAxis, setMatrixAxis] = useState<"epics" | "milestones">("epics");
  const [sprintScopeRules, setSprintScopeRules] = useState<ScopeRule[]>([]);
  const [expandedRules, setExpandedRules] = useState<Record<string, boolean>>({});

  const isDeadlineOutsideSprint = useCallback((taskDeadline?: string) => {
    if (!taskDeadline || !sprint) return false;
    const deadline = new Date(taskDeadline);
    const sprintStart = sprint.startDate ? new Date(sprint.startDate) : null;
    const sprintEnd = sprint.endDate ? new Date(sprint.endDate) : null;
    
    if (sprintStart && deadline < sprintStart) return true;
    if (sprintEnd && deadline > sprintEnd) return true;
    return false;
  }, [sprint]);

  const filteredManualTasks = useMemo(() => {
    return projectTasks.filter(t => {
      const epic = projectEpics.find((e: any) => e.id === t.epicId);
      const epicName = epic?.title || "";
      const milestone = projectMilestones.find((m: any) => m.id === t.milestoneId);
      const milestoneName = milestone?.title || milestone?.name || "";
      const searchLower = manualScopeSearch.toLowerCase();
      const matchesSearch = !manualScopeSearch || 
        t.title?.toLowerCase().includes(searchLower) || 
        epicName.toLowerCase().includes(searchLower) ||
        milestoneName.toLowerCase().includes(searchLower);
      
      const matchesStage = stageFilter === "all" || t.stageId === stageFilter;
      const matchesEpic = epicFilter === "all" || t.epicId === epicFilter;
      const matchesMilestone = milestoneFilter === "all" || t.milestoneId === milestoneFilter;
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      const matchesTaskType = taskTypeFilter === "all" || t.taskTypeId === taskTypeFilter;
      
      const isInSprint = sprintTaskIds.includes(t.id);
      const matchesIncludedFilter = showIncludedOnly === null || 
        (showIncludedOnly === true && isInSprint) || 
        (showIncludedOnly === false && !isInSprint);
      
      return matchesSearch && matchesStage && matchesEpic && matchesMilestone && matchesStatus && matchesTaskType && matchesIncludedFilter;
    });
  }, [projectTasks, projectEpics, projectMilestones, manualScopeSearch, stageFilter, epicFilter, milestoneFilter, statusFilter, taskTypeFilter, showIncludedOnly, sprintTaskIds]);

  const handleToggleTaskInSprint = async (taskId: string) => {
    const isInSprint = sprintTaskIds.includes(taskId);
    const task = projectTasks.find((t: any) => t.id === taskId);
    
    if (isInSprint) {
      updateTask({ id: taskId, updates: { sprintId: null } });
    } else {
      const updates: any = { sprintId };
      if (!task?.deadline && sprint?.endDate) {
        updates.deadline = sprint.endDate;
      }
      updateTask({ id: taskId, updates });
    }
  };

  const getCellTaskCounts = (rowId: string, stageId: string, axis: "epics" | "milestones" = "epics") => {
    const cellTasks = projectTasks.filter((t: any) => {
      if (axis === "epics") {
        return t.epicId === rowId && t.stageId === stageId;
      } else {
        return t.milestoneId === rowId && t.stageId === stageId;
      }
    });
    const inSprint = cellTasks.filter((t: any) => sprintTaskIds.includes(t.id)).length;
    return { total: cellTasks.length, inSprint };
  };

  const handleToggleCellTasksGeneric = (rowId: string, stageId: string, axis: "epics" | "milestones") => {
    const cellTasks = projectTasks.filter((t: any) => {
      if (axis === "epics") {
        return t.epicId === rowId && t.stageId === stageId;
      } else {
        return t.milestoneId === rowId && t.stageId === stageId;
      }
    });
    if (cellTasks.length === 0) return;

    const unlinkedTasks = cellTasks.filter((t: any) => !sprintTaskIds.includes(t.id));
    
    if (unlinkedTasks.length > 0) {
      unlinkedTasks.forEach((t: any) => {
        updateTask({ id: t.id, updates: { sprintId } });
      });
    } else {
      cellTasks.forEach((t: any) => {
        updateTask({ id: t.id, updates: { sprintId: null } });
      });
    }
  };

  const evaluateRule = useCallback((rule: ScopeRule): any[] => {
    if (!rule.active) return [];
    
    return projectTasks.filter(task => {
      if (rule.stage && rule.stage !== "all" && task.stageId !== rule.stage) {
        return false;
      }
      if (rule.milestone && rule.milestone !== "all" && task.milestoneId !== rule.milestone) {
        return false;
      }
      const epic = projectEpics.find((e: any) => e.id === task.epicId);
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
  }, [projectTasks, projectEpics]);

  const allMatchedTasksByRule = useMemo(() => {
    const result: Record<string, any[]> = {};
    sprintScopeRules.forEach((rule) => {
      result[rule.id] = evaluateRule(rule);
    });
    return result;
  }, [sprintScopeRules, evaluateRule]);

  const allMatchedTasks = useMemo(() => {
    const taskSet = new Set<string>();
    Object.values(allMatchedTasksByRule).forEach((matchedTasks: any[]) => {
      matchedTasks.forEach(t => taskSet.add(t.id));
    });
    return projectTasks.filter(t => taskSet.has(t.id));
  }, [allMatchedTasksByRule, projectTasks]);

  const pendingRuleTasks = useMemo(() => {
    return allMatchedTasks.filter(t => !sprintTaskIds.includes(t.id));
  }, [allMatchedTasks, sprintTaskIds]);

  const alreadyInSprintFromRules = useMemo(() => {
    return allMatchedTasks.filter(t => sprintTaskIds.includes(t.id));
  }, [allMatchedTasks, sprintTaskIds]);

  const handleAddRule = () => {
    const newRule: ScopeRule = {
      id: `r-${Date.now()}`,
      label: "New Scope Rule",
      active: true,
      stage: "all",
      milestone: "all",
      epicType: "all",
      taskTemplateKey: "all"
    };
    setSprintScopeRules([...sprintScopeRules, newRule]);
    setExpandedRules(prev => ({ ...prev, [newRule.id]: true }));
  };

  const handleDeleteRule = (ruleId: string) => {
    setSprintScopeRules(sprintScopeRules.filter((r) => r.id !== ruleId));
  };

  const handleUpdateRule = (ruleId: string, updates: Partial<ScopeRule>) => {
    setSprintScopeRules(sprintScopeRules.map((r) => r.id === ruleId ? { ...r, ...updates } : r));
  };

  const handleApplyRules = () => {
    if (pendingRuleTasks.length === 0) return;
    pendingRuleTasks.forEach(t => {
      updateTask({ id: t.id, updates: { sprintId } });
    });
  };

  return (
    <Tabs value={planSubTab} onValueChange={(v) => setPlanSubTab(v as "tasks" | "scope" | "details")} className="w-full">
      <TabsList className="grid w-full grid-cols-3 max-w-lg mb-6">
        <TabsTrigger value="tasks" className="gap-2" data-testid="subtab-tasks">
          <ListTodo className="h-4 w-4" />
          Tasks
        </TabsTrigger>
        <TabsTrigger value="scope" className="gap-2" data-testid="subtab-scope">
          <SlidersHorizontal className="h-4 w-4" />
          Scope Definition
        </TabsTrigger>
        <TabsTrigger value="details" className="gap-2" data-testid="subtab-details">
          <FileText className="h-4 w-4" />
          Details
        </TabsTrigger>
      </TabsList>

      <TabsContent value="tasks" className="mt-0">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle className="text-base">Sprint Backlog</CardTitle>
                {selectedTaskIds.size > 0 && !isReadOnly && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{selectedTaskIds.size} selected</Badge>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setSelectedTaskIds(new Set())}
                      data-testid="button-clear-selection"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              {!isReadOnly && (
                <Button size="sm" onClick={onShowAddTasks} data-testid="button-add-tasks">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Tasks
                </Button>
              )}
            </div>
            <CardDescription>
              {stats.total} tasks committed, {stats.totalEffort} story points
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sprintTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2" />
                <p>No tasks in this sprint yet.</p>
                {!isReadOnly && (
                  <Button variant="link" onClick={onShowAddTasks}>
                    Add tasks from backlog
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {!isReadOnly && (
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={sprintTasks.length > 0 && selectedTaskIds.size === sprintTasks.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTaskIds(new Set(sprintTasks.map((t: any) => t.id)));
                            } else {
                              setSelectedTaskIds(new Set());
                            }
                          }}
                          data-testid="checkbox-select-all"
                        />
                      </TableHead>
                    )}
                    <TableHead className="w-[30%]">Task</TableHead>
                    <TableHead>Epic</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Effort</TableHead>
                    <TableHead>Assignee</TableHead>
                    {!isReadOnly && <TableHead className="w-[80px]"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sprintTasks.map((task: any) => {
                    const taskStatus = TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG["Pending"];
                    const TaskStatusIcon = taskStatus.icon;
                    const assignee = getUser(task.assigneeId || task.assignee);
                    const epic = getEpic(task.epicId);

                    return (
                      <TableRow key={task.id} data-testid={`row-task-${task.id}`} className={cn(selectedTaskIds.has(task.id) && "bg-muted/50")}>
                        {!isReadOnly && (
                          <TableCell>
                            <Checkbox
                              checked={selectedTaskIds.has(task.id)}
                              onCheckedChange={(checked) => {
                                setSelectedTaskIds(prev => {
                                  const newSet = new Set(prev);
                                  if (checked) {
                                    newSet.add(task.id);
                                  } else {
                                    newSet.delete(task.id);
                                  }
                                  return newSet;
                                });
                              }}
                              data-testid={`checkbox-task-${task.id}`}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          {!isReadOnly && editingTaskId === task.id && editingField === "title" ? (
                            <Input
                              autoFocus
                              defaultValue={task.title || task.name}
                              className="h-8"
                              onBlur={(e) => {
                                if (e.target.value !== (task.title || task.name)) {
                                  updateTask({ id: task.id, updates: { title: e.target.value } });
                                }
                                setEditingTaskId(null);
                                setEditingField(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.currentTarget.blur();
                                } else if (e.key === "Escape") {
                                  setEditingTaskId(null);
                                  setEditingField(null);
                                }
                              }}
                              data-testid={`input-task-title-${task.id}`}
                            />
                          ) : (
                            <div 
                              className={cn("font-medium", !isReadOnly && "cursor-pointer hover:text-primary")}
                              onClick={() => !isReadOnly && (setEditingTaskId(task.id), setEditingField("title"))}
                            >
                              {task.title || task.name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {epic ? (
                            <Link href={`/projects/${projectId}/epics/${epic.id}`}>
                              <Badge variant="outline" className="font-normal hover:bg-muted cursor-pointer">
                                {epic.title || epic.name}
                              </Badge>
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const stage = projectStages.find((s: any) => s.id === task.stageId);
                            return stage ? (
                              <Badge variant="outline" className="font-normal">
                                {stage.name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(taskStatus.bgColor, taskStatus.color, "border-0")}>
                            <TaskStatusIcon className="h-3 w-3 mr-1" />
                            {task.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!isReadOnly && editingTaskId === task.id && editingField === "effort" ? (
                            <Input
                              autoFocus
                              type="number"
                              defaultValue={task.effort || ""}
                              className="h-8 w-16"
                              onBlur={(e) => {
                                const newValue = e.target.value ? parseInt(e.target.value) : null;
                                if (newValue !== task.effort) {
                                  updateTask({ id: task.id, updates: { effort: newValue } });
                                }
                                setEditingTaskId(null);
                                setEditingField(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.currentTarget.blur();
                                } else if (e.key === "Escape") {
                                  setEditingTaskId(null);
                                  setEditingField(null);
                                }
                              }}
                              data-testid={`input-task-effort-${task.id}`}
                            />
                          ) : (
                            <span 
                              className={cn("text-sm", !isReadOnly && "cursor-pointer hover:text-primary")}
                              onClick={() => !isReadOnly && (setEditingTaskId(task.id), setEditingField("effort"))}
                            >
                              {task.effort || "-"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {assignee ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {assignee.name?.charAt(0) || assignee.username?.charAt(0) || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{assignee.name || assignee.username}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        {!isReadOnly && (
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Link href={`/projects/${projectId}/tasks/${task.id}`}>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-7 w-7"
                                  data-testid={`button-view-task-${task.id}`}
                                >
                                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                              </Link>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => onRemoveTask(task.id)}
                                data-testid={`button-remove-task-${task.id}`}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="scope" className="mt-0">
        <Tabs value={scopeDefSubTab} onValueChange={(v) => setScopeDefSubTab(v as "manual" | "matrix" | "rules")} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="rules">Rule-Based</TabsTrigger>
            <TabsTrigger value="manual">Manual Adjustments</TabsTrigger>
            <TabsTrigger value="matrix">Coverage Matrix</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium">Definition Rules</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Define criteria to automatically include tasks in this sprint
                </p>
              </div>
              <div className="flex gap-2">
                {pendingRuleTasks.length > 0 && (
                  <Button 
                    size="sm" 
                    onClick={handleApplyRules}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                    data-testid="button-apply-rules"
                  >
                    <Zap className="h-4 w-4" /> 
                    Apply Rules ({pendingRuleTasks.length} tasks)
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={handleAddRule} className="gap-2" data-testid="button-add-rule">
                  <Plus className="h-4 w-4" /> Add Rule
                </Button>
              </div>
            </div>

            {pendingRuleTasks.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">
                    {pendingRuleTasks.length} task{pendingRuleTasks.length !== 1 ? 's' : ''} matched but not yet applied
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Click "Apply Rules" to add these tasks to the sprint.
                  </p>
                </div>
              </div>
            )}

            {alreadyInSprintFromRules.length > 0 && pendingRuleTasks.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">
                    All matched tasks are in sprint
                  </p>
                  <p className="text-xs text-green-700 mt-0.5">
                    {alreadyInSprintFromRules.length} task{alreadyInSprintFromRules.length !== 1 ? 's' : ''} from rules are included in this sprint.
                  </p>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              {sprintScopeRules.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm bg-muted/10">
                  No rules defined. Add a rule to automatically include tasks in this sprint.
                </div>
              ) : (
                sprintScopeRules.map((rule) => {
                  const matchedTasks = allMatchedTasksByRule[rule.id] || [];
                  const inSprintCount = matchedTasks.filter(t => sprintTaskIds.includes(t.id)).length;
                  const isExpanded = expandedRules[rule.id] || false;
                  
                  return (
                    <Card key={rule.id} className={cn("relative overflow-hidden transition-all", !rule.active && "opacity-60")}>
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
                          <Badge variant="secondary" className="text-xs">
                            {matchedTasks.length} matched, {inSprintCount} in sprint
                          </Badge>
                          <Switch 
                            checked={rule.active} 
                            onCheckedChange={(c) => handleUpdateRule(rule.id, { active: c })} 
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
                        <div className="grid grid-cols-4 gap-4">
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
                                ...projectStages.map((stage: any) => ({ value: stage.id, label: stage.label || stage.name }))
                              ]}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Milestone</Label>
                            <SearchableSelect 
                              value={rule.milestone || "all"} 
                              onValueChange={(v) => handleUpdateRule(rule.id, { milestone: v })}
                              className="h-8"
                              data-testid={`select-rule-milestone-${rule.id}`}
                              placeholder="Any Milestone"
                              options={[
                                { value: "all", label: "Any Milestone" },
                                ...projectMilestones.map((ms: any) => ({ value: ms.id, label: ms.title || ms.name }))
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
                                { value: "feature", label: "Feature" },
                                { value: "initiative", label: "Initiative" },
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
                              placeholder="Any Task Type"
                              options={[
                                { value: "all", label: "Any Task Type" },
                                ...(taskTypes || []).map((tt: any) => ({ value: tt.name, label: tt.name }))
                              ]}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="flex flex-wrap gap-4 mb-4">
              <Input 
                placeholder="Search tasks..." 
                value={manualScopeSearch}
                onChange={(e) => setManualScopeSearch(e.target.value)}
                className="w-64"
              />
              <SearchableSelect
                value={stageFilter}
                onValueChange={setStageFilter}
                placeholder="Filter by stage"
                className="w-40"
                options={[
                  { value: "all", label: "All Stages" },
                  ...projectStages.map((s: any) => ({ value: s.id, label: s.label || s.name }))
                ]}
              />
              <SearchableSelect
                value={epicFilter}
                onValueChange={setEpicFilter}
                placeholder="Filter by epic"
                className="w-40"
                options={[
                  { value: "all", label: "All Epics" },
                  ...projectEpics.map((e: any) => ({ value: e.id, label: e.title || e.name }))
                ]}
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">In Sprint</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Epic</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredManualTasks.slice(0, 20).map((task: any) => {
                  const isInSprint = sprintTaskIds.includes(task.id);
                  const epic = projectEpics.find((e: any) => e.id === task.epicId);
                  const stage = projectStages.find((s: any) => s.id === task.stageId);
                  return (
                    <TableRow key={task.id}>
                      <TableCell>
                        <Checkbox
                          checked={isInSprint}
                          onCheckedChange={() => handleToggleTaskInSprint(task.id)}
                          data-testid={`checkbox-manual-task-${task.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{epic?.title || "-"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{stage?.label || stage?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{task.status}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {filteredManualTasks.length > 20 && (
              <p className="text-center text-xs text-muted-foreground">Showing 20 of {filteredManualTasks.length} tasks</p>
            )}
          </TabsContent>

          <TabsContent value="matrix" className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <Label>View by:</Label>
              <SearchableSelect
                value={matrixAxis}
                onValueChange={(v) => setMatrixAxis(v as "epics" | "milestones")}
                className="w-40"
                options={[
                  { value: "epics", label: "Epics" },
                  { value: "milestones", label: "Milestones" }
                ]}
              />
            </div>
            <div className="border rounded-md overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/10">
                    <th className="p-3 text-left font-medium min-w-[200px]">
                      {matrixAxis === "epics" ? "Epic" : "Milestone"}
                    </th>
                    {projectStages.map((stage: any) => (
                      <th key={stage.id} className="p-3 text-center font-medium border-l min-w-[100px]">
                        {stage.label || stage.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(matrixAxis === "epics" ? projectEpics : projectMilestones).map((item: any) => (
                    <tr key={item.id} className="border-b hover:bg-muted/5">
                      <td className="p-3 font-medium">{item.title || item.name}</td>
                      {projectStages.map((stage: any) => {
                        const counts = getCellTaskCounts(item.id, stage.id, matrixAxis);
                        const allInSprint = counts.total > 0 && counts.inSprint === counts.total;
                        const someInSprint = counts.inSprint > 0 && counts.inSprint < counts.total;
                        
                        return (
                          <td 
                            key={stage.id} 
                            className={cn(
                              "p-3 text-center border-l cursor-pointer transition-colors",
                              counts.total === 0 && "bg-muted/10",
                              allInSprint && "bg-green-50",
                              someInSprint && "bg-amber-50"
                            )}
                            onClick={() => handleToggleCellTasksGeneric(item.id, stage.id, matrixAxis)}
                          >
                            {counts.total > 0 ? (
                              <span className={cn(
                                "text-sm font-medium",
                                allInSprint && "text-green-700",
                                someInSprint && "text-amber-700"
                              )}>
                                {counts.inSprint}/{counts.total}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/30">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </TabsContent>

      <TabsContent value="details" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sprint Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Sprint configuration and metadata.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
