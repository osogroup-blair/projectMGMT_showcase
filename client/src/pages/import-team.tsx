import React, { useState, useMemo, useCallback } from 'react';
import { useLocation } from 'wouter';
import { 
  ArrowRight, 
  ArrowLeft,
  Users,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Wand2,
  Crown,
  Briefcase,
  Eye,
  UserPlus,
  AlertCircle,
  Link2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useImport } from '@/context/import-context';
import { useAllUsersForAssignment } from '@/features/user-management';
import type { ConfidenceLevel, UserMappingEntry, ProjectRoleType } from '@/lib/import-to-wizard-adapter';

const PROJECT_ROLE_OPTIONS: SearchableSelectOption[] = [
  { value: 'none', label: 'No Project Role' },
  { value: 'owner', label: 'Project Owner' },
  { value: 'manager', label: 'Project Manager' },
  { value: 'stakeholder', label: 'Stakeholder' },
  { value: 'member', label: 'Team Member' },
];

function ConfidenceBadge({ confidence }: { confidence: ConfidenceLevel }) {
  const config = {
    high: { label: 'Matched', className: 'bg-green-100 text-green-700 border-green-200' },
    medium: { label: 'Partial Match', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    low: { label: 'Needs Review', className: 'bg-red-100 text-red-700 border-red-200' },
    unmapped: { label: 'Not Mapped', className: 'bg-gray-100 text-gray-500 border-gray-200' },
  };
  const { label, className } = config[confidence] || config.unmapped;
  return <Badge variant="outline" className={className}>{label}</Badge>;
}

function ConfidenceIcon({ confidence }: { confidence: ConfidenceLevel }) {
  if (confidence === 'high') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (confidence === 'medium') return <HelpCircle className="h-4 w-4 text-amber-500" />;
  return <XCircle className="h-4 w-4 text-red-500" />;
}

function getRoleIcon(role: ProjectRoleType | 'none' | undefined) {
  switch (role) {
    case 'owner': return <Crown className="h-3 w-3" />;
    case 'manager': return <Briefcase className="h-3 w-3" />;
    case 'stakeholder': return <Eye className="h-3 w-3" />;
    case 'member': return <Users className="h-3 w-3" />;
    default: return null;
  }
}

function getRoleBadgeStyle(role: ProjectRoleType | 'none' | undefined) {
  switch (role) {
    case 'owner': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'manager': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'stakeholder': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'member': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

interface RoleCheckboxGroupProps {
  mapping: UserMappingEntry;
  currentOwner: UserMappingEntry | undefined;
  currentManager: UserMappingEntry | undefined;
  onRolesChange: (roles: ProjectRoleType[]) => void;
  disabled?: boolean;
}

const ROLE_CONFIG: { value: ProjectRoleType; label: string; icon: React.ReactNode; exclusive: boolean }[] = [
  { value: 'owner', label: 'Owner', icon: <Crown className="h-3 w-3" />, exclusive: true },
  { value: 'manager', label: 'Manager', icon: <Briefcase className="h-3 w-3" />, exclusive: true },
  { value: 'stakeholder', label: 'Stakeholder', icon: <Eye className="h-3 w-3" />, exclusive: false },
  { value: 'member', label: 'Member', icon: <Users className="h-3 w-3" />, exclusive: false },
];

function RoleCheckboxGroup({ mapping, currentOwner, currentManager, onRolesChange, disabled }: RoleCheckboxGroupProps) {
  const currentRoles = mapping.projectRoles || [];
  
  const handleRoleToggle = (role: ProjectRoleType, checked: boolean) => {
    let newRoles: ProjectRoleType[];
    
    if (checked) {
      newRoles = [...currentRoles.filter(r => r !== 'none'), role];
    } else {
      newRoles = currentRoles.filter(r => r !== role);
    }
    
    onRolesChange(newRoles);
  };
  
  const isRoleDisabled = (role: ProjectRoleType): { disabled: boolean; reason?: string } => {
    if (disabled) return { disabled: true };
    
    if (role === 'owner' && currentOwner && currentOwner.sourceId !== mapping.sourceId) {
      return { disabled: true, reason: `Owner is already assigned to ${currentOwner.mappedToName || currentOwner.sourceName}` };
    }
    if (role === 'manager' && currentManager && currentManager.sourceId !== mapping.sourceId) {
      return { disabled: true, reason: `Manager is already assigned to ${currentManager.mappedToName || currentManager.sourceName}` };
    }
    return { disabled: false };
  };
  
  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2" data-testid={`role-checkboxes-${mapping.sourceId}`}>
        {ROLE_CONFIG.map(({ value, label, icon, exclusive }) => {
          const isChecked = currentRoles.includes(value);
          const { disabled: isDisabled, reason } = isRoleDisabled(value);
          
          const checkbox = (
            <label
              key={value}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs cursor-pointer transition-colors ${
                isChecked 
                  ? getRoleBadgeStyle(value)
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={(checked) => handleRoleToggle(value, checked === true)}
                disabled={isDisabled}
                className="h-3 w-3"
                data-testid={`role-checkbox-${mapping.sourceId}-${value}`}
              />
              {icon}
              <span>{label}</span>
              {exclusive && <span className="text-[10px] opacity-60">(1)</span>}
            </label>
          );
          
          if (isDisabled && reason) {
            return (
              <Tooltip key={value}>
                <TooltipTrigger asChild>
                  {checkbox}
                </TooltipTrigger>
                <TooltipContent>
                  <p>{reason}</p>
                </TooltipContent>
              </Tooltip>
            );
          }
          
          return checkbox;
        })}
      </div>
    </TooltipProvider>
  );
}

export default function ImportTeam() {
  const [, setLocation] = useLocation();
  const { state, updateUserMapping, updateUserProjectRoles } = useImport();
  const { data: allUsers } = useAllUsersForAssignment();
  
  const [multiAssigneeOpen, setMultiAssigneeOpen] = useState(true);

  const systemUsers = allUsers || [];

  const userSelectOptions: SearchableSelectOption[] = useMemo(() => {
    const options: SearchableSelectOption[] = [
      { value: 'unassigned', label: 'Leave unassigned' }
    ];
    systemUsers.forEach((user: any) => {
      options.push({
        value: user.id,
        label: user.name || user.email || user.id
      });
    });
    return options;
  }, [systemUsers]);

  const handleAutoMapUsers = useCallback(() => {
    const normalizeString = (str: string): string => {
      return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    };

    const fuzzyMatch = (a: string, b: string): number => {
      const normA = normalizeString(a);
      const normB = normalizeString(b);
      
      if (normA === normB) return 1;
      if (normA.includes(normB) || normB.includes(normA)) return 0.8;
      
      const words1 = a.toLowerCase().split(/[\s_\-@.]+/).filter(Boolean);
      const words2 = b.toLowerCase().split(/[\s_\-@.]+/).filter(Boolean);
      const matchingWords = words1.filter(w => words2.some(w2 => w2.includes(w) || w.includes(w2)));
      if (matchingWords.length > 0) {
        return 0.5 + (matchingWords.length / Math.max(words1.length, words2.length)) * 0.4;
      }
      
      return 0;
    };

    const userMappings = state.userMappings;

    for (const mapping of userMappings) {
      if (mapping.mappedToId && mapping.action === 'map') continue;
      
      let bestMatch: { userId: string; userName: string; score: number } | null = null;
      
      const sourceStrings = [
        mapping.sourceName,
        mapping.sourceEmail,
        mapping.sourceId
      ].filter(Boolean) as string[];
      
      for (const user of systemUsers) {
        const userStrings = [
          user.name,
          user.email,
          user.firstName,
          user.lastName,
          `${user.firstName || ''} ${user.lastName || ''}`.trim()
        ].filter(Boolean) as string[];
        
        for (const sourceStr of sourceStrings) {
          for (const userStr of userStrings) {
            const score = fuzzyMatch(sourceStr, userStr);
            if (score > 0.5 && (!bestMatch || score > bestMatch.score)) {
              bestMatch = { userId: user.id, userName: user.name || user.email || user.id, score };
            }
          }
        }
      }
      
      if (bestMatch) {
        updateUserMapping(mapping.sourceId, bestMatch.userId, bestMatch.userName, 'map');
      }
    }
  }, [state.userMappings, systemUsers, updateUserMapping]);

  const handleUserMappingChange = (sourceId: string, newMappedToId: string) => {
    if (newMappedToId === 'unassigned') {
      updateUserMapping(sourceId, null, undefined, 'unassigned');
    } else {
      const user = systemUsers.find((u: any) => u.id === newMappedToId);
      updateUserMapping(sourceId, newMappedToId, user?.name || undefined, 'map');
    }
  };

  const currentOwner = useMemo(() => {
    return state.userMappings.find(m => m.projectRoles?.includes('owner'));
  }, [state.userMappings]);

  const currentManager = useMemo(() => {
    return state.userMappings.find(m => m.projectRoles?.includes('manager'));
  }, [state.userMappings]);

  const teamStats = useMemo(() => {
    const userMappings = state.userMappings || [];
    const mapped = userMappings.filter(m => m.mappedToId && m.action === 'map');
    const unmapped = userMappings.filter(m => !m.mappedToId || m.action === 'unassigned');
    
    const byRole: Record<string, UserMappingEntry[]> = {
      owner: [],
      manager: [],
      stakeholder: [],
      member: [],
      none: [],
    };
    
    mapped.forEach(m => {
      const roles = m.projectRoles || [];
      if (roles.length === 0) {
        byRole.none.push(m);
      } else {
        roles.forEach(role => {
          if (byRole[role]) {
            byRole[role].push(m);
          }
        });
      }
    });
    
    const withRoles = mapped.filter(m => m.projectRoles && m.projectRoles.length > 0 && !m.projectRoles.every(r => r === 'none')).length;
    
    return {
      total: userMappings.length,
      mapped: mapped.length,
      unmapped: unmapped.length,
      byRole,
      withRoles,
    };
  }, [state.userMappings]);

  const multiAssigneeTasks = useMemo(() => {
    if (!state.adapterResult) return [];
    
    const tasks: { id: string; title: string; assignees: string[]; stageName: string }[] = [];
    
    state.adapterResult.stages.forEach(stage => {
      stage.tasks?.forEach((task: any) => {
        if (task.multipleAssignees && task.multipleAssignees.length > 1) {
          tasks.push({
            id: task.id,
            title: task.title,
            assignees: task.multipleAssignees,
            stageName: stage.name
          });
        }
      });
    });
    
    return tasks;
  }, [state.adapterResult]);

  if (!state.isImportMode || !state.adapterResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Import Data</h1>
          <p className="text-muted-foreground mb-6">Please upload a file first to assign team members.</p>
          <Button onClick={() => setLocation('/projects/import')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Upload
          </Button>
        </div>
      </div>
    );
  }

  const handleContinue = () => {
    setLocation('/projects/import/summary');
  };

  const handleBack = () => {
    setLocation('/projects/import');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-primary">Team Assignment</h1>
          </div>
          <p className="text-muted-foreground">
            Map imported users to system users and assign their project roles.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Badge variant="outline" className="text-xs">Step 2 of 3</Badge>
            <span className="text-xs text-muted-foreground">Upload → Team Assignment → Summary</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs">Total Imported</span>
              </div>
              <p className="text-2xl font-bold">{teamStats.total}</p>
            </CardContent>
          </Card>
          <Card className={teamStats.mapped > 0 ? "border-green-200 bg-green-50/50" : ""}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <UserCheck className="h-4 w-4 text-green-600" />
                <span className="text-xs">Mapped</span>
              </div>
              <p className="text-2xl font-bold text-green-700">{teamStats.mapped}</p>
            </CardContent>
          </Card>
          <Card className={teamStats.unmapped > 0 ? "border-amber-200 bg-amber-50/50" : ""}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-xs">Unmapped</span>
              </div>
              <p className="text-2xl font-bold text-amber-700">{teamStats.unmapped}</p>
            </CardContent>
          </Card>
          <Card className={teamStats.withRoles > 0 ? "border-primary/30 bg-primary/5" : ""}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Crown className="h-4 w-4 text-primary" />
                <span className="text-xs">With Roles</span>
              </div>
              <p className="text-2xl font-bold text-primary">{teamStats.withRoles}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Link2 className="h-4 w-4" />
                <span className="text-xs">Multi-Assignee</span>
              </div>
              <p className="text-2xl font-bold">{multiAssigneeTasks.length}</p>
            </CardContent>
          </Card>
        </div>

        {teamStats.withRoles > 0 && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Team Preview</CardTitle>
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  {teamStats.withRoles} will be added to project
                </Badge>
              </div>
              <CardDescription>
                These users will be automatically added to the project team in the wizard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {teamStats.byRole.owner.map(u => (
                  <Badge key={u.sourceId} className="bg-amber-100 text-amber-800 border-amber-200">
                    <Crown className="h-3 w-3 mr-1" />
                    {u.mappedToName || u.sourceName}
                  </Badge>
                ))}
                {teamStats.byRole.manager.map(u => (
                  <Badge key={u.sourceId} className="bg-purple-100 text-purple-800 border-purple-200">
                    <Briefcase className="h-3 w-3 mr-1" />
                    {u.mappedToName || u.sourceName}
                  </Badge>
                ))}
                {teamStats.byRole.stakeholder.map(u => (
                  <Badge key={u.sourceId} className="bg-blue-100 text-blue-800 border-blue-200">
                    <Eye className="h-3 w-3 mr-1" />
                    {u.mappedToName || u.sourceName}
                  </Badge>
                ))}
                {teamStats.byRole.member.map(u => (
                  <Badge key={u.sourceId} className="bg-green-100 text-green-800 border-green-200">
                    <Users className="h-3 w-3 mr-1" />
                    {u.mappedToName || u.sourceName}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <CardTitle className="text-lg">All Imported Users</CardTitle>
                <Badge variant="outline">{state.userMappings.length}</Badge>
              </div>
              <div className="flex gap-2">
                {teamStats.unmapped > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAutoMapUsers}
                    data-testid="auto-map-users-btn"
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Auto-Map Users
                  </Button>
                )}
                {teamStats.byRole.none.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      teamStats.byRole.none.forEach(u => {
                        updateUserProjectRoles(u.sourceId, ['member']);
                      });
                    }}
                    data-testid="assign-all-members-btn"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign All as Members
                  </Button>
                )}
              </div>
            </div>
            <CardDescription>
              Map each imported user to a system user and assign their project role.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Imported User</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Map To System User</TableHead>
                  <TableHead>Project Roles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.userMappings.map((mapping) => (
                  <TableRow key={mapping.sourceId} data-testid={`user-row-${mapping.sourceId}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{mapping.sourceName || mapping.sourceId}</p>
                        {mapping.sourceEmail && (
                          <p className="text-xs text-muted-foreground">{mapping.sourceEmail}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {mapping.taskCount || 0} tasks
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ConfidenceIcon confidence={mapping.confidence} />
                        <ConfidenceBadge confidence={mapping.confidence} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <SearchableSelect
                        value={mapping.mappedToId || 'unassigned'}
                        onValueChange={(val) => handleUserMappingChange(mapping.sourceId, val)}
                        options={userSelectOptions}
                        placeholder="Select user..."
                        searchPlaceholder="Search users..."
                        emptyMessage="No users found."
                        className="w-[220px]"
                        data-testid={`user-select-${mapping.sourceId}`}
                      />
                    </TableCell>
                    <TableCell>
                      <RoleCheckboxGroup
                        mapping={mapping}
                        currentOwner={currentOwner}
                        currentManager={currentManager}
                        onRolesChange={(roles) => updateUserProjectRoles(mapping.sourceId, roles)}
                        disabled={!mapping.mappedToId || mapping.action === 'unassigned'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {multiAssigneeTasks.length > 0 && (
          <Collapsible open={multiAssigneeOpen} onOpenChange={setMultiAssigneeOpen}>
            <Card className="mb-6 border-amber-200 bg-amber-50/30">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <CardTitle className="text-lg">Tasks with Multiple Assignees</CardTitle>
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                        {multiAssigneeTasks.length} tasks
                      </Badge>
                    </div>
                    {multiAssigneeOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                  <CardDescription>
                    These tasks have multiple people assigned. Select one person to be the task owner.
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Current Assignees</TableHead>
                        <TableHead>Select Owner</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {multiAssigneeTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{task.stageName}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {task.assignees.map((assignee, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {assignee}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <SearchableSelect
                              value=""
                              onValueChange={() => {}}
                              options={[
                                { value: '', label: 'Select owner...' },
                                ...task.assignees.map(a => ({ value: a, label: a }))
                              ]}
                              placeholder="Select owner..."
                              className="w-[180px]"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        <Separator className="my-6" />

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Upload
          </Button>
          <Button onClick={handleContinue} data-testid="continue-to-summary-btn">
            Continue to Summary
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
