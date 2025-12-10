import { RefreshCw, Settings, Grid3x3, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BreadcrumbNav() {
  return (
    <div className="h-12 border-b border-border bg-background flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Home</span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh 1 minute ago</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" data-testid="button-view-option-1">
            <Grid3x3 className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" data-testid="button-view-option-2">
            <Sliders className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" data-testid="button-customize">
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        <Button size="sm" className="h-7 text-xs gap-1.5" data-testid="button-customize-main">
          Customize
        </Button>
      </div>
    </div>
  );
}
