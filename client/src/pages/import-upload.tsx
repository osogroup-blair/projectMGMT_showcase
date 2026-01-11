import { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Upload, FileUp, ArrowRight, X, AlertCircle, FileJson, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useImport } from '@/context/import-context';
import { parseFile, detectFileFormat, type FileFormat } from '@/lib/import-parser';
import { useUsers, useStatusOptions } from '@/hooks/use-nexus-data';
import { useAllUserIdentities } from '@/features/user-management';
import type { ImportAdapterOptions, SystemUser, SystemUserIdentity, SystemStatus } from '@/lib/import-to-wizard-adapter';

const formatIcons: Record<FileFormat, typeof FileJson> = {
  json: FileJson,
  excel: FileSpreadsheet,
  csv: FileSpreadsheet,
  yaml: FileText,
  unknown: FileText
};

const formatLabels: Record<FileFormat, string> = {
  json: 'JSON',
  excel: 'Excel',
  csv: 'CSV',
  yaml: 'YAML',
  unknown: 'Unknown'
};

export default function ImportUpload() {
  const [, setLocation] = useLocation();
  const { initializeFromFile } = useImport();
  
  const { data: usersData } = useUsers();
  const { data: allIdentities } = useAllUserIdentities();
  const { data: statusOptionsData } = useStatusOptions();
  
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<FileFormat | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setError(null);
    const detectedFormat = detectFileFormat(selectedFile);
    
    if (detectedFormat === 'unknown') {
      setError('Unsupported file format. Please upload a JSON, Excel (.xlsx), CSV, or YAML file.');
      return;
    }
    
    setFile(selectedFile);
    setFormat(detectedFormat);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  const handleContinue = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setProgress(10);
    setError(null);
    
    try {
      setProgress(30);
      const parseResult = await parseFile(file);
      setProgress(70);
      
      if (parseResult.errors.length > 0 && parseResult.entities.length === 0) {
        setError(parseResult.errors.join('\n'));
        setIsProcessing(false);
        return;
      }
      
      setProgress(85);
      
      const systemUsers: SystemUser[] = (usersData || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        username: u.username
      }));
      
      const userIdentities: SystemUserIdentity[] = (allIdentities || []).map((i: any) => ({
        userId: i.userId,
        externalSystem: i.systemId || i.systemType,
        externalUserId: i.externalUserId,
        externalDisplayName: i.externalUsername || i.profile?.displayName,
        externalEmail: i.externalEmail
      }));
      
      const taskStatuses = (statusOptionsData || []).filter((s: any) => s.type === 'task');
      const systemStatuses: SystemStatus[] = taskStatuses.map((s: any) => ({
        id: s.id,
        label: s.label,
        order: s.order,
        isDefault: s.isDefault
      }));
      
      const adapterOptions: ImportAdapterOptions = {
        systemUsers,
        userIdentities,
        systemStatuses
      };
      
      setProgress(90);
      initializeFromFile(parseResult, adapterOptions);
      setProgress(100);
      
      setTimeout(() => {
        setLocation('/projects/new');
      }, 200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setIsProcessing(false);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setFormat(null);
    setError(null);
  };

  const FormatIcon = format ? formatIcons[format] : FileUp;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Import Project Data</h1>
          <p className="text-muted-foreground">
            Upload your project data and we'll guide you through creating a new project with the imported information.
          </p>
        </div>

        <Card className="shadow-lg" data-testid="import-upload-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload File
            </CardTitle>
            <CardDescription>
              Supported formats: JSON, Excel (.xlsx), CSV, YAML
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!file ? (
              <div
                className={`
                  border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer
                  ${isDragOver 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                  }
                `}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById('file-input')?.click()}
                data-testid="file-dropzone"
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".json,.xlsx,.xls,.csv,.yaml,.yml"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <FileUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-1">Drop your file here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </div>
            ) : (
              <div className="border rounded-xl p-6 bg-muted/30">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <FormatIcon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" data-testid="selected-filename">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatLabels[format || 'unknown']} • {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearFile}
                    disabled={isProcessing}
                    data-testid="clear-file-btn"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 text-destructive" data-testid="upload-error">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="text-sm whitespace-pre-wrap">{error}</div>
              </div>
            )}

            {isProcessing && (
              <div className="space-y-2" data-testid="processing-indicator">
                <div className="flex justify-between text-sm">
                  <span>Processing file...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setLocation('/projects')}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleContinue}
                disabled={!file || isProcessing}
                data-testid="continue-to-wizard-btn"
              >
                {isProcessing ? (
                  'Processing...'
                ) : (
                  <>
                    Continue to Wizard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Don't have a file ready?
          </p>
          <Button
            variant="link"
            onClick={() => setLocation('/projects/new')}
          >
            Create a project from scratch instead
          </Button>
        </div>
      </div>
    </div>
  );
}
