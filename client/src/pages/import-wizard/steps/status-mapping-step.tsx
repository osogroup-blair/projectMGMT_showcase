import { ParseResult, extractUniqueStatuses, normalizeStatus } from "@/lib/import-parser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";

interface StatusMappingStepProps {
  parseResult: ParseResult | null;
  statusMappings: Record<string, string>;
  onStatusMappingsChange: (mappings: Record<string, string>) => void;
}

const STANDARD_STATUSES = [
  'Backlog',
  'To Do',
  'In Progress',
  'In Review',
  'Blocked',
  'Done',
  'Completed',
  'On Hold',
  'Cancelled',
  'Not Started',
  'Planning',
  'Active'
];

const STATUS_COLORS: Record<string, string> = {
  'Backlog': 'bg-slate-100 text-slate-700',
  'To Do': 'bg-blue-100 text-blue-700',
  'Not Started': 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-amber-100 text-amber-700',
  'Active': 'bg-amber-100 text-amber-700',
  'In Review': 'bg-purple-100 text-purple-700',
  'Blocked': 'bg-red-100 text-red-700',
  'On Hold': 'bg-orange-100 text-orange-700',
  'Done': 'bg-green-100 text-green-700',
  'Completed': 'bg-green-100 text-green-700',
  'Cancelled': 'bg-gray-100 text-gray-700',
  'Planning': 'bg-indigo-100 text-indigo-700'
};

export function StatusMappingStep({
  parseResult,
  statusMappings,
  onStatusMappingsChange
}: StatusMappingStepProps) {
  if (!parseResult) {
    return <div className="text-center text-muted-foreground">No file parsed yet</div>;
  }

  const externalStatuses = extractUniqueStatuses(parseResult.entities);

  const handleStatusMappingChange = (externalStatus: string, systemStatus: string) => {
    onStatusMappingsChange({
      ...statusMappings,
      [externalStatus]: systemStatus
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold">Status Mapping</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {externalStatuses.length > 0 
            ? `Found ${externalStatuses.length} unique status values. Map them to standard Nymbl statuses.`
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
                      const mappedTo = statusMappings[externalStatus] || normalizeStatus(externalStatus);
                      const colorClass = STATUS_COLORS[mappedTo] || 'bg-muted text-muted-foreground';
                      
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
                              options={STANDARD_STATUSES.map(status => ({ value: status, label: status }))}
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
                  {STANDARD_STATUSES.map(status => (
                    <Badge key={status} className={STATUS_COLORS[status] || 'bg-muted'}>
                      {status}
                    </Badge>
                  ))}
                </div>
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
                      {externalStatuses.filter(s => STANDARD_STATUSES.includes(normalizeStatus(s))).length}
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
                    <p className="font-medium">Auto-Normalization</p>
                    <p className="text-xs mt-1 opacity-90">
                      Status values are automatically normalized (e.g., "done" → "Done", "in_progress" → "In Progress")
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
