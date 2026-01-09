import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { StepProps } from "./types";

export function StepTeamRoles({
  roles,
  setRoles,
  users,
}: StepProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Team & Roles</h3>
          <p className="text-sm text-muted-foreground">Assign team members to project roles.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => {
          setRoles([...roles, {
            id: `r-${Date.now()}`,
            name: "New Role",
            roleType: "Development",
            assigneeId: null
          }]);
        }}>
          <Plus className="h-4 w-4 mr-2" /> Add Role
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role, index) => (
          <Card key={role.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <Input 
                    value={role.name}
                    onChange={(e) => {
                      const newRoles = [...roles];
                      newRoles[index].name = e.target.value;
                      setRoles(newRoles);
                    }}
                    className="h-7 px-0 font-medium border-0 focus-visible:ring-0 p-0 shadow-none hover:underline decoration-dashed decoration-muted-foreground underline-offset-4 w-full"
                  />
                  <Badge variant="outline" className="mt-1 text-[10px]">{role.roleType}</Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => {
                  const newRoles = [...roles];
                  newRoles.splice(index, 1);
                  setRoles(newRoles);
                }}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              
              <Select 
                value={role.assigneeId || ""} 
                onValueChange={(val) => {
                  const newRoles = [...roles];
                  newRoles[index].assigneeId = val;
                  setRoles(newRoles);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">
                          {member.name.charAt(0)}
                        </div>
                        {member.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
