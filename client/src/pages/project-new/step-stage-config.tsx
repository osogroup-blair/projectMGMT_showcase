import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StepProps } from "./types";

export function StepStageConfig({
  projectData,
  stages,
  setStages,
  frameworkTemplates,
}: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Stage Configuration</h3>
        <p className="text-sm text-muted-foreground">Review the stages and configure how tasks are created for the {frameworkTemplates.find(f => f.id === projectData.frameworkId)?.name} framework.</p>
      </div>

      <div className="bg-muted/30 p-4 rounded-lg border mb-4">
        <h4 className="font-medium text-sm mb-2">Task Creation Modes</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5 shrink-0">None</Badge>
            <span>No default tasks created for this stage</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="secondary" className="mt-0.5 shrink-0 bg-blue-100 text-blue-700">Once</Badge>
            <span>Tasks created once, assigned to Product Management epic</span>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="secondary" className="mt-0.5 shrink-0 bg-purple-100 text-purple-700">Per Epic</Badge>
            <span>Tasks replicated for each business epic you define</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {stages.map((stage, index) => (
          <Card key={stage?.id || index} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div>
                      <div className="font-medium">{stage?.name}</div>
                      <div className="text-sm text-muted-foreground">{stage?.description || "Standard stage workflow"}</div>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {stage?.defaultTasks?.length || 0} Tasks
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6 pt-2 border-t">
                    <Label className="text-sm text-muted-foreground">Task Creation:</Label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id={`stage-none-${stage.id}`}
                          name={`stage-mode-${stage.id}`}
                          checked={stage.taskCreationMode === 'none'}
                          onChange={() => {
                            const newStages = [...stages];
                            newStages[index].taskCreationMode = 'none';
                            setStages(newStages);
                          }}
                          className="h-4 w-4"
                          data-testid={`radio-stage-none-${index}`}
                        />
                        <Label htmlFor={`stage-none-${stage.id}`} className="text-sm cursor-pointer">None</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id={`stage-once-${stage.id}`}
                          name={`stage-mode-${stage.id}`}
                          checked={stage.taskCreationMode === 'once'}
                          onChange={() => {
                            const newStages = [...stages];
                            newStages[index].taskCreationMode = 'once';
                            setStages(newStages);
                          }}
                          className="h-4 w-4"
                          data-testid={`radio-stage-once-${index}`}
                        />
                        <Label htmlFor={`stage-once-${stage.id}`} className="text-sm cursor-pointer">
                          <span className="flex items-center gap-1">
                            Once <span className="text-xs text-muted-foreground">(Project-wide)</span>
                          </span>
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          id={`stage-per-epic-${stage.id}`}
                          name={`stage-mode-${stage.id}`}
                          checked={stage.taskCreationMode === 'per_epic'}
                          onChange={() => {
                            const newStages = [...stages];
                            newStages[index].taskCreationMode = 'per_epic';
                            setStages(newStages);
                          }}
                          className="h-4 w-4"
                          data-testid={`radio-stage-per-epic-${index}`}
                        />
                        <Label htmlFor={`stage-per-epic-${stage.id}`} className="text-sm cursor-pointer">
                          <span className="flex items-center gap-1">
                            Per Epic <span className="text-xs text-muted-foreground">(Replicated)</span>
                          </span>
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {stages.length === 0 && (
          <div className="text-center p-8 border rounded-lg bg-muted/20 text-muted-foreground">
            No framework selected. Please go back to Step 1 and select a framework.
          </div>
        )}
      </div>
    </div>
  );
}
