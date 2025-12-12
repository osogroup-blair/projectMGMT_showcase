import { TopNav } from "./top-nav";
import { SubNav } from "./sub-nav";
import { BreadcrumbNav } from "./breadcrumb-nav";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen overflow-hidden bg-background font-sans">
      {/* Fixed Top Nav - h-16 (64px) */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <TopNav />
      </div>
      
      {/* Fixed Left Sidebar - starts below TopNav (top-16), full height minus header */}
      <div className="fixed top-16 left-0 bottom-0 z-40 w-48">
        <SubNav />
      </div>
      
      {/* Fixed Breadcrumb Nav - h-12 (48px), starts below TopNav, to the right of sidebar */}
      <div className="fixed top-16 left-48 right-0 z-40">
        <BreadcrumbNav />
      </div>
      
      {/* Scrollable Content Area - mt-28 = 16 (header) + 12 (breadcrumb) = 112px */}
      <main className="ml-48 pt-28 h-screen overflow-auto">
        <div className="p-6 mx-auto max-w-7xl space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
