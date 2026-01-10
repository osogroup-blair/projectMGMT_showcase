import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useCreationReport, type CreationProgress, type CreationError } from '@/context/creation-report-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  FolderOpen,
  Package,
  Layers,
  ListTodo,
  Flag,
  Users,
  LayoutGrid,
  Plus,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Loader2
} from 'lucide-react';
import type { EntityType, EntityResult } from '@shared/creation-result-types';

const entityIcons: Record<EntityType, typeof FolderOpen> = {
  project: FolderOpen,
  stage: LayoutGrid,
  deliverable: Package,
  epic: Layers,
  task: ListTodo,
  milestone: Flag,
  role: Users
};

const entityLabels: Record<EntityType, string> = {
  project: 'Project',
  stage: 'Stages',
  deliverable: 'Deliverables',
  epic: 'Epics',
  task: 'Tasks',
  milestone: 'Milestones',
  role: 'Roles'
};

function EntityBreakdownCard({ 
  entityType, 
  total, 
  succeeded, 
  failed 
}: { 
  entityType: EntityType; 
  total: number; 
  succeeded: number; 
  failed: number;
}) {
  const Icon = entityIcons[entityType] || FolderOpen;
  const label = entityLabels[entityType] || entityType;
  
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-background rounded-md">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {succeeded > 0 && (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            {succeeded} created
          </Badge>
        )}
        {failed > 0 && (
          <Badge variant="destructive">
            {failed} failed
          </Badge>
        )}
      </div>
    </div>
  );
}

function FailedEntityRow({ result }: { result: EntityResult }) {
  const Icon = entityIcons[result.entityType as EntityType] || FolderOpen;
  
  return (
    <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
      <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium text-sm">{result.name}</span>
          <Badge variant="outline" className="text-xs">
            {entityLabels[result.entityType as EntityType] || result.entityType}
          </Badge>
        </div>
        <p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>
      </div>
    </div>
  );
}

function getEntityUrl(entityType: EntityType, entityId: string, projectId: string | null): string | null {
  if (!projectId) return null;
  
  switch (entityType) {
    case 'project':
      return `/projects/${projectId}`;
    case 'task':
      return `/projects/${projectId}/tasks/${entityId}`;
    case 'epic':
      return `/projects/${projectId}/epics/${entityId}`;
    case 'deliverable':
      return `/projects/${projectId}/deliverables/${entityId}`;
    case 'milestone':
      return `/projects/${projectId}/milestones/${entityId}`;
    case 'stage':
    case 'role':
      return null;
    default:
      return null;
  }
}

function truncateId(id: string, maxLength: number = 8): string {
  if (id.length <= maxLength) return id;
  return `${id.slice(0, maxLength)}...`;
}

function CreatedEntityRow({ 
  result, 
  projectId,
  onNavigate 
}: { 
  result: EntityResult; 
  projectId: string | null;
  onNavigate: (url: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const Icon = entityIcons[result.entityType as EntityType] || FolderOpen;
  const url = getEntityUrl(result.entityType as EntityType, result.id, projectId);
  
  const handleCopyId = async () => {
    await navigator.clipboard.writeText(result.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleClick = () => {
    if (url) {
      onNavigate(url);
    }
  };
  
  return (
    <div 
      className={`flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors ${url ? 'cursor-pointer' : ''}`}
      onClick={url ? handleClick : undefined}
      data-testid={`entity-row-${result.entityType}-${result.id}`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="font-medium text-sm truncate">{result.name}</span>
        {url && (
          <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground">
          {truncateId(result.id)}
        </code>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={(e) => {
            e.stopPropagation();
            handleCopyId();
          }}
          title="Copy full ID"
          data-testid={`copy-id-${result.id}`}
        >
          {copied ? (
            <CheckCircle2 className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
    </div>
  );
}

function EntityTypeSection({
  entityType,
  entities,
  projectId,
  onNavigate
}: {
  entityType: EntityType;
  entities: EntityResult[];
  projectId: string | null;
  onNavigate: (url: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(entityType === 'project' || entityType === 'deliverable');
  const Icon = entityIcons[entityType] || FolderOpen;
  const label = entityLabels[entityType] || entityType;
  
  if (entities.length === 0) return null;
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-md hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <Icon className="h-4 w-4 text-primary" />
          <span className="font-medium">{label}</span>
          <Badge variant="secondary" className="ml-1">
            {entities.length}
          </Badge>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-6 pl-4 border-l space-y-1 mt-1">
          {entities.map((entity, index) => (
            <CreatedEntityRow
              key={`${entity.entityType}-${entity.id}-${index}`}
              result={entity}
              projectId={projectId}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

const entityCreationOrder: EntityType[] = ['project', 'stage', 'deliverable', 'epic', 'task', 'milestone', 'role'];

function CreatingProgressView({ progress }: { progress: CreationProgress }) {
  const [currentEntityIndex, setCurrentEntityIndex] = useState(0);
  const [progressValue, setProgressValue] = useState(0);
  
  const totalEntities = 1 + 
    progress.expectedCounts.stages + 
    progress.expectedCounts.deliverables + 
    progress.expectedCounts.epics + 
    progress.expectedCounts.tasks + 
    progress.expectedCounts.milestones + 
    progress.expectedCounts.roles;
  
  useEffect(() => {
    const interval = setInterval(() => {
      setProgressValue(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 8 + 2;
      });
      
      setCurrentEntityIndex(prev => {
        if (prev >= entityCreationOrder.length - 1) return prev;
        return prev + 1;
      });
    }, 800);
    
    return () => clearInterval(interval);
  }, []);
  
  const currentEntity = entityCreationOrder[Math.min(currentEntityIndex, entityCreationOrder.length - 1)];
  const CurrentIcon = entityIcons[currentEntity] || FolderOpen;
  const currentLabel = entityLabels[currentEntity] || currentEntity;
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <CardTitle className="text-2xl">Creating Project</CardTitle>
          <CardDescription className="text-base">
            Setting up <span className="font-semibold">{progress.projectName}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CurrentIcon className="h-4 w-4 text-primary animate-pulse" />
                <span>Creating {currentLabel}...</span>
              </div>
              <span className="text-muted-foreground">{Math.round(progressValue)}%</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            {progress.expectedCounts.stages > 0 && (
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                <span>{progress.expectedCounts.stages} Stages</span>
              </div>
            )}
            {progress.expectedCounts.deliverables > 0 && (
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>{progress.expectedCounts.deliverables} Deliverables</span>
              </div>
            )}
            {progress.expectedCounts.epics > 0 && (
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span>{progress.expectedCounts.epics} Epics</span>
              </div>
            )}
            {progress.expectedCounts.tasks > 0 && (
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                <ListTodo className="h-4 w-4 text-muted-foreground" />
                <span>{progress.expectedCounts.tasks} Tasks</span>
              </div>
            )}
            {progress.expectedCounts.milestones > 0 && (
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                <Flag className="h-4 w-4 text-muted-foreground" />
                <span>{progress.expectedCounts.milestones} Milestones</span>
              </div>
            )}
            {progress.expectedCounts.roles > 0 && (
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{progress.expectedCounts.roles} Roles</span>
              </div>
            )}
          </div>
          
          <p className="text-center text-sm text-muted-foreground">
            Please wait while we create your project and all related entities...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function CreationErrorView({ error, onBack }: { error: CreationError; onBack: () => void }) {
  const [, setLocation] = useLocation();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">Project Creation Failed</CardTitle>
          <CardDescription className="text-base">
            Failed to create <span className="font-semibold">{error.projectName}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error.message}</p>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button onClick={onBack} className="w-full" data-testid="button-try-again">
              <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              Go Back and Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/projects')} 
              className="w-full"
              data-testid="button-view-projects"
            >
              View All Projects
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProjectCreationSummary() {
  const [, setLocation] = useLocation();
  const { report, clearReport, status, progress, error } = useCreationReport();
  
  if (status === 'creating' && progress) {
    return <CreatingProgressView progress={progress} />;
  }
  
  if (status === 'error' && error) {
    return (
      <CreationErrorView 
        error={error} 
        onBack={() => {
          clearReport();
          setLocation('/projects/new');
        }} 
      />
    );
  }
  
  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
            <CardTitle>No Creation Report Available</CardTitle>
            <CardDescription>
              There's no project creation data to display. This could happen if you navigated here directly.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button onClick={() => setLocation('/projects/new')} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create New Project
            </Button>
            <Button variant="outline" onClick={() => setLocation('/projects')} className="w-full">
              View All Projects
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const { projectId, projectName, overallSuccess, summary, breakdownByType, entityResults } = report;
  const failedEntities = entityResults.filter(r => !r.success);
  const successfulEntities = entityResults.filter(r => r.success);
  
  const entitiesByType: Record<EntityType, EntityResult[]> = {
    project: [],
    deliverable: [],
    epic: [],
    task: [],
    stage: [],
    milestone: [],
    role: []
  };
  
  successfulEntities.forEach(entity => {
    const type = entity.entityType as EntityType;
    if (entitiesByType[type]) {
      entitiesByType[type].push(entity);
    }
  });
  
  const handleGoToProject = () => {
    clearReport();
    if (projectId) {
      setLocation(`/projects/${projectId}`);
    } else {
      setLocation('/projects');
    }
  };
  
  const handleCreateAnother = () => {
    clearReport();
    setLocation('/projects/new');
  };
  
  const handleNavigateToEntity = (url: string) => {
    clearReport();
    setLocation(url);
  };
  
  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          {overallSuccess ? (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight" data-testid="summary-title">
                  Project Created Successfully
                </h1>
                <p className="text-muted-foreground mt-1">
                  <span className="font-semibold">{projectName}</span> and all related entities have been created.
                </p>
              </div>
            </>
          ) : projectId ? (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <AlertTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight" data-testid="summary-title">
                  Project Created with Issues
                </h1>
                <p className="text-muted-foreground mt-1">
                  <span className="font-semibold">{projectName}</span> was created, but some entities failed.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight" data-testid="summary-title">
                  Project Creation Failed
                </h1>
                <p className="text-muted-foreground mt-1">
                  Failed to create <span className="font-semibold">{projectName}</span>.
                </p>
              </div>
            </>
          )}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Creation Summary</CardTitle>
            <CardDescription>
              {summary.succeeded} of {summary.total} entities created successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium">{summary.succeeded} Succeeded</span>
              </div>
              {summary.failed > 0 && (
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium">{summary.failed} Failed</span>
                </div>
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-2 pt-2">
              {Object.entries(breakdownByType).map(([type, stats]) => (
                <EntityBreakdownCard
                  key={type}
                  entityType={type as EntityType}
                  total={stats.total}
                  succeeded={stats.succeeded}
                  failed={stats.failed}
                />
              ))}
            </div>
          </CardContent>
        </Card>
        
        {successfulEntities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Created Entities ({successfulEntities.length})
              </CardTitle>
              <CardDescription>
                Click on any entity to view its details. Click the copy icon to copy the full ID.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-1">
                  {(['project', 'deliverable', 'epic', 'task', 'stage', 'milestone', 'role'] as EntityType[]).map(type => (
                    <EntityTypeSection
                      key={type}
                      entityType={type}
                      entities={entitiesByType[type]}
                      projectId={projectId}
                      onNavigate={handleNavigateToEntity}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
        
        {failedEntities.length > 0 && (
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Failed Entities ({failedEntities.length})
              </CardTitle>
              <CardDescription>
                These items could not be created. You can add them manually from the project page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {failedEntities.map((result, index) => (
                <FailedEntityRow key={`${result.entityType}-${result.id}-${index}`} result={result} />
              ))}
            </CardContent>
          </Card>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {projectId && (
            <Button 
              onClick={handleGoToProject} 
              className="flex-1"
              data-testid="button-go-to-project"
            >
              Go to Project
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          <Button 
            variant={projectId ? "outline" : "default"}
            onClick={handleCreateAnother}
            className="flex-1"
            data-testid="button-create-another"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Another Project
          </Button>
          <Button 
            variant="outline" 
            onClick={() => { clearReport(); setLocation('/projects'); }}
            className="flex-1"
            data-testid="button-view-all"
          >
            View All Projects
          </Button>
        </div>
      </div>
    </div>
  );
}
