import { cn } from "@/lib/utils";
import { LucideIcon, CheckCircle2 } from "lucide-react";
import type { ExportFormat } from "../types";

interface FormatCardProps {
  format: ExportFormat;
  icon: LucideIcon;
  label: string;
  selected: boolean;
  onSelect: (format: ExportFormat) => void;
}

export function FormatCard({ format, icon: Icon, label, selected, onSelect }: FormatCardProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-all hover:bg-muted/50 relative",
        selected ? "bg-primary/5 border-primary ring-1 ring-primary" : "opacity-70"
      )}
      onClick={() => onSelect(format)}
      data-testid={`format-${format}`}
    >
      <Icon className={cn("h-6 w-6 mb-2", selected ? "text-primary" : "text-muted-foreground")} />
      <div className="text-xs font-medium">{label}</div>
      {selected && <CheckCircle2 className="h-4 w-4 text-primary absolute top-2 right-2" />}
    </div>
  );
}
