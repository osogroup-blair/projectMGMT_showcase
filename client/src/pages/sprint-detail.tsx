import { useState, useCallback } from "react";
import { Shell } from "@/components/layout/shell";
import { Loader2 } from "lucide-react";
import { useRoute, useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrentUser } from "@/context/current-user-context";

import {
  useSprintData,
  useSprintActions,
  SprintHeader,
  AddTasksDialog,
  CreateTaskDialog,
  BulkEditDialog,
  PlanTab,
  RunTab,
  SettingsTab,
} from "@/features/sprints/detail";

export default function SprintDetailPage() {
  const [, params] = useRoute("/projects/:projectId/sprints/:sprintId");
  const [, setLocation] = useLocation();
  const projectId = params?.projectId || "";
  const sprintId = params?.sprintId || "";

  const [activeTab, setActiveTab] = useState<"plan" | "run" | "settings">("plan");
  const [showAddTasksDialog, setShowAddTasksDialog] = useState(false);
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const sprintData = useSprintData(projectId, sprintId);
  const { currentUser } = useCurrentUser();

  const createTaskAsync = useCallback(async (task: any) => {
    return new Promise<any>((resolve, reject) => {
      sprintData.createTask(task, {
        onSuccess: (data: any) => resolve(data),
        onError: (error: any) => reject(error),
      });
    });
  }, [sprintData.createTask]);

  const sprintActions = useSprintActions({
    sprintId,
    projectId,
    sprint: sprintData.sprint,
    projectSprints: sprintData.projectSprints,
    updateSprint: sprintData.updateSprint,
    deleteSprint: sprintData.deleteSprint,
    updateTask: sprintData.updateTask,
    createTask: createTaskAsync,
    taskTypes: sprintData.taskTypes || [],
    setLocation,
  });

  if (!sprintData.sprint) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    );
  }

  const ownerUser = sprintData.getUser(sprintData.sprint.ownerUserId);

  return (
    <Shell>
      <div className="space-y-6">
        <SprintHeader
          sprint={sprintData.sprint}
          stats={sprintData.stats}
          linkedEpics={sprintData.linkedEpics}
          linkedMilestones={sprintData.linkedMilestones}
          projectId={projectId}
          isReadOnly={sprintData.isReadOnly}
          ownerUser={ownerUser}
          onSaveName={sprintActions.handleSaveName}
          onSaveGoal={sprintActions.handleSaveGoal}
          onSaveDates={sprintActions.handleSaveDates}
          onSaveCapacity={sprintActions.handleSaveCapacity}
          onStartSprint={sprintActions.handleStartSprint}
          onCloseSprint={sprintActions.handleCloseSprint}
        />

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "plan" | "run" | "settings")}>
          <TabsList>
            <TabsTrigger value="plan" data-testid="tab-plan">Plan</TabsTrigger>
            <TabsTrigger value="run" data-testid="tab-run">Run</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="plan" className="mt-6">
            <PlanTab
              projectId={projectId}
              sprintId={sprintId}
              sprint={sprintData.sprint}
              sprintTasks={sprintData.sprintTasks}
              projectTasks={sprintData.projectTasks}
              projectEpics={sprintData.projectEpics}
              projectMilestones={sprintData.projectMilestones}
              projectStages={sprintData.projectStages}
              sprintTaskIds={sprintData.sprintTaskIds}
              stats={sprintData.stats}
              users={sprintData.users || []}
              formattedStatusOptions={sprintData.formattedStatusOptions}
              taskTypes={sprintData.taskTypes || []}
              isReadOnly={sprintData.isReadOnly}
              getUser={sprintData.getUser}
              getEpic={sprintData.getEpic}
              updateTask={sprintData.updateTask}
              onRemoveTask={sprintActions.handleRemoveTask}
              onShowAddTasks={() => setShowAddTasksDialog(true)}
            />
          </TabsContent>

          <TabsContent value="run" className="mt-6">
            <RunTab
              projectId={projectId}
              sprintId={sprintId}
              sprint={sprintData.sprint}
              sprintTasks={sprintData.sprintTasks}
              users={sprintData.users || []}
              pulseUpdates={sprintData.pulseUpdates}
              isReadOnly={sprintData.isReadOnly}
              currentUser={currentUser}
              onTaskMove={sprintActions.handleTaskMove}
              onStartSprint={sprintActions.handleStartSprint}
              onCloseSprint={sprintActions.handleCloseSprint}
              onPostPulse={(data) => sprintActions.postPulseMutation.mutate(data)}
              isPostingPulse={sprintActions.postPulseMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <SettingsTab
              sprint={sprintData.sprint}
              ownerUser={sprintData.getUser(sprintData.sprint?.ownerUserId)}
              isReadOnly={sprintData.isReadOnly}
              onSaveDates={sprintActions.handleSaveDates}
              onSaveCapacity={sprintActions.handleSaveCapacity}
              onAutoStartToggle={sprintActions.handleAutoStartToggle}
              onStartSprint={sprintActions.handleStartSprint}
              onCloseSprint={sprintActions.handleCloseSprint}
              onDeleteSprint={sprintActions.handleDeleteSprint}
              onNotesChange={sprintActions.handleNotesChange}
            />
          </TabsContent>
        </Tabs>
      </div>

      <AddTasksDialog
        open={showAddTasksDialog}
        onOpenChange={setShowAddTasksDialog}
        backlogTasks={sprintData.backlogTasks}
        onAddTasks={sprintActions.handleAddTasks}
        onCreateNew={() => {
          setShowAddTasksDialog(false);
          setShowCreateTaskDialog(true);
        }}
      />

      <CreateTaskDialog
        open={showCreateTaskDialog}
        onOpenChange={setShowCreateTaskDialog}
        projectEpics={sprintData.projectEpics}
        projectStages={sprintData.projectStages}
        onCreateTask={sprintActions.handleCreateNewTask}
      />

      <BulkEditDialog
        open={showBulkEditDialog}
        onOpenChange={setShowBulkEditDialog}
        selectedCount={selectedTaskIds.length}
        statusOptions={sprintData.formattedStatusOptions}
        users={sprintData.users || []}
        onApply={(field, value) => {
          selectedTaskIds.forEach((taskId) => {
            sprintData.updateTask({ id: taskId, updates: { [field]: value } });
          });
          setSelectedTaskIds([]);
          setShowBulkEditDialog(false);
        }}
      />
    </Shell>
  );
}
