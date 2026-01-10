import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Calendar,
  ChevronRight,
  Clock,
  ListTodo,
  ArrowUpRight,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Link } from "wouter";

interface Task {
  id: string;
  title: string;
  status: string;
  assigneeId?: string;
  epicId?: string;
  deadline?: string;
  effort?: number;
  priority?: string;
}

interface Sprint {
  id: string;
  name: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

interface User {
  id: string;
  name: string;
}

interface Epic {
  id: string;
  title: string;
}

interface NextSprintBacklogProps {
  projectId: string;
  nextSprint: Sprint | null;
  tasks: Task[];
  users: User[];
  epics: Epic[];
  allTasks: Task[];
}

export function NextSprintBacklog({ 
  projectId, 
  nextSprint, 
  tasks, 
  users, 
  epics,
  allTasks 
}: NextSprintBacklogProps) {
  const backlogTasks = useMemo(() => {
    if (nextSprint) {
      return tasks.filter(t => t.status !== "Done" && t.status !== "Completed");
    }
    return allTasks
      .filter(t => 
        !t.status?.includes("Done") && 
        !t.status?.includes("Completed") &&
        !["Done", "Completed", "Closed"].includes(t.status || "")
      )
      .slice(0, 10);
  }, [nextSprint, tasks, allTasks]);

  const stats = useMemo(() => {
    const total = backlogTasks.length;
    const totalEffort = backlogTasks.reduce((sum, t) => sum + (t.effort || 1), 0);
    const highPriority = backlogTasks.filter(t => 
      t.priority === "High" || t.priority === "Critical"
    ).length;
    
    return { total, totalEffort, highPriority };
  }, [backlogTasks]);

  const getUserName = (userId?: string) => {
    if (!userId) return null;
    return users.find(u => u.id === userId)?.name;
  };

  const getEpicTitle = (epicId?: string) => {
    if (!epicId) return null;
    return epics.find(e => e.id === epicId)?.title;
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "Critical": return "bg-red-100 text-red-700 border-red-200";
      case "High": return "bg-orange-100 text-orange-700 border-orange-200";
      case "Medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Low": return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  if (!nextSprint && backlogTasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <ListTodo className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <h4 className="font-medium text-muted-foreground">No upcoming work</h4>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Plan your next sprint to see the backlog here
          </p>
          <Link href={`/projects/${projectId}/sprints`}>
            <Button variant="outline" size="sm" className="mt-4 gap-2">
              <Calendar className="h-4 w-4" />
              Plan Sprint
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">
            {nextSprint ? "Next Sprint Backlog" : "Upcoming Work"}
          </h3>
          {nextSprint && (
            <Badge variant="outline" className="ml-2">
              {nextSprint.name}
            </Badge>
          )}
        </div>
        {nextSprint && (
          <Link href={`/projects/${projectId}/sprints/${nextSprint.id}`}>
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View Sprint
              <ArrowUpRight className="h-3 w-3" />
            </Button>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <ListTodo className="h-4 w-4" />
          <span>{stats.total} tasks</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{stats.totalEffort} effort pts</span>
        </div>
        {stats.highPriority > 0 && (
          <Badge variant="destructive" className="text-xs">
            {stats.highPriority} high priority
          </Badge>
        )}
        {nextSprint?.startDate && (
          <div className="flex items-center gap-1.5 text-muted-foreground ml-auto">
            <Calendar className="h-4 w-4" />
            <span>Starts {format(parseISO(nextSprint.startDate), "MMM d")}</span>
          </div>
        )}
      </div>

      <ScrollArea className="h-[280px]">
        <div className="space-y-2 pr-4">
          {backlogTasks.map((task) => {
            const userName = getUserName(task.assigneeId);
            const epicTitle = getEpicTitle(task.epicId);
            
            return (
              <Card 
                key={task.id} 
                className="p-3 hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    {epicTitle && (
                      <p className="text-[10px] text-muted-foreground mb-0.5 truncate">
                        {epicTitle}
                      </p>
                    )}
                    <Link href={`/projects/${projectId}/tasks/${task.id}`}>
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {task.title}
                      </p>
                    </Link>
                    <div className="flex items-center gap-2 mt-1.5">
                      {task.priority && (
                        <Badge 
                          variant="outline" 
                          className={cn("text-[10px] px-1.5 py-0", getPriorityColor(task.priority))}
                        >
                          {task.priority}
                        </Badge>
                      )}
                      {task.effort && (
                        <span className="text-[10px] text-muted-foreground">
                          {task.effort} pts
                        </span>
                      )}
                      {task.deadline && (
                        <span className="text-[10px] text-muted-foreground">
                          Due {format(parseISO(task.deadline), "MMM d")}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {userName && (
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-primary/10">
                          {getInitials(userName)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {backlogTasks.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">No tasks in backlog</p>
        </div>
      )}
    </div>
  );
}
