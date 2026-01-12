import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import type { ExportTab } from "../types";

interface TabCardProps {
  value: ExportTab;
  icon: LucideIcon;
  title: string;
  description: string;
  selected: boolean;
  onSelect: (tab: ExportTab) => void;
}

export function TabCard({ value, icon: Icon, title, description, selected, onSelect }: TabCardProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center p-6 border rounded-lg cursor-pointer transition-all hover:bg-muted/50",
        selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
      )}
      onClick={() => onSelect(value)}
      data-testid={`tab-${value}`}
    >
      <Icon className={cn("h-8 w-8 mb-3", selected ? "text-primary" : "text-muted-foreground")} />
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground text-center mt-1">{description}</p>
    </div>
  );
}
