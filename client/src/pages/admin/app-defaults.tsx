import { useState } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  Plus, 
  Search, 
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  List,
  Tags,
  Sliders,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  PROJECT_STATUS_OPTIONS, 
  TASK_STATUS_OPTIONS,
  StatusOption 
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function AdminAppDefaults({ disableShell = false }: { disableShell?: boolean }) {
  const { toast } = useToast();
  
  // State for Defaults
  const [projectStatuses, setProjectStatuses] = useState<StatusOption[]>(PROJECT_STATUS_OPTIONS);
  const [taskStatuses, setTaskStatuses] = useState<StatusOption[]>(TASK_STATUS_OPTIONS);
  
  const [stageTypes, setStageTypes] = useState([
    { id: "st1", label: "Planning", description: "Initial phase for requirements and scoping" },
    { id: "st2", label: "Execution", description: "Active development and implementation" },
    { id: "st3", label: "Review", description: "Quality assurance and stakeholder review" },
    { id: "st4", label: "Delivery", description: "Deployment and handover" },
  ]);

  // Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentType, setCurrentType] = useState<"project" | "task" | "stage-type">("project");
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const [formData, setFormData] = useState<any>({
    label: "",
    color: "bg-slate-100 text-slate-700",
    description: ""
  });

  const handleOpenEdit = (type: "project" | "task" | "stage-type", item?: any) => {
    setCurrentType(type);
    setEditingItem(item || null);
    if (item) {
      setFormData({ ...item });
    } else {
      setFormData({
        label: "",
        color: "bg-slate-100 text-slate-700",
        description: "",
        type: type
      });
    }
    setIsEditOpen(true);
  };

  const handleSave = () => {
    const newItem = {
      ...formData,
      id: editingItem?.id || `s_${Date.now()}`,
    };

    if (currentType === "project") {
      setProjectStatuses(prev => 
        editingItem ? prev.map(i => i.id === newItem.id ? newItem : i) : [...prev, newItem]
      );
    } else if (currentType === "task") {
      setTaskStatuses(prev => 
        editingItem ? prev.map(i => i.id === newItem.id ? newItem : i) : [...prev, newItem]
      );
    } else if (currentType === "stage-type") {
      setStageTypes(prev => 
        editingItem ? prev.map(i => i.id === newItem.id ? newItem : i) : [...prev, newItem]
      );
    }

    setIsEditOpen(false);
    toast({
      title: "Settings Saved",
      description: `${newItem.label} has been successfully saved.`,
    });
  };

  const handleDelete = (type: "project" | "task" | "stage-type", id: string) => {
    if (type === "project") {
      setProjectStatuses(prev => prev.filter(i => i.id !== id));
    } else if (type === "task") {
      setTaskStatuses(prev => prev.filter(i => i.id !== id));
    } else if (type === "stage-type") {
      setStageTypes(prev => prev.filter(i => i.id !== id));
    }
    toast({
      title: "Item Deleted",
      description: "Item has been removed.",
      variant: "destructive"
    });
  };

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

  const content = (
    <>
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">App Defaults</h1>
            <p className="text-muted-foreground">Configure global application settings and default options.</p>
          </div>
        </div>

        <Tabs defaultValue="status" className="w-full">
          <TabsList>
            <TabsTrigger value="status" className="gap-2">
              <List className="h-4 w-4" />
              Status Options
            </TabsTrigger>
            <TabsTrigger value="stage-types" className="gap-2">
              <Layers className="h-4 w-4" />
              Stage Types
            </TabsTrigger>
            <TabsTrigger value="tags" className="gap-2">
              <Tags className="h-4 w-4" />
              Global Tags
            </TabsTrigger>
            <TabsTrigger value="general" className="gap-2">
              <Sliders className="h-4 w-4" />
              General
            </TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-8 mt-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Project Statuses</CardTitle>
                      <CardDescription>Define the available status options for projects.</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => handleOpenEdit("project")}>
                      <Plus className="h-4 w-4 mr-2" /> Add Status
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-1 divide-y">
                      {projectStatuses.map(status => (
                        <div key={status.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className={cn("font-normal border-0", status.color)}>
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit("project", status)}>
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDelete("project", status.id)}>
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
                    <Button size="sm" onClick={() => handleOpenEdit("task")}>
                      <Plus className="h-4 w-4 mr-2" /> Add Status
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="grid grid-cols-1 divide-y">
                      {taskStatuses.map(status => (
                        <div key={status.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className={cn("font-normal border-0", status.color)}>
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit("task", status)}>
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDelete("task", status.id)}>
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
          </TabsContent>

          <TabsContent value="stage-types" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Stage Types</CardTitle>
                    <CardDescription>Define the categories available for project stages.</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => handleOpenEdit("stage-type")}>
                    <Plus className="h-4 w-4 mr-2" /> Add Type
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-1 divide-y">
                    {stageTypes.map(type => (
                      <div key={type.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-muted-foreground">{type.description}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit("stage-type", type)}>
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleDelete("stage-type", type.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tags" className="mt-6">
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <Tags className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium">Tag Management</h3>
                <p>Global tag configuration coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general" className="mt-6">
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <Sliders className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-medium">General Settings</h3>
                <p>System-wide defaults configuration coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit" : "Create"} Status Option</DialogTitle>
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
                placeholder={currentType === "stage-type" ? "e.g. Planning" : "e.g. In Review"}
              />
            </div>
            
            {currentType === "stage-type" && (
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  placeholder="Short description of this stage type"
                />
              </div>
            )}

            {currentType !== "stage-type" && (
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
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Option</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  if (disableShell) return content;

  return (
    <Shell>
      {content}
    </Shell>
  );
}
