import { useState } from "react";
import { Search, SlidersHorizontal, LayoutGrid, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ViewMode = "list" | "card";

interface TabToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  showViewToggle?: boolean;
  filterCount?: number;
  onFilterClick?: () => void;
  showFilter?: boolean;
  className?: string;
}

export function TabToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  viewMode = "list",
  onViewModeChange,
  showViewToggle = true,
  filterCount = 0,
  onFilterClick,
  showFilter = true,
  className,
}: TabToolbarProps) {
  return (
    <div className={cn(
      "sticky top-40 z-20 bg-background py-3 -mx-6 px-6 border-b",
      className
    )}>
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-9"
            data-testid="input-search"
          />
        </div>

        {showFilter && (
          <Button 
            variant="outline" 
            size="sm"
            className="gap-2"
            onClick={onFilterClick}
            data-testid="button-filter"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {filterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {filterCount}
              </Badge>
            )}
          </Button>
        )}

        {showViewToggle && onViewModeChange && (
          <div className="flex items-center rounded-md bg-muted p-0.5">
            <button
              onClick={() => onViewModeChange("list")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded text-sm transition-colors",
                viewMode === "list" 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid="button-view-list"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange("card")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded text-sm transition-colors",
                viewMode === "card" 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid="button-view-card"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
