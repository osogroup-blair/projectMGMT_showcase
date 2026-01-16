import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StepProps, getDefaultDueDate, DEFAULT_SPRINT_DURATION, DEFAULT_PROJECT_DURATION_WEEKS } from "./types";
import { useEffect, useRef } from "react";
import { Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProjectBasicsData {
  name: string;
  description: string;
  startDate: string;
  dueDate: string;
  client: string;
  sprintDurationWeeks: number;
}

export function StepBasics({
  projectData,
  setProjectData,
}: StepProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      client: projectData.client || "",
      sprintDurationWeeks: projectData.sprintDurationWeeks,
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
          client: data.client || prev.client,
          sprintDurationWeeks: data.sprintDurationWeeks ?? prev.sprintDurationWeeks,
        }));
        toast({ title: "Imported", description: "Project settings imported successfully." });
      } catch {
        toast({ title: "Import Failed", description: "Invalid file format.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sprintDurationOptions = [
    { value: "0", label: "No Sprints" },
    { value: "1", label: "1 Week" },
    { value: "2", label: "2 Weeks (Recommended)" },
    { value: "3", label: "3 Weeks" },
    { value: "4", label: "4 Weeks" },
  ];

  return (
    <div className="space-y-6 relative">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name *</Label>
            <Input 
              id="projectName" 
              placeholder="e.g. Website Rebrand 2024" 
              value={projectData.name}
              onChange={(e) => setProjectData({...projectData, name: e.target.value})}
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
              onChange={(e) => setProjectData({...projectData, description: e.target.value})}
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
                onChange={(e) => setProjectData({...projectData, dueDate: e.target.value})}
                data-testid="input-project-due-date"
              />
              <p className="text-xs text-muted-foreground">
                Default: {DEFAULT_PROJECT_DURATION_WEEKS} weeks from start
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client (Optional)</Label>
              <Input 
                id="client" 
                placeholder="e.g. Acme Corporation" 
                value={projectData.client || ""}
                onChange={(e) => setProjectData({...projectData, client: e.target.value})}
                data-testid="input-project-client"
              />
            </div>
            <div className="space-y-2">
              <Label>Sprint Duration</Label>
              <SearchableSelect 
                value={String(projectData.sprintDurationWeeks)} 
                onValueChange={(v) => setProjectData({...projectData, sprintDurationWeeks: parseInt(v)})}
                placeholder="Select sprint length..."
                options={sprintDurationOptions}
                data-testid="select-sprint-duration"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {projectData.sprintDurationWeeks > 0 
              ? `Sprints will be automatically created based on project dates.`
              : `You can create sprints manually later.`}
          </p>
        </div>
      </div>

      <div className="bg-muted/30 rounded-lg p-4 mt-6">
        <h4 className="font-medium text-sm mb-2">What's next?</h4>
        <p className="text-sm text-muted-foreground">
          In the following steps, you'll assign team members, configure stages with tasks and milestones, 
          and define deliverables and epics. You can apply templates in Stage Configuration or build everything from scratch.
        </p>
      </div>

      <div className="absolute bottom-0 left-0 flex gap-1 translate-y-full pt-2 -ml-20">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-import-basics"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">Import project settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handleExport}
                data-testid="button-export-basics"
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">Export project settings</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
