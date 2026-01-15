import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Button } from "@/components/ui/button";
import { StepProps, getDefaultDueDate, DEFAULT_SPRINT_DURATION, DEFAULT_PROJECT_DURATION_WEEKS } from "./types";
import { useEffect } from "react";
import { Zap } from "lucide-react";

export function StepBasics({
  projectData,
  setProjectData,
  users,
  onSkipWizard,
}: StepProps) {
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

  const sprintDurationOptions = [
    { value: "0", label: "No Sprints" },
    { value: "1", label: "1 Week" },
    { value: "2", label: "2 Weeks (Recommended)" },
    { value: "3", label: "3 Weeks" },
    { value: "4", label: "4 Weeks" },
  ];

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
          <div className="space-y-2">
            <Label>Sprint Duration</Label>
            <SearchableSelect 
              value={String(projectData.sprintDurationWeeks)} 
              onValueChange={(v) => setProjectData({...projectData, sprintDurationWeeks: parseInt(v)})}
              placeholder="Select sprint length..."
              options={sprintDurationOptions}
              data-testid="select-sprint-duration"
            />
            <p className="text-xs text-muted-foreground">
              {projectData.sprintDurationWeeks > 0 
                ? `Sprints will be automatically created based on project dates.`
                : `You can create sprints manually later.`}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Project Owner</Label>
            <SearchableSelect 
              value={projectData.ownerId || ""} 
              onValueChange={(v) => setProjectData({...projectData, ownerId: v})}
              placeholder="Select project owner..."
              options={users.map(user => ({ value: user.id, label: user.name }))}
              data-testid="select-project-owner"
            />
            <p className="text-xs text-muted-foreground">
              The person responsible for overall project delivery.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-muted/30 rounded-lg p-4 mt-6">
        <h4 className="font-medium text-sm mb-2">What's next?</h4>
        <p className="text-sm text-muted-foreground">
          In the following steps, you'll assign team members, configure stages with tasks and milestones, 
          and define deliverables and epics. You can apply templates in Stage Configuration or build everything from scratch.
        </p>
      </div>

      {onSkipWizard && (
        <div className="border border-dashed border-muted-foreground/30 rounded-lg p-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Quick Start
              </h4>
              <p className="text-sm text-muted-foreground">
                Create a blank project with just the basics. You can add deliverables, stages, and team members later.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={onSkipWizard}
              data-testid="button-skip-wizard"
              disabled={!projectData.name || !projectData.startDate || !projectData.dueDate}
            >
              <Zap className="h-4 w-4 mr-2" />
              Create Blank Project
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
