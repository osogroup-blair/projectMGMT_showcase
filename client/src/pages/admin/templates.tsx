import { useState } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  FileBox, 
  Layers, 
  LayoutTemplate, 
  ListTodo, 
  Plus, 
  Search, 
  Settings, 
  Users,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  ChevronRight,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  PROJECT_TEMPLATES,
  DELIVERABLE_TEMPLATES,
  EPIC_TEMPLATES,
  TASK_TEMPLATES,
  STAGE_TEMPLATES,
  ROLE_TEMPLATES
} from "@/lib/mock-data";

export default function AdminTemplates() {
  const [searchQuery, setSearchQuery] = useState("");

  const TemplateCard = ({ title, description, badge, icon: Icon, itemsCount, itemLabel }: any) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>
                <Pencil className="mr-2 h-4 w-4" /> Edit Template
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="mr-2 h-4 w-4" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardTitle className="text-lg mt-3">{title}</CardTitle>
        <CardDescription className="line-clamp-2 mt-1 h-10">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between pt-2 border-t text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="font-medium text-foreground">{itemsCount}</span> {itemLabel}
          </div>
          {badge && (
            <Badge variant="secondary" className="font-normal text-xs">
              {badge}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Shell>
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-primary">Template Management</h1>
              <p className="text-muted-foreground">Manage and configure templates for projects, deliverables, epics, and tasks.</p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          </div>

          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search templates..." 
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6 overflow-x-auto">
            <TabsTrigger 
              value="projects" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 flex items-center gap-2"
            >
              <LayoutTemplate className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger 
              value="stages" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 flex items-center gap-2"
            >
              <Layers className="h-4 w-4" />
              Stages
            </TabsTrigger>
            <TabsTrigger 
              value="deliverables" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Deliverables
            </TabsTrigger>
            <TabsTrigger 
              value="epics" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 flex items-center gap-2"
            >
              <FileBox className="h-4 w-4" />
              Epics
            </TabsTrigger>
            <TabsTrigger 
              value="tasks" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 flex items-center gap-2"
            >
              <ListTodo className="h-4 w-4" />
              Tasks & Roles
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="projects" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {PROJECT_TEMPLATES.map(t => (
                  <TemplateCard 
                    key={t.id}
                    title={t.name}
                    description={t.description}
                    icon={LayoutTemplate}
                    itemsCount={t.defaultStages.length}
                    itemLabel="Stages"
                    badge="Full Stack"
                  />
                ))}
                <Card className="flex flex-col items-center justify-center border-dashed cursor-pointer hover:bg-muted/10 transition-colors min-h-[200px]">
                  <div className="p-4 rounded-full bg-muted text-muted-foreground mb-4">
                    <Plus className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg">Create New Project Template</h3>
                  <p className="text-sm text-muted-foreground mt-1">Define stages, roles, and defaults</p>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="stages" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {STAGE_TEMPLATES.map(t => (
                  <TemplateCard 
                    key={t.id}
                    title={t.name}
                    description={t.description || "Standard stage configuration"}
                    icon={Layers}
                    itemsCount={t.defaultStages?.length || 5}
                    itemLabel="Phases"
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="deliverables" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {DELIVERABLE_TEMPLATES.map(t => (
                  <TemplateCard 
                    key={t.id}
                    title={t.title}
                    description={t.description}
                    icon={Package}
                    itemsCount={t.defaultEpics.length}
                    itemLabel="Default Epics"
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="epics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {EPIC_TEMPLATES.map(t => (
                  <TemplateCard 
                    key={t.id}
                    title={t.title}
                    description={t.description}
                    icon={FileBox}
                    itemsCount={t.defaultTasks.length}
                    itemLabel="Standard Tasks"
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-primary" />
                  Task Templates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {TASK_TEMPLATES.map(t => (
                    <Card key={t.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                          <Badge variant={t.defaultPriority === 'High' ? 'destructive' : 'secondary'} className="text-[10px]">
                            {t.defaultPriority}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <CardTitle className="text-sm font-semibold mt-2">{t.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 text-xs text-muted-foreground">
                        <p className="line-clamp-2 mb-2">{t.description}</p>
                        <div className="flex items-center gap-2 pt-2 border-t mt-2">
                          <span className="font-medium text-foreground">{t.defaultEstimateHours}h</span> est.
                          <span className="ml-auto bg-muted px-1.5 py-0.5 rounded">{t.requiredRole}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Role Templates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ROLE_TEMPLATES.map(t => (
                    <Card key={t.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <CardTitle className="text-base">{t.name}</CardTitle>
                          <Badge variant="outline">{t.defaultRoleType}</Badge>
                        </div>
                        <CardDescription className="text-xs">{t.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xs text-muted-foreground">
                          <strong>Permissions:</strong> {t.defaultPermissions.length} assigned
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </Shell>
  );
}
