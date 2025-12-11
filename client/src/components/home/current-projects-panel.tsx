import { HomeTask } from "@/types/home";
import { PROJECTS, TASKS } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Briefcase, ChevronDown, ChevronRight, MoreHorizontal, LayoutGrid, List } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { TaskCard } from "./task-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Helper to map raw Task to HomeTask for the TaskCard
const mapToHomeTask = (task: any): HomeTask => {
  const project = PROJECTS.find(p => p.name === task.project || p.id === task.projectId);
  return {
    id: task.id,
    projectId: project?.id || "unknown",
    projectName: task.project || project?.name || "Unknown Project",
    title: task.title,
    description: task.description,
    status: task.status === "Done" ? "complete" : task.status === "Todo" ? "not_started" : "in_progress",
    assignedToUserId: task.assigneeId || "currentUser",
    dueDateTime: task.deadline, // Simplified
    priority: task.priority?.toLowerCase() || "medium",
    isOverdue: task.status === "Overdue",
    durationBucket: (task.estimateHours || 1) < 2 ? "quick_win" : (task.estimateHours || 1) < 4 ? "medium" : "deep_work",
  };
};

export function CurrentProjectsPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>(["In Progress", "Upcoming", "On Hold"]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Filter Projects
  const filteredProjects = PROJECTS.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter.includes(project.status);
    return matchesSearch && matchesStatus;
  });

  // Group Tasks by Project
  const getProjectTasks = (projectId: string, projectName: string) => {
    return TASKS.filter(t => t.project === projectName || t.projectId === projectId).map(mapToHomeTask);
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    );
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Filter projects..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                <Filter className="h-4 w-4" />
                Status: {statusFilter.length === 3 ? "Active" : statusFilter.length === 0 ? "None" : `${statusFilter.length} selected`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {["Upcoming", "In Progress", "Completed", "On Hold", "Archived", "Overdue"].map(status => (
                <DropdownMenuCheckboxItem 
                  key={status}
                  checked={statusFilter.includes(status)}
                  onCheckedChange={() => toggleStatusFilter(status)}
                >
                  {status}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center border rounded-md p-1 bg-background">
             <Button 
               variant={viewMode === "list" ? "secondary" : "ghost"} 
               size="icon" 
               className="h-8 w-8"
               onClick={() => setViewMode("list")}
             >
               <List className="h-4 w-4" />
             </Button>
             <Button 
               variant={viewMode === "grid" ? "secondary" : "ghost"} 
               size="icon" 
               className="h-8 w-8"
               onClick={() => setViewMode("grid")}
             >
               <LayoutGrid className="h-4 w-4" />
             </Button>
          </div>
        </div>
      </div>

      {/* Projects List */}
      {viewMode === "list" ? (
        <div className="space-y-4">
           {filteredProjects.map(project => {
             const tasks = getProjectTasks(project.id, project.name);
             const progress = project.progress || 0;
             
             return (
               <Card key={project.id} className="overflow-hidden">
                 <Accordion type="single" collapsible>
                   <AccordionItem value="item-1" className="border-b-0">
                     <div className="flex items-center p-4 gap-4">
                        <div className="flex-none">
                           <div className={cn(
                             "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg",
                             project.status === "In Progress" ? "bg-blue-600" :
                             project.status === "Completed" ? "bg-green-600" :
                             "bg-slate-500"
                           )}>
                             {project.name.charAt(0)}
                           </div>
                        </div>
                        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                           <div className="md:col-span-2">
                              <h3 className="font-semibold text-base truncate">{project.name}</h3>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <Badge variant="outline" className={cn(
                                  "font-normal",
                                  project.status === "In Progress" && "bg-blue-50 text-blue-700 border-blue-200",
                                  project.status === "Overdue" && "bg-red-50 text-red-700 border-red-200"
                                )}>
                                  {project.status}
                                </Badge>
                                <span>•</span>
                                <span>Due {project.deadline}</span>
                              </div>
                           </div>
                           
                           <div className="flex flex-col gap-1">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Progress</span>
                                <span>{progress}%</span>
                              </div>
                              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                              </div>
                           </div>

                           <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                              <Briefcase className="w-4 h-4" />
                              {tasks.length} tasks
                           </div>
                        </div>
                        
                        <AccordionTrigger className="w-8 h-8 p-0" />
                     </div>
                     
                     <AccordionContent className="border-t bg-muted/20 p-4">
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {tasks.length > 0 ? (
                            tasks.map(task => (
                              <TaskCard key={task.id} task={task} compact />
                            ))
                          ) : (
                            <div className="col-span-full text-center py-8 text-muted-foreground text-sm">
                              No active tasks in this project.
                            </div>
                          )}
                       </div>
                     </AccordionContent>
                   </AccordionItem>
                 </Accordion>
               </Card>
             );
           })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredProjects.map(project => {
             const tasks = getProjectTasks(project.id, project.name);
             const progress = project.progress || 0;
             
             return (
               <Card key={project.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                 <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                       <div className={cn(
                         "w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg mb-3",
                         project.status === "In Progress" ? "bg-blue-600" :
                         project.status === "Completed" ? "bg-green-600" :
                         "bg-slate-500"
                       )}>
                         {project.name.charAt(0)}
                       </div>
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8">
                             <MoreHorizontal className="h-4 w-4" />
                           </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                           <DropdownMenuItem>View Project</DropdownMenuItem>
                           <DropdownMenuItem>Project Settings</DropdownMenuItem>
                         </DropdownMenuContent>
                       </DropdownMenu>
                    </div>
                    <CardTitle className="text-lg leading-tight">{project.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="font-normal text-xs">
                        {project.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">Due {project.deadline}</span>
                    </div>
                 </CardHeader>
                 <CardContent className="flex-1 flex flex-col gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Completion</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-3">{tasks.length} Active Tasks</p>
                      <div className="space-y-2">
                        {tasks.slice(0, 2).map(task => (
                          <div key={task.id} className="flex items-center gap-2 text-sm">
                             <div className={cn(
                               "w-2 h-2 rounded-full",
                               task.status === "complete" ? "bg-green-500" : "bg-blue-500"
                             )} />
                             <span className="truncate">{task.title}</span>
                          </div>
                        ))}
                        {tasks.length > 2 && (
                          <div className="text-xs text-muted-foreground pl-4">
                            + {tasks.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                 </CardContent>
               </Card>
             );
           })}
        </div>
      )}
    </div>
  );
}
