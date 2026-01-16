import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  MouseSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Trash2, 
  Layers, 
  ListTodo,
  Target,
  LayoutTemplate,
  Calendar,
  Info,
  Upload,
  AlertTriangle,
  Merge,
  Replace,
  User,
  Check,
  Pencil,
  GripVertical,
  ChevronDown
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StepProps, WizardStage, WizardTaskDraft, WizardMilestone } from "./types";
import { useImportOptional } from "@/context/import-context";

interface SortableStageItemProps {
  stage: WizardStage;
  stageIndex: number;
  stages: WizardStage[];
  setStages: (stages: WizardStage[]) => void;
  milestoneOptions: Array<{ value: string; label: string }>;
  teamMemberOptions: Array<{ value: string; label: string }>;
  taskTypes: any[];
  priorityOptions: Array<{ value: string; label: string }>;
  addTaskToStage: (stageIndex: number) => void;
  removeTaskFromStage: (stageIndex: number, taskIndex: number) => void;
  updateTask: (stageIndex: number, taskIndex: number, updates: Partial<WizardTaskDraft>) => void;
  removeStage: (index: number) => void;
}

function SortableStageItem({
  stage,
  stageIndex,
  stages,
  setStages,
  milestoneOptions,
  teamMemberOptions,
  taskTypes,
  priorityOptions,
  addTaskToStage,
  removeTaskFromStage,
  updateTask,
  removeStage,
}: SortableStageItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id });
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const selectAllTasks = () => {
    setSelectedTaskIds(new Set(stage.tasks.map(t => t.id)));
  };

  const clearSelection = () => {
    setSelectedTaskIds(new Set());
  };

  const bulkUpdateTasks = (updates: Partial<WizardTaskDraft>) => {
    const newStages = [...stages];
    newStages[stageIndex].tasks = newStages[stageIndex].tasks.map(task => 
      selectedTaskIds.has(task.id) ? { ...task, ...updates } : task
    );
    setStages(newStages);
  };
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <AccordionItem 
      key={stage.id} 
      value={stage.id}
      ref={setNodeRef}
      style={style}
      className="border rounded-lg px-4 bg-muted/40"
    >
      <AccordionTrigger className="hover:no-underline py-3">
        <div className="flex items-center gap-3 flex-1 mr-4">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 -ml-2 hover:bg-muted rounded"
            onClick={(e) => e.stopPropagation()}
            data-testid={`stage-drag-handle-${stageIndex}`}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
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
          {stage.isFromImport && (
            <Badge variant="secondary" className="shrink-0 bg-blue-100 text-blue-700 border-blue-200">
              <Upload className="h-3 w-3 mr-1" />
              Imported
            </Badge>
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
                      // Update all existing tasks in this stage to match the new scope
                      if (mode === 'once' || mode === 'per_epic') {
                        newStages[stageIndex].tasks = newStages[stageIndex].tasks.map(task => ({
                          ...task,
                          scope: mode
                        }));
                      }
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
                <ListTodo className="h-4 w-4" /> Tasks ({stage.tasks.length})
              </Label>
              <Button size="sm" variant="outline" onClick={() => addTaskToStage(stageIndex)}>
                <Plus className="h-3 w-3 mr-1" /> Add Task
              </Button>
            </div>

            {/* Bulk Edit Bar */}
            {stage.tasks.length > 0 && (
              <div className="flex items-center gap-2 p-2 bg-background border rounded-lg">
                <input
                  type="checkbox"
                  checked={selectedTaskIds.size === stage.tasks.length && stage.tasks.length > 0}
                  onChange={(e) => e.target.checked ? selectAllTasks() : clearSelection()}
                  className="h-4 w-4"
                />
                <span className="text-xs text-muted-foreground">
                  {selectedTaskIds.size > 0 ? `${selectedTaskIds.size} selected` : 'Select all'}
                </span>
                {selectedTaskIds.size > 0 && (
                  <>
                    <div className="h-4 border-l mx-1" />
                    <SearchableSelect
                      value=""
                      onValueChange={(v) => bulkUpdateTasks({ assigneeId: v || undefined })}
                      placeholder="Set Assignee"
                      options={teamMemberOptions}
                      triggerClassName="h-7 text-xs w-32"
                    />
                    <SearchableSelect
                      value=""
                      onValueChange={(v) => bulkUpdateTasks({ milestoneId: v || undefined })}
                      placeholder="Set Milestone"
                      options={[{ value: "", label: "No Milestone" }, ...milestoneOptions]}
                      triggerClassName="h-7 text-xs w-32"
                    />
                    <SearchableSelect
                      value=""
                      onValueChange={(v) => { if (v) bulkUpdateTasks({ priority: v }); }}
                      placeholder="Set Priority"
                      options={priorityOptions}
                      triggerClassName="h-7 text-xs w-28"
                    />
                    {taskTypes.length > 0 && (
                      <SearchableSelect
                        value=""
                        onValueChange={(v) => { if (v) bulkUpdateTasks({ taskTypeId: v || undefined }); }}
                        placeholder="Set Type"
                        options={taskTypes.map((type: any) => ({
                          value: type.id,
                          label: type.label || type.name
                        }))}
                        triggerClassName="h-7 text-xs w-28"
                      />
                    )}
                    <SearchableSelect
                      value=""
                      onValueChange={(v) => { if (v) bulkUpdateTasks({ scope: v as 'once' | 'per_epic' }); }}
                      placeholder="Set Mode"
                      options={[
                        { value: "once", label: "Once" },
                        { value: "per_epic", label: "Per Epic" }
                      ]}
                      triggerClassName="h-7 text-xs w-28"
                    />
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 text-xs"
                      onClick={clearSelection}
                    >
                      Clear
                    </Button>
                  </>
                )}
              </div>
            )}

            {stage.tasks.length === 0 ? (
              <div className="text-center p-4 border border-dashed rounded text-muted-foreground text-sm">
                No tasks defined. Click "Add Task" to create tasks.
              </div>
            ) : (
              <div className="space-y-2">
                {stage.tasks.map((task, taskIndex) => (
                  <Card key={task.id} className={`${task.isFromImport ? 'bg-blue-50/50 border-blue-200' : 'bg-background'} ${selectedTaskIds.has(task.id) ? 'ring-2 ring-primary/50' : ''}`}>
                    <CardContent className="p-2">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedTaskIds.has(task.id)}
                            onChange={() => toggleTaskSelection(task.id)}
                            className="h-4 w-4 shrink-0"
                          />
                          <Input
                            value={task.title}
                            onChange={(e) => updateTask(stageIndex, taskIndex, { title: e.target.value })}
                            className="h-8 flex-1"
                            placeholder="Task title..."
                          />
                          {task.isFromImport && (
                            <Badge variant="secondary" className="shrink-0 bg-blue-100 text-blue-700 border-blue-200 text-xs">
                              <Upload className="h-2.5 w-2.5 mr-1" />
                              Imported
                            </Badge>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 shrink-0"
                            onClick={() => removeTaskFromStage(stageIndex, taskIndex)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1 border rounded px-2 py-1">
                            <span className="text-xs text-muted-foreground">Mode:</span>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name={`task-scope-${task.id}`}
                                checked={task.scope === 'once'}
                                onChange={() => updateTask(stageIndex, taskIndex, { scope: 'once' })}
                                className="h-3 w-3"
                              />
                              <span className="text-xs">Once</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name={`task-scope-${task.id}`}
                                checked={task.scope === 'per_epic' || !task.scope}
                                onChange={() => updateTask(stageIndex, taskIndex, { scope: 'per_epic' })}
                                className="h-3 w-3"
                              />
                              <span className="text-xs">Per Epic</span>
                            </label>
                          </div>
                          <SearchableSelect
                            value={task.priority}
                            onValueChange={(v) => updateTask(stageIndex, taskIndex, { priority: v })}
                            options={priorityOptions}
                            triggerClassName="h-7 text-xs w-24"
                          />
                          {taskTypes.length > 0 && (
                            <SearchableSelect
                              value={task.taskTypeId || ""}
                              onValueChange={(v) => updateTask(stageIndex, taskIndex, { taskTypeId: v || undefined })}
                              placeholder="Type"
                              options={taskTypes.map((type: any) => ({
                                value: type.id,
                                label: type.label || type.name
                              }))}
                              triggerClassName="h-7 text-xs w-24"
                            />
                          )}
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={task.estimateHours}
                              onChange={(e) => updateTask(stageIndex, taskIndex, { estimateHours: parseInt(e.target.value) || 0 })}
                              className="h-7 text-xs w-16"
                              placeholder="Hrs"
                            />
                            <span className="text-xs text-muted-foreground">hrs</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <SearchableSelect
                              value={task.assigneeId || ""}
                              onValueChange={(v) => updateTask(stageIndex, taskIndex, { assigneeId: v || undefined })}
                              placeholder="Assignee"
                              options={teamMemberOptions}
                              triggerClassName="h-7 text-xs w-32"
                              data-testid={`select-task-assignee-${stageIndex}-${taskIndex}`}
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-3.5 w-3.5 text-muted-foreground" />
                            <SearchableSelect
                              value={task.milestoneId || ""}
                              onValueChange={(v) => updateTask(stageIndex, taskIndex, { milestoneId: v || undefined })}
                              placeholder="Milestone"
                              options={[{ value: "", label: "No Milestone" }, ...milestoneOptions]}
                              triggerClassName="h-7 text-xs w-32"
                              data-testid={`select-task-milestone-${stageIndex}-${taskIndex}`}
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
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
                                    <Badge variant="secondary" className="text-xs gap-1 cursor-help px-1">
                                      <Info className="h-3 w-3" />
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-[200px]">
                                    <p className="text-xs">Date inherited from stage. Edit to override.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>
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
  );
}

export function StepStageConfig({
  projectData,
  stages,
  setStages,
  milestones,
  setMilestones,
  frameworkTemplates,
  stageTemplates,
  taskTemplates,
  taskTypes = [],
  milestoneTemplates = [],
  roles,
  users,
}: StepProps) {
  const [activeTab, setActiveTab] = useState<'stages' | 'milestones'>('milestones');
  const [expandedStages, setExpandedStages] = useState<string[]>([]);
  const [expandedMilestones, setExpandedMilestones] = useState<string[]>([]);
  const [showClearStagesConfirm, setShowClearStagesConfirm] = useState(false);
  const [showClearMilestonesConfirm, setShowClearMilestonesConfirm] = useState(false);
  const [showFrameworkConfirm, setShowFrameworkConfirm] = useState(false);
  const [pendingFrameworkId, setPendingFrameworkId] = useState<string | null>(null);
  const [frameworkAction, setFrameworkAction] = useState<'replace' | 'merge'>('replace');
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string | null>(null);
  const [isCustomized, setIsCustomized] = useState(false);
  const [frameworkAccordionOpen, setFrameworkAccordionOpen] = useState<string[]>(['framework']);

  const importContext = useImportOptional();
  const isImportMode = importContext?.state?.isImportMode || false;

  const importStats = useMemo(() => {
    let importedStages = 0;
    let importedTasks = 0;
    stages.forEach(stage => {
      if (stage.isFromImport) importedStages++;
      stage.tasks?.forEach(task => {
        if (task.isFromImport) importedTasks++;
      });
    });
    return { importedStages, importedTasks, hasImportedData: importedStages > 0 || importedTasks > 0 };
  }, [stages]);

  const getFrameworkCounts = useMemo(() => {
    return (frameworkId: string) => {
      const framework = frameworkTemplates?.find((f: any) => f.id === frameworkId);
      if (!framework) return { stages: 0, tasks: 0, milestones: 0 };
      
      const stageIds = framework.defaultStages || [];
      let taskCount = 0;
      
      stageIds.forEach((stageId: string) => {
        const stageTemplate = stageTemplates.find((st: any) => st.id === stageId);
        if (stageTemplate?.defaultTasks) {
          taskCount += stageTemplate.defaultTasks.length;
        }
      });
      
      const milestoneCount = milestoneTemplates.filter(
        (mt: any) => stageIds.includes(mt.stageTemplateId)
      ).length;
      
      return { stages: stageIds.length, tasks: taskCount, milestones: milestoneCount };
    };
  }, [frameworkTemplates, stageTemplates, milestoneTemplates]);

  const teamMemberOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [
      { value: "", label: "Unassigned" }
    ];
    
    roles.forEach(role => {
      if (role.assigneeId) {
        const user = users.find(u => u.id === role.assigneeId);
        if (user) {
          const existingOption = options.find(o => o.value === user.id);
          if (!existingOption) {
            const displayName = user.name || user.firstName 
              ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name 
              : user.email || 'Unknown User';
            options.push({ value: user.id, label: displayName });
          }
        }
      }
    });
    
    return options;
  }, [roles, users]);

  const getDefaultRule = (): WizardMilestone['rule'] => ({
    scopeType: 'stage',
    scopeEntityId: stages[0]?.id || "",
    completionMode: 'all_tasks',
    completionTargetPercent: 100
  });

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
    setStages([newStage, ...stages]);
    setExpandedStages([newStage.id, ...expandedStages]);
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
    stage.tasks.unshift(newTask);
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
    stage.tasks.unshift(newTask);
    setStages(newStages);
  };

  const addMilestone = () => {
    const newMilestone: WizardMilestone = {
      id: `ms-${Date.now()}`,
      name: "",
      description: "",
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
    setMilestones([newMilestone, ...milestones]);
    setExpandedMilestones([newMilestone.id, ...expandedMilestones]);
  };

  const removeMilestone = (index: number) => {
    const newMilestones = [...milestones];
    newMilestones.splice(index, 1);
    setMilestones(newMilestones);
  };

  const clearAllStages = () => {
    setStages([]);
    setExpandedStages([]);
    setSelectedFrameworkId(null);
    setIsCustomized(false);
    setShowClearStagesConfirm(false);
  };

  const clearAllMilestones = () => {
    setMilestones([]);
    setExpandedMilestones([]);
    setShowClearMilestonesConfirm(false);
  };

  const updateMilestone = (index: number, updates: Partial<WizardMilestone>) => {
    const newMilestones = [...milestones];
    newMilestones[index] = { ...newMilestones[index], ...updates };
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

  const handleFrameworkClick = (frameworkId: string) => {
    if (importStats.hasImportedData) {
      setPendingFrameworkId(frameworkId);
      setShowFrameworkConfirm(true);
    } else {
      applyFramework(frameworkId, 'replace');
    }
  };

  const handleFrameworkConfirm = () => {
    if (pendingFrameworkId) {
      applyFramework(pendingFrameworkId, frameworkAction);
    }
    setShowFrameworkConfirm(false);
    setPendingFrameworkId(null);
  };

  const applyFramework = (frameworkId: string, mode: 'replace' | 'merge' = 'replace') => {
    const framework = frameworkTemplates?.find((f: any) => f.id === frameworkId);
    if (!framework) return;

    console.log('[APPLY-FRAMEWORK] Framework:', framework.name, 'ID:', frameworkId);
    console.log('[APPLY-FRAMEWORK] Task templates available:', taskTemplates?.length || 0);
    
    const stageTemplateIds = framework.defaultStages || [];
    const stageIdMap: Record<string, string> = {};

    const frameworkStages = stageTemplateIds
      .map((stageId: string, idx: number) => {
        const stageTemplate = stageTemplates.find((st: any) => st.id === stageId);
        if (!stageTemplate) return null;
        
        const stageUniqueId = `stage-${Date.now()}-${idx}`;
        stageIdMap[stageId] = stageUniqueId;
        
        console.log('[APPLY-FRAMEWORK] Stage:', stageTemplate.name, 'defaultTasks:', stageTemplate.defaultTasks);
        
        const tasks = (stageTemplate.defaultTasks || []).map((taskId: string, taskIdx: number) => {
          const taskTemplate = taskTemplates.find((t: any) => t.id === taskId);
          console.log('[APPLY-FRAMEWORK] Looking for task ID:', taskId, 'Found:', taskTemplate ? taskTemplate.title : 'NOT FOUND');
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
        }).filter(Boolean);
        
        console.log('[APPLY-FRAMEWORK] Stage', stageTemplate.name, 'created with', tasks.length, 'tasks');
        
        return {
          id: stageUniqueId,
          name: stageTemplate.name,
          description: stageTemplate.description || "",
          taskCreationMode: 'per_epic' as const,
          defaultTasks: stageTemplate.defaultTasks || [],
          defaultRoles: stageTemplate.defaultRoles || [],
          type: stageTemplate.type || 'standard',
          tasks
        };
      })
      .filter(Boolean) as WizardStage[];
    
    console.log('[APPLY-FRAMEWORK] Total stages created:', frameworkStages.length);
    console.log('[APPLY-FRAMEWORK] Total tasks:', frameworkStages.reduce((sum, s) => sum + s.tasks.length, 0));

    const frameworkMilestones: WizardMilestone[] = milestoneTemplates
      .filter((mt: any) => stageTemplateIds.includes(mt.stageTemplateId))
      .map((mt: any, idx: number) => {
        const linkedStageId = stageIdMap[mt.stageTemplateId] || frameworkStages[0]?.id || "";
        return {
          id: `ms-${Date.now()}-${idx}`,
          name: mt.name,
          description: mt.description || "",
          targetDate: "",
          ownerId: users[0]?.id || "",
          isBillingGate: mt.isBillingGate || false,
          rule: {
            scopeType: mt.scopeType || 'stage',
            scopeEntityId: linkedStageId,
            completionMode: mt.completionMode || 'all_tasks',
            completionTargetPercent: mt.completionTargetPercent || 100
          }
        };
      });

    // Calculate stage dates based on project timeline
    const projectStart = projectData?.startDate ? new Date(projectData.startDate) : new Date();
    const projectEnd = projectData?.dueDate ? new Date(projectData.dueDate) : new Date(projectStart.getTime() + 90 * 24 * 60 * 60 * 1000);
    const totalDays = Math.max(frameworkStages.length, Math.floor((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)));
    const stageCount = Math.max(1, frameworkStages.length);
    const baseDaysPerStage = Math.floor(totalDays / stageCount);
    const extraDays = totalDays % stageCount;
    
    // Set stage dates and task deadlines
    let currentStartDay = 0;
    frameworkStages.forEach((stage, idx) => {
      // Distribute extra days to earlier stages
      const stageDays = baseDaysPerStage + (idx < extraDays ? 1 : 0);
      
      const stageStart = new Date(projectStart);
      stageStart.setDate(stageStart.getDate() + currentStartDay);
      
      const stageEnd = new Date(projectStart);
      if (idx === frameworkStages.length - 1) {
        stageEnd.setTime(projectEnd.getTime());
      } else {
        stageEnd.setDate(stageEnd.getDate() + currentStartDay + Math.max(0, stageDays - 1));
      }
      
      // Ensure end date is at least equal to start date
      if (stageEnd < stageStart) {
        stageEnd.setTime(stageStart.getTime());
      }
      
      stage.startDate = stageStart.toISOString().split('T')[0];
      stage.endDate = stageEnd.toISOString().split('T')[0];
      
      currentStartDay += stageDays;
      
      // Set task deadlines to stage end date
      stage.tasks.forEach(task => {
        task.deadline = stage.endDate;
        task.datesInheritedFromStage = true;
      });
    });
    
    // Calculate milestone target dates - sequence them across project timeline
    const milestonesCount = frameworkMilestones.length;
    if (milestonesCount > 0) {
      const daysPerMilestone = Math.floor(totalDays / milestonesCount);
      frameworkMilestones.forEach((milestone, idx) => {
        const targetDate = new Date(projectStart);
        targetDate.setDate(targetDate.getDate() + ((idx + 1) * daysPerMilestone));
        // Ensure last milestone is on project end date
        if (idx === milestonesCount - 1) {
          targetDate.setTime(projectEnd.getTime());
        }
        milestone.targetDate = targetDate.toISOString().split('T')[0];
      });
    }

    if (mode === 'merge') {
      const importedStages = stages.filter(s => s.isFromImport);
      const importedMilestones = milestones.filter(m => m.isFromImport);
      const mergedStages = [...importedStages, ...frameworkStages];
      setStages(mergedStages);
      setMilestones([...importedMilestones, ...frameworkMilestones]);
      setExpandedStages([]); // Collapse all stage accordions
    } else {
      setStages(frameworkStages);
      setMilestones(frameworkMilestones);
      setExpandedStages([]); // Collapse all stage accordions
    }
    setExpandedMilestones([]);
    setSelectedFrameworkId(frameworkId);
    setIsCustomized(false);
    setActiveTab('milestones'); // Switch to milestones tab
  };

  const stageTemplateOptions = stageTemplates.map((template: any) => ({
    value: template.id,
    label: `${template.name} (${template.defaultTasks?.length || 0} tasks)`
  }));

  const priorityOptions = [
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
  ];

  const selectedFramework = selectedFrameworkId 
    ? frameworkTemplates?.find((f: any) => f.id === selectedFrameworkId)
    : null;

  const markAsCustomized = useCallback(() => {
    if (selectedFrameworkId && !isCustomized) {
      setIsCustomized(true);
    }
  }, [selectedFrameworkId, isCustomized]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = stages.findIndex(s => s.id === active.id);
      const newIndex = stages.findIndex(s => s.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newStages = arrayMove(stages, oldIndex, newIndex);
        
        // Recalculate dates proportionally if stages have dates
        const stagesWithDates = newStages.filter(s => s.startDate && s.endDate);
        if (stagesWithDates.length > 0) {
          const allDates = newStages.flatMap(s => [s.startDate, s.endDate].filter(Boolean) as string[]);
          if (allDates.length >= 2) {
            const startDates = allDates.map(d => new Date(d).getTime());
            const overallStart = Math.min(...startDates);
            const overallEnd = Math.max(...startDates);
            const totalDuration = overallEnd - overallStart;
            
            if (totalDuration > 0 && newStages.length > 0) {
              const stageDuration = totalDuration / newStages.length;
              
              newStages.forEach((stage, idx) => {
                const stageStart = new Date(overallStart + (idx * stageDuration));
                const stageEnd = new Date(overallStart + ((idx + 1) * stageDuration));
                stage.startDate = stageStart.toISOString().split('T')[0];
                stage.endDate = stageEnd.toISOString().split('T')[0];
              });
            }
          }
        }
        
        setStages(newStages);
        markAsCustomized();
      }
    }
  }, [stages, setStages, markAsCustomized]);

  const handleSelectCustom = () => {
    setSelectedFrameworkId('custom');
    setIsCustomized(false);
    if (stages.length === 0) {
      addStage();
    }
  };

  const milestoneOptions = useMemo(() => {
    return milestones.map(m => ({
      value: m.id,
      label: m.name || 'Unnamed Milestone'
    }));
  }, [milestones]);

  return (
    <div className="flex flex-col h-full">
      <AlertDialog open={showFrameworkConfirm} onOpenChange={setShowFrameworkConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Imported Data Detected
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You have <strong>{importStats.importedStages} stages</strong> and{" "}
                <strong>{importStats.importedTasks} tasks</strong> from your import file.
              </p>
              <p>How would you like to apply the framework?</p>
              <div className="grid gap-3 pt-2">
                <div
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    frameworkAction === 'merge' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground'
                  }`}
                  onClick={() => setFrameworkAction('merge')}
                  data-testid="option-merge-framework"
                >
                  <div className="flex items-center gap-2 font-medium">
                    <Merge className="h-4 w-4" />
                    Merge with Import
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Keep your imported stages and add framework stages alongside them.
                  </p>
                </div>
                <div
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    frameworkAction === 'replace' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground'
                  }`}
                  onClick={() => setFrameworkAction('replace')}
                  data-testid="option-replace-framework"
                >
                  <div className="flex items-center gap-2 font-medium">
                    <Replace className="h-4 w-4" />
                    Replace All
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Remove all current stages (including imported) and use only framework stages.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-framework-dialog">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFrameworkConfirm} data-testid="confirm-framework-action">
              {frameworkAction === 'merge' ? 'Merge' : 'Replace'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {importStats.hasImportedData && (
        <Alert className="mb-4 border-blue-200 bg-blue-50">
          <Upload className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Import Mode:</strong> {importStats.importedStages} stages and {importStats.importedTasks} tasks loaded from{" "}
            <span className="font-mono text-xs">{importContext?.state?.sourceFileName || 'import file'}</span>.
            These items are marked with an import badge.
          </AlertDescription>
        </Alert>
      )}

      <Accordion 
        type="multiple" 
        value={frameworkAccordionOpen} 
        onValueChange={setFrameworkAccordionOpen}
        className="mb-4"
      >
        <AccordionItem value="framework" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-3 flex-1">
              <LayoutTemplate className="h-5 w-5 text-primary" />
              <div className="flex-1 text-left">
                <div className="font-medium">
                  {selectedFrameworkId === 'custom' ? (
                    'Custom Configuration'
                  ) : selectedFramework ? (
                    <>
                      {selectedFramework.name}
                      {isCustomized && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          <Pencil className="h-3 w-3 mr-1" />
                          Customized
                        </Badge>
                      )}
                    </>
                  ) : (
                    'Select a Framework'
                  )}
                </div>
                {!selectedFrameworkId && (
                  <p className="text-sm text-muted-foreground font-normal">
                    Choose a framework to pre-populate stages and tasks
                  </p>
                )}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {frameworkTemplates && frameworkTemplates.map((framework: any) => {
                const counts = getFrameworkCounts(framework.id);
                const isSelected = selectedFrameworkId === framework.id;
                return (
                  <Card 
                    key={framework.id} 
                    className={`cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleFrameworkClick(framework.id)}
                    data-testid={`card-framework-${framework.id}`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium text-sm">{framework.name}</div>
                        {isSelected && (
                          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {counts.stages > 0 && (
                          <Badge variant="secondary" className="text-xs py-0">
                            {counts.stages} stages
                          </Badge>
                        )}
                        {counts.tasks > 0 && (
                          <Badge variant="outline" className="text-xs py-0">
                            {counts.tasks} tasks
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              <Card 
                className={`cursor-pointer transition-all ${
                  selectedFrameworkId === 'custom'
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5' 
                    : 'hover:border-primary/50 border-dashed'
                }`}
                onClick={handleSelectCustom}
                data-testid="card-framework-custom"
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-medium text-sm">Custom</div>
                    {selectedFrameworkId === 'custom' && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Build your own stages from scratch
                  </p>
                </CardContent>
              </Card>
            </div>

          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'stages' | 'milestones')} className="flex-1">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="milestones" className="flex items-center gap-2">
            <Target className="h-4 w-4" /> Milestones ({milestones.length})
          </TabsTrigger>
          <TabsTrigger value="stages" className="flex items-center gap-2">
            <Layers className="h-4 w-4" /> Stages ({stages.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stages" className="mt-0">
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="flex items-center gap-2">
              {stageTemplateOptions.length > 0 && (
                <SearchableSelect
                  onValueChange={(id) => {
                    applyStageTemplate(id);
                    if (selectedFrameworkId && selectedFrameworkId !== 'custom') {
                      markAsCustomized();
                    }
                  }}
                  placeholder="Add from template..."
                  options={stageTemplateOptions}
                  triggerClassName="w-48"
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              {stages.length > 0 && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-destructive hover:text-destructive"
                  onClick={() => setShowClearStagesConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Clear All
                </Button>
              )}
              <Button size="sm" onClick={addStage} data-testid="button-add-stage">
                <Plus className="h-4 w-4 mr-2" /> Add Stage
              </Button>
            </div>
          </div>
          
          <div className="pr-4">
            {stages.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
                <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No stages defined yet.</p>
                <p className="text-sm mt-1">Click "Add Stage" or use "Apply Framework" to get started.</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={stages.map(s => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <Accordion 
                    type="multiple" 
                    value={expandedStages}
                    onValueChange={setExpandedStages}
                    className="space-y-2"
                  >
                    {stages.map((stage, stageIndex) => (
                      <SortableStageItem
                        key={stage.id}
                        stage={stage}
                        stageIndex={stageIndex}
                        stages={stages}
                        setStages={setStages}
                        milestoneOptions={milestoneOptions}
                        teamMemberOptions={teamMemberOptions}
                        taskTypes={taskTypes}
                        priorityOptions={priorityOptions}
                        addTaskToStage={addTaskToStage}
                        removeTaskFromStage={removeTaskFromStage}
                        updateTask={updateTask}
                        removeStage={removeStage}
                      />
                    ))}
                  </Accordion>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </TabsContent>

        <TabsContent value="milestones" className="mt-0">
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="flex items-center gap-2">
              {/* Placeholder for future milestone template selector */}
            </div>
            <div className="flex items-center gap-2">
              {milestones.length > 0 && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-destructive hover:text-destructive"
                  onClick={() => setShowClearMilestonesConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Clear All
                </Button>
              )}
              <Button size="sm" onClick={addMilestone} data-testid="button-add-milestone">
                <Plus className="h-4 w-4 mr-2" /> Add Milestone
              </Button>
            </div>
          </div>
          
          <div className="pr-4">
            {milestones.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No milestones defined yet.</p>
                <p className="text-sm mt-1">Milestones are optional but help track key deliverables.</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-[1fr_140px_80px_40px] gap-2 p-3 bg-muted/50 border-b text-xs font-medium text-muted-foreground uppercase">
                  <div>Name</div>
                  <div>Target Date</div>
                  <div className="text-center">Billing Gate</div>
                  <div></div>
                </div>
                <div className="divide-y">
                  {milestones.map((milestone, index) => (
                    <div 
                      key={milestone.id} 
                      className="grid grid-cols-[1fr_140px_80px_40px] gap-2 p-2 items-center hover:bg-muted/30"
                    >
                      <Input
                        value={milestone.name}
                        onChange={(e) => updateMilestone(index, { name: e.target.value })}
                        className="h-8 text-sm"
                        placeholder="Milestone name..."
                      />
                      <Input
                        type="date"
                        value={milestone.targetDate}
                        onChange={(e) => updateMilestone(index, { targetDate: e.target.value })}
                        className="h-8 text-sm"
                      />
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={milestone.isBillingGate}
                          onChange={(e) => updateMilestone(index, { isBillingGate: e.target.checked })}
                          className="h-4 w-4"
                        />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeMilestone(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Clear Stages Confirmation Dialog */}
      <AlertDialog open={showClearStagesConfirm} onOpenChange={setShowClearStagesConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Clear All Stages?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all {stages.length} stages and {stages.reduce((acc, s) => acc + s.tasks.length, 0)} task drafts. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={clearAllStages} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear All Stages
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Milestones Confirmation Dialog */}
      <AlertDialog open={showClearMilestonesConfirm} onOpenChange={setShowClearMilestonesConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Clear All Milestones?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all {milestones.length} milestones. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={clearAllMilestones} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear All Milestones
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
