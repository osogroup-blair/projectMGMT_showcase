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
import { Plus, Trash2, Users, AlertCircle, Shield, Layers } from "lucide-react";
import { StepProps, WizardRole, CORE_PROJECT_ROLES } from "./types";

export function StepTeamRoles({
  roles,
  setRoles,
  roleTypes,
  roleTemplates,
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
      isCore: false,
      assigneeId: null
    };
    setRoles([...roles, newRole]);
  };

  const addRoleFromTemplate = (templateId: string) => {
    const template = roleTemplates.find((rt: any) => rt.id === templateId);
    if (!template) return;
    
    const alreadyExists = roles.some(r => r.templateId === templateId);
    if (alreadyExists) return;
    
    const newRole: WizardRole = {
      id: `r-${Date.now()}`,
      templateId: template.id,
      name: template.name,
      description: template.description,
      roleType: template.defaultRoleType,
      isCore: false,
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

  const coreRoles = roles.filter(r => r.isCore);
  const stageRoles = roles.filter(r => !r.isCore);
  
  const groupedStageRoles = stageRoles.reduce((acc, role) => {
    const type = role.roleType || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(role);
    return acc;
  }, {} as Record<string, WizardRole[]>);

  const availableTemplates = roleTemplates.filter((rt: any) => 
    !roles.some(r => r.templateId === rt.id) && 
    !CORE_PROJECT_ROLES.some(c => c.templateId === rt.id)
  );

  const renderRoleCard = (role: WizardRole, globalIndex: number) => {
    const eligibleForRole = getEligibleUsersForRole(role.roleTypeId);
    const hasEligibleUsers = eligibleForRole.length > 0;

    return (
      <Card key={role.id} className={role.isCore ? "border-primary/30 bg-primary/5" : ""}>
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 flex-1">
              {role.isCore && <Shield className="h-4 w-4 text-primary shrink-0" />}
              <Input 
                value={role.name}
                onChange={(e) => {
                  const newRoles = [...roles];
                  newRoles[globalIndex].name = e.target.value;
                  setRoles(newRoles);
                }}
                className="h-8 font-medium border-transparent hover:border-input focus:border-input"
                placeholder="Enter role name..."
                data-testid={`input-role-name-${globalIndex}`}
              />
            </div>
            {!role.isCore && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-muted-foreground hover:text-destructive" 
                onClick={() => removeRole(globalIndex)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          {role.isCore && (
            <Badge variant="secondary" className="text-[10px] w-fit mt-1">Core Role</Badge>
          )}
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Role Type</Label>
            <div className="h-8 flex items-center text-sm px-3 border rounded-md bg-muted/30">
              {role.roleType || 'Not specified'}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Assignee</Label>
              <Badge variant="outline" className="text-[10px]">
                {users.length} eligible
              </Badge>
            </div>
            <Select 
              value={role.assigneeId || ""} 
              onValueChange={(val) => {
                const newRoles = [...roles];
                newRoles[globalIndex].assigneeId = val || null;
                setRoles(newRoles);
              }}
            >
              <SelectTrigger data-testid={`select-role-assignee-${globalIndex}`}>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                {hasEligibleUsers || users.length > 0 ? (
                  (hasEligibleUsers ? eligibleForRole : users).map((member: any) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium">
                          {member.name?.charAt(0) || '?'}
                        </div>
                        <span>{member.name}</span>
                        {member.role && <span className="text-xs text-muted-foreground">({member.role})</span>}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground px-2 py-1.5">
                    No users available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end items-center">
        <div className="flex gap-2">
          {availableTemplates.length > 0 && (
            <Select onValueChange={addRoleFromTemplate}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Add from template..." />
              </SelectTrigger>
              <SelectContent>
                {availableTemplates.map((rt: any) => (
                  <SelectItem key={rt.id} value={rt.id}>{rt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button size="sm" onClick={addRole} data-testid="button-add-role">
            <Plus className="h-4 w-4 mr-2" /> Custom Role
          </Button>
        </div>
      </div>

      <div className="bg-muted/30 p-4 rounded-lg border mb-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-1">Role-Based Assignment</p>
            <p>Core roles (Project Manager, Team Member) are included by default. Additional roles are automatically added based on your stage configuration and task assignments.</p>
          </div>
        </div>
      </div>

      {coreRoles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <h4 className="font-medium text-sm">Core Project Roles</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coreRoles.map((role) => {
              const globalIndex = roles.findIndex(r => r.id === role.id);
              return renderRoleCard(role, globalIndex);
            })}
          </div>
        </div>
      )}

      {Object.keys(groupedStageRoles).length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium text-sm">Roles from Stages & Tasks</h4>
          </div>
          
          {Object.entries(groupedStageRoles).map(([roleType, typeRoles]) => (
            <div key={roleType} className="space-y-3">
              <Badge variant="outline" className="text-xs">{roleType}</Badge>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {typeRoles.map((role) => {
                  const globalIndex = roles.findIndex(r => r.id === role.id);
                  return renderRoleCard(role, globalIndex);
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {roles.length === 0 && (
        <div className="text-center p-8 border-2 border-dashed rounded-lg text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No roles defined yet.</p>
          <Button variant="link" onClick={addRole}>Add your first role</Button>
        </div>
      )}

      <div className="mt-6 p-4 bg-muted/20 rounded-lg">
        <h4 className="font-medium text-sm mb-2">Role Summary</h4>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>{coreRoles.length} core role{coreRoles.length !== 1 ? 's' : ''}</span>
          <span>{stageRoles.length} stage role{stageRoles.length !== 1 ? 's' : ''}</span>
          <span>{roles.filter(r => r.assigneeId).length} assigned</span>
          <span>{roles.filter(r => !r.assigneeId).length} unassigned</span>
        </div>
      </div>
    </div>
  );
}
