import * as React from "react";
import { cn } from "@/lib/utils";

export type ContextType = 
  | "project" 
  | "deliverable" 
  | "epic" 
  | "task" 
  | "stage" 
  | "milestone" 
  | "sprint" 
  | "admin" 
  | "user";

interface ContextPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  contextType: ContextType;
  children: React.ReactNode;
}

const contextColorMap: Record<ContextType, string> = {
  project: "border-l-[hsl(var(--context-project))]",
  deliverable: "border-l-[hsl(var(--context-deliverable))]",
  epic: "border-l-[hsl(var(--context-epic))]",
  task: "border-l-[hsl(var(--context-task))]",
  stage: "border-l-[hsl(var(--context-stage))]",
  milestone: "border-l-[hsl(var(--context-milestone))]",
  sprint: "border-l-[hsl(var(--context-sprint))]",
  admin: "border-l-[hsl(var(--context-admin))]",
  user: "border-l-[hsl(var(--context-user))]",
};

export function ContextPanel({ 
  contextType, 
  children, 
  className,
  ...props 
}: ContextPanelProps) {
  return (
    <div
      className={cn(
        "border-l-[3px] md:border-l-4 rounded-lg bg-card",
        contextColorMap[contextType],
        className
      )}
      data-context-type={contextType}
      {...props}
    >
      {children}
    </div>
  );
}
