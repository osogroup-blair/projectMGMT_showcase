import { useState, useMemo, useRef, useEffect } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  ArrowLeft, 
  Plus, 
  MoreHorizontal, 
  Check,
  Package,
  Layers,
  Calendar as CalendarIcon,
  ChevronRight,
  CheckCircle2,
  List,
  GanttChart,
  ChevronDown,
  Pencil,
  X,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRoute, Link } from "wouter";
import { STAGE_TEMPLATES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useDeliverables, useEpics, useUsers, useTasks } from "@/hooks/use-nexus-data";
import { Loader2, User } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
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

// Export content component separately for reuse
export function DeliverablesContent({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"list" | "gantt">("list");

  const { data: allDeliverables, isLoading: isDeliverablesLoading, createAsync: createDeliverableAsync, update: updateDeliverable, updateAsync: updateDeliverableAsync, remove: deleteDeliverable } = useDeliverables();
  const { data: allEpics, isLoading: isEpicsLoading, create: createEpic } = useEpics();
  const { data: users, isLoading: isUsersLoading } = useUsers();
  const { data: allTasks, isLoading: isTasksLoading } = useTasks();

  // Inline editing state
  const [editingDeliverableId, setEditingDeliverableId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deliverableToDelete, setDeliverableToDelete] = useState<{ id: string; title: string } | null>(null);

  const deliverables = allDeliverables.filter((d: any) => d.projectId === projectId);
  const getEpicsForDeliverable = (deliverableId: string) => allEpics.filter((e: any) => e.deliverableId === deliverableId);
  const getOwner = (ownerId: string) => users.find((t: any) => t.id === ownerId);

  // Get tasks for a specific epic
  const getTasksForEpic = (epicId: string) => {
    if (!allTasks) return [];
    return allTasks.filter((t: any) => t.epicId === epicId);
  };

  // Calculate epic progress from task completion
  const getEpicProgress = (epicId: string) => {
    const epicTasks = getTasksForEpic(epicId);
    if (epicTasks.length === 0) return 0;
    const doneTasks = epicTasks.filter((t: any) => t.status === "Done").length;
    return Math.round((doneTasks / epicTasks.length) * 100);
  };

  // Get task counts for an epic
  const getEpicTaskCounts = (epicId: string) => {
    const epicTasks = getTasksForEpic(epicId);
    const doneTasks = epicTasks.filter((t: any) => t.status === "Done").length;
    return { done: doneTasks, total: epicTasks.length };
  };

  // Calculate deliverable progress from aggregate task counts (not averaging epic percentages)
  const getDeliverableProgress = (deliverableId: string) => {
    const taskCounts = getDeliverableTaskCounts(deliverableId);
    if (taskCounts.total === 0) return 0;
    return Math.round((taskCounts.done / taskCounts.total) * 100);
  };

  // Get total task counts for a deliverable
  const getDeliverableTaskCounts = (deliverableId: string) => {
    const epics = getEpicsForDeliverable(deliverableId);
    let done = 0;
    let total = 0;
    epics.forEach((epic: any) => {
      const counts = getEpicTaskCounts(epic.id);
      done += counts.done;
      total += counts.total;
    });
    return { done, total };
  };

  // Epic Creation State
  const [isCreateEpicOpen, setIsCreateEpicOpen] = useState(false);
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<string>("");
  const [newEpicData, setNewEpicData] = useState({
    title: "",
    description: "",
    stageIds: [] as string[]
  });

  const handleOpenCreateEpic = (deliverableId: string) => {
    setSelectedDeliverableId(deliverableId);
    setNewEpicData({
      title: "",
      description: "",
      stageIds: []
    });
    setIsCreateEpicOpen(true);
  };

  const toggleStageSelection = (stageId: string) => {
    setNewEpicData(prev => ({
      ...prev,
      stageIds: prev.stageIds.includes(stageId)
        ? prev.stageIds.filter(id => id !== stageId)
        : [...prev.stageIds, stageId]
    }));
  };

  const handleCreateEpic = () => {
    if (!newEpicData.title || !selectedDeliverableId) {
      toast({
        title: "Validation Error",
        description: "Please provide an epic title.",
        variant: "destructive"
      });
      return;
    }
    
    createEpic({
      title: newEpicData.title,
      description: newEpicData.description,
      deliverableId: selectedDeliverableId,
      stageIds: newEpicData.stageIds,
      status: "Not Started",
      progress: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    
    toast({
      title: "Epic Created",
      description: `${newEpicData.title} has been created with ${newEpicData.stageIds.length} assigned stages.`,
    });
    setIsCreateEpicOpen(false);
  };

  // Create Deliverable handler
  const handleCreateDeliverable = async () => {
    try {
      const newDeliverable = await createDeliverableAsync({
        projectId: projectId,
        title: "New Deliverable",
        description: "",
        status: "Not Started",
        startDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        ownerId: users?.[0]?.id || undefined
      });

      if (newDeliverable?.id) {
        toast({ title: "Deliverable Created", description: "New deliverable has been added." });
        // Start editing the title immediately
        setEditingDeliverableId(newDeliverable.id);
        setEditingField("title");
        setEditValue("New Deliverable");
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create deliverable.", variant: "destructive" });
    }
  };

  // Delete Deliverable handlers
  const openDeleteDialog = (id: string, title: string) => {
    setDeliverableToDelete({ id, title });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deliverableToDelete) {
      deleteDeliverable(deliverableToDelete.id);
      toast({ title: "Deleted", description: `${deliverableToDelete.title} has been deleted.` });
    }
    setDeleteDialogOpen(false);
    setDeliverableToDelete(null);
  };

  // Inline editing handlers
  const startEditing = (deliverableId: string, field: string, currentValue: string) => {
    setEditingDeliverableId(deliverableId);
    setEditingField(field);
    setEditValue(currentValue || "");
  };

  const cancelEditing = () => {
    setEditingDeliverableId(null);
    setEditingField(null);
    setEditValue("");
  };

  const saveEdit = async (deliverableId: string, field: string) => {
    const deliverable = deliverables.find((d: any) => d.id === deliverableId);
    if (!deliverable) return;

    const updates: Record<string, any> = {};
    if (field === "title" && editValue.trim()) {
      updates.title = editValue.trim();
    } else if (field === "description") {
      updates.description = editValue;
    } else if (field === "startDate") {
      updates.startDate = editValue;
    } else if (field === "dueDate") {
      updates.dueDate = editValue;
    }

    if (Object.keys(updates).length > 0) {
      try {
        await updateDeliverableAsync({ id: deliverableId, updates });
        // Toast is handled by the hook's onSuccess
      } catch (error) {
        toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
      }
    }
    cancelEditing();
  };

  const handleOwnerChange = async (deliverableId: string, newOwnerId: string) => {
    try {
      await updateDeliverableAsync({ id: deliverableId, updates: { ownerId: newOwnerId } });
      // Toast is handled by the hook's onSuccess
    } catch (error) {
      toast({ title: "Error", description: "Failed to update owner.", variant: "destructive" });
    }
    cancelEditing();
  };

  useEffect(() => {
    if (editingField === "title" || editingField === "startDate" || editingField === "dueDate") {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (editingField === "description") {
      textareaRef.current?.focus();
    }
  }, [editingField]);

  if (isDeliverablesLoading || isEpicsLoading || isUsersLoading || isTasksLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate timeline bounds for Gantt view
  const ganttData = useMemo(() => {
    if (deliverables.length === 0) return { minDate: new Date(), maxDate: new Date(), items: [] };
    
    const items: Array<{
      id: string;
      type: "deliverable" | "epic";
      title: string;
      startDate: Date;
      endDate: Date;
      progress: number;
      parentId?: string;
      status: string;
    }> = [];

    let minDate = new Date();
    let maxDate = new Date();
    let hasValidDates = false;

    deliverables.forEach((d: any) => {
      const start = d.startDate ? new Date(d.startDate) : new Date();
      const end = d.dueDate ? new Date(d.dueDate) : new Date();
      
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        if (!hasValidDates) {
          minDate = start;
          maxDate = end;
          hasValidDates = true;
        } else {
          if (start < minDate) minDate = start;
          if (end > maxDate) maxDate = end;
        }
      }

      items.push({
        id: d.id,
        type: "deliverable",
        title: d.title,
        startDate: start,
        endDate: end,
        progress: getDeliverableProgress(d.id),
        status: d.status
      });

      const epics = getEpicsForDeliverable(d.id);
      epics.forEach((e: any) => {
        const epicStart = e.startDate ? new Date(e.startDate) : start;
        const epicEnd = e.endDate ? new Date(e.endDate) : end;
        
        if (!isNaN(epicStart.getTime()) && epicStart < minDate) minDate = epicStart;
        if (!isNaN(epicEnd.getTime()) && epicEnd > maxDate) maxDate = epicEnd;

        items.push({
          id: e.id,
          type: "epic",
          title: e.title,
          startDate: epicStart,
          endDate: epicEnd,
          progress: getEpicProgress(e.id),
          parentId: d.id,
          status: e.status
        });
      });
    });

    // Add padding to date range
    const padding = (maxDate.getTime() - minDate.getTime()) * 0.05;
    minDate = new Date(minDate.getTime() - padding);
    maxDate = new Date(maxDate.getTime() + padding);

    return { minDate, maxDate, items };
  }, [deliverables, allEpics]);

  // Helper to calculate bar position
  const getBarStyle = (startDate: Date, endDate: Date) => {
    const totalDays = (ganttData.maxDate.getTime() - ganttData.minDate.getTime()) / (1000 * 60 * 60 * 24);
    const startOffset = (startDate.getTime() - ganttData.minDate.getTime()) / (1000 * 60 * 60 * 24);
    const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    
    const left = (startOffset / totalDays) * 100;
    const width = Math.max((duration / totalDays) * 100, 2);
    
    return { left: `${left}%`, width: `${width}%` };
  };

  // Generate month markers for the timeline
  const getTimelineMonths = () => {
    const months: Array<{ label: string; left: string }> = [];
    const totalDays = (ganttData.maxDate.getTime() - ganttData.minDate.getTime()) / (1000 * 60 * 60 * 24);
    
    const current = new Date(ganttData.minDate);
    current.setDate(1);
    
    while (current <= ganttData.maxDate) {
      const dayOffset = (current.getTime() - ganttData.minDate.getTime()) / (1000 * 60 * 60 * 24);
      const left = (dayOffset / totalDays) * 100;
      
      if (left >= 0 && left <= 100) {
        months.push({
          label: current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          left: `${left}%`
        });
      }
      
      current.setMonth(current.getMonth() + 1);
    }
    
    return months;
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Deliverables</h2>
          <p className="text-sm text-muted-foreground">Manage high-level deliverables and breakdown epics.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-lg p-1 bg-muted/30">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                viewMode === "list" 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid="button-view-list"
            >
              <List className="h-4 w-4" />
              List
            </button>
            <button
              onClick={() => setViewMode("gantt")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                viewMode === "gantt" 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid="button-view-gantt"
            >
              <GanttChart className="h-4 w-4" />
              Gantt
            </button>
          </div>
          <Button className="gap-2" size="sm" onClick={handleCreateDeliverable} data-testid="button-new-deliverable">
            <Plus className="h-4 w-4" />
            New Deliverable
          </Button>
        </div>
      </div>

      {/* Deliverables Content */}
      <div className="space-y-6">
        {deliverables.length === 0 ? (
          <Card className="bg-muted/10 border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No deliverables defined</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
                Start by defining the major outcomes for this project to organize your epics and tasks.
              </p>
              <Button onClick={handleCreateDeliverable} data-testid="button-create-first-deliverable">Create First Deliverable</Button>
            </CardContent>
          </Card>
        ) : viewMode === "gantt" ? (
          /* Gantt View */
          <Card>
            <CardContent className="p-0">
              {/* Timeline Header */}
              <div className="border-b bg-muted/30 px-4 py-2 flex">
                <div className="w-[280px] shrink-0 text-sm font-medium text-muted-foreground">
                  Item
                </div>
                <div className="flex-1 relative h-6 overflow-hidden">
                  {getTimelineMonths().map((month, idx) => (
                    <div 
                      key={idx}
                      className="absolute text-xs text-muted-foreground whitespace-nowrap"
                      style={{ left: month.left }}
                    >
                      {month.label}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Gantt Rows */}
              <div className="divide-y">
                {deliverables.map((deliverable: any) => {
                  const epics = getEpicsForDeliverable(deliverable.id);
                  const progress = getDeliverableProgress(deliverable.id);
                  const barStyle = getBarStyle(
                    deliverable.startDate ? new Date(deliverable.startDate) : new Date(),
                    deliverable.dueDate ? new Date(deliverable.dueDate) : new Date()
                  );
                  
                  return (
                    <div key={deliverable.id}>
                      {/* Deliverable Row */}
                      <div className="flex items-center hover:bg-muted/30 transition-colors group">
                        <div className="w-[280px] shrink-0 px-4 py-3 flex items-center gap-2">
                          <div className={cn(
                            "p-1.5 rounded",
                            deliverable.status === "Completed" ? "bg-green-100 text-green-700" :
                            deliverable.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                            "bg-slate-100 text-slate-700"
                          )}>
                            <Package className="h-4 w-4" />
                          </div>
                          <Link href={`/projects/${projectId}/deliverables/${deliverable.id}`} className="flex-1 min-w-0">
                            <span className="font-medium text-sm truncate block hover:text-primary transition-colors">
                              {deliverable.title}
                            </span>
                          </Link>
                        </div>
                        <div className="flex-1 relative h-10 bg-muted/10">
                          {/* Grid lines */}
                          {getTimelineMonths().map((month, idx) => (
                            <div 
                              key={idx}
                              className="absolute top-0 bottom-0 border-l border-dashed border-muted-foreground/20"
                              style={{ left: month.left }}
                            />
                          ))}
                          {/* Deliverable Bar */}
                          <div 
                            className="absolute top-1/2 -translate-y-1/2 h-6 rounded-md bg-primary/20 border border-primary/40 flex items-center overflow-hidden"
                            style={barStyle}
                          >
                            <div 
                              className="h-full bg-primary/60 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-primary-foreground mix-blend-difference">
                              {progress > 0 && `${progress}%`}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Epic Rows */}
                      {epics.map((epic: any) => {
                        const epicProgress = getEpicProgress(epic.id);
                        const epicBarStyle = getBarStyle(
                          epic.startDate ? new Date(epic.startDate) : new Date(),
                          epic.endDate ? new Date(epic.endDate) : new Date()
                        );
                        
                        return (
                          <div key={epic.id} className="flex items-center hover:bg-muted/20 transition-colors">
                            <div className="w-[280px] shrink-0 px-4 py-2 flex items-center gap-2 pl-10">
                              <div className="p-1 bg-primary/10 text-primary rounded">
                                <Layers className="h-3 w-3" />
                              </div>
                              <Link href={`/projects/${projectId}/epics/${epic.id}`} className="flex-1 min-w-0">
                                <span className="text-sm truncate block hover:text-primary transition-colors">
                                  {epic.title}
                                </span>
                              </Link>
                            </div>
                            <div className="flex-1 relative h-8 bg-muted/5">
                              {/* Grid lines */}
                              {getTimelineMonths().map((month, idx) => (
                                <div 
                                  key={idx}
                                  className="absolute top-0 bottom-0 border-l border-dashed border-muted-foreground/10"
                                  style={{ left: month.left }}
                                />
                              ))}
                              {/* Epic Bar */}
                              <div 
                                className="absolute top-1/2 -translate-y-1/2 h-4 rounded bg-blue-200 border border-blue-300 flex items-center overflow-hidden"
                                style={epicBarStyle}
                              >
                                <div 
                                  className="h-full bg-blue-400 transition-all"
                                  style={{ width: `${epicProgress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* List View */
          <Accordion type="multiple" defaultValue={deliverables.map(d => d.id)} className="space-y-4">
            {deliverables.map(deliverable => {
              const epics = getEpicsForDeliverable(deliverable.id);
              const owner = getOwner(deliverable.ownerId);
              const progress = getDeliverableProgress(deliverable.id);
              const taskCounts = getDeliverableTaskCounts(deliverable.id);
              const isEditingThis = editingDeliverableId === deliverable.id;

              return (
                <AccordionItem key={deliverable.id} value={deliverable.id} className="border rounded-lg bg-card px-4" data-testid={`accordion-deliverable-${deliverable.id}`}>
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-start gap-4 text-left w-full justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={cn(
                          "p-2 rounded-lg mt-1",
                          deliverable.status === "Completed" ? "bg-green-100 text-green-700" :
                          deliverable.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                          "bg-slate-100 text-slate-700"
                        )}>
                          <Package className="h-5 w-5" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-3">
                            {/* Title - inline editable */}
                            {isEditingThis && editingField === "title" ? (
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <Input
                                  ref={inputRef}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveEdit(deliverable.id, "title");
                                    if (e.key === "Escape") cancelEditing();
                                  }}
                                  className="h-8 w-64 text-lg font-semibold"
                                  data-testid={`input-deliverable-title-${deliverable.id}`}
                                />
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveEdit(deliverable.id, "title")}>
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEditing}>
                                  <X className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 group" onClick={(e) => e.stopPropagation()}>
                                <h3 className="text-lg font-semibold">{deliverable.title}</h3>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => startEditing(deliverable.id, "title", deliverable.title)}
                                  data-testid={`button-edit-title-${deliverable.id}`}
                                >
                                  <Pencil className="h-3 w-3 text-muted-foreground" />
                                </Button>
                              </div>
                            )}
                            <Badge variant="outline" className={cn(
                              "font-normal",
                              deliverable.status === "Completed" ? "bg-green-50 text-green-700 border-green-200" :
                              deliverable.status === "In Progress" ? "bg-blue-50 text-blue-700 border-blue-200" :
                              "bg-slate-50 text-slate-700 border-slate-200"
                            )}>
                              {deliverable.status}
                            </Badge>
                          </div>
                          
                          {/* Description - inline editable */}
                          {isEditingThis && editingField === "description" ? (
                            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                              <Textarea
                                ref={textareaRef}
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") cancelEditing();
                                }}
                                placeholder="Add a description..."
                                className="min-h-[60px] text-sm"
                                data-testid={`input-deliverable-description-${deliverable.id}`}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => saveEdit(deliverable.id, "description")}>Save</Button>
                                <Button size="sm" variant="ghost" onClick={cancelEditing}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="flex items-center gap-2 group cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(deliverable.id, "description", deliverable.description || "");
                              }}
                            >
                              <p className={cn(
                                "text-sm",
                                deliverable.description ? "text-muted-foreground" : "text-muted-foreground/50 italic"
                              )}>
                                {deliverable.description || "Click to add description..."}
                              </p>
                              <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 text-muted-foreground transition-opacity" />
                            </div>
                          )}

                          <div className="flex items-center gap-6 pt-2 text-xs text-muted-foreground">
                            {/* Owner - inline editable */}
                            {isEditingThis && editingField === "owner" ? (
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <User className="h-3.5 w-3.5" />
                                <Select 
                                  value={deliverable.ownerId || ""} 
                                  onValueChange={(value) => handleOwnerChange(deliverable.id, value)}
                                >
                                  <SelectTrigger className="h-6 text-xs w-32" data-testid={`select-owner-${deliverable.id}`}>
                                    <SelectValue placeholder="Select owner" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(users || []).map((u: any) => (
                                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={cancelEditing}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div 
                                className="flex items-center gap-2 cursor-pointer group"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(deliverable.id, "owner", deliverable.ownerId || "");
                                }}
                              >
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-[9px]">{owner?.name?.charAt(0) || "?"}</AvatarFallback>
                                </Avatar>
                                <span>Owner: {owner?.name || "Unassigned"}</span>
                                <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-50 transition-opacity" />
                              </div>
                            )}

                            {/* Start Date - inline editable */}
                            {isEditingThis && editingField === "startDate" ? (
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <CalendarIcon className="h-3.5 w-3.5" />
                                <Input
                                  ref={inputRef}
                                  type="date"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveEdit(deliverable.id, "startDate");
                                    if (e.key === "Escape") cancelEditing();
                                  }}
                                  className="h-6 text-xs w-32"
                                  data-testid={`input-deliverable-startdate-${deliverable.id}`}
                                />
                                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => saveEdit(deliverable.id, "startDate")}>
                                  <Check className="h-3 w-3 text-green-600" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={cancelEditing}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div 
                                className="flex items-center gap-1.5 cursor-pointer group"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(deliverable.id, "startDate", deliverable.startDate || "");
                                }}
                              >
                                <CalendarIcon className="h-3.5 w-3.5" />
                                <span>Start: {deliverable.startDate || "Not set"}</span>
                                <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-50 transition-opacity" />
                              </div>
                            )}

                            {/* Due Date - inline editable */}
                            {isEditingThis && editingField === "dueDate" ? (
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <CalendarIcon className="h-3.5 w-3.5" />
                                <Input
                                  ref={inputRef}
                                  type="date"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveEdit(deliverable.id, "dueDate");
                                    if (e.key === "Escape") cancelEditing();
                                  }}
                                  className="h-6 text-xs w-32"
                                  data-testid={`input-deliverable-duedate-${deliverable.id}`}
                                />
                                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => saveEdit(deliverable.id, "dueDate")}>
                                  <Check className="h-3 w-3 text-green-600" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-5 w-5" onClick={cancelEditing}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div 
                                className="flex items-center gap-1.5 cursor-pointer group"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(deliverable.id, "dueDate", deliverable.dueDate || "");
                                }}
                              >
                                <CalendarIcon className="h-3.5 w-3.5" />
                                <span>Due: {deliverable.dueDate || "Not set"}</span>
                                <Pencil className="h-2.5 w-2.5 opacity-0 group-hover:opacity-50 transition-opacity" />
                              </div>
                            )}

                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>{taskCounts.done}/{taskCounts.total} Tasks</span>
                            </div>
                            <div className="flex items-center gap-2 min-w-[100px]">
                              <Progress value={progress} className="h-1.5 w-16" />
                              <span>{progress}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Overview button and delete */}
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/projects/${projectId}/deliverables/${deliverable.id}`}>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="gap-2"
                            data-testid={`button-deliverable-overview-${deliverable.id}`}
                          >
                            <ChevronRight className="h-4 w-4" />
                            Overview
                          </Button>
                        </Link>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => openDeleteDialog(deliverable.id, deliverable.title)}
                          data-testid={`button-delete-deliverable-${deliverable.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="pt-0 pb-4 pl-[3.25rem]">
                    <div className="space-y-3 mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Associated Epics ({epics.length})
                        </span>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-1.5"
                            onClick={() => handleOpenCreateEpic(deliverable.id)}
                            data-testid={`button-add-epic-${deliverable.id}`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add Epic
                          </Button>
                        </div>
                      </div>
                      {epics.length > 0 ? (
                        <div className="grid gap-3">
                          {epics.map(epic => {
                            const epicProgress = getEpicProgress(epic.id);
                            const epicTaskCounts = getEpicTaskCounts(epic.id);
                            return (
                              <Link key={epic.id} href={`/projects/${projectId}/epics/${epic.id}`}>
                                <div className="group flex items-center justify-between p-3 rounded-md border bg-background hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-primary/10 text-primary rounded">
                                      <Layers className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <h4 className="font-medium group-hover:text-primary transition-colors">{epic.title}</h4>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span>{epic.startDate} - {epic.endDate}</span>
                                        {epic.stageIds && (
                                            <span className="flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded bg-muted">
                                                {epic.stageIds.length} Stages
                                            </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-6">
                                    <Badge variant="secondary" className="font-normal text-xs">
                                      {epic.status}
                                    </Badge>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                      <CheckCircle2 className="h-3 w-3" />
                                      <span>{epicTaskCounts.done}/{epicTaskCounts.total}</span>
                                    </div>
                                    <div className="flex items-center gap-2 w-24">
                                      <Progress value={epicProgress} className="h-1.5" />
                                      <span className="text-xs text-muted-foreground w-8 text-right">{epicProgress}%</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-6 border border-dashed rounded-md text-center bg-muted/20">
                          <Layers className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground mb-3">
                            No epics created for this deliverable yet.
                          </p>
                          <Button
                            variant="default"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => handleOpenCreateEpic(deliverable.id)}
                            data-testid={`button-add-first-epic-${deliverable.id}`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Create First Epic
                          </Button>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>

      {/* Create Epic Dialog */}
      <Dialog open={isCreateEpicOpen} onOpenChange={setIsCreateEpicOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Epic</DialogTitle>
            <DialogDescription>
              Define a new body of work for this deliverable.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="epic-title">Epic Title</Label>
              <Input 
                id="epic-title" 
                value={newEpicData.title}
                onChange={(e) => setNewEpicData({...newEpicData, title: e.target.value})}
                placeholder="e.g. User Authentication"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="epic-desc">Description</Label>
              <Input 
                id="epic-desc" 
                value={newEpicData.description}
                onChange={(e) => setNewEpicData({...newEpicData, description: e.target.value})}
                placeholder="Brief description of the work..."
              />
            </div>
            
            <div className="space-y-3 pt-2">
              <Label>Assign Stages</Label>
              <div className="text-xs text-muted-foreground mb-2">
                  Select the workflow stages that apply to this epic. This determines the task workflow.
              </div>
              <ScrollArea className="h-[200px] border rounded-md p-2">
                  <div className="space-y-2">
                      {STAGE_TEMPLATES.map(stage => (
                          <div 
                              key={stage.id} 
                              className={cn(
                                  "flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors border",
                                  newEpicData.stageIds.includes(stage.id) 
                                      ? "bg-primary/5 border-primary" 
                                      : "hover:bg-muted border-transparent"
                              )}
                              onClick={() => toggleStageSelection(stage.id)}
                          >
                              <div className={cn(
                                  "h-4 w-4 rounded border flex items-center justify-center transition-colors",
                                  newEpicData.stageIds.includes(stage.id)
                                      ? "bg-primary border-primary text-primary-foreground"
                                      : "border-muted-foreground"
                              )}>
                                  {newEpicData.stageIds.includes(stage.id) && <Check className="h-3 w-3" />}
                              </div>
                              <div className="flex-1">
                                  <div className="text-sm font-medium">{stage.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                      Includes {stage.defaultTasks.length} default tasks
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateEpicOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateEpic}>Create Epic</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deliverable</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deliverableToDelete?.title}"? This action cannot be undone. 
              Any associated epics will remain but will no longer be linked to this deliverable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-deliverable"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function DeliverablesList() {
  const [match, params] = useRoute("/projects/:projectId/deliverables");
  const projectId = params?.projectId || "1";

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={`/projects/${projectId}`} className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Project
            </Link>
            <span className="text-border">|</span>
            <span>Deliverables & Epics</span>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-primary">Deliverables</h1>
              <p className="text-muted-foreground">Manage high-level deliverables and breakdown epics.</p>
            </div>
            {/* Action button moved inside content for consistency */}
          </div>
        </div>

        <DeliverablesContent projectId={projectId} />
      </div>
    </Shell>
  );
}
