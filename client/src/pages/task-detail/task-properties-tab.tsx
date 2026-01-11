import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Tag } from "lucide-react";
import { useTaskStatuses } from "@/hooks/use-task-statuses";
import { EFFORT_VALUES } from "@shared/schema";

interface TaskPropertiesTabProps {
  task: any;
  projectId: string;
  updateTask: (field: string, value: any) => void;
  stages: any[];
  allEpics: any[];
}

export function TaskPropertiesTab({ 
  task, 
  projectId, 
  updateTask,
  stages,
  allEpics
}: TaskPropertiesTabProps) {
  const { statusLabels } = useTaskStatuses();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <SearchableSelect
              value={task.status}
              onValueChange={(v) => updateTask("status", v)}
              placeholder="Select status"
              options={statusLabels.map(status => ({ value: status, label: status }))}
              data-testid="select-status"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Priority</Label>
            <SearchableSelect
              value={task.priority}
              onValueChange={(v) => updateTask("priority", v)}
              placeholder="Select priority"
              options={[
                { value: "High", label: "High" },
                { value: "Medium", label: "Medium" },
                { value: "Low", label: "Low" }
              ]}
              data-testid="select-priority"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Stage</Label>
            <SearchableSelect
              value={task.stageId || ""}
              onValueChange={(v) => updateTask("stageId", v)}
              placeholder="Select stage"
              options={stages.map((s: any) => ({ value: s.id, label: s.name }))}
              data-testid="select-stage"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Effort (Fibonacci)</Label>
            <SearchableSelect
              value={String(task.effort || "")}
              onValueChange={(v) => updateTask("effort", parseInt(v))}
              placeholder="Select effort"
              options={EFFORT_VALUES.map(val => ({ value: String(val), label: String(val) }))}
              data-testid="select-effort"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Epic</Label>
            <SearchableSelect
              value={task.epicId || ""}
              onValueChange={(v) => updateTask("epicId", v)}
              placeholder="Select epic"
              options={(allEpics || []).map((e: any) => ({ value: e.id, label: e.title }))}
              data-testid="select-epic"
            />
          </div>

          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <Label className="text-xs text-muted-foreground">Tags</Label>
            <div className="flex flex-wrap gap-2">
              {task.tags?.length > 0 ? (
                task.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="font-normal">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No tags</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
