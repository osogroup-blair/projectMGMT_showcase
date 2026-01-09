import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useLocation } from "wouter";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Check, ChevronRight, ChevronLeft, Package, Layers, Settings, Plus, Trash2, Loader2, Calendar, X, GripVertical
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useFrameworkTemplates, useStageTemplates, useTaskTemplates, useUsers, useProjects, useDeliverables, useEpics, useTasks, useProjectStages } from "@/hooks/use-nexus-data";
import { format, addMonths } from "date-fns";

const STEPS = [
  { id: 1, title: "Project Basics", description: "Name, dates, and settings", icon: Settings },
  { id: 2, title: "Work Breakdown", description: "Define your epics", icon: Package },
  { id: 3, title: "Stages & Tasks", description: "Framework and task templates", icon: Layers },
];

type FrameworkChoice = "NONE" | "TEMPLATE" | "CUSTOM";

interface DraftEpic {
  id: string;
  title: string;
  description: string;
}

interface DraftTask {
  id: string;
  title: string;
  description: string;
  priority: string;
  estimateHours: number;
  scope: "PER_EPIC" | "ONCE";
  assigneeRoleId?: string;
}

interface DraftStage {
  id: string;
  name: string;
  description: string;
  order: number;
  tasks: DraftTask[];
}

function generateId() {
  return `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default function ProjectWizard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  
  const { data: frameworkTemplates = [] } = useFrameworkTemplates();
  const { data: stageTemplates = [] } = useStageTemplates();
  const { data: taskTemplates = [] } = useTaskTemplates();
  const { data: users = [] } = useUsers();
  
  const { createAsync: createProject } = useProjects();
  const { createAsync: createDeliverable } = useDeliverables();
  const { createAsync: createEpic } = useEpics();
  const { createAsync: createTask } = useTasks();
  const { createAsync: createProjectStage } = useProjectStages();
  
  const today = new Date();
  const defaultEndDate = addMonths(today, 3);
  
  const [projectData, setProjectData] = useState({
    name: "",
    description: "",
    startDate: format(today, "yyyy-MM-dd"),
    endDate: format(defaultEndDate, "yyyy-MM-dd"),
    sprintDurationWeeks: 2,
  });

  const [epics, setEpics] = useState<DraftEpic[]>([{ id: generateId(), title: "", description: "" }]);
  const [frameworkChoice, setFrameworkChoice] = useState<FrameworkChoice>("NONE");
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string>("");
  const [stages, setStages] = useState<DraftStage[]>([]);
  
  const epicInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const loadTemplateStages = (frameworkId: string) => {
    const framework = frameworkTemplates.find(f => f.id === frameworkId);
    if (framework?.defaultStages) {
      const newStages: DraftStage[] = framework.defaultStages.map((stageName: string, idx: number) => {
        const stageTemplate = stageTemplates.find(st => st.name === stageName);
        const stageTasks: DraftTask[] = stageTemplate?.defaultTasks?.map((taskTitle: string) => {
          const taskTemplate = taskTemplates.find(tt => tt.title === taskTitle);
          return {
            id: generateId(),
            title: taskTitle,
            description: taskTemplate?.description || "",
            priority: taskTemplate?.defaultPriority || "Medium",
            estimateHours: taskTemplate?.defaultEstimateHours || 2,
            scope: (taskTemplate as any)?.scope === "PER_EPIC" ? "PER_EPIC" : "ONCE",
            assigneeRoleId: taskTemplate?.assignedRoleId || undefined,
          };
        }) || [];
        
        return {
          id: generateId(),
          name: stageName,
          description: stageTemplate?.description || "",
          order: idx,
          tasks: stageTasks,
        };
      });
      setStages(newStages);
    }
  };

  const handleFrameworkChoiceChange = (choice: FrameworkChoice) => {
    setFrameworkChoice(choice);
    if (choice === "NONE") {
      setStages([]);
      setSelectedFrameworkId("");
    } else if (choice === "CUSTOM") {
      setStages([{ id: generateId(), name: "", description: "", order: 0, tasks: [] }]);
      setSelectedFrameworkId("");
    } else if (choice === "TEMPLATE") {
      setStages([]);
    }
  };

  const handleFrameworkSelect = (frameworkId: string) => {
    setSelectedFrameworkId(frameworkId);
    loadTemplateStages(frameworkId);
  };

  const handleEpicKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const newEpic = { id: generateId(), title: "", description: "" };
      const newEpics = [...epics];
      newEpics.splice(index + 1, 0, newEpic);
      setEpics(newEpics);
      setTimeout(() => {
        epicInputRefs.current[index + 1]?.focus();
      }, 0);
    } else if (e.key === "Backspace" && epics[index].title === "" && epics.length > 1) {
      e.preventDefault();
      const newEpics = epics.filter((_, i) => i !== index);
      setEpics(newEpics);
      setTimeout(() => {
        epicInputRefs.current[Math.max(0, index - 1)]?.focus();
      }, 0);
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCreateProject();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return projectData.name.trim() !== "";
      case 2:
        return epics.some(e => e.title.trim() !== "");
      case 3:
        return true;
      default:
        return true;
    }
  };

  const handleCreateProject = async () => {
    setIsCreating(true);
    try {
      const project = await createProject({
        name: projectData.name || "New Project",
        description: projectData.description || "",
        status: "Upcoming",
        startDate: projectData.startDate,
        deadline: projectData.endDate,
        progress: 0,
        sprintDurationWeeks: projectData.sprintDurationWeeks,
      });

      const createdStages: { id: string; name: string }[] = [];
      for (const stage of stages) {
        if (stage.name.trim()) {
          const createdStage = await createProjectStage({
            projectId: project.id,
            name: stage.name,
            description: stage.description || "",
            order: stage.order,
            type: "delivery",
            status: "pending",
          });
          createdStages.push({ id: createdStage.id, name: stage.name });
        }
      }

      const validEpics = epics.filter(e => e.title.trim() !== "");
      const defaultOwnerId = users[0]?.id || "1";
      
      const deliverable = await createDeliverable({
        projectId: project.id,
        title: "Main Deliverable",
        description: "Auto-generated deliverable for project epics",
        status: "Not Started",
        ownerId: defaultOwnerId,
        dueDate: projectData.endDate,
      });

      const createdEpics: { id: string; title: string }[] = [];
      for (const epic of validEpics) {
        const createdEpic = await createEpic({
          deliverableId: deliverable.id,
          title: epic.title,
          description: epic.description || "",
          status: "Not Started",
          ownerId: defaultOwnerId,
          startDate: projectData.startDate,
          endDate: projectData.endDate,
          progress: 0,
          stageIds: [],
        });
        createdEpics.push({ id: createdEpic.id, title: epic.title });
      }

      let taskCount = 0;
      for (const stage of stages) {
        const createdStage = createdStages.find(s => s.name === stage.name);
        if (!createdStage) continue;

        for (const task of stage.tasks) {
          if (!task.title.trim()) continue;

          if (task.scope === "PER_EPIC") {
            for (const epic of createdEpics) {
              await createTask({
                projectId: project.id,
                epicId: epic.id,
                stageId: createdStage.id,
                title: task.title,
                description: task.description || "",
                status: "Todo",
                priority: task.priority || "Medium",
                deadline: projectData.endDate,
                estimateHours: task.estimateHours || 2,
                effort: 1,
                tags: [],
              });
              taskCount++;
            }
          } else {
            await createTask({
              projectId: project.id,
              epicId: createdEpics[0]?.id,
              stageId: createdStage.id,
              title: task.title,
              description: task.description || "",
              status: "Todo",
              priority: task.priority || "Medium",
              deadline: projectData.endDate,
              estimateHours: task.estimateHours || 2,
              effort: 1,
              tags: [],
            });
            taskCount++;
          }
        }
      }

      toast({
        title: "Project Created!",
        description: `Created ${createdStages.length} stages, ${createdEpics.length} epics, and ${taskCount} tasks.`,
      });

      setLocation(`/projects/${project.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const addStage = () => {
    setStages([...stages, { id: generateId(), name: "", description: "", order: stages.length, tasks: [] }]);
  };

  const removeStage = (index: number) => {
    setStages(stages.filter((_, i) => i !== index));
  };

  const addTaskToStage = (stageIndex: number) => {
    const newStages = [...stages];
    newStages[stageIndex].tasks.push({
      id: generateId(),
      title: "",
      description: "",
      priority: "Medium",
      estimateHours: 2,
      scope: "ONCE",
    });
    setStages(newStages);
  };

  const removeTaskFromStage = (stageIndex: number, taskIndex: number) => {
    const newStages = [...stages];
    newStages[stageIndex].tasks = newStages[stageIndex].tasks.filter((_, i) => i !== taskIndex);
    setStages(newStages);
  };

  const updateTask = (stageIndex: number, taskIndex: number, updates: Partial<DraftTask>) => {
    const newStages = [...stages];
    newStages[stageIndex].tasks[taskIndex] = { ...newStages[stageIndex].tasks[taskIndex], ...updates };
    setStages(newStages);
  };

  const StickyActionBar = ({ position }: { position: "top" | "bottom" }) => (
    <div className={cn(
      "flex justify-between items-center py-3 px-4 bg-background border-border",
      position === "top" ? "border-b sticky top-0 z-10" : "border-t sticky bottom-0 z-10"
    )}>
      <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
        <ChevronLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      <div className="flex items-center gap-2">
        {currentStep === 3 && frameworkChoice === "NONE" && (
          <span className="text-sm text-muted-foreground">You can add stages later</span>
        )}
        <Button onClick={handleNext} disabled={!canProceed() || isCreating}>
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : currentStep === STEPS.length ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Create Project
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Project Name *</Label>
        <Input
          id="name"
          placeholder="e.g., Website Redesign"
          value={projectData.name}
          onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
          data-testid="input-project-name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Brief description of the project..."
          value={projectData.description}
          onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
          rows={3}
          data-testid="input-project-description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Input
              id="startDate"
              type="date"
              value={projectData.startDate}
              onChange={(e) => setProjectData({ ...projectData, startDate: e.target.value })}
              data-testid="input-start-date"
            />
          </div>
          <p className="text-xs text-muted-foreground">Default: Today</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Input
              id="endDate"
              type="date"
              value={projectData.endDate}
              onChange={(e) => setProjectData({ ...projectData, endDate: e.target.value })}
              data-testid="input-end-date"
            />
          </div>
          <p className="text-xs text-muted-foreground">Default: 3 months from start</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sprintDuration">Sprint Duration</Label>
        <Select
          value={String(projectData.sprintDurationWeeks)}
          onValueChange={(v) => setProjectData({ ...projectData, sprintDurationWeeks: parseInt(v) })}
        >
          <SelectTrigger data-testid="select-sprint-duration">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 week</SelectItem>
            <SelectItem value="2">2 weeks (recommended)</SelectItem>
            <SelectItem value="3">3 weeks</SelectItem>
            <SelectItem value="4">4 weeks</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Epics</h3>
          <p className="text-sm text-muted-foreground">Press Enter to add a new epic, Backspace on empty to remove</p>
        </div>
      </div>

      <div className="space-y-2">
        {epics.map((epic, index) => (
          <div key={epic.id} className="flex items-center gap-2 group">
            <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100" />
            <Input
              ref={(el) => { epicInputRefs.current[index] = el; }}
              placeholder="Epic name..."
              value={epic.title}
              onChange={(e) => {
                const newEpics = [...epics];
                newEpics[index].title = e.target.value;
                setEpics(newEpics);
              }}
              onKeyDown={(e) => handleEpicKeyDown(e, index)}
              data-testid={`input-epic-${index}`}
            />
            {epics.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100"
                onClick={() => setEpics(epics.filter((_, i) => i !== index))}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <Button variant="outline" onClick={() => setEpics([...epics, { id: generateId(), title: "", description: "" }])}>
        <Plus className="w-4 h-4 mr-2" />
        Add Epic
      </Button>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Implementation Framework</Label>
        <div className="grid grid-cols-3 gap-3">
          <Card
            className={cn(
              "cursor-pointer transition-all hover:border-primary",
              frameworkChoice === "NONE" && "border-primary ring-2 ring-primary/20"
            )}
            onClick={() => handleFrameworkChoiceChange("NONE")}
            data-testid="card-framework-none"
          >
            <CardHeader className="p-4">
              <CardTitle className="text-sm">No Stages Yet</CardTitle>
              <CardDescription className="text-xs">Create project first, add stages later</CardDescription>
            </CardHeader>
          </Card>
          
          <Card
            className={cn(
              "cursor-pointer transition-all hover:border-primary",
              frameworkChoice === "TEMPLATE" && "border-primary ring-2 ring-primary/20"
            )}
            onClick={() => handleFrameworkChoiceChange("TEMPLATE")}
            data-testid="card-framework-template"
          >
            <CardHeader className="p-4">
              <CardTitle className="text-sm">Use Template</CardTitle>
              <CardDescription className="text-xs">Start with predefined stages & tasks</CardDescription>
            </CardHeader>
          </Card>
          
          <Card
            className={cn(
              "cursor-pointer transition-all hover:border-primary",
              frameworkChoice === "CUSTOM" && "border-primary ring-2 ring-primary/20"
            )}
            onClick={() => handleFrameworkChoiceChange("CUSTOM")}
            data-testid="card-framework-custom"
          >
            <CardHeader className="p-4">
              <CardTitle className="text-sm">Custom Framework</CardTitle>
              <CardDescription className="text-xs">Define your own stages & tasks</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {frameworkChoice === "TEMPLATE" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Framework Template</Label>
            <Select value={selectedFrameworkId} onValueChange={handleFrameworkSelect}>
              <SelectTrigger data-testid="select-framework">
                <SelectValue placeholder="Choose a framework..." />
              </SelectTrigger>
              <SelectContent>
                {frameworkTemplates.map((fw) => (
                  <SelectItem key={fw.id} value={fw.id}>{fw.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {(frameworkChoice === "TEMPLATE" && selectedFrameworkId) || frameworkChoice === "CUSTOM" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Stages & Tasks</h3>
            <Button variant="outline" size="sm" onClick={addStage}>
              <Plus className="w-4 h-4 mr-2" />
              Add Stage
            </Button>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <Accordion type="multiple" defaultValue={stages.map(s => s.id)} className="space-y-2">
              {stages.map((stage, stageIndex) => (
                <AccordionItem key={stage.id} value={stage.id} className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-3 flex-1">
                      <Badge variant="outline">{stageIndex + 1}</Badge>
                      <span className="font-medium">{stage.name || "Unnamed Stage"}</span>
                      <Badge variant="secondary" className="ml-auto mr-2">
                        {stage.tasks.length} tasks
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    {frameworkChoice === "CUSTOM" && (
                      <div className="mb-4">
                        <Label className="text-sm">Stage Name</Label>
                        <Input
                          value={stage.name}
                          onChange={(e) => {
                            const newStages = [...stages];
                            newStages[stageIndex].name = e.target.value;
                            setStages(newStages);
                          }}
                          placeholder="Enter stage name..."
                          className="mt-1"
                          data-testid={`input-stage-name-${stageIndex}`}
                        />
                      </div>
                    )}
                    <div className="space-y-3">
                      {stage.tasks.map((task, taskIndex) => (
                        <div key={task.id} className="flex items-start gap-2 p-3 border rounded-lg bg-muted/30">
                          <div className="flex-1 space-y-2">
                            <Input
                              value={task.title}
                              onChange={(e) => updateTask(stageIndex, taskIndex, { title: e.target.value })}
                              placeholder="Task title..."
                              data-testid={`input-task-title-${stageIndex}-${taskIndex}`}
                            />
                            <div className="flex items-center gap-2">
                              <Select
                                value={task.priority}
                                onValueChange={(v) => updateTask(stageIndex, taskIndex, { priority: v })}
                              >
                                <SelectTrigger className="w-[100px]">
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
                                className="w-[80px]"
                                min={0}
                              />
                              <span className="text-sm text-muted-foreground">hrs</span>
                              <div className="flex items-center gap-2 ml-4">
                                <Checkbox
                                  id={`scope-${stage.id}-${task.id}`}
                                  checked={task.scope === "PER_EPIC"}
                                  onCheckedChange={(checked) => updateTask(stageIndex, taskIndex, { scope: checked ? "PER_EPIC" : "ONCE" })}
                                />
                                <Label htmlFor={`scope-${stage.id}-${task.id}`} className="text-sm cursor-pointer">
                                  Create per epic
                                </Label>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeTaskFromStage(stageIndex, taskIndex)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => addTaskToStage(stageIndex)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Task
                      </Button>
                    </div>
                    {frameworkChoice === "CUSTOM" && (
                      <div className="mt-3 pt-3 border-t">
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeStage(stageIndex)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove Stage
                        </Button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </div>
      ) : null}
    </div>
  );

  return (
    <Shell>
      <div className="max-w-4xl mx-auto py-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Create New Project</h1>
          <p className="text-muted-foreground">Set up your project in 3 simple steps</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                    isActive && "bg-primary text-primary-foreground",
                    isCompleted && "bg-primary/20 text-primary",
                    !isActive && !isCompleted && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <StepIcon className="w-4 h-4" />
                  )}
                  <span className="font-medium text-sm hidden sm:block">{step.title}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground" />
                )}
              </div>
            );
          })}
        </div>

        <Card>
          <StickyActionBar position="top" />
          <CardContent className="p-6">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </CardContent>
          <StickyActionBar position="bottom" />
        </Card>
      </div>
    </Shell>
  );
}
