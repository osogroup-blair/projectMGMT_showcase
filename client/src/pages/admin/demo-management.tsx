import { Shell } from "@/components/layout/shell";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import ProjectsList from "@/pages/projects-list";
import AdminTemplates from "@/pages/admin/templates";
import AdminAppDefaults from "@/pages/admin/app-defaults";
import UserManagement from "@/pages/admin/user-management";
import { LayoutTemplate, Settings, Users, FolderKanban } from "lucide-react";

export default function DemoManagement() {
  return (
    <Shell>
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Demo Management</h1>
            <p className="text-muted-foreground">Centralized administration for the demo environment.</p>
          </div>
        </div>

        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
            <TabsTrigger 
              value="projects" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 flex items-center gap-2"
            >
              <FolderKanban className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger 
              value="templates" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 flex items-center gap-2"
            >
              <LayoutTemplate className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger 
              value="defaults" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              App Defaults
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="projects">
              <ProjectsList disableShell={true} />
            </TabsContent>
            
            <TabsContent value="templates">
              <AdminTemplates disableShell={true} />
            </TabsContent>
            
            <TabsContent value="defaults">
              <AdminAppDefaults disableShell={true} />
            </TabsContent>
            
            <TabsContent value="users">
              <UserManagement disableShell={true} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </Shell>
  );
}
