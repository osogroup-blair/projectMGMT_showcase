import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Info
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
  
  const epicTasks = deliverables.flatMap(d => 
    d.epics.flatMap(e => e.tasks || [])
  );
  
  const onceTaskCount = onceTasks.length;
  const perEpicTaskCount = perEpicTasks.length * totalEpics;
  const epicTaskCount = epicTasks.length;
  const totalTasks = onceTaskCount + perEpicTaskCount + epicTaskCount;
  
  const assignedRoles = roles.filter(r => r.assigneeId).length;
  const ownerName = users.find((u: any) => u.id === projectData.ownerId)?.name || "Not assigned";

  const isLargeProject = totalTasks > 100;

  const tasksByAssignee = (() => {
    const counts: Record<string, { name: string; once: number; perEpic: number; epic: number }> = {};
    const stageTasks = stages.flatMap(s => s.tasks);
    
    stageTasks.forEach(task => {
      const assigneeId = task.assigneeId || 'unassigned';
      const user = users.find((u: any) => u.id === assigneeId);
      const name = user?.name || 'Unassigned';
      
      if (!counts[assigneeId]) {
        counts[assigneeId] = { name, once: 0, perEpic: 0, epic: 0 };
      }
      
      if (task.scope === 'per_epic') {
        counts[assigneeId].perEpic += totalEpics;
      } else {
        counts[assigneeId].once += 1;
      }
    });
    
    epicTasks.forEach(task => {
      const assigneeId = task.assigneeId || 'unassigned';
      const user = users.find((u: any) => u.id === assigneeId);
      const name = user?.name || 'Unassigned';
      
      if (!counts[assigneeId]) {
        counts[assigneeId] = { name, once: 0, perEpic: 0, epic: 0 };
      }
      counts[assigneeId].epic += 1;
    });
    
    return Object.entries(counts)
      .map(([id, data]) => ({ id, ...data, total: data.once + data.perEpic + data.epic }))
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
      
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-5">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Info className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">What happens next?</h3>
            <p className="text-sm text-muted-foreground mb-3">
              When you click "Create Project", the following will be created:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="flex items-center gap-2 bg-background/80 rounded-md px-3 py-2">
                <Briefcase className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">1 Project</span>
              </div>
              <div className="flex items-center gap-2 bg-background/80 rounded-md px-3 py-2">
                <Package className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">{deliverables.length} Deliverable{deliverables.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2 bg-background/80 rounded-md px-3 py-2">
                <FileBox className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium">{totalEpics} Epic{totalEpics !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2 bg-background/80 rounded-md px-3 py-2">
                <Layers className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">{stages.length} Stage{stages.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2 bg-background/80 rounded-md px-3 py-2">
                <ListTodo className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">{totalTasks} Task{totalTasks !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2 bg-background/80 rounded-md px-3 py-2">
                <Target className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">{milestones.length} Milestone{milestones.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>
        {isLargeProject && (
          <div className="flex items-center gap-2 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Large project: {totalTasks} tasks will be created</span>
          </div>
        )}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3"
            data-testid="tab-overview"
          >
            <Briefcase className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="stages" 
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3"
            data-testid="tab-stages"
          >
            <Layers className="h-4 w-4 mr-2" />
            Stages ({stages.length})
          </TabsTrigger>
          <TabsTrigger 
            value="team" 
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3"
            data-testid="tab-team"
          >
            <Users className="h-4 w-4 mr-2" />
            Team ({roles.length})
          </TabsTrigger>
          <TabsTrigger 
            value="tasks" 
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3"
            data-testid="tab-tasks"
          >
            <ListTodo className="h-4 w-4 mr-2" />
            Tasks ({totalTasks})
          </TabsTrigger>
          <TabsTrigger 
            value="milestones" 
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3"
            data-testid="tab-milestones"
          >
            <Target className="h-4 w-4 mr-2" />
            Milestones ({milestones.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
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
                  <Package className="h-4 w-4" /> Deliverables & Epics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {deliverables.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No deliverables defined</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {deliverables.map((d, idx) => (
                      <div key={d.id} className="flex items-start gap-2">
                        <Package className="h-4 w-4 text-primary mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{d.title || `Deliverable ${idx + 1}`}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {d.epics.slice(0, 3).map((e, eIdx) => (
                              <Badge key={e.id} variant="outline" className="text-xs">
                                <FileBox className="h-3 w-3 mr-1" />
                                {e.title || `Epic ${eIdx + 1}`}
                              </Badge>
                            ))}
                            {d.epics.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{d.epics.length - 3} more
                              </Badge>
                            )}
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
          </div>
        </TabsContent>

        <TabsContent value="stages" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-5 w-5" /> Project Stages
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stages.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
                  <Check className="h-4 w-4" />
                  <span>Project can be created without stages</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {stages.map((stage, idx) => (
                    <div key={stage.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                          {idx + 1}
                        </div>
                        <div>
                          <span className="font-medium">{stage.name || `Stage ${idx + 1}`}</span>
                          {stage.startDate && stage.endDate && (
                            <div className="text-xs text-muted-foreground">
                              {stage.startDate} - {stage.endDate}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {stage.tasks.length} task{stage.tasks.length !== 1 ? 's' : ''}
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
        </TabsContent>

        <TabsContent value="team" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5" /> Team Roles & Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {roles.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">No roles defined</p>
              ) : (
                <div className="space-y-2">
                  {roles.map((role) => {
                    const assignee = users.find((u: any) => u.id === role.assigneeId);
                    return (
                      <div key={role.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <span className="font-medium">{role.name || "Unnamed Role"}</span>
                            <Badge variant="outline" className="text-xs ml-2">{role.roleType}</Badge>
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 ${assignee ? '' : 'text-muted-foreground'}`}>
                          {assignee ? (
                            <>
                              <UserCheck className="h-4 w-4 text-green-500" />
                              <span>{assignee.name}</span>
                            </>
                          ) : (
                            <>
                              <UserX className="h-4 w-4" />
                              <span>Unassigned</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                    {assignedRoles} of {roles.length} role{roles.length !== 1 ? 's' : ''} assigned
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ListTodo className="h-4 w-4" /> Task Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-3xl font-bold text-primary">{totalTasks}</div>
                    <div className="text-xs text-muted-foreground">Total Tasks</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="grid grid-cols-3 gap-1 text-center">
                      <div>
                        <div className="text-lg font-bold text-blue-600">{onceTaskCount}</div>
                        <div className="text-[10px] text-muted-foreground">Once</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-600">{perEpicTaskCount}</div>
                        <div className="text-[10px] text-muted-foreground">Per-Epic</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">{epicTaskCount}</div>
                        <div className="text-[10px] text-muted-foreground">Manual</div>
                      </div>
                    </div>
                  </div>
                </div>
                {perEpicTasks.length > 0 && totalEpics > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {perEpicTasks.length} per-epic template(s) × {totalEpics} epic(s) = {perEpicTaskCount} tasks
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" /> Tasks by Assignee
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tasksByAssignee.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks defined</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {tasksByAssignee.map(({ id, name, total }) => (
                      <div key={id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className={id === 'unassigned' ? 'text-muted-foreground italic' : ''}>
                            {name}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs font-normal">
                          {total} task{total !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="milestones" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-5 w-5" /> Project Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {milestones.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">No milestones defined</p>
              ) : (
                <div className="space-y-2">
                  {milestones.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <Target className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="font-medium">{m.name || "Unnamed Milestone"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.isBillingGate && (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">
                            Billing Gate
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">{m.targetDate || "No date"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
