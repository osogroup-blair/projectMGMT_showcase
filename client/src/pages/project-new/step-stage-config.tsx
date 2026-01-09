import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  Layers, 
  ListTodo,
  Target,
  LayoutTemplate,
  Wrench
} from "lucide-react";
import { StepProps, WizardStage, WizardTaskDraft, WizardMilestone } from "./types";

export function StepStageConfig({
  stages,
  setStages,
  milestones,
  setMilestones,
  frameworkTemplates,
  stageTemplates,
  taskTemplates,
  milestoneTemplates,
  users,
}: StepProps) {
  const [activeTab, setActiveTab] = useState<'apply' | 'build'>('build');
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());

  const toggleStageExpanded = (stageId: string) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stageId)) {
      newExpanded.delete(stageId);
    } else {
      newExpanded.add(stageId);
    }
    setExpandedStages(newExpanded);
  };

  const addStage = () => {
    const newStage: WizardStage = {
      id: `stage-${Date.now()}`,
      name: "",
      description: "",
      taskCreationMode: 'per_epic',
      defaultTasks: [],
      defaultRoles: [],
      type: 'standard',
      tasks: []
    };
    setStages([...stages, newStage]);
    setExpandedStages(new Set([...Array.from(expandedStages), newStage.id]));
  };

  const removeStage = (index: number) => {
    const newStages = [...stages];
    newStages.splice(index, 1);
    setStages(newStages);
  };

  const addTaskToStage = (stageIndex: number) => {
    const newStages = [...stages];
    const stage = newStages[stageIndex];
    const newTask: WizardTaskDraft = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: "",
      description: "",
      priority: "Medium",
      estimateHours: 2,
      scope: stage.taskCreationMode === 'once' ? 'once' : 'per_epic',
      stageId: stage.id,
      order: stage.tasks.length
    };
    stage.tasks.push(newTask);
    setStages(newStages);
  };

  const removeTaskFromStage = (stageIndex: number, taskIndex: number) => {
    const newStages = [...stages];
    newStages[stageIndex].tasks.splice(taskIndex, 1);
    setStages(newStages);
  };

  const updateTask = (stageIndex: number, taskIndex: number, updates: Partial<WizardTaskDraft>) => {
    const newStages = [...stages];
    newStages[stageIndex].tasks[taskIndex] = {
      ...newStages[stageIndex].tasks[taskIndex],
      ...updates
    };
    setStages(newStages);
  };

  const applyTaskTemplate = (stageIndex: number, templateId: string) => {
    const template = taskTemplates.find((t: any) => t.id === templateId);
    if (!template) return;

    const newStages = [...stages];
    const stage = newStages[stageIndex];
    const newTask: WizardTaskDraft = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      templateId: template.id,
      title: template.title,
      description: template.description || "",
      priority: template.defaultPriority || "Medium",
      estimateHours: template.defaultEstimateHours || 2,
      scope: template.scope || 'per_epic',
      assigneeRoleTypeId: template.assigneeRoleTypeId,
      stageId: stage.id,
      order: stage.tasks.length
    };
    stage.tasks.push(newTask);
    setStages(newStages);
  };

  const addMilestone = () => {
    const newMilestone: WizardMilestone = {
      id: `ms-${Date.now()}`,
      name: "",
      description: "",
      phase: "delivery",
      stageId: stages[0]?.id || "",
      targetDate: "",
      ownerId: users[0]?.id || "",
      scopeType: "deliverable",
      completionMode: "percentage",
      completionTargetPercent: 100,
      isBillingGate: false
    };
    setMilestones([...milestones, newMilestone]);
  };

  const removeMilestone = (index: number) => {
    const newMilestones = [...milestones];
    newMilestones.splice(index, 1);
    setMilestones(newMilestones);
  };

  const applyStageTemplate = (templateId: string) => {
    const template = stageTemplates.find((t: any) => t.id === templateId);
    if (!template) return;

    const newStage: WizardStage = {
      id: `stage-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: template.name,
      description: template.description || "",
      taskCreationMode: 'per_epic',
      defaultTasks: template.defaultTasks || [],
      defaultRoles: template.defaultRoles || [],
      type: 'standard',
      tasks: (template.defaultTasks || []).map((taskId: string, idx: number) => {
        const taskTemplate = taskTemplates.find((t: any) => t.id === taskId);
        if (!taskTemplate) return null;
        return {
          id: `task-${Date.now()}-${idx}`,
          templateId: taskTemplate.id,
          title: taskTemplate.title,
          description: taskTemplate.description || "",
          priority: taskTemplate.defaultPriority || "Medium",
          estimateHours: taskTemplate.defaultEstimateHours || 2,
          scope: taskTemplate.scope || 'per_epic',
          assigneeRoleTypeId: taskTemplate.assigneeRoleTypeId,
          stageId: `stage-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          order: idx
        };
      }).filter(Boolean)
    };
    setStages([...stages, newStage]);
    setExpandedStages(new Set([...Array.from(expandedStages), newStage.id]));
  };

  const applyFramework = (frameworkId: string) => {
    const framework = frameworkTemplates?.find((f: any) => f.id === frameworkId);
    if (!framework) return;

    const frameworkStages = (framework.defaultStages || [])
      .map((stageId: string, idx: number) => {
        const stageTemplate = stageTemplates.find((st: any) => st.id === stageId);
        if (!stageTemplate) return null;
        
        const stageUniqueId = `stage-${Date.now()}-${idx}`;
        return {
          id: stageUniqueId,
          name: stageTemplate.name,
          description: stageTemplate.description || "",
          taskCreationMode: 'per_epic' as const,
          defaultTasks: stageTemplate.defaultTasks || [],
          defaultRoles: stageTemplate.defaultRoles || [],
          type: stageTemplate.type || 'standard',
          tasks: (stageTemplate.defaultTasks || []).map((taskId: string, taskIdx: number) => {
            const taskTemplate = taskTemplates.find((t: any) => t.id === taskId);
            if (!taskTemplate) return null;
            return {
              id: `task-${Date.now()}-${idx}-${taskIdx}`,
              templateId: taskTemplate.id,
              title: taskTemplate.title,
              description: taskTemplate.description || "",
              priority: taskTemplate.defaultPriority || "Medium",
              estimateHours: taskTemplate.defaultEstimateHours || 2,
              scope: taskTemplate.scope || 'per_epic',
              assigneeRoleTypeId: taskTemplate.assigneeRoleTypeId,
              stageId: stageUniqueId,
              order: taskIdx
            };
          }).filter(Boolean)
        };
      })
      .filter(Boolean) as WizardStage[];

    setStages(frameworkStages);
    const expandedIds = frameworkStages.map(s => s.id);
    setExpandedStages(new Set(expandedIds));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-background pb-4 border-b mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Stage Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Define stages, tasks, and milestones. Apply templates or build from scratch.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={addMilestone} data-testid="button-add-milestone">
              <Target className="h-4 w-4 mr-2" /> Add Milestone
            </Button>
            <Button size="sm" onClick={addStage} data-testid="button-add-stage">
              <Plus className="h-4 w-4 mr-2" /> Add Stage
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'apply' | 'build')} className="flex-1">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="apply" className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4" /> Apply Frameworks
          </TabsTrigger>
          <TabsTrigger value="build" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" /> Build from Scratch
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apply" className="mt-0">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Project Frameworks</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Select a framework to apply its pre-configured stages, tasks, and workflow.
                </p>
              </CardHeader>
              <CardContent>
                {frameworkTemplates && frameworkTemplates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {frameworkTemplates.map((framework: any) => (
                      <Card 
                        key={framework.id} 
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => applyFramework(framework.id)}
                        data-testid={`card-framework-${framework.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium text-sm">{framework.name}</div>
                              <div className="text-xs text-muted-foreground mt-1">{framework.description}</div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            {framework.defaultStages?.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {framework.defaultStages.length} stages
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 text-muted-foreground border-2 border-dashed rounded-lg">
                    <LayoutTemplate className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No frameworks available.</p>
                    <p className="text-xs mt-1">Use the "Build from Scratch" tab to create stages manually.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Add Individual Stage Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Select onValueChange={applyStageTemplate}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a stage template to add..." />
                    </SelectTrigger>
                    <SelectContent>
                      {stageTemplates.map((template: any) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} ({template.defaultTasks?.length || 0} tasks)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="build" className="mt-0">
          <ScrollArea className="h-[450px] pr-4">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2">
                    <Layers className="h-4 w-4" /> Stages ({stages.length})
                  </h4>
                </div>

                {stages.length === 0 ? (
                  <div className="text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
                    <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No stages defined yet.</p>
                    <Button variant="link" onClick={addStage}>Add your first stage</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stages.map((stage, stageIndex) => (
                      <Card key={stage.id}>
                        <Collapsible 
                          open={expandedStages.has(stage.id)} 
                          onOpenChange={() => toggleStageExpanded(stage.id)}
                        >
                          <CardHeader className="p-4 pb-2">
                            <div className="flex items-center gap-3">
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                  {expandedStages.has(stage.id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                                {stageIndex + 1}
                              </div>
                              <Input
                                value={stage.name}
                                onChange={(e) => {
                                  const newStages = [...stages];
                                  newStages[stageIndex].name = e.target.value;
                                  setStages(newStages);
                                }}
                                className="h-8 flex-1 font-medium"
                                placeholder="Enter stage name..."
                                data-testid={`input-stage-name-${stageIndex}`}
                              />
                              <Badge variant="outline" className="shrink-0">
                                {stage.tasks.length} Tasks
                              </Badge>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive"
                                onClick={() => removeStage(stageIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CollapsibleContent>
                            <CardContent className="pt-0 pb-4 px-4">
                              <div className="ml-12 space-y-4">
                                <div className="flex items-center gap-4 py-2 border-t">
                                  <Label className="text-sm text-muted-foreground shrink-0">Task Creation:</Label>
                                  <div className="flex items-center gap-4">
                                    {(['none', 'once', 'per_epic'] as const).map((mode) => (
                                      <div key={mode} className="flex items-center gap-2">
                                        <input
                                          type="radio"
                                          id={`stage-${mode}-${stage.id}`}
                                          name={`stage-mode-${stage.id}`}
                                          checked={stage.taskCreationMode === mode}
                                          onChange={() => {
                                            const newStages = [...stages];
                                            newStages[stageIndex].taskCreationMode = mode;
                                            setStages(newStages);
                                          }}
                                          className="h-4 w-4"
                                        />
                                        <Label htmlFor={`stage-${mode}-${stage.id}`} className="text-sm cursor-pointer capitalize">
                                          {mode === 'per_epic' ? 'Per Epic' : mode}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-sm flex items-center gap-2">
                                      <ListTodo className="h-4 w-4" /> Tasks
                                    </Label>
                                    <div className="flex gap-2">
                                      <Select onValueChange={(templateId) => applyTaskTemplate(stageIndex, templateId)}>
                                        <SelectTrigger className="h-8 w-48">
                                          <SelectValue placeholder="Add from template..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {taskTemplates.map((template: any) => (
                                            <SelectItem key={template.id} value={template.id}>
                                              {template.title}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Button size="sm" variant="outline" onClick={() => addTaskToStage(stageIndex)}>
                                        <Plus className="h-3 w-3 mr-1" /> Custom
                                      </Button>
                                    </div>
                                  </div>

                                  {stage.tasks.length === 0 ? (
                                    <div className="text-center p-4 border border-dashed rounded text-muted-foreground text-sm">
                                      No tasks defined. Add from templates or create custom tasks.
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {stage.tasks.map((task, taskIndex) => (
                                        <Card key={task.id} className="bg-muted/30">
                                          <CardContent className="p-3">
                                            <div className="flex items-start gap-3">
                                              <div className="flex-1 space-y-2">
                                                <Input
                                                  value={task.title}
                                                  onChange={(e) => updateTask(stageIndex, taskIndex, { title: e.target.value })}
                                                  className="h-8"
                                                  placeholder="Task title..."
                                                />
                                                <div className="grid grid-cols-3 gap-2">
                                                  <Select
                                                    value={task.scope}
                                                    onValueChange={(v) => updateTask(stageIndex, taskIndex, { scope: v as 'once' | 'per_epic' })}
                                                  >
                                                    <SelectTrigger className="h-8">
                                                      <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      <SelectItem value="once">Once</SelectItem>
                                                      <SelectItem value="per_epic">Per Epic</SelectItem>
                                                    </SelectContent>
                                                  </Select>
                                                  <Select
                                                    value={task.priority}
                                                    onValueChange={(v) => updateTask(stageIndex, taskIndex, { priority: v })}
                                                  >
                                                    <SelectTrigger className="h-8">
                                                      <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                      <SelectItem value="Low">Low</SelectItem>
                                                      <SelectItem value="Medium">Medium</SelectItem>
                                                      <SelectItem value="High">High</SelectItem>
                                                    </SelectContent>
                                                  </Select>
                                                  <Input
                                                    type="number"
                                                    value={task.estimateHours}
                                                    onChange={(e) => updateTask(stageIndex, taskIndex, { estimateHours: parseInt(e.target.value) || 0 })}
                                                    className="h-8"
                                                    placeholder="Hours"
                                                  />
                                                </div>
                                              </div>
                                              <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8"
                                                onClick={() => removeTaskFromStage(stageIndex, taskIndex)}
                                              >
                                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                                              </Button>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" /> Milestones ({milestones.length})
                  </h4>
                  <Button size="sm" variant="outline" onClick={addMilestone}>
                    <Plus className="h-3 w-3 mr-1" /> Add Milestone
                  </Button>
                </div>

                {milestones.length === 0 ? (
                  <div className="text-center p-6 border-2 border-dashed rounded-lg text-muted-foreground">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No milestones defined yet.</p>
                    <p className="text-xs mt-1">Milestones are optional but help track key deliverables.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {milestones.map((milestone, index) => (
                      <Card key={milestone.id} className="bg-muted/30">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  value={milestone.name}
                                  onChange={(e) => {
                                    const newMs = [...milestones];
                                    newMs[index].name = e.target.value;
                                    setMilestones(newMs);
                                  }}
                                  className="h-8"
                                  placeholder="Milestone name..."
                                />
                                <Input
                                  type="date"
                                  value={milestone.targetDate}
                                  onChange={(e) => {
                                    const newMs = [...milestones];
                                    newMs[index].targetDate = e.target.value;
                                    setMilestones(newMs);
                                  }}
                                  className="h-8"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <Select
                                  value={milestone.stageId}
                                  onValueChange={(v) => {
                                    const newMs = [...milestones];
                                    newMs[index].stageId = v;
                                    setMilestones(newMs);
                                  }}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Select stage..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {stages.length > 0 ? (
                                      stages.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>{s.name || `Stage ${stages.indexOf(s) + 1}`}</SelectItem>
                                      ))
                                    ) : (
                                      <div className="text-sm text-muted-foreground px-2 py-1.5">No stages defined</div>
                                    )}
                                  </SelectContent>
                                </Select>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`billing-gate-${milestone.id}`}
                                    checked={milestone.isBillingGate}
                                    onChange={(e) => {
                                      const newMs = [...milestones];
                                      newMs[index].isBillingGate = e.target.checked;
                                      setMilestones(newMs);
                                    }}
                                    className="h-4 w-4"
                                  />
                                  <Label htmlFor={`billing-gate-${milestone.id}`} className="text-sm">
                                    Billing Gate
                                  </Label>
                                </div>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => removeMilestone(index)}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-0 z-10 bg-background pt-4 border-t mt-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex gap-4">
            <span>{stages.length} stage{stages.length !== 1 ? 's' : ''}</span>
            <span>{stages.reduce((acc, s) => acc + s.tasks.length, 0)} task draft{stages.reduce((acc, s) => acc + s.tasks.length, 0) !== 1 ? 's' : ''}</span>
            <span>{milestones.length} milestone{milestones.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="text-xs">
            Tasks will be created based on the scope (Once vs Per Epic) when the project is finalized.
          </div>
        </div>
      </div>
    </div>
  );
}
