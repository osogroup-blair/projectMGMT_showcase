import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useStatusOptions } from "@/hooks/use-nexus-data";
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
import { useToast } from "@/hooks/use-toast";
import type { StatusOption } from "@shared/schema";
import { cn } from "@/lib/utils";

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

export function StatusOptionsTab() {
  const { toast } = useToast();
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
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<any>({
    label: "",
    color: "bg-slate-100 text-slate-700",
  });

  const handleOpenEdit = (type: "project" | "task", item?: any) => {
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
    setIsSaving(true);
    try {
      const statusData = {
        label: formData.label,
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
      toast({
        title: "Settings Saved",
        description: `${formData.label} has been successfully saved.`,
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

  const handleDelete = async (type: "project" | "task", id: string) => {
    try {
      await deleteStatusOption(id);
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
              <Button size="sm" onClick={() => handleOpenEdit("project")} data-testid="button-add-project-status">
                <Plus className="h-4 w-4 mr-2" /> Add Status
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="grid grid-cols-1 divide-y">
                {projectStatuses.map(status => (
                  <div key={status.id} className="flex items-center justify-between p-4 hover:bg-muted/50" data-testid={`row-project-status-${status.id}`}>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={cn("font-normal border-0", status.color)}>
                        {status.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit("project", status)} data-testid={`button-edit-project-status-${status.id}`}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDelete("project", status.id)} data-testid={`button-delete-project-status-${status.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Task Statuses</CardTitle>
                <CardDescription>Define the workflow states for tasks.</CardDescription>
              </div>
              <Button size="sm" onClick={() => handleOpenEdit("task")} data-testid="button-add-task-status">
                <Plus className="h-4 w-4 mr-2" /> Add Status
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="grid grid-cols-1 divide-y">
                {taskStatuses.map(status => (
                  <div key={status.id} className="flex items-center justify-between p-4 hover:bg-muted/50" data-testid={`row-task-status-${status.id}`}>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={cn("font-normal border-0", status.color)}>
                        {status.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit("task", status)} data-testid={`button-edit-task-status-${status.id}`}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDelete("task", status.id)} data-testid={`button-delete-task-status-${status.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
    </>
  );
}
