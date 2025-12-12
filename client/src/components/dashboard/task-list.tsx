import { useTasks } from "@/hooks/use-nexus-data";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

export function TaskList() {
  const { data: tasks, isLoading, update } = useTasks();

  const handleToggleComplete = (task: any) => {
    const newStatus = task.status === 'Done' ? 'Todo' : 'Done';
    update({ id: task.id, updates: { status: newStatus } });
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm h-full">
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold">My Tasks</CardTitle>
          <Badge variant="secondary" className="rounded-full h-5 w-5 p-0 flex items-center justify-center text-[10px]">{tasks.length}</Badge>
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {tasks.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No tasks yet.
            </div>
          ) : (
            tasks.map((task: any) => (
              <div key={task.id} className="p-4 hover:bg-muted/20 transition-colors flex items-start gap-3 group">
                <Checkbox 
                  id={`task-${task.id}`} 
                  checked={task.status === 'Done'}
                  onCheckedChange={() => handleToggleComplete(task)}
                  className="mt-1 border-muted-foreground/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
                />
                <div className="flex-1 space-y-1">
                  <label 
                    htmlFor={`task-${task.id}`} 
                    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer ${task.status === 'Done' ? 'line-through text-muted-foreground' : ''}`}
                  >
                    {task.title}
                  </label>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{task.project}</span>
                    <span>•</span>
                    <span className={task.deadline === 'Tomorrow' ? 'text-amber-600 font-medium' : ''}>
                      Due: {task.deadline}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className={`
                  text-[10px] px-1.5 py-0 h-5 border-0 font-medium
                  ${task.priority === 'High' ? 'bg-red-50 text-red-600' : 
                    task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 
                    'bg-blue-50 text-blue-600'}
                `}>
                  {task.priority}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
