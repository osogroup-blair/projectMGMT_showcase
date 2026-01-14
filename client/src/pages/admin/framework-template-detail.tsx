import { useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { Shell } from "@/components/layout/shell";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Flag,
  GripVertical,
  Layers,
  ListTodo,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Workflow,
  Loader2,
  Save,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  useFrameworkTemplates,
  useStageTemplates,
  useMilestoneTemplates,
  useTaskTemplates,
  useRoleTemplates
} from "@/hooks/use-nexus-data";
import type { FrameworkTemplate, StageTemplate, MilestoneTemplate } from "@shared/schema";

export default function FrameworkTemplateDetail() {
  const [, params] = useRoute("/admin/templates/frameworks/:frameworkId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const frameworkId = params?.frameworkId;
  const isNew = frameworkId === "new";

  // Data hooks
  const {
    data: frameworkTemplates,
    createAsync: createFramework,
    updateAsync: updateFramework,
    removeAsync: removeFramework,
    isLoading: frameworksLoading
  } = useFrameworkTemplates();

  const {
    data: stageTemplates,
    createAsync: createStage,
    updateAsync: updateStage,
    removeAsync: removeStage,
    isLoading: stagesLoading
  } = useStageTemplates();

  const {
    data: milestoneTemplates,
    createAsync: createMilestone,
    updateAsync: updateMilestone,
    removeAsync: removeMilestone,
    isLoading: milestonesLoading
  } = useMilestoneTemplates();

  const { data: taskTemplates } = useTaskTemplates();
  const { data: roleTemplates } = useRoleTemplates();

  // Find the current framework
  const framework = useMemo(() => {
    if (isNew) return null;
    return frameworkTemplates?.find(f => f.id === frameworkId) || null;
  }, [frameworkTemplates, frameworkId, isNew]);

  // Get stages for this framework
  const frameworkStages = useMemo(() => {
    if (!framework || !stageTemplates) return [];
    return stageTemplates.filter(s => framework.defaultStages?.includes(s.id));
  }, [framework, stageTemplates]);

  // Get all stages not in this framework (for adding)
  const availableStages = useMemo(() => {
    if (!stageTemplates) return [];
    const usedIds = framework?.defaultStages || [];
    return stageTemplates.filter(s => !usedIds.includes(s.id));
  }, [stageTemplates, framework]);

  // Get milestones grouped by stage
  const milestonesByStage = useMemo(() => {
    if (!milestoneTemplates) return {};
    const map: Record<string, MilestoneTemplate[]> = {};
    milestoneTemplates.forEach(m => {
      if (m.stageTemplateId) {
        if (!map[m.stageTemplateId]) map[m.stageTemplateId] = [];
        map[m.stageTemplateId].push(m);
      }
    });
    // Sort by order within each stage
    Object.keys(map).forEach(stageId => {
      map[stageId].sort((a, b) => (a.order || 0) - (b.order || 0));
    });
    return map;
  }, [milestoneTemplates]);

  // UI State
  const [frameworkForm, setFrameworkForm] = useState({
    name: framework?.name || "",
    description: framework?.description || ""
  });
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [isMilestoneDialogOpen, setIsMilestoneDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "framework" | "stage" | "milestone"; item: any } | null>(null);
  const [currentStage, setCurrentStage] = useState<Partial<StageTemplate> | null>(null);
  const [currentMilestone, setCurrentMilestone] = useState<Partial<MilestoneTemplate> | null>(null);
  const [selectedStageForMilestone, setSelectedStageForMilestone] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync form when framework loads
  useMemo(() => {
    if (framework) {
      setFrameworkForm({
        name: framework.name,
        description: framework.description || ""
      });
    }
  }, [framework]);

  const isLoading = frameworksLoading || stagesLoading || milestonesLoading;

  const toggleStageExpanded = (stageId: string) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      if (next.has(stageId)) next.delete(stageId);
      else next.add(stageId);
      return next;
    });
  };

  // Framework CRUD
  const handleSaveFramework = async () => {
    if (!frameworkForm.name.trim()) {
      toast({ title: "Error", description: "Framework name is required", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      if (isNew) {
        const newId = `fw${Date.now()}`;
        await createFramework({
          id: newId,
          name: frameworkForm.name,
          description: frameworkForm.description,
          defaultStages: []
        });
        toast({ title: "Success", description: "Framework created" });
        setLocation(`/admin/templates/frameworks/${newId}`);
      } else if (framework) {
        await updateFramework({
          id: framework.id,
          updates: {
            name: frameworkForm.name,
            description: frameworkForm.description
          }
        });
        toast({ title: "Success", description: "Framework updated" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFramework = async () => {
    if (!framework) return;

    try {
      // Delete all milestones for stages in this framework
      for (const stage of frameworkStages) {
        const stageMilestones = milestonesByStage[stage.id] || [];
        for (const milestone of stageMilestones) {
          await removeMilestone(milestone.id);
        }
        // Delete the stage
        await removeStage(stage.id);
      }
      // Delete the framework
      await removeFramework(framework.id);
      toast({ title: "Success", description: "Framework and all associated stages and milestones deleted" });
      setLocation("/admin/templates");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Stage CRUD
  const openAddStageDialog = () => {
    setCurrentStage({
      name: "",
      description: "",
      defaultTasks: [],
      defaultRoles: [],
      entryCriteria: "",
      exitCriteria: "",
      allowedTaskStatuses: []
    });
    setIsStageDialogOpen(true);
  };

  const openEditStageDialog = (stage: StageTemplate) => {
    setCurrentStage({ ...stage });
    setIsStageDialogOpen(true);
  };

  const handleSaveStage = async () => {
    if (!currentStage?.name?.trim()) {
      toast({ title: "Error", description: "Stage name is required", variant: "destructive" });
      return;
    }

    try {
      if (currentStage.id) {
        // Update existing stage
        await updateStage({
          id: currentStage.id,
          updates: currentStage
        });
        toast({ title: "Success", description: "Stage updated" });
      } else {
        // Create new stage
        const newId = `st${Date.now()}`;
        await createStage({
          id: newId,
          ...currentStage
        } as StageTemplate);

        // Add to framework
        if (framework) {
          await updateFramework({
            id: framework.id,
            updates: {
              defaultStages: [...(framework.defaultStages || []), newId]
            }
          });
        }
        toast({ title: "Success", description: "Stage created and added to framework" });
      }
      setIsStageDialogOpen(false);
      setCurrentStage(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleRemoveStageFromFramework = async (stageId: string) => {
    if (!framework) return;

    try {
      // Remove stage from framework's defaultStages
      await updateFramework({
        id: framework.id,
        updates: {
          defaultStages: framework.defaultStages.filter((id: string) => id !== stageId)
        }
      });
      toast({ title: "Success", description: "Stage removed from framework" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteStage = async (stage: StageTemplate) => {
    try {
      // Delete all milestones for this stage
      const stageMilestones = milestonesByStage[stage.id] || [];
      for (const milestone of stageMilestones) {
        await removeMilestone(milestone.id);
      }

      // Remove from framework
      if (framework) {
        await updateFramework({
          id: framework.id,
          updates: {
            defaultStages: framework.defaultStages.filter((id: string) => id !== stage.id)
          }
        });
      }

      // Delete the stage
      await removeStage(stage.id);
      toast({ title: "Success", description: "Stage and its milestones deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleAddExistingStage = async (stageId: string) => {
    if (!framework) return;

    try {
      await updateFramework({
        id: framework.id,
        updates: {
          defaultStages: [...(framework.defaultStages || []), stageId]
        }
      });
      toast({ title: "Success", description: "Stage added to framework" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Milestone CRUD
  const openAddMilestoneDialog = (stageId: string) => {
    setSelectedStageForMilestone(stageId);
    setCurrentMilestone({
      name: "",
      description: "",
      phase: "delivery",
      scopeType: "deliverable",
      completionMode: "percentage",
      completionTargetPercent: 100,
      isBillingGate: false,
      offsetDays: 0,
      stageTemplateId: stageId,
      order: (milestonesByStage[stageId]?.length || 0) + 1
    });
    setIsMilestoneDialogOpen(true);
  };

  const openEditMilestoneDialog = (milestone: MilestoneTemplate) => {
    setSelectedStageForMilestone(milestone.stageTemplateId);
    setCurrentMilestone({ ...milestone });
    setIsMilestoneDialogOpen(true);
  };

  const handleSaveMilestone = async () => {
    if (!currentMilestone?.name?.trim()) {
      toast({ title: "Error", description: "Milestone name is required", variant: "destructive" });
      return;
    }

    try {
      if (currentMilestone.id) {
        await updateMilestone({
          id: currentMilestone.id,
          updates: currentMilestone
        });
        toast({ title: "Success", description: "Milestone updated" });
      } else {
        const newId = `mt${Date.now()}`;
        await createMilestone({
          id: newId,
          ...currentMilestone
        } as MilestoneTemplate);
        toast({ title: "Success", description: "Milestone created" });
      }
      setIsMilestoneDialogOpen(false);
      setCurrentMilestone(null);
      setSelectedStageForMilestone(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteMilestone = async (milestone: MilestoneTemplate) => {
    try {
      await removeMilestone(milestone.id);
      toast({ title: "Success", description: "Milestone deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Delete confirmation
  const confirmDelete = (type: "framework" | "stage" | "milestone", item: any) => {
    setDeleteTarget({ type, item });
    setIsDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "framework") {
      await handleDeleteFramework();
    } else if (deleteTarget.type === "stage") {
      await handleDeleteStage(deleteTarget.item);
    } else if (deleteTarget.type === "milestone") {
      await handleDeleteMilestone(deleteTarget.item);
    }

    setIsDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    );
  }

  if (!isNew && !framework) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <p className="text-muted-foreground">Framework not found</p>
          <Button variant="outline" onClick={() => setLocation("/admin/templates")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/templates")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Workflow className="h-6 w-6" />
                {isNew ? "New Framework Template" : framework?.name}
              </h1>
              <p className="text-muted-foreground text-sm">
                {isNew ? "Create a new delivery framework" : "Manage stages and milestones"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isNew && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => confirmDelete("framework", framework)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Framework
              </Button>
            )}
          </div>
        </div>

        {/* Framework Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Framework Details</CardTitle>
            <CardDescription>Basic information about this framework template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={frameworkForm.name}
                  onChange={(e) => setFrameworkForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Agile Delivery Framework"
                  data-testid="input-framework-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={frameworkForm.description}
                  onChange={(e) => setFrameworkForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this framework is used for..."
                  rows={3}
                  data-testid="input-framework-description"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveFramework} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {isNew ? "Create Framework" : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stages Section - only show for existing frameworks */}
        {!isNew && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Stages
                </CardTitle>
                <CardDescription>
                  Stages define the workflow phases. Each stage can have milestones.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {availableStages.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Existing Stage
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <ScrollArea className="max-h-64">
                        {availableStages.map(stage => (
                          <DropdownMenuItem
                            key={stage.id}
                            onClick={() => handleAddExistingStage(stage.id)}
                          >
                            {stage.name}
                          </DropdownMenuItem>
                        ))}
                      </ScrollArea>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button size="sm" onClick={openAddStageDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Stage
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {frameworkStages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No stages in this framework yet.</p>
                  <p className="text-sm">Add stages to define your workflow phases.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {frameworkStages.map((stage, index) => {
                    const stageMilestones = milestonesByStage[stage.id] || [];
                    const isExpanded = expandedStages.has(stage.id);

                    return (
                      <Collapsible
                        key={stage.id}
                        open={isExpanded}
                        onOpenChange={() => toggleStageExpanded(stage.id)}
                      >
                        <div className="border rounded-lg">
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50">
                              <div className="flex items-center gap-3">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                <Badge variant="outline" className="w-8 justify-center">
                                  {index + 1}
                                </Badge>
                                <div>
                                  <h4 className="font-medium">{stage.name}</h4>
                                  {stage.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                      {stage.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="gap-1">
                                  <ListTodo className="h-3 w-3" />
                                  {(stage.defaultTasks || []).length} tasks
                                </Badge>
                                <Badge variant="secondary" className="gap-1">
                                  <Flag className="h-3 w-3" />
                                  {stageMilestones.length} milestones
                                </Badge>
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openEditStageDialog(stage)}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Edit Stage
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => openAddMilestoneDialog(stage.id)}>
                                      <Flag className="h-4 w-4 mr-2" />
                                      Add Milestone
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleRemoveStageFromFramework(stage.id)}>
                                      Remove from Framework
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => confirmDelete("stage", stage)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete Stage
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <Separator />
                            <div className="p-4 pl-16 bg-muted/30 space-y-6">
                              {/* Tasks Section */}
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="text-sm font-medium flex items-center gap-2">
                                    <ListTodo className="h-4 w-4" />
                                    Default Tasks
                                  </h5>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditStageDialog(stage)}
                                  >
                                    <Pencil className="h-4 w-4 mr-1" />
                                    Edit Tasks
                                  </Button>
                                </div>
                                {(stage.defaultTasks || []).length === 0 ? (
                                  <p className="text-sm text-muted-foreground py-2">
                                    No default tasks for this stage. Edit the stage to add tasks.
                                  </p>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {(stage.defaultTasks || []).map((taskId: string) => {
                                      const task = taskTemplates?.find(t => t.id === taskId);
                                      return (
                                        <Badge key={taskId} variant="outline" className="gap-1">
                                          <ListTodo className="h-3 w-3" />
                                          {task?.title || task?.name || taskId}
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Milestones Section */}
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="text-sm font-medium flex items-center gap-2">
                                    <Flag className="h-4 w-4" />
                                    Milestones
                                  </h5>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openAddMilestoneDialog(stage.id)}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Milestone
                                  </Button>
                                </div>
                                {stageMilestones.length === 0 ? (
                                  <p className="text-sm text-muted-foreground py-2">
                                    No milestones for this stage.
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {stageMilestones.map((milestone) => (
                                      <div
                                        key={milestone.id}
                                        className="flex items-center justify-between p-3 bg-background rounded-md border"
                                      >
                                        <div className="flex items-center gap-3">
                                          <Flag className="h-4 w-4 text-muted-foreground" />
                                          <div>
                                            <p className="font-medium text-sm">{milestone.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                              <Badge variant="outline" className="text-xs">
                                                {milestone.phase}
                                              </Badge>
                                              {milestone.isBillingGate && (
                                                <Badge variant="secondary" className="text-xs">
                                                  Billing Gate
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => openEditMilestoneDialog(milestone)}
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive"
                                            onClick={() => confirmDelete("milestone", milestone)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stage Dialog */}
      <Dialog open={isStageDialogOpen} onOpenChange={setIsStageDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {currentStage?.id ? "Edit Stage" : "New Stage"}
            </DialogTitle>
            <DialogDescription>
              Define the stage details. Stages represent phases in your workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="stage-name">Name *</Label>
              <Input
                id="stage-name"
                value={currentStage?.name || ""}
                onChange={(e) => setCurrentStage(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Discovery, Development, Testing"
                data-testid="input-stage-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage-description">Description</Label>
              <Textarea
                id="stage-description"
                value={currentStage?.description || ""}
                onChange={(e) => setCurrentStage(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What happens in this stage?"
                rows={3}
                data-testid="input-stage-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entry-criteria">Entry Criteria</Label>
                <Textarea
                  id="entry-criteria"
                  value={currentStage?.entryCriteria || ""}
                  onChange={(e) => setCurrentStage(prev => ({ ...prev, entryCriteria: e.target.value }))}
                  placeholder="What must be true to enter this stage?"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exit-criteria">Exit Criteria</Label>
                <Textarea
                  id="exit-criteria"
                  value={currentStage?.exitCriteria || ""}
                  onChange={(e) => setCurrentStage(prev => ({ ...prev, exitCriteria: e.target.value }))}
                  placeholder="What must be complete to exit?"
                  rows={2}
                />
              </div>
            </div>

            {/* Default Tasks Section */}
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <ListTodo className="h-4 w-4" />
                  Default Tasks
                </Label>
                <span className="text-xs text-muted-foreground">
                  {(currentStage?.defaultTasks || []).length} task(s) selected
                </span>
              </div>
              
              {/* Add Task Selector */}
              <div className="flex gap-2">
                <SearchableSelect
                  value=""
                  onValueChange={(taskId) => {
                    if (taskId && !currentStage?.defaultTasks?.includes(taskId)) {
                      setCurrentStage(prev => ({
                        ...prev,
                        defaultTasks: [...(prev?.defaultTasks || []), taskId]
                      }));
                    }
                  }}
                  placeholder="Add a task template..."
                  triggerClassName="flex-1"
                  options={(taskTemplates || [])
                    .filter(t => !(currentStage?.defaultTasks || []).includes(t.id))
                    .map(t => ({
                      value: t.id,
                      label: t.title || t.name || "Untitled Task"
                    }))}
                />
              </div>

              {/* Selected Tasks List */}
              {(currentStage?.defaultTasks || []).length > 0 && (
                <div className="space-y-2 max-h-[150px] overflow-y-auto">
                  {(currentStage?.defaultTasks || []).map((taskId: string, index: number) => {
                    const task = taskTemplates?.find(t => t.id === taskId);
                    return (
                      <div
                        key={taskId}
                        className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-xs">{index + 1}.</span>
                          <span>{task?.title || task?.name || taskId}</span>
                          {task?.defaultPriority && (
                            <Badge variant="outline" className="text-xs">
                              {task.defaultPriority}
                            </Badge>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            setCurrentStage(prev => ({
                              ...prev,
                              defaultTasks: (prev?.defaultTasks || []).filter((id: string) => id !== taskId)
                            }));
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {(currentStage?.defaultTasks || []).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No tasks added yet. Select task templates from the dropdown above.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveStage}>
              {currentStage?.id ? "Update Stage" : "Create Stage"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Milestone Dialog */}
      <Dialog open={isMilestoneDialogOpen} onOpenChange={setIsMilestoneDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {currentMilestone?.id ? "Edit Milestone" : "New Milestone"}
            </DialogTitle>
            <DialogDescription>
              Milestones mark key checkpoints within a stage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="milestone-name">Name *</Label>
              <Input
                id="milestone-name"
                value={currentMilestone?.name || ""}
                onChange={(e) => setCurrentMilestone(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Requirements Signed Off"
                data-testid="input-milestone-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-description">Description</Label>
              <Textarea
                id="milestone-description"
                value={currentMilestone?.description || ""}
                onChange={(e) => setCurrentMilestone(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What does this milestone represent?"
                rows={2}
                data-testid="input-milestone-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="milestone-phase">Phase</Label>
                <SearchableSelect
                  value={currentMilestone?.phase || "delivery"}
                  onValueChange={(v) => setCurrentMilestone(prev => ({ ...prev, phase: v }))}
                  options={[
                    { value: "discovery", label: "Discovery" },
                    { value: "planning", label: "Planning" },
                    { value: "delivery", label: "Delivery" },
                    { value: "closure", label: "Closure" }
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="milestone-scope">Scope Type</Label>
                <SearchableSelect
                  value={currentMilestone?.scopeType || "deliverable"}
                  onValueChange={(v) => setCurrentMilestone(prev => ({ ...prev, scopeType: v }))}
                  options={[
                    { value: "project", label: "Project" },
                    { value: "deliverable", label: "Deliverable" },
                    { value: "epic", label: "Epic" }
                  ]}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="completion-mode">Completion Mode</Label>
                <SearchableSelect
                  value={currentMilestone?.completionMode || "percentage"}
                  onValueChange={(v) => setCurrentMilestone(prev => ({ ...prev, completionMode: v }))}
                  options={[
                    { value: "percentage", label: "Percentage" },
                    { value: "manual", label: "Manual" },
                    { value: "tasks", label: "All Tasks Complete" }
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="completion-target">Target Percent</Label>
                <Input
                  id="completion-target"
                  type="number"
                  min={0}
                  max={100}
                  value={currentMilestone?.completionTargetPercent || 100}
                  onChange={(e) => setCurrentMilestone(prev => ({
                    ...prev,
                    completionTargetPercent: parseInt(e.target.value) || 100
                  }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentMilestone?.isBillingGate || false}
                  onChange={(e) => setCurrentMilestone(prev => ({
                    ...prev,
                    isBillingGate: e.target.checked
                  }))}
                  className="rounded"
                />
                <span className="text-sm">Billing Gate</span>
              </label>
              <div className="flex items-center gap-2">
                <Label htmlFor="offset-days" className="text-sm">Offset Days:</Label>
                <Input
                  id="offset-days"
                  type="number"
                  className="w-20"
                  value={currentMilestone?.offsetDays || 0}
                  onChange={(e) => setCurrentMilestone(prev => ({
                    ...prev,
                    offsetDays: parseInt(e.target.value) || 0
                  }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMilestoneDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMilestone}>
              {currentMilestone?.id ? "Update Milestone" : "Create Milestone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.type === "framework" ? "Framework" : deleteTarget?.type === "stage" ? "Stage" : "Milestone"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "framework" && (
                <>
                  This will permanently delete the framework <strong>"{deleteTarget.item?.name}"</strong>,
                  along with all its stages ({frameworkStages.length}) and their milestones.
                  This action cannot be undone.
                </>
              )}
              {deleteTarget?.type === "stage" && (
                <>
                  This will permanently delete the stage <strong>"{deleteTarget.item?.name}"</strong>
                  and all its milestones ({milestonesByStage[deleteTarget.item?.id]?.length || 0}).
                  This action cannot be undone.
                </>
              )}
              {deleteTarget?.type === "milestone" && (
                <>
                  This will permanently delete the milestone <strong>"{deleteTarget.item?.name}"</strong>.
                  This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
}
