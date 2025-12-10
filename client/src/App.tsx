import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";

import ProjectsList from "@/pages/projects-list";

import ProjectImport from "@/pages/project-import";

import ProjectImportMapping from "@/pages/project-import-mapping";

import ProjectImportPreview from "@/pages/project-import-preview";
import ProjectOverview from "@/pages/project-overview";
import StageDesigner from "@/pages/stage-designer";
import StageViewSettings from "@/pages/stage-view-settings";
import MilestonesManagement from "@/pages/milestones-management";
import TaskBoard from "@/pages/task-board";
import TaskDetail from "@/pages/task-detail";
import ProjectTeam from "@/pages/project-team";
import ProjectRoles from "@/pages/project-roles";
import RoleAssignments from "@/pages/role-assignments";
import UserManagement from "@/pages/admin/user-management";
import SavedViewsGallery from "@/pages/saved-views";
import StageWorkspace from "@/pages/stage-workspace";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/projects" component={ProjectsList} />
      <Route path="/projects/import" component={ProjectImport} />
      <Route path="/projects/import/:sessionId/mapping" component={ProjectImportMapping} />
      <Route path="/projects/import/:sessionId/preview" component={ProjectImportPreview} />
      <Route path="/projects/:projectId" component={ProjectOverview} />
      <Route path="/projects/:projectId/stages" component={StageDesigner} />
      <Route path="/projects/:projectId/stages/:stageId" component={StageWorkspace} />
      <Route path="/projects/:projectId/stages/:stageId/view-settings" component={StageViewSettings} />
      <Route path="/projects/:projectId/milestones" component={MilestonesManagement} />
      <Route path="/projects/:projectId/tasks" component={TaskBoard} />
      <Route path="/projects/:projectId/tasks/:taskId" component={TaskDetail} />
      <Route path="/projects/:projectId/team" component={ProjectTeam} />
      <Route path="/projects/:projectId/roles" component={ProjectRoles} />
      <Route path="/projects/:projectId/roles/:roleId/assignments" component={RoleAssignments} />
      <Route path="/projects/:projectId/views" component={SavedViewsGallery} />
      <Route path="/admin/users" component={UserManagement} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
