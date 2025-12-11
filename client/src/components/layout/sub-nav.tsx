import { Home, Layers, Settings, LayoutTemplate, Sliders, Users, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";

const NAV_ITEMS = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Layers, label: "Projects", href: "/projects" },
];

export function SubNav() {
  const [location] = useLocation();

  return (
    <div className="w-48 border-r border-border bg-card flex flex-col justify-between">
      <div className="space-y-1 p-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-9 font-normal text-sm",
                  isActive 
                    ? "bg-secondary text-primary font-medium shadow-xs" 
                    : "text-foreground/70 hover:text-foreground hover:bg-secondary/50"
                )}
                data-testid={`subnav-${item.label.toLowerCase()}`}
              >
                <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border">
        <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Admin
        </div>
        <Link href="/admin/templates">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-9 font-normal text-sm",
              location === "/admin/templates"
                ? "bg-secondary text-primary font-medium shadow-xs" 
                : "text-foreground/70 hover:text-foreground hover:bg-secondary/50"
            )}
            data-testid="subnav-admin-templates"
          >
            <LayoutTemplate className={cn("h-4 w-4", location === "/admin/templates" && "text-primary")} />
            Templates
          </Button>
        </Link>
        <Link href="/admin/defaults">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-9 font-normal text-sm",
              location === "/admin/defaults"
                ? "bg-secondary text-primary font-medium shadow-xs" 
                : "text-foreground/70 hover:text-foreground hover:bg-secondary/50"
            )}
            data-testid="subnav-admin-defaults"
          >
            <Settings className={cn("h-4 w-4", location === "/admin/defaults" && "text-primary")} />
            App Defaults
          </Button>
        </Link>
        <Link href="/admin/users">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-9 font-normal text-sm",
              location === "/admin/users"
                ? "bg-secondary text-primary font-medium shadow-xs" 
                : "text-foreground/70 hover:text-foreground hover:bg-secondary/50"
            )}
            data-testid="subnav-admin-users"
          >
            <Users className={cn("h-4 w-4", location === "/admin/users" && "text-primary")} />
            User Management
          </Button>
        </Link>
        <Link href="/admin/import-export">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-9 font-normal text-sm",
              location === "/admin/import-export"
                ? "bg-secondary text-primary font-medium shadow-xs" 
                : "text-foreground/70 hover:text-foreground hover:bg-secondary/50"
            )}
            data-testid="subnav-admin-import-export"
          >
            <Download className={cn("h-4 w-4", location === "/admin/import-export" && "text-primary")} />
            Import & Export
          </Button>
        </Link>
      </div>
    </div>
  );
}
