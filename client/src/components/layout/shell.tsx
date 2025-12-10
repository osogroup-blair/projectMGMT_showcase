import { TopNav } from "./top-nav";
import { SubNav } from "./sub-nav";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      <TopNav />
      <div className="flex flex-1 min-w-0">
        <SubNav />
        <main className="flex-1 overflow-auto">
          <div className="p-6 mx-auto max-w-7xl space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
