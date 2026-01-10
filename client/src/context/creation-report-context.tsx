import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { CreationReport } from '@shared/creation-result-types';

interface CreationReportContextType {
  report: CreationReport | null;
  setReport: (report: CreationReport | null) => void;
  clearReport: () => void;
}

const CreationReportContext = createContext<CreationReportContextType | undefined>(undefined);

export function CreationReportProvider({ children }: { children: ReactNode }) {
  const [report, setReport] = useState<CreationReport | null>(null);
  
  const clearReport = () => setReport(null);
  
  return (
    <CreationReportContext.Provider value={{ report, setReport, clearReport }}>
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
