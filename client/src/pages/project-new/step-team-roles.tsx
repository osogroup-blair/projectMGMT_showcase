import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Users, AlertCircle } from "lucide-react";
import { StepProps, WizardRole } from "./types";

export function StepTeamRoles({
  roles,
  setRoles,
  roleTypes,
  users,
  eligibleUsers,
}: StepProps) {
  const addRole = () => {
    const defaultRoleType = roleTypes[0];
    const newRole: WizardRole = {
      id: `r-${Date.now()}`,
      name: "",
      roleType: defaultRoleType?.label || "Development",
      roleTypeId: defaultRoleType?.id,
      assigneeId: null
    };
    setRoles([...roles, newRole]);
  };

  const removeRole = (index: number) => {
    const newRoles = [...roles];
    newRoles.splice(index, 1);
    setRoles(newRoles);
  };

  const getEligibleUsersForRole = (roleTypeId?: string): any[] => {
    if (!roleTypeId) return users;
    const eligible = eligibleUsers.get(roleTypeId);
    return eligible && eligible.length > 0 ? eligible : users;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Assignments & Roles</h3>
          <p className="text-sm text-muted-foreground">
            Assign team members to project roles. Users are filtered by role eligibility.
          </p>
        </div>
        <Button size="sm" onClick={addRole} data-testid="button-add-role">
          <Plus className="h-4 w-4 mr-2" /> Add Role
        </Button>
      </div>

      <div className="bg-muted/30 p-4 rounded-lg border mb-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Role-Based Assignment</p>
            <p>When assigning users to roles, only team members eligible for that role type will appear in the dropdown. 
            This ensures the right people are matched to the right responsibilities.</p>
          </div>
        </div>
      </div>

      {roles.length === 0 ? (
        <div className="text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No roles defined yet.</p>
          <Button variant="link" onClick={addRole}>Add your first role</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role, index) => {
            const eligibleForRole = getEligibleUsersForRole(role.roleTypeId);
            const hasEligibleUsers = eligibleForRole.length > 0;

            return (
              <Card key={role.id}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Input 
                        value={role.name}
                        onChange={(e) => {
                          const newRoles = [...roles];
                          newRoles[index].name = e.target.value;
                          setRoles(newRoles);
                        }}
                        className="h-8 font-medium border-transparent hover:border-input focus:border-input"
                        placeholder="Enter role name..."
                        data-testid={`input-role-name-${index}`}
                      />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-muted-foreground hover:text-destructive" 
                      onClick={() => removeRole(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Role Type</Label>
                    <Select 
                      value={role.roleTypeId || ""} 
                      onValueChange={(val) => {
                        const selectedType = roleTypes.find((rt: any) => rt.id === val);
                        const newRoles = [...roles];
                        newRoles[index].roleTypeId = val;
                        newRoles[index].roleType = selectedType?.label || role.roleType;
                        newRoles[index].assigneeId = null;
                        setRoles(newRoles);
                      }}
                    >
                      <SelectTrigger className="h-8" data-testid={`select-role-type-${index}`}>
                        <SelectValue placeholder="Select role type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {roleTypes.map((rt: any) => (
                          <SelectItem key={rt.id} value={rt.id}>{rt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Assignee</Label>
                      {role.roleTypeId && (
                        <Badge variant="outline" className="text-[10px]">
                          {eligibleForRole.length} eligible
                        </Badge>
                      )}
                    </div>
                    <Select 
                      value={role.assigneeId || ""} 
                      onValueChange={(val) => {
                        const newRoles = [...roles];
                        newRoles[index].assigneeId = val || null;
                        setRoles(newRoles);
                      }}
                    >
                      <SelectTrigger data-testid={`select-role-assignee-${index}`}>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        {hasEligibleUsers ? (
                          eligibleForRole.map((member: any) => (
                            <SelectItem key={member.id} value={member.id}>
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium">
                                  {member.name.charAt(0)}
                                </div>
                                <span>{member.name}</span>
                                <span className="text-xs text-muted-foreground">({member.role})</span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground px-2 py-1.5">
                            No eligible users for this role type
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-6 p-4 bg-muted/20 rounded-lg">
        <h4 className="font-medium text-sm mb-2">Role Summary</h4>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>{roles.length} role{roles.length !== 1 ? 's' : ''} defined</span>
          <span>{roles.filter(r => r.assigneeId).length} assigned</span>
          <span>{roles.filter(r => !r.assigneeId).length} unassigned</span>
        </div>
      </div>
    </div>
  );
}
