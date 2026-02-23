import { ParseResult, PRODCO_SCHEMA } from "@/lib/import-parser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, AlertCircle, FileText, Database } from "lucide-react";

interface SchemaDetectionStepProps {
  parseResult: ParseResult | null;
  entityMappings: Record<string, string>;
  onEntityMappingsChange: (mappings: Record<string, string>) => void;
  projectDefaults: {
    description: string;
    deadline: string;
    startDate: string;
    ownerId: string;
  };
  onProjectDefaultsChange: (defaults: any) => void;
  existingUsers: any[];
}

const ENTITY_TYPES = Object.keys(PRODCO_SCHEMA);

export function SchemaDetectionStep({
  parseResult,
  entityMappings,
  onEntityMappingsChange,
  projectDefaults,
  onProjectDefaultsChange,
  existingUsers
}: SchemaDetectionStepProps) {
  if (!parseResult) {
    return <div className="text-center text-muted-foreground">No file parsed yet</div>;
  }

  const handleEntityTypeChange = (sourceType: string, targetType: string) => {
    onEntityMappingsChange({
      ...entityMappings,
      [sourceType]: targetType
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold">Entity Mapping</h2>
        <p className="text-muted-foreground text-sm mt-1">
          We detected {parseResult.entities.length} data sections. Map them to prodCo entities.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {parseResult.entities.map((entity, index) => (
            <Card key={index}>
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{entity.entityType}</CardTitle>
                      <p className="text-sm text-muted-foreground">{entity.rowCount} records</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <SearchableSelect
                      value={entityMappings[entity.entityType] || entity.entityType}
                      onValueChange={(val) => handleEntityTypeChange(entity.entityType, val)}
                      placeholder="Select entity type..."
                      options={[
                        { value: 'skip', label: '-- Skip this section --' },
                        ...ENTITY_TYPES.map(type => ({ value: type, label: type }))
                      ]}
                      triggerClassName="w-[180px]"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Accordion type="single" collapsible>
                  <AccordionItem value="columns" className="border-0">
                    <AccordionTrigger className="text-sm text-muted-foreground py-2">
                      View columns ({entity.columns.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                              <TableHead className="text-xs">Column</TableHead>
                              <TableHead className="text-xs">Type</TableHead>
                              <TableHead className="text-xs">Sample</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {entity.columns.slice(0, 10).map((col, colIndex) => (
                              <TableRow key={colIndex}>
                                <TableCell className="font-mono text-xs">{col.name}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">
                                    {col.detectedType}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                  {col.sampleValues[0] || '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                            {entity.columns.length > 10 && (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center text-xs text-muted-foreground">
                                  ... and {entity.columns.length - 10} more columns
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Required Defaults</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Default Project Description</Label>
                <Input
                  value={projectDefaults.description}
                  onChange={(e) => onProjectDefaultsChange({ ...projectDefaults, description: e.target.value })}
                  placeholder="Imported project"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Default Start Date</Label>
                <Input
                  type="date"
                  value={projectDefaults.startDate}
                  onChange={(e) => onProjectDefaultsChange({ ...projectDefaults, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Default Deadline</Label>
                <Input
                  type="date"
                  value={projectDefaults.deadline}
                  onChange={(e) => onProjectDefaultsChange({ ...projectDefaults, deadline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Default Owner</Label>
                <SearchableSelect
                  value={projectDefaults.ownerId}
                  onValueChange={(val) => onProjectDefaultsChange({ ...projectDefaults, ownerId: val })}
                  placeholder="Select owner..."
                  options={existingUsers.map((user: any) => ({ value: user.id, label: user.name }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50/50 border-blue-100">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2 text-sm text-blue-700">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Auto-Epic Creation</p>
                  <p className="text-xs mt-1 opacity-90">
                    Tasks linked to deliverables will automatically get a "Default Epic" created for them.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
