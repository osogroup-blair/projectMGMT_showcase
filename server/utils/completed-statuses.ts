import { storage } from "../data/storage";

let cachedCompletedLabels: Set<string> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60000;

export async function getCompletedStatusLabels(): Promise<Set<string>> {
  const now = Date.now();
  if (cachedCompletedLabels && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedCompletedLabels;
  }
  
  try {
    const settings = await storage.getAppSettings();
    const statusOptions = await storage.getStatusOptions();
    const taskStatuses = statusOptions.filter(s => s.type === "task");
    
    let completedIds = settings?.completedTaskStatusIds || [];
    
    // Case-insensitive fallback for default completed labels
    if (completedIds.length === 0) {
      const defaultLabels = ['done', 'complete', 'completed', 'closed'];
      completedIds = taskStatuses
        .filter(s => defaultLabels.includes(s.label.toLowerCase()))
        .map(s => s.id);
    }
    
    const completedLabels = taskStatuses
      .filter(s => completedIds.includes(s.id))
      .map(s => s.label);
    
    cachedCompletedLabels = new Set(completedLabels);
    cacheTimestamp = now;
    return cachedCompletedLabels;
  } catch (error) {
    return new Set(['Done', 'Complete', 'Completed', 'Closed']);
  }
}

export async function isTaskComplete(status: string | undefined | null): Promise<boolean> {
  if (!status) return false;
  const completedLabels = await getCompletedStatusLabels();
  return completedLabels.has(status);
}

export function invalidateCompletedStatusesCache(): void {
  cachedCompletedLabels = null;
  cacheTimestamp = 0;
}
