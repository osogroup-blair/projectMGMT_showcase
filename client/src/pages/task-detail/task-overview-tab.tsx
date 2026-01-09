import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface TaskOverviewTabProps {
  task: any;
  projectId: string;
  updateTask: (field: string, value: any) => void;
}

export function TaskOverviewTab({ task, projectId, updateTask }: TaskOverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-base font-semibold" data-testid="label-description">
          Description
        </Label>
        <Textarea 
          className="min-h-[150px] resize-none"
          value={task.description || ""}
          onChange={(e) => updateTask("description", e.target.value)}
          placeholder="Add a more detailed description..."
          data-testid="textarea-task-description"
        />
      </div>
    </div>
  );
}
