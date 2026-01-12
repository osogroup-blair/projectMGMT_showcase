import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Download, 
  FileSpreadsheet, 
  Database,
  Info,
  FileJson,
  FileCode,
  Users,
  LayoutTemplate,
  Settings,
  Briefcase,
  ChevronDown,
  FileText,
  FlaskConical
} from "lucide-react";

import { useExport, useImport } from "./hooks";
import { 
  SampleDataCard, 
  FormatCard,
  TabCard, 
  SchemaPreview, 
  ImportDropzone, 
  ExportOptions 
} from "./components";
import type { AdminImportExportProps } from "./types";

export function ImportExportContainer({ embedded = false }: AdminImportExportProps) {
  const {
    activeTab,
    setActiveTab,
    exportFormat,
    setExportFormat,
    isExporting,
    progress,
    useNestedExport,
    setUseNestedExport,
    availableProjects,
    selectedProjectIds,
    setSelectedProjectIds,
    selectiveExportEnabled,
    setSelectiveExportEnabled,
    handleExport,
    handleDownloadTemplate,
    handleDownloadSchemaReference
  } = useExport();

  const {
    importState,
    fileInputRef,
    handleFileSelect,
    handleImport,
    clearImport
  } = useImport();

  const Wrapper = embedded ? ({ children }: { children: React.ReactNode }) => <>{children}</> : Shell;

  return (
    <Wrapper>
      <div className="space-y-8">
        {!embedded && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-primary">Import & Export</h1>
              <p className="text-muted-foreground">Manage data portability across projects, templates, defaults, and users.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <TabCard value="all" icon={Database} title="Full System" description="Complete data backup of all entities" selected={activeTab === "all"} onSelect={setActiveTab} />
          <TabCard value="projects" icon={Briefcase} title="Projects" description="Project data, tasks, and milestones" selected={activeTab === "projects"} onSelect={setActiveTab} />
          <TabCard value="templates" icon={LayoutTemplate} title="Templates" description="Project, stage, and task templates" selected={activeTab === "templates"} onSelect={setActiveTab} />
          <TabCard value="defaults" icon={Settings} title="App Defaults" description="Global settings and status options" selected={activeTab === "defaults"} onSelect={setActiveTab} />
          <TabCard value="users" icon={Users} title="User Management" description="Users, roles, and assignments" selected={activeTab === "users"} onSelect={setActiveTab} />
          <TabCard value="sample" icon={FlaskConical} title="Sample Data" description="Generate test data for demos" selected={activeTab === "sample"} onSelect={setActiveTab} />
        </div>

        {activeTab === "sample" ? (
          <div className="max-w-2xl">
            <SampleDataCard className="w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Export {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Data</CardTitle>
                  <CardDescription>Select format and configure export options.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Export Format</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <FormatCard format="xlsx" icon={FileSpreadsheet} label="Excel (.xlsx)" selected={exportFormat === "xlsx"} onSelect={setExportFormat} />
                      <FormatCard format="json" icon={FileJson} label="JSON (.json)" selected={exportFormat === "json"} onSelect={setExportFormat} />
                      <FormatCard format="yaml" icon={FileCode} label="YAML (.yaml)" selected={exportFormat === "yaml"} onSelect={setExportFormat} />
                    </div>
                  </div>

                  <ExportOptions
                    activeTab={activeTab}
                    exportFormat={exportFormat}
                    useNestedExport={useNestedExport}
                    setUseNestedExport={setUseNestedExport}
                    selectiveExportEnabled={selectiveExportEnabled}
                    setSelectiveExportEnabled={setSelectiveExportEnabled}
                    availableProjects={availableProjects}
                    selectedProjectIds={selectedProjectIds}
                    setSelectedProjectIds={setSelectedProjectIds}
                  />

                  <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-semibold mb-1">Round-trip Compatible</p>
                      <p>
                        Exported files include ID references and structure allowing them to be re-imported to update existing records or migrate data.
                      </p>
                    </div>
                  </div>

                  {isExporting && (
                    <div className="space-y-2 pt-4">
                      <div className="flex justify-between text-xs">
                        <span>Generating export...</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Download Template
                        <ChevronDown className="h-3 w-3 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => handleDownloadTemplate("xlsx")} className="gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        Excel Template (.xlsx)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadTemplate("json")} className="gap-2">
                        <FileJson className="h-4 w-4" />
                        JSON Template (.json)
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleDownloadSchemaReference} className="gap-2">
                        <FileText className="h-4 w-4" />
                        Schema Reference (.json)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => window.location.href = '/api/export/sql'} 
                      className="gap-2"
                      data-testid="button-export-sql"
                    >
                      <Database className="h-4 w-4" />
                      Export SQL
                    </Button>
                    <Button onClick={handleExport} disabled={isExporting} className="gap-2" data-testid="button-export">
                      {isExporting ? "Exporting..." : (
                        <>
                          <Download className="h-4 w-4" />
                          Export {exportFormat.toUpperCase()}
                        </>
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>

            <div className="space-y-6">
              <SchemaPreview activeTab={activeTab} />
              <ImportDropzone
                importState={importState}
                onFileSelect={handleFileSelect}
                onImport={handleImport}
                onClear={clearImport}
                fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
              />
            </div>
          </div>
        )}
      </div>
    </Wrapper>
  );
}
