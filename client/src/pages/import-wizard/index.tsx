import { useState, useCallback } from "react";
import { Shell } from "@/components/layout/shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Upload, FileText, Check, AlertCircle, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { parseFile, ParseResult, ParsedEntity, transformForImport, extractUniqueUserIds, extractUniqueStatuses, normalizeStatus } from "@/lib/import-parser";
import { useUsers } from "@/hooks/use-nexus-data";
import { useToast } from "@/hooks/use-toast";
import { UploadStep } from "./steps/upload-step";
import { SchemaDetectionStep } from "./steps/schema-detection-step";
import { UserMappingStep } from "./steps/user-mapping-step";
import { StatusMappingStep } from "./steps/status-mapping-step";
import { PreviewStep } from "./steps/preview-step";

export type ImportStep = 'upload' | 'schema' | 'users' | 'status' | 'preview';

const STEPS: { id: ImportStep; label: string }[] = [
  { id: 'upload', label: 'Upload File' },
  { id: 'schema', label: 'Entity Mapping' },
  { id: 'users', label: 'User Mapping' },
  { id: 'status', label: 'Status Mapping' },
  { id: 'preview', label: 'Preview & Import' }
];

export interface ImportWizardState {
  file: File | null;
  parseResult: ParseResult | null;
  entityMappings: Record<string, string>;
  userMappings: Record<string, string>;
  statusMappings: Record<string, string>;
  userHandling: 'create' | 'unassigned' | 'skip';
  projectDefaults: {
    description: string;
    deadline: string;
    startDate: string;
    ownerId: string;
  };
}

export default function ImportWizard() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: existingUsers } = useUsers();
  
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [state, setState] = useState<ImportWizardState>({
    file: null,
    parseResult: null,
    entityMappings: {},
    userMappings: {},
    statusMappings: {},
    userHandling: 'create',
    projectDefaults: {
      description: '',
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      ownerId: ''
    }
  });

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  const progressPercent = ((currentStepIndex + 1) / STEPS.length) * 100;

  const handleFileSelected = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      const result = await parseFile(file);
      
      const autoMappings: Record<string, string> = {};
      result.entities.forEach(entity => {
        autoMappings[entity.entityType] = entity.entityType;
      });
      
      const uniqueStatuses = extractUniqueStatuses(result.entities);
      const autoStatusMappings: Record<string, string> = {};
      uniqueStatuses.forEach(status => {
        autoStatusMappings[status] = normalizeStatus(status);
      });
      
      setState(prev => ({
        ...prev,
        file,
        parseResult: result,
        entityMappings: autoMappings,
        statusMappings: autoStatusMappings
      }));
      
      if (result.errors.length > 0) {
        toast({
          title: "Parse Warnings",
          description: result.errors.join(", "),
          variant: "destructive"
        });
      } else {
        setCurrentStep('schema');
      }
    } catch (error) {
      toast({
        title: "Parse Error",
        description: error instanceof Error ? error.message : "Failed to parse file",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const handleNext = () => {
    const stepIndex = STEPS.findIndex(s => s.id === currentStep);
    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[stepIndex + 1].id);
    }
  };

  const handleBack = () => {
    const stepIndex = STEPS.findIndex(s => s.id === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1].id);
    }
  };

  const handleImport = async () => {
    if (!state.parseResult) return;
    
    setIsProcessing(true);
    try {
      const transformed = transformForImport(
        state.parseResult.entities,
        state.userMappings,
        state.statusMappings,
        state.entityMappings
      );
      
      const response = await fetch('/api/imports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entities: transformed.entities,
          defaults: state.projectDefaults
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }
      
      if (result.success) {
        toast({
          title: "Import Complete",
          description: `Successfully created ${result.summary.totalCreated} records from ${state.file?.name}`
        });
      } else {
        toast({
          title: "Import Completed with Issues",
          description: `Created ${result.summary.totalCreated} records. ${result.summary.totalErrors} errors occurred.`,
          variant: "destructive"
        });
        console.log("Import errors:", result.errors);
      }
      
      setLocation('/projects');
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "An error occurred during import",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const updateState = (updates: Partial<ImportWizardState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <UploadStep
            file={state.file}
            onFileSelected={handleFileSelected}
            isProcessing={isProcessing}
          />
        );
      case 'schema':
        return (
          <SchemaDetectionStep
            parseResult={state.parseResult}
            entityMappings={state.entityMappings}
            onEntityMappingsChange={(mappings) => updateState({ entityMappings: mappings })}
            projectDefaults={state.projectDefaults}
            onProjectDefaultsChange={(defaults) => updateState({ projectDefaults: defaults })}
            existingUsers={existingUsers || []}
          />
        );
      case 'users':
        return (
          <UserMappingStep
            parseResult={state.parseResult}
            userMappings={state.userMappings}
            onUserMappingsChange={(mappings) => updateState({ userMappings: mappings })}
            userHandling={state.userHandling}
            onUserHandlingChange={(handling) => updateState({ userHandling: handling })}
            existingUsers={existingUsers || []}
          />
        );
      case 'status':
        return (
          <StatusMappingStep
            parseResult={state.parseResult}
            statusMappings={state.statusMappings}
            onStatusMappingsChange={(mappings) => updateState({ statusMappings: mappings })}
          />
        );
      case 'preview':
        return (
          <PreviewStep
            state={state}
            onImport={handleImport}
            isProcessing={isProcessing}
          />
        );
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'upload':
        return state.file !== null && state.parseResult !== null;
      case 'schema':
        return Object.keys(state.entityMappings).length > 0;
      case 'users':
        return true;
      case 'status':
        return true;
      case 'preview':
        return true;
      default:
        return false;
    }
  };

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary">Import Wizard</h1>
            <p className="text-muted-foreground">Import data from JSON, Excel, CSV, or YAML files</p>
          </div>
          <Button variant="ghost" onClick={() => setLocation('/projects')}>
            Cancel
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    index < currentStepIndex 
                      ? 'bg-primary text-primary-foreground'
                      : index === currentStepIndex
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {index < currentStepIndex ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <span className={`ml-2 text-sm hidden sm:inline ${
                    index === currentStepIndex ? 'font-medium' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                  {index < STEPS.length - 1 && (
                    <div className={`w-8 sm:w-16 h-0.5 mx-2 ${
                      index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <Progress value={progressPercent} className="h-1" />
          </CardHeader>
          <CardContent className="pt-6">
            {renderStep()}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStepIndex === 0 || isProcessing}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          {currentStep !== 'preview' ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleImport}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Start Import
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Shell>
  );
}
