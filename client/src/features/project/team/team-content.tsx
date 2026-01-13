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
  Plus
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
import { useToast } from "@/hooks/use-toast";
import { useUsers, useProject, useTasks, useProjectTeam, useProjectTeamRoles } from "@/hooks/use-nexus-data";
import { cn } from "@/lib/utils";

const MEMBER_TYPE_CONFIG: Record<string, { label: string; icon: React.ComponentType<any>; color: string }> = {
  owner: { label: "Owner", icon: Crown, color: "bg-amber-100 text-amber-800 border-amber-200" },
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
  const [isUpdatingOwner, setIsUpdatingOwner] = useState(false);
  const { data: allUsers = [], isLoading: isUsersLoading } = useUsers();
  const { data: allTasks = [], isLoading: isTasksLoading } = useTasks();
  const { 
    data: teamMembers = [], 
    isLoading: isTeamLoading, 
    addMember, 
    updateMember, 
    removeMember,
    isAdding,
    isRemoving 
  } = useProjectTeam(projectId);
  const { 
    data: projectRoles = [], 
    isLoading: isRolesLoading, 
    createRole, 
    updateRole, 
    deleteRole,
    isCreating: isCreatingRole,
    isDeleting: isDeletingRole 
  } = useProjectTeamRoles(projectId);

  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [addRoleDialogOpen, setAddRoleDialogOpen] = useState(false);
  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteMemberConfirmOpen, setDeleteMemberConfirmOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [selectedMemberToDelete, setSelectedMemberToDelete] = useState<any>(null);

  const [newMember, setNewMember] = useState({ userId: "", memberType: "member", roleId: "", allocationPercent: 100 });
  const [newRole, setNewRole] = useState({ name: "", roleType: "technical", description: "", isRequired: false, maxAssignees: 1 });

  const projectTasks = useMemo(() => 
    (allTasks || []).filter((t: any) => t.projectId === projectId),
    [allTasks, projectId]
  );

  const owner = useMemo(() => {
    if (project?.ownerId) {
      return allUsers.find((u: any) => u.id === project.ownerId);
    }
    return null;
  }, [project, allUsers]);

  const stakeholders = useMemo(() => 
    teamMembers.filter((m: any) => m.memberType === "stakeholder"),
    [teamMembers]
  );

  const members = useMemo(() => 
    teamMembers.filter((m: any) => m.memberType === "member"),
    [teamMembers]
  );

  const getTaskCountForUser = (userId: string) => {
    return projectTasks.filter((t: any) => t.assigneeId === userId).length;
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleSetOwner = async (userId: string) => {
    setIsUpdatingOwner(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/owner`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: userId }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to update owner");
      }
      await refetchProject();
      toast({ title: "Owner updated", description: "Project owner has been set." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update owner.", variant: "destructive" });
    } finally {
      setIsUpdatingOwner(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMember.userId) {
      toast({ title: "Error", description: "Please select a user.", variant: "destructive" });
      return;
    }
    try {
      await addMember({
        userId: newMember.userId,
        memberType: newMember.memberType,
        roleId: newMember.roleId || undefined,
        allocationPercent: newMember.allocationPercent,
      });
      toast({ title: "Team member added", description: "New team member has been added to the project." });
      setAddMemberDialogOpen(false);
      setNewMember({ userId: "", memberType: "member", roleId: "", allocationPercent: 100 });
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
    return teamMembers.filter((m: any) => m.roleId === roleId);
  };

  const isLoading = isProjectLoading || isUsersLoading || isTasksLoading || isTeamLoading || isRolesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const availableUsers = allUsers.filter((u: any) => 
    !teamMembers.some((m: any) => m.userId === u.id) && u.id !== project?.ownerId
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-base">Project Owner</CardTitle>
            </div>
            <CardDescription>The accountable person for this project</CardDescription>
          </CardHeader>
          <CardContent>
            {owner ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-amber-100 text-amber-800">
                    {getInitials(owner.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{owner.name}</p>
                  <p className="text-sm text-muted-foreground">{owner.email}</p>
                </div>
                <SearchableSelect
                  options={allUsers.map((u: any) => ({ value: u.id, label: u.name }))}
                  value={project?.ownerId || ""}
                  onValueChange={handleSetOwner}
                  placeholder="Change owner"
                  className="w-32"
                  data-testid="select-change-owner"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <Crown className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">No owner assigned</p>
                </div>
                <SearchableSelect
                  options={allUsers.map((u: any) => ({ value: u.id, label: u.name }))}
                  value=""
                  onValueChange={handleSetOwner}
                  placeholder="Set owner"
                  className="w-32"
                  data-testid="select-set-owner"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-base">Stakeholders</CardTitle>
              </div>
              <Badge variant="secondary">{stakeholders.length}</Badge>
            </div>
            <CardDescription>People who follow or approve work</CardDescription>
          </CardHeader>
          <CardContent>
            {stakeholders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stakeholders added yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {stakeholders.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-1 bg-muted rounded-full px-2 py-1">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs bg-blue-100 text-blue-800">
                        {getInitials(s.user?.name || "")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{s.user?.name}</span>
                    <button 
                      onClick={() => {
                        setSelectedMemberToDelete(s);
                        setDeleteMemberConfirmOpen(true);
                      }}
                      className="ml-1 text-muted-foreground hover:text-destructive"
                      data-testid={`button-remove-stakeholder-${s.id}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                <CardTitle className="text-base">Team Members</CardTitle>
              </div>
              <Badge variant="secondary">{members.length}</Badge>
            </div>
            <CardDescription>People doing the work</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => setAddMemberDialogOpen(true)}
              data-testid="button-add-team-member"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <CardTitle className="text-base">Team Members</CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setAddMemberDialogOpen(true)}
                data-testid="button-add-member-table"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Tasks</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No team members yet. Add team members to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((m: any) => {
                    const config = MEMBER_TYPE_CONFIG[m.memberType] || MEMBER_TYPE_CONFIG.member;
                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-green-100 text-green-800 text-xs">
                                {getInitials(m.user?.name || "")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{m.user?.name}</p>
                              <p className="text-xs text-muted-foreground">{m.allocationPercent}% allocation</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-xs", config.color)}>
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {m.role ? (
                            <Badge variant="secondary" className="text-xs">
                              {m.role.name}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
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
                <CardTitle className="text-base">Project Roles</CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setAddRoleDialogOpen(true)}
                data-testid="button-add-role"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Role
              </Button>
            </div>
            <CardDescription>Define roles that can be assigned to tasks</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No roles defined yet. Add roles to enable role-based task assignment.
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
                            {r.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{r.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs capitalize">
                            {r.roleType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {membersWithRole.length > 0 ? (
                            <div className="flex -space-x-2">
                              {membersWithRole.slice(0, 3).map((m: any) => (
                                <Avatar key={m.id} className="h-6 w-6 border-2 border-background">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(m.user?.name || "")}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {membersWithRole.length > 3 && (
                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                                  +{membersWithRole.length - 3}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No members</span>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>Add a new person to the project team</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Person</Label>
              <SearchableSelect
                options={availableUsers.map((u: any) => ({ value: u.id, label: u.name }))}
                value={newMember.userId}
                onValueChange={(v) => setNewMember({ ...newMember, userId: v })}
                placeholder="Select a person"
                data-testid="select-new-member-user"
              />
            </div>
            <div className="space-y-2">
              <Label>Member Type</Label>
              <Select 
                value={newMember.memberType} 
                onValueChange={(v) => setNewMember({ ...newMember, memberType: v })}
              >
                <SelectTrigger data-testid="select-member-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Team Member</SelectItem>
                  <SelectItem value="stakeholder">Stakeholder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newMember.memberType === "member" && (
              <>
                <div className="space-y-2">
                  <Label>Project Role (optional)</Label>
                  <Select 
                    value={newMember.roleId} 
                    onValueChange={(v) => setNewMember({ ...newMember, roleId: v })}
                  >
                    <SelectTrigger data-testid="select-member-role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectRoles.map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Allocation %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={newMember.allocationPercent}
                    onChange={(e) => setNewMember({ ...newMember, allocationPercent: parseInt(e.target.value) || 0 })}
                    data-testid="input-allocation"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMember} disabled={isAdding} data-testid="button-confirm-add-member">
              {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addRoleDialogOpen} onOpenChange={setAddRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Project Role</DialogTitle>
            <DialogDescription>Define a new role for this project</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Role Name</Label>
              <Input
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                placeholder="e.g., Solution Consultant"
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
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                placeholder="Brief description of responsibilities"
                data-testid="input-role-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRoleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddRole} disabled={isCreatingRole} data-testid="button-confirm-add-role">
              {isCreatingRole && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editRoleDialogOpen} onOpenChange={setEditRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Update role details</DialogDescription>
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
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedRole?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeletingRole && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteMemberConfirmOpen} onOpenChange={setDeleteMemberConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{selectedMemberToDelete?.user?.name}" from this project?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isRemoving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
