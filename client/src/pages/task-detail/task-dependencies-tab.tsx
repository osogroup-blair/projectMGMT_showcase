import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  GitBranch, 
  Search, 
  Plus, 
  X, 
  Link2, 
  Link2Off, 
  Grid, 
  List, 
  Zap, 
  Check,
  Trash2,
  ChevronDown,
  Circle,
  CheckCircle2,
  AlertTriangle,
  Layers
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface TaskDependenciesTabProps {
  task: any;
  projectId: string;
  allTasks: any[];
  stages: any[];
  allEpics: any[];
  milestones: any[];
  dependsOn: any[];
  dependents: any[];
  addDependency: (taskId: string) => void;
  removeDependency: (depId: string) => void;
}

interface DependencyRule {
  id: string;
  label: string;
  active: boolean;
  stage: string;
  epic: string;
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
}: TaskDependenciesTabProps) {
  const [activeTab, setActiveTab] = useState<"manual" | "matrix" | "rules">("manual");
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [epicFilter, setEpicFilter] = useState<string>("all");
  const [milestoneFilter, setMilestoneFilter] = useState<string>("all");
  const [rules, setRules] = useState<DependencyRule[]>([]);
  const [expandedRules, setExpandedRules] = useState<Record<string, boolean>>({});

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

  const filteredTasks = useMemo(() => {
    return availableTasks.filter((t: any) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!(t.title || t.name || "").toLowerCase().includes(query)) {
          return false;
        }
      }
      if (stageFilter !== "all" && t.stageId !== stageFilter) {
        return false;
      }
      if (epicFilter !== "all" && t.epicId !== epicFilter) {
        return false;
      }
      if (milestoneFilter !== "all" && t.milestoneId !== milestoneFilter) {
        return false;
      }
      return true;
    });
  }, [availableTasks, searchQuery, stageFilter, epicFilter, milestoneFilter]);

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

  const handleToggleDependency = (taskId: string) => {
    const existingDep = dependsOn.find((d: any) => d.dependsOnTaskId === taskId);
    if (existingDep) {
      removeDependency(existingDep.id);
    } else {
      addDependency(taskId);
    }
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

  const getCellTasks = (epicId: string, stageId: string) => {
    return availableTasks.filter((t: any) => 
      t.epicId === epicId && t.stageId === stageId
    );
  };

  const handleToggleCellTasks = (epicId: string, stageId: string) => {
    const cellTasks = getCellTasks(epicId, stageId);
    const linkedTasks = cellTasks.filter((t: any) => dependsOnTaskIds.includes(t.id));
    const allLinked = linkedTasks.length === cellTasks.length && cellTasks.length > 0;

    if (allLinked) {
      linkedTasks.forEach((t: any) => {
        const dep = dependsOn.find((d: any) => d.dependsOnTaskId === t.id);
        if (dep) {
          removeDependency(dep.id);
        }
      });
    } else {
      cellTasks.forEach((t: any) => {
        if (!dependsOnTaskIds.includes(t.id)) {
          addDependency(t.id);
        }
      });
    }
  };

  const handleAddRule = () => {
    const newRule: DependencyRule = {
      id: `rule_${Date.now()}`,
      label: `Rule ${rules.length + 1}`,
      active: true,
      stage: "all",
      epic: "all",
    };
    setRules([...rules, newRule]);
  };

  const handleUpdateRule = (ruleId: string, updates: Partial<DependencyRule>) => {
    setRules(prev => 
      prev.map(r => r.id === ruleId ? { ...r, ...updates } : r)
    );
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules(prev => prev.filter(r => r.id !== ruleId));
  };

  const toggleRuleExpanded = (ruleId: string) => {
    setExpandedRules(prev => ({ ...prev, [ruleId]: !prev[ruleId] }));
  };

  const evaluateRule = (rule: DependencyRule) => {
    if (!rule.active) return [];
    return availableTasks.filter((t: any) => {
      if (rule.stage !== "all" && t.stageId !== rule.stage) return false;
      if (rule.epic !== "all" && t.epicId !== rule.epic) return false;
      return true;
    });
  };

  const allMatchedTasksByRule = useMemo(() => {
    const result: Record<string, any[]> = {};
    rules.forEach(rule => {
      result[rule.id] = evaluateRule(rule);
    });
    return result;
  }, [rules, availableTasks]);

  const pendingRuleTasks = useMemo(() => {
    const allMatched = new Set<string>();
    rules.forEach(rule => {
      if (rule.active) {
        evaluateRule(rule).forEach(t => allMatched.add(t.id));
      }
    });
    return Array.from(allMatched)
      .filter(id => !dependsOnTaskIds.includes(id))
      .map(id => getTaskById(id))
      .filter(Boolean);
  }, [rules, availableTasks, dependsOnTaskIds]);

  const alreadyLinkedFromRules = useMemo(() => {
    const allMatched = new Set<string>();
    rules.forEach(rule => {
      if (rule.active) {
        evaluateRule(rule).forEach(t => allMatched.add(t.id));
      }
    });
    return Array.from(allMatched)
      .filter(id => dependsOnTaskIds.includes(id))
      .map(id => getTaskById(id))
      .filter(Boolean);
  }, [rules, availableTasks, dependsOnTaskIds]);

  const handleApplyRules = () => {
    pendingRuleTasks.forEach(t => {
      if (t && !dependsOnTaskIds.includes(t.id)) {
        addDependency(t.id);
      }
    });
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
                value="manual"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2"
                data-testid="subtab-manual"
              >
                <List className="w-4 h-4 mr-2" />
                Manual Selection
              </TabsTrigger>
              <TabsTrigger 
                value="matrix"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2"
                data-testid="subtab-matrix"
              >
                <Grid className="w-4 h-4 mr-2" />
                Coverage Matrix
              </TabsTrigger>
              <TabsTrigger 
                value="rules" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2"
                data-testid="subtab-rules"
              >
                <Zap className="w-4 h-4 mr-2" />
                Rule-Based
                {pendingRuleTasks.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700 text-xs">
                    {pendingRuleTasks.length} pending
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
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
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground whitespace-nowrap">Milestone:</Label>
                      <SearchableSelect
                        value={milestoneFilter}
                        onValueChange={setMilestoneFilter}
                        placeholder="All Milestones"
                        options={[
                          { value: "all", label: "All Milestones" },
                          ...milestones.map((ms: any) => ({ value: ms.id, label: ms.title || ms.name }))
                        ]}
                        triggerClassName="h-8 w-[160px]"
                        data-testid="select-milestone-filter"
                      />
                    </div>
                    {(stageFilter !== "all" || epicFilter !== "all" || milestoneFilter !== "all" || searchQuery) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-xs"
                        onClick={() => {
                          setStageFilter("all");
                          setEpicFilter("all");
                          setMilestoneFilter("all");
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
                          return (
                            <TableRow key={t.id} data-testid={`row-task-${t.id}`}>
                              <TableCell>
                                <Checkbox
                                  checked={isLinked}
                                  onCheckedChange={() => handleToggleDependency(t.id)}
                                  data-testid={`checkbox-task-${t.id}`}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{t.title || t.name}</div>
                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {getEpicName(t.epicId)}
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
                                <td className="p-3 font-medium sticky left-0 bg-white">
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
                                        allLinked && "bg-green-50 hover:bg-green-100",
                                        someLinked && "bg-amber-50 hover:bg-amber-100",
                                        counts.total > 0 && !allLinked && !someLinked && "hover:bg-muted/20"
                                      )}
                                      onClick={() => counts.total > 0 && handleToggleCellTasks(epic.id, stage.id)}
                                      data-testid={`cell-epic-${epic.id}-${stage.id}`}
                                    >
                                      {counts.total > 0 ? (
                                        <div className="flex flex-col items-center gap-0.5">
                                          <span className={cn(
                                            "text-sm font-medium",
                                            allLinked && "text-green-700",
                                            someLinked && "text-amber-700"
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

              <TabsContent value="rules" className="space-y-4 mt-0">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-medium">Dependency Rules</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Define criteria to automatically link tasks as dependencies
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
                        {pendingRuleTasks.length} task{pendingRuleTasks.length !== 1 ? 's' : ''} matched but not yet linked
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Click "Apply Rules" to add these tasks as dependencies.
                      </p>
                    </div>
                  </div>
                )}

                {alreadyLinkedFromRules.length > 0 && pendingRuleTasks.length === 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">
                        All matched tasks are linked
                      </p>
                      <p className="text-xs text-green-700 mt-0.5">
                        {alreadyLinkedFromRules.length} task{alreadyLinkedFromRules.length !== 1 ? 's' : ''} from rules are dependencies.
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  {rules.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm bg-muted/10">
                      No rules defined. Add a rule to automatically link tasks as dependencies.
                    </div>
                  ) : (
                    rules.map((rule) => {
                      const matchedTasks = allMatchedTasksByRule[rule.id] || [];
                      const linkedCount = matchedTasks.filter(t => dependsOnTaskIds.includes(t.id)).length;
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
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <Label className="text-xs">Stage</Label>
                                <SearchableSelect
                                  value={rule.stage}
                                  onValueChange={(v) => handleUpdateRule(rule.id, { stage: v })}
                                  placeholder="Any Stage"
                                  options={[
                                    { value: "all", label: "Any Stage" },
                                    ...stages.map((stage: any) => ({ value: stage.id, label: stage.label || stage.name }))
                                  ]}
                                  triggerClassName="h-8"
                                  data-testid={`select-rule-stage-${rule.id}`}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Epic</Label>
                                <SearchableSelect
                                  value={rule.epic}
                                  onValueChange={(v) => handleUpdateRule(rule.id, { epic: v })}
                                  placeholder="Any Epic"
                                  options={[
                                    { value: "all", label: "Any Epic" },
                                    ...allEpics.map((epic: any) => ({ value: epic.id, label: epic.title || epic.name }))
                                  ]}
                                  triggerClassName="h-8"
                                  data-testid={`select-rule-epic-${rule.id}`}
                                />
                              </div>
                            </div>
                            
                            <Collapsible open={isExpanded} onOpenChange={() => toggleRuleExpanded(rule.id)}>
                              <CollapsibleTrigger asChild>
                                <button className="flex items-center justify-between w-full text-xs hover:text-foreground transition-colors py-2">
                                  <span className="flex items-center gap-1.5">
                                    {matchedTasks.length > 0 ? (
                                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
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
                                    {matchedTasks.map((t: any) => {
                                      const isLinked = dependsOnTaskIds.includes(t.id);
                                      return (
                                        <div 
                                          key={t.id} 
                                          className="px-3 py-2 flex items-center justify-between text-xs hover:bg-muted/30"
                                        >
                                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {isLinked ? (
                                              <Check className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                                            ) : (
                                              <Circle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                                            )}
                                            <span className="truncate font-medium">{t.title || t.name}</span>
                                          </div>
                                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                            <Badge variant="outline" className="text-[10px]">
                                              {getStageName(t.stageId)}
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
            </div>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Link2Off className="h-4 w-4 text-red-500" />
                Blocked By ({dependsOn.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dependsOn.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No blocking dependencies
                </p>
              ) : (
                <ScrollArea className="h-[180px]">
                  <div className="space-y-2">
                    {dependsOn.map((dep: any) => {
                      const depTask = getTaskById(dep.dependsOnTaskId);
                      if (!depTask) return null;
                      return (
                        <div 
                          key={dep.id} 
                          className="flex items-center justify-between p-2 rounded-md border hover:bg-muted/30 group"
                        >
                          <div className="flex-1 min-w-0">
                            <Link 
                              href={`/projects/${projectId}/tasks/${depTask.id}`}
                              className="text-sm font-medium hover:text-primary truncate block"
                            >
                              {depTask.title || depTask.name}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[10px]">
                                {depTask.status || "Pending"}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {getStageName(depTask.stageId)}
                              </span>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                            onClick={() => removeDependency(dep.id)}
                            data-testid={`button-remove-dep-${dep.id}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Link2 className="h-4 w-4 text-amber-500" />
                Blocking ({dependents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dependents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Not blocking any tasks
                </p>
              ) : (
                <ScrollArea className="h-[180px]">
                  <div className="space-y-2">
                    {dependents.map((dep: any) => {
                      const depTask = getTaskById(dep.taskId);
                      if (!depTask) return null;
                      return (
                        <div 
                          key={dep.id} 
                          className="flex items-center justify-between p-2 rounded-md border bg-muted/10"
                        >
                          <div className="flex-1 min-w-0">
                            <Link 
                              href={`/projects/${projectId}/tasks/${depTask.id}`}
                              className="text-sm font-medium hover:text-primary truncate block"
                            >
                              {depTask.title || depTask.name}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[10px]">
                                {depTask.status || "Pending"}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {getStageName(depTask.stageId)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
