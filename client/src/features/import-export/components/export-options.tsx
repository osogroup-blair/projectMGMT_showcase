import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Filter } from "lucide-react";
import type { ExportFormat, ExportTab } from "../types";

interface ExportOptionsProps {
  activeTab: ExportTab;
  exportFormat: ExportFormat;
  useNestedExport: boolean;
  setUseNestedExport: (value: boolean) => void;
  selectiveExportEnabled: boolean;
  setSelectiveExportEnabled: (value: boolean) => void;
  availableProjects: any[];
  selectedProjectIds: Set<string>;
  setSelectedProjectIds: (ids: Set<string>) => void;
}

export function ExportOptions({
  activeTab,
  exportFormat,
  useNestedExport,
  setUseNestedExport,
  selectiveExportEnabled,
  setSelectiveExportEnabled,
  availableProjects,
  selectedProjectIds,
  setSelectedProjectIds,
}: ExportOptionsProps) {
  const showNestedOption = exportFormat !== "xlsx" && (activeTab === "all" || activeTab === "projects");
  const showSelectiveOption = activeTab === "projects";

  return (
    <div className="space-y-4">
      {showNestedOption && (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
          <div className="space-y-0.5">
            <Label htmlFor="nested-export" className="text-sm font-medium">Hierarchical Structure</Label>
            <p className="text-xs text-muted-foreground">
              Nest deliverables, epics, and tasks within projects
            </p>
          </div>
          <Switch 
            id="nested-export"
            checked={useNestedExport}
            onCheckedChange={setUseNestedExport}
            data-testid="switch-nested-export"
          />
        </div>
      )}

      {showSelectiveOption && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
            <div className="space-y-0.5">
              <Label htmlFor="selective-export" className="text-sm font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Selective Export
              </Label>
              <p className="text-xs text-muted-foreground">
                Export only selected projects with their children
              </p>
            </div>
            <Switch 
              id="selective-export"
              checked={selectiveExportEnabled}
              onCheckedChange={setSelectiveExportEnabled}
              data-testid="switch-selective-export"
            />
          </div>
          
          {selectiveExportEnabled && availableProjects.length > 0 && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Select Projects</Label>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={() => setSelectedProjectIds(new Set(availableProjects.map((p: any) => p.id)))}
                    data-testid="button-select-all-projects"
                  >
                    Select All
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={() => setSelectedProjectIds(new Set())}
                    data-testid="button-deselect-all-projects"
                  >
                    Deselect All
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-[120px]">
                <div className="space-y-2">
                  {availableProjects.map((project: any) => (
                    <div 
                      key={project.id} 
                      className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50"
                    >
                      <Checkbox
                        id={`project-${project.id}`}
                        checked={selectedProjectIds.has(project.id)}
                        onCheckedChange={(checked) => {
                          const newSet = new Set(selectedProjectIds);
                          if (checked) {
                            newSet.add(project.id);
                          } else {
                            newSet.delete(project.id);
                          }
                          setSelectedProjectIds(newSet);
                        }}
                        data-testid={`checkbox-project-${project.id}`}
                      />
                      <label 
                        htmlFor={`project-${project.id}`}
                        className="text-sm font-medium leading-none cursor-pointer flex-1"
                      >
                        {project.name}
                      </label>
                      <span className="text-xs text-muted-foreground">{project.status}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground">
                {selectedProjectIds.size} of {availableProjects.length} projects selected
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
