// Collection names map to API endpoints
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
    
    return await response.json();
  }

  // Generic Get All
  async getAll<K extends keyof NexusDB>(collection: K): Promise<NexusDB[K]> {
    return await this.fetchAPI(`/api/${collection}`);
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
