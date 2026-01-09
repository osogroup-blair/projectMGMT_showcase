import { Shell } from "@/components/layout/shell";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { useRoute, useSearch, useLocation } from "wouter";
import { useMemo, useState, useEffect } from "react";
import { Upload, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

import ProjectImport from "@/pages/project-import";
import ProjectExport from "@/pages/project-export";

export default function ProjectTools() {
  const [match, params] = useRoute("/project-tools/:tab?");
  const searchString = useSearch();
  const [, setLocation] = useLocation();
  
  const tabFromUrl = useMemo(() => {
    if (params?.tab) return params.tab;
    const searchParams = new URLSearchParams(searchString);
    return searchParams.get("tab") || "import";
  }, [params?.tab, searchString]);
  
  const [activeTab, setActiveTab] = useState<string>(() => tabFromUrl);
  
  useEffect(() => {
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl, activeTab]);
  
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setLocation(`/project-tools/${newTab}`);
  };

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/projects">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Project Tools</h1>
              <p className="text-muted-foreground">Import and export project data</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
            <TabsTrigger 
              value="import" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 gap-2"
            >
              <Upload className="h-4 w-4" />
              Import
            </TabsTrigger>
            <TabsTrigger 
              value="export" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="import">
              <ProjectImportContent />
            </TabsContent>
            <TabsContent value="export">
              <ProjectExportContent />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </Shell>
  );
}

function ProjectImportContent() {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Import project data from Excel or CSV files.
      </p>
      <Link href="/projects/import">
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Start Import Wizard
        </Button>
      </Link>
    </div>
  );
}

function ProjectExportContent() {
  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Export project data to various formats.
      </p>
      <Link href="/projects">
        <Button variant="outline">
          Select a Project to Export
        </Button>
      </Link>
    </div>
  );
}
