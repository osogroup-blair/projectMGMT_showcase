import { useState } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  ArrowLeft, 
  GripVertical, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X,
  ChevronRight,
  Settings2,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useRoute, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { StatusOption, PROJECTS, MILESTONES, TASK_STATUS_OPTIONS } from "@/lib/mock-data";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Mock Types
interface Stage {
  id: string;
  name: string;
  order: number;
  type: "planning" | "execution" | "review" | "delivery";
  entryCriteria: string;
  exitCriteria: string;
  entryMilestoneId?: string;
  exitMilestoneId?: string;
  allowedTaskStatuses: string[];
  customStatuses?: StatusOption[]; // Custom statuses defined for this stage
  defaultView: "kanban" | "list" | "calendar";
  color: string;
  isActive: boolean;
}

// Mock Data
const MOCK_STAGES: Stage[] = [
  { 
    id: "s1", 
    name: "Discovery", 
    order: 1, 
    type: "planning", 
    entryCriteria: "Project Approved", 
    exitCriteria: "Requirements Documented",
    entryMilestoneId: "m1",
    exitMilestoneId: "m1",
    allowedTaskStatuses: ["ts1", "ts2", "ts4"],
    customStatuses: [],
    defaultView: "list",
    color: "bg-purple-500",
    isActive: true 
  },
  { 
    id: "s2", 
    name: "Design", 
    order: 2, 
    type: "execution", 
    entryCriteria: "Wireframes Approved", 
    exitCriteria: "Hi-fi Designs Signed off", 
    entryMilestoneId: "m2",
    exitMilestoneId: "m2",
    allowedTaskStatuses: ["ts1", "ts2", "ts3", "ts4"],
    customStatuses: [],
    defaultView: "kanban",
    color: "bg-blue-500",
    isActive: true 
  },
  { 
    id: "s3", 
    name: "Development", 
    order: 3, 
    type: "execution", 
    entryCriteria: "Sprint Planning Complete", 
    exitCriteria: "Code Reviewed & Merged", 
    entryMilestoneId: "m3",
    exitMilestoneId: "m3",
    allowedTaskStatuses: ["ts1", "ts2", "ts3", "ts4"],
    customStatuses: [],
    defaultView: "kanban",
    color: "bg-indigo-500",
    isActive: true 
  },
  { 
    id: "s4", 
    name: "QA & Testing", 
    order: 4, 
    type: "review", 
    entryCriteria: "Dev Complete", 
    exitCriteria: "Zero Critical Bugs", 
    entryMilestoneId: "m4",
    exitMilestoneId: "m4",
    allowedTaskStatuses: ["ts1", "ts2", "ts4"],
    customStatuses: [],
    defaultView: "list",
    color: "bg-amber-500",
    isActive: true 
  },
  { 
    id: "s5", 
    name: "Launch", 
    order: 5, 
    type: "delivery", 
    entryCriteria: "QA Sign-off", 
    exitCriteria: "Live in Production", 
    entryMilestoneId: "m5",
    exitMilestoneId: "m5",
    allowedTaskStatuses: ["ts1", "ts4"],
    customStatuses: [],
    defaultView: "calendar",
    color: "bg-green-500",
    isActive: true 
  }
];

const COLORS = [
  { name: "Purple", value: "bg-purple-500" },
  { name: "Blue", value: "bg-blue-500" },
  { name: "Indigo", value: "bg-indigo-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Amber", value: "bg-amber-500" },
  { name: "Red", value: "bg-red-500" },
  { name: "Pink", value: "bg-pink-500" },
  { name: "Slate", value: "bg-slate-500" },
];

const STATUS_COLORS = [
  { name: "Slate", value: "bg-slate-100 text-slate-700" },
  { name: "Blue", value: "bg-blue-50 text-blue-700" },
  { name: "Green", value: "bg-green-50 text-green-700" },
  { name: "Amber", value: "bg-amber-50 text-amber-700" },
  { name: "Red", value: "bg-red-50 text-red-700" },
  { name: "Purple", value: "bg-purple-50 text-purple-700" },
  { name: "Pink", value: "bg-pink-50 text-pink-700" },
];

export default function StageDesigner() {
  const [match, params] = useRoute("/projects/:projectId/stages");
  const projectId = params?.projectId || "1";
  const project = PROJECTS.find(p => p.id === projectId) || PROJECTS[0];
  
  const [stages, setStages] = useState<Stage[]>(MOCK_STAGES);
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const { toast } = useToast();

  // Temporary state for editing
  const [editForm, setEditForm] = useState<Partial<Stage>>({});
  
  // State for new custom status
  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusColor, setNewStatusColor] = useState(STATUS_COLORS[0].value);

  const handleEdit = (stage: Stage) => {
    setEditingStage(stage.id);
    setEditForm(JSON.parse(JSON.stringify(stage))); // Deep copy to avoid ref issues with arrays
    setNewStatusName("");
  };

  const handleSave = () => {
    if (editingStage) {
      setStages(prev => prev.map(s => s.id === editingStage ? { ...s, ...editForm } as Stage : s));
      setEditingStage(null);
      setEditForm({});
      toast({
        title: "Stage Updated",
        description: "Your changes have been saved successfully.",
      });
    }
  };

  const handleAddCustomStatus = () => {
    if (!newStatusName.trim()) return;
    
    const newId = `cs_${Date.now()}`;
    const newStatus: StatusOption = {
        id: newId,
        label: newStatusName,
        color: newStatusColor,
        type: 'task',
        isDefault: false
    };

    setEditForm(prev => ({
        ...prev,
        customStatuses: [...(prev.customStatuses || []), newStatus],
        allowedTaskStatuses: [...(prev.allowedTaskStatuses || []), newId]
    }));
    
    setNewStatusName("");
    toast({
        title: "Status Added",
        description: "New custom status has been added to this stage."
    });
  };

  const handleDeleteCustomStatus = (statusId: string) => {
      setEditForm(prev => ({
          ...prev,
          customStatuses: (prev.customStatuses || []).filter(s => s.id !== statusId),
          allowedTaskStatuses: (prev.allowedTaskStatuses || []).filter(id => id !== statusId)
      }));
  };

  const handleCancel = () => {
    setEditingStage(null);
    setEditForm({});
  };

  const handleDelete = (id: string) => {
    setStages(prev => prev.filter(s => s.id !== id));
    toast({
      title: "Stage Deleted",
      description: "The stage has been removed from the workflow.",
      variant: "destructive"
    });
  };

  const handleAddStage = () => {
    const newStage: Stage = {
      id: `new_${Date.now()}`,
      name: "New Stage",
      order: stages.length + 1,
      type: "execution",
      entryCriteria: "",
      exitCriteria: "",
      allowedTaskStatuses: ["ts1", "ts2", "ts4"],
      defaultView: "kanban",
      color: "bg-slate-500",
      isActive: true
    };
    setStages([...stages, newStage]);
    handleEdit(newStage);
  };

  const moveStage = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === stages.length - 1)
    ) return;

    const newStages = [...stages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newStages[index], newStages[targetIndex]] = [newStages[targetIndex], newStages[index]];
    
    // Update orders
    newStages.forEach((s, i) => s.order = i + 1);
    
    setStages(newStages);
  };

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-primary">Stage Designer</h1>
              <p className="text-muted-foreground">Configure the workflow stages for this project.</p>
            </div>
            <Button onClick={handleAddStage} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Stage
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stage List */}
          <div className="lg:col-span-2 space-y-4">
            {stages.map((stage, index) => (
              <div 
                key={stage.id} 
                className={cn(
                  "relative group transition-all duration-200",
                  editingStage === stage.id ? "scale-[1.02] z-10" : ""
                )}
              >
                <Card className={cn(
                  "border-l-4 transition-colors",
                  editingStage === stage.id ? "border-primary shadow-lg" : "border-l-transparent hover:border-l-muted-foreground/30"
                )}>
                  <CardContent className="p-4 flex items-center gap-4">
                    {/* Drag Handle & Order */}
                    <div className="flex flex-col items-center gap-1 text-muted-foreground">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 hover:bg-muted"
                        onClick={() => moveStage(index, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronRight className="h-3 w-3 -rotate-90" />
                      </Button>
                      <span className="font-mono text-xs font-bold">{stage.order}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 hover:bg-muted"
                        onClick={() => moveStage(index, 'down')}
                        disabled={index === stages.length - 1}
                      >
                        <ChevronRight className="h-3 w-3 rotate-90" />
                      </Button>
                    </div>

                    <div className="h-8 w-px bg-border" />

                    {/* Stage Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <div className={cn("w-3 h-3 rounded-full", stage.color)} />
                        <h3 className="font-semibold text-sm truncate">{stage.name}</h3>
                        <Badge variant="secondary" className="text-[10px] uppercase font-medium">
                          {stage.type}
                        </Badge>
                        {!stage.isActive && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">Inactive</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1" title="Entry Milestone">
                           <ChevronRight className="h-3 w-3 text-green-600" />
                           <span className="truncate max-w-[100px]">{MILESTONES.find(m => m.id === stage.entryMilestoneId)?.name || "No Entry Milestone"}</span>
                        </div>
                        <div className="flex items-center gap-1" title="Exit Milestone">
                           <Check className="h-3 w-3 text-blue-600" />
                           <span className="truncate max-w-[100px]">{MILESTONES.find(m => m.id === stage.exitMilestoneId)?.name || "No Exit Milestone"}</span>
                        </div>
                        <span className="truncate hidden sm:inline text-muted-foreground/50">|</span>
                        <span className="truncate hidden sm:inline">{stage.allowedTaskStatuses?.length || 0} Statuses</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEdit(stage)}
                        className={cn(editingStage === stage.id && "bg-primary/10 text-primary")}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(stage.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Edit Panel (Inline) */}
                {editingStage === stage.id && (
                  <Card className="mt-2 bg-muted/30 border-primary/20 animate-in slide-in-from-top-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Edit Stage Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="stage-name">Stage Name</Label>
                          <Input 
                            id="stage-name" 
                            value={editForm.name} 
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="stage-type">Type</Label>
                          <SearchableSelect 
                            value={editForm.type || ""} 
                            onValueChange={(v: any) => setEditForm({ ...editForm, type: v })}
                            options={[
                              { value: "planning", label: "Planning" },
                              { value: "execution", label: "Execution" },
                              { value: "review", label: "Review" },
                              { value: "delivery", label: "Delivery" }
                            ]}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="entry-criteria">Entry Milestone</Label>
                          <SearchableSelect 
                            value={editForm.entryMilestoneId || ""} 
                            onValueChange={(v) => setEditForm({ ...editForm, entryMilestoneId: v })}
                            placeholder="Select Entry Milestone"
                            options={[
                              { value: "none", label: "None" },
                              ...MILESTONES.map(m => ({ value: m.id, label: m.name }))
                            ]}
                          />
                          <Input 
                            id="entry-criteria" 
                            value={editForm.entryCriteria} 
                            onChange={(e) => setEditForm({ ...editForm, entryCriteria: e.target.value })}
                            placeholder="Additional Entry Criteria"
                            className="mt-2"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="exit-criteria">Exit Milestone</Label>
                          <SearchableSelect 
                            value={editForm.exitMilestoneId || ""} 
                            onValueChange={(v) => setEditForm({ ...editForm, exitMilestoneId: v })}
                            placeholder="Select Exit Milestone"
                            options={[
                              { value: "none", label: "None" },
                              ...MILESTONES.map(m => ({ value: m.id, label: m.name }))
                            ]}
                          />
                          <Input 
                            id="exit-criteria" 
                            value={editForm.exitCriteria} 
                            onChange={(e) => setEditForm({ ...editForm, exitCriteria: e.target.value })}
                            placeholder="Additional Exit Criteria"
                            className="mt-2"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                         <div className="flex items-center justify-between">
                            <Label>Task Status Configuration</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                                        <Plus className="h-3 w-3" />
                                        New Status
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-3" align="end">
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-xs leading-none">Add Custom Status</h4>
                                        <div className="space-y-2">
                                            <Input 
                                                placeholder="Status Label (e.g. Needs Review)" 
                                                value={newStatusName}
                                                onChange={(e) => setNewStatusName(e.target.value)}
                                                className="h-8 text-xs"
                                            />
                                            <div className="grid grid-cols-5 gap-1">
                                                {STATUS_COLORS.map((c) => (
                                                    <button
                                                        key={c.name}
                                                        onClick={() => setNewStatusColor(c.value)}
                                                        className={cn(
                                                            "w-full aspect-square rounded-md border transition-all",
                                                            c.value,
                                                            newStatusColor === c.value ? "ring-2 ring-primary ring-offset-1" : "hover:opacity-80"
                                                        )}
                                                        title={c.name}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <Button size="sm" className="w-full h-8 text-xs" onClick={handleAddCustomStatus}>
                                            Add Status
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-2 p-3 border rounded-md bg-background">
                            {/* Global Statuses */}
                            {TASK_STATUS_OPTIONS.map(status => (
                                <div key={status.id} className="flex items-center justify-between group/item">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={`status-${status.id}`} 
                                            checked={editForm.allowedTaskStatuses?.includes(status.id)}
                                            onCheckedChange={(checked) => {
                                                const current = editForm.allowedTaskStatuses || [];
                                                const updated = checked 
                                                    ? [...current, status.id]
                                                    : current.filter(id => id !== status.id);
                                                setEditForm({ ...editForm, allowedTaskStatuses: updated });
                                            }}
                                        />
                                        <Label 
                                            htmlFor={`status-${status.id}`} 
                                            className="text-sm font-normal cursor-pointer flex items-center gap-2"
                                        >
                                            <div className={cn("w-2 h-2 rounded-full", status.color.replace("text", "bg").split(" ")[0].replace("50", "500"))} />
                                            {status.label}
                                        </Label>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] h-5 opacity-50">Global</Badge>
                                </div>
                            ))}

                            {/* Custom Statuses */}
                            {(editForm.customStatuses || []).map(status => (
                                <div key={status.id} className="flex items-center justify-between group/item bg-muted/30 -mx-1 px-1 rounded-sm">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={`status-${status.id}`} 
                                            checked={editForm.allowedTaskStatuses?.includes(status.id)}
                                            onCheckedChange={(checked) => {
                                                const current = editForm.allowedTaskStatuses || [];
                                                const updated = checked 
                                                    ? [...current, status.id]
                                                    : current.filter(id => id !== status.id);
                                                setEditForm({ ...editForm, allowedTaskStatuses: updated });
                                            }}
                                        />
                                        <Label 
                                            htmlFor={`status-${status.id}`} 
                                            className="text-sm font-normal cursor-pointer flex items-center gap-2"
                                        >
                                            <div className={cn("w-2 h-2 rounded-full", status.color.replace("text", "bg").split(" ")[0].replace("50", "500"))} />
                                            {status.label}
                                        </Label>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-5 w-5 opacity-0 group-hover/item:opacity-100 text-muted-foreground hover:text-destructive"
                                        onClick={() => handleDeleteCustomStatus(status.id)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Stage Color</Label>
                          <div className="flex gap-2 flex-wrap">
                            {COLORS.map((c) => (
                              <button
                                key={c.value}
                                onClick={() => setEditForm({ ...editForm, color: c.value })}
                                className={cn(
                                  "w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-primary",
                                  c.value,
                                  editForm.color === c.value && "ring-2 ring-offset-2 ring-primary scale-110"
                                )}
                                title={c.name}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="default-view">Default View</Label>
                          <SearchableSelect 
                            value={editForm.defaultView} 
                            onValueChange={(v: any) => setEditForm({ ...editForm, defaultView: v })}
                            options={[
                              { value: "kanban", label: "Kanban Board" },
                              { value: "list", label: "List View" },
                              { value: "calendar", label: "Calendar" }
                            ]}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <Switch 
                            id="is-active" 
                            checked={editForm.isActive} 
                            onCheckedChange={(c) => setEditForm({ ...editForm, isActive: c })} 
                          />
                          <Label htmlFor="is-active" className="cursor-pointer">Active Stage</Label>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={handleCancel}>Cancel</Button>
                          <Button size="sm" onClick={handleSave} className="gap-2">
                            <Save className="h-3 w-3" />
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Preview</CardTitle>
                <CardDescription>How the stages will appear in the project timeline.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative pt-2 pb-6">
                  <div className="absolute top-[7px] left-0 right-0 h-1 bg-muted rounded-full" />
                  <div className="relative flex justify-between">
                    {stages.filter(s => s.isActive).map((stage, i) => (
                      <div key={stage.id} className="flex flex-col items-center gap-2 group">
                        <div className={cn(
                          "w-4 h-4 rounded-full border-2 z-10 bg-background transition-colors",
                          stage.color.replace('bg-', 'border-')
                        )} />
                        <span className="text-[10px] font-medium text-muted-foreground truncate max-w-[60px] text-center">
                          {stage.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/10">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Configuration Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>• <strong>Entry Criteria</strong> defines what must be true before work can start in this stage.</p>
                <p>• <strong>Exit Criteria</strong> defines the definition of done for this stage.</p>
                <p>• Stages can be reordered using the arrows on the left.</p>
                <p>• Inactive stages are hidden from the main project views but preserve historical data.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  );
}
