import { useState } from "react";
import { 
  Play,
  Square,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PortableKanban } from "@/components/kanban";
import { BlockerReasonDialog } from "@/features/project/sprints/blocker-reason-dialog";
import { PulsePanel } from "@/features/project/sprints/pulse-panel";
import { SprintSignalsBar } from "@/features/project/sprints/sprint-signals-bar";

interface RunTabProps {
  projectId: string;
  sprintId: string;
  sprint: any;
  sprintTasks: any[];
  users: any[];
  pulseUpdates: any[];
  isReadOnly: boolean;
  currentUser: any;
  onTaskMove: (taskId: string, newStatus: string, blockerReason?: string) => void;
  onStartSprint: () => void;
  onCloseSprint: () => void;
  onPostPulse: (data: { didText: string; nextText: string; blockersText: string; referencedTaskIds: string[] }) => void;
  isPostingPulse?: boolean;
}

export function RunTab({
  projectId,
  sprintId,
  sprint,
  sprintTasks,
  users,
  pulseUpdates,
  isReadOnly,
  currentUser,
  onTaskMove,
  onStartSprint,
  onCloseSprint,
  onPostPulse,
  isPostingPulse,
}: RunTabProps) {
  const [signalFilter, setSignalFilter] = useState<"blocked" | "overdue" | "stale" | null>(null);
  const [pulseCollapsed, setPulseCollapsed] = useState(false);
  const [blockerDialogOpen, setBlockerDialogOpen] = useState(false);
  const [pendingBlockerTaskId, setPendingBlockerTaskId] = useState<string | null>(null);

  const handleBlockerRequested = (taskId: string) => {
    setPendingBlockerTaskId(taskId);
    setBlockerDialogOpen(true);
  };

  const handleBlockerConfirm = (reason: string) => {
    if (pendingBlockerTaskId) {
      onTaskMove(pendingBlockerTaskId, "Blocked", reason);
    }
    setBlockerDialogOpen(false);
    setPendingBlockerTaskId(null);
  };

  const handleBlockerCancel = () => {
    setBlockerDialogOpen(false);
    setPendingBlockerTaskId(null);
  };

  if (sprint?.status === "planned") {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Play className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">Sprint not started</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Start the sprint to track progress and manage tasks in real-time.
        </p>
        <Button onClick={onStartSprint} data-testid="button-start-sprint-run">
          <Play className="h-4 w-4 mr-2" />
          Start Sprint
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SprintSignalsBar 
        tasks={sprintTasks}
        activeFilter={signalFilter}
        onFilterChange={setSignalFilter}
      />

      <div className="flex gap-6">
        <div className={cn("flex-1 transition-all", !pulseCollapsed && "pr-[320px]")}>
          <PortableKanban
            tasks={signalFilter ? sprintTasks.filter((t: any) => {
              if (signalFilter === "blocked") return t.blocked;
              if (signalFilter === "overdue") {
                return t.deadline && new Date(t.deadline) < new Date() && t.status !== "Done";
              }
              if (signalFilter === "stale") {
                const lastUpdate = t.updatedAt ? new Date(t.updatedAt) : null;
                if (!lastUpdate) return false;
                const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
                return daysSinceUpdate > 3 && t.status !== "Done";
              }
              return true;
            }) : sprintTasks}
            projectId={projectId}
            onTaskMove={onTaskMove}
            onBlockerRequested={handleBlockerRequested}
            isReadOnly={isReadOnly}
            signalFilter={signalFilter}
          />
        </div>

        <div className={cn(
          "fixed right-0 top-16 bottom-0 w-[320px] bg-background border-l transition-transform z-40",
          pulseCollapsed && "translate-x-full"
        )}>
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium">Sprint Pulse</h3>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setPulseCollapsed(true)}
              data-testid="button-collapse-pulse"
            >
              <PanelRightClose className="h-4 w-4" />
            </Button>
          </div>
          <PulsePanel 
            tasks={sprintTasks}
            users={users}
            pulseUpdates={pulseUpdates}
            currentUserId={currentUser?.id || ""}
            sprintId={sprintId}
            onPostPulse={onPostPulse}
          />
        </div>

        {pulseCollapsed && (
          <Button 
            variant="outline"
            size="icon"
            className="fixed right-4 bottom-4 z-50"
            onClick={() => setPulseCollapsed(false)}
            data-testid="button-expand-pulse"
          >
            <PanelRightOpen className="h-4 w-4" />
          </Button>
        )}
      </div>

      {sprint?.status === "active" && (
        <div className="flex justify-end pt-4 border-t">
          <Button variant="secondary" onClick={onCloseSprint} data-testid="button-close-sprint-run">
            <Square className="h-4 w-4 mr-2" />
            Close Sprint
          </Button>
        </div>
      )}

      <BlockerReasonDialog
        open={blockerDialogOpen}
        onOpenChange={setBlockerDialogOpen}
        taskTitle={sprintTasks.find((t: any) => t.id === pendingBlockerTaskId)?.title}
        onConfirm={handleBlockerConfirm}
        onCancel={handleBlockerCancel}
      />
    </div>
  );
}
