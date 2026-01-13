import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layers, Zap, Flag, Package, CircleDashed } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScopeType } from "./types";

interface ScopeFilterProps {
  value: ScopeType;
  onChange: (scope: ScopeType) => void;
  scopeId?: string;
  onScopeIdChange?: (id: string | undefined) => void;
  allowedScopes?: ScopeType[];
  sprints?: Array<{ id: string; name: string }>;
  milestones?: Array<{ id: string; name: string }>;
  deliverables?: Array<{ id: string; name: string }>;
  hasSprintTasks?: boolean;
  hasMilestoneTasks?: boolean;
  hasDeliverableTasks?: boolean;
  hasUnscopedTasks?: boolean;
}

const scopeConfig: Record<ScopeType, { label: string; icon: typeof Layers }> = {
  all: { label: "All Tasks", icon: Layers },
  sprint: { label: "By Sprint", icon: Zap },
  milestone: { label: "By Milestone", icon: Flag },
  deliverable: { label: "By Deliverable", icon: Package },
  unscoped: { label: "Unscoped", icon: CircleDashed },
};

export function ScopeFilter({
  value,
  onChange,
  scopeId,
  onScopeIdChange,
  allowedScopes = ["all", "sprint", "milestone", "deliverable", "unscoped"],
  sprints = [],
  milestones = [],
  deliverables = [],
  hasSprintTasks = true,
  hasMilestoneTasks = true,
  hasDeliverableTasks = true,
  hasUnscopedTasks = true,
}: ScopeFilterProps) {
  const getScopeItems = () => {
    if (value === "sprint") return sprints;
    if (value === "milestone") return milestones;
    if (value === "deliverable") return deliverables;
    return [];
  };

  const scopeItems = getScopeItems();
  const showScopeDropdown = ["sprint", "milestone", "deliverable"].includes(value) && scopeItems.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
        {allowedScopes.map((scope) => {
          const config = scopeConfig[scope];
          const Icon = config.icon;
          
          const isAllScope = scope === "all";
          const isDisabled = !isAllScope && (
            (scope === "sprint" && !hasSprintTasks) ||
            (scope === "milestone" && !hasMilestoneTasks) ||
            (scope === "deliverable" && !hasDeliverableTasks) ||
            (scope === "unscoped" && !hasUnscopedTasks)
          );

          return (
            <Button
              key={scope}
              variant={value === scope ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "h-7 text-xs gap-1.5",
                isDisabled && "opacity-50"
              )}
              onClick={() => {
                onChange(scope);
                onScopeIdChange?.(undefined);
              }}
              disabled={isDisabled}
              data-testid={`scope-filter-${scope}`}
            >
              <Icon className="h-3.5 w-3.5" />
              {config.label}
            </Button>
          );
        })}
      </div>

      {showScopeDropdown && (
        <Select value={scopeId || "all"} onValueChange={(v) => onScopeIdChange?.(v === "all" ? undefined : v)}>
          <SelectTrigger className="w-[180px] h-8 text-xs" data-testid="scope-id-select">
            <SelectValue placeholder={`Select ${value}`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {value}s</SelectItem>
            {scopeItems.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
