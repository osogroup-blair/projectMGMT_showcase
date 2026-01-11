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
  LayoutGrid,
  ChevronDown,
  Pencil,
  X,
  Trash2,
  Search,
  ChevronsUpDown,
  ListTodo
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRoute, Link } from "wouter";
import { STAGE_TEMPLATES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useDeliverables, useEpics, useUsers, useTasks } from "@/hooks/use-nexus-data";
import { Loader2, User, ExternalLink } from "lucide-react";
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
import { TabToolbar } from "@/components/ui/tab-toolbar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Export content component separately for reuse
export function DeliverablesContent({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Expand/Collapse all state
  const [expandedDeliverables, setExpandedDeliverables] = useState<string[]>([]);
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());

  const deliverables = allDeliverables.filter((d: any) => d.projectId === projectId);
  
  // Filter deliverables by search query
  const filteredDeliverables = useMemo(() => {
    if (!searchQuery.trim()) return deliverables;
    const query = searchQuery.toLowerCase();
    return deliverables.filter((d: any) => 
      d.title?.toLowerCase().includes(query) ||
      d.description?.toLowerCase().includes(query)
    );
  }, [deliverables, searchQuery]);
  
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

  // Expand/Collapse All handlers
  const handleExpandAll = () => {
    setExpandedDeliverables(filteredDeliverables.map((d: any) => d.id));
    const allEpicIds = new Set<string>();
    filteredDeliverables.forEach((d: any) => {
      getEpicsForDeliverable(d.id).forEach((e: any) => allEpicIds.add(e.id));
    });
    setExpandedEpics(allEpicIds);
  };

  const handleCollapseAll = () => {
    setExpandedDeliverables([]);
    setExpandedEpics(new Set());
  };

  const toggleEpicExpanded = (epicId: string) => {
    setExpandedEpics(prev => {
      const next = new Set(prev);
      if (next.has(epicId)) {
        next.delete(epicId);
      } else {
        next.add(epicId);
      }
      return next;
    });
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
      } catch (error) {
        toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
      }
    }
    cancelEditing();
  };

  const handleDateChange = async (deliverableId: string, field: "startDate" | "dueDate", date: Date | undefined) => {
    if (!date) return;
    const dateStr = format(date, "yyyy-MM-dd");
    try {
      await updateDeliverableAsync({ id: deliverableId, updates: { [field]: dateStr } });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update date.", variant: "destructive" });
    }
  };

  const handleOwnerChange = async (deliverableId: string, newOwnerId: string) => {
    try {
      await updateDeliverableAsync({ id: deliverableId, updates: { ownerId: newOwnerId } });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update owner.", variant: "destructive" });
    }
    cancelEditing();
  };

  useEffect(() => {
    if (editingField === "title") {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (editingField === "description") {
      textareaRef.current?.focus();
    }
  }, [editingField]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Not set";
    try {
      return format(parseISO(dateStr), "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  if (isDeliverablesLoading || isEpicsLoading || isUsersLoading || isTasksLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {/* Hidden trigger for tab-level Add button */}
      <button 
        data-testid="button-create-deliverables" 
        onClick={handleCreateDeliverable} 
        className="hidden" 
        aria-hidden="true"
      />

      <div className="py-3 border-b">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search deliverables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9"
              data-testid="input-search-deliverables"
            />
          </div>
          
          {/* Expand/Collapse All controls */}
          <div className="flex items-center gap-1 border rounded-md">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs"
              onClick={handleExpandAll}
              data-testid="button-expand-all"
            >
              <ChevronsUpDown className="h-3.5 w-3.5 mr-1" />
              Expand All
            </Button>
            <div className="w-px h-4 bg-border" />
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs"
              onClick={handleCollapseAll}
              data-testid="button-collapse-all"
            >
              Collapse All
            </Button>
          </div>

          <Button 
            size="sm"
            className="gap-1.5"
            onClick={handleCreateDeliverable}
            data-testid="button-add-deliverable"
          >
            <Plus className="h-4 w-4" />
            Add Deliverable
          </Button>
          <div className="flex items-center rounded-md bg-muted p-0.5 ml-auto">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded text-sm transition-colors",
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
              onClick={() => setViewMode("card")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded text-sm transition-colors",
                viewMode === "card" 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid="button-view-card"
            >
              <LayoutGrid className="h-4 w-4" />
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* Deliverables Content */}
      <div className="space-y-6 pt-4">
        {filteredDeliverables.length === 0 && deliverables.length > 0 ? (
          <Card className="bg-muted/10 border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No deliverables match your search</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-2">
                Try adjusting your search terms.
              </p>
            </CardContent>
          </Card>
        ) : deliverables.length === 0 ? (
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
        ) : viewMode === "card" ? (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDeliverables.map((deliverable: any) => {
              const epics = getEpicsForDeliverable(deliverable.id);
              const owner = getOwner(deliverable.ownerId);
              const progress = getDeliverableProgress(deliverable.id);
              const taskCounts = getDeliverableTaskCounts(deliverable.id);

              return (
                <Card 
                  key={deliverable.id} 
                  className="hover:shadow-md transition-shadow group"
                  data-testid={`deliverable-card-${deliverable.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={cn(
                          "p-2 rounded-lg shrink-0",
                          deliverable.status === "Completed" ? "bg-green-100 text-green-700" :
                          deliverable.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                          "bg-slate-100 text-slate-700"
                        )}>
                          <Package className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/projects/${projectId}/deliverables/${deliverable.id}`}>
                            <h4 className="font-semibold text-sm hover:text-primary truncate">
                              {deliverable.title}
                            </h4>
                          </Link>
                          {deliverable.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {deliverable.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{taskCounts.done}/{taskCounts.total} tasks</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />

                      <div className="flex flex-wrap gap-1.5">
                        <Badge 
                          variant="secondary"
                          className={cn(
                            "text-[10px]",
                            deliverable.status === "Completed" ? "bg-green-100 text-green-700" :
                            deliverable.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                            "bg-slate-100 text-slate-700"
                          )}
                        >
                          {deliverable.status}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {epics.length} epic{epics.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                        <div className="flex items-center gap-1.5">
                          {owner ? (
                            <>
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[8px]">
                                  {owner.name?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate max-w-[80px]">{owner.name?.split(' ')[0]}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">No owner</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {deliverable.dueDate 
                            ? new Date(deliverable.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                            : '—'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* List View - Nested hierarchy like Milestones */
          <Accordion 
            type="multiple" 
            value={expandedDeliverables}
            onValueChange={setExpandedDeliverables}
            className="space-y-4"
          >
            {filteredDeliverables.map(deliverable => {
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
                                <SearchableSelect 
                                  value={deliverable.ownerId || ""} 
                                  onValueChange={(value) => handleOwnerChange(deliverable.id, value)}
                                  placeholder="Select owner"
                                  triggerClassName="h-6 text-xs w-32"
                                  data-testid={`select-owner-${deliverable.id}`}
                                  options={(users || []).map((u: any) => ({ value: u.id, label: u.name }))}
                                />
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

                            {/* Start Date - with date picker */}
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <CalendarIcon className="h-3.5 w-3.5" />
                              <span>Start:</span>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-5 px-1 text-xs font-normal hover:bg-muted">
                                    {formatDate(deliverable.startDate)}
                                    <Pencil className="h-2.5 w-2.5 ml-1 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={deliverable.startDate ? parseISO(deliverable.startDate) : undefined}
                                    onSelect={(date) => handleDateChange(deliverable.id, "startDate", date)}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>

                            {/* Due Date - with date picker */}
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <CalendarIcon className="h-3.5 w-3.5" />
                              <span>Due:</span>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-5 px-1 text-xs font-normal hover:bg-muted">
                                    {formatDate(deliverable.dueDate)}
                                    <Pencil className="h-2.5 w-2.5 ml-1 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={deliverable.dueDate ? parseISO(deliverable.dueDate) : undefined}
                                    onSelect={(date) => handleDateChange(deliverable.id, "dueDate", date)}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>

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
                      {/* Delete button only */}
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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
                          Epics ({epics.length})
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
                        <div className="space-y-2">
                          {epics.map(epic => {
                            const epicProgress = getEpicProgress(epic.id);
                            const epicTaskCounts = getEpicTaskCounts(epic.id);
                            const epicTasks = getTasksForEpic(epic.id);
                            const isEpicExpanded = expandedEpics.has(epic.id);

                            return (
                              <Collapsible 
                                key={epic.id} 
                                open={isEpicExpanded}
                                onOpenChange={() => toggleEpicExpanded(epic.id)}
                              >
                                <div className="border rounded-md bg-background">
                                  <CollapsibleTrigger asChild>
                                    <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                                      <div className="flex items-center gap-3">
                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                          {isEpicExpanded ? (
                                            <ChevronDown className="h-4 w-4" />
                                          ) : (
                                            <ChevronRight className="h-4 w-4" />
                                          )}
                                        </Button>
                                        <div className="p-1.5 bg-primary/10 text-primary rounded">
                                          <Layers className="h-4 w-4" />
                                        </div>
                                        <div>
                                          <Link href={`/projects/${projectId}/epics/${epic.id}`} onClick={(e) => e.stopPropagation()}>
                                            <h4 className="font-medium hover:text-primary transition-colors">{epic.title}</h4>
                                          </Link>
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{formatDate(epic.startDate)} - {formatDate(epic.endDate)}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-6">
                                        <Badge variant="secondary" className="font-normal text-xs">
                                          {epic.status}
                                        </Badge>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                          <ListTodo className="h-3 w-3" />
                                          <span>{epicTaskCounts.done}/{epicTaskCounts.total}</span>
                                        </div>
                                        <div className="flex items-center gap-2 w-24">
                                          <Progress value={epicProgress} className="h-1.5" />
                                          <span className="text-xs text-muted-foreground w-8 text-right">{epicProgress}%</span>
                                        </div>
                                      </div>
                                    </div>
                                  </CollapsibleTrigger>
                                  
                                  <CollapsibleContent>
                                    <div className="border-t px-3 py-2 bg-muted/20">
                                      {epicTasks.length > 0 ? (
                                        <div className="space-y-1">
                                          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-1">
                                            Tasks ({epicTasks.length})
                                          </div>
                                          {epicTasks.map((task: any) => {
                                            const assignee = users.find((u: any) => u.id === task.assigneeId);
                                            return (
                                              <Link key={task.id} href={`/projects/${projectId}/tasks/${task.id}`}>
                                                <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors cursor-pointer">
                                                  <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                      "w-2 h-2 rounded-full",
                                                      task.status === "Done" ? "bg-green-500" :
                                                      task.status === "In Progress" ? "bg-blue-500" :
                                                      task.status === "Review" ? "bg-amber-500" :
                                                      "bg-slate-400"
                                                    )} />
                                                    <span className="text-sm">{task.title}</span>
                                                  </div>
                                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <Badge variant="outline" className="text-[10px]">{task.status}</Badge>
                                                    {assignee && (
                                                      <div className="flex items-center gap-1">
                                                        <Avatar className="h-4 w-4">
                                                          <AvatarFallback className="text-[8px]">
                                                            {assignee.name?.charAt(0)}
                                                          </AvatarFallback>
                                                        </Avatar>
                                                      </div>
                                                    )}
                                                    {task.deadline && (
                                                      <span>{formatDate(task.deadline)}</span>
                                                    )}
                                                  </div>
                                                </div>
                                              </Link>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <div className="text-center py-4 text-sm text-muted-foreground">
                                          No tasks in this epic yet.
                                        </div>
                                      )}
                                    </div>
                                  </CollapsibleContent>
                                </div>
                              </Collapsible>
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
          </div>
        </div>

        <DeliverablesContent projectId={projectId} />
      </div>
    </Shell>
  );
}
