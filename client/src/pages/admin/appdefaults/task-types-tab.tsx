import { useState } from "react";
import { Plus, Pencil, Trash2, ListChecks } from "lucide-react";
import { useTaskTypes } from "@/hooks/use-nexus-data";
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
import { cn } from "@/lib/utils";

const ColorPicker = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const colors = [
    { label: "Slate", value: "bg-slate-100 text-slate-700" },
    { label: "Blue", value: "bg-blue-50 text-blue-700" },
    { label: "Green", value: "bg-green-50 text-green-700" },
    { label: "Purple", value: "bg-purple-50 text-purple-700" },
    { label: "Red", value: "bg-red-50 text-red-700" },
    { label: "Amber", value: "bg-amber-50 text-amber-700" },
    { label: "Cyan", value: "bg-cyan-50 text-cyan-700" },
    { label: "Pink", value: "bg-pink-50 text-pink-700" },
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

export function TaskTypesTab() {
  const { toast } = useToast();
  const { data: taskTypes = [], createAsync: createTaskType, updateAsync: updateTaskType, removeAsync: deleteTaskType, isLoading } = useTaskTypes();
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: "",
    color: "bg-slate-100 text-slate-700",
    description: "",
  });

  const handleOpenEdit = (item?: any) => {
    setEditingItem(item || null);
    if (item) {
      setFormData({ ...item });
    } else {
      setFormData({
        name: "",
        color: "bg-slate-100 text-slate-700",
        description: "",
      });
    }
    setIsEditOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const data = {
        name: formData.name,
        color: formData.color,
        description: formData.description || "",
      };
      if (editingItem) {
        await updateTaskType({ id: editingItem.id, updates: data });
      } else {
        await createTaskType(data);
      }
      setIsEditOpen(false);
      toast({
        title: "Settings Saved",
        description: `${formData.name} has been successfully saved.`,
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

  const handleDelete = async (id: string) => {
    try {
      await deleteTaskType(id);
      toast({
        title: "Item Deleted",
        description: "Task type has been removed.",
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
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Task Types</CardTitle>
              <CardDescription>Define the categories available for tasks (e.g., Bug, Feature, Research).</CardDescription>
            </div>
            <Button size="sm" onClick={() => handleOpenEdit()} data-testid="button-add-task-type">
              <Plus className="h-4 w-4 mr-2" /> Add Task Type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading task types...</div>
          ) : taskTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ListChecks className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No task types defined yet. Add your first task type to get started.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="grid grid-cols-1 divide-y">
                {taskTypes.map((type: any) => (
                  <div key={type.id} className="flex items-center justify-between p-4 hover:bg-muted/50" data-testid={`row-task-type-${type.id}`}>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={cn("font-normal border-0", type.color)}>
                        {type.name}
                      </Badge>
                      {type.description && (
                        <span className="text-sm text-muted-foreground">{type.description}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(type)} data-testid={`button-edit-task-type-${type.id}`}>
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDelete(type.id)} data-testid={`button-delete-task-type-${type.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit" : "Create"} Task Type
            </DialogTitle>
            <DialogDescription>
              Configure the task type name, color, and description.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="e.g. Bug, Feature, Research"
                data-testid="input-task-type-name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input 
                id="description" 
                value={formData.description || ""} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                placeholder="Brief description of this task type"
                data-testid="input-task-type-description"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Color</Label>
              <ColorPicker 
                value={formData.color || ""} 
                onChange={(c) => setFormData({...formData, color: c})} 
              />
              <div className="mt-4 p-4 border rounded-md flex items-center justify-center bg-muted/20">
                <Badge variant="outline" className={cn("font-normal border-0 text-sm py-1 px-3", formData.color)}>
                  {formData.name || "Preview"}
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} data-testid="button-cancel-task-type">Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} data-testid="button-save-task-type">
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
