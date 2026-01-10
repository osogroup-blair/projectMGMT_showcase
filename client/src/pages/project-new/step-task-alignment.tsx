import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, AlertTriangle, XCircle, ListTodo, Layers, ArrowRight } from 'lucide-react';
import type { WizardDeliverable, WizardStage, WizardTaskDraft, StepProps } from './types';

interface TaskAlignmentStepProps extends StepProps {
  hasImportedTasks: boolean;
}

interface FlatEpic {
  id: string;
  title: string;
  deliverableId: string;
  deliverableTitle: string;
}

export function StepTaskAlignment({ 
  stages, 
  setStages, 
  deliverables,
  hasImportedTasks
}: TaskAlignmentStepProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [bulkAssignEpicId, setBulkAssignEpicId] = useState<string>('');
  
  const allEpics: FlatEpic[] = useMemo(() => {
    const epics: FlatEpic[] = [];
    deliverables.forEach(d => {
      d.epics.forEach(e => {
        epics.push({
          id: e.id,
          title: e.title,
          deliverableId: d.id,
          deliverableTitle: d.title
        });
      });
    });
    return epics;
  }, [deliverables]);
  
  const allTasks = useMemo(() => {
    const tasks: (WizardTaskDraft & { stageName: string; stageIdx: number; taskIdx: number })[] = [];
    stages.forEach((stage, stageIdx) => {
      (stage.tasks || []).forEach((task, taskIdx) => {
        tasks.push({ ...task, stageName: stage.name, stageIdx, taskIdx });
      });
    });
    return tasks;
  }, [stages]);
  
  const mappedTasks = allTasks.filter(t => t.mappingStatus === 'mapped' || t.assignedEpicId);
  const orphanedTasks = allTasks.filter(t => t.mappingStatus === 'orphaned' && !t.assignedEpicId);
  const skippedTasks = allTasks.filter(t => t.mappingStatus === 'skipped');
  
  const hasOrphanedPerEpicTasks = orphanedTasks.some(t => t.scope === 'per_epic');
  
  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };
  
  const selectAllOrphaned = () => {
    const allOrphanedIds = new Set(orphanedTasks.map(t => t.id));
    setSelectedTasks(allOrphanedIds);
  };
  
  const clearSelection = () => {
    setSelectedTasks(new Set());
  };
  
  const assignSelectedToEpic = (epicId: string) => {
    if (!epicId || selectedTasks.size === 0) return;
    
    const epicInfo = allEpics.find(e => e.id === epicId);
    
    setStages(prevStages => {
      return prevStages.map(stage => ({
        ...stage,
        tasks: stage.tasks.map(task => {
          if (selectedTasks.has(task.id)) {
            return {
              ...task,
              assignedEpicId: epicId,
              assignedEpicTitle: epicInfo?.title,
              mappingStatus: 'manual' as const
            };
          }
          return task;
        })
      }));
    });
    
    setSelectedTasks(new Set());
    setBulkAssignEpicId('');
  };
  
  const assignTaskToEpic = (taskId: string, epicId: string) => {
    const epicInfo = allEpics.find(e => e.id === epicId);
    
    setStages(prevStages => {
      return prevStages.map(stage => ({
        ...stage,
        tasks: stage.tasks.map(task => {
          if (task.id === taskId) {
            return {
              ...task,
              assignedEpicId: epicId || undefined,
              assignedEpicTitle: epicInfo?.title,
              mappingStatus: epicId ? 'manual' as const : 'orphaned' as const
            };
          }
          return task;
        })
      }));
    });
  };
  
  const skipTask = (taskId: string) => {
    setStages(prevStages => {
      return prevStages.map(stage => ({
        ...stage,
        tasks: stage.tasks.map(task => {
          if (task.id === taskId) {
            return {
              ...task,
              mappingStatus: 'skipped' as const,
              assignedEpicId: undefined,
              assignedEpicTitle: undefined
            };
          }
          return task;
        })
      }));
    });
  };
  
  const skipSelectedTasks = () => {
    if (selectedTasks.size === 0) return;
    
    setStages(prevStages => {
      return prevStages.map(stage => ({
        ...stage,
        tasks: stage.tasks.map(task => {
          if (selectedTasks.has(task.id)) {
            return {
              ...task,
              mappingStatus: 'skipped' as const,
              assignedEpicId: undefined,
              assignedEpicTitle: undefined
            };
          }
          return task;
        })
      }));
    });
    
    setSelectedTasks(new Set());
  };
  
  if (!hasImportedTasks && allTasks.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>No Tasks to Align</AlertTitle>
            <AlertDescription>
              You don't have any imported tasks that need epic assignment. 
              Tasks will be created in the Stage Configuration step based on your stage templates.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  const epicOptions = allEpics.map(epic => ({
    value: epic.id,
    label: `${epic.title} (${epic.deliverableTitle})`
  }));

  const epicOptionsSimple = allEpics.map(epic => ({
    value: epic.id,
    label: epic.title
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium">{mappedTasks.length}</div>
                <div className="text-sm text-muted-foreground">Mapped</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="font-medium">{orphanedTasks.length}</div>
                <div className="text-sm text-muted-foreground">Need Assignment</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-950/30 rounded-lg">
              <XCircle className="h-5 w-5 text-gray-500" />
              <div>
                <div className="font-medium">{skippedTasks.length}</div>
                <div className="text-sm text-muted-foreground">Skipped</div>
              </div>
            </div>
          </div>
          
          {hasOrphanedPerEpicTasks && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Action Required</AlertTitle>
              <AlertDescription>
                Some tasks with "per_epic" scope don't have an epic assigned. 
                These tasks will not be created unless you assign them to an epic or skip them.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {orphanedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Orphaned Tasks ({orphanedTasks.length})</CardTitle>
                <CardDescription>
                  These tasks need to be assigned to an epic or skipped
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={selectAllOrphaned}>
                  Select All
                </Button>
                {selectedTasks.size > 0 && (
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear ({selectedTasks.size})
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTasks.size > 0 && (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">{selectedTasks.size} selected</span>
                <ArrowRight className="h-4 w-4" />
                <SearchableSelect
                  value={bulkAssignEpicId}
                  onValueChange={setBulkAssignEpicId}
                  placeholder="Select epic..."
                  options={epicOptions}
                  triggerClassName="w-[250px]"
                />
                <Button 
                  size="sm" 
                  onClick={() => assignSelectedToEpic(bulkAssignEpicId)}
                  disabled={!bulkAssignEpicId}
                >
                  Assign
                </Button>
                <Button variant="outline" size="sm" onClick={skipSelectedTasks}>
                  Skip Selected
                </Button>
              </div>
            )}
            
            <Separator />
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {orphanedTasks.map(task => (
                <div 
                  key={task.id} 
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50"
                >
                  <Checkbox 
                    checked={selectedTasks.has(task.id)}
                    onCheckedChange={() => toggleTaskSelection(task.id)}
                    data-testid={`checkbox-task-${task.id}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{task.title}</span>
                      <Badge variant={task.scope === 'per_epic' ? 'default' : 'secondary'} className="text-xs">
                        {task.scope}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      Stage: {task.stageName}
                      {task.sourceEpicTitle && (
                        <span> • Original epic: {task.sourceEpicTitle}</span>
                      )}
                    </div>
                  </div>
                  <SearchableSelect 
                    value={task.assignedEpicId || ''} 
                    onValueChange={(value) => assignTaskToEpic(task.id, value)}
                    placeholder="Assign to epic..."
                    options={epicOptionsSimple}
                    triggerClassName="w-[180px]"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => skipTask(task.id)}
                    data-testid={`button-skip-task-${task.id}`}
                  >
                    Skip
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {mappedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Mapped Tasks ({mappedTasks.length})
            </CardTitle>
            <CardDescription>
              These tasks are properly assigned to epics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {mappedTasks.map(task => {
                const epic = allEpics.find(e => e.id === task.assignedEpicId);
                return (
                  <div 
                    key={task.id} 
                    className="flex items-center gap-3 p-3 bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium truncate">{task.title}</span>
                      <div className="text-sm text-muted-foreground">
                        <span className="text-green-700 dark:text-green-400">
                          → {epic?.title || 'Unknown Epic'}
                        </span>
                        <span className="mx-2">•</span>
                        Stage: {task.stageName}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">{task.scope}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
