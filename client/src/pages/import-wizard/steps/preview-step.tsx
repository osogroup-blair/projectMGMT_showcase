import { ImportWizardState } from "../index";
import { transformForImport } from "@/lib/import-parser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertCircle, CheckCircle2, FileText, Database, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PreviewStepProps {
  state: ImportWizardState;
  onImport: () => void;
  isProcessing: boolean;
}

export function PreviewStep({ state, onImport, isProcessing }: PreviewStepProps) {
  if (!state.parseResult) {
    return <div className="text-center text-muted-foreground">No file parsed yet</div>;
  }

  const transformed = transformForImport(
    state.parseResult.entities,
    state.userMappings,
    state.statusMappings,
    state.entityMappings
  );

  const entityCounts = Object.entries(transformed.entities).map(([type, rows]) => ({
    type,
    count: rows.length
  }));

  const totalRecords = entityCounts.reduce((sum, e) => sum + e.count, 0);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold">Review & Import</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Review the data transformation and start the import when ready.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-5 w-5" />
                Import Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {entityCounts.map(({ type, count }) => (
                  <div key={type} className="text-center p-4 rounded-lg bg-muted/30">
                    <div className="text-2xl font-bold text-primary">{count}</div>
                    <div className="text-sm text-muted-foreground">{type}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {transformed.createdEpics.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-5 w-5" />
                  Auto-Generated Epics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-700 mb-3">
                  {transformed.createdEpics.length} "Default Epic" records will be created for tasks that reference deliverables directly.
                </p>
                <div className="flex flex-wrap gap-2">
                  {transformed.createdEpics.map((epic, i) => (
                    <Badge key={i} variant="outline" className="text-amber-700 border-amber-300">
                      {epic.deliverableId.substring(0, 8)}... → Default Epic
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {transformed.warnings.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                  <AlertCircle className="h-5 w-5" />
                  Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-amber-700 space-y-1">
                  {transformed.warnings.slice(0, 10).map((warning, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="shrink-0">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                  {transformed.warnings.length > 10 && (
                    <li className="text-muted-foreground">
                      ... and {transformed.warnings.length - 10} more warnings
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}

          <Accordion type="multiple" className="space-y-2">
            {Object.entries(transformed.entities).map(([entityType, rows]) => (
              <AccordionItem key={entityType} value={entityType} className="border rounded-lg">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{entityType}</span>
                    <Badge variant="secondary">{rows.length} records</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="rounded-md border overflow-auto max-h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          {rows[0] && Object.keys(rows[0]).slice(0, 5).map(key => (
                            <TableHead key={key} className="text-xs whitespace-nowrap">
                              {key}
                            </TableHead>
                          ))}
                          {rows[0] && Object.keys(rows[0]).length > 5 && (
                            <TableHead className="text-xs">...</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.slice(0, 5).map((row, index) => (
                          <TableRow key={index}>
                            {Object.entries(row).slice(0, 5).map(([key, value], colIndex) => (
                              <TableCell key={colIndex} className="text-xs max-w-[150px] truncate">
                                {typeof value === 'object' 
                                  ? JSON.stringify(value).substring(0, 30) + '...'
                                  : String(value ?? '-')
                                }
                              </TableCell>
                            ))}
                            {Object.keys(row).length > 5 && (
                              <TableCell className="text-xs text-muted-foreground">
                                +{Object.keys(row).length - 5}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                        {rows.length > 5 && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-xs text-muted-foreground">
                              ... and {rows.length - 5} more records
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="space-y-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Ready to Import</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source file</span>
                  <span className="font-medium truncate max-w-[150px]">{state.file?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File format</span>
                  <span className="font-medium uppercase">{state.parseResult?.format}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total records</span>
                  <span className="font-medium">{totalRecords}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entity types</span>
                  <span className="font-medium">{entityCounts.length}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={onImport}
                  disabled={isProcessing}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Start Import
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  The import will create records in dependency order. Errors for individual records won't stop the overall import.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
