import { FileUp, Check, AlertTriangle, HelpCircle, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ConfidenceLevel } from '@/lib/import-to-wizard-adapter';

interface ImportFieldIndicatorProps {
  confidence: ConfidenceLevel;
  sourceField?: string;
  sourceValue?: any;
  isAccepted?: boolean;
  isModified?: boolean;
  onAccept?: () => void;
  onClear?: () => void;
  compact?: boolean;
}

const confidenceConfig: Record<ConfidenceLevel, { 
  icon: typeof Check; 
  color: string; 
  bgColor: string;
  label: string;
}> = {
  high: { 
    icon: Check, 
    color: 'text-green-600', 
    bgColor: 'bg-green-50 border-green-200',
    label: 'High confidence'
  },
  medium: { 
    icon: AlertTriangle, 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-50 border-amber-200',
    label: 'Medium confidence'
  },
  low: { 
    icon: HelpCircle, 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-50 border-orange-200',
    label: 'Low confidence - please verify'
  },
  unmapped: { 
    icon: HelpCircle, 
    color: 'text-gray-400', 
    bgColor: 'bg-gray-50 border-gray-200',
    label: 'Not from import'
  }
};

export function ImportFieldIndicator({
  confidence,
  sourceField,
  sourceValue,
  isAccepted,
  isModified,
  onAccept,
  onClear,
  compact = false
}: ImportFieldIndicatorProps) {
  if (confidence === 'unmapped') return null;
  
  const config = confidenceConfig[confidence];
  const Icon = config.icon;
  
  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center ${config.color}`}>
            <FileUp className="h-3 w-3" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Imported from file</p>
          {sourceField && <p className="text-xs text-muted-foreground">Field: {sourceField}</p>}
        </TooltipContent>
      </Tooltip>
    );
  }
  
  return (
    <div className={`flex items-center gap-2 px-2 py-1 rounded border ${config.bgColor}`} data-testid="import-field-indicator">
      <FileUp className={`h-3.5 w-3.5 ${config.color}`} />
      <span className="text-xs text-muted-foreground">Imported</span>
      <ConfidenceBadge confidence={confidence} />
      
      {!isAccepted && !isModified && onAccept && onClear && (
        <div className="flex gap-1 ml-auto">
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-xs"
            onClick={onAccept}
            data-testid="accept-import-btn"
          >
            <Check className="h-3 w-3 mr-0.5" /> Accept
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-xs text-muted-foreground"
            onClick={onClear}
            data-testid="clear-import-btn"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      {isAccepted && (
        <Badge variant="secondary" className="ml-auto text-xs bg-green-100">
          <Check className="h-3 w-3 mr-0.5" /> Accepted
        </Badge>
      )}
      
      {isModified && (
        <Badge variant="outline" className="ml-auto text-xs">
          Modified
        </Badge>
      )}
    </div>
  );
}

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const config = confidenceConfig[confidence];
  
  if (confidence === 'unmapped') return null;
  
  return (
    <Badge 
      variant="outline" 
      className={`text-xs ${config.color} border-current`}
      data-testid={`confidence-badge-${confidence}`}
    >
      {confidence}
    </Badge>
  );
}

interface ImportSummaryBannerProps {
  fileName: string;
  stats: {
    projectsFound: number;
    deliverablesFound: number;
    epicsFound: number;
    tasksFound: number;
    milestonesFound: number;
    stagesFound: number;
    usersFound: number;
    totalEntitiesFound: number;
  };
  warnings: string[];
  onClearImport?: () => void;
}

export function ImportSummaryBanner({
  fileName,
  stats,
  warnings,
  onClearImport
}: ImportSummaryBannerProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6" data-testid="import-summary-banner">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900">Import Mode Active</h3>
            <p className="text-sm text-blue-700">Data from: {fileName}</p>
          </div>
        </div>
        
        {onClearImport && (
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-700 hover:text-blue-900 hover:bg-blue-100"
            onClick={onClearImport}
            data-testid="clear-import-mode-btn"
          >
            <X className="h-4 w-4 mr-1" /> Clear Import
          </Button>
        )}
      </div>
      
      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        {stats.projectsFound > 0 && (
          <span className="text-blue-800">{stats.projectsFound} project</span>
        )}
        {stats.deliverablesFound > 0 && (
          <span className="text-blue-800">{stats.deliverablesFound} deliverables</span>
        )}
        {stats.epicsFound > 0 && (
          <span className="text-blue-800">{stats.epicsFound} epics</span>
        )}
        {stats.tasksFound > 0 && (
          <span className="text-blue-800">{stats.tasksFound} tasks</span>
        )}
        {stats.stagesFound > 0 && (
          <span className="text-blue-800">{stats.stagesFound} stages</span>
        )}
        {stats.milestonesFound > 0 && (
          <span className="text-blue-800">{stats.milestonesFound} milestones</span>
        )}
      </div>
      
      {warnings.length > 0 && (
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="flex items-center gap-1.5 text-amber-700 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>{warnings.length} item{warnings.length > 1 ? 's' : ''} need{warnings.length === 1 ? 's' : ''} attention</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface ImportedItemBadgeProps {
  type: 'deliverable' | 'epic' | 'task' | 'stage' | 'milestone';
  sourceId?: string;
}

export function ImportedItemBadge({ type, sourceId }: ImportedItemBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
          <FileUp className="h-3 w-3 mr-1" />
          Imported
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>Imported {type}</p>
        {sourceId && <p className="text-xs text-muted-foreground">Source ID: {sourceId}</p>}
      </TooltipContent>
    </Tooltip>
  );
}
