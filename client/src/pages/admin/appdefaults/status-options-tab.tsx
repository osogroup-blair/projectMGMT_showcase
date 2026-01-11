import { useState, useMemo, useEffect } from "react";
import { Plus, Pencil, Trash2, GripVertical, AlertTriangle, ArrowRight, Loader2, Map } from "lucide-react";
import { useStatusOptions } from "@/hooks/use-nexus-data";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { StatusOption } from "@shared/schema";
import { cn } from "@/lib/utils";

interface StatusUsageCounts {
  projects: number;
  deliverables: number;
  epics: number;
  tasks: number;
  sprints: number;
  milestones: number;
  projectStages: number;
  workBlocks: number;
  total: number;
}

async function fetchStatusUsage(statusLabel: string): Promise<StatusUsageCounts> {
  const res = await fetch(`/api/statusOptions/usage/${encodeURIComponent(statusLabel)}`);
  if (!res.ok) throw new Error("Failed to fetch usage");
  return res.json();
}

async function remapStatus(oldStatus: string, newStatus: string, entityTypes?: string[]): Promise<StatusUsageCounts> {
  const res = await fetch("/api/statusOptions/remap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ oldStatus, newStatus, entityTypes }),
  });
  if (!res.ok) throw new Error("Failed to remap status");
  return res.json();
}

interface SortableStatusRowProps {
  status: StatusOption;
  type: "project" | "task";
  usageCount: number;
  isLoadingUsage: boolean;
  onEdit: (type: "project" | "task", item: StatusOption) => void;
  onDelete: (type: "project" | "task", item: StatusOption) => void;
}

function SortableStatusRow({ status, type, usageCount, isLoadingUsage, onEdit, onDelete }: SortableStatusRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-4 hover:bg-muted/50 bg-background"
      data-testid={`row-${type}-status-${status.id}`}
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-muted rounded"
          data-testid={`drag-handle-${type}-status-${status.id}`}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <Badge variant="outline" className={cn("font-normal border-0", status.color)}>
          {status.label}
        </Badge>
        {isLoadingUsage ? (
          <span className="text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin inline" />
          </span>
        ) : usageCount > 0 ? (
          <Badge variant="secondary" className="text-xs font-normal" data-testid={`usage-count-${status.id}`}>
            {usageCount} {usageCount === 1 ? "item" : "items"}
          </Badge>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => onEdit(type, status)} data-testid={`button-edit-${type}-status-${status.id}`}>
          <Pencil className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="text-red-600" onClick={() => onDelete(type, status)} data-testid={`button-delete-${type}-status-${status.id}`}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

const ColorPicker = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const colors = [
    { label: "Slate", value: "bg-slate-100 text-slate-700" },
    { label: "Blue", value: "bg-blue-50 text-blue-700" },
    { label: "Green", value: "bg-green-50 text-green-700" },
    { label: "Purple", value: "bg-purple-50 text-purple-700" },
    { label: "Red", value: "bg-red-50 text-red-700" },
    { label: "Amber", value: "bg-amber-50 text-amber-700" },
  ];

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {colors.map(c => (
        <div 
          key={c.label}
          className={cn(
            "w-6 h-6 rounded-full cursor-pointer ring-offset-2 ring-1 ring-transparent",
            c.value.replace("text", "bg").split(" ")[0].replace("50", "500").replace("100", "500"),
            value === c.value && "ring-primary"
          )}
          onClick={() => onChange(c.value)}
          title={c.label}
        />
      ))}
    </div>
  );
};

interface StatusMapperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statusToRemap: StatusOption | null;
  availableStatuses: StatusOption[];
  mode: "edit" | "delete";
  newLabel?: string;
  onConfirm: (targetStatusLabel: string) => Promise<void>;
  usageCounts: StatusUsageCounts | null;
  isRemapping: boolean;
}

function StatusMapperDialog({ 
  open, 
  onOpenChange, 
  statusToRemap, 
  availableStatuses, 
  mode,
  newLabel,
  onConfirm,
  usageCounts,
  isRemapping
}: StatusMapperDialogProps) {
  const [targetStatus, setTargetStatus] = useState<string>("");

  useEffect(() => {
    if (open) {
      setTargetStatus("");
    }
  }, [open]);

  const handleConfirm = async () => {
    if (mode === "edit" && newLabel) {
      await onConfirm(newLabel);
    } else if (targetStatus) {
      await onConfirm(targetStatus);
    }
  };

  if (!statusToRemap || !usageCounts) return null;

  const entityBreakdown = [
    { label: "Tasks", count: usageCounts.tasks },
    { label: "Projects", count: usageCounts.projects },
    { label: "Deliverables", count: usageCounts.deliverables },
    { label: "Epics", count: usageCounts.epics },
    { label: "Sprints", count: usageCounts.sprints },
    { label: "Milestones", count: usageCounts.milestones },
    { label: "Stages", count: usageCounts.projectStages },
    { label: "Work Blocks", count: usageCounts.workBlocks },
  ].filter(e => e.count > 0);

  const isEditMode = mode === "edit" && newLabel;
  const canConfirm = isEditMode ? !!newLabel : !!targetStatus;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {mode === "delete" ? "Cannot Delete Status" : "Update Existing Items?"}
          </DialogTitle>
          <DialogDescription>
            {mode === "delete" 
              ? `"${statusToRemap.label}" is currently used by ${usageCounts.total} items. You must reassign them before deleting.`
              : `"${statusToRemap.label}" is used by ${usageCounts.total} items. Would you like to update them to "${newLabel}"?`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="text-sm space-y-1">
            <p className="font-medium text-muted-foreground">Usage breakdown:</p>
            <div className="flex flex-wrap gap-2">
              {entityBreakdown.map(e => (
                <Badge key={e.label} variant="outline" className="font-normal">
                  {e.count} {e.label}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Badge variant="outline" className={cn("font-normal border-0", statusToRemap.color)}>
              {statusToRemap.label}
            </Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            {isEditMode ? (
              <Badge variant="outline" className={cn("font-normal border-0", statusToRemap.color)}>
                {newLabel}
              </Badge>
            ) : (
              <Select value={targetStatus} onValueChange={setTargetStatus}>
                <SelectTrigger className="w-[180px]" data-testid="select-remap-target">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {availableStatuses
                    .filter(s => s.id !== statusToRemap.id)
                    .map(s => (
                      <SelectItem key={s.id} value={s.label} data-testid={`remap-option-${s.id}`}>
                        <span className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full", s.color?.split(" ")[0])} />
                          {s.label}
                        </span>
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isRemapping} data-testid="button-cancel-remap">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!canConfirm || isRemapping}
            data-testid="button-confirm-remap"
          >
            {isRemapping ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {mode === "edit" ? "Updating..." : "Remapping..."}
              </>
            ) : (
              mode === "delete" ? "Remap & Delete" : "Update All Items"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface StatusUsageMapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statuses: StatusOption[];
  type: "project" | "task";
  usageCountsMap: Record<string, StatusUsageCounts>;
}

function StatusUsageMapDialog({
  open,
  onOpenChange,
  statuses,
  type,
  usageCountsMap,
}: StatusUsageMapDialogProps) {
  const entityLabels = [
    { key: "tasks", label: "Tasks" },
    { key: "projects", label: "Projects" },
    { key: "deliverables", label: "Deliverables" },
    { key: "epics", label: "Epics" },
    { key: "sprints", label: "Sprints" },
    { key: "milestones", label: "Milestones" },
    { key: "projectStages", label: "Stages" },
    { key: "workBlocks", label: "Work Blocks" },
  ] as const;

  const statusesWithUsage = statuses.map(status => ({
    status,
    usage: usageCountsMap[status.label] || null,
  }));

  const totalItems = statusesWithUsage.reduce((sum, { usage }) => sum + (usage?.total || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-blue-500" />
            {type === "project" ? "Project" : "Task"} Status Usage Map
          </DialogTitle>
          <DialogDescription>
            Overview of {totalItems} items across all {type} statuses.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-4">
            {statusesWithUsage.map(({ status, usage }) => {
              const entityBreakdown = usage 
                ? entityLabels.filter(e => (usage[e.key as keyof StatusUsageCounts] as number) > 0)
                : [];
              const hasUsage = usage && usage.total > 0;
              
              return (
                <div 
                  key={status.id}
                  className={cn(
                    "p-3 rounded-lg border",
                    hasUsage ? "bg-muted/30" : "bg-muted/10 opacity-60"
                  )}
                  data-testid={`usage-map-row-${status.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge 
                      variant="outline" 
                      className={cn("font-normal border-0", status.color)}
                    >
                      {status.label}
                    </Badge>
                    <span className="text-sm font-medium">
                      {usage?.total || 0} items
                    </span>
                  </div>
                  
                  {hasUsage && entityBreakdown.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {entityBreakdown.map(e => (
                        <Badge 
                          key={e.key} 
                          variant="secondary" 
                          className="text-xs font-normal"
                        >
                          {usage[e.key as keyof StatusUsageCounts]} {e.label}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {!hasUsage && (
                    <p className="text-xs text-muted-foreground">No items using this status</p>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close-usage-map">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function StatusOptionsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: allStatusOptions = [], createAsync: createStatusOption, updateAsync: updateStatusOption, removeAsync: deleteStatusOption, isLoading } = useStatusOptions();
  
  const projectStatuses = useMemo(() => 
    allStatusOptions.filter((s: StatusOption) => s.type === "project").sort((a: StatusOption, b: StatusOption) => (a.order ?? 0) - (b.order ?? 0)),
    [allStatusOptions]
  );
  const taskStatuses = useMemo(() => 
    allStatusOptions.filter((s: StatusOption) => s.type === "task").sort((a: StatusOption, b: StatusOption) => (a.order ?? 0) - (b.order ?? 0)),
    [allStatusOptions]
  );
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentType, setCurrentType] = useState<"project" | "task">("project");
  const [editingItem, setEditingItem] = useState<StatusOption | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<any>({
    label: "",
    color: "bg-slate-100 text-slate-700",
  });

  const [mapperOpen, setMapperOpen] = useState(false);
  const [mapperMode, setMapperMode] = useState<"edit" | "delete">("delete");
  const [statusToRemap, setStatusToRemap] = useState<StatusOption | null>(null);
  const [pendingNewLabel, setPendingNewLabel] = useState<string>("");
  const [isRemapping, setIsRemapping] = useState(false);

  const [projectMapOpen, setProjectMapOpen] = useState(false);
  const [taskMapOpen, setTaskMapOpen] = useState(false);

  const { data: usageCountsMap = {} } = useQuery({
    queryKey: ["statusUsageCounts", allStatusOptions.map(s => s.label).join(",")],
    queryFn: async () => {
      const counts: Record<string, StatusUsageCounts> = {};
      const uniqueLabels = Array.from(new Set(allStatusOptions.map(s => s.label)));
      await Promise.all(
        uniqueLabels.map(async (label) => {
          try {
            counts[label] = await fetchStatusUsage(label);
          } catch {
            counts[label] = { projects: 0, deliverables: 0, epics: 0, tasks: 0, sprints: 0, milestones: 0, projectStages: 0, workBlocks: 0, total: 0 };
          }
        })
      );
      return counts;
    },
    enabled: allStatusOptions.length > 0,
    staleTime: 30000,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent, type: "project" | "task") => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const items = type === "project" ? projectStatuses : taskStatuses;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    
    try {
      await Promise.all(
        reordered.map((item, index) =>
          updateStatusOption({ id: item.id, updates: { order: index } })
        )
      );
      toast({
        title: "Order Updated",
        description: `${type === "project" ? "Project" : "Task"} status order has been saved.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleOpenEdit = (type: "project" | "task", item?: StatusOption) => {
    setCurrentType(type);
    setEditingItem(item || null);
    if (item) {
      setFormData({ ...item });
    } else {
      setFormData({
        label: "",
        color: "bg-slate-100 text-slate-700",
      });
    }
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    if (!formData.label?.trim()) {
      toast({
        title: "Error",
        description: "Please enter a status label.",
        variant: "destructive",
      });
      return;
    }

    if (editingItem && editingItem.label !== formData.label) {
      const usage = usageCountsMap[editingItem.label];
      if (usage && usage.total > 0) {
        setPendingNewLabel(formData.label);
        setStatusToRemap(editingItem);
        setMapperMode("edit");
        setMapperOpen(true);
        return;
      }
    }

    await performSave();
  };

  const performSave = async (newLabel?: string) => {
    setIsSaving(true);
    try {
      const statusData = {
        label: newLabel || formData.label,
        color: formData.color,
        type: currentType,
        order: currentType === "project" ? projectStatuses.length : taskStatuses.length,
        isDefault: formData.isDefault || false,
      };
      if (editingItem) {
        await updateStatusOption({ id: editingItem.id, updates: statusData });
      } else {
        await createStatusOption(statusData);
      }
      setIsEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["statusUsageCounts"] });
      toast({
        title: "Settings Saved",
        description: `${statusData.label} has been successfully saved.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (type: "project" | "task", status: StatusOption) => {
    const usage = usageCountsMap[status.label];
    if (usage && usage.total > 0) {
      setCurrentType(type);
      setStatusToRemap(status);
      setMapperMode("delete");
      setMapperOpen(true);
      return;
    }

    try {
      await deleteStatusOption(status.id);
      queryClient.invalidateQueries({ queryKey: ["statusUsageCounts"] });
      toast({
        title: "Item Deleted",
        description: "Status option has been removed.",
        variant: "destructive"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRemapConfirm = async (targetStatusLabel: string) => {
    if (!statusToRemap) return;

    setIsRemapping(true);
    try {
      if (mapperMode === "delete") {
        const result = await remapStatus(statusToRemap.label, targetStatusLabel);
        await deleteStatusOption(statusToRemap.id);
        toast({
          title: "Status Remapped & Deleted",
          description: `Moved ${result.total} items to "${targetStatusLabel}" and deleted "${statusToRemap.label}".`,
        });
      } else {
        const result = await remapStatus(statusToRemap.label, targetStatusLabel);
        await performSave(targetStatusLabel);
        toast({
          title: "Status Updated",
          description: `Updated ${result.total} items from "${statusToRemap.label}" to "${targetStatusLabel}".`,
        });
      }
      
      setMapperOpen(false);
      setIsEditOpen(false);
      setStatusToRemap(null);
      setPendingNewLabel("");
      queryClient.invalidateQueries({ queryKey: ["statusUsageCounts"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remap status values. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRemapping(false);
    }
  };

  const availableStatusesForMapper = useMemo(() => {
    if (!statusToRemap) return [];
    return statusToRemap.type === "project" ? projectStatuses : taskStatuses;
  }, [statusToRemap, projectStatuses, taskStatuses]);

  return (
    <>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Project Statuses</CardTitle>
                <CardDescription>Define the available status options for projects.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setProjectMapOpen(true)} data-testid="button-map-project-status">
                  <Map className="h-4 w-4 mr-2" /> Map
                </Button>
                <Button size="sm" onClick={() => handleOpenEdit("project")} data-testid="button-add-project-status">
                  <Plus className="h-4 w-4 mr-2" /> Add Status
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEnd(event, "project")}
              >
                <SortableContext
                  items={projectStatuses.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid grid-cols-1 divide-y">
                    {projectStatuses.map((status) => (
                      <SortableStatusRow
                        key={status.id}
                        status={status}
                        type="project"
                        usageCount={usageCountsMap[status.label]?.total || 0}
                        isLoadingUsage={!usageCountsMap[status.label]}
                        onEdit={handleOpenEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Task Statuses</CardTitle>
                <CardDescription>Define the workflow states for tasks. This order determines Kanban column order.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setTaskMapOpen(true)} data-testid="button-map-task-status">
                  <Map className="h-4 w-4 mr-2" /> Map
                </Button>
                <Button size="sm" onClick={() => handleOpenEdit("task")} data-testid="button-add-task-status">
                  <Plus className="h-4 w-4 mr-2" /> Add Status
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEnd(event, "task")}
              >
                <SortableContext
                  items={taskStatuses.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid grid-cols-1 divide-y">
                    {taskStatuses.map((status) => (
                      <SortableStatusRow
                        key={status.id}
                        status={status}
                        type="task"
                        usageCount={usageCountsMap[status.label]?.total || 0}
                        isLoadingUsage={!usageCountsMap[status.label]}
                        onEdit={handleOpenEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit" : "Create"} Status Option
            </DialogTitle>
            <DialogDescription>
              Configure the status label and appearance.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input 
                id="label" 
                value={formData.label} 
                onChange={(e) => setFormData({...formData, label: e.target.value})} 
                placeholder="e.g. In Review"
                data-testid="input-status-label"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Color Preset</Label>
              <ColorPicker 
                value={formData.color || ""} 
                onChange={(c) => setFormData({...formData, color: c})} 
              />
              <div className="mt-4 p-4 border rounded-md flex items-center justify-center bg-muted/20">
                <Badge variant="outline" className={cn("font-normal border-0 text-sm py-1 px-3", formData.color)}>
                  {formData.label || "Preview Label"}
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} data-testid="button-cancel-status">Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} data-testid="button-save-status">
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StatusMapperDialog
        open={mapperOpen}
        onOpenChange={setMapperOpen}
        statusToRemap={statusToRemap}
        availableStatuses={availableStatusesForMapper}
        mode={mapperMode}
        newLabel={pendingNewLabel}
        onConfirm={handleRemapConfirm}
        usageCounts={statusToRemap ? usageCountsMap[statusToRemap.label] : null}
        isRemapping={isRemapping}
      />

      <StatusUsageMapDialog
        open={projectMapOpen}
        onOpenChange={setProjectMapOpen}
        statuses={projectStatuses}
        type="project"
        usageCountsMap={usageCountsMap}
      />

      <StatusUsageMapDialog
        open={taskMapOpen}
        onOpenChange={setTaskMapOpen}
        statuses={taskStatuses}
        type="task"
        usageCountsMap={usageCountsMap}
      />
    </>
  );
}
