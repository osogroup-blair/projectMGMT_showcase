export type ImportPreviewData = {
  entityName: string;
  count: number;
  sample: any[];
  errors: string[];
  existingCount: number;
  newCount: number;
  existingIds: string[];
};

export type ImportState = {
  file: File | null;
  data: Record<string, any[]> | null;
  preview: ImportPreviewData[];
  isProcessing: boolean;
  isImporting: boolean;
  importProgress: number;
  errors: string[];
  hasConflicts: boolean;
  totalExisting: number;
  totalNew: number;
};

export type ExportFormat = "xlsx" | "json" | "yaml";

export type ExportTab = "all" | "projects" | "templates" | "defaults" | "users" | "sample";

export type SampleSection = "core" | "tasks" | "milestones" | "sprints" | "comments" | "all";

export interface AdminImportExportProps {
  embedded?: boolean;
}

export interface SchemaDefinition {
  sheet: string;
  columns: string[];
}
