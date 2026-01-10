import { useLocation } from 'wouter';
import { useCreationReport } from '@/context/creation-report-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Plus
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

export default function ProjectCreationSummary() {
  const [, setLocation] = useLocation();
  const { report, clearReport } = useCreationReport();
  
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
