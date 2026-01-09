import { useState, useCallback } from "react";
import { Shell } from "@/components/layout/shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, ArrowRight, Upload, FileText, Check, AlertCircle, Loader2, CheckCircle2, XCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { parseFile, ParseResult, ParsedEntity, transformForImport, extractUniqueUserIds, extractUniqueStatuses, normalizeStatus } from "@/lib/import-parser";
import { useUsers } from "@/hooks/use-nexus-data";
import { useToast } from "@/hooks/use-toast";
import { UploadStep } from "./steps/upload-step";
import { SchemaDetectionStep } from "./steps/schema-detection-step";
import { UserMappingStep } from "./steps/user-mapping-step";
import { StatusMappingStep } from "./steps/status-mapping-step";
import { PreviewStep } from "./steps/preview-step";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export type ImportStep = 'upload' | 'schema' | 'users' | 'status' | 'preview' | 'results';

export interface ImportResult {
  success: boolean;
  summary: {
    totalCreated: number;
    totalErrors: number;
    byEntity: Record<string, { created: number; errors: string[] }>;
  };
  idMappings: Record<string, Record<string, string>>;
  errors: string[];
}

const STEPS: { id: ImportStep; label: string }[] = [
  { id: 'upload', label: 'Upload File' },
  { id: 'schema', label: 'Entity Mapping' },
  { id: 'users', label: 'User Mapping' },
  { id: 'status', label: 'Status Mapping' },
  { id: 'preview', label: 'Preview & Import' },
  { id: 'results', label: 'Results' }
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

function ResultsStep({ result, fileName }: { result: ImportResult | null; fileName: string }) {
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());

  if (!result) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No import results available.
      </div>
    );
  }

  const toggleEntity = (entity: string) => {
    setExpandedEntities(prev => {
      const next = new Set(prev);
      if (next.has(entity)) {
        next.delete(entity);
      } else {
        next.add(entity);
      }
      return next;
    });
  };

  const entities = Object.entries(result.summary.byEntity);
  const hasErrors = result.summary.totalErrors > 0;

  return (
    <div className="space-y-6" data-testid="import-results-step">
      <div className={`p-4 rounded-lg border ${hasErrors ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
        <div className="flex items-center gap-3">
          {hasErrors ? (
            <AlertCircle className="h-6 w-6 text-amber-600" />
          ) : (
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          )}
          <div>
            <h3 className={`font-semibold ${hasErrors ? 'text-amber-800' : 'text-green-800'}`}>
              {hasErrors ? 'Import Completed with Issues' : 'Import Successful'}
            </h3>
            <p className={`text-sm ${hasErrors ? 'text-amber-700' : 'text-green-700'}`}>
              Created {result.summary.totalCreated} records from {fileName}
              {hasErrors && ` • ${result.summary.totalErrors} errors occurred`}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Results by Entity</h4>
        {entities.map(([entityName, entityResult]) => {
          const hasEntityErrors = entityResult.errors.length > 0;
          const isExpanded = expandedEntities.has(entityName);
          
          return (
            <div key={entityName} className="border rounded-lg overflow-hidden">
              <div 
                className={`flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 ${hasEntityErrors ? 'bg-red-50/50' : 'bg-green-50/50'}`}
                onClick={() => hasEntityErrors && toggleEntity(entityName)}
                data-testid={`entity-result-${entityName}`}
              >
                <div className="flex items-center gap-3">
                  {hasEntityErrors ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  <span className="font-medium">{entityName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {entityResult.created} created
                    {hasEntityErrors && ` • ${entityResult.errors.length} errors`}
                  </span>
                  {hasEntityErrors && (
                    isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </div>
              
              {hasEntityErrors && isExpanded && (
                <div className="border-t bg-red-50/30 p-3">
                  <ScrollArea className="max-h-48">
                    <div className="space-y-1">
                      {entityResult.errors.map((error, idx) => (
                        <div key={idx} className="text-sm text-red-700 font-mono bg-red-100/50 rounded px-2 py-1">
                          {error}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {result.errors.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700">
            <ChevronRight className="h-4 w-4 transition-transform data-[state=open]:rotate-90" />
            View All Errors ({result.errors.length})
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ScrollArea className="mt-3 max-h-64 border rounded-lg bg-red-50/30 p-3">
              <div className="space-y-1">
                {result.errors.map((error, idx) => (
                  <div key={idx} className="text-sm text-red-700 font-mono bg-red-100/50 rounded px-2 py-1">
                    {error}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

export default function ImportWizard() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: existingUsers } = useUsers();
  
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  
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
      
      // Store result and navigate to results step
      setImportResult(result);
      setCurrentStep('results');
      
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
      }
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
      case 'results':
        return <ResultsStep result={importResult} fileName={state.file?.name || 'import'} />;
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
      case 'results':
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
          {currentStep !== 'results' ? (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStepIndex === 0 || isProcessing}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                setCurrentStep('upload');
                setImportResult(null);
                setState({
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
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Another
            </Button>
          )}
          
          {currentStep === 'results' ? (
            <Button
              onClick={() => setLocation('/projects')}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Go to Projects
            </Button>
          ) : currentStep !== 'preview' ? (
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
