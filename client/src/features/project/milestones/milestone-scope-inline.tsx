import { useMemo, useState } from "react";
import { 
  Search, 
  Plus, 
  SlidersHorizontal, 
  AlertTriangle,
  CheckCircle2,
  Circle,
  CheckSquare,
  ChevronDown,
  Trash2,
  Zap,
  ListTodo
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface MilestoneScopeInlineProps {
  milestone: any;
  projectId: string;
  tasks: any[];
  epics: any[];
  stages: any[];
  links: any[];
  allLinks: any[];
  scopeRules: any[];
  onCreateLink: (data: any) => void;
  onCreateScopeRule: (data: any) => void;
  onUpdateScopeRule: (data: any) => void;
}

export function MilestoneScopeInline({
  milestone,
  projectId,
  tasks,
  epics,
  stages,
  links,
  allLinks,
  scopeRules,
  onCreateLink,
  onCreateScopeRule,
  onUpdateScopeRule
}: MilestoneScopeInlineProps) {
  const { toast } = useToast();
  const [manualSearch, setManualSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [epicFilter, setEpicFilter] = useState("all");
  const [expandedRules, setExpandedRules] = useState<Record<string, boolean>>({});

  const rules = useMemo(() => {
    const found = scopeRules.find((r: any) => r.milestoneId === milestone.id);
    return found || { milestoneId: milestone.id, rules: [] };
  }, [scopeRules, milestone.id]);

  const linkedTaskIds = useMemo(() => 
    links.map((l: any) => l.taskId),
    [links]
  );

  const filteredTasks = useMemo(() => {
    let result = tasks.filter((t: any) => !linkedTaskIds.includes(t.id));
    
    if (manualSearch) {
      const search = manualSearch.toLowerCase();
      result = result.filter((t: any) => 
        t.title?.toLowerCase().includes(search)
      );
    }
    
    if (stageFilter !== "all") {
      result = result.filter((t: any) => t.stageId === stageFilter);
    }
    
    if (epicFilter !== "all") {
      result = result.filter((t: any) => t.epicId === epicFilter);
    }
    
    return result.slice(0, 10);
  }, [tasks, linkedTaskIds, manualSearch, stageFilter, epicFilter]);

  const allMatchedTasksByRule = useMemo(() => {
    const matched: Record<string, any[]> = {};
    (rules.rules || []).forEach((rule: any) => {
      if (!rule.active) {
        matched[rule.id] = [];
        return;
      }
      
      let matchedTasks = [...tasks];
      
      if (rule.stage && rule.stage !== "all") {
        matchedTasks = matchedTasks.filter((t: any) => t.stageId === rule.stage);
      }
      
      if (rule.epicType && rule.epicType !== "all") {
        const matchingEpicIds = epics
          .filter((e: any) => e.type === rule.epicType)
          .map((e: any) => e.id);
        matchedTasks = matchedTasks.filter((t: any) => matchingEpicIds.includes(t.epicId));
      }
      
      matched[rule.id] = matchedTasks;
    });
    return matched;
  }, [rules.rules, tasks, epics]);

  const pendingTasks = useMemo(() => {
    const allMatched = Object.values(allMatchedTasksByRule).flat();
    const uniqueMap = new Map(allMatched.map(t => [t.id, t]));
    const uniqueMatched = Array.from(uniqueMap.values());
    return uniqueMatched.filter(t => !linkedTaskIds.includes(t.id));
  }, [allMatchedTasksByRule, linkedTaskIds]);

  const handleAddTask = (taskId: string) => {
    onCreateLink({
      milestoneId: milestone.id,
      taskId,
      projectId,
      source: "manual_add",
      locked: false
    });
    toast({ title: "Task added", description: "Task has been added to the milestone scope." });
  };

  const handleAddRule = () => {
    const newRule = {
      id: `rule-${Date.now()}`,
      label: "New Rule",
      stage: "all",
      epicType: "all",
      taskTemplateKey: "all",
      active: true
    };
    
    const updatedRules = {
      milestoneId: milestone.id,
      rules: [...(rules.rules || []), newRule]
    };
    
    const existing = scopeRules.find((r: any) => r.milestoneId === milestone.id);
    if (existing) {
      onUpdateScopeRule(updatedRules);
    } else {
      onCreateScopeRule(updatedRules);
    }
  };

  const handleUpdateRule = (ruleId: string, updates: any) => {
    const updatedRules = {
      milestoneId: milestone.id,
      rules: (rules.rules || []).map((r: any) => 
        r.id === ruleId ? { ...r, ...updates } : r
      )
    };
    onUpdateScopeRule(updatedRules);
  };

  const handleDeleteRule = (ruleId: string) => {
    const updatedRules = {
      milestoneId: milestone.id,
      rules: (rules.rules || []).filter((r: any) => r.id !== ruleId)
    };
    onUpdateScopeRule(updatedRules);
  };

  const handleApplyRules = () => {
    pendingTasks.forEach((task: any) => {
      onCreateLink({
        milestoneId: milestone.id,
        taskId: task.id,
        projectId,
        source: "rule_based",
        locked: false
      });
    });
    toast({ 
      title: "Rules applied", 
      description: `${pendingTasks.length} task${pendingTasks.length !== 1 ? 's' : ''} added to scope.` 
    });
  };

  const getStageName = (stageId: string) => {
    const stage = stages.find((s: any) => s.id === stageId);
    return stage?.name || stage?.label || "Unknown";
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="h-8 p-0.5 bg-muted/50">
          <TabsTrigger value="manual" className="text-xs h-7 gap-1.5 px-3">
            <ListTodo className="w-3.5 h-3.5" />
            Manual
          </TabsTrigger>
          <TabsTrigger value="rules" className="text-xs h-7 gap-1.5 px-3">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Rules
            {pendingTasks.length > 0 && (
              <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0">
                {pendingTasks.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-3 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input 
                placeholder="Search tasks..." 
                className="pl-8 h-8 text-sm"
                value={manualSearch}
                onChange={e => setManualSearch(e.target.value)}
                data-testid={`input-scope-search-${milestone.id}`}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <SearchableSelect 
              value={stageFilter} 
              onValueChange={setStageFilter}
              className="h-8 flex-1"
              placeholder="All Stages"
              options={[
                { value: "all", label: "All Stages" },
                ...stages.map((s: any) => ({ value: s.id, label: s.name || s.label }))
              ]}
            />
            <SearchableSelect 
              value={epicFilter} 
              onValueChange={setEpicFilter}
              className="h-8 flex-1"
              placeholder="All Epics"
              options={[
                { value: "all", label: "All Epics" },
                ...epics.map((e: any) => ({ value: e.id, label: e.title }))
              ]}
            />
          </div>

          {filteredTasks.length > 0 ? (
            <div className="border rounded-lg divide-y max-h-[180px] overflow-y-auto">
              {filteredTasks.map((task: any) => (
                <div 
                  key={task.id} 
                  className="px-3 py-2 flex items-center justify-between text-xs hover:bg-muted/30"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="font-medium truncate block">{task.title}</span>
                    <span className="text-muted-foreground text-[10px]">
                      {getStageName(task.stageId)}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => handleAddTask(task.id)}
                    data-testid={`button-add-task-scope-${task.id}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-muted-foreground border-2 border-dashed rounded-lg">
              {manualSearch || stageFilter !== "all" || epicFilter !== "all" 
                ? "No matching tasks found" 
                : "All tasks are already in scope"}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rules" className="mt-3 space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Auto-include tasks matching criteria
            </p>
            <div className="flex gap-2">
              {pendingTasks.length > 0 && (
                <Button 
                  size="sm" 
                  onClick={handleApplyRules}
                  className="h-7 text-xs gap-1.5 bg-green-600 hover:bg-green-700"
                  data-testid={`button-apply-rules-${milestone.id}`}
                >
                  <Zap className="h-3 w-3" /> 
                  Apply ({pendingTasks.length})
                </Button>
              )}
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleAddRule} 
                className="h-7 text-xs gap-1.5"
                data-testid={`button-add-rule-${milestone.id}`}
              >
                <Plus className="h-3 w-3" /> Rule
              </Button>
            </div>
          </div>

          {pendingTasks.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                {pendingTasks.length} task{pendingTasks.length !== 1 ? 's' : ''} matched but not applied
              </p>
            </div>
          )}

          <div className="space-y-2">
            {(rules.rules || []).length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground text-xs">
                No rules defined. Add a rule to auto-include tasks.
              </div>
            ) : (
              rules.rules.map((rule: any) => {
                const matchedTasks = allMatchedTasksByRule[rule.id] || [];
                const linkedCount = matchedTasks.filter((t: any) => linkedTaskIds.includes(t.id)).length;
                const pendingCount = matchedTasks.length - linkedCount;
                const isExpanded = expandedRules[rule.id] || false;
                
                return (
                  <Card key={rule.id} className={cn("overflow-hidden", !rule.active && "opacity-60")}>
                    <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between space-y-0">
                      <Input 
                        value={rule.label} 
                        onChange={(e) => handleUpdateRule(rule.id, { label: e.target.value })}
                        className="h-7 text-sm font-medium border-transparent hover:border-input focus:border-input px-0 flex-1 mr-2"
                        data-testid={`input-rule-label-inline-${rule.id}`}
                      />
                      <div className="flex items-center gap-1.5">
                        <Switch 
                          checked={rule.active} 
                          onCheckedChange={(c) => handleUpdateRule(rule.id, { active: c })}
                          className="scale-75"
                          data-testid={`switch-rule-active-inline-${rule.id}`}
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-muted-foreground hover:text-destructive" 
                          onClick={() => handleDeleteRule(rule.id)}
                          data-testid={`button-delete-rule-inline-${rule.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px]">Stage</Label>
                          <SearchableSelect 
                            value={rule.stage || "all"} 
                            onValueChange={(v) => handleUpdateRule(rule.id, { stage: v })}
                            className="h-7 text-xs"
                            placeholder="Any"
                            options={[
                              { value: "all", label: "Any Stage" },
                              ...stages.map((s: any) => ({ value: s.id, label: s.name || s.label }))
                            ]}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Epic Type</Label>
                          <SearchableSelect 
                            value={rule.epicType || "all"} 
                            onValueChange={(v) => handleUpdateRule(rule.id, { epicType: v })}
                            className="h-7 text-xs"
                            placeholder="Any"
                            options={[
                              { value: "all", label: "Any Type" },
                              { value: "use_case", label: "Use Case" },
                              { value: "technical", label: "Technical" }
                            ]}
                          />
                        </div>
                      </div>

                      <Collapsible 
                        open={isExpanded} 
                        onOpenChange={() => setExpandedRules(prev => ({ ...prev, [rule.id]: !prev[rule.id] }))}
                      >
                        <CollapsibleTrigger asChild>
                          <button 
                            className={cn(
                              "w-full p-2 rounded text-[10px] flex items-center justify-between",
                              matchedTasks.length > 0 
                                ? pendingCount > 0
                                  ? "bg-amber-50 hover:bg-amber-100 border border-amber-200"
                                  : "bg-green-50 hover:bg-green-100 border border-green-200"
                                : "bg-muted/30 hover:bg-muted/50"
                            )}
                          >
                            <span className="flex items-center gap-1.5">
                              {matchedTasks.length > 0 ? (
                                pendingCount > 0 ? (
                                  <AlertTriangle className="h-3 w-3 text-amber-600" />
                                ) : (
                                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                                )
                              ) : (
                                <Circle className="h-3 w-3 text-muted-foreground" />
                              )}
                              <strong>{matchedTasks.length}</strong> matches
                              {matchedTasks.length > 0 && (
                                <span className="text-muted-foreground">
                                  ({linkedCount} linked{pendingCount > 0 && `, ${pendingCount} pending`})
                                </span>
                              )}
                            </span>
                            <ChevronDown className={cn("h-3 w-3", isExpanded && "rotate-180")} />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          {matchedTasks.length > 0 && (
                            <div className="mt-1.5 border rounded divide-y max-h-[120px] overflow-y-auto">
                              {matchedTasks.slice(0, 10).map((task: any) => {
                                const isLinked = linkedTaskIds.includes(task.id);
                                return (
                                  <div 
                                    key={task.id} 
                                    className="px-2 py-1.5 flex items-center justify-between text-[10px] hover:bg-muted/30"
                                  >
                                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                      {isLinked ? (
                                        <CheckSquare className="h-3 w-3 text-green-600 flex-shrink-0" />
                                      ) : (
                                        <Circle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                                      )}
                                      <span className="truncate">{task.title}</span>
                                    </div>
                                    <Badge 
                                      variant="secondary" 
                                      className={cn(
                                        "text-[9px] px-1 py-0",
                                        isLinked ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                                      )}
                                    >
                                      {isLinked ? "Linked" : "Pending"}
                                    </Badge>
                                  </div>
                                );
                              })}
                              {matchedTasks.length > 10 && (
                                <div className="px-2 py-1.5 text-center text-[10px] text-muted-foreground">
                                  +{matchedTasks.length - 10} more
                                </div>
                              )}
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
      </Tabs>
    </div>
  );
}
