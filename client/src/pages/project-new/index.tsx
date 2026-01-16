import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
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
  Flag,
  AlertTriangle,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import { useImportOptional } from "@/context/import-context";
import { useCreationReport } from "@/context/creation-report-context";
import { 
  toWizardProjectData, 
  toWizardDeliverables, 
  toWizardStages, 
  toWizardMilestones,
  toWizardRoles
} from "@/lib/import-to-wizard-adapter";
import { ImportSummaryBanner } from "@/components/import/ImportFieldIndicator";
import type { CreationReport, FullProjectCreatePayload } from "@shared/creation-result-types";

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
  useRoleTemplates,
  useMilestoneTemplates,
  useDeliverableTypes,
  useEpicTypes,
  useTaskTypes
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
import { StepTaskAlignment } from "./step-task-alignment";
import { StepStageConfig } from "./step-stage-config";
import { StepTeamRoles } from "./step-team-roles";
import { StepReview } from "./step-review";
import { Link2 } from "lucide-react";

const STEP_ICONS = [Settings, Users, Layers, Package, Link2, Check];

export default function ProjectWizard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [importInitialized, setImportInitialized] = useState(false);
  const [pendingStepChange, setPendingStepChange] = useState<number | null>(null);
  const [showBackWarning, setShowBackWarning] = useState(false);
  const [showUnassignedTasksWarning, setShowUnassignedTasksWarning] = useState(false);
  const [unassignedTasksStats, setUnassignedTasksStats] = useState({ total: 0, unassigned: 0, fromImport: false });
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [pendingLeaveLocation, setPendingLeaveLocation] = useState<string | null>(null);
  
  const importContext = useImportOptional();
  const isImportMode = importContext?.state?.isImportMode || false;
  const { setReport, startCreating, finishCreating, failCreating } = useCreationReport();
  const queryClient = useQueryClient();
  
  const { data: frameworkTemplates = [], isLoading: loadingFrameworks } = useFrameworkTemplates();
  const { data: stageTemplates = [], isLoading: loadingStages } = useStageTemplates();
  const { data: projectTemplatesData = [], isLoading: loadingProjects } = useProjectTemplates();
  const { data: deliverableTemplates = [], isLoading: loadingDeliverables } = useDeliverableTemplates();
  const { data: epicTemplates = [], isLoading: loadingEpics } = useEpicTemplates();
  const { data: taskTemplates = [], isLoading: loadingTasks } = useTaskTemplates();
  const { data: roleTemplates = [], isLoading: loadingRoles } = useRoleTemplates();
  const { data: milestoneTemplatesData = [], isLoading: loadingMilestoneTemplates } = useMilestoneTemplates();
  const { data: users = [], isLoading: loadingUsers } = useUsers();
  
  // Types from admin defaults (for type selectors in wizard)
  const { data: deliverableTypes = [], isLoading: loadingDeliverableTypes } = useDeliverableTypes();
  const { data: epicTypes = [], isLoading: loadingEpicTypes } = useEpicTypes();
  const { data: taskTypes = [], isLoading: loadingTaskTypes } = useTaskTypes();
  
  const { createAsync: createProject } = useProjects();
  const { createAsync: createDeliverable } = useDeliverables();
  const { createAsync: createEpic } = useEpics();
  const { createAsync: createTask } = useTasks();
  const { createAsync: createProjectStage } = useProjectStages();
  const { createAsync: createMilestone } = useMilestones();
  
  const isLoading = loadingFrameworks || loadingStages || loadingProjects || 
                    loadingDeliverables || loadingEpics || loadingTasks || 
                    loadingRoles || loadingMilestoneTemplates || loadingUsers || 
                    loadingDeliverableTypes || loadingEpicTypes || loadingTaskTypes;
  
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
  
  // Check if user has unsaved work in the wizard
  const hasUnsavedWork = useMemo(() => {
    return projectData.name.trim() !== '' || 
           projectData.description.trim() !== '' ||
           deliverables.length > 0 ||
           stages.length > 0 ||
           roles.length > 0 ||
           milestones.length > 0;
  }, [projectData.name, projectData.description, deliverables, stages, roles, milestones]);
  
  // Warn user when trying to leave the page with unsaved work
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedWork && !isCreating) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedWork, isCreating]);
  
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
      
      // Debug logging for import flow
      console.log('[WIZARD-IMPORT] Adapter result received:', {
        projectName: adapter.projectData?.name?.value,
        deliverablesCount: adapter.deliverables?.length || 0,
        stagesCount: adapter.stages?.length || 0,
        milestonesCount: adapter.milestones?.length || 0,
        rolesCount: adapter.roles?.length || 0,
        warnings: adapter.warnings
      });
      
      if (adapter.deliverables?.length > 0) {
        console.log('[WIZARD-IMPORT] Deliverables:', adapter.deliverables.map((d: any) => ({
          id: d.id,
          title: d.title,
          epicsCount: d.epics?.length || 0
        })));
      }
      
      if (adapter.stages?.length > 0) {
        console.log('[WIZARD-IMPORT] Stages:', adapter.stages.map((s: any) => ({
          id: s.id,
          name: s.name,
          tasksCount: s.tasks?.length || 0
        })));
      }
      
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
      
      const importedStages = toWizardStages(
        adapter.stages, 
        importContext.state.userMappings,
        importContext.state.defaultUnassignedTo?.userId
      );
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

  // Initialize default stages when entering Stage Configuration (Step 3) with empty stages (non-import mode)
  useEffect(() => {
    if (currentStep === 3 && stages.length === 0 && !isImportMode) {
      const defaultStages: WizardStage[] = [
        { id: `stage-${Date.now()}-0`, name: 'Requirements', description: 'Gather and document project requirements', taskCreationMode: 'per_epic', defaultTasks: [], defaultRoles: [], type: 'standard', tasks: [] },
        { id: `stage-${Date.now()}-1`, name: 'Design', description: 'Create designs and technical specifications', taskCreationMode: 'per_epic', defaultTasks: [], defaultRoles: [], type: 'standard', tasks: [] },
        { id: `stage-${Date.now()}-2`, name: 'Development', description: 'Build and implement the solution', taskCreationMode: 'per_epic', defaultTasks: [], defaultRoles: [], type: 'standard', tasks: [] },
        { id: `stage-${Date.now()}-3`, name: 'QA', description: 'Test and validate the implementation', taskCreationMode: 'per_epic', defaultTasks: [], defaultRoles: [], type: 'standard', tasks: [] },
        { id: `stage-${Date.now()}-4`, name: 'Documentation', description: 'Create user guides and technical documentation', taskCreationMode: 'per_epic', defaultTasks: [], defaultRoles: [], type: 'standard', tasks: [] },
      ];
      setStages(defaultStages);
      toast({
        title: "Default Stages Added",
        description: "We've added standard project stages. You can customize them as needed.",
      });
    }
  }, [currentStep, stages.length, isImportMode]);

  // Ensure default "Management Activities" deliverable exists as the FIRST deliverable for Work Breakdown step (Step 4)
  // This provides a catch-all bucket for orphan tasks with 3 standard management epics
  // This deliverable is protected - it cannot be deleted, but its name can be edited
  // Once tasks (scope: 'once') from stages are applied to the Product Management epic
  useEffect(() => {
    if (currentStep === 4) {
      const hasMgmtActivities = deliverables.some(d => d.id.startsWith('d-mgmt-') || d.title === 'Management Activities');
      if (!hasMgmtActivities) {
        const timestamp = Date.now();
        
        // Get all "once" tasks from stages to apply to Product Management epic
        const onceTasks = stages.flatMap(stage => 
          stage.tasks.filter(t => t.scope === 'once').map(task => ({
            id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            title: task.title,
            description: task.description,
            priority: task.priority?.toLowerCase() || 'medium',
            estimateHours: task.estimateHours || 0,
            stageId: stage.id,
            milestoneId: task.milestoneId,
            assigneeId: task.assigneeId,
            taskTypeId: task.taskTypeId
          }))
        );
        
        const mgmtActivitiesDeliverable: WizardDeliverable = {
          id: `d-mgmt-${timestamp}`,
          title: 'Management Activities',
          description: 'Project management and coordination activities',
          epics: [
            {
              id: `e-mgmt-${timestamp}-1`,
              title: 'Project Management',
              description: 'Project coordination, planning, and oversight tasks',
              tasks: []
            },
            {
              id: `e-mgmt-${timestamp}-2`,
              title: 'Product Management',
              description: 'Product strategy, requirements, and backlog management tasks',
              tasks: onceTasks
            },
            {
              id: `e-mgmt-${timestamp}-3`,
              title: 'Client Management',
              description: 'Client communication, relationship, and stakeholder management tasks',
              tasks: []
            }
          ]
        };
        // Insert as first deliverable
        setDeliverables(prev => [mgmtActivitiesDeliverable, ...prev]);
      }
    }
  }, [currentStep, deliverables, stages]);

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
    // Step 1 is Project Basics - require project name
    if (currentStep === 1) {
      if (!projectData.name.trim()) {
        toast({
          title: "Project Name Required",
          description: "Please enter a project name before proceeding.",
          variant: "destructive"
        });
        return;
      }
    }
    
    // Step 2 is Team Assignment - sync roles from stages for team assignment dropdowns
    if (currentStep === 2) {
      syncRolesFromStagesAndTasks();
    }
    
    // Step 3 is Stage Configuration - no special validation needed
    
    // Step 4 is Work Breakdown - ensure deliverables have epics
    if (currentStep === 4) {
      const deliverablesWithoutEpics = deliverables.filter(d => !d.epics || d.epics.length === 0);
      
      if (deliverablesWithoutEpics.length > 0) {
        const updatedDeliverables = deliverables.map(d => {
          if (!d.epics || d.epics.length === 0) {
            return {
              ...d,
              epics: [{
                id: `e-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                title: d.title ? `${d.title} - General` : "General",
                description: "Auto-created epic for task alignment"
              }]
            };
          }
          return d;
        });
        setDeliverables(updatedDeliverables);
        toast({
          title: "Epics Added",
          description: `Created default epics for ${deliverablesWithoutEpics.length} deliverable(s) that had none.`,
        });
      }
      
      const deliverablesWithEmptyEpicTitles = deliverables.filter(d => 
        d.epics && d.epics.length > 0 && d.epics.every(e => !e.title.trim())
      );
      
      if (deliverablesWithEmptyEpicTitles.length > 0) {
        toast({
          title: "Epic Names Required",
          description: "Please enter a name for each epic before proceeding.",
          variant: "destructive"
        });
        return;
      }
    }
    
    // Step 5 is Task Alignment - validate orphan tasks are resolved
    if (currentStep === 5) {
      const hasImportedTasks = stages.some(stage => 
        stage.tasks.some(task => 
          task.mappingStatus && ['mapped', 'orphaned', 'manual', 'skipped'].includes(task.mappingStatus)
        )
      );
      
      if (hasImportedTasks) {
        const hasUnresolvedPerEpicTasks = stages.some(stage => 
          stage.tasks.some(task => 
            task.scope === 'per_epic' && 
            !task.assignedEpicId && 
            task.mappingStatus === 'orphaned'
          )
        );
        
        if (hasUnresolvedPerEpicTasks) {
          toast({
            title: "Unassigned Tasks",
            description: "Some per-epic tasks don't have an epic assigned. Please assign them to epics or mark them as skipped before proceeding.",
            variant: "destructive"
          });
          return;
        }
      }
    }
    
    proceedToNextStep();
  };

  const calculateTaskAssignmentStats = () => {
    let total = 0;
    let assigned = 0;
    let fromImport = false;
    
    stages.forEach(stage => {
      if (stage.tasks) {
        stage.tasks.forEach(task => {
          total++;
          const taskWithAssignee = task as any;
          if (taskWithAssignee.sourceAssigneeId || taskWithAssignee.assigneeId) {
            assigned++;
            if (taskWithAssignee.sourceAssigneeId) {
              fromImport = true;
            }
          }
        });
      }
    });
    
    deliverables?.forEach(deliverable => {
      deliverable.epics?.forEach(epic => {
        if (epic.tasks) {
          epic.tasks.forEach(task => {
            total++;
            if (task.assigneeId) {
              assigned++;
            }
          });
        }
      });
    });
    
    return { total, unassigned: total - assigned, fromImport };
  };

  const hasOrphanedImportedTasks = (): boolean => {
    return stages.some(stage => 
      stage.tasks.some(task => 
        task.mappingStatus === 'orphaned' && 
        task.scope === 'per_epic' && 
        !task.assignedEpicId
      )
    );
  };
  
  const shouldShowTaskAlignment = hasOrphanedImportedTasks();

  const proceedToNextStep = () => {
    if (currentStep < STEPS.length) {
      let nextStep = currentStep + 1;
      
      if (currentStep === 4 && nextStep === 5 && !shouldShowTaskAlignment) {
        nextStep = 6;
      }
      
      setCurrentStep(nextStep);
    } else {
      handleCreateProject();
    }
  };

  const confirmProceedWithUnassignedTasks = () => {
    setShowUnassignedTasksWarning(false);
    proceedToNextStep();
  };

  const getStepResetWarning = (fromStep: number, toStep: number): string | null => {
    if (toStep >= fromStep) return null;
    
    const warnings: string[] = [];
    
    if (toStep <= 2 && fromStep >= 4) {
      warnings.push("Stage configurations and task assignments");
    }
    if (toStep <= 3 && fromStep >= 5) {
      warnings.push("Role assignments");
    }
    if (toStep <= 1 && fromStep >= 2) {
      warnings.push("Work breakdown structure (deliverables and epics)");
    }
    
    if (warnings.length === 0) return null;
    return warnings.join(", ");
  };

  const handleStepSelect = (stepId: number) => {
    if (stepId === currentStep) return;
    
    let targetStep = stepId;
    
    if (stepId === 5 && !shouldShowTaskAlignment) {
      if (currentStep < 5) {
        targetStep = 6;
      } else {
        targetStep = 4;
      }
    }
    
    if (targetStep === currentStep) return;
    
    if (targetStep < currentStep) {
      if (targetStep === 5 && !shouldShowTaskAlignment && currentStep > 5) {
        targetStep = 4;
      }
      const warning = getStepResetWarning(currentStep, targetStep);
      if (warning) {
        setPendingStepChange(targetStep);
        setShowBackWarning(true);
        return;
      }
    }
    
    if (targetStep > currentStep) {
      for (let i = currentStep; i < targetStep; i++) {
        setCurrentStep(i);
      }
    }
    setCurrentStep(targetStep);
  };

  const confirmStepChange = () => {
    if (pendingStepChange !== null) {
      setCurrentStep(pendingStepChange);
      setPendingStepChange(null);
    }
    setShowBackWarning(false);
  };

  const cancelStepChange = () => {
    setPendingStepChange(null);
    setShowBackWarning(false);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      let prevStep = currentStep - 1;
      
      if (currentStep === 6 && prevStep === 5 && !shouldShowTaskAlignment) {
        prevStep = 4;
      }
      
      const warning = getStepResetWarning(currentStep, prevStep);
      if (warning) {
        setPendingStepChange(prevStep);
        setShowBackWarning(true);
        return;
      }
      setCurrentStep(prevStep);
    }
  };

  const handleSkipWizard = async () => {
    if (!projectData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a project name.",
        variant: "destructive"
      });
      return;
    }
    
    if (!projectData.startDate || !projectData.dueDate) {
      toast({
        title: "Validation Error",
        description: "Please set start and end dates.",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreating(true);
    
    startCreating({
      projectName: projectData.name,
      expectedCounts: {
        stages: 0,
        deliverables: 0,
        epics: 0,
        tasks: 0,
        milestones: 0,
        roles: 0
      }
    });
    
    setLocation('/projects/new/summary');
    
    try {
      const response = await fetch('/api/projects/full-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: {
            name: projectData.name,
            description: projectData.description || '',
            status: 'Upcoming',
            startDate: projectData.startDate,
            deadline: projectData.dueDate,
            frameworkId: null,
            sprintDurationWeeks: projectData.sprintDurationWeeks || null,
            ownerId: projectData.ownerId || null,
            client: projectData.client || null,
            riskLevel: null
          },
          stages: [],
          deliverables: [],
          milestones: [],
          roles: []
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create project');
      }
      
      const result = await response.json();
      
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      finishCreating({
        projectId: result.project?.id || null,
        projectName: projectData.name,
        overallSuccess: true,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        summary: {
          total: 1,
          succeeded: 1,
          failed: 0
        },
        entityResults: [],
        breakdownByType: {}
      });
      
    } catch (error: any) {
      console.error('Project creation failed:', error);
      failCreating(`Failed to create project: ${error.message}`, projectData.name);
    } finally {
      setIsCreating(false);
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
      const stageTemplateIds = framework?.defaultStages || [];
      
      if (framework) {
        const frameworkStages = stageTemplateIds
            .map((sid: string) => stageTemplates.find((st: any) => st.id === sid))
            .filter(Boolean)
            .map((st: any) => ({...st, taskCreationMode: 'per_epic' as const}));
        setStages(frameworkStages);
        
        // Load milestone templates linked to these stages
        const linkedMilestoneTemplates = milestoneTemplatesData.filter(
          (mt: any) => mt.stageTemplateId && stageTemplateIds.includes(mt.stageTemplateId)
        );
        
        if (linkedMilestoneTemplates.length > 0) {
          const wizardMilestones: WizardMilestone[] = linkedMilestoneTemplates.map((mt: any, idx: number) => {
            const linkedStage = frameworkStages.find((stage: any) => stage.id === mt.stageTemplateId);
            
            return {
              id: `ms-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
              name: mt.name,
              description: mt.description || '',
              targetDate: linkedStage?.endDate || projectData.dueDate || '',
              isBillingGate: mt.isBillingGate || false,
              ownerId: projectData.ownerId || '',
              rule: {
                scopeType: mt.scopeType || 'deliverable',
                completionMode: mt.completionMode || 'percentage',
                completionTargetPercent: mt.completionTargetPercent || 100
              },
              scopeRules: mt.defaultScopeRules || []
            };
          });
          setMilestones(wizardMilestones);
        } else {
          setMilestones([]);
        }
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
        stageTemplateIds.forEach((sid: string) => {
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
      const stageTemplateIds = framework.defaultStages || [];
      const frameworkStages = stageTemplateIds
        .map((sid: string) => stageTemplates.find((st: any) => st.id === sid))
        .filter(Boolean)
        .map((st: any) => ({...st, taskCreationMode: 'per_epic' as const}));
      setStages(frameworkStages);

      // Load milestone templates linked to these stages
      const linkedMilestoneTemplates = milestoneTemplatesData.filter(
        (mt: any) => mt.stageTemplateId && stageTemplateIds.includes(mt.stageTemplateId)
      );
      
      if (linkedMilestoneTemplates.length > 0) {
        const wizardMilestones: WizardMilestone[] = linkedMilestoneTemplates.map((mt: any, idx: number) => {
          const linkedStage = frameworkStages.find((stage: any) => stage.id === mt.stageTemplateId);
          
          return {
            id: `ms-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
            name: mt.name,
            description: mt.description || '',
            targetDate: linkedStage?.endDate || projectData.dueDate || '',
            isBillingGate: mt.isBillingGate || false,
            ownerId: projectData.ownerId || '',
            rule: {
              scopeType: mt.scopeType || 'deliverable',
              completionMode: mt.completionMode || 'percentage',
              completionTargetPercent: mt.completionTargetPercent || 100
            },
            scopeRules: mt.defaultScopeRules || []
          };
        });
        setMilestones(wizardMilestones);
      } else {
        setMilestones([]);
      }

      const uniqueRoleIds = new Set<string>();
      
      if (projectData.templateId) {
          const template = projectTemplatesData.find(t => t.id === projectData.templateId);
          template?.defaultRoles?.forEach((rid: string) => uniqueRoleIds.add(rid));
      }

      stageTemplateIds.forEach((sid: string) => {
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
    
    if (!projectData.startDate || !projectData.dueDate) {
      toast({
        title: "Validation Error",
        description: "Please enter project start and end dates.",
        variant: "destructive"
      });
      return;
    }
    
    if (new Date(projectData.startDate) > new Date(projectData.dueDate)) {
      toast({
        title: "Validation Error",
        description: "Project start date must be before the end date.",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreating(true);
    
    const totalEpics = deliverables.reduce((sum, d) => sum + (d.epics?.length || 0), 0);
    const stageTasks = stages.reduce((sum, s) => sum + (s.tasks?.length || 0), 0);
    const epicTasks = deliverables.reduce((sum, d) => 
      sum + d.epics.reduce((eSum, e) => eSum + (e.tasks?.length || 0), 0), 0);
    const totalTasks = stageTasks + epicTasks;
    
    startCreating({
      projectName: projectData.name,
      expectedCounts: {
        stages: stages.length,
        deliverables: deliverables.length,
        epics: totalEpics,
        tasks: totalTasks,
        milestones: milestones.length,
        roles: roles.length
      }
    });
    
    setLocation('/projects/new/summary');
    
    try {
      const payload: FullProjectCreatePayload = {
        project: {
          name: projectData.name,
          description: projectData.description || '',
          status: 'Upcoming',
          startDate: projectData.startDate || new Date().toISOString().split('T')[0],
          deadline: projectData.dueDate || new Date().toISOString().split('T')[0],
          frameworkId: projectData.frameworkId && projectData.frameworkId.trim() !== '' ? projectData.frameworkId : null,
          sprintDurationWeeks: projectData.sprintDurationWeeks || null,
          ownerId: projectData.ownerId || null,
          client: projectData.client || null,
          riskLevel: null
        },
        stages: stages.map((stage, index) => ({
          id: stage.id,
          name: stage.name,
          description: stage.description || '',
          order: index,
          type: stage.type || 'standard',
          startDate: stage.startDate || null,
          endDate: stage.endDate || null,
          tasks: (stage.tasks || []).map((task, taskIndex) => ({
            id: task.id || `task-${Date.now()}-${taskIndex}`,
            title: task.title,
            description: task.description || '',
            priority: task.priority || 'Medium',
            estimateHours: task.estimateHours || 0,
            scope: task.scope || 'per_epic',
            order: taskIndex,
            assignedEpicId: task.assignedEpicId,
            assignedEpicTitle: task.assignedEpicTitle,
            mappingStatus: task.mappingStatus,
            assigneeId: task.assigneeId || null,
            startDate: task.startDate || stage.startDate || null,
            deadline: task.deadline || stage.endDate || null
          }))
        })),
        deliverables: deliverables.map(del => ({
          id: del.id,
          title: del.title,
          description: del.description || '',
          epics: (del.epics || []).map(epic => ({
            id: epic.id,
            title: epic.title,
            description: epic.description || '',
            tasks: (epic.tasks || []).map((task, taskIndex) => ({
              id: task.id || `epic-task-${Date.now()}-${taskIndex}`,
              title: task.title,
              description: task.description || '',
              priority: task.priority || 'Medium',
              estimateHours: task.estimateHours || 0,
              stageId: task.stageId || null,
              milestoneId: task.milestoneId || null,
              assigneeId: task.assigneeId || null,
              taskTypeId: task.taskTypeId || null,
              order: taskIndex
            }))
          }))
        })),
        milestones: milestones.map(m => ({
          id: m.id,
          name: m.name,
          description: m.description || '',
          targetDate: m.targetDate,
          ownerId: m.ownerId,
          isBillingGate: m.isBillingGate || false,
          rule: m.rule
        })),
        roles: roles.map(r => ({
          id: r.id,
          roleType: r.roleType || 'member',
          roleTypeId: r.roleTypeId || null,
          userId: r.assigneeId || null,
          allocation: 100
        })),
        importMetadata: isImportMode && importContext?.state?.sourceFileName ? {
          source: importContext.state.sourceFileName || 'imported',
          importedAt: new Date().toISOString()
        } : undefined
      };
      
      const response = await fetch('/api/projects/full-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const report: CreationReport = await response.json();
      
      if (!response.ok && !report.projectId) {
        throw new Error(report.fatalError || 'Failed to create project');
      }
      
      if (isImportMode && importContext?.clearImport) {
        importContext.clearImport();
      }
      
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["deliverables"] });
      queryClient.invalidateQueries({ queryKey: ["epics"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
      queryClient.invalidateQueries({ queryKey: ["projectStages"] });
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (report.projectId) {
        queryClient.invalidateQueries({ queryKey: ["projects", report.projectId] });
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${report.projectId}/deliverables`] });
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${report.projectId}/epics`] });
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${report.projectId}/tasks`] });
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${report.projectId}/milestones`] });
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${report.projectId}/stages`] });
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${report.projectId}/sprints`] });
      }
      
      finishCreating(report);
      
    } catch (error) {
      console.error("Error creating project:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'object' && error !== null && 'message' in error
          ? String((error as any).message)
          : 'An unexpected error occurred';
      failCreating(errorMessage || "Failed to create project. Please try again.", projectData.name);
    } finally {
      setIsCreating(false);
    }
  };

  const templateSnippets: WizardTemplateSnippet[] = [];
  
  const roleTypes: WizardRoleType[] = useMemo(() => {
    if (roleTemplates && roleTemplates.length > 0) {
      return roleTemplates.map((rt: any) => ({
        id: rt.id,
        label: rt.name || rt.title || rt.label,
        description: rt.description || ''
      }));
    }
    return [
      { id: "rt-1", label: "Development", description: "Software development roles" },
      { id: "rt-2", label: "Design", description: "UI/UX design roles" },
      { id: "rt-3", label: "Management", description: "Project management roles" },
      { id: "rt-4", label: "QA", description: "Quality assurance roles" },
      { id: "rt-5", label: "Analysis", description: "Business analysis roles" },
    ];
  }, [roleTemplates]);
  
  const eligibleUsers = useMemo(() => {
    const map = new Map<string, any[]>();
    roleTypes.forEach(rt => {
      map.set(rt.id, users);
    });
    return map;
  }, [roleTypes, users]);

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

  // Reset Stage Configuration - regenerates tasks from import data or stage templates
  const handleResetStageConfiguration = () => {
    if (isImportMode && importContext?.state?.adapterResult) {
      // Re-import from the original adapter result
      const adapter = importContext.state.adapterResult;
      
      // Regenerate deliverables with tasks
      const importedDeliverables = toWizardDeliverables(adapter.deliverables);
      if (importedDeliverables.length > 0) {
        setDeliverables(importedDeliverables);
      }
      
      // Regenerate stages with tasks
      const importedStages = toWizardStages(
        adapter.stages, 
        importContext.state.userMappings,
        importContext.state.defaultUnassignedTo?.userId
      );
      if (importedStages.length > 0) {
        setStagesRaw(importedStages);
      }
      
      toast({
        title: "Configuration Reset",
        description: "Tasks have been regenerated from the original import file.",
      });
    } else {
      // Non-import mode: regenerate tasks from stage templates
      const resetDeliverables = deliverables.map(d => ({
        ...d,
        epics: d.epics.map(e => ({
          ...e,
          tasks: stages.flatMap((stage: WizardStage) => 
            stage.tasks
              .filter(t => t.scope === 'per_epic')
              .map(task => ({
                id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                title: task.title,
                description: task.description,
                priority: task.priority?.toLowerCase() || 'medium',
                estimateHours: task.estimateHours || 0,
                stageId: stage.id,
                milestoneId: task.milestoneId,
                assigneeId: task.assigneeId,
                taskTypeId: task.taskTypeId
              }))
          )
        }))
      }));
      setDeliverables(resetDeliverables);
      
      toast({
        title: "Configuration Reset",
        description: "Tasks have been regenerated from stage templates.",
      });
    }
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
    deliverableTypes,
    epicTypes,
    taskTypes,
    milestoneTemplates: milestoneTemplatesData,
    templateSnippets,
    roleTypes,
    eligibleUsers,
    users,
    onTemplateSelect: handleTemplateSelect,
    onFrameworkSelect: handleFrameworkSelect,
    onFileUpload: handleFileUpload,
    onSnippetApply: handleSnippetApply,
    onSkipWizard: handleSkipWizard,
    isImportMode,
    onResetStageConfiguration: handleResetStageConfiguration,
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

        <div className="sticky top-0 z-20 bg-background pb-4 pt-2 -mt-2 mb-8 border-b">
            <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10" />
                {STEPS.map((step, idx) => {
                    const isActive = currentStep === step.id;
                    const isCompleted = currentStep > step.id;
                    const Icon = STEP_ICONS[idx];
                    const isTaskAlignmentStep = step.id === 5;
                    const willBeSkipped = isTaskAlignmentStep && !shouldShowTaskAlignment;
                    const isSkippedAndPast = willBeSkipped && currentStep > 5;

                    return (
                        <div key={step.id} className={cn(
                            "flex flex-col items-center gap-2 bg-background px-2",
                            willBeSkipped && currentStep < 5 && "opacity-50"
                        )}>
                            <div 
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                                    isActive ? "border-primary bg-primary text-primary-foreground" : 
                                    isCompleted || isSkippedAndPast ? "border-primary bg-primary/20 text-primary" : 
                                    willBeSkipped && currentStep < 5 ? "border-dashed border-muted" : "border-muted bg-background text-muted-foreground"
                                )}
                            >
                                {isCompleted || isSkippedAndPast ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                            </div>
                            <div className="text-center hidden sm:block">
                                <div className={cn("text-sm font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                                    {step.title}
                                    {willBeSkipped && currentStep < 5 && <span className="text-xs ml-1">(skip)</span>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        <AlertDialog open={showBackWarning} onOpenChange={setShowBackWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Going Back May Reset Data
              </AlertDialogTitle>
              <AlertDialogDescription>
                Going back to <strong>{pendingStepChange ? STEPS[pendingStepChange - 1]?.title : ''}</strong> may reset some of your progress. The following may need to be reconfigured:
                <br /><br />
                <span className="text-amber-600 font-medium">
                  {pendingStepChange && getStepResetWarning(currentStep, pendingStepChange)}
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelStepChange}>Stay Here</AlertDialogCancel>
              <AlertDialogAction onClick={confirmStepChange} className="bg-amber-600 hover:bg-amber-700">
                Go Back Anyway
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showUnassignedTasksWarning} onOpenChange={setShowUnassignedTasksWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-500" />
                Unassigned Tasks
              </AlertDialogTitle>
              <AlertDialogDescription>
                <strong>{unassignedTasksStats.unassigned}</strong> of <strong>{unassignedTasksStats.total}</strong> tasks 
                do not have assignees yet.
                {unassignedTasksStats.fromImport && (
                  <span className="block mt-2 text-green-600">
                    Some tasks from your import already have assignees preserved.
                  </span>
                )}
                <span className="block mt-2">
                  You can assign people to tasks after the project is created, or go back to assign roles now.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowUnassignedTasksWarning(false)}>
                Go Back to Assign
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmProceedWithUnassignedTasks} className="bg-primary hover:bg-primary/90">
                Continue Anyway
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showLeaveWarning} onOpenChange={setShowLeaveWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Leave Project Wizard?
              </AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved work in this wizard. If you leave now, all your progress will be lost.
                <span className="block mt-2 font-medium text-amber-600">
                  This includes any project details, team assignments, stages, and task configurations you've set up.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setShowLeaveWarning(false); setPendingLeaveLocation(null); }}>
                Stay and Continue
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  setShowLeaveWarning(false);
                  if (pendingLeaveLocation) {
                    setLocation(pendingLeaveLocation);
                  }
                  setPendingLeaveLocation(null);
                }} 
                className="bg-destructive hover:bg-destructive/90"
              >
                Leave Anyway
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Card className="flex flex-col">
            <CardHeader className="sticky top-[88px] z-30 bg-muted/50 border-b py-4">
              <div className="flex items-center justify-between gap-4">
                {currentStep > 1 ? (
                  <Button 
                      variant="outline" 
                      onClick={handleBack} 
                      disabled={isCreating}
                      data-testid="button-back"
                  >
                      <ChevronLeft className="h-4 w-4 mr-2" /> Back
                  </Button>
                ) : (
                  <div className="w-[100px]" /> 
                )}
                
                <div className="flex-1 flex justify-center">
                  <Select 
                    value={String(currentStep)} 
                    onValueChange={(val) => handleStepSelect(Number(val))}
                    disabled={isCreating}
                  >
                    <SelectTrigger className="w-[280px] bg-background shadow-sm" data-testid="select-step">
                      <SelectValue>
                        Step {currentStep}: {STEPS[currentStep - 1]?.title}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {STEPS.map((step) => {
                        const isCompleted = currentStep > step.id;
                        const isCurrent = currentStep === step.id;
                        return (
                          <SelectItem 
                            key={step.id} 
                            value={String(step.id)}
                            className={cn(
                              isCurrent && "bg-primary/10",
                              step.id > currentStep && "text-muted-foreground"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {isCompleted && <Check className="h-4 w-4 text-primary" />}
                              <span>Step {step.id}: {step.title}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  {currentStep === 1 && (
                    <Button 
                      variant="outline" 
                      onClick={handleSkipWizard}
                      data-testid="button-skip-wizard"
                      disabled={!projectData.name.trim() || !projectData.startDate || !projectData.dueDate}
                      loading={isCreating}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Start Blank
                    </Button>
                  )}
                  <Button 
                    onClick={handleNext} 
                    loading={isCreating} 
                    data-testid={currentStep === STEPS.length ? "button-create-project" : "button-next-step"}
                  >
                      {currentStep === STEPS.length ? (
                          <>{isCreating ? "Creating..." : "Create Project"} <Save className="h-4 w-4 ml-2" /></>
                      ) : (
                          <>Next <ChevronRight className="h-4 w-4 ml-2" /></>
                      )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pt-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <p className="text-muted-foreground">Loading templates...</p>
                    </div>
                ) : (
                  <>
                    {currentStep === 1 && <StepBasics {...stepProps} />}
                    {currentStep === 2 && <StepTeamRoles {...stepProps} />}
                    {currentStep === 3 && <StepStageConfig {...stepProps} />}
                    {currentStep === 4 && <StepWorkBreakdown {...stepProps} />}
                    {currentStep === 5 && <StepTaskAlignment {...stepProps} hasImportedTasks={isImportMode && stages.some(s => s.tasks && s.tasks.length > 0)} />}
                    {currentStep === 6 && <StepReview {...stepProps} />}
                  </>
                )}
            </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
