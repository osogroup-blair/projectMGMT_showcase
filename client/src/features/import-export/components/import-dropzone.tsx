import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileWarning, Loader2, X, AlertCircle, CheckCircle2 } from "lucide-react";
import type { ImportState, ImportPreviewData } from "../types";

interface ImportDropzoneProps {
  importState: ImportState;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImport: () => void;
  onClear: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export function ImportDropzone({ 
  importState, 
  onFileSelect, 
  onImport, 
  onClear,
  fileInputRef 
}: ImportDropzoneProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Import Data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.json,.yaml,.yml"
          onChange={onFileSelect}
          className="hidden"
          data-testid="input-import-file"
        />
        
        {!importState.file && !importState.isProcessing && (
          <div 
            className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
            data-testid="dropzone-import"
          >
            <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-background transition-colors">
              <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-sm font-medium">Upload File</p>
            <p className="text-xs text-muted-foreground mt-1">Supports .xlsx, .json, .yaml</p>
          </div>
        )}

        {importState.isProcessing && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm">Processing file...</span>
          </div>
        )}

        {importState.file && !importState.isProcessing && importState.preview.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileWarning className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium truncate max-w-[150px]">{importState.file.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={onClear} data-testid="button-clear-import">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">New records:</span>
                <span className="text-green-600 font-medium">{importState.totalNew}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Existing (update):</span>
                <span className="text-amber-600 font-medium">{importState.totalExisting}</span>
              </div>
            </div>

            <ScrollArea className="h-[120px]">
              <div className="space-y-1">
                {importState.preview.map((entity, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-muted/50">
                    <span className="font-medium">{entity.entityName}</span>
                    <div className="flex items-center gap-2">
                      {entity.newCount > 0 && (
                        <span className="text-green-600">+{entity.newCount}</span>
                      )}
                      {entity.existingCount > 0 && (
                        <span className="text-amber-600">{entity.existingCount}</span>
                      )}
                      {entity.errors.length > 0 && (
                        <AlertCircle className="h-3 w-3 text-destructive" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {importState.errors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-2">
                <p className="text-xs text-destructive font-medium">Errors:</p>
                <ul className="text-xs text-destructive/80 mt-1 list-disc list-inside">
                  {importState.errors.slice(0, 3).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {importState.errors.length > 3 && (
                    <li>...and {importState.errors.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}

            {importState.isImporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Importing...</span>
                  <span>{importState.importProgress}%</span>
                </div>
                <Progress value={importState.importProgress} />
              </div>
            )}

            <Button 
              className="w-full gap-2" 
              onClick={onImport}
              disabled={importState.isImporting || importState.errors.length > 0}
              data-testid="button-start-import"
            >
              {importState.isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Import {importState.totalNew + importState.totalExisting} Records
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
