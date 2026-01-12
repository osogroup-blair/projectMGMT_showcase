// Collection names map to API endpoints
// Complete interface with ALL system entities from shared/schema.ts
export interface NexusDB {
  // Core Project Entities
  projects: any[];
  deliverables: any[];
  epics: any[];
  projectStages: any[];
  tasks: any[];
  milestones: any[];
  milestoneScopeRules: any[];
  milestoneTaskLinks: any[];
  // Sprint Entities
  sprints: any[];
  sprintMembers: any[];
  sprintScopeEvents: any[];
  sprintScopeTargets: any[];
  sprintPulseUpdates: any[];
  // Task Related
  taskDependencies: any[];
  taskTypes: any[];
  epicTypes: any[];
  deliverableTypes: any[];
  projectTaskTypes: any[];
  projectTaskStatuses: any[];
  projectSettings: any[];
  // Activity & Comments
  users: any[];
  activity: any[];
  comments: any[];
  attachments: any[];
  history: any[];
  // Roles & Assignments
  projectRoles: any[];
  roleAssignments: any[];
  userRoleEligibility: any[];
  userPreferences: any[];
  projectFavorites: any[];
  // Views & Guidance
  savedViews: any[];
  guidanceItems: any[];
  // Templates
  projectTemplates: any[];
  deliverableTemplates: any[];
  epicTemplates: any[];
  taskTemplates: any[];
  stageTemplates: any[];
  frameworkTemplates: any[];
  roleTemplates: any[];
  milestoneTemplates: any[];
  templateSnippets: any[];
  // Config & Defaults
  mappingTemplates: any[];
  statusOptions: any[];
  projectStatuses: any[];
  taskStatuses: any[];
  stageTypes: any[];
  roleTypes: any[];
  // Planning
  workBlocks: any[];
  dayPlans: any[];
}

class StorageEngine {
  private async fetchAPI(path: string, options?: RequestInit) {
    const response = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    if (!response.ok && response.status !== 204) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    if (response.status === 204) {
      return null;
    }
    
    // Check content-type to ensure we're getting JSON, not HTML
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      throw new Error(`Expected JSON response but got ${contentType} for ${path}`);
    }
    
    const text = await response.text();
    if (!text) {
      return [];
    }
    
    // Check if response looks like HTML (common error when endpoint doesn't exist)
    if (text.startsWith('<!DOCTYPE') || text.startsWith('<html') || text.startsWith('<')) {
      throw new Error(`Received HTML instead of JSON for ${path}. The API endpoint may not exist.`);
    }
    
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`Failed to parse JSON response for ${path}: ${text.substring(0, 100)}...`);
    }
  }

  // Generic Get All
  async getAll<K extends keyof NexusDB>(collection: K): Promise<NexusDB[K]> {
    // For users, use a larger pageSize to ensure all users are returned
    const url = collection === 'users' 
      ? `/api/${collection}?pageSize=1000` 
      : `/api/${collection}`;
    const response = await this.fetchAPI(url);
    if (collection === 'users' && response && 'users' in response) {
      return response.users;
    }
    return response;
  }

  // Generic Get By ID
  async getById<K extends keyof NexusDB>(collection: K, id: string): Promise<NexusDB[K][number] | undefined> {
    try {
      return await this.fetchAPI(`/api/${collection}/${id}`);
    } catch (error) {
      return undefined;
    }
  }

  // Generic Create
  async create<K extends keyof NexusDB>(collection: K, item: Partial<NexusDB[K][number]>): Promise<NexusDB[K][number]> {
    return await this.fetchAPI(`/api/${collection}`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  // Generic Update
  async update<K extends keyof NexusDB>(collection: K, id: string, updates: Partial<NexusDB[K][number]>): Promise<NexusDB[K][number]> {
    return await this.fetchAPI(`/api/${collection}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Generic Delete
  async delete<K extends keyof NexusDB>(collection: K, id: string): Promise<void> {
    await this.fetchAPI(`/api/${collection}/${id}`, {
      method: 'DELETE',
    });
  }

  // Reset to Mock Data (kept for compatibility, but does nothing now)
  async reset(): Promise<void> {
    console.warn('Reset is not supported with backend storage');
    window.location.reload();
  }
}

export const db = new StorageEngine();
