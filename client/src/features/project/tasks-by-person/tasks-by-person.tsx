import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Search, User, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { PersonWorkloadCard } from "./person-workload-card";
import { usePersonWorkload } from "./use-person-workload";
import type { TasksByPersonConfig } from "./types";

interface TasksByPersonProps {
  config: TasksByPersonConfig;
  tasks: any[];
  users: any[];
  epics: any[];
  sprints: any[];
  milestones: any[];
  deliverables: any[];
  isLoading?: boolean;
}

export function TasksByPerson({
  config,
  tasks,
  users,
  epics,
  sprints,
  milestones,
  deliverables,
  isLoading = false,
}: TasksByPersonProps) {
  const [justMyTasks, setJustMyTasks] = useState(config.defaultJustMyTasks);
  const [searchPeople, setSearchPeople] = useState("");

  const workloads = usePersonWorkload({
    tasks,
    users,
    epics,
    sprints,
    milestones,
    deliverables,
    projectId: config.projectId,
    currentUserId: config.currentUserId,
    justMyTasks,
  });

  const filteredWorkloads = useMemo(() => {
    if (!searchPeople) return workloads;
    const search = searchPeople.toLowerCase();
    return workloads.filter(w => 
      w.userName.toLowerCase().includes(search) ||
      w.userRole?.toLowerCase().includes(search)
    );
  }, [workloads, searchPeople]);

  const sprintOptions = sprints
    .filter((s: any) => s.projectId === config.projectId)
    .map((s: any) => ({ id: s.id, name: s.name }));
  
  const milestoneOptions = milestones
    .filter((m: any) => m.projectId === config.projectId)
    .map((m: any) => ({ id: m.id, name: m.name }));
  
  const deliverableOptions = deliverables
    .filter((d: any) => d.projectId === config.projectId)
    .map((d: any) => ({ id: d.id, name: d.name }));

  const totalTasks = workloads.reduce((sum, w) => sum + w.metrics.totalTasks, 0);
  const totalPeople = workloads.length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-10 w-full max-w-xs" />
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="tasks-by-person">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Workload
          </h2>
          <p className="text-sm text-muted-foreground">
            {totalTasks} task{totalTasks !== 1 ? "s" : ""} across {totalPeople} team member{totalPeople !== 1 ? "s" : ""}
          </p>
        </div>

        {config.showJustMyTasksToggle && (
          <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-2">
            <Button
              variant={!justMyTasks ? "secondary" : "ghost"}
              size="sm"
              className="h-8 gap-2"
              onClick={() => setJustMyTasks(false)}
              data-testid="toggle-all-people"
            >
              <Users className="h-4 w-4" />
              All People
            </Button>
            <Button
              variant={justMyTasks ? "secondary" : "ghost"}
              size="sm"
              className="h-8 gap-2"
              onClick={() => setJustMyTasks(true)}
              data-testid="toggle-just-my-tasks"
            >
              <User className="h-4 w-4" />
              Just My Tasks
            </Button>
          </div>
        )}
      </div>

      {!justMyTasks && (
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search team members..."
            className="pl-9 h-9"
            value={searchPeople}
            onChange={(e) => setSearchPeople(e.target.value)}
            data-testid="search-people"
          />
        </div>
      )}

      <ScrollArea className="h-[calc(100vh-400px)] min-h-[400px]">
        <div className="space-y-3 pr-4">
          {filteredWorkloads.length === 0 ? (
            <Card className="p-8 text-center">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchPeople ? "No team members found" : "No assigned tasks"}
              </h3>
              <p className="text-muted-foreground">
                {searchPeople 
                  ? "Try adjusting your search"
                  : justMyTasks 
                    ? "You don't have any tasks assigned in this project"
                    : "No team members have tasks assigned in this project"
                }
              </p>
              {searchPeople && (
                <Button 
                  variant="link" 
                  onClick={() => setSearchPeople("")}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </Card>
          ) : (
            filteredWorkloads.map(person => (
              <PersonWorkloadCard
                key={person.userId}
                person={person}
                projectId={config.projectId}
                defaultExpanded={config.defaultExpanded || (justMyTasks && filteredWorkloads.length === 1)}
                sprints={sprintOptions}
                milestones={milestoneOptions}
                deliverables={deliverableOptions}
                allowInlineEditing={config.allowInlineEditing}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
