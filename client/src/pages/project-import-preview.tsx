import { useState } from "react";
import { Shell } from "@/components/layout/shell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  RefreshCcw,
  MinusCircle,
  FileCheck
} from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Mock Types
interface PreviewRow {
  index: number;
  name: string;
  client: string;
  startDate: string;
  budget: string;
  owner: string;
  status: "new" | "update" | "ignored" | "error";
  errorMessage?: string;
}

interface SummaryStats {
  new: number;
  update: number;
  ignored: number;
  error: number;
}

// Mock Data
const MOCK_PREVIEW_ROWS: PreviewRow[] = [
  { index: 1, name: "Website Redesign 2024", client: "Acme Corp", startDate: "2024-01-15", budget: "$50,000", owner: "Sarah Jones", status: "new" },
  { index: 2, name: "Mobile App Phase 2", client: "Globex", startDate: "2024-02-01", budget: "$120,000", owner: "Mike Smith", status: "update" },
  { index: 3, name: "Internal Audit", client: "prodCo", startDate: "2024-03-10", budget: "$0", owner: "Unknown", status: "error", errorMessage: "Owner not found in system" },
  { index: 4, name: "Q1 Marketing", client: "Stark Ind", startDate: "2024-01-01", budget: "$25,000", owner: "Tony S.", status: "new" },
  { index: 5, name: "Legacy Migration", client: "Initech", startDate: "", budget: "", owner: "", status: "ignored" },
  { index: 6, name: "Cloud Infrastructure", client: "Cyberdyne", startDate: "2024-04-15", budget: "$200,000", owner: "John C.", status: "new" },
  { index: 7, name: "HR Portal", client: "Massive Dynamic", startDate: "2024-05-01", budget: "$75,000", owner: "Walter B.", status: "update" },
  { index: 8, name: "Data Warehouse", client: "Hooli", startDate: "2024-02-20", budget: "$150,000", owner: "Gavin B.", status: "error", errorMessage: "Budget format invalid" },
];

const MOCK_SUMMARY: SummaryStats = {
  new: 15,
  update: 8,
  ignored: 3,
  error: 2
};

export default function ProjectImportPreview() {
  const [_, params] = useRoute("/projects/import/:sessionId/preview");
  const [__, setLocation] = useLocation();
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isImporting, setIsImporting] = useState(false);

  const filteredRows = MOCK_PREVIEW_ROWS.filter(row =>
    filterStatus === "all" || row.status === filterStatus
  );

  const handleImport = () => {
    setIsImporting(true);
    // Simulate API call
    setTimeout(() => {
      setIsImporting(false);
      toast({
        title: "Import Successful",
        description: `Successfully imported ${MOCK_SUMMARY.new + MOCK_SUMMARY.update} records.`,
      });
      setLocation("/projects");
    }, 2000);
  };

  const handleBack = () => {
    if (params?.sessionId) {
      setLocation(`/projects/import/${params.sessionId}/mapping`);
    }
  };

  return (
    <Shell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Preview & Confirm</h1>
            <p className="text-muted-foreground">Review the data before finalizing the import.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBack} disabled={isImporting}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Mapping
            </Button>
            <Button onClick={handleImport} disabled={isImporting || MOCK_SUMMARY.error > 0}>
              {isImporting ? (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <FileCheck className="mr-2 h-4 w-4" />
                  Import & Apply
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-blue-50/50 border-blue-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                <PlusCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-700">{MOCK_SUMMARY.new}</div>
                <div className="text-xs font-medium text-blue-600/80 uppercase tracking-wide">New Records</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-amber-50/50 border-amber-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                <RefreshCcw className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-700">{MOCK_SUMMARY.update}</div>
                <div className="text-xs font-medium text-amber-600/80 uppercase tracking-wide">To Update</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-50/50 border-gray-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-full text-gray-600">
                <MinusCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-700">{MOCK_SUMMARY.ignored}</div>
                <div className="text-xs font-medium text-gray-600/80 uppercase tracking-wide">Ignored</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50/50 border-red-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full text-red-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-700">{MOCK_SUMMARY.error}</div>
                <div className="text-xs font-medium text-red-600/80 uppercase tracking-wide">Errors</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {MOCK_SUMMARY.error > 0 && (
          <div className="rounded-md bg-red-50 p-4 border border-red-100 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-red-800">Please resolve errors before importing</h4>
              <p className="text-sm text-red-700 mt-1">
                There are {MOCK_SUMMARY.error} rows with errors. You can fix them in your source file and re-upload, or go back to mapping if the issue is with field matching.
              </p>
            </div>
          </div>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Preview Data</CardTitle>
            <div className="w-[180px]">
              <SearchableSelect
                value={filterStatus}
                onValueChange={setFilterStatus}
                placeholder="Filter by status"
                triggerClassName="h-8 text-xs"
                options={[
                  { value: "all", label: "All Rows" },
                  { value: "new", label: "New Records" },
                  { value: "update", label: "Updates" },
                  { value: "ignored", label: "Ignored" },
                  { value: "error", label: "Errors" },
                ]}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-[80px]">Row</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.index} className={row.status === 'error' ? 'bg-red-50/30' : ''}>
                    <TableCell className="text-muted-foreground font-mono text-xs">{row.index}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-[10px] font-medium border-0 px-2 py-0.5 rounded-full capitalize",
                        row.status === 'new' && "bg-blue-100 text-blue-700",
                        row.status === 'update' && "bg-amber-100 text-amber-700",
                        row.status === 'ignored' && "bg-gray-100 text-gray-700",
                        row.status === 'error' && "bg-red-100 text-red-700"
                      )}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {row.name}
                      {row.errorMessage && (
                        <div className="text-xs text-red-600 mt-1">{row.errorMessage}</div>
                      )}
                    </TableCell>
                    <TableCell>{row.client}</TableCell>
                    <TableCell>{row.startDate}</TableCell>
                    <TableCell>{row.budget}</TableCell>
                    <TableCell>{row.owner}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
