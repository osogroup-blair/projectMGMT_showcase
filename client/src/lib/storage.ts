import { 
  PROJECTS, 
  DELIVERABLES, 
  EPICS, 
  TASKS, 
  MILESTONES, 
  MILESTONE_SCOPE_RULES,
  MILESTONE_TASK_LINKS,
  TEAM, 
  ACTIVITY,
  PROJECT_ROLES, 
  ROLE_ASSIGNMENTS, 
  SAVED_VIEWS, 
  GUIDANCE_ITEMS, 
  PROJECT_TEMPLATES, 
  DELIVERABLE_TEMPLATES, 
  EPIC_TEMPLATES, 
  TASK_TEMPLATES, 
  STAGE_TEMPLATES, 
  FRAMEWORK_TEMPLATES, 
  ROLE_TEMPLATES,
  MAPPING_TEMPLATES,
  PROJECT_STATUS_OPTIONS,
  TASK_STATUS_OPTIONS,
  STAGE_STATUS_OPTIONS
} from "./mock-data";

const STORAGE_KEY = "nexus_db_v1";

// Define the shape of our database
export interface NexusDB {
  projects: any[];
  deliverables: any[];
  epics: any[];
  tasks: any[];
  milestones: any[];
  milestoneScopeRules: any[];
  milestoneTaskLinks: any[];
  users: any[];
  activity: any[];
  projectRoles: any[];
  roleAssignments: any[];
  savedViews: any[];
  guidanceItems: any[];
  projectTemplates: any[];
  deliverableTemplates: any[];
  epicTemplates: any[];
  taskTemplates: any[];
  stageTemplates: any[];
  frameworkTemplates: any[];
  roleTemplates: any[];
  mappingTemplates: any[];
  projectStatuses: any[];
  taskStatuses: any[];
  stageTypes: any[];
}

// Initial seed data
const INITIAL_DATA: NexusDB = {
  projects: PROJECTS,
  deliverables: DELIVERABLES,
  epics: EPICS,
  tasks: TASKS,
  milestones: MILESTONES,
  milestoneScopeRules: MILESTONE_SCOPE_RULES,
  milestoneTaskLinks: MILESTONE_TASK_LINKS,
  users: TEAM,
  activity: ACTIVITY,
  projectRoles: PROJECT_ROLES,
  roleAssignments: ROLE_ASSIGNMENTS,
  savedViews: SAVED_VIEWS,
  guidanceItems: GUIDANCE_ITEMS,
  projectTemplates: PROJECT_TEMPLATES,
  deliverableTemplates: DELIVERABLE_TEMPLATES,
  epicTemplates: EPIC_TEMPLATES,
  taskTemplates: TASK_TEMPLATES,
  stageTemplates: STAGE_TEMPLATES,
  frameworkTemplates: FRAMEWORK_TEMPLATES,
  roleTemplates: ROLE_TEMPLATES,
  mappingTemplates: MAPPING_TEMPLATES,
  projectStatuses: PROJECT_STATUS_OPTIONS,
  taskStatuses: TASK_STATUS_OPTIONS,
  stageTypes: STAGE_STATUS_OPTIONS // Mapping for now
};

class StorageEngine {
  private getDB(): NexusDB {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      this.saveDB(INITIAL_DATA);
      return INITIAL_DATA;
    }
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse storage, resetting", e);
      this.saveDB(INITIAL_DATA);
      return INITIAL_DATA;
    }
  }

  private saveDB(data: NexusDB) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // Generic Get All
  async getAll<K extends keyof NexusDB>(collection: K): Promise<NexusDB[K]> {
    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 100)); 
    return this.getDB()[collection];
  }

  // Generic Get By ID
  async getById<K extends keyof NexusDB>(collection: K, id: string): Promise<NexusDB[K][number] | undefined> {
    await new Promise(resolve => setTimeout(resolve, 50));
    const items = this.getDB()[collection];
    return items.find((item: any) => item.id === id);
  }

  // Generic Create
  async create<K extends keyof NexusDB>(collection: K, item: Omit<NexusDB[K][number], "id">): Promise<NexusDB[K][number]> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const db = this.getDB();
    const newItem = { ...item, id: crypto.randomUUID() };
    // @ts-ignore
    db[collection].push(newItem);
    this.saveDB(db);
    return newItem;
  }

  // Generic Update
  async update<K extends keyof NexusDB>(collection: K, id: string, updates: Partial<NexusDB[K][number]>): Promise<NexusDB[K][number]> {
    await new Promise(resolve => setTimeout(resolve, 150));
    const db = this.getDB();
    const index = db[collection].findIndex((item: any) => item.id === id);
    if (index === -1) throw new Error(`${String(collection)} item with id ${id} not found`);
    
    db[collection][index] = { ...db[collection][index], ...updates };
    this.saveDB(db);
    return db[collection][index];
  }

  // Generic Delete
  async delete<K extends keyof NexusDB>(collection: K, id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 150));
    const db = this.getDB();
    // @ts-ignore
    db[collection] = db[collection].filter((item: any) => item.id !== id);
    this.saveDB(db);
  }

  // Reset to Mock Data
  async reset(): Promise<void> {
    this.saveDB(INITIAL_DATA);
    window.location.reload();
  }
}

export const db = new StorageEngine();
