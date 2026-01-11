import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  UserPlus
} from "lucide-react";
import { StepProps, WizardRole, WizardStage, WizardTaskDraft, CORE_PROJECT_ROLES } from "./types";
import { useMemo, useState } from "react";

interface TaskAssignmentStats {
  totalTasks: number;
  assignedTasks: number;
  unassignedTasks: number;
  fromImport: boolean;
}

export function StepTeamRoles({
  roles,
  setRoles,
  roleTypes,
  roleTemplates,
  users,
  eligibleUsers,
  stages,
  setStages,
  deliverables,
}: StepProps) {
  const [taskAssignmentOpen, setTaskAssignmentOpen] = useState(true);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [bulkAssigneeId, setBulkAssigneeId] = useState<string>("");

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

  const unassignedTasksByStage = useMemo(() => {
    const result: { stage: WizardStage; tasks: WizardTaskDraft[] }[] = [];
    
    stages.forEach(stage => {
      const unassigned = (stage.tasks || []).filter(task => !task.assigneeId);
      if (unassigned.length > 0) {
        result.push({ stage, tasks: unassigned });
      }
    });
    
    return result;
  }, [stages]);

  const taskAssigneeOptions = useMemo(() => {
    return users.map((user: any) => ({
      value: user.id,
      label: user.name || user.email || user.id
    }));
  }, [users]);

  const assignTaskToUser = (stageId: string, taskId: string, userId: string | null) => {
    setStages(prev => prev.map(stage => {
      if (stage.id !== stageId) return stage;
      return {
        ...stage,
        tasks: stage.tasks.map(task => {
          if (task.id !== taskId) return task;
          return { ...task, assigneeId: userId || undefined };
        })
      };
    }));
  };

  const bulkAssignAllUnassigned = (userId: string) => {
    if (!userId) return;
    
    setStages(prev => prev.map(stage => ({
      ...stage,
      tasks: stage.tasks.map(task => {
        if (task.assigneeId) return task;
        return { ...task, assigneeId: userId };
      })
    })));
    setBulkAssigneeId("");
  };

  const toggleStageExpanded = (stageId: string) => {
    setExpandedStages(prev => {
      const next = new Set(prev);
      if (next.has(stageId)) {
        next.delete(stageId);
      } else {
        next.add(stageId);
      }
      return next;
    });
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

  const templateOptions = availableTemplates.map((rt: any) => ({
    value: rt.id,
    label: rt.name
  }));

  const renderRoleCard = (role: WizardRole, globalIndex: number) => {
    const eligibleForRole = getEligibleUsersForRole(role.roleTypeId);
    const hasEligibleUsers = eligibleForRole.length > 0;

    const userOptions = (hasEligibleUsers ? eligibleForRole : users).map((member: any) => ({
      value: member.id,
      label: member.role ? `${member.name} (${member.role})` : member.name
    }));

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
            <SearchableSelect 
              value={role.assigneeId || ""} 
              onValueChange={(val) => {
                const newRoles = [...roles];
                newRoles[globalIndex].assigneeId = val || null;
                setRoles(newRoles);
              }}
              placeholder="Unassigned"
              options={userOptions}
              data-testid={`select-role-assignee-${globalIndex}`}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {taskAssignmentStats.totalTasks > 0 && (
        <div className="space-y-3">
          {taskAssignmentStats.fromImport && taskAssignmentStats.assignedTasks > 0 ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Imported Tasks Have Assignees</AlertTitle>
              <AlertDescription className="text-green-700">
                <strong>{taskAssignmentStats.assignedTasks}</strong> of <strong>{taskAssignmentStats.totalTasks}</strong> tasks 
                already have assignees from the import. 
                {taskAssignmentStats.unassignedTasks > 0 && (
                  <span className="block mt-1">
                    <strong>{taskAssignmentStats.unassignedTasks}</strong> task{taskAssignmentStats.unassignedTasks !== 1 ? 's' : ''} still need assignment.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          ) : taskAssignmentStats.unassignedTasks > 0 ? (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Unassigned Tasks</AlertTitle>
              <AlertDescription className="text-amber-700">
                <strong>{taskAssignmentStats.unassignedTasks}</strong> of <strong>{taskAssignmentStats.totalTasks}</strong> tasks 
                do not have assignees. You can assign people to roles below, or assign tasks individually after project creation.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">All Tasks Assigned</AlertTitle>
              <AlertDescription className="text-green-700">
                All <strong>{taskAssignmentStats.totalTasks}</strong> tasks have assignees.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {unassignedTasksByStage.length > 0 && (
        <Collapsible open={taskAssignmentOpen} onOpenChange={setTaskAssignmentOpen}>
          <Card className="border-blue-200 bg-blue-50/30">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-blue-50/50 transition-colors py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListTodo className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-base">Assign Unassigned Tasks</CardTitle>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      {taskAssignmentStats.unassignedTasks} tasks
                    </Badge>
                  </div>
                  {taskAssignmentOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-4">
                <div className="flex items-center gap-4 p-3 bg-white rounded-lg border">
                  <div className="flex-1">
                    <p className="text-sm font-medium">Bulk assign all unassigned tasks</p>
                    <p className="text-xs text-muted-foreground">
                      Quickly assign all {taskAssignmentStats.unassignedTasks} unassigned tasks to one person
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <SearchableSelect
                      value={bulkAssigneeId}
                      onValueChange={setBulkAssigneeId}
                      options={taskAssigneeOptions}
                      placeholder="Select person..."
                      className="w-[200px]"
                      data-testid="bulk-assign-select"
                    />
                    <Button 
                      size="sm" 
                      onClick={() => bulkAssignAllUnassigned(bulkAssigneeId)}
                      disabled={!bulkAssigneeId}
                      data-testid="bulk-assign-btn"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Assign All
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="text-sm font-medium">Or assign tasks individually by stage:</p>
                  
                  {unassignedTasksByStage.map(({ stage, tasks }) => (
                    <Collapsible 
                      key={stage.id} 
                      open={expandedStages.has(stage.id)}
                      onOpenChange={() => toggleStageExpanded(stage.id)}
                    >
                      <Card className="bg-white">
                        <CollapsibleTrigger asChild>
                          <CardHeader className="py-3 px-4 cursor-pointer hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{stage.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {tasks.length} unassigned
                                </Badge>
                              </div>
                              {expandedStages.has(stage.id) ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="pt-0 pb-3 px-4">
                            <div className="space-y-2">
                              {tasks.map(task => (
                                <div 
                                  key={task.id}
                                  className="flex items-center justify-between p-2 bg-muted/20 rounded-md gap-3"
                                  data-testid={`task-row-${task.id}`}
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{task.title}</p>
                                    {task.assignedEpicTitle && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        Epic: {task.assignedEpicTitle}
                                      </p>
                                    )}
                                  </div>
                                  <SearchableSelect
                                    value={task.assigneeId || ""}
                                    onValueChange={(val) => assignTaskToUser(stage.id, task.id, val || null)}
                                    options={[
                                      { value: "", label: "Unassigned" },
                                      ...taskAssigneeOptions
                                    ]}
                                    placeholder="Assign to..."
                                    className="w-[180px] shrink-0"
                                    data-testid={`task-assign-${task.id}`}
                                  />
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      <Separator className="my-2" />

      <div className="flex justify-end items-center">
        <div className="flex gap-2">
          {availableTemplates.length > 0 && (
            <SearchableSelect
              onValueChange={addRoleFromTemplate}
              placeholder="Add from template..."
              options={templateOptions}
              triggerClassName="w-[180px] h-9"
            />
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
        <h4 className="font-medium text-sm mb-2">Assignment Summary</h4>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>{coreRoles.length} core role{coreRoles.length !== 1 ? 's' : ''}</span>
          <span>{stageRoles.length} stage role{stageRoles.length !== 1 ? 's' : ''}</span>
          <span>{roles.filter(r => r.assigneeId).length} roles assigned</span>
          {taskAssignmentStats.totalTasks > 0 && (
            <>
              <span className="border-l pl-4">{taskAssignmentStats.assignedTasks}/{taskAssignmentStats.totalTasks} tasks assigned</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
