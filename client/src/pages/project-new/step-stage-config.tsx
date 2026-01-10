import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Trash2, 
  Layers, 
  ListTodo,
  Target,
  LayoutTemplate,
  PanelRightOpen,
  Calendar,
  Info
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StepProps, WizardStage, WizardTaskDraft, WizardMilestone } from "./types";

export function StepStageConfig({
  stages,
  setStages,
  milestones,
  setMilestones,
  frameworkTemplates,
  stageTemplates,
  taskTemplates,
  users,
}: StepProps) {
  const [activeTab, setActiveTab] = useState<'stages' | 'milestones'>('stages');
  const [expandedStages, setExpandedStages] = useState<string[]>([]);
  const [expandedMilestones, setExpandedMilestones] = useState<string[]>([]);
  const [frameworkPanelOpen, setFrameworkPanelOpen] = useState(false);

  const getDefaultRule = (): WizardMilestone['rule'] => ({
    scopeType: 'stage',
    scopeEntityId: stages[0]?.id || "",
    completionMode: 'all_tasks',
    completionTargetPercent: 100
  });

  const getMilestoneRule = (milestone: WizardMilestone): WizardMilestone['rule'] => {
    return milestone.rule || getDefaultRule();
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
    setExpandedStages([...expandedStages, newStage.id]);
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
      order: stage.tasks.length,
      startDate: stage.startDate || "",
      deadline: stage.endDate || "",
      datesInheritedFromStage: !!(stage.startDate || stage.endDate)
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
      order: stage.tasks.length,
      startDate: stage.startDate || "",
      deadline: stage.endDate || "",
      datesInheritedFromStage: !!(stage.startDate || stage.endDate)
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
      targetDate: "",
      ownerId: users[0]?.id || "",
      isBillingGate: false,
      rule: {
        scopeType: 'stage',
        scopeEntityId: stages[0]?.id || "",
        completionMode: 'all_tasks',
        completionTargetPercent: 100
      }
    };
    setMilestones([...milestones, newMilestone]);
    setExpandedMilestones([...expandedMilestones, newMilestone.id]);
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
    setExpandedStages([...expandedStages, newStage.id]);
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
    setExpandedStages(frameworkStages.map(s => s.id));
    setFrameworkPanelOpen(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-background pb-4 border-b mb-4">
        <div className="flex justify-end items-center">
          <Sheet open={frameworkPanelOpen} onOpenChange={setFrameworkPanelOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-apply-framework">
                <LayoutTemplate className="h-4 w-4 mr-2" /> Apply Framework
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <LayoutTemplate className="h-5 w-5" /> Apply Framework
                </SheetTitle>
                <SheetDescription>
                  Select a framework to pre-populate stages and tasks. This will replace your current configuration.
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-180px)] mt-6">
                <div className="space-y-3 pr-4">
                  {frameworkTemplates && frameworkTemplates.length > 0 ? (
                    <>
                      {frameworkTemplates.map((framework: any) => (
                        <Card 
                          key={framework.id} 
                          className="cursor-pointer hover:border-primary transition-colors"
                          onClick={() => applyFramework(framework.id)}
                          data-testid={`card-framework-${framework.id}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium">{framework.name}</div>
                                <div className="text-sm text-muted-foreground mt-1">{framework.description}</div>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                              {framework.defaultStages?.length > 0 && (
                                <Badge variant="secondary">
                                  {framework.defaultStages.length} stages
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      <div className="pt-4 border-t mt-4">
                        <p className="text-sm font-medium mb-3">Or add individual stage templates:</p>
                        <Select onValueChange={applyStageTemplate}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a stage template..." />
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
                    </>
                  ) : (
                    <div className="text-center p-6 text-muted-foreground border-2 border-dashed rounded-lg">
                      <LayoutTemplate className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No frameworks available.</p>
                      <p className="text-xs mt-1">Add stages manually using the Stages tab.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'stages' | 'milestones')} className="flex-1">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="stages" className="flex items-center gap-2">
            <Layers className="h-4 w-4" /> Stages ({stages.length})
          </TabsTrigger>
          <TabsTrigger value="milestones" className="flex items-center gap-2">
            <Target className="h-4 w-4" /> Milestones ({milestones.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stages" className="mt-0">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={addStage} data-testid="button-add-stage">
              <Plus className="h-4 w-4 mr-2" /> Add Stage
            </Button>
          </div>
          
          <ScrollArea className="h-[400px] pr-4">
            {stages.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
                <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No stages defined yet.</p>
                <p className="text-sm mt-1">Click "Add Stage" or use "Apply Framework" to get started.</p>
              </div>
            ) : (
              <Accordion 
                type="multiple" 
                value={expandedStages}
                onValueChange={setExpandedStages}
                className="space-y-2"
              >
                {stages.map((stage, stageIndex) => (
                  <AccordionItem 
                    key={stage.id} 
                    value={stage.id}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3 flex-1 mr-4">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                          {stageIndex + 1}
                        </div>
                        <span className="font-medium text-left flex-1">
                          {stage.name || `Stage ${stageIndex + 1}`}
                        </span>
                        {stage.startDate && stage.endDate && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {new Date(stage.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(stage.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        <Badge variant="outline" className="shrink-0">
                          {stage.tasks.length} Tasks
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-3">
                          <Label className="text-sm shrink-0">Stage Name:</Label>
                          <Input
                            value={stage.name}
                            onChange={(e) => {
                              const newStages = [...stages];
                              newStages[stageIndex].name = e.target.value;
                              setStages(newStages);
                            }}
                            className="h-8 flex-1"
                            placeholder="Enter stage name..."
                            data-testid={`input-stage-name-${stageIndex}`}
                          />
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-destructive shrink-0"
                            onClick={() => removeStage(stageIndex)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Remove
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm text-muted-foreground shrink-0">Start:</Label>
                            <Input
                              type="date"
                              value={stage.startDate || ""}
                              onChange={(e) => {
                                const newStages = [...stages];
                                newStages[stageIndex].startDate = e.target.value;
                                setStages(newStages);
                              }}
                              className="h-8 w-36"
                              data-testid={`input-stage-start-${stageIndex}`}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm text-muted-foreground shrink-0">End:</Label>
                            <Input
                              type="date"
                              value={stage.endDate || ""}
                              onChange={(e) => {
                                const newStages = [...stages];
                                newStages[stageIndex].endDate = e.target.value;
                                setStages(newStages);
                              }}
                              className="h-8 w-36"
                              data-testid={`input-stage-end-${stageIndex}`}
                            />
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                                  <Info className="h-3 w-3" />
                                  <span>Tasks inherit these dates</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[220px]">
                                <p className="text-xs">New tasks will inherit the stage's start and end dates by default. You can override dates on individual tasks.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        
                        <div className="flex items-center gap-4 py-2 px-3 bg-muted/50 rounded-md">
                          <Label className="text-sm text-muted-foreground shrink-0">Task Creation Mode:</Label>
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
                                  {mode === 'per_epic' ? 'Per Epic' : mode === 'none' ? 'None' : 'Once'}
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
                                        <div className="flex items-center gap-2 pt-1">
                                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                          <div className="flex items-center gap-2 flex-1">
                                            <Input
                                              type="date"
                                              value={task.startDate || ""}
                                              onChange={(e) => updateTask(stageIndex, taskIndex, { 
                                                startDate: e.target.value,
                                                datesInheritedFromStage: false 
                                              })}
                                              className="h-7 text-xs w-32"
                                              data-testid={`input-task-start-${stageIndex}-${taskIndex}`}
                                            />
                                            <span className="text-xs text-muted-foreground">to</span>
                                            <Input
                                              type="date"
                                              value={task.deadline || ""}
                                              onChange={(e) => updateTask(stageIndex, taskIndex, { 
                                                deadline: e.target.value,
                                                datesInheritedFromStage: false 
                                              })}
                                              className="h-7 text-xs w-32"
                                              data-testid={`input-task-deadline-${stageIndex}-${taskIndex}`}
                                            />
                                            {task.datesInheritedFromStage && (
                                              <TooltipProvider>
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <Badge variant="secondary" className="text-xs gap-1 cursor-help">
                                                      <Info className="h-3 w-3" />
                                                      Inherited
                                                    </Badge>
                                                  </TooltipTrigger>
                                                  <TooltipContent side="top" className="max-w-[200px]">
                                                    <p className="text-xs">Dates inherited from stage. Edit to override.</p>
                                                  </TooltipContent>
                                                </Tooltip>
                                              </TooltipProvider>
                                            )}
                                          </div>
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
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="milestones" className="mt-0">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={addMilestone} data-testid="button-add-milestone">
              <Plus className="h-4 w-4 mr-2" /> Add Milestone
            </Button>
          </div>
          
          <ScrollArea className="h-[400px] pr-4">
            {milestones.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No milestones defined yet.</p>
                <p className="text-sm mt-1">Milestones are optional but help track key deliverables.</p>
              </div>
            ) : (
              <Accordion 
                type="multiple" 
                value={expandedMilestones}
                onValueChange={setExpandedMilestones}
                className="space-y-2"
              >
                {milestones.map((milestone, index) => {
                  const rule = getMilestoneRule(milestone);
                  return (
                  <AccordionItem 
                    key={milestone.id} 
                    value={milestone.id}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3 flex-1 mr-4">
                        <Target className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-medium text-left flex-1">
                          {milestone.name || `Milestone ${index + 1}`}
                        </span>
                        {milestone.isBillingGate && (
                          <Badge variant="secondary" className="shrink-0">
                            Billing Gate
                          </Badge>
                        )}
                        {milestone.targetDate && (
                          <Badge variant="outline" className="shrink-0">
                            {new Date(milestone.targetDate).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-sm">Milestone Name</Label>
                            <Input
                              value={milestone.name}
                              onChange={(e) => {
                                const newMs = [...milestones];
                                newMs[index].name = e.target.value;
                                setMilestones(newMs);
                              }}
                              className="h-9"
                              placeholder="Enter milestone name..."
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-sm">Target Date</Label>
                            <Input
                              type="date"
                              value={milestone.targetDate}
                              onChange={(e) => {
                                const newMs = [...milestones];
                                newMs[index].targetDate = e.target.value;
                                setMilestones(newMs);
                              }}
                              className="h-9"
                            />
                          </div>
                        </div>
                        
                        <Card className="bg-muted/30">
                          <CardHeader className="pb-2 pt-3 px-4">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                              <Target className="h-4 w-4" /> Scope Rule
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                              Define which tasks must be completed for this milestone
                            </p>
                          </CardHeader>
                          <CardContent className="px-4 pb-4 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Scope Type</Label>
                                <Select
                                  value={rule.scopeType}
                                  onValueChange={(v) => {
                                    const newMs = [...milestones];
                                    if (!newMs[index].rule) {
                                      newMs[index].rule = getDefaultRule();
                                    }
                                    newMs[index].rule.scopeType = v as any;
                                    newMs[index].rule.scopeEntityId = undefined;
                                    setMilestones(newMs);
                                  }}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="stage">All tasks in Stage</SelectItem>
                                    <SelectItem value="deliverable">All tasks in Deliverable</SelectItem>
                                    <SelectItem value="epic">All tasks in Epic</SelectItem>
                                    <SelectItem value="all">All project tasks</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              {rule.scopeType === 'stage' && (
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Stage</Label>
                                  <Select
                                    value={rule.scopeEntityId || ""}
                                    onValueChange={(v) => {
                                      const newMs = [...milestones];
                                      if (!newMs[index].rule) {
                                        newMs[index].rule = getDefaultRule();
                                      }
                                      newMs[index].rule.scopeEntityId = v;
                                      setMilestones(newMs);
                                    }}
                                  >
                                    <SelectTrigger className="h-9">
                                      <SelectValue placeholder="Select stage..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {stages.length > 0 ? (
                                        stages.map((s, idx) => (
                                          <SelectItem key={s.id} value={s.id}>
                                            {s.name || `Stage ${idx + 1}`}
                                          </SelectItem>
                                        ))
                                      ) : (
                                        <div className="text-sm text-muted-foreground px-2 py-1.5">No stages defined</div>
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                              
                              {rule.scopeType === 'all' && (
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Entity</Label>
                                  <div className="h-9 flex items-center text-sm text-muted-foreground px-3 border rounded-md bg-background">
                                    All tasks in project
                                  </div>
                                </div>
                              )}
                              
                              {(rule.scopeType === 'deliverable' || rule.scopeType === 'epic') && (
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">
                                    {rule.scopeType === 'deliverable' ? 'Deliverable' : 'Epic'}
                                  </Label>
                                  <div className="h-9 flex items-center text-sm text-muted-foreground px-3 border rounded-md bg-background italic">
                                    Selected at runtime
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Completion Mode</Label>
                                <Select
                                  value={rule.completionMode}
                                  onValueChange={(v) => {
                                    const newMs = [...milestones];
                                    if (!newMs[index].rule) {
                                      newMs[index].rule = getDefaultRule();
                                    }
                                    newMs[index].rule.completionMode = v as any;
                                    setMilestones(newMs);
                                  }}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all_tasks">All tasks completed</SelectItem>
                                    <SelectItem value="percentage">Percentage completed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              {rule.completionMode === 'percentage' && (
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Target %</Label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      min="1"
                                      max="100"
                                      value={rule.completionTargetPercent || 100}
                                      onChange={(e) => {
                                        const newMs = [...milestones];
                                        if (!newMs[index].rule) {
                                          newMs[index].rule = getDefaultRule();
                                        }
                                        newMs[index].rule.completionTargetPercent = parseInt(e.target.value) || 100;
                                        setMilestones(newMs);
                                      }}
                                      className="h-9"
                                    />
                                    <span className="text-sm text-muted-foreground">%</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-3">
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
                            <Label htmlFor={`billing-gate-${milestone.id}`} className="text-sm cursor-pointer">
                              Billing Gate
                            </Label>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-destructive"
                            onClick={() => removeMilestone(index)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Remove Milestone
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )})}
              </Accordion>
            )}
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
            Tasks will be created based on scope (Once vs Per Epic) when the project is finalized.
          </div>
        </div>
      </div>
    </div>
  );
}
