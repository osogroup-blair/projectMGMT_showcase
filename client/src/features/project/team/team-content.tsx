import { useState, useMemo } from "react";
import { 
  Users, 
  Crown, 
  Eye, 
  UserPlus, 
  Settings2,
  Trash2,
  Pencil,
  Check,
  X,
  Loader2,
  Plus,
  Briefcase,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useUsers, useProject, useTasks, useProjectTeamRoles } from "@/hooks/use-nexus-data";
import { useUnifiedTeamMembers } from "@/hooks/use-unified-team-members";
import { cn } from "@/lib/utils";
import type { HighLevelRoleType } from "@shared/schema";

const HIGH_LEVEL_ROLE_CONFIG: Record<HighLevelRoleType, { label: string; icon: React.ComponentType<any>; color: string }> = {
  owner: { label: "Owner", icon: Crown, color: "bg-amber-100 text-amber-800 border-amber-200" },
  manager: { label: "Manager", icon: Briefcase, color: "bg-purple-100 text-purple-800 border-purple-200" },
  stakeholder: { label: "Stakeholder", icon: Eye, color: "bg-blue-100 text-blue-800 border-blue-200" },
  member: { label: "Team Member", icon: Users, color: "bg-green-100 text-green-800 border-green-200" },
};

const ROLE_TYPE_OPTIONS = [
  { value: "leadership", label: "Leadership" },
  { value: "technical", label: "Technical" },
  { value: "design", label: "Design" },
  { value: "qa", label: "QA" },
  { value: "support", label: "Support" },
  { value: "other", label: "Other" },
];

export function TeamContent({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const { data: project, isLoading: isProjectLoading, refetch: refetchProject } = useProject(projectId);
  const { data: allUsers = [], isLoading: isUsersLoading } = useUsers();
  const { data: allTasks = [], isLoading: isTasksLoading } = useTasks();
  const { 
    data: projectRoles = [], 
    isLoading: isRolesLoading, 
    createRole, 
    updateRole, 
    deleteRole,
    isCreating: isCreatingRole,
    isDeleting: isDeletingRole 
  } = useProjectTeamRoles(projectId);
  const {
    members: unifiedMembers,
    isLoading: isUnifiedLoading,
    addMember,
    updateMember,
    removeMember,
    addHighLevelRole,
    removeHighLevelRole,
    addExecutionRole,
    removeExecutionRole,
  } = useUnifiedTeamMembers(projectId);

  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [addRoleDialogOpen, setAddRoleDialogOpen] = useState(false);
  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteMemberConfirmOpen, setDeleteMemberConfirmOpen] = useState(false);
  const [editMemberDialogOpen, setEditMemberDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [selectedMemberToDelete, setSelectedMemberToDelete] = useState<any>(null);
  const [selectedMemberToEdit, setSelectedMemberToEdit] = useState<any>(null);

  const [newMember, setNewMember] = useState({ 
    userId: "", 
    highLevelRoles: [] as HighLevelRoleType[], 
    executionRoleIds: [] as string[],
    allocationPercent: 100 
  });
  const [newRole, setNewRole] = useState({ name: "", roleType: "technical", description: "", isRequired: false, maxAssignees: 1 });

  const projectTasks = useMemo(() => 
    (allTasks || []).filter((t: any) => t.projectId === projectId),
    [allTasks, projectId]
  );

  const getTaskCountForUser = (userId: string) => {
    return projectTasks.filter((t: any) => t.assigneeId === userId).length;
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleAddMember = async () => {
    if (!newMember.userId) {
      toast({ title: "Error", description: "Please select a user.", variant: "destructive" });
      return;
    }
    if (newMember.highLevelRoles.length === 0) {
      toast({ title: "Error", description: "Please select at least one role.", variant: "destructive" });
      return;
    }
    try {
      await addMember({
        userId: newMember.userId,
        highLevelRoles: newMember.highLevelRoles,
        executionRoleIds: newMember.highLevelRoles.includes('member') ? newMember.executionRoleIds : [],
        allocationPercent: newMember.allocationPercent,
      });
      if (newMember.highLevelRoles.includes('owner')) {
        await refetchProject();
      }
      toast({ title: "Team member added", description: "New team member has been added to the project." });
      setAddMemberDialogOpen(false);
      setNewMember({ userId: "", highLevelRoles: [], executionRoleIds: [], allocationPercent: 100 });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add team member.", variant: "destructive" });
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMemberToDelete) return;
    try {
      await removeMember(selectedMemberToDelete.id);
      toast({ title: "Member removed", description: "Team member has been removed from the project." });
      setDeleteMemberConfirmOpen(false);
      setSelectedMemberToDelete(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove team member.", variant: "destructive" });
    }
  };

  const handleToggleHighLevelRole = async (memberId: string, role: HighLevelRoleType, hasRole: boolean) => {
    try {
      if (hasRole) {
        await removeHighLevelRole(memberId, role);
      } else {
        await addHighLevelRole(memberId, role);
      }
      if (role === 'owner') {
        await refetchProject();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update role.", variant: "destructive" });
    }
  };

  const handleToggleExecutionRole = async (memberId: string, roleId: string, hasRole: boolean) => {
    try {
      if (hasRole) {
        await removeExecutionRole(memberId, roleId);
      } else {
        await addExecutionRole(memberId, roleId);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update execution role.", variant: "destructive" });
    }
  };

  const handleAddRole = async () => {
    if (!newRole.name) {
      toast({ title: "Error", description: "Please enter a role name.", variant: "destructive" });
      return;
    }
    try {
      await createRole(newRole);
      toast({ title: "Role created", description: "New project role has been created." });
      setAddRoleDialogOpen(false);
      setNewRole({ name: "", roleType: "technical", description: "", isRequired: false, maxAssignees: 1 });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create role.", variant: "destructive" });
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedRole) return;
    try {
      await updateRole({ 
        id: selectedRole.id, 
        name: selectedRole.name,
        roleType: selectedRole.roleType,
        description: selectedRole.description,
        isRequired: selectedRole.isRequired,
        maxAssignees: selectedRole.maxAssignees,
      });
      toast({ title: "Role updated", description: "Project role has been updated." });
      setEditRoleDialogOpen(false);
      setSelectedRole(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to update role.", variant: "destructive" });
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    try {
      await deleteRole(selectedRole.id);
      toast({ title: "Role deleted", description: "Project role has been deleted." });
      setDeleteConfirmOpen(false);
      setSelectedRole(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete role.", variant: "destructive" });
    }
  };

  const getMembersWithRole = (roleId: string) => {
    return unifiedMembers.filter((m: any) => 
      m.executionRoles?.some((r: any) => r.roleId === roleId)
    );
  };

  const isLoading = isProjectLoading || isUsersLoading || isTasksLoading || isRolesLoading || isUnifiedLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const availableUsers = allUsers.filter((u: any) => 
    !unifiedMembers.some((m: any) => m.userId === u.id)
  );

  const teamStats = {
    owners: unifiedMembers.filter((m: any) => m.highLevelRoles?.includes('owner')).length,
    managers: unifiedMembers.filter((m: any) => m.highLevelRoles?.includes('manager')).length,
    stakeholders: unifiedMembers.filter((m: any) => m.highLevelRoles?.includes('stakeholder')).length,
    members: unifiedMembers.filter((m: any) => m.highLevelRoles?.includes('member')).length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Crown className="h-5 w-5 text-amber-700" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{teamStats.owners}</p>
                <p className="text-sm text-muted-foreground">Owners</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Briefcase className="h-5 w-5 text-purple-700" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{teamStats.managers}</p>
                <p className="text-sm text-muted-foreground">Managers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Eye className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{teamStats.stakeholders}</p>
                <p className="text-sm text-muted-foreground">Stakeholders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Users className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{teamStats.members}</p>
                <p className="text-sm text-muted-foreground">Team Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                <CardTitle className="text-base">Team Members</CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setAddMemberDialogOpen(true)}
                data-testid="button-add-team-member"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>
            <CardDescription>Unified team membership with project and execution roles</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Project Roles</TableHead>
                  <TableHead>Execution Roles</TableHead>
                  <TableHead className="text-right">Tasks</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unifiedMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No team members yet. Add team members to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  unifiedMembers.map((m: any) => {
                    const user = allUsers.find((u: any) => u.id === m.userId);
                    const hasMemberRole = m.highLevelRoles?.includes('member');
                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {getInitials(user?.name || "")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{user?.name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">{user?.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(m.highLevelRoles || []).map((role: HighLevelRoleType) => {
                              const config = HIGH_LEVEL_ROLE_CONFIG[role];
                              return (
                                <Badge 
                                  key={role} 
                                  variant="outline" 
                                  className={cn("text-xs cursor-pointer", config.color)}
                                  onClick={() => handleToggleHighLevelRole(m.id, role, true)}
                                >
                                  {config.label}
                                  <X className="h-3 w-3 ml-1" />
                                </Badge>
                              );
                            })}
                            <Select
                              value=""
                              onValueChange={(role) => handleToggleHighLevelRole(m.id, role as HighLevelRoleType, false)}
                            >
                              <SelectTrigger className="h-6 w-6 p-0 border-dashed" data-testid={`select-add-role-${m.id}`}>
                                <Plus className="h-3 w-3" />
                              </SelectTrigger>
                              <SelectContent>
                                {(Object.keys(HIGH_LEVEL_ROLE_CONFIG) as HighLevelRoleType[])
                                  .filter(role => !m.highLevelRoles?.includes(role))
                                  .map(role => (
                                    <SelectItem key={role} value={role}>
                                      {HIGH_LEVEL_ROLE_CONFIG[role].label}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell>
                          {hasMemberRole ? (
                            <div className="flex flex-wrap gap-1">
                              {(m.executionRoles || []).map((role: any) => (
                                <Badge 
                                  key={role.id} 
                                  variant="secondary" 
                                  className="text-xs cursor-pointer"
                                  onClick={() => handleToggleExecutionRole(m.id, role.roleId, true)}
                                >
                                  {role.role?.name || role.roleId}
                                  <X className="h-3 w-3 ml-1" />
                                </Badge>
                              ))}
                              {projectRoles.length > 0 && (
                                <Select
                                  value=""
                                  onValueChange={(roleId) => handleToggleExecutionRole(m.id, roleId, false)}
                                >
                                  <SelectTrigger className="h-6 w-6 p-0 border-dashed" data-testid={`select-add-exec-role-${m.id}`}>
                                    <Plus className="h-3 w-3" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {projectRoles
                                      .filter((r: any) => !m.executionRoles?.some((er: any) => er.roleId === r.id))
                                      .map((role: any) => (
                                        <SelectItem key={role.id} value={role.id}>
                                          {role.name}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Requires Team Member role</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{getTaskCountForUser(m.userId)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setSelectedMemberToDelete(m);
                              setDeleteMemberConfirmOpen(true);
                            }}
                            data-testid={`button-remove-member-${m.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                <CardTitle className="text-base">Execution Roles</CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setAddRoleDialogOpen(true)}
                data-testid="button-add-role"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            <CardDescription>Roles for task assignment</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No execution roles defined yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  projectRoles.map((r: any) => {
                    const membersWithRole = getMembersWithRole(r.id);
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{r.name}</p>
                            <Badge variant="outline" className="text-xs capitalize mt-1">
                              {r.roleType}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {membersWithRole.length > 0 ? (
                            <div className="flex -space-x-2">
                              {membersWithRole.slice(0, 3).map((m: any) => {
                                const user = allUsers.find((u: any) => u.id === m.userId);
                                return (
                                  <Avatar key={m.id} className="h-6 w-6 border-2 border-background">
                                    <AvatarFallback className="text-xs">
                                      {getInitials(user?.name || "")}
                                    </AvatarFallback>
                                  </Avatar>
                                );
                              })}
                              {membersWithRole.length > 3 && (
                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                                  +{membersWithRole.length - 3}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedRole(r);
                                setEditRoleDialogOpen(true);
                              }}
                              data-testid={`button-edit-role-${r.id}`}
                            >
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedRole(r);
                                setDeleteConfirmOpen(true);
                              }}
                              data-testid={`button-delete-role-${r.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>Add a new person to the project team with their roles</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Person</Label>
              <SearchableSelect
                options={availableUsers.map((u: any) => ({ value: u.id, label: u.name }))}
                value={newMember.userId}
                onValueChange={(v) => setNewMember({ ...newMember, userId: v })}
                placeholder="Select a user"
                data-testid="select-new-member-user"
              />
            </div>
            <div className="space-y-2">
              <Label>Project Roles</Label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(HIGH_LEVEL_ROLE_CONFIG) as HighLevelRoleType[]).map((role) => {
                  const config = HIGH_LEVEL_ROLE_CONFIG[role];
                  const isSelected = newMember.highLevelRoles.includes(role);
                  return (
                    <div 
                      key={role}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                        isSelected ? config.color : "hover:bg-muted"
                      )}
                      onClick={() => {
                        if (isSelected) {
                          setNewMember({
                            ...newMember,
                            highLevelRoles: newMember.highLevelRoles.filter(r => r !== role),
                            executionRoleIds: role === 'member' ? [] : newMember.executionRoleIds,
                          });
                        } else {
                          setNewMember({
                            ...newMember,
                            highLevelRoles: [...newMember.highLevelRoles, role],
                          });
                        }
                      }}
                      data-testid={`checkbox-role-${role}`}
                    >
                      <Checkbox checked={isSelected} />
                      <span className="text-sm">{config.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {newMember.highLevelRoles.includes('member') && projectRoles.length > 0 && (
              <div className="space-y-2">
                <Label>Execution Roles</Label>
                <div className="flex flex-wrap gap-2">
                  {projectRoles.map((role: any) => {
                    const isSelected = newMember.executionRoleIds.includes(role.id);
                    return (
                      <Badge
                        key={role.id}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          if (isSelected) {
                            setNewMember({
                              ...newMember,
                              executionRoleIds: newMember.executionRoleIds.filter(id => id !== role.id),
                            });
                          } else {
                            setNewMember({
                              ...newMember,
                              executionRoleIds: [...newMember.executionRoleIds, role.id],
                            });
                          }
                        }}
                        data-testid={`badge-exec-role-${role.id}`}
                      >
                        {role.name}
                        {isSelected && <Check className="h-3 w-3 ml-1" />}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Allocation %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={newMember.allocationPercent}
                onChange={(e) => setNewMember({ ...newMember, allocationPercent: parseInt(e.target.value) || 0 })}
                data-testid="input-allocation-percent"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMember} data-testid="button-confirm-add-member">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addRoleDialogOpen} onOpenChange={setAddRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Execution Role</DialogTitle>
            <DialogDescription>Define a new role for task assignment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Role Name</Label>
              <Input
                placeholder="e.g., Lead Developer"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                data-testid="input-role-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Role Type</Label>
              <Select
                value={newRole.roleType}
                onValueChange={(v) => setNewRole({ ...newRole, roleType: v })}
              >
                <SelectTrigger data-testid="select-role-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_TYPE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                placeholder="Brief description of this role"
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                data-testid="input-role-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRoleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddRole} disabled={isCreatingRole} data-testid="button-confirm-add-role">
              {isCreatingRole ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editRoleDialogOpen} onOpenChange={setEditRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Execution Role</DialogTitle>
            <DialogDescription>Update this role's details</DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Role Name</Label>
                <Input
                  value={selectedRole.name}
                  onChange={(e) => setSelectedRole({ ...selectedRole, name: e.target.value })}
                  data-testid="input-edit-role-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Role Type</Label>
                <Select
                  value={selectedRole.roleType}
                  onValueChange={(v) => setSelectedRole({ ...selectedRole, roleType: v })}
                >
                  <SelectTrigger data-testid="select-edit-role-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_TYPE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={selectedRole.description || ""}
                  onChange={(e) => setSelectedRole({ ...selectedRole, description: e.target.value })}
                  data-testid="input-edit-role-description"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateRole} data-testid="button-confirm-update-role">
              <Check className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role "{selectedRole?.name}"? 
              This will unassign all team members from this role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRole}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-role"
            >
              {isDeletingRole ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteMemberConfirmOpen} onOpenChange={setDeleteMemberConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this person from the project team?
              This will revoke all their project and execution roles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-remove-member"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
