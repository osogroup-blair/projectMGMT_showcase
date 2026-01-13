import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Plus, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTaskStatuses } from '@/hooks/use-task-statuses';

interface InspectorSubtasksTabProps {
  task: any;
  projectId: string;
  subtasks: any[];
  isLoading: boolean;
  onSubtaskClick: (taskId: string, title: string) => void;
  createSubtask?: (data: any) => void;
}

export function InspectorSubtasksTab({ 
  task, 
  projectId, 
  subtasks, 
  isLoading, 
  onSubtaskClick,
  createSubtask 
}: InspectorSubtasksTabProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const { isCompletedStatus, getStatusColor } = useTaskStatuses();

  const completedCount = subtasks.filter((s) => isCompletedStatus(s.status)).length;
  const progress = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0;

  const handleCreateSubtask = () => {
    if (!newSubtaskName.trim() || !createSubtask) return;
    
    createSubtask({
      name: newSubtaskName.trim(),
      parentId: task.id,
      projectId,
      status: 'Not Started',
    });
    
    setNewSubtaskName('');
    setIsCreating(false);
  };

  const getStatusDotColor = (status: string) => {
    if (isCompletedStatus(status)) return 'bg-green-500';
    return 'bg-gray-300';
  };

  return (
    <div className="h-full flex flex-col">
      {subtasks.length > 0 && (
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {completedCount} of {subtasks.length} completed
            </span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : subtasks.length > 0 ? (
            subtasks.map((subtask) => (
              <button
                key={subtask.id}
                onClick={() => onSubtaskClick(subtask.id, subtask.name)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors text-left group"
                data-testid={`subtask-${subtask.id}`}
              >
                <div className={cn("w-2 h-2 rounded-full flex-shrink-0", getStatusDotColor(subtask.status))} />
                <span className={cn(
                  "flex-1 text-sm truncate",
                  isCompletedStatus(subtask.status) && "line-through text-muted-foreground"
                )}>
                  {subtask.name}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No subtasks yet
            </div>
          )}

          {isCreating ? (
            <div className="flex gap-2 mt-2">
              <Input
                value={newSubtaskName}
                onChange={(e) => setNewSubtaskName(e.target.value)}
                placeholder="Subtask name..."
                className="flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateSubtask();
                  if (e.key === 'Escape') setIsCreating(false);
                }}
                data-testid="new-subtask-input"
              />
              <Button size="sm" onClick={handleCreateSubtask} disabled={!newSubtaskName.trim()}>
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          ) : createSubtask && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground mt-2"
              onClick={() => setIsCreating(true)}
              data-testid="add-subtask-btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add subtask
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
