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
  UserCheck,
  ChevronRight
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useUsers, useProject, useTasks, useRoleTemplates } from "@/hooks/use-nexus-data";
import { useUnifiedTeamMembers } from "@/hooks/use-unified-team-members";
import { cn } from "@/lib/utils";
import type { HighLevelRoleType } from "@shared/schema";

const HIGH_LEVEL_ROLE_CONFIG: Record<HighLevelRoleType, { label: string; icon: React.ComponentType<any>; color: string; bgColor: string }> = {
  owner: { label: "Owner", icon: Crown, color: "bg-amber-100 text-amber-800 border-amber-200", bgColor: "bg-amber-50" },
  manager: { label: "Managers", icon: Briefcase, color: "bg-purple-100 text-purple-800 border-purple-200", bgColor: "bg-purple-50" },
  stakeholder: { label: "Stakeholders", icon: Eye, color: "bg-blue-100 text-blue-800 border-blue-200", bgColor: "bg-blue-50" },
  member: { label: "Team Members", icon: Users, color: "bg-green-100 text-green-800 border-green-200", bgColor: "bg-green-50" },
};

type TabType = 'owner' | 'manager' | 'stakeholder' | 'member' | 'roles';

export function TeamContent({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const { data: project, isLoading: isProjectLoading, refetch: refetchProject } = useProject(projectId);
  const { data: allUsers = [], isLoading: isUsersLoading } = useUsers();
  const { data: allTasks = [], isLoading: isTasksLoading } = useTasks();
  const { data: roleTemplates = [], isLoading: isRoleTemplatesLoading } = useRoleTemplates();
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

  const [activeTab, setActiveTab] = useState<TabType>('owner');
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [deleteMemberConfirmOpen, setDeleteMemberConfirmOpen] = useState(false);
  const [editMemberDialogOpen, setEditMemberDialogOpen] = useState(false);
  const [selectedMemberToDelete, setSelectedMemberToDelete] = useState<any>(null);
  const [selectedMemberToEdit, setSelectedMemberToEdit] = useState<any>(null);
  const [changeOwnerDialogOpen, setChangeOwnerDialogOpen] = useState(false);

  const [newMember, setNewMember] = useState({ 
    userId: "", 
    highLevelRoles: [] as HighLevelRoleType[], 
    executionRoleIds: [] as string[],
    allocationPercent: 100 
  });

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

  const handleToggleHighLevelRole = async (memberId: string, roleType: HighLevelRoleType, isRemoving: boolean) => {
    try {
      if (isRemoving) {
        await removeHighLevelRole({ memberId, roleType });
        if (roleType === 'owner') {
          await refetchProject();
        }
      } else {
        await addHighLevelRole({ memberId, roleType });
        if (roleType === 'owner') {
          await refetchProject();
        }
      }
      toast({ title: isRemoving ? "Role removed" : "Role added", description: `${HIGH_LEVEL_ROLE_CONFIG[roleType].label} role ${isRemoving ? 'removed' : 'added'}.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update role.", variant: "destructive" });
    }
  };

  const handleToggleExecutionRole = async (memberId: string, roleId: string, isRemoving: boolean) => {
    try {
      if (isRemoving) {
        await removeExecutionRole({ memberId, roleId });
      } else {
        await addExecutionRole({ memberId, roleId });
      }
      const role = roleTemplates.find((r: any) => r.id === roleId);
      toast({ title: isRemoving ? "Role removed" : "Role added", description: `${role?.name || 'Role'} ${isRemoving ? 'removed' : 'added'}.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update execution role.", variant: "destructive" });
    }
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
      const wasOwner = selectedMemberToDelete.highLevelRoles?.includes('owner');
      await removeMember(selectedMemberToDelete.id);
      if (wasOwner) {
        await refetchProject();
      }
      toast({ title: "Member removed", description: "Team member has been removed from the project." });
      setDeleteMemberConfirmOpen(false);
      setSelectedMemberToDelete(null);
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove team member.", variant: "destructive" });
    }
  };

  const handleChangeOwner = async (newOwnerId: string) => {
    const currentOwner = unifiedMembers.find((m: any) => m.highLevelRoles?.includes('owner'));
    const newOwnerMember = unifiedMembers.find((m: any) => m.userId === newOwnerId);
    
    try {
      if (newOwnerMember) {
        await addHighLevelRole({ memberId: newOwnerMember.id, roleType: 'owner' });
      }
      await refetchProject();
      toast({ title: "Owner changed", description: "Project owner has been updated." });
      setChangeOwnerDialogOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to change owner.", variant: "destructive" });
    }
  };

  const isLoading = isProjectLoading || isUsersLoading || isTasksLoading || isRoleTemplatesLoading || isUnifiedLoading;

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

  const getMembersByRole = (roleType: HighLevelRoleType) => 
    unifiedMembers.filter((m: any) => m.highLevelRoles?.includes(roleType));

  const ownerMember = unifiedMembers.find((m: any) => m.highLevelRoles?.includes('owner'));
  const ownerUser = ownerMember ? allUsers.find((u: any) => u.id === ownerMember.userId) : null;
  const managers = getMembersByRole('manager');
  const stakeholders = getMembersByRole('stakeholder');
  const members = getMembersByRole('member');

  const NAV_ITEMS: { id: TabType; label: string; icon: React.ComponentType<any>; count: number; color: string }[] = [
    { id: 'owner', label: 'Project Owner', icon: Crown, count: ownerMember ? 1 : 0, color: 'text-amber-600' },
    { id: 'manager', label: 'Managers', icon: Briefcase, count: managers.length, color: 'text-purple-600' },
    { id: 'stakeholder', label: 'Stakeholders', icon: Eye, count: stakeholders.length, color: 'text-blue-600' },
    { id: 'member', label: 'Team Members', icon: Users, count: members.length, color: 'text-green-600' },
    { id: 'roles', label: 'Execution Roles', icon: Settings2, count: roleTemplates.length, color: 'text-gray-600' },
  ];

  const renderMemberCard = (m: any, showRoleControls: boolean = true) => {
    const user = allUsers.find((u: any) => u.id === m.userId);
    const hasMemberRole = m.highLevelRoles?.includes('member');
    
    return (
      <Card key={m.id} className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(user?.name || "")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user?.name || "Unknown"}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{getTaskCountForUser(m.userId)} tasks</Badge>
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
            </div>
          </div>

          {showRoleControls && (
            <div className="mt-4 space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Project Roles</Label>
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
                        {role === 'owner' ? 'Owner' : role === 'manager' ? 'Manager' : role === 'stakeholder' ? 'Stakeholder' : 'Member'}
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
              </div>

              {hasMemberRole && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Execution Roles</Label>
                  <div className="flex flex-wrap gap-1">
                    {(m.executionRoles || []).map((role: any) => {
                      const template = roleTemplates.find((rt: any) => rt.id === role.roleId);
                      return (
                        <Badge 
                          key={role.id} 
                          variant="secondary" 
                          className="text-xs cursor-pointer"
                          onClick={() => handleToggleExecutionRole(m.id, role.roleId, true)}
                        >
                          {template?.name || role.roleId}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      );
                    })}
                    {roleTemplates.length > 0 && (
                      <Select
                        value=""
                        onValueChange={(roleId) => handleToggleExecutionRole(m.id, roleId, false)}
                      >
                        <SelectTrigger className="h-6 w-6 p-0 border-dashed" data-testid={`select-add-exec-role-${m.id}`}>
                          <Plus className="h-3 w-3" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleTemplates
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
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'owner':
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-600" />
                Project Owner
              </h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setChangeOwnerDialogOpen(true)}
                data-testid="button-change-owner"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Change Owner
              </Button>
            </div>
            {ownerMember ? (
              renderMemberCard(ownerMember, true)
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Crown className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No owner assigned</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setChangeOwnerDialogOpen(true)}
                  >
                    Assign Owner
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'manager':
      case 'stakeholder':
      case 'member':
        const roleKey = activeTab as 'manager' | 'stakeholder' | 'member';
        const roleConfig = HIGH_LEVEL_ROLE_CONFIG[roleKey];
        const roleMembers = getMembersByRole(roleKey);
        const IconComponent = roleConfig.icon;

        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <IconComponent className={cn("h-5 w-5", 
                  roleKey === 'manager' ? 'text-purple-600' : 
                  roleKey === 'stakeholder' ? 'text-blue-600' : 'text-green-600'
                )} />
                {roleConfig.label}
              </h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setNewMember({ ...newMember, highLevelRoles: [roleKey] });
                  setAddMemberDialogOpen(true);
                }}
                data-testid={`button-add-${roleKey}`}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add {roleKey === 'manager' ? 'Manager' : roleKey === 'stakeholder' ? 'Stakeholder' : 'Member'}
              </Button>
            </div>
            {roleMembers.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-400px)]">
                {roleMembers.map((m: any) => renderMemberCard(m, true))}
              </ScrollArea>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <IconComponent className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No {roleConfig.label.toLowerCase()} assigned</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setNewMember({ ...newMember, highLevelRoles: [roleKey] });
                      setAddMemberDialogOpen(true);
                    }}
                  >
                    Add {roleKey === 'manager' ? 'Manager' : roleKey === 'stakeholder' ? 'Stakeholder' : 'Member'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'roles':
        return (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-gray-600" />
                Execution Roles
              </h3>
              <p className="text-sm text-muted-foreground">
                Roles are managed in Admin &gt; Templates
              </p>
            </div>
            {roleTemplates.length > 0 ? (
              <div className="grid gap-3">
                {roleTemplates.map((role: any) => {
                  const membersWithRole = unifiedMembers.filter((m: any) => 
                    m.executionRoles?.some((er: any) => er.roleId === role.id)
                  );
                  return (
                    <Card key={role.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{role.name}</p>
                            <p className="text-sm text-muted-foreground">{role.description}</p>
                            <Badge variant="outline" className="mt-2 text-xs capitalize">
                              {role.defaultRoleType}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {membersWithRole.length > 0 ? (
                              <div className="flex -space-x-2">
                                {membersWithRole.slice(0, 4).map((m: any) => {
                                  const user = allUsers.find((u: any) => u.id === m.userId);
                                  return (
                                    <Avatar key={m.id} className="h-7 w-7 border-2 border-background">
                                      <AvatarFallback className="text-xs">
                                        {getInitials(user?.name || "")}
                                      </AvatarFallback>
                                    </Avatar>
                                  );
                                })}
                                {membersWithRole.length > 4 && (
                                  <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                                    +{membersWithRole.length - 4}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">Unassigned</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Settings2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No execution roles defined</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Go to Admin &gt; Templates to create role templates
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-amber-50 via-purple-50 to-blue-50 border-none">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-100">
                  <Crown className="h-4 w-4 text-amber-700" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Owner</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{ownerUser?.name || 'Not assigned'}</p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5"
                      onClick={() => setChangeOwnerDialogOpen(true)}
                      data-testid="button-change-owner-quick"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="h-8 w-px bg-border" />

              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-100">
                  <Users className="h-4 w-4 text-green-700" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Members</p>
                  <p className="font-medium text-sm">{members.length}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Eye className="h-4 w-4 text-blue-700" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Stakeholders</p>
                  <p className="font-medium text-sm">{stakeholders.length}</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => setAddMemberDialogOpen(true)}
              data-testid="button-add-team-member"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Team Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted text-foreground"
                    )}
                    data-testid={`nav-${item.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent className={cn("h-4 w-4", isActive ? "" : item.color)} />
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge 
                        variant={isActive ? "secondary" : "outline"} 
                        className="h-5 px-1.5 text-xs"
                      >
                        {item.count}
                      </Badge>
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </div>
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardContent className="p-6">
            {renderTabContent()}
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
                      <span className="text-sm">{role === 'owner' ? 'Owner' : role === 'manager' ? 'Manager' : role === 'stakeholder' ? 'Stakeholder' : 'Team Member'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {newMember.highLevelRoles.includes('member') && roleTemplates.length > 0 && (
              <div className="space-y-2">
                <Label>Execution Roles</Label>
                <div className="flex flex-wrap gap-2">
                  {roleTemplates.map((role: any) => {
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

      <Dialog open={changeOwnerDialogOpen} onOpenChange={setChangeOwnerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Project Owner</DialogTitle>
            <DialogDescription>Select a team member to become the new project owner. The previous owner will retain other roles.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Owner</Label>
              <SearchableSelect
                options={[
                  ...unifiedMembers.map((m: any) => {
                    const user = allUsers.find((u: any) => u.id === m.userId);
                    return { value: m.userId, label: user?.name || 'Unknown' };
                  }),
                  ...availableUsers.map((u: any) => ({ value: u.id, label: `${u.name} (add to team)` }))
                ]}
                value=""
                onValueChange={(userId) => handleChangeOwner(userId)}
                placeholder="Select new owner"
                data-testid="select-new-owner"
              />
            </div>
            {ownerUser && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-sm text-amber-800">
                  Current owner: <strong>{ownerUser.name}</strong>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeOwnerDialogOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
