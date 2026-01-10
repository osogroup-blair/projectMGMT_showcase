import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { CreationReport } from '@shared/creation-result-types';

export interface CreationProgress {
  projectName: string;
  expectedCounts: {
    stages: number;
    deliverables: number;
    epics: number;
    tasks: number;
    milestones: number;
    roles: number;
  };
}

type CreationStatus = 'idle' | 'creating' | 'completed';

interface CreationReportContextType {
  report: CreationReport | null;
  setReport: (report: CreationReport | null) => void;
  clearReport: () => void;
  status: CreationStatus;
  progress: CreationProgress | null;
  startCreating: (progress: CreationProgress) => void;
  finishCreating: (report: CreationReport) => void;
}

const CreationReportContext = createContext<CreationReportContextType | undefined>(undefined);

export function CreationReportProvider({ children }: { children: ReactNode }) {
  const [report, setReport] = useState<CreationReport | null>(null);
  const [status, setStatus] = useState<CreationStatus>('idle');
  const [progress, setProgress] = useState<CreationProgress | null>(null);
  
  const clearReport = () => {
    setReport(null);
    setStatus('idle');
    setProgress(null);
  };
  
  const startCreating = (progressInfo: CreationProgress) => {
    setProgress(progressInfo);
    setStatus('creating');
    setReport(null);
  };
  
  const finishCreating = (creationReport: CreationReport) => {
    setReport(creationReport);
    setStatus('completed');
  };
  
  return (
    <CreationReportContext.Provider value={{ 
      report, 
      setReport, 
      clearReport,
      status,
      progress,
      startCreating,
      finishCreating
    }}>
      {children}
    </CreationReportContext.Provider>
  );
}

export function useCreationReport() {
  const context = useContext(CreationReportContext);
  if (!context) {
    throw new Error('useCreationReport must be used within a CreationReportProvider');
  }
  return context;
}
