import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { 
  ArrowRight, 
  ArrowLeft,
  FileCheck, 
  Package, 
  FileBox, 
  ListTodo, 
  Target, 
  Users,
  Layers,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  UserCheck,
  ArrowRightLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";
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
import { useStatusOptions } from '@/hooks/use-nexus-data';
import { useAllUsersForAssignment } from '@/features/user-management';
import type { ConfidenceLevel, UserMappingEntry, StatusMappingEntry } from '@/lib/import-to-wizard-adapter';

function ConfidenceBadge({ confidence }: { confidence: ConfidenceLevel }) {
  const config = {
    high: { label: 'High', className: 'bg-green-100 text-green-700 border-green-200' },
    medium: { label: 'Medium', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    low: { label: 'Low', className: 'bg-red-100 text-red-700 border-red-200' },
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

export default function ImportSummary() {
  const [, setLocation] = useLocation();
  const { state, updateUserMapping, updateStatusMapping } = useImport();
  const { data: allUsers } = useAllUsersForAssignment();
  const { data: statusOptionsData } = useStatusOptions();
  
  const [userMappingOpen, setUserMappingOpen] = useState(true);
  const [statusMappingOpen, setStatusMappingOpen] = useState(true);
  const [taskPreviewOpen, setTaskPreviewOpen] = useState(false);

  const systemUsers = allUsers || [];
  const taskStatuses = (statusOptionsData || []).filter((s: any) => s.type === 'task');

  const stats = state.adapterResult?.stats;
  const userMappings = state.userMappings;
  const statusMappings = state.statusMappings;

  const validationSummary = useMemo(() => {
    const unmappedUsers = userMappings.filter(m => !m.mappedToId || m.action === 'unassigned');
    const lowConfidenceStatuses = statusMappings.filter(m => m.confidence === 'low');
    const hasIssues = unmappedUsers.length > 0 || lowConfidenceStatuses.length > 0;
    
    return {
      unmappedUsers: unmappedUsers.length,
      lowConfidenceStatuses: lowConfidenceStatuses.length,
      hasIssues,
      isReady: !hasIssues || (unmappedUsers.length === 0)
    };
  }, [userMappings, statusMappings]);

  const tasksByAssignee = useMemo(() => {
    if (!state.adapterResult) return [];
    
    const tasks = state.adapterResult.stages.flatMap(s => s.tasks);
    const grouped: Record<string, { sourceName: string; mappedName?: string; mappedId?: string; count: number; confidence: ConfidenceLevel }> = {};
    
    tasks.forEach(task => {
      const sourceAssignee = (task as any).sourceAssigneeId;
      if (!sourceAssignee) {
        if (!grouped['unassigned']) {
          grouped['unassigned'] = { sourceName: 'Unassigned', count: 0, confidence: 'unmapped' };
        }
        grouped['unassigned'].count++;
        return;
      }
      
      const mapping = userMappings.find(m => m.sourceId === sourceAssignee);
      const key = sourceAssignee;
      
      if (!grouped[key]) {
        grouped[key] = {
          sourceName: mapping?.sourceName || sourceAssignee,
          mappedName: mapping?.mappedToName,
          mappedId: mapping?.mappedToId,
          count: 0,
          confidence: mapping?.confidence || 'unmapped'
        };
      }
      grouped[key].count++;
    });
    
    return Object.entries(grouped)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [state.adapterResult, userMappings]);

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

  const statusSelectOptions: SearchableSelectOption[] = useMemo(() => {
    return taskStatuses.map((status: any) => ({
      value: status.id,
      label: status.label
    }));
  }, [taskStatuses]);

  if (!state.isImportMode || !state.adapterResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Import Data</h1>
          <p className="text-muted-foreground mb-6">Please upload a file first to see the import summary.</p>
          <Button onClick={() => setLocation('/projects/import')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Upload
          </Button>
        </div>
      </div>
    );
  }

  const handleUserMappingChange = (sourceId: string, newMappedToId: string) => {
    if (newMappedToId === 'unassigned') {
      updateUserMapping(sourceId, null, undefined, 'unassigned');
    } else {
      const user = systemUsers.find((u: any) => u.id === newMappedToId);
      updateUserMapping(sourceId, newMappedToId, user?.name || undefined, 'map');
    }
  };

  const handleStatusMappingChange = (sourceStatus: string, newMappedStatusId: string) => {
    const status = taskStatuses.find((s: any) => s.id === newMappedStatusId);
    if (status) {
      updateStatusMapping(sourceStatus, status.label, status.id);
    }
  };

  const handleContinue = () => {
    setLocation('/projects/new');
  };

  const handleBack = () => {
    setLocation('/projects/import');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FileCheck className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-primary">Import Summary</h1>
          </div>
          <p className="text-muted-foreground">
            Review what was found in <span className="font-medium">{state.sourceFileName}</span> and verify the mappings before creating your project.
          </p>
        </div>

        {validationSummary.hasIssues && (
          <Card className="mb-6 border-amber-200 bg-amber-50/50">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Some items need attention</p>
                  <ul className="text-sm text-amber-700 mt-1 space-y-1">
                    {validationSummary.unmappedUsers > 0 && (
                      <li>{validationSummary.unmappedUsers} imported user(s) couldn't be matched to system users</li>
                    )}
                    {validationSummary.lowConfidenceStatuses > 0 && (
                      <li>{validationSummary.lowConfidenceStatuses} status(es) are using default fallback mappings</li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Package className="h-4 w-4" />
                <span className="text-xs">Deliverables</span>
              </div>
              <p className="text-2xl font-bold">{stats?.deliverablesFound || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <FileBox className="h-4 w-4" />
                <span className="text-xs">Epics</span>
              </div>
              <p className="text-2xl font-bold">{stats?.epicsFound || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <ListTodo className="h-4 w-4" />
                <span className="text-xs">Tasks</span>
              </div>
              <p className="text-2xl font-bold">{stats?.tasksFound || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Target className="h-4 w-4" />
                <span className="text-xs">Milestones</span>
              </div>
              <p className="text-2xl font-bold">{stats?.milestonesFound || 0}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Collapsible open={userMappingOpen} onOpenChange={setUserMappingOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <CardTitle className="text-lg">User Mappings</CardTitle>
                      <Badge variant="outline">{userMappings.length}</Badge>
                      {validationSummary.unmappedUsers > 0 && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                          {validationSummary.unmappedUsers} unmapped
                        </Badge>
                      )}
                    </div>
                    {userMappingOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                  <CardDescription>
                    Map imported users to existing system users. Unmapped users will have their tasks left unassigned.
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {userMappings.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No users found in import file</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Imported User</TableHead>
                          <TableHead>Confidence</TableHead>
                          <TableHead>Map To</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userMappings.map((mapping) => (
                          <TableRow key={mapping.sourceId} data-testid={`user-mapping-row-${mapping.sourceId}`}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{mapping.sourceName || mapping.sourceId}</p>
                                {mapping.sourceEmail && (
                                  <p className="text-xs text-muted-foreground">{mapping.sourceEmail}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <ConfidenceBadge confidence={mapping.confidence} />
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
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Collapsible open={statusMappingOpen} onOpenChange={setStatusMappingOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="h-5 w-5" />
                      <CardTitle className="text-lg">Status Mappings</CardTitle>
                      <Badge variant="outline">{statusMappings.length}</Badge>
                      {validationSummary.lowConfidenceStatuses > 0 && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                          {validationSummary.lowConfidenceStatuses} low confidence
                        </Badge>
                      )}
                    </div>
                    {statusMappingOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                  <CardDescription>
                    Map imported task statuses to system statuses. This determines which stage tasks will be placed in.
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {statusMappings.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No statuses found in import file</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Imported Status</TableHead>
                          <TableHead>Confidence</TableHead>
                          <TableHead>Map To</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {statusMappings.map((mapping) => (
                          <TableRow key={mapping.sourceStatus} data-testid={`status-mapping-row-${mapping.sourceStatus}`}>
                            <TableCell>
                              <Badge variant="outline">{mapping.sourceStatus}</Badge>
                            </TableCell>
                            <TableCell>
                              <ConfidenceBadge confidence={mapping.confidence} />
                            </TableCell>
                            <TableCell>
                              <SearchableSelect
                                value={mapping.mappedStatusId || ''}
                                onValueChange={(val) => handleStatusMappingChange(mapping.sourceStatus, val)}
                                options={statusSelectOptions}
                                placeholder={mapping.mappedStatus || "Select status..."}
                                searchPlaceholder="Search statuses..."
                                emptyMessage="No statuses found."
                                className="w-[220px]"
                                data-testid={`status-select-${mapping.sourceStatus}`}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Collapsible open={taskPreviewOpen} onOpenChange={setTaskPreviewOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      <CardTitle className="text-lg">Task Assignment Preview</CardTitle>
                      <Badge variant="outline">{stats?.tasksFound || 0} tasks</Badge>
                    </div>
                    {taskPreviewOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                  <CardDescription>
                    Preview how tasks will be assigned to users based on your mappings above.
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {tasksByAssignee.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No tasks found in import file</p>
                  ) : (
                    <div className="space-y-3">
                      {tasksByAssignee.map(({ id, sourceName, mappedName, mappedId, count, confidence }) => (
                        <div key={id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg" data-testid={`task-preview-${id}`}>
                          <div className="flex items-center gap-3">
                            <ConfidenceIcon confidence={confidence} />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{sourceName}</span>
                                {mappedId && (
                                  <>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-primary font-medium">{mappedName}</span>
                                  </>
                                )}
                                {!mappedId && id !== 'unassigned' && (
                                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                                    Will be unassigned
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge variant="secondary">{count} task{count !== 1 ? 's' : ''}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>

        <Separator className="my-8" />

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack} data-testid="back-to-upload-btn">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Upload
          </Button>
          <Button onClick={handleContinue} data-testid="continue-to-wizard-btn">
            Continue to Project Setup
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
