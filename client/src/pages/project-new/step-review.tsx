import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Briefcase, 
  Package, 
  FileBox, 
  Layers, 
  ListTodo, 
  Target, 
  Users,
  AlertTriangle,
  Check,
  Upload,
  UserCheck,
  UserX,
  ArrowRightLeft,
  Calendar,
  Clock,
  Building2
} from "lucide-react";
import { StepProps } from "./types";
import { useImportOptional } from "@/context/import-context";

export function StepReview({
  projectData,
  deliverables,
  stages,
  milestones,
  roles,
  users,
}: StepProps) {
  const importContext = useImportOptional();
  const isImportMode = importContext?.state.isImportMode || false;
  const userMappings = importContext?.state.userMappings || [];
  const statusMappings = importContext?.state.statusMappings || [];
  
  const totalEpics = deliverables.reduce((acc, d) => acc + d.epics.length, 0);
  
  const onceTasks = stages.flatMap(stage => 
    stage.tasks.filter(t => t.scope === 'once')
  );
  const perEpicTasks = stages.flatMap(stage => 
    stage.tasks.filter(t => t.scope === 'per_epic')
  );
  
  const onceTaskCount = onceTasks.length;
  const perEpicTaskCount = perEpicTasks.length * totalEpics;
  const totalTasks = onceTaskCount + perEpicTaskCount;
  
  const assignedRoles = roles.filter(r => r.assigneeId).length;
  const ownerName = users.find((u: any) => u.id === projectData.ownerId)?.name || "Not assigned";

  const isLargeProject = totalTasks > 100;

  const tasksByAssignee = (() => {
    const counts: Record<string, { name: string; once: number; perEpic: number }> = {};
    const allTasks = stages.flatMap(s => s.tasks);
    
    allTasks.forEach(task => {
      const assigneeId = task.assigneeId || 'unassigned';
      const user = users.find((u: any) => u.id === assigneeId);
      const name = user?.name || 'Unassigned';
      
      if (!counts[assigneeId]) {
        counts[assigneeId] = { name, once: 0, perEpic: 0 };
      }
      
      if (task.scope === 'per_epic') {
        counts[assigneeId].perEpic += totalEpics;
      } else {
        counts[assigneeId].once += 1;
      }
    });
    
    return Object.entries(counts)
      .map(([id, data]) => ({ id, ...data, total: data.once + data.perEpic }))
      .sort((a, b) => b.total - a.total);
  })();

  const userMappingSummary = (() => {
    if (!isImportMode || userMappings.length === 0) return null;
    const matched = userMappings.filter(m => m.mappedToId && m.action === 'map');
    const highConfidence = userMappings.filter(m => m.confidence === 'high' && m.mappedToId);
    const mediumConfidence = userMappings.filter(m => m.confidence === 'medium' && m.mappedToId);
    const unmatched = userMappings.filter(m => !m.mappedToId || m.action === 'unassigned');
    return {
      total: userMappings.length,
      matched: matched.length,
      highConfidence: highConfidence.length,
      mediumConfidence: mediumConfidence.length,
      unmatched: unmatched.length
    };
  })();

  const statusMappingSummary = (() => {
    if (!isImportMode || statusMappings.length === 0) return null;
    const highConfidence = statusMappings.filter(m => m.confidence === 'high');
    const mediumConfidence = statusMappings.filter(m => m.confidence === 'medium');
    const lowConfidence = statusMappings.filter(m => m.confidence === 'low');
    return {
      total: statusMappings.length,
      highConfidence: highConfidence.length,
      mediumConfidence: mediumConfidence.length,
      lowConfidence: lowConfidence.length
    };
  })();

  return (
    <div className="space-y-8">
      {isImportMode && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Upload className="h-5 w-5 text-blue-600" />
          <div>
            <p className="font-medium text-blue-900">Import Mode</p>
            <p className="text-sm text-blue-700">
              Creating project from: {importContext?.state.sourceFileName}
            </p>
          </div>
        </div>
      )}
      
      {isLargeProject && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-900">Large Project</p>
            <p className="text-sm text-amber-700">
              {totalTasks} tasks will be created. This may take a moment.
            </p>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-primary">{totalTasks}</div>
            <div className="text-sm text-muted-foreground mt-1">Total Tasks</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{stages.length}</div>
            <div className="text-sm text-muted-foreground mt-1">Stages</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">{totalEpics}</div>
            <div className="text-sm text-muted-foreground mt-1">Epics</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-amber-600">{milestones.length}</div>
            <div className="text-sm text-muted-foreground mt-1">Milestones</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{assignedRoles}/{roles.length}</div>
            <div className="text-sm text-muted-foreground mt-1">Roles Assigned</div>
          </CardContent>
        </Card>
      </div>

      <div className="pr-4 space-y-8">
        {/* Project Details Section */}
        <section>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Briefcase className="h-5 w-5 text-primary" />
            Project Details
          </h3>
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Project Name</div>
                    <div className="text-lg font-medium">{projectData.name || "Unnamed Project"}</div>
                  </div>
                  {projectData.description && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Description</div>
                      <div className="text-sm">{projectData.description}</div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                        <Calendar className="h-3 w-3" /> Start Date
                      </div>
                      <div className="font-medium">{projectData.startDate || "Not set"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                        <Calendar className="h-3 w-3" /> End Date
                      </div>
                      <div className="font-medium">{projectData.dueDate || "Not set"}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                        <Clock className="h-3 w-3" /> Sprint Duration
                      </div>
                      <div className="font-medium">
                        {projectData.sprintDurationWeeks > 0 ? `${projectData.sprintDurationWeeks} week(s)` : "No sprints"}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                        <Users className="h-3 w-3" /> Owner
                      </div>
                      <div className="font-medium">{ownerName}</div>
                    </div>
                  </div>
                  {projectData.client && (
                    <div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                        <Building2 className="h-3 w-3" /> Client
                      </div>
                      <div className="font-medium">{projectData.client}</div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Work Structure Section */}
        <section>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-primary" />
            Work Structure
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Deliverables & Epics */}
            <Card>
              <CardContent className="p-5">
                <div className="font-medium mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Deliverables ({deliverables.length})
                </div>
                {deliverables.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No deliverables defined</p>
                ) : (
                  <div className="space-y-3">
                    {deliverables.slice(0, 5).map((d, idx) => (
                      <div key={d.id} className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-xs font-medium shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{d.title || `Deliverable ${idx + 1}`}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {d.epics.slice(0, 3).map((e) => (
                              <Badge key={e.id} variant="outline" className="text-xs">
                                <FileBox className="h-3 w-3 mr-1" />
                                {e.title || "Epic"}
                              </Badge>
                            ))}
                            {d.epics.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{d.epics.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {deliverables.length > 5 && (
                      <p className="text-xs text-muted-foreground pl-7">
                        +{deliverables.length - 5} more deliverables
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stages */}
            <Card>
              <CardContent className="p-5">
                <div className="font-medium mb-3 flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Stages ({stages.length})
                </div>
                {stages.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4" />
                    <span>No stages - using default workflow</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stages.slice(0, 6).map((stage, idx) => (
                      <div key={stage.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {idx + 1}
                          </div>
                          <span className="truncate">{stage.name || `Stage ${idx + 1}`}</span>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {stage.tasks.length} tasks
                        </Badge>
                      </div>
                    ))}
                    {stages.length > 6 && (
                      <p className="text-xs text-muted-foreground pl-7">
                        +{stages.length - 6} more stages
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Task Summary Section */}
        <section>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <ListTodo className="h-5 w-5 text-primary" />
            Task Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Task Breakdown */}
            <Card>
              <CardContent className="p-5">
                <div className="font-medium mb-3">Task Breakdown</div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Once tasks</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">{onceTaskCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Per-epic tasks</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {perEpicTasks.length} × {totalEpics} =
                      </span>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">{perEpicTaskCount}</Badge>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between font-medium">
                    <span>Total tasks to create</span>
                    <span className="text-lg text-primary">{totalTasks}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assignments */}
            <Card>
              <CardContent className="p-5">
                <div className="font-medium mb-3">Assignments by User</div>
                {tasksByAssignee.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks assigned</p>
                ) : (
                  <div className="space-y-2">
                    {tasksByAssignee.slice(0, 5).map(({ id, name, total }) => (
                      <div key={id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className={id === 'unassigned' ? 'text-muted-foreground italic' : ''}>
                            {name}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {total} task{total !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    ))}
                    {tasksByAssignee.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        +{tasksByAssignee.length - 5} more users
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Milestones & Roles Section */}
        <section>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            Milestones & Team
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Milestones */}
            <Card>
              <CardContent className="p-5">
                <div className="font-medium mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Milestones ({milestones.length})
                </div>
                {milestones.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No milestones defined</p>
                ) : (
                  <div className="space-y-2">
                    {milestones.slice(0, 5).map((m) => (
                      <div key={m.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{m.name || "Unnamed"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {m.isBillingGate && (
                            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">
                              Billing
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">{m.targetDate || "No date"}</span>
                        </div>
                      </div>
                    ))}
                    {milestones.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        +{milestones.length - 5} more milestones
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team Roles */}
            <Card>
              <CardContent className="p-5">
                <div className="font-medium mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team Roles ({roles.length})
                </div>
                {roles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No roles defined</p>
                ) : (
                  <div className="space-y-2">
                    {roles.slice(0, 5).map((role) => {
                      const assignee = users.find((u: any) => u.id === role.assigneeId);
                      return (
                        <div key={role.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{role.name || "Role"}</span>
                          </div>
                          <span className={`text-xs ${assignee ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {assignee?.name || "Unassigned"}
                          </span>
                        </div>
                      );
                    })}
                    {roles.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        +{roles.length - 5} more roles
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Import Mappings Section */}
        {isImportMode && (userMappingSummary || statusMappingSummary) && (
          <section>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
              Import Mappings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userMappingSummary && (
                <Card>
                  <CardContent className="p-5">
                    <div className="font-medium mb-3">User Mapping</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total imported</span>
                        <span className="font-medium">{userMappingSummary.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <div className="flex items-center gap-1">
                          <UserCheck className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-muted-foreground">Matched</span>
                        </div>
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          {userMappingSummary.matched}
                        </Badge>
                      </div>
                      {userMappingSummary.unmatched > 0 && (
                        <div className="flex justify-between">
                          <div className="flex items-center gap-1">
                            <UserX className="h-3.5 w-3.5 text-red-500" />
                            <span className="text-muted-foreground">Unmatched</span>
                          </div>
                          <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                            {userMappingSummary.unmatched}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {statusMappingSummary && (
                <Card>
                  <CardContent className="p-5">
                    <div className="font-medium mb-3">Status Mapping</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total statuses</span>
                        <span className="font-medium">{statusMappingSummary.total}</span>
                      </div>
                      {statusMappingSummary.highConfidence > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Exact match</span>
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            {statusMappingSummary.highConfidence}
                          </Badge>
                        </div>
                      )}
                      {statusMappingSummary.mediumConfidence > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Similar match</span>
                          <Badge className="bg-amber-100 text-amber-700 text-xs">
                            {statusMappingSummary.mediumConfidence}
                          </Badge>
                        </div>
                      )}
                      {statusMappingSummary.lowConfidence > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Default fallback</span>
                          <Badge variant="outline" className="text-xs">
                            {statusMappingSummary.lowConfidence}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        )}
      </div>

      {/* What happens next */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
        <h4 className="font-semibold text-green-900 flex items-center gap-2 mb-3">
          <Check className="h-5 w-5 text-green-600" />
          Ready to Create
        </h4>
        <p className="text-sm text-green-800 mb-4">
          Click "Create Project" to create the following:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <Check className="h-4 w-4 text-green-500" />
            <span>1 project</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-700">
            <Check className="h-4 w-4 text-green-500" />
            <span>{deliverables.length} deliverable{deliverables.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-700">
            <Check className="h-4 w-4 text-green-500" />
            <span>{totalEpics} epic{totalEpics !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-700">
            <Check className="h-4 w-4 text-green-500" />
            <span>{stages.length} stage{stages.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-700">
            <Check className="h-4 w-4 text-green-500" />
            <span>{totalTasks} task{totalTasks !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-700">
            <Check className="h-4 w-4 text-green-500" />
            <span>{milestones.length} milestone{milestones.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
