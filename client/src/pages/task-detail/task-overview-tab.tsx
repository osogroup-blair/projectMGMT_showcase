import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ListTodo, Layers, Package } from "lucide-react";
import { Link } from "wouter";

interface TaskOverviewTabProps {
  task: any;
  projectId: string;
  updateTask: (field: string, value: any) => void;
  epic?: any;
  deliverable?: any;
}

type NavSection = "task" | "epic" | "deliverable";

export function TaskOverviewTab({ task, projectId, updateTask, epic, deliverable }: TaskOverviewTabProps) {
  const [activeSection, setActiveSection] = useState<NavSection>("task");

  const navItems = [
    { id: "task" as NavSection, label: "Task", icon: ListTodo, available: true },
    { id: "epic" as NavSection, label: "Epic", icon: Layers, available: !!epic },
    { id: "deliverable" as NavSection, label: "Deliverable", icon: Package, available: !!deliverable },
  ];

  return (
    <div className="flex gap-6">
      {/* Left Side Nav */}
      <div className="w-40 shrink-0">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => item.available && setActiveSection(item.id)}
                disabled={!item.available}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left",
                  activeSection === item.id
                    ? "bg-primary/10 text-primary font-medium"
                    : item.available
                      ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                      : "text-muted-foreground/50 cursor-not-allowed"
                )}
                data-testid={`nav-${item.id}`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        {activeSection === "task" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold" data-testid="label-description">
                Task Description
              </Label>
              <Textarea 
                className="min-h-[150px] resize-none"
                value={task.description || ""}
                onChange={(e) => updateTask("description", e.target.value)}
                placeholder="Add a more detailed description..."
                data-testid="textarea-task-description"
              />
            </div>
          </div>
        )}

        {activeSection === "epic" && epic && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <h3 className="text-base font-semibold">Epic Context</h3>
              </div>
              <Link 
                href={`/projects/${projectId}/epics/${epic.id}`}
                className="text-sm text-primary hover:underline"
                data-testid="link-view-epic"
              >
                View Epic
              </Link>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg border space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Epic Name</Label>
                <p className="font-medium mt-1">{epic.title}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Description</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {epic.description || "No description provided for this epic."}
                </p>
              </div>
              {epic.status && (
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Status</Label>
                  <p className="text-sm mt-1">{epic.status}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === "deliverable" && deliverable && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <h3 className="text-base font-semibold">Deliverable Context</h3>
              </div>
              <Link 
                href={`/projects/${projectId}/deliverables/${deliverable.id}`}
                className="text-sm text-primary hover:underline"
                data-testid="link-view-deliverable"
              >
                View Deliverable
              </Link>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg border space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Deliverable Name</Label>
                <p className="font-medium mt-1">{deliverable.title}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Description</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {deliverable.description || "No description provided for this deliverable."}
                </p>
              </div>
              {deliverable.status && (
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Status</Label>
                  <p className="text-sm mt-1">{deliverable.status}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
