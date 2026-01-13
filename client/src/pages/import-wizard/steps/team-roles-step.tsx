import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Crown, Briefcase, Eye, Users, X, Plus, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { User, ProjectRole } from "@shared/schema";

const HIGH_LEVEL_ROLES = [
  { value: "owner", label: "Project Owner", icon: Crown, color: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "manager", label: "Project Manager", icon: Briefcase, color: "bg-purple-100 text-purple-800 border-purple-200" },
  { value: "stakeholder", label: "Stakeholder", icon: Eye, color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "member", label: "Team Member", icon: Users, color: "bg-green-100 text-green-800 border-green-200" },
];

export interface TeamMemberRoleAssignment {
  userId: string;
  highLevelRoles: string[];
  executionRoleIds: string[];
}

interface TeamRolesStepProps {
  mappedUsers: User[];
  executionRoles: ProjectRole[];
  assignments: TeamMemberRoleAssignment[];
  onChange: (assignments: TeamMemberRoleAssignment[]) => void;
}

export function TeamRolesStep({ mappedUsers, executionRoles, assignments, onChange }: TeamRolesStepProps) {
  const getAssignment = (userId: string): TeamMemberRoleAssignment => {
    return assignments.find(a => a.userId === userId) || { userId, highLevelRoles: ["member"], executionRoleIds: [] };
  };

  const updateAssignment = (userId: string, update: Partial<TeamMemberRoleAssignment>) => {
    const existing = assignments.find(a => a.userId === userId);
    if (existing) {
      onChange(assignments.map(a => a.userId === userId ? { ...a, ...update } : a));
    } else {
      onChange([...assignments, { userId, highLevelRoles: ["member"], executionRoleIds: [], ...update }]);
    }
  };

  const toggleHighLevelRole = (userId: string, role: string) => {
    const current = getAssignment(userId);
    const hasRole = current.highLevelRoles.includes(role);
    let newRoles: string[];
    
    if (hasRole) {
      newRoles = current.highLevelRoles.filter(r => r !== role);
      if (newRoles.length === 0) newRoles = ["member"];
    } else {
      newRoles = [...current.highLevelRoles, role];
    }
    
    const newAssignment: TeamMemberRoleAssignment = { ...current, highLevelRoles: newRoles };
    
    if (!newRoles.includes("member")) {
      newAssignment.executionRoleIds = [];
    }
    
    updateAssignment(userId, newAssignment);
  };

  const setExecutionRole = (userId: string, roleId: string | null) => {
    const current = getAssignment(userId);
    updateAssignment(userId, { 
      ...current, 
      executionRoleIds: roleId ? [roleId] : [] 
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getRoleBadge = (roleType: string) => {
    const config = HIGH_LEVEL_ROLES.find(r => r.value === roleType);
    if (!config) return null;
    const Icon = config.icon;
    return (
      <Badge key={roleType} variant="outline" className={`${config.color} gap-1 text-xs`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4" data-testid="team-roles-step">
      <div className="text-sm text-muted-foreground">
        Assign project roles to each team member. Users can have multiple high-level roles. 
        Team Members can also be assigned execution roles (e.g., Designer, Developer).
      </div>

      <ScrollArea className="h-[400px] border rounded-lg">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-[200px]">Team Member</TableHead>
              <TableHead className="w-[300px]">Project Roles</TableHead>
              <TableHead className="w-[200px]">Execution Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappedUsers.map(user => {
              const assignment = getAssignment(user.id);
              const isTeamMember = assignment.highLevelRoles.includes("member");
              
              return (
                <TableRow key={user.id} data-testid={`team-member-row-${user.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profileImageUrl || undefined} />
                        <AvatarFallback className="text-xs bg-primary/10">
                          {getInitials(user.name || undefined)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-auto min-h-8 py-1.5 px-2 gap-1 flex-wrap justify-start" data-testid={`roles-dropdown-${user.id}`}>
                          <div className="flex flex-wrap gap-1">
                            {assignment.highLevelRoles.map(role => getRoleBadge(role))}
                          </div>
                          <ChevronDown className="h-3 w-3 ml-1 shrink-0" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        {HIGH_LEVEL_ROLES.map(role => (
                          <DropdownMenuCheckboxItem
                            key={role.value}
                            checked={assignment.highLevelRoles.includes(role.value)}
                            onCheckedChange={() => toggleHighLevelRole(user.id, role.value)}
                            data-testid={`role-option-${role.value}-${user.id}`}
                          >
                            <role.icon className="h-4 w-4 mr-2" />
                            {role.label}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell>
                    {isTeamMember ? (
                      <Select
                        value={assignment.executionRoleIds[0] || ""}
                        onValueChange={(v) => setExecutionRole(user.id, v || null)}
                        data-testid={`execution-role-select-${user.id}`}
                      >
                        <SelectTrigger className="w-[180px] h-8">
                          <SelectValue placeholder="Select execution role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {executionRoles.map(role => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Only for Team Members
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>

      <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-4">
        <div className="flex items-center gap-1">
          <Crown className="h-3 w-3 text-amber-600" />
          <span>Owner: Overall accountability</span>
        </div>
        <div className="flex items-center gap-1">
          <Briefcase className="h-3 w-3 text-purple-600" />
          <span>Manager: Day-to-day management</span>
        </div>
        <div className="flex items-center gap-1">
          <Eye className="h-3 w-3 text-blue-600" />
          <span>Stakeholder: Visibility & input</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3 text-green-600" />
          <span>Member: Task execution</span>
        </div>
      </div>
    </div>
  );
}
