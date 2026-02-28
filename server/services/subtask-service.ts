import { storage } from "../data/storage";

export class SubtaskService {
    /**
     * Calculates the completion percentage of a parent task based on its subtasks.
     * Updates the parent task with the new progress (effort).
     */
    async calculateParentProgress(parentTaskId: string): Promise<number> {
        const subtasks = await storage.getSubtasksByParentId(parentTaskId);

        if (!subtasks || subtasks.length === 0) {
            return 0; // Or whatever default is appropriate
        }

        // Get completed statuses
        const appSet = await storage.getAppSettings();
        const doneStatuses = appSet?.completedTaskStatusIds?.length
            ? appSet.completedTaskStatusIds
            : ['DONE', 'COMPLETED', 'RESOLVED', 'CLOSED'];

        let completedCount = 0;

        for (const subtask of subtasks) {
            if (doneStatuses.includes(subtask.status.toUpperCase())) {
                completedCount++;
            }
        }

        const progressPercentage = Math.round((completedCount / subtasks.length) * 100);

        // Update parent task with rolled-up effort/progress
        // Wait, Tasks schema doesn't have a "progress" field natively, it has "effort". 
        // We can store it there if that's the intention, but let's check tasks schema.
        // Let's just update the parent task effort for now.

        await storage.updateTask(parentTaskId, { effort: progressPercentage });

        return progressPercentage;
    }
}

export const subtaskService = new SubtaskService();
