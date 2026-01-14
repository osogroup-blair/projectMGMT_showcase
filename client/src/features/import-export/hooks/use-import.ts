import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import * as yaml from "js-yaml";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/storage";
import { ENTITY_TO_COLLECTION, IMPORT_ORDER } from "../constants";
import { normalizeRecord, applyDefaultsForNewRecord, deserialize, flattenNestedImport } from "../utils";
import type { ImportState, ImportPreviewData, ExportTab } from "../types";

// Template entity names that should use the bulk import endpoint
const TEMPLATE_ENTITIES = [
  "FrameworkTemplates", "StageTemplates", "TaskTemplates", "RoleTemplates",
  "MilestoneTemplates", "DeliverableTemplates", "EpicTemplates", "ProjectTemplates"
];

export function useImport(activeTab?: ExportTab) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importState, setImportState] = useState<ImportState>({
    file: null,
    data: null,
    preview: [],
    isProcessing: false,
    isImporting: false,
    importProgress: 0,
    errors: [],
    hasConflicts: false,
    totalExisting: 0,
    totalNew: 0
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportState(prev => ({ ...prev, file, isProcessing: true, errors: [], preview: [], data: null }));

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let parsedData: Record<string, any[]> = {};

      if (ext === 'xlsx' || ext === 'xls') {
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        wb.SheetNames.forEach(sheetName => {
          const ws = wb.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(ws);
          if (jsonData.length > 0) {
            parsedData[sheetName] = deserialize(jsonData);
          }
        });
      } else if (ext === 'json') {
        const text = await file.text();
        const trimmedText = text.trim();
        if (trimmedText.startsWith('<!DOCTYPE') || trimmedText.startsWith('<html') || trimmedText.startsWith('<')) {
          throw new Error('The file appears to contain HTML instead of JSON. Please ensure you are uploading a valid JSON export file.');
        }
        let json;
        try {
          json = JSON.parse(text);
        } catch (parseError: any) {
          const preview = text.substring(0, 100);
          throw new Error(`Invalid JSON format: ${parseError.message}. File starts with: ${preview}...`);
        }
        if (json.projects && Array.isArray(json.projects)) {
          parsedData = flattenNestedImport(json);
        } else {
          parsedData = json;
        }
      } else if (ext === 'yaml' || ext === 'yml') {
        const text = await file.text();
        const parsed = yaml.load(text) as any;
        if (parsed.projects && Array.isArray(parsed.projects)) {
          parsedData = flattenNestedImport(parsed);
        } else {
          parsedData = parsed;
        }
      } else {
        throw new Error('Unsupported file format');
      }

      const preview: ImportPreviewData[] = [];
      const globalErrors: string[] = [];
      let totalExisting = 0;
      let totalNew = 0;

      for (const [entityName, records] of Object.entries(parsedData)) {
        if (!Array.isArray(records)) continue;
        
        const entityErrors: string[] = [];
        const collection = ENTITY_TO_COLLECTION[entityName];
        
        if (!collection) {
          entityErrors.push(`Unknown entity: ${entityName}`);
          preview.push({
            entityName,
            count: records.length,
            sample: records.slice(0, 3),
            errors: entityErrors,
            existingCount: 0,
            newCount: records.length,
            existingIds: []
          });
          continue;
        }

        const existingIds: string[] = [];
        let existingCount = 0;
        let newCount = records.length;
        
        try {
          const existingData = await db.getAll(collection as any);
          const existingIdSet = new Set((existingData || []).map((item: any) => item.id));
          
          for (const record of records) {
            if (record.id && existingIdSet.has(record.id)) {
              existingIds.push(record.id);
            }
          }
          
          existingCount = existingIds.length;
          newCount = records.length - existingCount;
        } catch (fetchError: any) {
          entityErrors.push(`Warning: Could not check existing ${entityName}: ${fetchError.message}`);
        }

        totalExisting += existingCount;
        totalNew += newCount;

        preview.push({
          entityName,
          count: records.length,
          sample: records.slice(0, 3),
          errors: entityErrors,
          existingCount,
          newCount,
          existingIds
        });

        if (entityErrors.length > 0) {
          globalErrors.push(...entityErrors);
        }
      }

      setImportState(prev => ({
        ...prev,
        data: parsedData,
        preview,
        errors: globalErrors,
        isProcessing: false,
        hasConflicts: totalExisting > 0,
        totalExisting,
        totalNew
      }));

    } catch (error: any) {
      setImportState(prev => ({
        ...prev,
        isProcessing: false,
        errors: [error.message || 'Failed to parse file']
      }));
      toast({
        title: "Parse Error",
        description: error.message || "Failed to parse the import file.",
        variant: "destructive"
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (!importState.data) return;

    setImportState(prev => ({ ...prev, isImporting: true, importProgress: 0 }));

    // Check if this is a templates import - use backend bulk import for proper ID remapping
    const hasTemplateEntities = Object.keys(importState.data).some(key => 
      TEMPLATE_ENTITIES.includes(key)
    );
    
    if (activeTab === "templates" || hasTemplateEntities) {
      // Use backend bulk import endpoint for templates - handles ID remapping for foreign keys
      try {
        const response = await fetch("/api/templates/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(importState.data),
        });
        
        const result = await response.json();
        
        if (!response.ok || result.errors?.length > 0) {
          const errorMessages = result.errors?.map((e: any) => `${e.type}: ${e.name} - ${e.error}`) || [result.error || "Import failed"];
          setImportState(prev => ({
            ...prev,
            isImporting: false,
            importProgress: 100,
            errors: errorMessages
          }));
          toast({
            title: "Import Completed with Errors",
            description: `${errorMessages.length} errors occurred during import.`,
            variant: "destructive"
          });
          return;
        }
        
        // Calculate totals from results
        const totalCreated = Object.values(result.results || {}).reduce((sum: number, r: any) => sum + (r.created || 0), 0);
        const totalUpdated = Object.values(result.results || {}).reduce((sum: number, r: any) => sum + (r.updated || 0), 0);
        const totalSkipped = Object.values(result.results || {}).reduce((sum: number, r: any) => sum + (r.skipped || 0), 0);
        
        setImportState(prev => ({
          ...prev,
          isImporting: false,
          importProgress: 100,
          errors: []
        }));
        
        toast({
          title: "Import Complete",
          description: `Created: ${totalCreated}, Updated: ${totalUpdated}, Skipped: ${totalSkipped}`,
        });
        clearImport();
        return;
      } catch (error: any) {
        setImportState(prev => ({
          ...prev,
          isImporting: false,
          importProgress: 100,
          errors: [error.message || "Failed to import templates"]
        }));
        toast({
          title: "Import Failed",
          description: error.message || "Failed to import templates",
          variant: "destructive"
        });
        return;
      }
    }

    // Non-template import: use individual record creation
    const orderedEntities: [string, any[]][] = [];
    for (const entityName of IMPORT_ORDER) {
      if (importState.data[entityName] && Array.isArray(importState.data[entityName])) {
        orderedEntities.push([entityName, importState.data[entityName]]);
      }
    }
    for (const [entityName, records] of Object.entries(importState.data)) {
      if (!IMPORT_ORDER.includes(entityName) && Array.isArray(records)) {
        orderedEntities.push([entityName, records]);
      }
    }

    const totalEntities = orderedEntities.length;
    let processed = 0;
    const importErrors: string[] = [];
    let updatedCount = 0;
    let createdCount = 0;

    for (const [entityName, records] of orderedEntities) {
      const collection = ENTITY_TO_COLLECTION[entityName];
      if (!collection || !Array.isArray(records)) {
        processed++;
        continue;
      }

      for (const record of records) {
        try {
          const normalizedRecord = normalizeRecord(record, entityName);
          if (normalizedRecord.id) {
            const existing = await db.getById(collection as any, normalizedRecord.id);
            if (existing) {
              await db.update(collection as any, normalizedRecord.id, normalizedRecord);
              updatedCount++;
            } else {
              const recordWithDefaults = applyDefaultsForNewRecord(normalizedRecord, entityName);
              await db.create(collection as any, recordWithDefaults);
              createdCount++;
            }
          } else {
            const recordWithDefaults = applyDefaultsForNewRecord(normalizedRecord, entityName);
            await db.create(collection as any, recordWithDefaults);
            createdCount++;
          }
        } catch (error: any) {
          importErrors.push(`${entityName}: ${error.message}`);
        }
      }

      processed++;
      setImportState(prev => ({
        ...prev,
        importProgress: Math.round((processed / totalEntities) * 100)
      }));
    }

    setImportState(prev => ({
      ...prev,
      isImporting: false,
      importProgress: 100,
      errors: importErrors
    }));

    if (importErrors.length === 0) {
      toast({
        title: "Import Complete",
        description: `Successfully imported: ${createdCount} created, ${updatedCount} updated.`,
      });
      clearImport();
    } else {
      toast({
        title: "Import Completed with Errors",
        description: `${importErrors.length} errors occurred during import.`,
        variant: "destructive"
      });
    }
  };

  const clearImport = () => {
    setImportState({
      file: null,
      data: null,
      preview: [],
      isProcessing: false,
      isImporting: false,
      importProgress: 0,
      errors: [],
      hasConflicts: false,
      totalExisting: 0,
      totalNew: 0
    });
  };

  return {
    importState,
    fileInputRef,
    handleFileSelect,
    handleImport,
    clearImport
  };
}
