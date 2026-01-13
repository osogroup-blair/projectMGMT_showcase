import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Users, Search, User, ClipboardList, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { PersonWorkloadCard } from "./person-workload-card";
import { TeamWorkloadSummary } from "./team-workload-summary";
import { DemandTimeline } from "./demand-timeline";
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
  onCreateTask?: (taskData: NewTaskData) => void;
}

export interface NewTaskData {
  title: string;
  description: string;
  assigneeId: string;
  epicId: string;
  sprintId: string;
  milestoneId: string;
  priority: string;
  status: string;
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
  onCreateTask,
}: TasksByPersonProps) {
  const [justMyTasks, setJustMyTasks] = useState(config.defaultJustMyTasks);
  const [searchPeople, setSearchPeople] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const [newTask, setNewTask] = useState<NewTaskData>({
    title: "",
    description: "",
    assigneeId: "",
    epicId: "",
    sprintId: "",
    milestoneId: "",
    priority: "Medium",
    status: "To Do",
  });

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

  const epicOptions = epics
    .filter((e: any) => e.projectId === config.projectId)
    .map((e: any) => ({ id: e.id, title: e.title, deliverableId: e.deliverableId }));

  const userOptions = users.map((u: any) => ({ 
    id: u.id, 
    name: u.name || u.firstName || "Unknown" 
  }));

  const totalTasks = workloads.reduce((sum, w) => sum + w.metrics.totalTasks, 0);

  const handleCreateTask = () => {
    if (onCreateTask && newTask.title.trim()) {
      onCreateTask(newTask);
      setNewTask({
        title: "",
        description: "",
        assigneeId: "",
        epicId: "",
        sprintId: "",
        milestoneId: "",
        priority: "Medium",
        status: "To Do",
      });
      setCreateDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-[200px]" />
          <Skeleton className="h-9 w-[180px]" />
          <Skeleton className="h-9 w-[100px]" />
        </div>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const projectTasks = tasks.filter((t: any) => t.projectId === config.projectId);

  return (
    <div className="space-y-4" data-testid="tasks-by-person">
      {!justMyTasks && workloads.length > 0 && (
        <>
          <TeamWorkloadSummary workloads={workloads} tasks={projectTasks} />
          <DemandTimeline tasks={projectTasks} users={users} />
        </>
      )}
      
      <div className="flex flex-wrap items-center gap-3">
        {config.showJustMyTasksToggle && (
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <Button
              variant={!justMyTasks ? "secondary" : "ghost"}
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setJustMyTasks(false)}
              data-testid="toggle-all-people"
            >
              <Users className="h-3.5 w-3.5" />
              All People
            </Button>
            <Button
              variant={justMyTasks ? "secondary" : "ghost"}
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setJustMyTasks(true)}
              data-testid="toggle-just-my-tasks"
            >
              <User className="h-3.5 w-3.5" />
              Just Mine
            </Button>
          </div>
        )}

        {!justMyTasks && (
          <div className="relative flex-1 max-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search team..."
              className="pl-8 h-8 text-sm"
              value={searchPeople}
              onChange={(e) => setSearchPeople(e.target.value)}
              data-testid="search-people"
            />
          </div>
        )}

        <Badge variant="outline" className="h-8 px-3 text-xs">
          {totalTasks} task{totalTasks !== 1 ? "s" : ""}
        </Badge>

        <Button
          size="sm"
          className="h-8 gap-1.5 ml-auto"
          onClick={() => setCreateDialogOpen(true)}
          data-testid="button-create-task"
        >
          <Plus className="h-3.5 w-3.5" />
          New Task
        </Button>
      </div>

      <div className="space-y-3">
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

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Fill in the details to create and organize a new task
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Task Title *</Label>
              <Input
                id="task-title"
                placeholder="Enter task title..."
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                data-testid="input-new-task-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                placeholder="Describe the task..."
                className="min-h-[80px]"
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                data-testid="input-new-task-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assignee</Label>
                <Select 
                  value={newTask.assigneeId} 
                  onValueChange={(v) => setNewTask(prev => ({ ...prev, assigneeId: v }))}
                >
                  <SelectTrigger data-testid="select-new-task-assignee">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {userOptions.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select 
                  value={newTask.priority} 
                  onValueChange={(v) => setNewTask(prev => ({ ...prev, priority: v }))}
                >
                  <SelectTrigger data-testid="select-new-task-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Epic</Label>
                <Select 
                  value={newTask.epicId} 
                  onValueChange={(v) => setNewTask(prev => ({ ...prev, epicId: v }))}
                >
                  <SelectTrigger data-testid="select-new-task-epic">
                    <SelectValue placeholder="Select epic" />
                  </SelectTrigger>
                  <SelectContent>
                    {epicOptions.map(epic => (
                      <SelectItem key={epic.id} value={epic.id}>{epic.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sprint</Label>
                <Select 
                  value={newTask.sprintId} 
                  onValueChange={(v) => setNewTask(prev => ({ ...prev, sprintId: v }))}
                >
                  <SelectTrigger data-testid="select-new-task-sprint">
                    <SelectValue placeholder="Select sprint" />
                  </SelectTrigger>
                  <SelectContent>
                    {sprintOptions.map(sprint => (
                      <SelectItem key={sprint.id} value={sprint.id}>{sprint.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Milestone</Label>
                <Select 
                  value={newTask.milestoneId} 
                  onValueChange={(v) => setNewTask(prev => ({ ...prev, milestoneId: v }))}
                >
                  <SelectTrigger data-testid="select-new-task-milestone">
                    <SelectValue placeholder="Select milestone" />
                  </SelectTrigger>
                  <SelectContent>
                    {milestoneOptions.map(milestone => (
                      <SelectItem key={milestone.id} value={milestone.id}>{milestone.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={newTask.status} 
                  onValueChange={(v) => setNewTask(prev => ({ ...prev, status: v }))}
                >
                  <SelectTrigger data-testid="select-new-task-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="To Do">To Do</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTask}
              disabled={!newTask.title.trim()}
              data-testid="button-submit-new-task"
            >
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
