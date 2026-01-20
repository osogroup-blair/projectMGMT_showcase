import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Download,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import type { SprintValidationSummary, SprintValidationErrorType } from '@shared/import-types';
import { exportSprintValidationProblems } from '@/lib/import-validation';

interface SprintValidationPanelProps {
  summary: SprintValidationSummary;
  onExportProblems?: () => void;
}

const ERROR_TYPE_LABELS: Record<SprintValidationErrorType, string> = {
  no_sprint_reference: 'No Sprint Reference',
  sprint_id_not_found: 'Sprint ID Not Found',
  sprint_name_not_found: 'Sprint Name Not Found',
  unknown: 'Unknown Error'
};

export function SprintValidationPanel({ summary, onExportProblems }: SprintValidationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(summary.invalidSprintReference > 0);
  const [showSprintBreakdown, setShowSprintBreakdown] = useState(false);
  const [showInvalidTasks, setShowInvalidTasks] = useState(false);

  const invalidTasks = useMemo(() => 
    summary.results.filter(r => r.status === 'invalid'),
    [summary.results]
  );

  const handleExport = () => {
    if (onExportProblems) {
      onExportProblems();
      return;
    }
    
    const csvContent = exportSprintValidationProblems(summary);
    if (!csvContent) return;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'invalid-sprint-assignments.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const hasProblems = summary.invalidSprintReference > 0;
  const hasSprintAssignments = summary.assignedToSprint > 0;
  const hasSprints = summary.sprints.length > 0;

  if (!hasSprints && summary.assignedToSprint === 0) {
    return null;
  }

  return (
    <Card data-testid="sprint-validation-panel">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors" data-testid="sprint-validation-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {hasProblems ? (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                ) : hasSprintAssignments ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <HelpCircle className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  <CardTitle className="text-base">Task-Sprint Validation</CardTitle>
                  <CardDescription>
                    {summary.totalTasks} tasks, {summary.assignedToSprint} assigned to sprints, {summary.sprints.length} sprints defined
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {hasProblems && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    {summary.invalidSprintReference} invalid
                  </Badge>
                )}
                {hasSprintAssignments && !hasProblems && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {summary.assignedToSprint} assigned
                  </Badge>
                )}
                {summary.noSprintAssignment > 0 && (
                  <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                    {summary.noSprintAssignment} unassigned
                  </Badge>
                )}
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {summary.sprints.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No sprints found in import. Tasks will not be assigned to sprints.
              </p>
            ) : (
              <div className="space-y-4">
                <Collapsible open={showSprintBreakdown} onOpenChange={setShowSprintBreakdown}>
                  <CollapsibleTrigger asChild>
                    <div 
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                      data-testid="sprint-breakdown-toggle"
                    >
                      <div className="flex items-center gap-3">
                        <CalendarDays className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">Sprint Task Distribution</p>
                          <p className="text-xs text-muted-foreground">
                            View how tasks are distributed across sprints
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{summary.sprints.length} sprints</Badge>
                        {showSprintBreakdown ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="mt-2 rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Sprint Name</TableHead>
                            <TableHead className="text-right">Tasks Assigned</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {summary.sprints.map(sprint => (
                            <TableRow key={sprint.id} data-testid={`sprint-row-${sprint.id}`}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <CalendarDays className="h-4 w-4 text-blue-500" />
                                  {sprint.name}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant={sprint.taskCount > 0 ? "default" : "secondary"}>
                                  {sprint.taskCount} task{sprint.taskCount !== 1 ? 's' : ''}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {hasProblems && (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        The following tasks have invalid sprint references:
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleExport}
                        data-testid="export-sprint-problems-btn"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Problems
                      </Button>
                    </div>

                    <Collapsible open={showInvalidTasks} onOpenChange={setShowInvalidTasks}>
                      <CollapsibleTrigger asChild>
                        <div 
                          className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50/50 hover:bg-amber-50 cursor-pointer transition-colors"
                          data-testid="invalid-sprint-tasks-toggle"
                        >
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <div>
                              <p className="text-sm font-medium text-amber-700">Invalid Sprint References</p>
                              <p className="text-xs text-amber-600">
                                Tasks reference sprints that don't exist in the import
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                              {invalidTasks.length} tasks
                            </Badge>
                            {showInvalidTasks ? (
                              <ChevronUp className="h-4 w-4 text-amber-600" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-amber-600" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="mt-2 rounded-lg border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Task Title</TableHead>
                                <TableHead>Source Sprint Reference</TableHead>
                                <TableHead>Error</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {invalidTasks.slice(0, 20).map(task => (
                                <TableRow key={task.taskId} data-testid={`invalid-sprint-task-${task.taskId}`}>
                                  <TableCell className="font-medium">
                                    {task.taskTitle}
                                    {task.sourceId && (
                                      <span className="text-xs text-muted-foreground ml-2">
                                        (ID: {task.sourceId})
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
                                      {task.sourceSprintId || 'Unknown'}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-xs text-red-600">
                                      {task.errorMessage}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                              {invalidTasks.length > 20 && (
                                <TableRow>
                                  <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                                    +{invalidTasks.length - 20} more tasks with invalid sprint references
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </>
                )}

                {!hasProblems && hasSprintAssignments && (
                  <div className="flex items-center gap-2 py-4 text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm">
                      All {summary.assignedToSprint} task sprint assignments are valid.
                    </span>
                  </div>
                )}

                {summary.noSprintAssignment > 0 && (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                    <p className="font-medium">Note about unassigned tasks:</p>
                    <p className="text-blue-700 mt-1">
                      {summary.noSprintAssignment} task{summary.noSprintAssignment !== 1 ? 's have' : ' has'} no sprint assignment. 
                      This is normal - you can assign them to sprints after the project is created.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
