import { Sidebar } from "./sidebar";
import { Bell, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex h-14 items-center justify-between border-b bg-background px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-heading font-semibold">Home</h1>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center text-xs text-muted-foreground gap-1.5">
              <RefreshCw className="h-3 w-3" />
              <span>Refresh 1 minute ago</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground mr-4">Good morning, <span className="font-medium text-foreground">Joy!</span></p>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-7xl space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
