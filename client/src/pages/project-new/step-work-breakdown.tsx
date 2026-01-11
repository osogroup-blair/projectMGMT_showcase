import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Package, 
  FileBox, 
  Plus, 
  Trash2, 
  Upload, 
  Calendar, 
  ChevronDown,
  ChevronRight,
  ListTodo,
  GripVertical
} from "lucide-react";
import { StepProps, WizardEpic, WizardEpicTask, WizardDeliverable } from "./types";
import { useRef, useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";

export function StepWorkBreakdown({
  deliverables,
  setDeliverables,
  projectData,
  onFileUpload,
  deliverableTemplates = [],
  epicTemplates = [],
}: StepProps) {
  const epicInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const { toast } = useToast();
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());

  const toggleEpicExpanded = (epicId: string) => {
    setExpandedEpics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(epicId)) {
        newSet.delete(epicId);
      } else {
        newSet.add(epicId);
      }
      return newSet;
    });
  };

  const addEpic = useCallback((deliverableIndex: number, focusNew: boolean = false) => {
    const epicId = `e-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const deliverable = deliverables[deliverableIndex];
    const newD = [...deliverables];
    const newEpic: WizardEpic = {
      id: epicId,
      title: "",
      description: "",
      startDate: deliverable.startDate,
      endDate: deliverable.endDate,
      tasks: []
    };
    newD[deliverableIndex].epics.push(newEpic);
    setDeliverables(newD);
    
    if (focusNew) {
      setTimeout(() => {
        const input = epicInputRefs.current.get(epicId);
        if (input) input.focus();
      }, 50);
    }
  }, [deliverables, setDeliverables]);

  const removeEpic = useCallback((deliverableIndex: number, epicIndex: number) => {
    if (deliverables[deliverableIndex].epics.length <= 1) {
      toast({
        title: "Cannot remove last epic",
        description: "Each deliverable must have at least one epic for task alignment.",
        variant: "destructive"
      });
      return;
    }
    const newD = [...deliverables];
    newD[deliverableIndex].epics.splice(epicIndex, 1);
    setDeliverables(newD);
  }, [deliverables, setDeliverables, toast]);

  const addTaskToEpic = useCallback((deliverableIndex: number, epicIndex: number) => {
    const newD = [...deliverables];
    const epic = newD[deliverableIndex].epics[epicIndex];
    if (!epic.tasks) epic.tasks = [];
    
    const newTask: WizardEpicTask = {
      id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: "",
      priority: "medium",
      estimateHours: 0
    };
    epic.tasks.push(newTask);
    setDeliverables(newD);
    
    setExpandedEpics(prev => new Set(prev).add(epic.id));
  }, [deliverables, setDeliverables]);

  const removeTaskFromEpic = useCallback((deliverableIndex: number, epicIndex: number, taskIndex: number) => {
    const newD = [...deliverables];
    newD[deliverableIndex].epics[epicIndex].tasks?.splice(taskIndex, 1);
    setDeliverables(newD);
  }, [deliverables, setDeliverables]);

  const updateDeliverableDates = useCallback((dIndex: number, field: 'startDate' | 'endDate', value: string) => {
    const newD = [...deliverables];
    newD[dIndex][field] = value;
    
    newD[dIndex].epics = newD[dIndex].epics.map(epic => ({
      ...epic,
      startDate: field === 'startDate' ? value : epic.startDate,
      endDate: field === 'endDate' ? value : epic.endDate
    }));
    
    setDeliverables(newD);
  }, [deliverables, setDeliverables]);

  const handleEpicKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    deliverableIndex: number,
    epicIndex: number,
    epicTitle: string
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEpic(deliverableIndex, true);
    } else if (e.key === 'Backspace' && epicTitle === '') {
      e.preventDefault();
      if (deliverables[deliverableIndex].epics.length > 1 || epicIndex > 0) {
        removeEpic(deliverableIndex, epicIndex);
        const prevEpicIndex = epicIndex - 1;
        if (prevEpicIndex >= 0) {
          const prevEpic = deliverables[deliverableIndex].epics[prevEpicIndex];
          setTimeout(() => {
            const input = epicInputRefs.current.get(prevEpic.id);
            if (input) input.focus();
          }, 50);
        }
      }
    }
  };

  const createNewDeliverable = (): WizardDeliverable => ({
    id: `d-${Date.now()}`,
    title: "",
    description: "",
    startDate: projectData.startDate,
    endDate: projectData.dueDate,
    epics: [{ 
      id: `e-${Date.now()}`, 
      title: "", 
      description: "",
      startDate: projectData.startDate,
      endDate: projectData.dueDate,
      tasks: []
    }]
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Work Breakdown Structure</h3>
          <p className="text-sm text-muted-foreground">Define deliverables, epics, and optionally add tasks</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="file"
              accept=".xlsx, .xls"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={onFileUpload}
            />
            <Button size="sm" variant="outline">
              <Upload className="h-4 w-4 mr-2" /> Import Excel
            </Button>
          </div>
          <Button 
            size="sm" 
            data-testid="button-add-deliverable" 
            onClick={() => setDeliverables([...deliverables, createNewDeliverable()])}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Deliverable
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[550px] pr-4">
        {deliverables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg text-muted-foreground">
            <Package className="h-8 w-8 mb-2 opacity-50" />
            <p>No deliverables added yet.</p>
            <Button 
              variant="link" 
              onClick={() => setDeliverables([createNewDeliverable()])}
            >
              Add your first deliverable
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {deliverables.map((deliverable, dIndex) => (
              <Card key={deliverable.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 p-4 pb-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <Package className="h-4 w-4 text-primary" />
                        <Input 
                          value={deliverable.title} 
                          onChange={(e) => {
                            const newD = [...deliverables];
                            newD[dIndex].title = e.target.value;
                            setDeliverables(newD);
                          }}
                          className="h-8 font-medium bg-transparent border-transparent hover:border-input focus:border-input w-full max-w-sm"
                          placeholder="Enter deliverable name..."
                          data-testid={`input-deliverable-title-${dIndex}`}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive" 
                          onClick={() => {
                            const newD = [...deliverables];
                            newD.splice(dIndex, 1);
                            setDeliverables(newD);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pl-6">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          Start:
                        </Label>
                        <Input
                          type="date"
                          value={deliverable.startDate || ""}
                          onChange={(e) => updateDeliverableDates(dIndex, 'startDate', e.target.value)}
                          className="h-7 w-36 text-xs"
                          data-testid={`input-deliverable-start-${dIndex}`}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">End:</Label>
                        <Input
                          type="date"
                          value={deliverable.endDate || ""}
                          onChange={(e) => updateDeliverableDates(dIndex, 'endDate', e.target.value)}
                          className="h-7 w-36 text-xs"
                          data-testid={`input-deliverable-end-${dIndex}`}
                        />
                      </div>
                      {deliverableTemplates.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">Type:</Label>
                          <Select
                            value={deliverable.deliverableTypeId || ""}
                            onValueChange={(value) => {
                              const newD = [...deliverables];
                              newD[dIndex].deliverableTypeId = value;
                              setDeliverables(newD);
                            }}
                          >
                            <SelectTrigger className="h-7 w-40 text-xs">
                              <SelectValue placeholder="Select type..." />
                            </SelectTrigger>
                            <SelectContent>
                              {deliverableTemplates.map((template: any) => (
                                <SelectItem key={template.id} value={template.id}>
                                  {template.title || template.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="pl-6 space-y-2 mt-2">
                    {deliverable.epics.map((epic, eIndex) => (
                      <div key={epic.id} className="space-y-1">
                        <div className="flex items-start gap-2 group">
                          <Collapsible open={expandedEpics.has(epic.id)}>
                            <div className="flex items-center gap-1">
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => toggleEpicExpanded(epic.id)}
                                >
                                  {expandedEpics.has(epic.id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                              <FileBox className="h-4 w-4 text-indigo-500" />
                            </div>
                          </Collapsible>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Input 
                                ref={(el) => {
                                  if (el) epicInputRefs.current.set(epic.id, el);
                                }}
                                value={epic.title}
                                onChange={(e) => {
                                  const newD = [...deliverables];
                                  newD[dIndex].epics[eIndex].title = e.target.value;
                                  setDeliverables(newD);
                                }}
                                onKeyDown={(e) => handleEpicKeyDown(e, dIndex, eIndex, epic.title)}
                                className="h-8 bg-transparent border hover:border-input flex-1"
                                placeholder="Enter epic name... (press Enter for new row)"
                                data-testid={`input-epic-title-${dIndex}-${eIndex}`}
                              />
                              
                              {epicTemplates.length > 0 && (
                                <Select
                                  value={epic.epicTypeId || ""}
                                  onValueChange={(value) => {
                                    const newD = [...deliverables];
                                    newD[dIndex].epics[eIndex].epicTypeId = value;
                                    setDeliverables(newD);
                                  }}
                                >
                                  <SelectTrigger className="h-8 w-32 text-xs">
                                    <SelectValue placeholder="Type..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {epicTemplates.map((template: any) => (
                                      <SelectItem key={template.id} value={template.id}>
                                        {template.title || template.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs"
                                onClick={() => addTaskToEpic(dIndex, eIndex)}
                                title="Add task to this epic"
                              >
                                <ListTodo className="h-3 w-3 mr-1" />
                                Task
                              </Button>
                              
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" 
                                onClick={() => removeEpic(dIndex, eIndex)}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>

                            <Collapsible open={expandedEpics.has(epic.id)}>
                              <CollapsibleContent>
                                {epic.tasks && epic.tasks.length > 0 && (
                                  <div className="ml-4 mt-2 space-y-2 border-l-2 border-muted pl-4">
                                    <div className="text-xs text-muted-foreground font-medium">
                                      Tasks ({epic.tasks.length})
                                    </div>
                                    {epic.tasks.map((task, tIndex) => (
                                      <div 
                                        key={task.id} 
                                        className="flex items-center gap-2 group/task bg-muted/30 rounded-md p-2"
                                      >
                                        <GripVertical className="h-3 w-3 text-muted-foreground" />
                                        <Input
                                          value={task.title}
                                          onChange={(e) => {
                                            const newD = [...deliverables];
                                            if (newD[dIndex].epics[eIndex].tasks) {
                                              newD[dIndex].epics[eIndex].tasks![tIndex].title = e.target.value;
                                            }
                                            setDeliverables(newD);
                                          }}
                                          className="h-7 text-sm flex-1"
                                          placeholder="Task title..."
                                          data-testid={`input-task-title-${dIndex}-${eIndex}-${tIndex}`}
                                        />
                                        <Select
                                          value={task.priority || "medium"}
                                          onValueChange={(value) => {
                                            const newD = [...deliverables];
                                            if (newD[dIndex].epics[eIndex].tasks) {
                                              newD[dIndex].epics[eIndex].tasks![tIndex].priority = value;
                                            }
                                            setDeliverables(newD);
                                          }}
                                        >
                                          <SelectTrigger className="h-7 w-24 text-xs">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="urgent">Urgent</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <Input
                                          type="number"
                                          value={task.estimateHours || ""}
                                          onChange={(e) => {
                                            const newD = [...deliverables];
                                            if (newD[dIndex].epics[eIndex].tasks) {
                                              newD[dIndex].epics[eIndex].tasks![tIndex].estimateHours = Number(e.target.value);
                                            }
                                            setDeliverables(newD);
                                          }}
                                          className="h-7 w-16 text-xs"
                                          placeholder="Hrs"
                                          min={0}
                                        />
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 opacity-0 group-hover/task:opacity-100"
                                          onClick={() => removeTaskFromEpic(dIndex, eIndex, tIndex)}
                                        >
                                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                                        </Button>
                                      </div>
                                    ))}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs text-muted-foreground h-7"
                                      onClick={() => addTaskToEpic(dIndex, eIndex)}
                                    >
                                      <Plus className="h-3 w-3 mr-1" /> Add another task
                                    </Button>
                                  </div>
                                )}
                              </CollapsibleContent>
                            </Collapsible>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-6 text-xs text-muted-foreground" 
                      data-testid={`button-add-epic-${deliverable.id}`} 
                      onClick={() => addEpic(dIndex, true)}
                    >
                      <Plus className="h-3 w-3 mr-2" /> Add Epic
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
