import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { ParseResult } from '@/lib/import-parser';
import type {
  ImportAdapterResult,
  ImportedProjectData,
  ImportedDeliverable,
  ImportedStage,
  ImportedMilestone,
  ImportedRole,
  UserMappingEntry,
  StatusMappingEntry,
  ConfidenceLevel,
  ImportAdapterOptions,
} from '@/lib/import-to-wizard-adapter';
import { convertImportToWizardData } from '@/lib/import-to-wizard-adapter';
import type { ReferenceMappingEntry, ResolveAllReferencesResult } from '@/lib/import-reference-resolver';

export interface ImportState {
  isImportMode: boolean;
  sourceFileName: string | null;
  sourceFormat: string | null;
  parseResult: ParseResult | null;
  adapterResult: ImportAdapterResult | null;
  userMappings: UserMappingEntry[];
  statusMappings: StatusMappingEntry[];
  referenceMappings: ReferenceMappingEntry[];
  referenceStats: ResolveAllReferencesResult['stats'] | null;
  acceptedFields: Set<string>;
  modifiedFields: Set<string>;
  warnings: string[];
  defaultUnassignedTo: { userId: string; userName: string } | null;
}

interface ImportContextType {
  state: ImportState;
  initializeFromFile: (parseResult: ParseResult, options?: ImportAdapterOptions) => void;
  updateUserMapping: (sourceId: string, mappedToId: string | null, mappedToName: string | undefined, action: UserMappingEntry['action']) => void;
  updateStatusMapping: (sourceStatus: string, mappedStatus: string, mappedStatusId?: string) => void;
  updateReferenceMapping: (entityType: ReferenceMappingEntry['entityType'], sourceValue: string, resolvedId: string, resolvedName: string) => void;
  setDefaultUnassignedTo: (userId: string | null, userName?: string) => void;
  acceptField: (fieldPath: string) => void;
  modifyField: (fieldPath: string) => void;
  clearField: (fieldPath: string) => void;
  acceptAllInStep: (stepFields: string[]) => void;
  clearImport: () => void;
  getFieldConfidence: (fieldPath: string) => ConfidenceLevel;
  isFieldFromImport: (fieldPath: string) => boolean;
  getImportStats: () => ImportAdapterResult['stats'] | null;
}

const defaultState: ImportState = {
  isImportMode: false,
  sourceFileName: null,
  sourceFormat: null,
  parseResult: null,
  adapterResult: null,
  userMappings: [],
  statusMappings: [],
  referenceMappings: [],
  referenceStats: null,
  acceptedFields: new Set(),
  modifiedFields: new Set(),
  warnings: [],
  defaultUnassignedTo: null
};

const ImportContext = createContext<ImportContextType | undefined>(undefined);

export function ImportProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ImportState>(defaultState);

  const initializeFromFile = useCallback((parseResult: ParseResult, options?: ImportAdapterOptions) => {
    const adapterResult = convertImportToWizardData(parseResult, options);
    
    setState({
      isImportMode: true,
      sourceFileName: parseResult.fileName,
      sourceFormat: parseResult.format,
      parseResult,
      adapterResult,
      userMappings: adapterResult.userMappings,
      statusMappings: adapterResult.statusMappings,
      referenceMappings: adapterResult.referenceMappings,
      referenceStats: adapterResult.referenceStats || null,
      acceptedFields: new Set(),
      modifiedFields: new Set(),
      warnings: adapterResult.warnings,
      defaultUnassignedTo: null
    });
  }, []);

  const updateUserMapping = useCallback((
    sourceId: string,
    mappedToId: string | null,
    mappedToName: string | undefined,
    action: UserMappingEntry['action']
  ) => {
    setState(prev => ({
      ...prev,
      userMappings: prev.userMappings.map(m =>
        m.sourceId === sourceId
          ? { 
              ...m, 
              mappedToId: mappedToId || undefined, 
              mappedToName, 
              action,
              confidence: mappedToId ? 'high' : 'low'
            }
          : m
      )
    }));
  }, []);

  const updateStatusMapping = useCallback((sourceStatus: string, mappedStatus: string, mappedStatusId?: string) => {
    setState(prev => ({
      ...prev,
      statusMappings: prev.statusMappings.map(m =>
        m.sourceStatus === sourceStatus
          ? { ...m, mappedStatus, mappedStatusId, confidence: 'high' as const }
          : m
      )
    }));
  }, []);

  const updateReferenceMapping = useCallback((
    entityType: ReferenceMappingEntry['entityType'],
    sourceValue: string,
    resolvedId: string,
    resolvedName: string
  ) => {
    setState(prev => ({
      ...prev,
      referenceMappings: prev.referenceMappings.map(m =>
        m.entityType === entityType && m.sourceValue === sourceValue
          ? { 
              ...m, 
              resolvedId, 
              resolvedName, 
              confidence: 'high' as const,
              resolutionMethod: 'exact_name' as const
            }
          : m
      )
    }));
  }, []);

  const setDefaultUnassignedTo = useCallback((userId: string | null, userName?: string) => {
    setState(prev => ({
      ...prev,
      defaultUnassignedTo: userId ? { userId, userName: userName || userId } : null
    }));
  }, []);

  const acceptField = useCallback((fieldPath: string) => {
    setState(prev => {
      const newAccepted = new Set(prev.acceptedFields);
      newAccepted.add(fieldPath);
      return { ...prev, acceptedFields: newAccepted };
    });
  }, []);

  const modifyField = useCallback((fieldPath: string) => {
    setState(prev => {
      const newModified = new Set(prev.modifiedFields);
      newModified.add(fieldPath);
      return { ...prev, modifiedFields: newModified };
    });
  }, []);

  const clearField = useCallback((fieldPath: string) => {
    setState(prev => {
      const newAccepted = new Set(prev.acceptedFields);
      const newModified = new Set(prev.modifiedFields);
      newAccepted.delete(fieldPath);
      newModified.add(fieldPath);
      return { ...prev, acceptedFields: newAccepted, modifiedFields: newModified };
    });
  }, []);

  const acceptAllInStep = useCallback((stepFields: string[]) => {
    setState(prev => {
      const newAccepted = new Set(prev.acceptedFields);
      stepFields.forEach(f => newAccepted.add(f));
      return { ...prev, acceptedFields: newAccepted };
    });
  }, []);

  const clearImport = useCallback(() => {
    setState(defaultState);
  }, []);

  const getFieldConfidence = useCallback((fieldPath: string): ConfidenceLevel => {
    if (!state.adapterResult) return 'unmapped';
    
    const parts = fieldPath.split('.');
    if (parts[0] === 'projectData') {
      const field = parts[1] as keyof ImportedProjectData;
      return state.adapterResult.projectData[field]?.confidence || 'unmapped';
    }
    
    return 'unmapped';
  }, [state.adapterResult]);

  const isFieldFromImport = useCallback((fieldPath: string): boolean => {
    if (!state.isImportMode) return false;
    if (state.modifiedFields.has(fieldPath)) return false;
    
    const confidence = getFieldConfidence(fieldPath);
    return confidence !== 'unmapped';
  }, [state.isImportMode, state.modifiedFields, getFieldConfidence]);

  const getImportStats = useCallback(() => {
    return state.adapterResult?.stats || null;
  }, [state.adapterResult]);

  const value: ImportContextType = {
    state,
    initializeFromFile,
    updateUserMapping,
    updateStatusMapping,
    updateReferenceMapping,
    setDefaultUnassignedTo,
    acceptField,
    modifyField,
    clearField,
    acceptAllInStep,
    clearImport,
    getFieldConfidence,
    isFieldFromImport,
    getImportStats
  };

  return (
    <ImportContext.Provider value={value}>
      {children}
    </ImportContext.Provider>
  );
}

export function useImport() {
  const context = useContext(ImportContext);
  if (context === undefined) {
    throw new Error('useImport must be used within an ImportProvider');
  }
  return context;
}

export function useImportOptional() {
  return useContext(ImportContext);
}
