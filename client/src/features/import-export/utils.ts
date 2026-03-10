import { ENTITY_TO_COLLECTION, DEFAULT_STATUS_VALUES } from "./constants";

export const applyDefaultsForNewRecord = (record: any, entityName: string): any => {
  const now = new Date().toISOString();
  const updated = { ...record };

  if (!updated.createdAt && !updated.created_at) {
    updated.createdAt = now;
  }
  if (!updated.updatedAt && !updated.updated_at) {
    updated.updatedAt = now;
  }

  const collection = ENTITY_TO_COLLECTION[entityName]?.toLowerCase();
  if (collection && DEFAULT_STATUS_VALUES[collection] && !updated.status) {
    updated.status = DEFAULT_STATUS_VALUES[collection];
  }

  if ((collection === "projects" || collection === "deliverables" || collection === "epics") &&
    updated.progress === undefined) {
    updated.progress = 0;
  }

  return updated;
};

export const normalizeRecord = (record: any, entityName: string): any => {
  const normalized = { ...record };

  const arrayFields = ["tags", "stageIds", "defaultStages", "defaultEpics", "defaultTasks", "defaultRoles", "defaultPermissions", "defaultDeliverables", "allowedTaskStatuses", "permissions", "rules", "scopeRules", "defaultScopeRules"];
  for (const field of arrayFields) {
    if (normalized[field] !== undefined && normalized[field] !== null) {
      if (typeof normalized[field] === 'string') {
        try {
          normalized[field] = JSON.parse(normalized[field]);
        } catch {
          normalized[field] = [];
        }
      }
      if (!Array.isArray(normalized[field])) {
        normalized[field] = [];
      }
    }
  }

  const stringFields = ["entryCriteria", "exitCriteria"];
  for (const field of stringFields) {
    if (normalized[field] !== undefined && normalized[field] !== null) {
      if (Array.isArray(normalized[field])) {
        normalized[field] = JSON.stringify(normalized[field]);
      } else if (typeof normalized[field] !== 'string') {
        normalized[field] = String(normalized[field]);
      }
    }
  }

  const dateFields = ["updatedAt", "createdAt", "deadline", "startDate", "endDate", "dueDate", "targetDate", "lastEvaluatedAt", "progressLastCalculatedAt"];
  for (const field of dateFields) {
    if (normalized[field] !== undefined && normalized[field] !== null) {
      if (typeof normalized[field] === 'string') {
        const parsed = new Date(normalized[field]);
        if (!isNaN(parsed.getTime())) {
          normalized[field] = parsed;
        } else {
          delete normalized[field];
        }
      }
    }
  }

  return normalized;
};

export const serialize = (data: any[]) => {
  return data.map(item => {
    const newItem: any = {};
    Object.keys(item).forEach(key => {
      if (typeof item[key] === 'object' && item[key] !== null) {
        newItem[key] = JSON.stringify(item[key]);
      } else {
        newItem[key] = item[key];
      }
    });
    return newItem;
  });
};

export const parseJsonValue = (value: any): any => {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object') return parsed;
    } catch {
      return value;
    }
  }
  return value;
};

export const deserialize = (data: any[]): any[] => {
  return data.map(item => {
    const newItem: any = {};
    Object.keys(item).forEach(key => {
      newItem[key] = parseJsonValue(item[key]);
    });
    return newItem;
  });
};

export const flattenNestedImport = (nested: any): Record<string, any[]> => {
  const flat: Record<string, any[]> = {
    Projects: [],
    ProjectRoles: [],
    Deliverables: [],
    Epics: [],
    Tasks: [],
    Milestones: [],
    MilestoneScopeRules: [],
    MilestoneTaskLinks: [],
    ProjectStages: [],
    Sprints: [],
    SprintMembers: [],
    SprintScopeEvents: [],
    SprintScopeTargets: [],
    SprintPulseUpdates: [],
    TaskDependencies: [],
    Comments: [],
    Attachments: [],
    History: []
  };

  const referencedSprintIds = new Set<string>();
  const existingSprintIds = new Set<string>();
  const referencedStageIds = new Set<string>();
  const existingStageIds = new Set<string>();
  const projectDatesMap = new Map<string, { startDate: string; deadline: string }>();

  if (nested.projects && Array.isArray(nested.projects)) {
    flat.FullProjectsForCreate = [];

    nested.projects.forEach((project: any) => {
      const { deliverables, milestones, stages, sprints, roles, ...rawProjectData } = project;
      const projectData = { ...rawProjectData };

      // Sanitize foreign keys that might violate constraints
      if (projectData.ownerId === '0') delete projectData.ownerId;
      if (projectData.clientId === 'Internal') delete projectData.clientId;
      if (projectData.client) delete projectData.client; // Some exports use 'client' instead of 'clientId'

      // Structure for full-create endpoint
      flat.FullProjectsForCreate.push({
        project: {
          name: projectData.name,
          description: projectData.description || '',
          status: projectData.status || 'Upcoming',
          startDate: projectData.startDate,
          deadline: projectData.deadline,
          frameworkId: projectData.frameworkId || null,
          sprintDurationWeeks: projectData.sprintDurationWeeks || null,
          ownerId: projectData.ownerId || null,
          clientId: projectData.clientId || null,
          riskLevel: projectData.riskLevel || null
        },
        stages: Array.isArray(stages) ? stages : [],
        deliverables: Array.isArray(deliverables) ? deliverables : [],
        milestones: Array.isArray(milestones) ? milestones : [],
        roles: Array.isArray(roles) ? roles.map((r: any) => ({
          ...r,
          roleTypeId: r.roleTypeId || r.templateId
        })) : [],
        sprints: Array.isArray(sprints) ? sprints : []
      });

      flat.Projects.push(projectData);

      // Handle project roles integration
      if (Array.isArray(roles)) {
        roles.forEach((role: any) => {
          flat.ProjectRoles.push(role);
        });
      }

      projectDatesMap.set(project.id, {
        startDate: project.startDate || new Date().toISOString().split('T')[0],
        deadline: project.deadline || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      if (Array.isArray(stages)) {
        stages.forEach((stage: any) => {
          existingStageIds.add(stage.id);
          flat.ProjectStages.push(stage);
        });
      }

      if (Array.isArray(sprints)) {
        sprints.forEach((sprint: any) => {
          const { members, scopeEvents, scopeTargets, pulseUpdates, scope_events, scope_targets, pulse_updates, ...sprintData } = sprint;
          existingSprintIds.add(sprint.id);
          flat.Sprints.push(sprintData);

          const sprintMembers = members;
          const sprintScopeEvents = scopeEvents || scope_events;
          const sprintScopeTargets = scopeTargets || scope_targets;
          const sprintPulseUpdates = pulseUpdates || pulse_updates;

          if (Array.isArray(sprintMembers)) {
            flat.SprintMembers.push(...sprintMembers);
          }
          if (Array.isArray(sprintScopeEvents)) {
            flat.SprintScopeEvents.push(...sprintScopeEvents);
          }
          if (Array.isArray(sprintScopeTargets)) {
            flat.SprintScopeTargets.push(...sprintScopeTargets);
          }
          if (Array.isArray(sprintPulseUpdates)) {
            flat.SprintPulseUpdates.push(...sprintPulseUpdates);
          }
        });
      }

      if (Array.isArray(milestones)) {
        milestones.forEach((milestone: any) => {
          const { scopeRules, scope_rules, taskLinks, task_links, ...milestoneData } = milestone;
          flat.Milestones.push(milestoneData);
          const rules = scopeRules || scope_rules;
          const links = taskLinks || task_links;
          if (Array.isArray(rules)) {
            flat.MilestoneScopeRules.push(...rules);
          }
          if (Array.isArray(links)) {
            flat.MilestoneTaskLinks.push(...links);
          }
        });
      }

      if (Array.isArray(deliverables)) {
        deliverables.forEach((deliverable: any) => {
          const { epics, ...deliverableData } = deliverable;
          flat.Deliverables.push(deliverableData);

          if (Array.isArray(epics)) {
            epics.forEach((epic: any) => {
              const { tasks, ...epicData } = epic;
              flat.Epics.push(epicData);

              if (Array.isArray(tasks)) {
                tasks.forEach((task: any) => {
                  const { dependencies, comments, attachments, history, ...taskData } = task;

                  if (taskData.sprintId) {
                    referencedSprintIds.add(taskData.sprintId);
                  }
                  if (taskData.stageId) {
                    referencedStageIds.add(taskData.stageId);
                  }

                  flat.Tasks.push(taskData);

                  if (Array.isArray(dependencies)) {
                    flat.TaskDependencies.push(...dependencies);
                  }
                  if (Array.isArray(comments)) {
                    flat.Comments.push(...comments);
                  }
                  if (Array.isArray(attachments)) {
                    flat.Attachments.push(...attachments);
                  }
                  if (Array.isArray(history)) {
                    flat.History.push(...history);
                  }
                });
              }
            });
          }
        });
      }
    });
  }

  return flat;
};
