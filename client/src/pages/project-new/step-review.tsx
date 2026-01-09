import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, Layers, Flag, Users, CheckSquare, Settings } from "lucide-react";
import { StepProps } from "./types";

export function StepReview({
  projectData,
  deliverables,
  stages,
  milestones,
  roles,
  frameworkTemplates,
  taskTemplates,
}: StepProps) {
  const businessEpics = deliverables.flatMap(d => 
    d.epics.map(e => ({ ...e, deliverableTitle: d.title }))
  );
  
  const onceTasks = stages
    .filter(stage => stage.taskCreationMode === 'once' && (stage.defaultTasks?.length ?? 0) > 0)
    .flatMap(stage => 
      (stage.defaultTasks || []).map(taskId => {
        const task = taskTemplates.find(t => t.id === taskId);
        return task ? { ...task, stageName: stage.name, stageId: stage.id, mode: 'once' as const } : null;
      }).filter(Boolean)
    );
  
  const perEpicTasks = stages
    .filter(stage => stage.taskCreationMode === 'per_epic' && (stage.defaultTasks?.length ?? 0) > 0)
    .flatMap(stage => 
      (stage.defaultTasks || []).map(taskId => {
        const task = taskTemplates.find(t => t.id === taskId);
        return task ? { ...task, stageName: stage.name, stageId: stage.id, mode: 'per_epic' as const } : null;
      }).filter(Boolean)
    );
  
  const onceTaskCount = onceTasks.length;
  const perEpicTaskCount = perEpicTasks.length * businessEpics.length;
  const totalTasks = onceTaskCount + perEpicTaskCount;
  const totalEpics = 2 + businessEpics.length;
  const hasTasks = onceTasks.length > 0 || perEpicTasks.length > 0;

  return (
    <div className="space-y-6">
      <div className="bg-muted/30 p-6 rounded-lg border space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Project Name</h4>
            <p className="font-medium text-lg">{projectData.name || "Untitled Project"}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Framework</h4>
            <p className="font-medium">{frameworkTemplates.find(f => f.id === projectData.frameworkId)?.name || "None"}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Start Date</h4>
            <p className="font-medium">{projectData.startDate || "Not set"}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Due Date</h4>
            <p className="font-medium">{projectData.dueDate || "Not set"}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Sprint Duration</h4>
            <p className="font-medium">
              {projectData.sprintDurationWeeks === 0 ? "No Sprints" : `${projectData.sprintDurationWeeks} Week${projectData.sprintDurationWeeks > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-card p-4 rounded border">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Package className="h-5 w-5" />
              <span className="font-semibold">Deliverables</span>
            </div>
            <div className="text-3xl font-bold">{deliverables.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {deliverables.reduce((acc, d) => acc + d.epics.length, 0)} Epics defined
            </p>
          </div>
          <div className="bg-card p-4 rounded border">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Layers className="h-5 w-5" />
              <span className="font-semibold">Stages</span>
            </div>
            <div className="text-3xl font-bold">{stages.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Standard workflow</p>
          </div>
          <div className="bg-card p-4 rounded border">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Flag className="h-5 w-5" />
              <span className="font-semibold">Milestones</span>
            </div>
            <div className="text-3xl font-bold">{milestones.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {milestones.filter(m => m.isBillingGate).length} billing gates
            </p>
          </div>
          <div className="bg-card p-4 rounded border">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <Users className="h-5 w-5" />
              <span className="font-semibold">Team Size</span>
            </div>
            <div className="text-3xl font-bold">{roles.filter(r => r.assigneeId).length}</div>
            <p className="text-xs text-muted-foreground mt-1">{roles.length} roles defined</p>
          </div>
        </div>
        
        {hasTasks ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <CheckSquare className="h-5 w-5" />
                <span className="font-semibold">Tasks to be Created</span>
              </div>
              <Badge variant="secondary">{totalTasks} total tasks</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {onceTasks.length > 0 && (
                <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-100 text-blue-700 text-xs">Once</Badge>
                    <span className="font-medium text-sm">Project-wide Tasks</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {onceTasks.length} tasks → Product Management epic
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {onceTasks.map((t: any, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {t.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {perEpicTasks.length > 0 && (
                <div className="bg-purple-50/50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-purple-100 text-purple-700 text-xs">Per Epic</Badge>
                    <span className="font-medium text-sm">Replicated Tasks</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {perEpicTasks.length} tasks × {businessEpics.length} epics = {perEpicTaskCount} tasks
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {perEpicTasks.map((t: any, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {t.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-muted/30 rounded-lg p-3 border border-dashed">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Auto-created:</span> "Project Operations" deliverable with Project Management and Product Management epics ({totalEpics} total epics)
              </p>
            </div>
          </div>
        ) : businessEpics.length === 0 ? (
          <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-dashed">
            <CheckSquare className="h-5 w-5 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              No epics defined. Add epics in the Work Breakdown step to create tasks.
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-dashed">
            <CheckSquare className="h-5 w-5 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              No default tasks selected. Configure task creation modes in Stage Configuration.
            </div>
          </div>
        )}

        <div className="bg-blue-50 text-blue-900 p-4 rounded-md text-sm border border-blue-100 flex gap-3">
          <Settings className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Ready to create?</p>
            <p>Your project will be created with the configured settings. You can always modify these later in Project Settings.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
