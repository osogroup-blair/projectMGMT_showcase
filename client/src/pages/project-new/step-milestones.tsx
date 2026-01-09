import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Flag, Plus, Trash2 } from "lucide-react";
import { StepProps } from "./types";

export function StepMilestones({
  milestones,
  setMilestones,
  stages,
  users,
}: StepProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Set Milestones</h3>
          <p className="text-sm text-muted-foreground">Define key milestones and billing gates for your project.</p>
        </div>
        <Button size="sm" data-testid="button-add-milestone" onClick={() => {
          setMilestones([...milestones, {
            id: `ms-${Date.now()}`,
            name: "New Milestone",
            description: "",
            phase: "plan_strategy",
            stageId: stages[0]?.id || "",
            targetDate: new Date().toISOString().split('T')[0],
            ownerId: users[0]?.id || "1",
            scopeType: "manual",
            completionMode: "all_tasks",
            completionTargetPercent: 100,
            isBillingGate: false
          }]);
        }}>
          <Plus className="h-4 w-4 mr-2" /> Add Milestone
        </Button>
      </div>

      <div className="space-y-4">
        {milestones.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg text-muted-foreground">
            <Flag className="h-8 w-8 mb-2 opacity-50" />
            <p>No milestones defined yet.</p>
            <Button variant="link" onClick={() => setMilestones([{
              id: `ms-${Date.now()}`,
              name: "Project Kickoff",
              description: "",
              phase: "plan_strategy",
              stageId: stages[0]?.id || "",
              targetDate: new Date().toISOString().split('T')[0],
              ownerId: users[0]?.id || "1",
              scopeType: "manual",
              completionMode: "all_tasks",
              completionTargetPercent: 100,
              isBillingGate: false
            }])}>Add your first milestone</Button>
          </div>
        ) : (
          milestones.map((milestone, index) => (
            <Card key={milestone.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm mt-1">
                      <Flag className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <Input 
                        value={milestone.name}
                        onChange={(e) => {
                          const newMs = [...milestones];
                          newMs[index].name = e.target.value;
                          setMilestones(newMs);
                        }}
                        className="h-9 font-medium"
                        placeholder="Milestone Name"
                        data-testid={`input-milestone-name-${index}`}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Target Date</Label>
                          <Input 
                            type="date"
                            value={milestone.targetDate}
                            onChange={(e) => {
                              const newMs = [...milestones];
                              newMs[index].targetDate = e.target.value;
                              setMilestones(newMs);
                            }}
                            className="h-9"
                            data-testid={`input-milestone-date-${index}`}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Owner</Label>
                          <Select 
                            value={milestone.ownerId}
                            onValueChange={(val) => {
                              const newMs = [...milestones];
                              newMs[index].ownerId = val;
                              setMilestones(newMs);
                            }}
                          >
                            <SelectTrigger className="h-9" data-testid={`select-milestone-owner-${index}`}>
                              <SelectValue placeholder="Select owner" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.map(user => (
                                <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Stage</Label>
                          <Select 
                            value={milestone.stageId || ""}
                            onValueChange={(val) => {
                              const newMs = [...milestones];
                              newMs[index].stageId = val;
                              setMilestones(newMs);
                            }}
                          >
                            <SelectTrigger className="h-9" data-testid={`select-milestone-stage-${index}`}>
                              <SelectValue placeholder="Select stage" />
                            </SelectTrigger>
                            <SelectContent>
                              {stages.length > 0 ? (
                                stages.map((stage) => (
                                  <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                                ))
                              ) : (
                                <div className="text-sm text-muted-foreground px-2 py-1.5">No stages configured</div>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            id={`billing-gate-${milestone.id}`}
                            checked={milestone.isBillingGate}
                            onCheckedChange={(checked) => {
                              const newMs = [...milestones];
                              newMs[index].isBillingGate = !!checked;
                              setMilestones(newMs);
                            }}
                          />
                          <Label htmlFor={`billing-gate-${milestone.id}`} className="text-sm cursor-pointer">
                            Billing Gate
                          </Label>
                        </div>
                        {milestone.isBillingGate && (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                            Invoice Trigger
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      const newMs = [...milestones];
                      newMs.splice(index, 1);
                      setMilestones(newMs);
                    }}
                    data-testid={`button-delete-milestone-${index}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
