import { Shell } from "@/components/layout/shell";
import { 
  List, 
  Tags,
  Sliders,
  ListChecks,
  Layers,
  Package
} from "lucide-react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  StatusOptionsTab,
  TaskTypesTab,
  EpicTypesTab,
  DeliverableTypesTab,
  TagsTab,
  GeneralTab,
} from "./appdefaults";

interface AdminAppDefaultsProps {
  embedded?: boolean;
}

export default function AdminAppDefaults({ embedded = false }: AdminAppDefaultsProps) {
  const Wrapper = embedded ? ({ children }: { children: React.ReactNode }) => <>{children}</> : Shell;

  return (
    <Wrapper>
      <div className="space-y-8">
        {!embedded && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-primary">App Defaults</h1>
              <p className="text-muted-foreground">Configure global application settings and default options.</p>
            </div>
          </div>
        )}

        <Tabs defaultValue="status" className="w-full">
          <TabsList>
            <TabsTrigger value="status" className="gap-2" data-testid="tab-status-options">
              <List className="h-4 w-4" />
              Status Options
            </TabsTrigger>
            <TabsTrigger value="task-types" className="gap-2" data-testid="tab-task-types">
              <ListChecks className="h-4 w-4" />
              Task Types
            </TabsTrigger>
            <TabsTrigger value="epic-types" className="gap-2" data-testid="tab-epic-types">
              <Layers className="h-4 w-4" />
              Epic Types
            </TabsTrigger>
            <TabsTrigger value="deliverable-types" className="gap-2" data-testid="tab-deliverable-types">
              <Package className="h-4 w-4" />
              Deliverable Types
            </TabsTrigger>
            <TabsTrigger value="tags" className="gap-2" data-testid="tab-tags">
              <Tags className="h-4 w-4" />
              Global Tags
            </TabsTrigger>
            <TabsTrigger value="general" className="gap-2" data-testid="tab-general">
              <Sliders className="h-4 w-4" />
              General
            </TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-8 mt-6">
            <StatusOptionsTab />
          </TabsContent>

          <TabsContent value="task-types" className="mt-6">
            <TaskTypesTab />
          </TabsContent>

          <TabsContent value="epic-types" className="mt-6">
            <EpicTypesTab />
          </TabsContent>

          <TabsContent value="deliverable-types" className="mt-6">
            <DeliverableTypesTab />
          </TabsContent>

          <TabsContent value="tags" className="mt-6">
            <TagsTab />
          </TabsContent>

          <TabsContent value="general" className="mt-6">
            <GeneralTab />
          </TabsContent>
        </Tabs>
      </div>
    </Wrapper>
  );
}
