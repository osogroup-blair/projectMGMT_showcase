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
        "relative border-l-[3px] md:border-l-4 rounded-lg bg-card overflow-hidden",
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
          background: `linear-gradient(to right, hsl(${gradientVar} / 0.15) 0%, hsl(${gradientVar} / 0.05) 40%, transparent 100%)`,
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
