import { useState, useMemo, useEffect } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  Users, 
  LayoutTemplate, 
  Settings, 
  Download,
  KeyRound
} from "lucide-react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { useSearch, useLocation } from "wouter";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ContextPanel } from "@/components/ui/context-panel";

import UserManagementContent from "./user-management";
import AdminTemplatesContent from "./templates";
import AdminAppDefaultsContent from "./app-defaults";
import AdminImportExportContent from "./import-export";
import AdminAuthenticationContent from "./authentication";

const ADMIN_TABS = [
  { id: "users", label: "Users", icon: Users },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "defaults", label: "App Defaults", icon: Settings },
  { id: "auth", label: "Authentication", icon: KeyRound },
  { id: "import-export", label: "Import/Export", icon: Download },
] as const;

type AdminTab = typeof ADMIN_TABS[number]["id"];

const PATH_TO_TAB: Record<string, AdminTab> = {
  "users": "users",
  "templates": "templates",
  "defaults": "defaults",
  "auth": "auth",
  "import-export": "import-export",
};

interface AdminHubProps {
  params?: { section?: string };
}

export default function AdminHub({ params }: AdminHubProps) {
  const searchString = useSearch();
  const [, setLocation] = useLocation();
  const section = params?.section;
  
  const tabFromUrl = useMemo(() => {
    if (section && PATH_TO_TAB[section]) {
      return PATH_TO_TAB[section];
    }
    const queryParams = new URLSearchParams(searchString);
    const tabParam = queryParams.get("tab");
    if (tabParam && PATH_TO_TAB[tabParam]) {
      return PATH_TO_TAB[tabParam];
    }
    return "users";
  }, [searchString, section]);
  
  const [activeTab, setActiveTab] = useState<AdminTab>(tabFromUrl);
  
  useEffect(() => {
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl, activeTab]);
  
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab as AdminTab);
    const target = newTab === "users" ? "/admin" : `/admin/${newTab}`;
    setLocation(target);
  };

  return (
    <AuthGuard requiredRoles={["admin", "manager"]}>
      <Shell>
        <ContextPanel contextType="admin" className="space-y-6 rounded-none">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
            <p className="text-muted-foreground">
              Manage users, templates, and system settings
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full max-w-3xl grid-cols-5">
              {ADMIN_TABS.map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex items-center gap-2"
                  data-testid={`admin-tab-${tab.id}`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="users" className="space-y-6">
              <UserManagementContent embedded />
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <AdminTemplatesContent embedded />
            </TabsContent>

            <TabsContent value="defaults" className="space-y-6">
              <AdminAppDefaultsContent embedded />
            </TabsContent>

            <TabsContent value="auth" className="space-y-6">
              <AdminAuthenticationContent embedded />
            </TabsContent>

            <TabsContent value="import-export" className="space-y-6">
              <AdminImportExportContent embedded />
            </TabsContent>
          </Tabs>
        </ContextPanel>
      </Shell>
    </AuthGuard>
  );
}
