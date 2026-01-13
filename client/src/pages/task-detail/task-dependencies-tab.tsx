import { useState, useMemo, useCallback, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Search, 
  Plus, 
  X, 
  Link2, 
  Link2Off, 
  Zap, 
  Trash2,
  ChevronDown,
  Lock,
  Unlock,
  Layers,
  ListTodo,
  SlidersHorizontal,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useTaskDependencyScopeRules, useEpicTypes, useTaskTypes } from "@/hooks/use-nexus-data";

interface TaskDependenciesTabProps {
  task: any;
  projectId: string;
  allTasks: any[];
  stages: any[];
  allEpics: any[];
  milestones: any[];
  dependsOn: any[];
  dependents: any[];
  addDependency: (taskId: string, source?: string) => void;
  removeDependency: (depId: string) => void;
  updateDependency?: (depId: string, updates: { source?: string; locked?: boolean }) => void;
}

interface DependencyRule {
  id: string;
  label: string;
  active: boolean;
  stage: string;
  epicType: string;
  taskTemplateKey: string;
}

interface DependencyScopeRules {
  taskId: string;
  rules: DependencyRule[];
}

export function TaskDependenciesTab({
  task,
  projectId,
  allTasks = [],
  stages = [],
  allEpics = [],
  milestones = [],
  dependsOn = [],
  dependents = [],
  addDependency,
  removeDependency,
  updateDependency,
}: TaskDependenciesTabProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"rules" | "matrix" | "manual">("rules");
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [epicFilter, setEpicFilter] = useState<string>("all");
  const [showLinkedOnly, setShowLinkedOnly] = useState<boolean | null>(null);
  const [expandedRules, setExpandedRules] = useState<Record<string, boolean>>({});

  const { data: allScopeRules, create: createScopeRule, update: updateScopeRule } = useTaskDependencyScopeRules();
  const { data: allEpicTypes } = useEpicTypes();
  const { data: allTaskTypes } = useTaskTypes();

  const scopeRules = useMemo(() => 
    (allScopeRules || []).filter((r: any) => r.taskId === task.id),
    [allScopeRules, task.id]
  );

  const selectedRules: DependencyScopeRules = useMemo(() => 
    scopeRules[0] || { taskId: task.id, rules: [] },
    [scopeRules, task.id]
  );

  const handleUpdateRules = useCallback((updatedRules: DependencyScopeRules) => {
    const existing = scopeRules.find((r: any) => r.taskId === updatedRules.taskId);
    if (existing) {
      updateScopeRule({ id: existing.id, updates: { rules: updatedRules.rules } });
    } else {
      createScopeRule({ taskId: updatedRules.taskId, rules: updatedRules.rules });
    }
  }, [scopeRules, updateScopeRule, createScopeRule]);

  const dependsOnTaskIds = useMemo(() => 
    dependsOn.map((d: any) => d.dependsOnTaskId),
    [dependsOn]
  );

  const subtaskIds = useMemo(() => 
    allTasks.filter((t: any) => t.parentTaskId === task.id).map((t: any) => t.id),
    [allTasks, task.id]
  );

  const availableTasks = useMemo(() => 
    allTasks.filter((t: any) => 
      t.id !== task.id && 
      t.parentTaskId !== task.id &&
      !subtaskIds.includes(t.id)
    ),
    [allTasks, task.id, subtaskIds]
  );

  const getStageName = (stageId: string | null | undefined) => {
    if (!stageId) return "No Stage";
    const stage = stages.find((s: any) => s.id === stageId);
    return stage?.label || stage?.name || "Unknown";
  };

  const getEpicName = (epicId: string | null | undefined) => {
    if (!epicId) return "No Epic";
    const epic = allEpics.find((e: any) => e.id === epicId);
    return epic?.title || epic?.name || "Unknown";
  };

  const getTaskById = (taskId: string) => {
    return allTasks.find((t: any) => t.id === taskId);
  };

  const evaluateRule = useCallback((rule: DependencyRule): any[] => {
    if (!rule.active) return [];
    
    return availableTasks.filter(t => {
      if (rule.stage && rule.stage !== "all" && t.stageId !== rule.stage) {
        return false;
      }
      
      const epic = allEpics.find((e: any) => e.id === t.epicId);
      if (rule.epicType && rule.epicType !== "all") {
        const epicType = epic?.type || epic?.epicType || "";
        if (epicType !== rule.epicType) {
          return false;
        }
      }
      
      if (rule.taskTemplateKey && rule.taskTemplateKey !== "all") {
        const taskType = t.templateKey || t.type || t.taskTypeId || "";
        if (!taskType.toLowerCase().includes(rule.taskTemplateKey.toLowerCase())) {
          return false;
        }
      }
      
      return true;
    });
  }, [availableTasks, allEpics]);

  const allMatchedTasksByRule = useMemo(() => {
    const result: Record<string, any[]> = {};
    (selectedRules.rules || []).forEach((rule: DependencyRule) => {
      result[rule.id] = evaluateRule(rule);
    });
    return result;
  }, [selectedRules.rules, evaluateRule]);

  const allMatchedTasks = useMemo(() => {
    const taskSet = new Set<string>();
    Object.values(allMatchedTasksByRule).forEach((matchedTasks: any[]) => {
      matchedTasks.forEach(t => taskSet.add(t.id));
    });
    return availableTasks.filter(t => taskSet.has(t.id));
  }, [allMatchedTasksByRule, availableTasks]);

  const pendingTasks = useMemo(() => {
    return allMatchedTasks.filter(t => !dependsOnTaskIds.includes(t.id));
  }, [allMatchedTasks, dependsOnTaskIds]);

  const alreadyLinkedFromRules = useMemo(() => {
    return allMatchedTasks.filter(t => dependsOnTaskIds.includes(t.id));
  }, [allMatchedTasks, dependsOnTaskIds]);

  const filteredTasks = useMemo(() => {
    return availableTasks.filter(t => {
      const epicName = getEpicName(t.epicId);
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        t.title?.toLowerCase().includes(searchLower) || 
        epicName.toLowerCase().includes(searchLower);
      
      const matchesStage = stageFilter === "all" || t.stageId === stageFilter;
      const matchesEpic = epicFilter === "all" || t.epicId === epicFilter;
      
      const isLinked = dependsOnTaskIds.includes(t.id);
      const matchesLinkedFilter = showLinkedOnly === null || 
        (showLinkedOnly === true && isLinked) || 
        (showLinkedOnly === false && !isLinked);
      
      return matchesSearch && matchesStage && matchesEpic && matchesLinkedFilter;
    });
  }, [availableTasks, searchQuery, stageFilter, epicFilter, showLinkedOnly, dependsOnTaskIds]);

  const handleToggleTask = (taskId: string) => {
    const existingDep = dependsOn.find((d: any) => d.dependsOnTaskId === taskId);
    
    if (existingDep) {
      if (existingDep.locked) return;
      removeDependency(existingDep.id);
    } else {
      addDependency(taskId, "manual_add");
    }
  };

  const handleToggleLock = (dep: any) => {
    if (updateDependency) {
      updateDependency(dep.id, { locked: !dep.locked });
    }
  };

  const handleAddRule = () => {
    const newRule: DependencyRule = {
      id: `r-${Date.now()}`,
      label: "New Scope Rule",
      active: true,
      stage: "all",
      epicType: "all",
      taskTemplateKey: "all"
    };
    handleUpdateRules({
      ...selectedRules,
      rules: [...(selectedRules.rules || []), newRule]
    });
    setExpandedRules(prev => ({ ...prev, [newRule.id]: true }));
  };

  const handleDeleteRule = (ruleId: string) => {
    handleUpdateRules({
      ...selectedRules,
      rules: selectedRules.rules.filter((r: DependencyRule) => r.id !== ruleId)
    });
  };

  const handleUpdateRule = (ruleId: string, updates: Partial<DependencyRule>) => {
    handleUpdateRules({
      ...selectedRules,
      rules: selectedRules.rules.map((r: DependencyRule) => r.id === ruleId ? { ...r, ...updates } : r)
    });
  };

  const handleToggleRuleActive = (ruleId: string, newActive: boolean) => {
    handleUpdateRule(ruleId, { active: newActive });
    
    if (!newActive) {
      const rule = (selectedRules.rules || []).find((r: DependencyRule) => r.id === ruleId);
      if (!rule) return;
      
      const tasksMatchedByThisRule = evaluateRule({ ...rule, active: true });
      const tasksMatchedByOtherActiveRules = new Set<string>();
      
      (selectedRules.rules || []).forEach((r: DependencyRule) => {
        if (r.id !== ruleId && r.active) {
          evaluateRule(r).forEach(t => tasksMatchedByOtherActiveRules.add(t.id));
        }
      });
      
      const tasksToUnlink = tasksMatchedByThisRule.filter(t => 
        !tasksMatchedByOtherActiveRules.has(t.id)
      );
      
      if (tasksToUnlink.length > 0) {
        const taskIdsToUnlink = new Set(tasksToUnlink.map(t => t.id));
        const depsToRemove = dependsOn.filter((d: any) => 
          taskIdsToUnlink.has(d.dependsOnTaskId) && 
          !d.locked &&
          typeof d.source === 'string' && 
          d.source.startsWith('rule:')
        );
        
        if (depsToRemove.length > 0) {
          depsToRemove.forEach((d: any) => removeDependency(d.id));
          toast({ 
            title: "Rule Disabled", 
            description: `Removed ${depsToRemove.length} dependency${depsToRemove.length !== 1 ? ' dependencies' : ''}.` 
          });
        }
      }
    }
  };

  const handleApplyRules = () => {
    if (pendingTasks.length === 0) {
      toast({ 
        title: "No Changes", 
        description: "All matched tasks are already linked as dependencies." 
      });
      return;
    }

    pendingTasks.forEach(t => {
      const matchingRuleIds = (selectedRules.rules || [])
        .filter((r: DependencyRule) => r.active && allMatchedTasksByRule[r.id]?.some((mt: any) => mt.id === t.id))
        .map((r: DependencyRule) => r.id);
      
      addDependency(t.id, `rule:${matchingRuleIds.join(',')}`);
    });

    toast({ 
      title: "Rules Applied", 
      description: `Added ${pendingTasks.length} task${pendingTasks.length !== 1 ? 's' : ''} as dependencies.` 
    });
  };

  const handleToggleCellTasks = (epicId: string, stageId: string) => {
    const cellTasks = availableTasks.filter((t: any) => t.epicId === epicId && t.stageId === stageId);
    if (cellTasks.length === 0) return;

    const linkedTaskIds = dependsOnTaskIds;
    const unlinkedTasks = cellTasks.filter((t: any) => !linkedTaskIds.includes(t.id));
    
    const cellTaskIds = cellTasks.map((t: any) => t.id);
    const removableDeps = dependsOn.filter((d: any) => 
      cellTaskIds.includes(d.dependsOnTaskId) && !d.locked
    );
    
    if (unlinkedTasks.length > 0) {
      unlinkedTasks.forEach((t: any) => addDependency(t.id, "matrix_add"));
    } else if (removableDeps.length > 0) {
      removableDeps.forEach((d: any) => removeDependency(d.id));
    }
  };

  const toggleRuleExpanded = (ruleId: string) => {
    setExpandedRules(prev => ({ ...prev, [ruleId]: !prev[ruleId] }));
  };

  const getCellTaskCounts = (epicId: string, stageId: string) => {
    const cellTasks = availableTasks.filter((t: any) => 
      t.epicId === epicId && t.stageId === stageId
    );
    const linkedCount = cellTasks.filter((t: any) => 
      dependsOnTaskIds.includes(t.id)
    ).length;
    return { total: cellTasks.length, linked: linkedCount };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Link2Off className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium">Blocked By:</span>
            <Badge variant="secondary">{dependsOn.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">Blocking:</span>
            <Badge variant="secondary">{dependents.length}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
              <TabsTrigger 
                value="rules" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2"
                data-testid="subtab-rules"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Rule-Based
                {pendingTasks.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700 text-xs">
                    {pendingTasks.length} pending
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="matrix"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2"
                data-testid="subtab-matrix"
              >
                <Layers className="w-4 h-4 mr-2" />
                Coverage Matrix
              </TabsTrigger>
              <TabsTrigger 
                value="manual"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2"
                data-testid="subtab-manual"
              >
                <ListTodo className="w-4 h-4 mr-2" />
                Manual Selection
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              {/* Rule-Based Tab */}
              <TabsContent value="rules" className="space-y-4 mt-0">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium">Dependency Rules</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Define criteria to automatically include tasks as dependencies
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
                    <div>
                      <p className="text-sm font-medium text-amber-900">
                        {pendingTasks.length} tasks matched but not yet linked
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Click "Apply Rules" to add these tasks as dependencies.
                      </p>
                    </div>
                  </div>
                )}

                {(selectedRules.rules || []).length === 0 ? (
                  <div className="border rounded-lg p-8 text-center text-muted-foreground">
                    <SlidersHorizontal className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No dependency rules defined yet.</p>
                    <p className="text-xs mt-1">Add a rule to automatically match tasks as dependencies.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(selectedRules.rules || []).map((rule: DependencyRule) => {
                      const matchedTasks = allMatchedTasksByRule[rule.id] || [];
                      const isExpanded = expandedRules[rule.id];
                      
                      return (
                        <Collapsible key={rule.id} open={isExpanded} onOpenChange={() => toggleRuleExpanded(rule.id)}>
                          <div className="border rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                              <div className="flex items-center gap-3">
                                <Switch
                                  checked={rule.active}
                                  onCheckedChange={(checked) => handleToggleRuleActive(rule.id, checked)}
                                  data-testid={`switch-rule-${rule.id}`}
                                />
                                <Input
                                  value={rule.label}
                                  onChange={(e) => handleUpdateRule(rule.id, { label: e.target.value })}
                                  className="h-7 w-[200px] text-sm font-medium border-0 bg-transparent focus-visible:ring-1"
                                  data-testid={`input-rule-label-${rule.id}`}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={rule.active ? "default" : "secondary"} className="text-xs">
                                  {matchedTasks.length} tasks
                                </Badge>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                                  </Button>
                                </CollapsibleTrigger>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteRule(rule.id)}
                                  data-testid={`button-delete-rule-${rule.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            <CollapsibleContent>
                              <div className="p-4 border-t space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Stage</Label>
                                    <SearchableSelect
                                      value={rule.stage}
                                      onValueChange={(v) => handleUpdateRule(rule.id, { stage: v })}
                                      placeholder="All Stages"
                                      options={[
                                        { value: "all", label: "All Stages" },
                                        ...stages.map((s: any) => ({ value: s.id, label: s.label || s.name }))
                                      ]}
                                      triggerClassName="mt-1"
                                      data-testid={`select-rule-stage-${rule.id}`}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Epic Type</Label>
                                    <SearchableSelect
                                      value={rule.epicType}
                                      onValueChange={(v) => handleUpdateRule(rule.id, { epicType: v })}
                                      placeholder="All Epic Types"
                                      options={[
                                        { value: "all", label: "All Epic Types" },
                                        ...(allEpicTypes || []).map((et: any) => ({ value: et.id, label: et.name }))
                                      ]}
                                      triggerClassName="mt-1"
                                      data-testid={`select-rule-epictype-${rule.id}`}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Task Type</Label>
                                    <SearchableSelect
                                      value={rule.taskTemplateKey}
                                      onValueChange={(v) => handleUpdateRule(rule.id, { taskTemplateKey: v })}
                                      placeholder="All Task Types"
                                      options={[
                                        { value: "all", label: "All Task Types" },
                                        ...(allTaskTypes || []).map((tt: any) => ({ value: tt.id, label: tt.name }))
                                      ]}
                                      triggerClassName="mt-1"
                                      data-testid={`select-rule-tasktype-${rule.id}`}
                                    />
                                  </div>
                                </div>

                                {matchedTasks.length > 0 && (
                                  <div className="mt-4">
                                    <p className="text-xs text-muted-foreground mb-2">
                                      Matched tasks ({matchedTasks.length}):
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
                                      {matchedTasks.slice(0, 20).map((t: any) => (
                                        <Badge 
                                          key={t.id} 
                                          variant={dependsOnTaskIds.includes(t.id) ? "default" : "outline"}
                                          className="text-xs"
                                        >
                                          {t.title || t.name}
                                        </Badge>
                                      ))}
                                      {matchedTasks.length > 20 && (
                                        <Badge variant="secondary" className="text-xs">
                                          +{matchedTasks.length - 20} more
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Coverage Matrix Tab */}
              <TabsContent value="matrix" className="space-y-4 mt-0">
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-muted/30 p-4 border-b">
                    <h4 className="font-medium text-sm">Coverage Matrix</h4>
                    <p className="text-xs text-muted-foreground">
                      Click on cells to toggle all tasks in that Epic & Stage as dependencies.
                    </p>
                  </div>
                  <ScrollArea className="h-[400px]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/10">
                            <th className="p-3 text-left font-medium min-w-[200px] sticky left-0 bg-muted/10">
                              Epic
                            </th>
                            {stages.map((stage: any) => (
                              <th key={stage.id} className="p-3 text-center font-medium border-l min-w-[100px]">
                                {stage.label || stage.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {allEpics.length === 0 ? (
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
                            allEpics.map((epic: any) => (
                              <tr key={epic.id} className="border-b hover:bg-muted/5">
                                <td className="p-3 font-medium sticky left-0 bg-white dark:bg-background">
                                  <span className="truncate max-w-[180px] block">{epic.title || epic.name}</span>
                                </td>
                                {stages.map((stage: any) => {
                                  const counts = getCellTaskCounts(epic.id, stage.id);
                                  const allLinked = counts.total > 0 && counts.linked === counts.total;
                                  const someLinked = counts.linked > 0 && counts.linked < counts.total;
                                  
                                  return (
                                    <td 
                                      key={stage.id} 
                                      className={cn(
                                        "p-3 text-center border-l cursor-pointer transition-colors",
                                        counts.total === 0 && "bg-muted/10",
                                        allLinked && "bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900",
                                        someLinked && "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950 dark:hover:bg-amber-900",
                                        counts.total > 0 && !allLinked && !someLinked && "hover:bg-muted/20"
                                      )}
                                      onClick={() => counts.total > 0 && handleToggleCellTasks(epic.id, stage.id)}
                                      data-testid={`cell-epic-${epic.id}-${stage.id}`}
                                    >
                                      {counts.total > 0 ? (
                                        <div className="flex flex-col items-center gap-0.5">
                                          <span className={cn(
                                            "text-sm font-medium",
                                            allLinked && "text-green-700 dark:text-green-300",
                                            someLinked && "text-amber-700 dark:text-amber-300"
                                          )}>
                                            {counts.linked}/{counts.total}
                                          </span>
                                          <span className="text-[10px] text-muted-foreground">
                                            {allLinked ? "All linked" : someLinked ? "Partial" : "None"}
                                          </span>
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
                  </ScrollArea>
                </div>
              </TabsContent>

              {/* Manual Selection Tab */}
              <TabsContent value="manual" className="space-y-4 mt-0">
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search tasks..." 
                        className="pl-9"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        data-testid="input-dependency-search"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">Stage:</Label>
                      <SearchableSelect
                        value={stageFilter}
                        onValueChange={setStageFilter}
                        placeholder="All Stages"
                        options={[
                          { value: "all", label: "All Stages" },
                          ...stages.map((stage: any) => ({ value: stage.id, label: stage.label || stage.name }))
                        ]}
                        triggerClassName="h-8 w-[160px]"
                        data-testid="select-stage-filter"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">Epic:</Label>
                      <SearchableSelect
                        value={epicFilter}
                        onValueChange={setEpicFilter}
                        placeholder="All Epics"
                        options={[
                          { value: "all", label: "All Epics" },
                          ...allEpics.map((epic: any) => ({ value: epic.id, label: epic.title || epic.name }))
                        ]}
                        triggerClassName="h-8 w-[160px]"
                        data-testid="select-epic-filter"
                      />
                    </div>
                    {(stageFilter !== "all" || epicFilter !== "all" || searchQuery) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-xs"
                        onClick={() => {
                          setStageFilter("all");
                          setEpicFilter("all");
                          setSearchQuery("");
                        }}
                        data-testid="button-clear-filters"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </div>

                <div className="border rounded-md">
                  <ScrollArea className="h-[400px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]"></TableHead>
                          <TableHead>Task</TableHead>
                          <TableHead>Stage</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTasks.slice(0, 50).map((t: any) => {
                          const isLinked = dependsOnTaskIds.includes(t.id);
                          const dep = dependsOn.find((d: any) => d.dependsOnTaskId === t.id);
                          const isLocked = dep?.locked;
                          
                          return (
                            <TableRow key={t.id} data-testid={`row-task-${t.id}`}>
                              <TableCell>
                                <Checkbox
                                  checked={isLinked}
                                  onCheckedChange={() => handleToggleTask(t.id)}
                                  disabled={isLocked}
                                  data-testid={`checkbox-task-${t.id}`}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div>
                                    <div className="font-medium">{t.title || t.name}</div>
                                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                      {getEpicName(t.epicId)}
                                    </div>
                                  </div>
                                  {isLocked && (
                                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {getStageName(t.stageId)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs font-normal">
                                  {t.status || "Pending"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    {filteredTasks.length > 50 && (
                      <div className="p-2 text-center text-xs text-muted-foreground border-t">
                        Showing 50 of {filteredTasks.length} tasks. Use search to narrow results.
                      </div>
                    )}
                    {filteredTasks.length === 0 && (
                      <div className="p-8 text-center text-muted-foreground">
                        No tasks found matching your filters.
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Current Dependencies Sidebar */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg">
            <div className="p-4 border-b bg-muted/30">
              <h3 className="font-medium text-sm">Current Dependencies</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Tasks that must complete before this task
              </p>
            </div>
            <ScrollArea className="h-[400px]">
              {dependsOn.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Link2Off className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No dependencies yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {dependsOn.map((dep: any) => {
                    const depTask = getTaskById(dep.dependsOnTaskId);
                    if (!depTask) return null;
                    
                    return (
                      <div key={dep.id} className="p-3 flex items-start justify-between gap-2 hover:bg-muted/10">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{depTask.title || depTask.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span>{getStageName(depTask.stageId)}</span>
                            {dep.source && dep.source !== "manual_add" && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                {dep.source.startsWith("rule:") ? "Rule" : "Matrix"}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {updateDependency && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleToggleLock(dep)}
                              data-testid={`button-lock-${dep.id}`}
                            >
                              {dep.locked ? (
                                <Lock className="h-3.5 w-3.5 text-amber-600" />
                              ) : (
                                <Unlock className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => removeDependency(dep.id)}
                            disabled={dep.locked}
                            data-testid={`button-remove-${dep.id}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
