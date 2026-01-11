import { useMemo } from "react";
import { ParseResult, extractUniqueStatuses, normalizeStatus } from "@/lib/import-parser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { useStatusOptions } from "@/hooks/use-nexus-data";
import { cn } from "@/lib/utils";

interface StatusMappingStepProps {
  parseResult: ParseResult | null;
  statusMappings: Record<string, string>;
  onStatusMappingsChange: (mappings: Record<string, string>) => void;
}

export function StatusMappingStep({
  parseResult,
  statusMappings,
  onStatusMappingsChange
}: StatusMappingStepProps) {
  const { data: allStatusOptions = [], isLoading: isLoadingStatuses } = useStatusOptions();
  
  const taskStatuses = useMemo(() => {
    return allStatusOptions
      .filter((s: any) => s.type === "task")
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
  }, [allStatusOptions]);

  const statusLabels = useMemo(() => taskStatuses.map((s: any) => s.label), [taskStatuses]);
  
  const statusColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    taskStatuses.forEach((s: any) => {
      map[s.label] = s.color || 'bg-slate-100 text-slate-700';
    });
    return map;
  }, [taskStatuses]);

  if (!parseResult) {
    return <div className="text-center text-muted-foreground">No file parsed yet</div>;
  }

  if (isLoadingStatuses) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading status options...</span>
      </div>
    );
  }

  const externalStatuses = extractUniqueStatuses(parseResult.entities);

  const handleStatusMappingChange = (externalStatus: string, systemStatus: string) => {
    onStatusMappingsChange({
      ...statusMappings,
      [externalStatus]: systemStatus
    });
  };

  const findBestMatch = (externalStatus: string): string => {
    const normalized = normalizeStatus(externalStatus);
    if (statusLabels.includes(normalized)) {
      return normalized;
    }
    const lowerNormalized = normalized.toLowerCase();
    const match = statusLabels.find((label: string) => label.toLowerCase() === lowerNormalized);
    if (match) return match;
    return statusLabels[0] || 'To Do';
  };

  const getAutoMappedCount = () => {
    return externalStatuses.filter(s => {
      const normalized = normalizeStatus(s);
      return statusLabels.some((label: string) => label.toLowerCase() === normalized.toLowerCase());
    }).length;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold">Status Mapping</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {externalStatuses.length > 0 
            ? `Found ${externalStatuses.length} unique status values. Map them to your system's configured statuses.`
            : 'No status values found in the imported data.'
          }
        </p>
      </div>

      {externalStatuses.length === 0 ? (
        <Card className="bg-muted/30">
          <CardContent className="pt-6 text-center">
            <Circle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No status fields found in the import file. You can proceed to the next step.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Map Status Values</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source Status</TableHead>
                      <TableHead></TableHead>
                      <TableHead>Target Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {externalStatuses.map(externalStatus => {
                      const mappedTo = statusMappings[externalStatus] || findBestMatch(externalStatus);
                      const colorClass = statusColorMap[mappedTo] || 'bg-muted text-muted-foreground';
                      
                      return (
                        <TableRow key={externalStatus}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {externalStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <ArrowRight className="h-4 w-4 text-muted-foreground inline" />
                          </TableCell>
                          <TableCell>
                            <SearchableSelect
                              value={mappedTo}
                              onValueChange={(val) => handleStatusMappingChange(externalStatus, val)}
                              placeholder="Select status..."
                              options={taskStatuses.map((status: any) => ({ 
                                value: status.label, 
                                label: status.label 
                              }))}
                              triggerClassName="w-[180px]"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Available Statuses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {taskStatuses.map((status: any) => (
                    <Badge key={status.id} className={cn("font-normal", status.color || 'bg-muted')}>
                      {status.label}
                    </Badge>
                  ))}
                </div>
                {taskStatuses.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No task statuses configured. Configure them in Admin → App Defaults.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unique statuses found</span>
                    <span className="font-medium">{externalStatuses.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Auto-mapped</span>
                    <span className="font-medium text-green-600">
                      {getAutoMappedCount()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50/50 border-blue-100">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2 text-sm text-blue-700">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">System Status Options</p>
                    <p className="text-xs mt-1 opacity-90">
                      Statuses are loaded from your app's configured defaults. Manage them in Admin → App Defaults.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
