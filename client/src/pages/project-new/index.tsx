import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Shell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Package, 
  Layers, 
  Users, 
  Settings,
  Save,
  Loader2,
  Flag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import { useImportOptional } from "@/context/import-context";
import { 
  toWizardProjectData, 
  toWizardDeliverables, 
  toWizardStages, 
  toWizardMilestones,
  toWizardRoles
} from "@/lib/import-to-wizard-adapter";
import { ImportSummaryBanner } from "@/components/import/ImportFieldIndicator";

import { 
  useProjects,
  useDeliverables,
  useEpics,
  useTasks,
  useUsers,
  useProjectStages,
  useMilestones,
  useFrameworkTemplates,
  useStageTemplates,
  useProjectTemplates,
  useDeliverableTemplates,
  useEpicTemplates,
  useTaskTemplates,
  useRoleTemplates
} from "@/hooks/use-nexus-data";

import { 
  ProjectData, 
  WizardDeliverable, 
  WizardStage, 
  WizardMilestone, 
  WizardRole,
  WizardTemplateSnippet,
  WizardRoleType,
  STEPS,
  CORE_PROJECT_ROLES,
  calculateStageDates
} from "./types";
import { StepBasics } from "./step-basics";
import { StepWorkBreakdown } from "./step-work-breakdown";
import { StepStageConfig } from "./step-stage-config";
import { StepTeamRoles } from "./step-team-roles";
import { StepReview } from "./step-review";

const STEP_ICONS = [Settings, Package, Layers, Users, Check];

export default function ProjectWizard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [importInitialized, setImportInitialized] = useState(false);
  
  const importContext = useImportOptional();
  const isImportMode = importContext?.state?.isImportMode || false;
  
  const { data: frameworkTemplates = [], isLoading: loadingFrameworks } = useFrameworkTemplates();
  const { data: stageTemplates = [], isLoading: loadingStages } = useStageTemplates();
  const { data: projectTemplatesData = [], isLoading: loadingProjects } = useProjectTemplates();
  const { data: deliverableTemplates = [], isLoading: loadingDeliverables } = useDeliverableTemplates();
  const { data: epicTemplates = [], isLoading: loadingEpics } = useEpicTemplates();
  const { data: taskTemplates = [], isLoading: loadingTasks } = useTaskTemplates();
  const { data: roleTemplates = [], isLoading: loadingRoles } = useRoleTemplates();
  const { data: users = [], isLoading: loadingUsers } = useUsers();
  
  const { createAsync: createProject } = useProjects();
  const { createAsync: createDeliverable } = useDeliverables();
  const { createAsync: createEpic } = useEpics();
  const { createAsync: createTask } = useTasks();
  const { createAsync: createProjectStage } = useProjectStages();
  const { createAsync: createMilestone } = useMilestones();
  
  const isLoading = loadingFrameworks || loadingStages || loadingProjects || 
                    loadingDeliverables || loadingEpics || loadingTasks || 
                    loadingRoles || loadingUsers;
  
  const [projectData, setProjectData] = useState<ProjectData>({
    name: "",
    description: "",
    templateId: "",
    client: "",
    startDate: new Date().toISOString().split('T')[0],
    dueDate: "",
    sprintDurationWeeks: 2,
    ownerId: users[0]?.id || "",
  });

  const [deliverables, setDeliverables] = useState<WizardDeliverable[]>([]);
  const [stages, setStagesRaw] = useState<WizardStage[]>([]);
  const [roles, setRoles] = useState<WizardRole[]>([]);
  const [milestones, setMilestones] = useState<WizardMilestone[]>([]);

  // Wrapper to auto-apply proportional dates when stages change
  const setStages = (newStages: WizardStage[] | ((prev: WizardStage[]) => WizardStage[])) => {
    setStagesRaw((prev) => {
      const resolved = typeof newStages === 'function' ? newStages(prev) : newStages;
      // Only calculate dates if project has valid start and due dates
      if (projectData.startDate && projectData.dueDate) {
        return calculateStageDates(resolved, projectData.startDate, projectData.dueDate);
      }
      return resolved;
    });
  };

  // Track previous project dates to detect changes
  const prevDatesRef = useRef({ startDate: projectData.startDate, dueDate: projectData.dueDate });
  
  // Recalculate stage dates when project dates change
  useEffect(() => {
    const prevDates = prevDatesRef.current;
    const datesChanged = prevDates.startDate !== projectData.startDate || 
                         prevDates.dueDate !== projectData.dueDate;
    
    if (datesChanged && stages.length > 0 && projectData.startDate && projectData.dueDate) {
      setStagesRaw(calculateStageDates(stages, projectData.startDate, projectData.dueDate));
    }
    
    prevDatesRef.current = { startDate: projectData.startDate, dueDate: projectData.dueDate };
  }, [projectData.startDate, projectData.dueDate]);

  useEffect(() => {
    if (isImportMode && !importInitialized && importContext?.state?.adapterResult) {
      const adapter = importContext.state.adapterResult;
      
      const importedProject = toWizardProjectData(adapter.projectData);
      if (importedProject.name || importedProject.description) {
        setProjectData(prev => ({
          ...prev,
          name: importedProject.name || prev.name,
          description: importedProject.description || prev.description,
          startDate: importedProject.startDate || prev.startDate,
          dueDate: importedProject.dueDate || prev.dueDate,
          sprintDurationWeeks: importedProject.sprintDurationWeeks || prev.sprintDurationWeeks,
          client: importedProject.client || prev.client,
          ownerId: importedProject.ownerId || users[0]?.id || prev.ownerId
        }));
      }
      
      const importedDeliverables = toWizardDeliverables(adapter.deliverables);
      if (importedDeliverables.length > 0) {
        setDeliverables(importedDeliverables);
      }
      
      const importedStages = toWizardStages(adapter.stages);
      if (importedStages.length > 0) {
        setStagesRaw(importedStages);
      }
      
      const importedMilestones = toWizardMilestones(adapter.milestones);
      if (importedMilestones.length > 0) {
        setMilestones(importedMilestones);
      }
      
      const importedRoles = toWizardRoles(adapter.roles);
      if (importedRoles.length > 0) {
        setRoles(importedRoles);
      }
      
      setImportInitialized(true);
      
      toast({
        title: "Import data loaded",
        description: `Loaded data from ${importContext.state.sourceFileName}. Review and adjust as needed.`,
      });
    }
  }, [isImportMode, importInitialized, importContext?.state?.adapterResult, users]);

  const syncRolesFromStagesAndTasks = () => {
    const uniqueRoleIds = new Set<string>();
    
    stages.forEach(stage => {
      (stage.defaultRoles || []).forEach((rid: string) => uniqueRoleIds.add(rid));
      
      (stage.tasks || []).forEach(task => {
        if (task.assigneeRoleTypeId) {
          uniqueRoleIds.add(task.assigneeRoleTypeId);
        }
      });
    });

    const existingTemplateIds = new Set(roles.map(r => r.templateId).filter(Boolean));
    
    const coreRoles: WizardRole[] = CORE_PROJECT_ROLES.map(core => {
      const existingRole = roles.find(r => r.templateId === core.templateId);
      if (existingRole) return existingRole;
      
      return {
        id: `r-${Date.now()}-${Math.random()}`,
        templateId: core.templateId,
        name: core.name,
        description: core.description,
        roleType: core.roleType,
        isCore: true,
        assigneeId: null
      };
    });

    const stageRoles: WizardRole[] = Array.from(uniqueRoleIds)
      .filter(rid => !existingTemplateIds.has(rid) && !CORE_PROJECT_ROLES.some(c => c.templateId === rid))
      .map(rid => {
        const rTemplate = roleTemplates.find((rt: any) => rt.id === rid);
        if (!rTemplate) return null;
        
        const existingRole = roles.find(r => r.templateId === rid);
        if (existingRole) return existingRole;
        
        return {
          id: `r-${Date.now()}-${Math.random()}`,
          templateId: rTemplate.id,
          name: rTemplate.name,
          description: rTemplate.description,
          roleType: rTemplate.defaultRoleType,
          isCore: false,
          assigneeId: null
        };
      })
      .filter(Boolean) as WizardRole[];

    const existingNonCoreRoles = roles.filter(r => 
      !r.isCore && 
      !CORE_PROJECT_ROLES.some(c => c.templateId === r.templateId) &&
      !stageRoles.some(sr => sr.templateId === r.templateId)
    );

    const mergedRoles = [...coreRoles, ...stageRoles, ...existingNonCoreRoles];
    setRoles(mergedRoles);
  };

  const handleNext = () => {
    if (currentStep === 3) {
      syncRolesFromStagesAndTasks();
    }
    
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCreateProject();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getRowValue = (row: any, ...possibleNames: string[]): any => {
    for (const name of possibleNames) {
      if (row[name] !== undefined) return row[name];
    }
    
    const rowKeys = Object.keys(row);
    const normalizedMap = new Map<string, string>();
    rowKeys.forEach(key => {
      const normalized = key.toLowerCase().replace(/[\s_-]/g, '');
      normalizedMap.set(normalized, key);
    });
    
    for (const name of possibleNames) {
      const normalized = name.toLowerCase().replace(/[\s_-]/g, '');
      if (normalizedMap.has(normalized)) {
        return row[normalizedMap.get(normalized)!];
      }
    }
    
    return undefined;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        const processedDeliverables = new Map<string, WizardDeliverable>();
        const deliverableIdMap = new Map<string, string>();

        const deliverablesSheetName = wb.SheetNames.find(n => n.toLowerCase().includes('del-deliverables') || n.toLowerCase().includes('deliverable'));
        const epicsSheetName = wb.SheetNames.find(n => n.toLowerCase().includes('epic - epics') || n.toLowerCase().includes('epic'));

        if (deliverablesSheetName && epicsSheetName) {
            const dData = XLSX.utils.sheet_to_json(wb.Sheets[deliverablesSheetName]);
            const eData = XLSX.utils.sheet_to_json(wb.Sheets[epicsSheetName]);

            dData.forEach((row: any) => {
                const title = getRowValue(row, 'Deliverable Name', 'deliverable_name', 'Title', 'Name', 'Deliverable');
                const externalId = getRowValue(row, 'Deliverable ID', 'deliverable_id', 'ID');
                const description = getRowValue(row, 'Deliverable Description', 'deliverable_description', 'Description') || "";

                if (title) {
                    const id = `d-${Date.now()}-${Math.random()}`;
                    const d: WizardDeliverable = {
                        id,
                        title,
                        description,
                        epics: []
                    };
                    
                    if (!processedDeliverables.has(title)) {
                        processedDeliverables.set(title, d);
                    }
                    
                    if (externalId) {
                        deliverableIdMap.set(String(externalId), title);
                    }
                }
            });

            eData.forEach((row: any) => {
                const epicTitle = getRowValue(row, 'Epic Name', 'epic_name', 'Title', 'Name', 'Epic');
                const description = getRowValue(row, 'Epic User Story', 'epic_user_story', 'Epic Description', 'Description') || "";
                
                const parentId = getRowValue(row, 'Deliverable ID', 'deliverable_id');
                const parentName = getRowValue(row, 'Deliverable Name', 'deliverable_name', 'Deliverable', 'Parent');
                
                let targetDeliverableName = null;

                if (parentId && deliverableIdMap.has(String(parentId))) {
                    targetDeliverableName = deliverableIdMap.get(String(parentId));
                } else if (parentName && processedDeliverables.has(parentName)) {
                    targetDeliverableName = parentName;
                }
                
                if (epicTitle && targetDeliverableName && processedDeliverables.has(targetDeliverableName)) {
                     processedDeliverables.get(targetDeliverableName)!.epics.push({
                        id: `e-${Date.now()}-${Math.random()}`,
                        title: epicTitle,
                        description: description
                     });
                }
            });

        } else {
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);

            const hasDeliverableCol = data.length > 0 && (getRowValue(data[0], 'Deliverable', 'Deliverable Name', 'deliverable_name') !== undefined);
            
            if (hasDeliverableCol) {
                data.forEach((row: any) => {
                    const dName = getRowValue(row, 'Deliverable', 'Deliverable Name', 'deliverable_name');
                    const eName = getRowValue(row, 'Epic', 'Epic Name', 'epic_name', 'Title');
                    
                    if (dName) {
                        if (!processedDeliverables.has(dName)) {
                            processedDeliverables.set(dName, {
                                id: `d-${Date.now()}-${Math.random()}`,
                                title: dName,
                                description: getRowValue(row, 'Deliverable Description', 'deliverable_description') || "",
                                epics: []
                            });
                        }

                        if (eName) {
                            processedDeliverables.get(dName)!.epics.push({
                                id: `e-${Date.now()}-${Math.random()}`,
                                title: eName,
                                description: getRowValue(row, 'Description', 'Epic Description', 'epic_description') || ""
                            });
                        }
                    }
                });
            } else {
                 data.forEach((row: any) => {
                    const title = getRowValue(row, 'Title', 'Name') || Object.values(row)[0];
                    if (title && typeof title === 'string') {
                         processedDeliverables.set(title, {
                                id: `d-${Date.now()}-${Math.random()}`,
                                title: title,
                                description: getRowValue(row, 'Description') || "",
                                epics: []
                            });
                    }
                 });
            }
        }

        if (processedDeliverables.size > 0) {
            const epicCount = Array.from(processedDeliverables.values()).reduce((sum, d) => sum + d.epics.length, 0);
            setDeliverables([...deliverables, ...Array.from(processedDeliverables.values())]);
            toast({
                title: "Import Successful",
                description: `Imported ${processedDeliverables.size} deliverables with ${epicCount} epics from Excel.`,
            });
        } else {
            toast({
                title: "Import Failed",
                description: "Could not find valid data structure. Please check column headers.",
                variant: "destructive"
            });
        }

      } catch (error) {
        console.error("Error reading file:", error);
        toast({
            title: "Import Error",
            description: "Failed to parse the Excel file.",
            variant: "destructive"
        });
      }
    };
    reader.readAsBinaryString(file);
    
    e.target.value = '';
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = projectTemplatesData.find(t => t.id === templateId);
    if (template) {
      setProjectData(prev => ({
        ...prev,
        templateId,
        name: prev.name || template.name,
        description: prev.description || template.description,
        frameworkId: template.defaultFrameworkId || ""
      }));

      const framework = frameworkTemplates.find(f => f.id === template.defaultFrameworkId);
      if (framework) {
        const frameworkStages = (framework.defaultStages || [])
            .map((sid: string) => stageTemplates.find((st: any) => st.id === sid))
            .filter(Boolean)
            .map((st: any) => ({...st, taskCreationMode: 'per_epic' as const}));
        setStages(frameworkStages);
      }

      if (template.defaultDeliverables) {
        const templateDeliverables = template.defaultDeliverables.map((did: string) => {
          const dTemplate = deliverableTemplates.find((dt: any) => dt.id === did);
          if (!dTemplate) return null;
          
          return {
            id: `d-${Date.now()}-${Math.random()}`,
            title: dTemplate.title,
            description: dTemplate.description,
            epics: (dTemplate.defaultEpics || []).map((eid: string) => {
                const eTemplate = epicTemplates.find((et: any) => et.id === eid);
                if (!eTemplate) return null;
                return {
                    id: `e-${Date.now()}-${Math.random()}`,
                    title: eTemplate.title,
                    description: eTemplate.description,
                    tasks: [] 
                };
            }).filter(Boolean)
          };
        }).filter(Boolean);
        setDeliverables(templateDeliverables);
      }

      const uniqueRoleIds = new Set<string>();
      
      if (template.defaultRoles) {
        template.defaultRoles.forEach((rid: string) => uniqueRoleIds.add(rid));
      }

      if (framework) {
        (framework.defaultStages || []).forEach((sid: string) => {
            const stage = stageTemplates.find((st: any) => st.id === sid);
            if (stage) {
                (stage.defaultRoles || []).forEach((rid: string) => uniqueRoleIds.add(rid));
                
                (stage.defaultTasks || []).forEach((tid: string) => {
                    const task = taskTemplates.find((t: any) => t.id === tid);
                    if (task?.assignedRoleId) {
                        uniqueRoleIds.add(task.assignedRoleId);
                    }
                });
            }
        });
      }

      const aggregatedRoles = Array.from(uniqueRoleIds).map(rid => {
          const rTemplate = roleTemplates.find((rt: any) => rt.id === rid);
          if (!rTemplate) return null;
          return {
              id: `r-${Date.now()}-${Math.random()}`,
              name: rTemplate.name,
              description: rTemplate.description,
              roleType: rTemplate.defaultRoleType,
              assigneeId: null
          };
      }).filter(Boolean) as WizardRole[];
      
      setRoles(aggregatedRoles);
    }
  };

  const handleFrameworkSelect = (frameworkId: string) => {
    setProjectData(prev => ({ ...prev, frameworkId }));
    const framework = frameworkTemplates.find(f => f.id === frameworkId);
    if (framework) {
      const frameworkStages = (framework.defaultStages || [])
        .map((sid: string) => stageTemplates.find((st: any) => st.id === sid))
        .filter(Boolean)
        .map((st: any) => ({...st, taskCreationMode: 'per_epic' as const}));
      setStages(frameworkStages);

      const uniqueRoleIds = new Set<string>();
      
      if (projectData.templateId) {
          const template = projectTemplatesData.find(t => t.id === projectData.templateId);
          template?.defaultRoles?.forEach((rid: string) => uniqueRoleIds.add(rid));
      }

      (framework.defaultStages || []).forEach((sid: string) => {
          const stage = stageTemplates.find((st: any) => st.id === sid);
          if (stage) {
              (stage.defaultRoles || []).forEach((rid: string) => uniqueRoleIds.add(rid));
              (stage.defaultTasks || []).forEach((tid: string) => {
                  const task = taskTemplates.find((t: any) => t.id === tid);
                  if (task?.assignedRoleId) {
                      uniqueRoleIds.add(task.assignedRoleId);
                  }
              });
          }
      });

      const aggregatedRoles = Array.from(uniqueRoleIds).map(rid => {
          const rTemplate = roleTemplates.find((rt: any) => rt.id === rid);
          if (!rTemplate) return null;
          return {
              id: `r-${Date.now()}-${Math.random()}`,
              name: rTemplate.name,
              description: rTemplate.description,
              roleType: rTemplate.defaultRoleType,
              assigneeId: null
          };
      }).filter(Boolean) as WizardRole[];
      
      setRoles(aggregatedRoles);
    }
  };

  const handleCreateProject = async () => {
    if (!projectData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a project name.",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      const newProject = await createProject({
        name: projectData.name,
        description: projectData.description,
        status: "Upcoming",
        startDate: projectData.startDate || null,
        deadline: projectData.dueDate || new Date().toISOString().split('T')[0],
        frameworkId: null,
        progress: 0,
        sprintDurationWeeks: projectData.sprintDurationWeeks || null,
        client: projectData.client || null,
        ownerId: projectData.ownerId || null
      });
      
      if (!newProject?.id) {
        throw new Error("Failed to create project");
      }
      
      const createdStages: Array<{ 
        templateId: string;
        createdStageId: string; 
        taskCreationMode: 'none' | 'once' | 'per_epic'; 
        defaultTasks: string[];
        name: string;
      }> = [];
      
      for (let i = 0; i < stages.length; i++) {
        const stageTemplate = stages[i];
        const newStage = await createProjectStage({
          projectId: newProject.id,
          name: stageTemplate.name,
          description: stageTemplate.description || "",
          order: i,
          type: stageTemplate.type || "standard",
          status: "pending"
        });
        
        if (newStage?.id) {
          createdStages.push({
            templateId: stageTemplate.id,
            createdStageId: newStage.id,
            taskCreationMode: stageTemplate.taskCreationMode || 'per_epic',
            defaultTasks: stageTemplate.defaultTasks || [],
            name: stageTemplate.name
          });
        }
      }
      
      const stageIdMap = new Map<string, string>();
      createdStages.forEach(s => stageIdMap.set(s.templateId, s.createdStageId));
      
      const allStageIds = createdStages.map(s => s.createdStageId).filter(Boolean);
      
      let productManagementEpicId: string | null = null;
      let projectManagementEpicId: string | null = null;
      
      const projectOpsDeliverable = await createDeliverable({
        projectId: newProject.id,
        title: "Project Operations",
        description: "Project-wide management activities and cross-cutting tasks",
        status: "Active",
        ownerId: projectData.ownerId || "1",
        startDate: projectData.startDate || new Date().toISOString().split('T')[0],
        dueDate: projectData.dueDate || new Date().toISOString().split('T')[0],
        progress: 0
      });
      
      if (projectOpsDeliverable?.id) {
        const pmEpic = await createEpic({
          deliverableId: projectOpsDeliverable.id,
          title: "Project Management",
          description: "Project coordination, reporting, and governance activities",
          status: "Active",
          ownerId: projectData.ownerId || "1",
          startDate: projectData.startDate || new Date().toISOString().split('T')[0],
          endDate: projectData.dueDate || new Date().toISOString().split('T')[0],
          progress: 0,
          stageIds: allStageIds
        });
        if (pmEpic?.id) {
          projectManagementEpicId = pmEpic.id;
        }
        
        const prodMgmtEpic = await createEpic({
          deliverableId: projectOpsDeliverable.id,
          title: "Product Management",
          description: "Product requirements, acceptance, and delivery activities",
          status: "Active",
          ownerId: projectData.ownerId || "1",
          startDate: projectData.startDate || new Date().toISOString().split('T')[0],
          endDate: projectData.dueDate || new Date().toISOString().split('T')[0],
          progress: 0,
          stageIds: allStageIds
        });
        if (prodMgmtEpic?.id) {
          productManagementEpicId = prodMgmtEpic.id;
        }
      }
      
      const businessEpics: { id: string; title: string }[] = [];
      
      for (const deliverable of deliverables) {
        const newDeliverable = await createDeliverable({
          projectId: newProject.id,
          title: deliverable.title,
          description: deliverable.description || "",
          status: "Active",
          ownerId: projectData.ownerId || "1",
          startDate: projectData.startDate || new Date().toISOString().split('T')[0],
          dueDate: projectData.dueDate || new Date().toISOString().split('T')[0],
          progress: 0
        });
        
        if (newDeliverable?.id && deliverable.epics?.length > 0) {
          for (const epic of deliverable.epics) {
            const newEpic = await createEpic({
              deliverableId: newDeliverable.id,
              title: epic.title,
              description: epic.description || "",
              status: "Active",
              ownerId: projectData.ownerId || "1",
              startDate: projectData.startDate || new Date().toISOString().split('T')[0],
              endDate: projectData.dueDate || new Date().toISOString().split('T')[0],
              progress: 0,
              stageIds: allStageIds
            });
            
            if (newEpic?.id) {
              businessEpics.push({ id: newEpic.id, title: epic.title });
            }
          }
        }
      }
      
      let totalTasksCreated = 0;
      
      for (let i = 0; i < stages.length; i++) {
        const wizardStage = stages[i];
        const createdStage = createdStages.find(cs => cs.templateId === wizardStage.id);
        if (!createdStage) continue;
        
        for (const taskDraft of wizardStage.tasks) {
          if (taskDraft.scope === 'once') {
            if (productManagementEpicId) {
              await createTask({
                project: projectData.name,
                projectId: newProject.id,
                title: taskDraft.title,
                description: taskDraft.description || "",
                status: "Todo",
                priority: taskDraft.priority || "Medium",
                stageId: createdStage.createdStageId,
                epicId: productManagementEpicId,
                effort: 1,
                deadline: projectData.dueDate || new Date().toISOString().split('T')[0],
                estimateHours: taskDraft.estimateHours || 0,
                tags: []
              });
              totalTasksCreated++;
            }
          } else if (taskDraft.scope === 'per_epic') {
            for (const businessEpic of businessEpics) {
              await createTask({
                project: projectData.name,
                projectId: newProject.id,
                title: taskDraft.title,
                description: taskDraft.description || "",
                status: "Todo",
                priority: taskDraft.priority || "Medium",
                stageId: createdStage.createdStageId,
                epicId: businessEpic.id,
                effort: 1,
                deadline: projectData.dueDate || new Date().toISOString().split('T')[0],
                estimateHours: taskDraft.estimateHours || 0,
                tags: []
              });
              totalTasksCreated++;
            }
          }
        }
      }
      
      const totalEpics = (projectManagementEpicId ? 1 : 0) + (productManagementEpicId ? 1 : 0) + businessEpics.length;
      
      let totalMilestonesCreated = 0;
      for (const milestone of milestones) {
        const rule = milestone.rule || { scopeType: 'all', completionMode: 'all_tasks', completionTargetPercent: 100 };
        const resolvedStageId = rule.scopeType === 'stage' && rule.scopeEntityId 
          ? stageIdMap.get(rule.scopeEntityId) || null 
          : null;
        
        await createMilestone({
          id: crypto.randomUUID(),
          projectId: newProject.id,
          name: milestone.name,
          description: milestone.description || "",
          phase: milestone.phase || "plan_strategy",
          stageId: resolvedStageId,
          targetDate: milestone.targetDate,
          status: "planned",
          ownerId: milestone.ownerId,
          scopeType: rule.scopeType,
          completionMode: rule.completionMode,
          completionTargetPercent: rule.completionTargetPercent || 100,
          isBillingGate: milestone.isBillingGate,
          tags: []
        });
        totalMilestonesCreated++;
      }
      
      toast({
        title: "Project Created",
        description: `${projectData.name} has been successfully created with ${totalEpics} epics, ${totalTasksCreated} tasks, and ${totalMilestonesCreated} milestones.`,
      });
      
      setLocation(`/projects/${newProject.id}`);
      
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const milestoneTemplates: any[] = [];
  const templateSnippets: WizardTemplateSnippet[] = [];
  
  const roleTypes: WizardRoleType[] = [
    { id: "rt-1", label: "Development", description: "Software development roles" },
    { id: "rt-2", label: "Design", description: "UI/UX design roles" },
    { id: "rt-3", label: "Management", description: "Project management roles" },
    { id: "rt-4", label: "QA", description: "Quality assurance roles" },
    { id: "rt-5", label: "Analysis", description: "Business analysis roles" },
  ];
  
  const eligibleUsers = new Map<string, any[]>();
  roleTypes.forEach(rt => {
    eligibleUsers.set(rt.id, users);
  });

  const handleSnippetApply = (snippetId: string) => {
    const snippet = templateSnippets.find(s => s.id === snippetId);
    if (!snippet) return;
    
    const newStages = snippet.stageTemplateIds.map((sid, idx) => {
      const template = stageTemplates.find((t: any) => t.id === sid);
      if (!template) return null;
      return {
        id: `stage-${Date.now()}-${idx}`,
        name: template.name,
        description: template.description || "",
        taskCreationMode: 'per_epic' as const,
        defaultTasks: template.defaultTasks || [],
        defaultRoles: template.defaultRoles || [],
        type: 'standard' as const,
        tasks: []
      };
    }).filter(Boolean) as WizardStage[];
    
    setStages([...stages, ...newStages]);
    
    toast({
      title: "Template Applied",
      description: `Applied "${snippet.name}" snippet with ${newStages.length} stages.`,
    });
  };

  const stepProps = {
    projectData,
    setProjectData,
    deliverables,
    setDeliverables,
    stages,
    setStages,
    milestones,
    setMilestones,
    roles,
    setRoles,
    frameworkTemplates,
    stageTemplates,
    projectTemplatesData,
    deliverableTemplates,
    epicTemplates,
    taskTemplates,
    roleTemplates,
    milestoneTemplates,
    templateSnippets,
    roleTypes,
    eligibleUsers,
    users,
    onTemplateSelect: handleTemplateSelect,
    onFrameworkSelect: handleFrameworkSelect,
    onFileUpload: handleFileUpload,
    onSnippetApply: handleSnippetApply,
  };

  return (
    <Shell>
      <div className="py-6">
        <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-primary">
              {isImportMode ? 'Import Project' : 'New Project Wizard'}
            </h1>
            <p className="text-muted-foreground">
              {isImportMode 
                ? 'Review and adjust the imported data, then create your project.'
                : 'Follow the steps to set up your new project structure.'}
            </p>
        </div>

        {isImportMode && importContext?.state?.adapterResult && (
          <ImportSummaryBanner
            fileName={importContext.state.sourceFileName || 'Unknown file'}
            stats={importContext.state.adapterResult.stats}
            warnings={importContext.state.adapterResult.warnings}
            onClearImport={() => {
              importContext.clearImport();
              setProjectData({
                name: "",
                description: "",
                templateId: "",
                client: "",
                startDate: new Date().toISOString().split('T')[0],
                dueDate: "",
                sprintDurationWeeks: 2,
                ownerId: users[0]?.id || "",
              });
              setDeliverables([]);
              setStagesRaw([]);
              setMilestones([]);
              setRoles([]);
              setImportInitialized(false);
            }}
          />
        )}

        <div className="mb-8">
            <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10" />
                {STEPS.map((step, idx) => {
                    const isActive = currentStep === step.id;
                    const isCompleted = currentStep > step.id;
                    const Icon = STEP_ICONS[idx];

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2">
                            <div 
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                                    isActive ? "border-primary bg-primary text-primary-foreground" : 
                                    isCompleted ? "border-primary bg-primary/20 text-primary" : "border-muted bg-background text-muted-foreground"
                                )}
                            >
                                {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                            </div>
                            <div className="text-center hidden sm:block">
                                <div className={cn("text-sm font-medium", isActive ? "text-primary" : "text-muted-foreground")}>{step.title}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        <Card className="min-h-[500px] flex flex-col">
            <CardHeader>
                <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
                <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Loading templates...</p>
                    </div>
                ) : (
                  <>
                    {currentStep === 1 && <StepBasics {...stepProps} />}
                    {currentStep === 2 && <StepWorkBreakdown {...stepProps} />}
                    {currentStep === 3 && <StepStageConfig {...stepProps} />}
                    {currentStep === 4 && <StepTeamRoles {...stepProps} />}
                    {currentStep === 5 && <StepReview {...stepProps} />}
                  </>
                )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
                <Button 
                    variant="outline" 
                    onClick={handleBack} 
                    disabled={currentStep === 1 || isCreating}
                >
                    <ChevronLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                
                <Button onClick={handleNext} disabled={isCreating} data-testid={currentStep === STEPS.length ? "button-create-project" : "button-next-step"}>
                    {isCreating ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating Project...
                        </>
                    ) : currentStep === STEPS.length ? (
                        <>Create Project <Save className="h-4 w-4 ml-2" /></>
                    ) : (
                        <>Next Step <ChevronRight className="h-4 w-4 ml-2" /></>
                    )}
                </Button>
            </CardFooter>
        </Card>
      </div>
    </Shell>
  );
}
