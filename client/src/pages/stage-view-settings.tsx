import { useState } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  ArrowLeft, 
  Save, 
  Layout, 
  List, 
  Kanban, 
  Calendar, 
  GanttChart,
  Eye,
  ArrowUpDown,
  Filter,
  BarChart3,
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
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useRoute, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PROJECTS } from "@/lib/mock-data";

// Mock Types
interface ViewConfig {
  id: string;
  viewType: "kanban" | "table" | "timeline" | "list" | "calendar";
  visibleFields: string[];
  sortField: string;
  sortDirection: "asc" | "desc";
  filters: { field: string; operator: string; value: string }[];
  metrics: { type: string; field: string }[];
  isDefault: boolean;
}

// Mock Data
const AVAILABLE_FIELDS = [
  { id: "name", label: "Task Name" },
  { id: "assignee", label: "Assignee" },
  { id: "dueDate", label: "Due Date" },
  { id: "priority", label: "Priority" },
  { id: "status", label: "Status" },
  { id: "tags", label: "Tags" },
  { id: "estimatedHours", label: "Est. Hours" },
  { id: "actualHours", label: "Actual Hours" },
  { id: "description", label: "Description" },
];

const VIEW_TYPES = [
  { id: "kanban", label: "Kanban Board", icon: Kanban },
  { id: "table", label: "Table Grid", icon: Layout },
  { id: "list", label: "Simple List", icon: List },
  { id: "timeline", label: "Timeline", icon: GanttChart },
  { id: "calendar", label: "Calendar", icon: Calendar },
];

export default function StageViewSettings() {
  const [match, params] = useRoute("/projects/:projectId/stages/:stageId/view-settings");
  const projectId = params?.projectId || "1";
  const stageId = params?.stageId || "s1";
  const project = PROJECTS.find(p => p.id === projectId) || PROJECTS[0];
  const { toast } = useToast();

  // Mock initial state
  const [config, setConfig] = useState<ViewConfig>({
    id: "vc1",
    viewType: "kanban",
    visibleFields: ["name", "assignee", "dueDate", "priority"],
    sortField: "dueDate",
    sortDirection: "asc",
    filters: [],
    metrics: [{ type: "count", field: "id" }],
    isDefault: true
  });

  const handleSave = (asPersonal: boolean = false) => {
    toast({
      title: asPersonal ? "Personal View Saved" : "Stage View Updated",
      description: asPersonal 
        ? "This view has been saved to your personal collection." 
        : "The default view configuration for this stage has been updated.",
    });
  };

  const toggleField = (fieldId: string) => {
    setConfig(prev => ({
      ...prev,
      visibleFields: prev.visibleFields.includes(fieldId)
        ? prev.visibleFields.filter(f => f !== fieldId)
        : [...prev.visibleFields, fieldId]
    }));
  };

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-primary">Stage View Settings</h1>
              <p className="text-muted-foreground">Configure how tasks are displayed in the <span className="font-medium text-foreground">Discovery</span> stage.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleSave(true)}>
                Save as Personal View
              </Button>
              <Button onClick={() => handleSave(false)} className="gap-2">
                <Save className="h-4 w-4" />
                Save Configuration
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-8">
            {/* View Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layout className="h-5 w-5 text-primary" />
                  View Layout
                </CardTitle>
                <CardDescription>Select the primary visualization method for this stage.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {VIEW_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = config.viewType === type.id;
                    return (
                      <div
                        key={type.id}
                        onClick={() => setConfig({ ...config, viewType: type.id as any })}
                        className={cn(
                          "cursor-pointer rounded-lg border-2 p-4 flex flex-col items-center gap-3 transition-all hover:bg-muted/50",
                          isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-muted"
                        )}
                      >
                        <div className={cn("p-2 rounded-full", isSelected ? "bg-primary text-primary-foreground" : "bg-muted")}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className={cn("text-sm font-medium", isSelected ? "text-primary" : "text-muted-foreground")}>
                          {type.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Sorting & Filtering */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-primary" />
                    Default Sort
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Sort Field</Label>
                    <Select 
                      value={config.sortField} 
                      onValueChange={(v) => setConfig({ ...config, sortField: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_FIELDS.map(f => (
                          <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Direction</Label>
                    <Select 
                      value={config.sortDirection} 
                      onValueChange={(v: "asc" | "desc") => setConfig({ ...config, sortDirection: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascending (A-Z)</SelectItem>
                        <SelectItem value="desc">Descending (Z-A)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Metrics Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Primary Metric</Label>
                    <Select defaultValue="count">
                      <SelectTrigger>
                        <SelectValue placeholder="Select metric..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="count">Item Count</SelectItem>
                        <SelectItem value="sum_hours">Sum of Hours</SelectItem>
                        <SelectItem value="avg_priority">Average Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <Switch id="show-totals" defaultChecked />
                    <Label htmlFor="show-totals">Show column totals</Label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar - Field Visibility */}
          <div className="space-y-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Visible Fields
                </CardTitle>
                <CardDescription>Choose which fields appear on cards/rows.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {AVAILABLE_FIELDS.map((field) => (
                    <div key={field.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                      <Checkbox 
                        id={`field-${field.id}`} 
                        checked={config.visibleFields.includes(field.id)}
                        onCheckedChange={() => toggleField(field.id)}
                      />
                      <Label 
                        htmlFor={`field-${field.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {field.label}
                      </Label>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Default View</Label>
                      <p className="text-xs text-muted-foreground">Apply to all users</p>
                    </div>
                    <Switch 
                      checked={config.isDefault}
                      onCheckedChange={(c) => setConfig({ ...config, isDefault: c })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  )
}
