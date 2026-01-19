import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Download,
  FileWarning,
  Link2Off,
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
import type { TaskValidationSummary, TaskValidationErrorType } from '@shared/import-types';
import { exportTaskValidationProblems } from '@/lib/import-validation';

interface TaskValidationPanelProps {
  summary: TaskValidationSummary;
  onExportProblems?: () => void;
}

const ERROR_TYPE_LABELS: Record<TaskValidationErrorType, string> = {
  no_epic_reference: 'No Epic Reference',
  epic_id_not_found: 'Epic ID Not Found',
  epic_name_not_found: 'Epic Name Not Found',
  epic_fuzzy_match_failed: 'Epic Match Failed',
  unknown: 'Unknown Error'
};

const ERROR_TYPE_DESCRIPTIONS: Record<TaskValidationErrorType, string> = {
  no_epic_reference: 'Tasks have no epic ID or name in the import file',
  epic_id_not_found: 'Tasks reference an epic ID that does not exist in the import',
  epic_name_not_found: 'Tasks reference an epic name that could not be matched',
  epic_fuzzy_match_failed: 'Tasks reference an epic but fuzzy matching could not find it',
  unknown: 'Tasks with unexpected matching errors'
};

function ErrorTypeIcon({ type }: { type: TaskValidationErrorType }) {
  switch (type) {
    case 'no_epic_reference':
      return <Link2Off className="h-4 w-4 text-amber-500" />;
    case 'epic_id_not_found':
    case 'epic_name_not_found':
      return <FileWarning className="h-4 w-4 text-red-500" />;
    case 'epic_fuzzy_match_failed':
      return <HelpCircle className="h-4 w-4 text-amber-500" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-500" />;
  }
}

export function TaskValidationPanel({ summary, onExportProblems }: TaskValidationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(summary.orphanedTasks > 0);
  const [expandedErrorTypes, setExpandedErrorTypes] = useState<Set<TaskValidationErrorType>>(new Set());

  const orphanedTasks = useMemo(() => 
    summary.results.filter(r => r.status === 'orphaned'),
    [summary.results]
  );

  const tasksByErrorType = useMemo(() => {
    const grouped = new Map<TaskValidationErrorType, typeof orphanedTasks>();
    orphanedTasks.forEach(task => {
      const type = task.errorType || 'unknown';
      if (!grouped.has(type)) {
        grouped.set(type, []);
      }
      grouped.get(type)!.push(task);
    });
    return grouped;
  }, [orphanedTasks]);

  const toggleErrorType = (type: TaskValidationErrorType) => {
    setExpandedErrorTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const handleExport = () => {
    if (onExportProblems) {
      onExportProblems();
      return;
    }
    
    const csvContent = exportTaskValidationProblems(summary);
    if (!csvContent) return;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'orphaned-tasks.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const hasProblems = summary.orphanedTasks > 0;
  const allAssigned = summary.totalTasks > 0 && summary.orphanedTasks === 0;

  return (
    <Card data-testid="task-validation-panel">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors" data-testid="task-validation-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {hasProblems ? (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                ) : allAssigned ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  <CardTitle className="text-base">Task-Epic Validation</CardTitle>
                  <CardDescription>
                    {summary.totalTasks} tasks imported, {summary.assignedTasks} assigned to epics
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {hasProblems && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    {summary.orphanedTasks} orphaned
                  </Badge>
                )}
                {allAssigned && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    All assigned
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
            {summary.totalTasks === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No tasks found in import.
              </p>
            ) : allAssigned ? (
              <div className="flex items-center gap-2 py-4 text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">All {summary.totalTasks} tasks are assigned to epics.</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    The following tasks could not be assigned to an epic and need attention:
                  </p>
                  {hasProblems && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleExport}
                      data-testid="export-problems-btn"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Problems
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  {Array.from(tasksByErrorType.entries()).map(([errorType, tasks]) => (
                    <Collapsible 
                      key={errorType}
                      open={expandedErrorTypes.has(errorType)}
                      onOpenChange={() => toggleErrorType(errorType)}
                    >
                      <CollapsibleTrigger asChild>
                        <div 
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                          data-testid={`error-type-${errorType}`}
                        >
                          <div className="flex items-center gap-3">
                            <ErrorTypeIcon type={errorType} />
                            <div>
                              <p className="text-sm font-medium">{ERROR_TYPE_LABELS[errorType]}</p>
                              <p className="text-xs text-muted-foreground">
                                {ERROR_TYPE_DESCRIPTIONS[errorType]}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{tasks.length} tasks</Badge>
                            {expandedErrorTypes.has(errorType) ? (
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
                                <TableHead>Task Title</TableHead>
                                <TableHead>Source Epic Reference</TableHead>
                                <TableHead>Stage</TableHead>
                                <TableHead>Error</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {tasks.map(task => (
                                <TableRow key={task.taskId} data-testid={`orphaned-task-${task.taskId}`}>
                                  <TableCell className="font-medium">
                                    {task.taskTitle}
                                    {task.sourceId && (
                                      <span className="text-xs text-muted-foreground ml-2">
                                        (ID: {task.sourceId})
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {task.sourceEpicId && (
                                      <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded">
                                        ID: {task.sourceEpicId}
                                      </span>
                                    )}
                                    {task.sourceEpicTitle && (
                                      <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded ml-1">
                                        "{task.sourceEpicTitle}"
                                      </span>
                                    )}
                                    {!task.sourceEpicId && !task.sourceEpicTitle && (
                                      <span className="text-xs text-muted-foreground italic">
                                        None provided
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {task.stageName || '-'}
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-xs text-red-600">
                                      {task.errorMessage}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>

                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                  <p className="font-medium">How to fix orphaned tasks:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-blue-700">
                    <li>Add an <code className="bg-blue-100 px-1 rounded">epicId</code> or <code className="bg-blue-100 px-1 rounded">epicName</code> column to your import file</li>
                    <li>Ensure epic IDs/names match exactly with the epics in your import</li>
                    <li>Orphaned tasks will be skipped during project creation</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
