import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  ArrowRightLeft
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
    <div className="space-y-6">
      {isImportMode && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
          <Upload className="h-4 w-4" />
          <span className="text-sm font-medium">
            Creating project from imported file: {importContext?.state.sourceFileName}
          </span>
        </div>
      )}
      
      {isLargeProject && (
        <div className="flex justify-end">
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Large project: {totalTasks} tasks will be created</span>
          </div>
        </div>
      )}

      <div className="pr-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> Project Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{projectData.name || "Unnamed Project"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start Date</span>
                <span>{projectData.startDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">End Date</span>
                <span>{projectData.dueDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sprint Duration</span>
                <span>{projectData.sprintDurationWeeks > 0 ? `${projectData.sprintDurationWeeks} week(s)` : "No sprints"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Owner</span>
                <span>{ownerName}</span>
              </div>
              {projectData.client && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client</span>
                  <span>{projectData.client}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ListTodo className="h-4 w-4" /> Task Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-muted/50 rounded">
                  <div className="text-2xl font-bold text-primary">{totalTasks}</div>
                  <div className="text-xs text-muted-foreground">Total Tasks</div>
                </div>
                <div className="p-2 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">{onceTaskCount}</div>
                  <div className="text-xs text-muted-foreground">Once</div>
                </div>
                <div className="p-2 bg-purple-50 rounded">
                  <div className="text-2xl font-bold text-purple-600">{perEpicTaskCount}</div>
                  <div className="text-xs text-muted-foreground">Per Epic</div>
                </div>
              </div>
              {perEpicTasks.length > 0 && totalEpics > 0 && (
                <p className="text-xs text-muted-foreground">
                  {perEpicTasks.length} task draft(s) × {totalEpics} epic(s) = {perEpicTaskCount} tasks
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" /> Task Assignments by User
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasksByAssignee.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks defined</p>
              ) : (
                <div className="space-y-2">
                  {tasksByAssignee.map(({ id, name, once, perEpic, total }) => (
                    <div key={id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className={id === 'unassigned' ? 'text-muted-foreground italic' : ''}>
                          {name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-normal">
                          {total} task{total !== 1 ? 's' : ''}
                        </Badge>
                        {once > 0 && perEpic > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ({once} once, {perEpic} per-epic)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {isImportMode && userMappingSummary && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4" /> User Mapping Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Imported Users</span>
                    <span className="font-medium">{userMappingSummary.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <div className="flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5 text-green-600" />
                      <span className="text-muted-foreground">Matched</span>
                    </div>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                      {userMappingSummary.matched}
                    </Badge>
                  </div>
                  {userMappingSummary.highConfidence > 0 && (
                    <div className="flex justify-between pl-5">
                      <span className="text-muted-foreground text-xs">High confidence</span>
                      <span className="text-xs text-green-600">{userMappingSummary.highConfidence}</span>
                    </div>
                  )}
                  {userMappingSummary.mediumConfidence > 0 && (
                    <div className="flex justify-between pl-5">
                      <span className="text-muted-foreground text-xs">Medium confidence</span>
                      <span className="text-xs text-amber-600">{userMappingSummary.mediumConfidence}</span>
                    </div>
                  )}
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

          {isImportMode && statusMappingSummary && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4" /> Status Mapping Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Imported Statuses</span>
                    <span className="font-medium">{statusMappingSummary.total}</span>
                  </div>
                  {statusMappingSummary.highConfidence > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Exact match</span>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                        {statusMappingSummary.highConfidence}
                      </Badge>
                    </div>
                  )}
                  {statusMappingSummary.mediumConfidence > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Similar match</span>
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">
                        {statusMappingSummary.mediumConfidence}
                      </Badge>
                    </div>
                  )}
                  {statusMappingSummary.lowConfidence > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Default fallback</span>
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        {statusMappingSummary.lowConfidence}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" /> Deliverables & Epics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deliverables.length === 0 ? (
                <p className="text-sm text-muted-foreground">No deliverables defined</p>
              ) : (
                <div className="space-y-2">
                  {deliverables.map((d, idx) => (
                    <div key={d.id} className="flex items-start gap-2">
                      <Package className="h-4 w-4 text-primary mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{d.title || `Deliverable ${idx + 1}`}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {d.epics.map((e, eIdx) => (
                            <Badge key={e.id} variant="outline" className="text-xs">
                              <FileBox className="h-3 w-3 mr-1" />
                              {e.title || `Epic ${eIdx + 1}`}
                            </Badge>
                          ))}
                          {d.epics.length === 0 && (
                            <span className="text-xs text-muted-foreground">No epics</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Layers className="h-4 w-4" /> Stages ({stages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stages.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4" />
                  <span>Project can be created without stages</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {stages.map((stage, idx) => (
                    <div key={stage.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {idx + 1}
                        </div>
                        <span>{stage.name || `Stage ${idx + 1}`}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {stage.tasks.length} tasks
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            stage.taskCreationMode === 'per_epic' 
                              ? 'bg-purple-100 text-purple-700' 
                              : stage.taskCreationMode === 'once'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-muted'
                          }`}
                        >
                          {stage.taskCreationMode === 'per_epic' ? 'Per Epic' : 
                           stage.taskCreationMode === 'once' ? 'Once' : 'None'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" /> Milestones ({milestones.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {milestones.length === 0 ? (
                <p className="text-sm text-muted-foreground">No milestones defined</p>
              ) : (
                <div className="space-y-2">
                  {milestones.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span>{m.name || "Unnamed Milestone"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.isBillingGate && (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">
                            Billing Gate
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">{m.targetDate || "No date"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" /> Team & Roles ({roles.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {roles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No roles defined</p>
              ) : (
                <div className="space-y-2">
                  {roles.map((role) => {
                    const assignee = users.find((u: any) => u.id === role.assigneeId);
                    return (
                      <div key={role.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{role.name || "Unnamed Role"}</span>
                          <Badge variant="outline" className="text-xs">{role.roleType}</Badge>
                        </div>
                        <span className={assignee ? "" : "text-muted-foreground"}>
                          {assignee?.name || "Unassigned"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="bg-muted/30 p-4 rounded-lg border">
        <h4 className="font-medium text-sm mb-2">What happens next?</h4>
        <p className="text-sm text-muted-foreground">
          When you click "Create Project", the following will be created:
        </p>
        <ul className="text-sm text-muted-foreground mt-2 space-y-1">
          <li className="flex items-center gap-2">
            <Check className="h-3 w-3 text-green-600" />
            1 project with basic settings
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3 w-3 text-green-600" />
            {deliverables.length} deliverable{deliverables.length !== 1 ? 's' : ''} with {totalEpics} epic{totalEpics !== 1 ? 's' : ''}
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3 w-3 text-green-600" />
            {stages.length} stage{stages.length !== 1 ? 's' : ''}
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3 w-3 text-green-600" />
            {totalTasks} task{totalTasks !== 1 ? 's' : ''} ({onceTaskCount} once, {perEpicTaskCount} per-epic)
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3 w-3 text-green-600" />
            {milestones.length} milestone{milestones.length !== 1 ? 's' : ''}
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3 w-3 text-green-600" />
            {roles.length} role{roles.length !== 1 ? 's' : ''} ({assignedRoles} assigned)
          </li>
        </ul>
      </div>
    </div>
  );
}
