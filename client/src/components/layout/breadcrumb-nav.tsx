import { RefreshCw, Settings, Grid3x3, Sliders, ChevronRight, Home as HomeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "wouter";
import { PROJECTS } from "@/lib/mock-data";
import { Fragment } from "react";

export function BreadcrumbNav() {
  const [location] = useLocation();
  const pathSegments = location.split("/").filter(Boolean);

  const getBreadcrumbLabel = (segment: string, index: number, allSegments: string[]) => {
    // Handle known static routes
    if (segment === "projects") return "Projects";
    if (segment === "import") return "Import";
    if (segment === "mapping") return "Field Mapping";
    if (segment === "preview") return "Preview & Confirm";
    if (segment === "stages") return "Stages";
    if (segment === "view-settings") return "View Settings";

    // Handle dynamic IDs based on context
    const prevSegment = allSegments[index - 1];

    if (prevSegment === "projects") {
      const project = PROJECTS.find(p => p.id === segment);
      return project ? project.name : "Project";
    }

    if (prevSegment === "import") {
      return "New Session";
    }

    if (prevSegment === "stages") {
      // Mock stage lookup since we don't have global stage state easily accessible here
      // In a real app, this would fetch from a query or store
      const stages = {
        "s1": "Discovery",
        "s2": "Design",
        "s3": "Development",
        "s4": "QA & Testing",
        "s5": "Launch"
      };
      return (stages as any)[segment] || "Stage";
    }

    return segment;
  };

  return (
    <div className="h-12 border-b border-border bg-background flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground overflow-hidden">
        <Link href="/" className="flex items-center hover:text-primary transition-colors">
          <HomeIcon className="h-4 w-4" />
        </Link>
        
        {pathSegments.map((segment, index) => {
          const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
          const isLast = index === pathSegments.length - 1;
          const label = getBreadcrumbLabel(segment, index, pathSegments);

          return (
            <Fragment key={path}>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              {isLast ? (
                <span className="font-medium text-foreground truncate max-w-[200px]">
                  {label}
                </span>
              ) : (
                <Link href={path} className="hover:text-primary transition-colors truncate max-w-[150px]">
                  {label}
                </Link>
              )}
            </Fragment>
          );
        })}
      </div>
      
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground hidden sm:flex">
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
