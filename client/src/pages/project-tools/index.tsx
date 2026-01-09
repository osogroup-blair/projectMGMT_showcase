import { Shell } from "@/components/layout/shell";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { useSearch, useLocation, Link } from "wouter";
import { useMemo, useState, useEffect } from "react";
import { Upload, Download, ArrowLeft, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProjectTools() {
  const searchString = useSearch();
  const [, setLocation] = useLocation();
  
  const tabFromUrl = useMemo(() => {
    const searchParams = new URLSearchParams(searchString);
    return searchParams.get("tab") || "import";
  }, [searchString]);
  
  const [activeTab, setActiveTab] = useState<string>(() => tabFromUrl);
  
  useEffect(() => {
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl, activeTab]);
  
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setLocation(`/project-tools?tab=${newTab}`);
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
              data-testid="tab-import"
            >
              <Upload className="h-4 w-4" />
              Import
            </TabsTrigger>
            <TabsTrigger 
              value="export" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 gap-2"
              data-testid="tab-export"
            >
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="import">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    Import Project Data
                  </CardTitle>
                  <CardDescription>
                    Import project data from Excel or CSV files to create new projects or update existing ones.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Use the import wizard to map your spreadsheet columns to project fields and preview data before importing.
                  </p>
                  <Link href="/projects/import">
                    <Button data-testid="button-start-import">
                      <Upload className="h-4 w-4 mr-2" />
                      Start Import Wizard
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="export">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Export Project Data
                  </CardTitle>
                  <CardDescription>
                    Export project data to Excel, CSV, or other formats for external use or backup.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select a project to export its data including tasks, milestones, deliverables, and more.
                  </p>
                  <Link href="/projects">
                    <Button variant="outline" data-testid="button-select-project">
                      Select a Project to Export
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </Shell>
  );
}
