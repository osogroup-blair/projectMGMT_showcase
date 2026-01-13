import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar as CalendarIcon, User, Flag, Target, Layers, Milestone, Play } from 'lucide-react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useUsers, useEpics, useMilestones, useSprints } from '@/hooks/use-nexus-data';
import { useTaskStatuses } from '@/hooks/use-task-statuses';
import type { InspectorOriginContext } from './types';

interface InspectorOverviewTabProps {
  task: any;
  projectId: string;
  updateTask: (data: { id: string; updates: any }) => void;
  originContext: InspectorOriginContext | null;
}

const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'];

export function InspectorOverviewTab({ task, projectId, updateTask, originContext }: InspectorOverviewTabProps) {
  const { data: users } = useUsers();
  const { data: allEpics } = useEpics();
  const { data: allMilestones } = useMilestones();
  const { data: allSprints } = useSprints();
  const { statuses: taskStatuses, getStatusColor } = useTaskStatuses();

  const epics = allEpics?.filter((e: any) => e.projectId === projectId) || [];
  const milestones = allMilestones?.filter((m: any) => m.projectId === projectId) || [];
  const sprints = allSprints?.filter((s: any) => s.projectId === projectId) || [];

  const assignee = users?.find((u: any) => u.id === task.assignedTo);
  const epic = epics.find((e: any) => e.id === task.epicId);
  const milestone = milestones.find((m: any) => m.id === task.milestoneId);
  const sprint = sprints.find((s: any) => s.id === task.sprintId);

  const handleUpdate = (field: string, value: any) => {
    updateTask({ id: task.id, updates: { [field]: value } });
  };

  const isHighlighted = (field: string) => {
    if (!originContext) return false;
    if (originContext.source === 'sprint' && field === 'sprint') return true;
    if (originContext.source === 'epic' && field === 'epic') return true;
    if (originContext.source === 'milestone' && field === 'milestone') return true;
    return false;
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div className={cn("space-y-2", isHighlighted('status') && "ring-2 ring-primary rounded-lg p-2 -m-2")}>
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={task.status} onValueChange={(v) => handleUpdate('status', v)}>
            <SelectTrigger className="h-9" data-testid="inspector-status-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {taskStatuses.map((status: any) => (
                <SelectItem key={status.name} value={status.name}>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", getStatusColor(status.name))} />
                    {status.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Assignee</Label>
          <Select value={task.assignedTo || ''} onValueChange={(v) => handleUpdate('assignedTo', v || null)}>
            <SelectTrigger className="h-9" data-testid="inspector-assignee-select">
              <SelectValue placeholder="Unassigned">
                {assignee && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs">
                        {assignee.firstName?.[0]}{assignee.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    {assignee.firstName} {assignee.lastName}
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
              {users?.map((user: any) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    {user.firstName} {user.lastName}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full h-9 justify-start text-left font-normal", !task.dueDate && "text-muted-foreground")}
                data-testid="inspector-due-date"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {task.dueDate ? format(new Date(task.dueDate), 'PPP') : 'Set due date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={task.dueDate ? new Date(task.dueDate) : undefined}
                onSelect={(date) => handleUpdate('dueDate', date?.toISOString())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Priority</Label>
          <Select value={task.priority || ''} onValueChange={(v) => handleUpdate('priority', v || null)}>
            <SelectTrigger className="h-9" data-testid="inspector-priority-select">
              <SelectValue placeholder="No priority">
                {task.priority && (
                  <div className="flex items-center gap-2">
                    <Flag className={cn("h-3.5 w-3.5", 
                      task.priority === 'High' && "text-red-500",
                      task.priority === 'Medium' && "text-amber-500",
                      task.priority === 'Low' && "text-slate-400"
                    )} />
                    {task.priority}
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No priority</SelectItem>
              {PRIORITY_OPTIONS.map((p) => (
                <SelectItem key={p} value={p}>
                  <div className="flex items-center gap-2">
                    <Flag className={cn("h-3.5 w-3.5", 
                      p === 'High' && "text-red-500",
                      p === 'Medium' && "text-amber-500",
                      p === 'Low' && "text-slate-400"
                    )} />
                    {p}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="pt-2 border-t">
          <Label className="text-xs text-muted-foreground mb-3 block">Timebox Mapping</Label>
          
          <div className={cn("space-y-3", isHighlighted('epic') && "ring-2 ring-primary rounded-lg p-2 -m-2 mb-3")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                Epic
              </div>
              {epic ? (
                <Link 
                  href={`/projects/${projectId}/epics/${epic.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {epic.name}
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground">None</span>
              )}
            </div>
          </div>

          <div className={cn("space-y-3", isHighlighted('sprint') && "ring-2 ring-primary rounded-lg p-2 -m-2 mb-3")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Play className="h-4 w-4" />
                Sprint
              </div>
              {sprint ? (
                <Link 
                  href={`/projects/${projectId}/sprints/${sprint.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {sprint.name}
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground">None</span>
              )}
            </div>
          </div>

          <div className={cn("space-y-3", isHighlighted('milestone') && "ring-2 ring-primary rounded-lg p-2 -m-2")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Milestone className="h-4 w-4" />
                Milestone
              </div>
              {milestone ? (
                <Link 
                  href={`/projects/${projectId}/milestones/${milestone.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {milestone.name}
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground">None</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
