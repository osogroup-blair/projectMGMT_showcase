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
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepProps } from "./types";

export function StepBasics({
  projectData,
  setProjectData,
  frameworkTemplates,
  projectTemplatesData,
  onTemplateSelect,
  onFrameworkSelect,
}: StepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input 
              id="projectName" 
              placeholder="e.g. Website Rebrand 2024" 
              value={projectData.name}
              onChange={(e) => setProjectData({...projectData, name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              placeholder="Describe the goals and scope..." 
              className="h-32"
              value={projectData.description}
              onChange={(e) => setProjectData({...projectData, description: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input 
                type="date" 
                value={projectData.startDate}
                onChange={(e) => setProjectData({...projectData, startDate: e.target.value})}
                data-testid="input-project-start-date"
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input 
                type="date" 
                value={projectData.dueDate}
                onChange={(e) => setProjectData({...projectData, dueDate: e.target.value})}
                data-testid="input-project-due-date"
              />
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
                <SelectItem value="2">2 Weeks</SelectItem>
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
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label>Project Template (Optional)</Label>
            <div className="grid grid-cols-1 gap-2">
              {projectTemplatesData.length === 0 ? (
                <div className="text-sm text-muted-foreground p-3 border rounded-lg bg-muted/20">
                  No project templates available. Create templates in Admin → Templates.
                </div>
              ) : (
                projectTemplatesData.map(template => (
                  <div 
                    key={template.id}
                    className={cn(
                      "border rounded-lg p-3 cursor-pointer transition-all hover:border-primary",
                      projectData.templateId === template.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-card"
                    )}
                    onClick={() => onTemplateSelect(template.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{template.description}</div>
                      </div>
                      {projectData.templateId === template.id && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Framework *</Label>
            <Select value={projectData.frameworkId} onValueChange={onFrameworkSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a framework..." />
              </SelectTrigger>
              <SelectContent>
                {frameworkTemplates.map(fw => (
                  <SelectItem key={fw.id} value={fw.id}>{fw.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">The framework determines the default stages and workflow structure.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
