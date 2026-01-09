import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CurrentUserProvider } from "@/context/current-user-context";
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
import MilestoneOverview from "@/pages/milestone-overview";
import TaskBoard from "@/pages/task-board";
import TaskDetail from "@/pages/task-detail";
import ProjectTeam from "@/pages/project-team";
import ProjectRoles from "@/pages/project-roles";
import RoleAssignments from "@/pages/role-assignments";
import UserManagement from "@/pages/admin/user-management";
import SavedViewsGallery from "@/pages/saved-views";
import StageWorkspace from "@/pages/stage-workspace";
import ProjectSettings from "@/pages/project-settings";
import DeliverablesList from "@/pages/deliverables";
import DeliverableDetail from "@/pages/deliverable-detail";
import EpicDetail from "@/pages/epic-detail";
import ProjectExport from "@/pages/project-export";
import ProjectWizard from "@/pages/project-wizard";
import ProjectManagement from "@/pages/project-management";
import SprintList from "@/pages/sprint-list";
import SprintDetail from "@/pages/sprint-detail";
import AdminTemplates from "@/pages/admin/templates";
import StageTemplateDesigner from "@/pages/admin/stage-template-designer";
import AdminAppDefaults from "@/pages/admin/app-defaults";
import AdminImportExport from "@/pages/admin/import-export";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/projects" component={ProjectsList} />
      <Route path="/projects/new" component={ProjectWizard} />
      <Route path="/projects/import" component={ProjectImport} />
      <Route path="/projects/import/:sessionId/mapping" component={ProjectImportMapping} />
      <Route path="/projects/import/:sessionId/preview" component={ProjectImportPreview} />
      <Route path="/projects/:projectId" component={ProjectOverview} />
      <Route path="/projects/:projectId/export" component={ProjectExport} />
      <Route path="/projects/:projectId/settings" component={ProjectSettings} />
      <Route path="/projects/:projectId/management" component={ProjectManagement} />
      <Route path="/projects/:projectId/deliverables" component={DeliverablesList} />
      <Route path="/projects/:projectId/deliverables/:deliverableId" component={DeliverableDetail} />
      <Route path="/projects/:projectId/epics/:epicId" component={EpicDetail} />
      <Route path="/projects/:projectId/stages" component={StageDesigner} />
      <Route path="/projects/:projectId/stages/:stageId" component={StageWorkspace} />
      <Route path="/projects/:projectId/stages/:stageId/view-settings" component={StageViewSettings} />
      <Route path="/projects/:projectId/milestones" component={MilestonesManagement} />
      <Route path="/projects/:projectId/milestones/:milestoneId" component={MilestoneOverview} />
      <Route path="/projects/:projectId/sprints" component={SprintList} />
      <Route path="/projects/:projectId/sprints/:sprintId" component={SprintDetail} />
      <Route path="/projects/:projectId/tasks" component={TaskBoard} />
      <Route path="/projects/:projectId/tasks/:taskId" component={TaskDetail} />
      <Route path="/projects/:projectId/team" component={ProjectTeam} />
      <Route path="/projects/:projectId/roles" component={ProjectRoles} />
      <Route path="/projects/:projectId/roles/:roleId/assignments" component={RoleAssignments} />
      <Route path="/projects/:projectId/views" component={SavedViewsGallery} />
      <Route path="/admin/users" component={UserManagement} />
      <Route path="/admin/templates" component={AdminTemplates} />
      <Route path="/admin/templates/stage/:templateId" component={StageTemplateDesigner} />
      <Route path="/admin/defaults" component={AdminAppDefaults} />
      <Route path="/admin/import-export" component={AdminImportExport} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CurrentUserProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </CurrentUserProvider>
    </QueryClientProvider>
  );
}

export default App;
