import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, FileSpreadsheet, FileCode, Loader2 } from "lucide-react";
import { detectFileFormat, FileFormat } from "@/lib/import-parser";

interface UploadStepProps {
  file: File | null;
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
}

const FORMAT_ICONS: Record<FileFormat, React.ReactNode> = {
  json: <FileCode className="h-8 w-8" />,
  excel: <FileSpreadsheet className="h-8 w-8" />,
  csv: <FileSpreadsheet className="h-8 w-8" />,
  yaml: <FileCode className="h-8 w-8" />,
  unknown: <FileText className="h-8 w-8" />
};

const FORMAT_LABELS: Record<FileFormat, string> = {
  json: 'JSON',
  excel: 'Excel',
  csv: 'CSV',
  yaml: 'YAML',
  unknown: 'Unknown'
};

export function UploadStep({ file, onFileSelected, isProcessing }: UploadStepProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelected(e.target.files[0]);
    }
  };

  const detectedFormat = file ? detectFileFormat(file) : null;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold">Upload Your Data File</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Supported formats: JSON, Excel (.xlsx), CSV, and YAML
        </p>
      </div>

      <div
        className={`
          border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer
          ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/20'}
          ${file ? 'bg-primary/5 border-primary' : ''}
          ${isProcessing ? 'pointer-events-none opacity-70' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && document.getElementById('file-upload')?.click()}
        data-testid="file-drop-zone"
      >
        <input
          id="file-upload"
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept=".csv,.xlsx,.xls,.json,.yaml,.yml"
          disabled={isProcessing}
        />
        
        <div className="flex flex-col items-center gap-4">
          {isProcessing ? (
            <>
              <div className="p-4 rounded-full bg-primary/10 text-primary">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Parsing file...</h3>
                <p className="text-sm text-muted-foreground mt-1">Analyzing structure and detecting entities</p>
              </div>
            </>
          ) : file ? (
            <>
              <div className="p-4 rounded-full bg-primary/10 text-primary">
                {FORMAT_ICONS[detectedFormat || 'unknown']}
              </div>
              <div>
                <h3 className="font-semibold text-lg text-primary">{file.name}</h3>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {FORMAT_LABELS[detectedFormat || 'unknown']}
                  </span>
                </div>
              </div>
              <Button variant="link" size="sm" className="text-muted-foreground">
                Click to upload a different file
              </Button>
            </>
          ) : (
            <>
              <div className="p-4 rounded-full bg-muted text-muted-foreground">
                <Upload className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Click or drag file to upload</h3>
                <p className="text-sm text-muted-foreground mt-1">Maximum file size 50MB</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mt-6">
        {(['json', 'excel', 'csv', 'yaml'] as FileFormat[]).map(format => (
          <div key={format} className="flex flex-col items-center p-4 rounded-lg bg-muted/30 text-center">
            <div className="text-muted-foreground mb-2">
              {FORMAT_ICONS[format]}
            </div>
            <span className="text-sm font-medium">{FORMAT_LABELS[format]}</span>
            <span className="text-xs text-muted-foreground mt-1">
              {format === 'json' && 'Structured data'}
              {format === 'excel' && '.xlsx, .xls'}
              {format === 'csv' && 'Comma separated'}
              {format === 'yaml' && '.yaml, .yml'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
