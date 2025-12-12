import { useProjects } from "@/hooks/use-nexus-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MoreHorizontal, Plus, Loader2 } from "lucide-react";
import { Link } from "wouter";

export function ProjectTable() {
  const { data: projects, isLoading } = useProjects();

  if (isLoading) {
    return (
      <Card className="col-span-1 lg:col-span-2 shadow-sm">
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 lg:col-span-2 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Projects</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs">Filter</Button>
          <Link href="/projects">
            <Button size="sm" className="h-8 text-xs gap-1">
              <Plus className="h-3 w-3" /> Create Project
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="col-span-5">Project Name</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-2">Due Date</div>
            <div className="col-span-2 text-right">Progress</div>
          </div>
          {projects.length === 0 ? (
            <div className="px-6 py-8 text-center text-muted-foreground">
              No projects yet. Create your first project to get started.
            </div>
          ) : (
            projects.map((project: any) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-muted/20 transition-colors group cursor-pointer">
                  <div className="col-span-5 font-medium text-sm flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      project.status === 'In Progress' ? 'bg-blue-500' :
                      project.status === 'Upcoming' ? 'bg-purple-500' :
                      project.status === 'Overdue' ? 'bg-red-500' :
                      'bg-gray-400'
                    }`} />
                    {project.name}
                  </div>
                  <div className="col-span-3">
                    <Badge variant="secondary" className={`
                      font-normal text-xs rounded-md px-2 py-0.5 border-0
                      ${project.status === 'In Progress' ? 'bg-blue-50 text-blue-700' : 
                        project.status === 'Overdue' ? 'bg-red-50 text-red-700' : 
                        project.status === 'Completed' ? 'bg-green-50 text-green-700' :
                        'bg-gray-100 text-gray-700'}
                    `}>
                      {project.status}
                    </Badge>
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {project.deadline}
                  </div>
                  <div className="col-span-2 flex items-center gap-3">
                    <Progress value={project.progress || 0} className="h-1.5 bg-gray-100" />
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
