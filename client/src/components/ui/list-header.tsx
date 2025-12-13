import { useState } from "react";
import { Search, Plus, Rows3, LayoutGrid, Columns } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type LayoutVariant = "one-column" | "two-column" | "three-column";

interface ListHeaderProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  newButtonLabel?: string;
  onNewClick?: () => void;
  layoutVariant: LayoutVariant;
  onLayoutChange: (variant: LayoutVariant) => void;
  showLayoutToggle?: boolean;
  showNewButton?: boolean;
  className?: string;
}

export function ListHeader({
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  newButtonLabel = "New",
  onNewClick,
  layoutVariant,
  onLayoutChange,
  showLayoutToggle = true,
  showNewButton = true,
  className
}: ListHeaderProps) {
  return (
    <div className={cn("flex flex-wrap gap-3 items-center", className)}>
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder={searchPlaceholder} 
          className="pl-9"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          data-testid="input-search"
        />
      </div>
      
      {showNewButton && onNewClick && (
        <Button onClick={onNewClick} className="gap-2" data-testid="button-new">
          <Plus className="h-4 w-4" />
          {newButtonLabel}
        </Button>
      )}

      {showLayoutToggle && (
        <div className="flex items-center gap-1 border rounded-md p-0.5 bg-muted/30">
          <Button 
            variant={layoutVariant === "one-column" ? "secondary" : "ghost"} 
            size="sm" 
            className="h-6 w-6 p-0"
            onClick={() => onLayoutChange("one-column")}
            title="List view"
            data-testid="layout-one-column"
          >
            <Rows3 className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant={layoutVariant === "two-column" ? "secondary" : "ghost"} 
            size="sm" 
            className="h-6 w-6 p-0"
            onClick={() => onLayoutChange("two-column")}
            title="Two column grid"
            data-testid="layout-two-column"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant={layoutVariant === "three-column" ? "secondary" : "ghost"} 
            size="sm" 
            className="h-6 w-6 p-0"
            onClick={() => onLayoutChange("three-column")}
            title="Three column grid"
            data-testid="layout-three-column"
          >
            <Columns className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function getGridClassName(layoutVariant: LayoutVariant): string {
  return cn(
    "grid gap-3",
    layoutVariant === "one-column" && "grid-cols-1",
    layoutVariant === "two-column" && "grid-cols-1 md:grid-cols-2",
    layoutVariant === "three-column" && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
  );
}
