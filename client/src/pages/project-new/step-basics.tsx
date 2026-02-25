import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StepProps, getDefaultDueDate, DEFAULT_PROJECT_DURATION_WEEKS } from "./types";
import { useEffect, useRef } from "react";
import { Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useClients } from "@/hooks/use-clients";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface ProjectBasicsData {
  name: string;
  description: string;
  startDate: string;
  dueDate: string;
  clientId?: string;
}

import { forwardRef, useImperativeHandle } from "react";

export const StepBasics = forwardRef(({
  projectData,
  setProjectData,
}: StepProps, ref) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { allClients } = useClients();

  useImperativeHandle(ref, () => ({
    handleExport,
    fileInputRef
  }));
  useEffect(() => {
    if (projectData.startDate && !projectData.dueDate) {
      setProjectData(prev => ({
        ...prev,
        dueDate: getDefaultDueDate(prev.startDate, DEFAULT_PROJECT_DURATION_WEEKS)
      }));
    }
  }, [projectData.startDate]);

  const handleStartDateChange = (newStartDate: string) => {
    setProjectData(prev => ({
      ...prev,
      startDate: newStartDate,
      dueDate: prev.dueDate || getDefaultDueDate(newStartDate, DEFAULT_PROJECT_DURATION_WEEKS)
    }));
  };

  const handleExport = () => {
    const exportData: ProjectBasicsData = {
      name: projectData.name,
      description: projectData.description || "",
      startDate: projectData.startDate,
      dueDate: projectData.dueDate,
      clientId: projectData.clientId || "",
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `project-basics-${projectData.name || "new"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Project settings exported successfully." });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as Partial<ProjectBasicsData>;
        setProjectData(prev => ({
          ...prev,
          name: data.name || prev.name,
          description: data.description || prev.description,
          startDate: data.startDate || prev.startDate,
          dueDate: data.dueDate || prev.dueDate,
          clientId: data.clientId || prev.clientId,
        }));
        toast({ title: "Imported", description: "Project settings imported successfully." });
      } catch {
        toast({ title: "Import Failed", description: "Invalid file format.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name *</Label>
            <Input
              id="projectName"
              placeholder="e.g. Website Rebrand 2024"
              value={projectData.name}
              onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
              data-testid="input-project-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the goals and scope of this project..."
              className="h-32"
              value={projectData.description}
              onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
              data-testid="input-project-description"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={projectData.startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                data-testid="input-project-start-date"
              />
              <p className="text-xs text-muted-foreground">
                Default: Today
              </p>
            </div>
            <div className="space-y-2">
              <Label>End Date *</Label>
              <Input
                type="date"
                value={projectData.dueDate}
                onChange={(e) => setProjectData({ ...projectData, dueDate: e.target.value })}
                data-testid="input-project-due-date"
              />
              <p className="text-xs text-muted-foreground">
                Default: {DEFAULT_PROJECT_DURATION_WEEKS} weeks from start
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientId">Client (Optional)</Label>
            <SearchableSelect
              options={allClients.map(c => ({ value: c.id, label: c.name }))}
              value={projectData.clientId || ""}
              onValueChange={(val) => setProjectData({ ...projectData, clientId: val })}
              placeholder="Select a client..."
              searchPlaceholder="Search clients..."
              emptyMessage="No clients found."
            />
          </div>
        </div>
      </div>

      <div className="bg-muted/30 rounded-lg p-4 mt-6">
        <h4 className="font-medium text-sm mb-2">What's next?</h4>
        <p className="text-sm text-muted-foreground">
          In the following steps, you'll configure sprints, assign team members, set up stages with tasks and milestones,
          and define deliverables and epics. You can apply templates in Stage Configuration or build everything from scratch.
        </p>
      </div>
    </div>
  );
});
