import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Plus, 
  Trash2, 
  Users, 
  AlertCircle, 
  Shield, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ListTodo,
  UserPlus,
  Crown,
  Briefcase,
  Eye,
  User,
  Download,
  Upload
} from "lucide-react";
import { StepProps, WizardRole, WizardStage, WizardTaskDraft, CORE_PROJECT_ROLES } from "./types";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useImportOptional } from "@/context/import-context";
import { useToast } from "@/hooks/use-toast";

interface TeamExportData {
  owner: { userId: string; userName?: string } | null;
  manager: { userId: string; userName?: string } | null;
  stakeholders: { userId: string; userName?: string }[];
  members: { userId: string; userName?: string; executionRoleId?: string; executionRoleName?: string }[];
}

interface TaskAssignmentStats {
  totalTasks: number;
  assignedTasks: number;
  unassignedTasks: number;
  fromImport: boolean;
}

type ProjectRoleType = 'owner' | 'manager' | 'stakeholder' | 'member';

interface ProjectRoleAssignment {
  projectRole: ProjectRoleType;
  userId: string;
  executionRoleId?: string;
}

import { forwardRef, useImperativeHandle } from "react";

export const StepTeamRoles = forwardRef(({
  roles,
  setRoles,
  roleTypes,
  roleTemplates,
  users,
  eligibleUsers,
  stages,
  setStages,
  deliverables,
}: StepProps, ref) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    handleExport,
    fileInputRef
  }));
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['owner', 'manager', 'stakeholder', 'member']));
  
  const [ownerUserId, setOwnerUserIdState] = useState<string>("");
  const [managerUserId, setManagerUserIdState] = useState<string>("");
  const [stakeholderUserIds, setStakeholderUserIdsState] = useState<string[]>([]);
  const [teamMembers, setTeamMembersState] = useState<{ userId: string; executionRoleId?: string }[]>([]);
  
  const importContext = useImportOptional();
  const importInitializedRef = useRef(false);

  const buildRolesArray = useCallback((
    owner: string,
    manager: string,
    stakeholders: string[],
    members: { userId: string; executionRoleId?: string }[]
  ): WizardRole[] => {
    const newRoles: WizardRole[] = [];

    if (owner) {
      newRoles.push({
        id: `role-owner-${owner}`,
        name: "Project Owner",
        roleType: "owner",
        isCore: true,
        assigneeId: owner
      });
    }

    if (manager) {
      newRoles.push({
        id: `role-manager-${manager}`,
        name: "Project Manager",
        roleType: "manager",
        isCore: true,
        assigneeId: manager
      });
    }

    stakeholders.filter(id => id).forEach((userId, idx) => {
      newRoles.push({
        id: `role-stakeholder-${userId}-${idx}`,
        name: "Stakeholder",
        roleType: "stakeholder",
        isCore: false,
        assigneeId: userId
      });
    });

    members.filter(m => m.userId).forEach((member, idx) => {
      const executionRole = roleTypes.find(rt => rt.id === member.executionRoleId);
      newRoles.push({
        id: `role-member-${member.userId}-${idx}`,
        name: executionRole ? executionRole.label : "Team Member",
        roleType: executionRole?.label || "member",
        roleTypeId: member.executionRoleId,
        isCore: false,
        assigneeId: member.userId
      });
    });

    return newRoles;
  }, [roleTypes]);

  const setOwnerUserId = (userId: string) => {
    setOwnerUserIdState(userId);
    setRoles(buildRolesArray(userId, managerUserId, stakeholderUserIds, teamMembers));
  };

  const setManagerUserId = (userId: string) => {
    setManagerUserIdState(userId);
    setRoles(buildRolesArray(ownerUserId, userId, stakeholderUserIds, teamMembers));
  };

  const setStakeholderUserIds = (ids: string[]) => {
    setStakeholderUserIdsState(ids);
    setRoles(buildRolesArray(ownerUserId, managerUserId, ids, teamMembers));
  };

  const setTeamMembers = (members: { userId: string; executionRoleId?: string }[]) => {
    setTeamMembersState(members);
    setRoles(buildRolesArray(ownerUserId, managerUserId, stakeholderUserIds, members));
  };

  useEffect(() => {
    if (importInitializedRef.current) return;
    if (!importContext?.state?.isImportMode) return;
    
    const userMappings = importContext.state.userMappings || [];
    const mappedUsers = userMappings.filter(m => m.mappedToId && m.action === 'map');
    
    if (mappedUsers.length === 0) return;
    
    console.log('[TEAM-ROLES] Initializing from import with', mappedUsers.length, 'mapped users');
    
    let newOwnerUserId = ownerUserId;
    let newManagerUserId = managerUserId;
    const newStakeholderUserIds: string[] = [...stakeholderUserIds];
    const importedTeamMembers: { userId: string; executionRoleId?: string }[] = [];
    
    mappedUsers.forEach(mapping => {
      if (!mapping.mappedToId) return;
      
      const projectRoles = mapping.projectRoles || [];
      
      if (projectRoles.includes('owner') && !newOwnerUserId) {
        newOwnerUserId = mapping.mappedToId;
        console.log('[TEAM-ROLES] Set owner from import:', mapping.mappedToName);
      }
      
      if (projectRoles.includes('manager') && !newManagerUserId) {
        newManagerUserId = mapping.mappedToId;
        console.log('[TEAM-ROLES] Set manager from import:', mapping.mappedToName);
      }
      
      if (projectRoles.includes('stakeholder')) {
        if (!newStakeholderUserIds.includes(mapping.mappedToId)) {
          newStakeholderUserIds.push(mapping.mappedToId);
          console.log('[TEAM-ROLES] Added stakeholder from import:', mapping.mappedToName);
        }
      }
      
      if (projectRoles.includes('member')) {
        const userTaskRoleIds: string[] = [];
        stages.forEach(stage => {
          stage.tasks?.forEach(task => {
            const taskAny = task as any;
            if (taskAny.sourceAssigneeId === mapping.sourceId && task.assigneeRoleTypeId) {
              if (!userTaskRoleIds.includes(task.assigneeRoleTypeId)) {
                userTaskRoleIds.push(task.assigneeRoleTypeId);
              }
            }
          });
        });
        
        const executionRoleId = userTaskRoleIds.length > 0 ? userTaskRoleIds[0] : undefined;
        
        if (!importedTeamMembers.find(m => m.userId === mapping.mappedToId)) {
          importedTeamMembers.push({
            userId: mapping.mappedToId,
            executionRoleId
          });
          console.log('[TEAM-ROLES] Added team member from import:', mapping.mappedToName);
        }
      }
    });
    
    if (newOwnerUserId !== ownerUserId) {
      setOwnerUserIdState(newOwnerUserId);
    }
    if (newManagerUserId !== managerUserId) {
      setManagerUserIdState(newManagerUserId);
    }
    if (newStakeholderUserIds.length > stakeholderUserIds.length) {
      setStakeholderUserIdsState(newStakeholderUserIds);
    }
    
    if (importedTeamMembers.length > 0) {
      setTeamMembersState(importedTeamMembers);
    }
    
    setRoles(buildRolesArray(newOwnerUserId, newManagerUserId, newStakeholderUserIds, importedTeamMembers));
    console.log('[TEAM-ROLES] Initialized roles from import - owner:', newOwnerUserId, 'manager:', newManagerUserId, 'stakeholders:', newStakeholderUserIds.length, 'members:', importedTeamMembers.length);
    
    importInitializedRef.current = true;
  }, [importContext?.state?.isImportMode, importContext?.state?.userMappings, stages, buildRolesArray, ownerUserId, managerUserId, stakeholderUserIds, setRoles]);

  const taskAssignmentStats = useMemo<TaskAssignmentStats>(() => {
    let totalTasks = 0;
    let assignedTasks = 0;
    let hasImportedAssignees = false;
    
    stages.forEach(stage => {
      if (stage.tasks) {
        stage.tasks.forEach(task => {
          totalTasks++;
          const taskWithAssignee = task as any;
          if (taskWithAssignee.sourceAssigneeId || taskWithAssignee.assigneeId) {
            assignedTasks++;
            if (taskWithAssignee.sourceAssigneeId) {
              hasImportedAssignees = true;
            }
          }
        });
      }
    });

    deliverables?.forEach(deliverable => {
      deliverable.epics?.forEach(epic => {
        if (epic.tasks) {
          epic.tasks.forEach(task => {
            totalTasks++;
            if (task.assigneeId) {
              assignedTasks++;
            }
          });
        }
      });
    });
    
    return {
      totalTasks,
      assignedTasks,
      unassignedTasks: totalTasks - assignedTasks,
      fromImport: hasImportedAssignees
    };
  }, [stages, deliverables]);

  const roleTaskSummary = useMemo(() => {
    const summary: Record<string, { roleName: string; roleTypeId: string; tasks: { title: string; stageName: string }[] }> = {};
    
    roleTypes.forEach(roleType => {
      const tasksForRole: { title: string; stageName: string }[] = [];
      
      stages.forEach(stage => {
        stage.tasks.forEach(task => {
          if (task.assigneeRoleTypeId === roleType.id) {
            tasksForRole.push({ title: task.title, stageName: stage.name });
          }
        });
      });
      
      if (tasksForRole.length > 0) {
        summary[roleType.id] = {
          roleName: roleType.label,
          roleTypeId: roleType.id,
          tasks: tasksForRole
        };
      }
    });
    
    return summary;
  }, [roleTypes, stages]);

  const getTasksForExecutionRole = (executionRoleId: string) => {
    return roleTaskSummary[executionRoleId] || null;
  };

  const userOptions = useMemo(() => {
    return users.map((user: any) => ({
      value: user.id,
      label: user.name || user.email || user.id
    }));
  }, [users]);

  const executionRoleOptions = useMemo(() => {
    return roleTypes.map(rt => ({
      value: rt.id,
      label: rt.label
    }));
  }, [roleTypes]);

  const getAvailableUsersForOwner = () => {
    return userOptions;
  };

  const getAvailableUsersForManager = () => {
    return userOptions;
  };

  const getAvailableUsersForStakeholder = (currentStakeholderUserId: string) => {
    const otherStakeholders = stakeholderUserIds.filter(id => id && id !== currentStakeholderUserId);
    return userOptions.filter(opt => !otherStakeholders.includes(opt.value));
  };

  const getAvailableUsersForMember = (currentMemberUserId: string) => {
    const otherMembers = teamMembers.filter(m => m.userId && m.userId !== currentMemberUserId).map(m => m.userId);
    return userOptions.filter(opt => !otherMembers.includes(opt.value));
  };

  const getAllAssignedUserIds = () => {
    const ids: string[] = [];
    if (ownerUserId) ids.push(ownerUserId);
    if (managerUserId) ids.push(managerUserId);
    ids.push(...stakeholderUserIds);
    ids.push(...teamMembers.map(m => m.userId));
    return Array.from(new Set(ids));
  };

  const getUserOtherRoles = (userId: string) => {
    const roles: string[] = [];
    if (ownerUserId === userId) roles.push('Owner');
    if (managerUserId === userId) roles.push('Manager');
    if (stakeholderUserIds.includes(userId)) roles.push('Stakeholder');
    if (teamMembers.some(m => m.userId === userId)) roles.push('Member');
    return roles;
  };

  const addStakeholder = () => {
    setStakeholderUserIds([...stakeholderUserIds, ""]);
  };

  const removeStakeholder = (index: number) => {
    const newStakeholders = [...stakeholderUserIds];
    newStakeholders.splice(index, 1);
    setStakeholderUserIds(newStakeholders);
  };

  const updateStakeholder = (index: number, userId: string) => {
    const newStakeholders = [...stakeholderUserIds];
    newStakeholders[index] = userId;
    setStakeholderUserIds(newStakeholders);
  };

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { userId: "", executionRoleId: undefined }]);
  };

  const removeTeamMember = (index: number) => {
    const newMembers = [...teamMembers];
    newMembers.splice(index, 1);
    setTeamMembers(newMembers);
  };

  const updateTeamMemberInternal = (index: number, field: 'userId' | 'executionRoleId', value: string, callback?: (member: { userId: string; executionRoleId?: string }) => void) => {
    const newMembers = [...teamMembers];
    if (field === 'userId') {
      newMembers[index].userId = value;
    } else {
      newMembers[index].executionRoleId = value || undefined;
    }
    setTeamMembers(newMembers);
    if (callback) {
      callback(newMembers[index]);
    }
  };

  const updateTeamMember = (index: number, field: 'userId' | 'executionRoleId', value: string) => {
    updateTeamMemberInternal(index, field, value);
  };

  const assignTasksByRole = useCallback((memberId: string, executionRoleId: string) => {
    setStages(prev => prev.map(stage => ({
      ...stage,
      tasks: stage.tasks.map(task => {
        if (task.assigneeRoleTypeId === executionRoleId && !task.assigneeId) {
          return { ...task, assigneeId: memberId };
        }
        return task;
      })
    })));
  }, [setStages]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const getUserName = (userId: string) => {
    const user = users.find((u: any) => u.id === userId);
    return user?.name || user?.email || userId;
  };

  const handleExport = () => {
    const exportData: TeamExportData = {
      owner: ownerUserId ? { userId: ownerUserId, userName: getUserName(ownerUserId) } : null,
      manager: managerUserId ? { userId: managerUserId, userName: getUserName(managerUserId) } : null,
      stakeholders: stakeholderUserIds.filter(id => id).map(id => ({
        userId: id,
        userName: getUserName(id)
      })),
      members: teamMembers.filter(m => m.userId).map(m => ({
        userId: m.userId,
        userName: getUserName(m.userId),
        executionRoleId: m.executionRoleId,
        executionRoleName: m.executionRoleId ? roleTypes.find(rt => rt.id === m.executionRoleId)?.label : undefined
      }))
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "team-assignment.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Team assignment exported successfully." });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as Partial<TeamExportData>;
        
        if (data.owner?.userId) {
          const userExists = users.some((u: any) => u.id === data.owner?.userId);
          if (userExists) setOwnerUserId(data.owner.userId);
        }
        
        if (data.manager?.userId) {
          const userExists = users.some((u: any) => u.id === data.manager?.userId);
          if (userExists) setManagerUserId(data.manager.userId);
        }
        
        if (data.stakeholders?.length) {
          const validStakeholders = data.stakeholders
            .filter(s => users.some((u: any) => u.id === s.userId))
            .map(s => s.userId);
          if (validStakeholders.length) setStakeholderUserIds(validStakeholders);
        }
        
        if (data.members?.length) {
          const validMembers = data.members
            .filter(m => users.some((u: any) => u.id === m.userId))
            .map(m => ({
              userId: m.userId,
              executionRoleId: m.executionRoleId && roleTypes.some(rt => rt.id === m.executionRoleId) 
                ? m.executionRoleId 
                : undefined
            }));
          if (validMembers.length) setTeamMembers(validMembers);
        }
        
        toast({ title: "Imported", description: "Team assignment imported successfully." });
      } catch {
        toast({ title: "Import Failed", description: "Invalid file format.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const assignedCount = getAllAssignedUserIds().filter(id => id).length;
  const totalAssignable = 1 + 1 + stakeholderUserIds.length + teamMembers.length;

  return (
    <div className="space-y-6">
      {taskAssignmentStats.totalTasks > 0 && (
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Team Assignment</CardTitle>
                  <CardDescription>
                    Assign users to project roles. Team members with execution roles will automatically get tasks assigned.
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {taskAssignmentStats.assignedTasks}/{taskAssignmentStats.totalTasks}
                </div>
                <p className="text-xs text-muted-foreground">tasks assigned</p>
              </div>
            </div>
            
            {taskAssignmentStats.totalTasks > 0 && (
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Task Assignment Progress</span>
                  <span>{Math.round((taskAssignmentStats.assignedTasks / taskAssignmentStats.totalTasks) * 100)}%</span>
                </div>
                <Progress 
                  value={(taskAssignmentStats.assignedTasks / taskAssignmentStats.totalTasks) * 100} 
                  className="h-2"
                />
              </div>
            )}
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <Collapsible open={expandedSections.has('owner')} onOpenChange={() => toggleSection('owner')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                      <Crown className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Owner</CardTitle>
                      <CardDescription>Single project owner with full control</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {ownerUserId && (
                      <Badge variant="secondary" className="text-xs">
                        {getUserName(ownerUserId)}
                      </Badge>
                    )}
                    {expandedSections.has('owner') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <Label>Select Project Owner</Label>
                  <SearchableSelect
                    value={ownerUserId}
                    onValueChange={setOwnerUserId}
                    options={getAvailableUsersForOwner()}
                    placeholder="Select owner..."
                    data-testid="select-owner"
                  />
                  {ownerUserId && getUserOtherRoles(ownerUserId).filter(r => r !== 'Owner').length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Also assigned as: {getUserOtherRoles(ownerUserId).filter(r => r !== 'Owner').join(', ')}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    The owner has ultimate responsibility and approval authority for the project.
                  </p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        <Card>
          <Collapsible open={expandedSections.has('manager')} onOpenChange={() => toggleSection('manager')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Manager</CardTitle>
                      <CardDescription>Day-to-day project management</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {managerUserId && (
                      <Badge variant="secondary" className="text-xs">
                        {getUserName(managerUserId)}
                      </Badge>
                    )}
                    {expandedSections.has('manager') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <Label>Select Project Manager</Label>
                  <SearchableSelect
                    value={managerUserId}
                    onValueChange={setManagerUserId}
                    options={getAvailableUsersForManager()}
                    placeholder="Select manager..."
                    data-testid="select-manager"
                  />
                  {managerUserId && getUserOtherRoles(managerUserId).filter(r => r !== 'Manager').length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Also assigned as: {getUserOtherRoles(managerUserId).filter(r => r !== 'Manager').join(', ')}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    The manager oversees execution, coordinates team activities, and reports to stakeholders.
                  </p>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <Collapsible open={expandedSections.has('member')} onOpenChange={() => toggleSection('member')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Team Members</CardTitle>
                      <CardDescription>Contributors with execution roles</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {teamMembers.filter(m => m.userId).length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {teamMembers.filter(m => m.userId).length} assigned
                      </Badge>
                    )}
                    {expandedSections.has('member') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-4">
                {teamMembers.map((member, idx) => {
                  const taskSummary = member.executionRoleId ? getTasksForExecutionRole(member.executionRoleId) : null;
                  return (
                    <Card key={idx} className="bg-muted/30">
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 space-y-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Team Member</Label>
                              <SearchableSelect
                                value={member.userId}
                                onValueChange={(val) => updateTeamMember(idx, 'userId', val)}
                                options={getAvailableUsersForMember(member.userId)}
                                placeholder="Select team member..."
                                data-testid={`select-member-${idx}`}
                              />
                              {member.userId && getUserOtherRoles(member.userId).filter(r => r !== 'Member').length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  Also: {getUserOtherRoles(member.userId).filter(r => r !== 'Member').join(', ')}
                                </p>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Execution Role (from templates)</Label>
                              <SearchableSelect
                                value={member.executionRoleId || ""}
                                onValueChange={(val) => updateTeamMember(idx, 'executionRoleId', val)}
                                options={[
                                  { value: "", label: "No specific role" },
                                  ...executionRoleOptions
                                ]}
                                placeholder="Select execution role..."
                                data-testid={`select-execution-role-${idx}`}
                              />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTeamMember(idx)}
                            className="text-destructive hover:text-destructive mt-6"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {taskSummary && member.userId && (
                          <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-2 mb-2">
                              <ListTodo className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                {taskSummary.tasks.length} tasks will be assigned
                              </span>
                            </div>
                            <div className="max-h-24 overflow-y-auto space-y-1">
                              {taskSummary.tasks.slice(0, 5).map((task, taskIdx) => (
                                <div key={taskIdx} className="text-xs text-green-700 dark:text-green-300 bg-green-100/50 dark:bg-green-900/30 rounded px-2 py-1">
                                  <span className="font-medium">{task.title}</span>
                                  <span className="text-green-600 dark:text-green-400 ml-1">({task.stageName})</span>
                                </div>
                              ))}
                              {taskSummary.tasks.length > 5 && (
                                <div className="text-xs text-green-600 dark:text-green-400 italic px-2">
                                  +{taskSummary.tasks.length - 5} more tasks
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {taskSummary && !member.userId && (
                          <div className="p-3 bg-muted/50 rounded-lg border">
                            <div className="flex items-center gap-2 mb-2">
                              <ListTodo className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-muted-foreground">
                                {taskSummary.tasks.length} tasks waiting for assignment
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Select a team member above to assign these tasks to the {taskSummary.roleName} role.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addTeamMember}
                  className="w-full"
                  data-testid="button-add-team-member"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team Member
                </Button>
                <p className="text-xs text-muted-foreground">
                  Team members are active contributors. Assign an execution role to automatically assign matching tasks.
                </p>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        <Card>
          <Collapsible open={expandedSections.has('stakeholder')} onOpenChange={() => toggleSection('stakeholder')}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Eye className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Stakeholders</CardTitle>
                    <CardDescription>Interested parties with view access</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {stakeholderUserIds.filter(id => id).length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {stakeholderUserIds.filter(id => id).length} assigned
                    </Badge>
                  )}
                  {expandedSections.has('stakeholder') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {stakeholderUserIds.map((userId, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <SearchableSelect
                      value={userId}
                      onValueChange={(val) => updateStakeholder(idx, val)}
                      options={getAvailableUsersForStakeholder(userId)}
                      placeholder="Select stakeholder..."
                      className="flex-1"
                      data-testid={`select-stakeholder-${idx}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStakeholder(idx)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {userId && getUserOtherRoles(userId).filter(r => r !== 'Stakeholder').length > 0 && (
                    <p className="text-xs text-muted-foreground ml-1">
                      Also: {getUserOtherRoles(userId).filter(r => r !== 'Stakeholder').join(', ')}
                    </p>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addStakeholder}
                className="w-full"
                data-testid="button-add-stakeholder"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Stakeholder
              </Button>
              <p className="text-xs text-muted-foreground">
                Stakeholders receive updates and can view progress but don't have edit access.
              </p>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
        </Card>
      </div>

      <div className="p-4 bg-muted/20 rounded-lg border">
        <h4 className="font-medium text-sm mb-3">Team Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-background rounded-lg border">
            <Crown className="h-5 w-5 mx-auto mb-1 text-amber-600" />
            <div className="text-lg font-bold">{ownerUserId ? 1 : 0}/1</div>
            <p className="text-xs text-muted-foreground">Owner</p>
          </div>
          <div className="text-center p-3 bg-background rounded-lg border">
            <Briefcase className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <div className="text-lg font-bold">{managerUserId ? 1 : 0}/1</div>
            <p className="text-xs text-muted-foreground">Manager</p>
          </div>
          <div className="text-center p-3 bg-background rounded-lg border">
            <Eye className="h-5 w-5 mx-auto mb-1 text-purple-600" />
            <div className="text-lg font-bold">{stakeholderUserIds.filter(id => id).length}</div>
            <p className="text-xs text-muted-foreground">Stakeholders</p>
          </div>
          <div className="text-center p-3 bg-background rounded-lg border">
            <User className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <div className="text-lg font-bold">{teamMembers.filter(m => m.userId).length}</div>
            <p className="text-xs text-muted-foreground">Team Members</p>
          </div>
        </div>
        
        {taskAssignmentStats.totalTasks > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tasks with assignees:</span>
              <span className="font-medium">
                {taskAssignmentStats.assignedTasks} of {taskAssignmentStats.totalTasks}
                {taskAssignmentStats.unassignedTasks > 0 && (
                  <span className="text-amber-600 ml-2">
                    ({taskAssignmentStats.unassignedTasks} unassigned)
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {Object.keys(roleTaskSummary).length > 0 && teamMembers.filter(m => m.executionRoleId).length === 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Execution Roles Available</AlertTitle>
          <AlertDescription className="text-amber-700">
            There are {Object.values(roleTaskSummary).reduce((acc, r) => acc + r.tasks.length, 0)} tasks 
            that can be automatically assigned based on execution roles. Add team members with execution roles 
            to auto-assign these tasks.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
});
