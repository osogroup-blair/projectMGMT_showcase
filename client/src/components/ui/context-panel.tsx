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
  project: "border-t-[hsl(var(--context-project))]",
  deliverable: "border-t-[hsl(var(--context-deliverable))]",
  epic: "border-t-[hsl(var(--context-epic))]",
  task: "border-t-[hsl(var(--context-task))]",
  stage: "border-t-[hsl(var(--context-stage))]",
  milestone: "border-t-[hsl(var(--context-milestone))]",
  sprint: "border-t-[hsl(var(--context-sprint))]",
  admin: "border-t-[hsl(var(--context-admin))]",
  user: "border-t-[hsl(var(--context-user))]",
};

const contextGradientMap: Record<ContextType, string> = {
  project: "var(--context-project)",
  deliverable: "var(--context-deliverable)",
  epic: "var(--context-epic)",
  task: "var(--context-task)",
  stage: "var(--context-stage)",
  milestone: "var(--context-milestone)",
  sprint: "var(--context-sprint)",
  admin: "var(--context-admin)",
  user: "var(--context-user)",
};

export function ContextPanel({ 
  contextType, 
  children, 
  className,
  style,
  ...props 
}: ContextPanelProps) {
  const gradientVar = contextGradientMap[contextType];
  
  return (
    <div
      className={cn(
        "relative border-t-[3px] md:border-t-4 rounded-lg bg-card overflow-hidden mt-4",
        contextColorMap[contextType],
        className
      )}
      data-context-type={contextType}
      style={style}
      {...props}
    >
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, hsl(${gradientVar} / 0.25) 0%, hsl(${gradientVar} / 0.1) 15%, transparent 40%)`,
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
