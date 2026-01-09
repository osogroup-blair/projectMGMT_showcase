import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepProps, getDefaultDueDate, DEFAULT_SPRINT_DURATION, DEFAULT_PROJECT_DURATION_WEEKS } from "./types";
import { useEffect } from "react";

export function StepBasics({
  projectData,
  setProjectData,
  users,
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
            <Select 
              value={String(projectData.sprintDurationWeeks)} 
              onValueChange={(v) => setProjectData({...projectData, sprintDurationWeeks: parseInt(v)})}
            >
              <SelectTrigger data-testid="select-sprint-duration">
                <SelectValue placeholder="Select sprint length..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No Sprints</SelectItem>
                <SelectItem value="1">1 Week</SelectItem>
                <SelectItem value="2">2 Weeks (Recommended)</SelectItem>
                <SelectItem value="3">3 Weeks</SelectItem>
                <SelectItem value="4">4 Weeks</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {projectData.sprintDurationWeeks > 0 
                ? `Sprints will be automatically created based on project dates.`
                : `You can create sprints manually later.`}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Project Owner</Label>
            <Select 
              value={projectData.ownerId || ""} 
              onValueChange={(v) => setProjectData({...projectData, ownerId: v})}
            >
              <SelectTrigger data-testid="select-project-owner">
                <SelectValue placeholder="Select project owner..." />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The person responsible for overall project delivery.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-muted/30 rounded-lg p-4 mt-6">
        <h4 className="font-medium text-sm mb-2">What's next?</h4>
        <p className="text-sm text-muted-foreground">
          In the following steps, you'll define deliverables and epics, configure stages with tasks and milestones, 
          and assign team members. You can apply templates in Step 3 (Stage Configuration) or build everything from scratch.
        </p>
      </div>
    </div>
  );
}
