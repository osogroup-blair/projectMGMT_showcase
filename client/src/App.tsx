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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/projects" component={ProjectsList} />
      <Route path="/projects/import" component={ProjectImport} />
      <Route path="/projects/import/:sessionId/mapping" component={ProjectImportMapping} />
      <Route path="/projects/import/:sessionId/preview" component={ProjectImportPreview} />
      <Route path="/projects/:projectId" component={ProjectOverview} />
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
