import { useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, X, ArrowLeft, ExternalLink, Layers, MessageSquare, LayoutList, Maximize2, Minimize2 } from 'lucide-react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { useTaskInspector } from '@/context/task-inspector-context';
import { useTasks, useSubtasks } from '@/hooks/use-nexus-data';
import { useTaskStatuses } from '@/hooks/use-task-statuses';
import { WIDTH_PRESETS, InspectorWidthPreset } from './types';
import { InspectorOverviewTab } from './InspectorOverviewTab';
import { InspectorCommentsTab } from './InspectorCommentsTab';
import { InspectorSubtasksTab } from './InspectorSubtasksTab';

export function TaskInspector() {
  const {
    isOpen,
    taskId,
    projectId,
    widthPreset,
    canGoBack,
    originContext,
    closeTaskInspector,
    goBack,
    setWidthPreset,
    navigateToSubtask,
  } = useTaskInspector();

  const contentRef = useRef<HTMLDivElement>(null);
  const { data: allTasks, isLoading: isTasksLoading, update: updateTask } = useTasks();
  const { getStatusColor } = useTaskStatuses();

  const task = allTasks?.find((t: any) => t.id === taskId);
  const { data: subtasks, isLoading: isSubtasksLoading, create: createSubtask } = useSubtasks(taskId || '');

  useEffect(() => {
    if (isOpen && contentRef.current) {
      const firstFocusable = contentRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }
  }, [isOpen, taskId]);

  const getDefaultTab = () => {
    if (originContext?.source === 'sprint') return 'overview';
    if (originContext?.source === 'epic') return 'overview';
    return 'overview';
  };

  const widthOptions: InspectorWidthPreset[] = ['S', 'M', 'L'];

  if (!isOpen) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeTaskInspector()}>
      <SheetContent
        ref={contentRef}
        side="right"
        className="p-0 flex flex-col"
        style={{ width: WIDTH_PRESETS[widthPreset], maxWidth: '90vw' }}
        aria-modal="true"
        role="dialog"
        data-testid="task-inspector"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Task Inspector</SheetTitle>
          <SheetDescription>Quick view and edit task details</SheetDescription>
        </SheetHeader>

        {isTasksLoading || !task ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="border-b p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {canGoBack && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={goBack}
                      data-testid="inspector-back-btn"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <h2 className="font-semibold text-lg truncate" title={task.name}>
                    {task.name}
                  </h2>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", getStatusColor(task.status))}
                  >
                    {task.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={closeTaskInspector}
                    data-testid="inspector-close-btn"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Link 
                  href={`/projects/${projectId}/tasks/${taskId}`}
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  data-testid="inspector-full-details-link"
                >
                  Open full details
                  <ExternalLink className="h-3 w-3" />
                </Link>
                
                <div className="flex items-center gap-1">
                  {widthOptions.map((w) => (
                    <Button
                      key={w}
                      variant={widthPreset === w ? 'default' : 'ghost'}
                      size="sm"
                      className="h-6 w-6 p-0 text-xs"
                      onClick={() => setWidthPreset(w)}
                      data-testid={`inspector-width-${w}`}
                    >
                      {w}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <Tabs defaultValue={getDefaultTab()} className="flex-1 flex flex-col min-h-0">
              <TabsList className="w-full grid grid-cols-3 rounded-none border-b px-4">
                <TabsTrigger value="overview" className="text-xs gap-1.5" data-testid="inspector-tab-overview">
                  <LayoutList className="h-3.5 w-3.5" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="comments" className="text-xs gap-1.5" data-testid="inspector-tab-comments">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Comments
                </TabsTrigger>
                <TabsTrigger value="subtasks" className="text-xs gap-1.5" data-testid="inspector-tab-subtasks">
                  <Layers className="h-3.5 w-3.5" />
                  Subtasks
                  {subtasks && subtasks.length > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {subtasks.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="overview" className="h-full m-0 p-0">
                  <InspectorOverviewTab 
                    task={task} 
                    projectId={projectId!}
                    updateTask={updateTask}
                    originContext={originContext}
                  />
                </TabsContent>
                <TabsContent value="comments" className="h-full m-0 p-0">
                  <InspectorCommentsTab 
                    task={task}
                    projectId={projectId!}
                  />
                </TabsContent>
                <TabsContent value="subtasks" className="h-full m-0 p-0">
                  <InspectorSubtasksTab
                    task={task}
                    projectId={projectId!}
                    subtasks={subtasks || []}
                    isLoading={isSubtasksLoading}
                    onSubtaskClick={navigateToSubtask}
                    createSubtask={createSubtask}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
