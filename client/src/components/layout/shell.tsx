import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { TopNav } from "./top-nav";
import { SubNav } from "./sub-nav";
import { BreadcrumbNav } from "./breadcrumb-nav";

export function Shell({ children, noPadding = false }: { children: React.ReactNode, noPadding?: boolean }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('subnav-collapsed');
    return saved === 'true';
  });

  useEffect(() => {
    const handleCollapseChange = (e: CustomEvent<{ isCollapsed: boolean }>) => {
      setIsCollapsed(e.detail.isCollapsed);
    };
    
    window.addEventListener('subnav-collapse-change', handleCollapseChange as EventListener);
    return () => {
      window.removeEventListener('subnav-collapse-change', handleCollapseChange as EventListener);
    };
  }, []);

  const sidebarWidth = isCollapsed ? "w-14" : "w-48";
  const contentMargin = isCollapsed ? "ml-14" : "ml-48";
  const breadcrumbLeft = isCollapsed ? "left-14" : "left-48";

  return (
    <div className="h-screen overflow-hidden bg-background font-sans">
      {/* Fixed Top Nav - h-16 (64px) */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <TopNav />
      </div>
      
      {/* Fixed Left Sidebar - starts below TopNav (top-16), full height minus header */}
      <div className={cn("fixed top-16 left-0 bottom-0 z-40 transition-all duration-300", sidebarWidth)}>
        <SubNav />
      </div>
      
      {/* Fixed Breadcrumb Nav - h-12 (48px), starts below TopNav, to the right of sidebar */}
      <div className={cn("fixed top-16 right-0 z-40 transition-all duration-300", breadcrumbLeft)}>
        <BreadcrumbNav />
      </div>
      
      {/* Scrollable Content Area - mt-28 = 16 (header) + 12 (breadcrumb) = 112px */}
      <main className={cn("pt-28 h-screen overflow-auto transition-all duration-300", contentMargin)}>
        <div className={cn(noPadding ? "" : "p-6", !noPadding && "space-y-8")}>
          {children}
        </div>
      </main>
    </div>
  );
}
