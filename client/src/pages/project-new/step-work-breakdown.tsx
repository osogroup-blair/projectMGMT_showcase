import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  GripVertical,
  Wand2,
  ChevronsDownUp,
  ChevronsUpDown,
  ArrowRightLeft
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { StepProps, WizardEpic, WizardEpicTask, WizardDeliverable } from "./types";
import { useRef, useCallback, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

export function StepWorkBreakdown({
  deliverables,
  setDeliverables,
  projectData,
  onFileUpload,
  deliverableTypes = [],
  epicTypes = [],
  taskTypes = [],
  stages = [],
  milestones = [],
  roles = [],
  users = [],
}: StepProps) {
  const epicInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const { toast } = useToast();
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
  const [expandedDeliverables, setExpandedDeliverables] = useState<Set<string>>(() => 
    new Set(deliverables.map(d => d.id))
  );

  const teamMemberOptions = useMemo(() => {
    const assigneeIds = roles
      .map(r => r.assigneeId)
      .filter((id): id is string => id !== null && id !== undefined);
    const uniqueIds = [...new Set(assigneeIds)];
    return uniqueIds.map(id => {
      const user = users.find((u: any) => u.id === id);
      return {
        id,
        name: user?.name || user?.firstName && user?.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : id
      };
    });
  }, [roles, users]);

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

  const toggleDeliverableExpanded = (deliverableId: string) => {
    setExpandedDeliverables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(deliverableId)) {
        newSet.delete(deliverableId);
      } else {
        newSet.add(deliverableId);
      }
      return newSet;
    });
  };

  const expandAllDeliverables = useCallback(() => {
    setExpandedDeliverables(new Set(deliverables.map(d => d.id)));
    const allEpicIds = deliverables.flatMap(d => d.epics.map(e => e.id));
    setExpandedEpics(new Set(allEpicIds));
  }, [deliverables]);

  const collapseAllDeliverables = useCallback(() => {
    setExpandedDeliverables(new Set());
    setExpandedEpics(new Set());
  }, []);

  const togglePassThrough = useCallback((dIndex: number) => {
    const newD = [...deliverables];
    newD[dIndex].isPassThrough = !newD[dIndex].isPassThrough;
    setDeliverables(newD);
  }, [deliverables, setDeliverables]);

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
    newD[deliverableIndex].epics.unshift(newEpic);
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
    epic.tasks.unshift(newTask);
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

  const updateEpicDates = useCallback((dIndex: number, eIndex: number, field: 'startDate' | 'endDate', value: string) => {
    const newD = [...deliverables];
    newD[dIndex].epics[eIndex][field] = value;
    setDeliverables(newD);
  }, [deliverables, setDeliverables]);

  const autoGenerateDates = useCallback((mode: 'sequential' | 'parallel' | 'custom', weeksPerDeliverable?: number) => {
    if (!projectData.startDate || !projectData.dueDate) {
      toast({
        title: "Missing project dates",
        description: "Please set project start and due dates in Step 1 first.",
        variant: "destructive"
      });
      return;
    }

    const startDate = new Date(projectData.startDate);
    const endDate = new Date(projectData.dueDate);
    const totalDays = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    const newDeliverables = deliverables.map((deliverable, dIndex) => {
      let dStartDate: Date;
      let dEndDate: Date;
      
      if (mode === 'parallel') {
        dStartDate = new Date(startDate);
        dEndDate = new Date(endDate);
      } else if (mode === 'sequential') {
        const daysPerDeliverable = Math.floor(totalDays / deliverables.length);
        dStartDate = new Date(startDate);
        dStartDate.setDate(dStartDate.getDate() + (dIndex * daysPerDeliverable));
        
        if (dIndex === deliverables.length - 1) {
          dEndDate = new Date(endDate);
        } else {
          dEndDate = new Date(startDate);
          dEndDate.setDate(dEndDate.getDate() + ((dIndex + 1) * daysPerDeliverable) - 1);
        }
      } else {
        const weeks = weeksPerDeliverable || 2;
        dStartDate = new Date(startDate);
        dStartDate.setDate(dStartDate.getDate() + (dIndex * weeks * 7));
        dEndDate = new Date(dStartDate);
        dEndDate.setDate(dEndDate.getDate() + (weeks * 7) - 1);
      }

      const deliverableDuration = Math.max(1, Math.floor((dEndDate.getTime() - dStartDate.getTime()) / (1000 * 60 * 60 * 24)));
      const daysPerEpic = Math.floor(deliverableDuration / (deliverable.epics.length || 1));

      const updatedEpics = deliverable.epics.map((epic, eIndex) => {
        let eStartDate = new Date(dStartDate);
        let eEndDate: Date;

        if (mode === 'parallel') {
          eEndDate = new Date(dEndDate);
        } else {
          eStartDate.setDate(eStartDate.getDate() + (eIndex * daysPerEpic));
          if (eIndex === deliverable.epics.length - 1) {
            eEndDate = new Date(dEndDate);
          } else {
            eEndDate = new Date(dStartDate);
            eEndDate.setDate(eEndDate.getDate() + ((eIndex + 1) * daysPerEpic) - 1);
          }
        }

        return {
          ...epic,
          startDate: eStartDate.toISOString().split('T')[0],
          endDate: eEndDate.toISOString().split('T')[0]
        };
      });

      return {
        ...deliverable,
        startDate: dStartDate.toISOString().split('T')[0],
        endDate: dEndDate.toISOString().split('T')[0],
        epics: updatedEpics
      };
    });

    setDeliverables(newDeliverables);
    toast({
      title: "Dates generated",
      description: `Applied ${mode} date sequencing to ${deliverables.length} deliverables and their epics.`,
    });
  }, [deliverables, projectData, setDeliverables, toast]);

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

  const bulkSetDeliverableType = (typeId: string | undefined) => {
    const newDeliverables = deliverables.map(d => ({
      ...d,
      deliverableTypeId: typeId
    }));
    setDeliverables(newDeliverables);
    toast({
      title: "Deliverable types updated",
      description: `Applied type to ${deliverables.length} deliverable${deliverables.length !== 1 ? 's' : ''}.`,
    });
  };

  const bulkSetEpicType = (typeId: string | undefined) => {
    const newDeliverables = deliverables.map(d => ({
      ...d,
      epics: d.epics.map(e => ({
        ...e,
        epicTypeId: typeId
      }))
    }));
    setDeliverables(newDeliverables);
    const totalEpics = deliverables.reduce((sum, d) => sum + d.epics.length, 0);
    toast({
      title: "Epic types updated",
      description: `Applied type to ${totalEpics} epic${totalEpics !== 1 ? 's' : ''}.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Work Breakdown Structure</h3>
          <p className="text-sm text-muted-foreground">Define deliverables, epics, and optionally add tasks</p>
        </div>
        <div className="flex gap-2">
          {deliverables.length > 0 && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline" data-testid="button-bulk-types">
                    <Package className="h-4 w-4 mr-2" /> Bulk Set Types
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64" align="end">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">All Deliverable Types</p>
                      <Select
                        onValueChange={(value) => bulkSetDeliverableType(value === "none" ? undefined : value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Set for all deliverables..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {deliverableTypes.map((type: any) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">All Epic Types</p>
                      <Select
                        onValueChange={(value) => bulkSetEpicType(value === "none" ? undefined : value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Set for all epics..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {epicTypes.map((type: any) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline" data-testid="button-auto-dates">
                    <Wand2 className="h-4 w-4 mr-2" /> Auto-generate Dates
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="end">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Date Sequencing Mode</p>
                    <p className="text-xs text-muted-foreground">
                      Choose how to distribute dates across deliverables and epics
                    </p>
                    <div className="space-y-1 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sm"
                        onClick={() => autoGenerateDates('sequential')}
                      >
                        Sequential
                        <span className="ml-auto text-xs text-muted-foreground">one after another</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sm"
                        onClick={() => autoGenerateDates('parallel')}
                      >
                        Parallel
                        <span className="ml-auto text-xs text-muted-foreground">all overlap</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sm"
                        onClick={() => autoGenerateDates('custom', 2)}
                      >
                        2-week sprints
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-sm"
                        onClick={() => autoGenerateDates('custom', 4)}
                      >
                        4-week phases
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}
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
            onClick={() => setDeliverables([createNewDeliverable(), ...deliverables])}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Deliverable
          </Button>
        </div>
      </div>

      {deliverables.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={expandAllDeliverables}
              title="Expand all"
              data-testid="button-expand-all"
            >
              <ChevronsUpDown className="h-4 w-4 mr-1" />
              Expand All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={collapseAllDeliverables}
              title="Collapse all"
              data-testid="button-collapse-all"
            >
              <ChevronsDownUp className="h-4 w-4 mr-1" />
              Collapse All
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            {deliverables.length} deliverable{deliverables.length !== 1 ? 's' : ''}, {deliverables.reduce((sum, d) => sum + d.epics.length, 0)} epic{deliverables.reduce((sum, d) => sum + d.epics.length, 0) !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      <div className="pr-4">
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
              <Collapsible 
                key={deliverable.id} 
                open={expandedDeliverables.has(deliverable.id)}
              >
                <Card className="overflow-hidden">
                  <CardHeader className="bg-muted/30 p-4 pb-3">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => toggleDeliverableExpanded(deliverable.id)}
                            >
                              {expandedDeliverables.has(deliverable.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
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
                          <span className="text-xs text-muted-foreground">
                            ({deliverable.epics.length} epic{deliverable.epics.length !== 1 ? 's' : ''})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {!deliverable.id.startsWith('d-mgmt-') && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1">
                                    <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
                                    <Switch
                                      checked={deliverable.isPassThrough || false}
                                      onCheckedChange={() => togglePassThrough(dIndex)}
                                      className="h-5 w-9"
                                      data-testid={`switch-passthrough-${dIndex}`}
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">Pass-through: When enabled, the deliverable acts as a container only. Epics will be created directly under the project.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {!deliverable.id.startsWith('d-mgmt-') ? (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive" 
                              onClick={() => {
                                const newD = [...deliverables];
                                newD.splice(dIndex, 1);
                                setDeliverables(newD);
                              }}
                              data-testid={`button-delete-deliverable-${dIndex}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground px-2" title="Protected deliverable">Required</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 pl-8">
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
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">Type:</Label>
                        <Select
                          value={deliverable.deliverableTypeId || ""}
                          onValueChange={(value) => {
                            const newD = [...deliverables];
                            newD[dIndex].deliverableTypeId = value === "none" ? undefined : value;
                            setDeliverables(newD);
                          }}
                        >
                          <SelectTrigger className="h-7 w-40 text-xs">
                            <SelectValue placeholder="Select type..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {deliverableTypes.map((type: any) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CollapsibleContent>
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
                              
                              <Select
                                value={epic.epicTypeId || ""}
                                onValueChange={(value) => {
                                  const newD = [...deliverables];
                                  newD[dIndex].epics[eIndex].epicTypeId = value === "none" ? undefined : value;
                                  setDeliverables(newD);
                                }}
                              >
                                <SelectTrigger className="h-8 w-32 text-xs">
                                  <SelectValue placeholder="Type..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {epicTypes.map((type: any) => (
                                    <SelectItem key={type.id} value={type.id}>
                                      {type.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              <div className="flex items-center gap-1">
                                <Input
                                  type="date"
                                  value={epic.startDate || ""}
                                  onChange={(e) => updateEpicDates(dIndex, eIndex, 'startDate', e.target.value)}
                                  className="h-8 w-32 text-xs"
                                  title="Epic start date"
                                  data-testid={`input-epic-start-${dIndex}-${eIndex}`}
                                />
                                <span className="text-xs text-muted-foreground">-</span>
                                <Input
                                  type="date"
                                  value={epic.endDate || ""}
                                  onChange={(e) => updateEpicDates(dIndex, eIndex, 'endDate', e.target.value)}
                                  className="h-8 w-32 text-xs"
                                  title="Epic end date"
                                  data-testid={`input-epic-end-${dIndex}-${eIndex}`}
                                />
                              </div>
                              
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
                              
                              {!epic.id.startsWith('e-mgmt-') && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" 
                                  onClick={() => removeEpic(dIndex, eIndex)}
                                  data-testid={`button-delete-epic-${dIndex}-${eIndex}`}
                                >
                                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              )}
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
                                        className="group/task bg-muted/30 rounded-md p-2 space-y-2"
                                      >
                                        <div className="flex items-center gap-2">
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
                                        <div className="flex items-center gap-2 ml-5">
                                          {stages.length > 0 && (
                                            <Select
                                              value={task.stageId || "none"}
                                              onValueChange={(value) => {
                                                const newD = [...deliverables];
                                                if (newD[dIndex].epics[eIndex].tasks) {
                                                  newD[dIndex].epics[eIndex].tasks![tIndex].stageId = value === "none" ? undefined : value;
                                                }
                                                setDeliverables(newD);
                                              }}
                                            >
                                              <SelectTrigger className="h-6 w-28 text-xs">
                                                <SelectValue placeholder="Stage" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="none">No stage</SelectItem>
                                                {stages.map((stage: any) => (
                                                  <SelectItem key={stage.id} value={stage.id}>
                                                    {stage.name}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          )}
                                          {milestones.length > 0 && (
                                            <Select
                                              value={task.milestoneId || "none"}
                                              onValueChange={(value) => {
                                                const newD = [...deliverables];
                                                if (newD[dIndex].epics[eIndex].tasks) {
                                                  newD[dIndex].epics[eIndex].tasks![tIndex].milestoneId = value === "none" ? undefined : value;
                                                }
                                                setDeliverables(newD);
                                              }}
                                            >
                                              <SelectTrigger className="h-6 w-32 text-xs">
                                                <SelectValue placeholder="Milestone" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="none">No milestone</SelectItem>
                                                {milestones.map((ms: any) => (
                                                  <SelectItem key={ms.id} value={ms.id}>
                                                    {ms.title}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          )}
                                          {teamMemberOptions.length > 0 && (
                                            <Select
                                              value={task.assigneeId || "none"}
                                              onValueChange={(value) => {
                                                const newD = [...deliverables];
                                                if (newD[dIndex].epics[eIndex].tasks) {
                                                  newD[dIndex].epics[eIndex].tasks![tIndex].assigneeId = value === "none" ? undefined : value;
                                                }
                                                setDeliverables(newD);
                                              }}
                                            >
                                              <SelectTrigger className="h-6 w-32 text-xs">
                                                <SelectValue placeholder="Assignee" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="none">Unassigned</SelectItem>
                                                {teamMemberOptions.map((member) => (
                                                  <SelectItem key={member.id} value={member.id}>
                                                    {member.name}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          )}
                                          {taskTypes.length > 0 && (
                                            <Select
                                              value={task.taskTypeId || ""}
                                              onValueChange={(value) => {
                                                const newD = [...deliverables];
                                                if (newD[dIndex].epics[eIndex].tasks) {
                                                  newD[dIndex].epics[eIndex].tasks![tIndex].taskTypeId = value || undefined;
                                                }
                                                setDeliverables(newD);
                                              }}
                                            >
                                              <SelectTrigger className="h-6 w-28 text-xs">
                                                <SelectValue placeholder="Type" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {taskTypes.map((type: any) => (
                                                  <SelectItem key={type.id} value={type.id}>
                                                    {type.label || type.name}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          )}
                                        </div>
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
                </CollapsibleContent>
              </Card>
              </Collapsible>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
