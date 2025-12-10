import { Home, Layers } from "lucide-react";
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
    <div className="w-48 border-r border-border bg-card">
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
    </div>
  );
}
