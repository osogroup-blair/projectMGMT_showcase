import { useState, useEffect } from "react";
import { Shell } from "@/components/layout/shell";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, Save, LayoutTemplate, CheckCircle2, AlertCircle } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Mock Data Types
interface FileColumn {
  name: string;
  sampleValue: string;
}

interface SystemField {
  id: string;
  label: string;
  entity: string;
  required: boolean;
  type: string;
}

// Mock Data
const MOCK_FILE_COLUMNS: FileColumn[] = [
  { name: "Project Name", sampleValue: "Website Redesign 2024" },
  { name: "Client", sampleValue: "Acme Corp" },
  { name: "Start Date", sampleValue: "2024-01-15" },
  { name: "End Date", sampleValue: "2024-06-30" },
  { name: "Budget", sampleValue: "$50,000" },
  { name: "PM Owner", sampleValue: "Sarah Jones" },
  { name: "Status", sampleValue: "In Progress" },
  { name: "Priority", sampleValue: "High" },
];

const MOCK_SYSTEM_FIELDS: SystemField[] = [
  { id: "name", label: "Project Name", entity: "Project", required: true, type: "text" },
  { id: "client_name", label: "Client Name", entity: "Client", required: true, type: "text" },
  { id: "start_date", label: "Start Date", entity: "Project", required: false, type: "date" },
  { id: "end_date", label: "End Date", entity: "Project", required: false, type: "date" },
  { id: "budget", label: "Total Budget", entity: "Project", required: false, type: "currency" },
  { id: "owner_id", label: "Project Owner", entity: "User", required: true, type: "reference" },
  { id: "status", label: "Status", entity: "Project", required: true, type: "enum" },
  { id: "risk_level", label: "Risk Level", entity: "Project", required: false, type: "enum" },
  { id: "description", label: "Description", entity: "Project", required: false, type: "text" },
];

export default function ProjectImportMapping() {
  const [_, params] = useRoute("/projects/import/:sessionId/mapping");
  const [__, setLocation] = useLocation();
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [templateName, setTemplateName] = useState("");
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  // Auto-map fields with exact name matches
  useEffect(() => {
    const initialMappings: Record<string, string> = {};
    MOCK_FILE_COLUMNS.forEach(col => {
      const match = MOCK_SYSTEM_FIELDS.find(
        field => field.label.toLowerCase() === col.name.toLowerCase()
      );
      if (match) {
        initialMappings[col.name] = match.id;
      }
    });
    setMappings(initialMappings);
  }, []);

  const handleDemoMapping = () => {
    // Fill in the remaining unmapped fields for demo purposes
    const demoMappings = { ...mappings };
    demoMappings["Start Date"] = "start_date";
    demoMappings["End Date"] = "end_date";
    demoMappings["Budget"] = "budget";
    demoMappings["PM Owner"] = "owner_id";
    demoMappings["Status"] = "status";
    demoMappings["Priority"] = "risk_level";
    setMappings(demoMappings);
  };

  const handleMappingChange = (columnName: string, fieldId: string) => {
    setMappings(prev => ({ ...prev, [columnName]: fieldId }));
  };

  const getMappedField = (columnName: string) => {
    return MOCK_SYSTEM_FIELDS.find(f => f.id === mappings[columnName]);
  };

  const isRequiredFieldMapped = (fieldId: string) => {
    return Object.values(mappings).includes(fieldId);
  };

  const unmappedRequiredFields = MOCK_SYSTEM_FIELDS.filter(f => f.required && !isRequiredFieldMapped(f.id));

  const handleContinue = () => {
    if (params?.sessionId) {
      setLocation(`/projects/import/${params.sessionId}/preview`);
    }
  };

  return (
    <Shell>
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Map Fields</h1>
            <p className="text-muted-foreground">Match your file columns to the system fields.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" className="text-muted-foreground" onClick={handleDemoMapping}>
              Auto-Map All
            </Button>
            <Button variant="outline" onClick={() => setShowSaveTemplate(!showSaveTemplate)}>
              <LayoutTemplate className="mr-2 h-4 w-4" />
              Save as Template
            </Button>
            <Button onClick={handleContinue} disabled={unmappedRequiredFields.length > 0}>
              Continue to Preview
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {showSaveTemplate && (
          <Card className="bg-muted/30 border-primary/20 animate-in slide-in-from-top-2">
            <CardContent className="pt-6 flex items-end gap-4">
              <div className="grid w-full gap-1.5">
                <Label htmlFor="template-name">Template Name</Label>
                <Input 
                  id="template-name" 
                  placeholder="e.g., Monthly Project Import" 
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
              <Button onClick={() => setShowSaveTemplate(false)}>
                <Save className="mr-2 h-4 w-4" />
                Save Template
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Field Mapping</CardTitle>
                <CardDescription>
                  Map columns from your uploaded file to the corresponding Nymbl fields.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30%]">File Column</TableHead>
                      <TableHead className="w-[30%]">Sample Value</TableHead>
                      <TableHead className="w-[40%]">Target Field</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_FILE_COLUMNS.map((col) => {
                      const mappedField = getMappedField(col.name);
                      return (
                        <TableRow key={col.name} className={mappedField ? "bg-primary/5" : ""}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {mappedField ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                              )}
                              {col.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm font-mono">
                            {col.sampleValue}
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={mappings[col.name] || "ignore"} 
                              onValueChange={(val) => handleMappingChange(col.name, val)}
                            >
                              <SelectTrigger className={cn(
                                "w-full",
                                mappedField ? "border-primary ring-1 ring-primary/20" : ""
                              )}>
                                <SelectValue placeholder="Select field..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ignore" className="text-muted-foreground italic">
                                  -- Ignore Column --
                                </SelectItem>
                                {MOCK_SYSTEM_FIELDS.map((field) => (
                                  <SelectItem key={field.id} value={field.id}>
                                    <span className="flex items-center gap-2">
                                      {field.label}
                                      {field.required && (
                                        <Badge variant="outline" className="text-[10px] py-0 h-4 border-red-200 text-red-600 bg-red-50">
                                          Req
                                        </Badge>
                                      )}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Mapping Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Mapped Fields</span>
                    <span className="font-medium">
                      {Object.keys(mappings).filter(k => mappings[k] !== "ignore").length} / {MOCK_FILE_COLUMNS.length}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500" 
                      style={{ width: `${(Object.keys(mappings).filter(k => mappings[k] !== "ignore").length / MOCK_FILE_COLUMNS.length) * 100}%` }}
                    />
                  </div>
                </div>

                {unmappedRequiredFields.length > 0 ? (
                  <div className="rounded-md bg-red-50 p-4 border border-red-100">
                    <div className="flex items-start gap-2 text-red-700">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">Missing Required Fields</p>
                        <p className="text-xs opacity-90">
                          The following system fields must be mapped before you can continue:
                        </p>
                        <ul className="list-disc list-inside text-xs mt-2 space-y-1">
                          {unmappedRequiredFields.map(f => (
                            <li key={f.id}>{f.label}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md bg-green-50 p-4 border border-green-100">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle2 className="h-4 w-4" />
                      <p className="text-sm font-medium">All required fields mapped</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-muted/10">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• System automatically tries to match columns by name.</p>
                <p>• Required fields are marked with a <span className="text-red-600 font-medium text-xs border border-red-200 bg-red-50 px-1 rounded">Req</span> badge.</p>
                <p>• You can save this mapping configuration as a template for future imports.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  );
}
