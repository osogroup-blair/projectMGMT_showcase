import { db } from "../db";
import { eq, and, inArray } from "drizzle-orm";
import * as schema from "@shared/schema";

export type EntityType = 'task' | 'epic' | 'deliverable';
export type SyncAction = 'sync_applied' | 'override_saved' | 'cancelled';

export interface DateChange {
  startDate?: string;
  endDate?: string;
  dueDate?: string;
}

export interface ChangePlanItem {
  entityType: EntityType;
  entityId: string;
  entityTitle: string;
  currentDates: DateChange;
  proposedDates: DateChange;
  reason: string;
  warningCode: 'out_of_bounds' | 'cascade_expansion' | 'max_expansion_exceeded';
}

export interface ChangePlan {
  triggeredBy: {
    entityType: EntityType;
    entityId: string;
    proposedDates: DateChange;
  };
  items: ChangePlanItem[];
  impactedCount: number;
  warnings: string[];
  maxExpansionDays: number;
}

export interface EvaluateRequest {
  entityType: EntityType;
  entityId: string;
  proposedDates: DateChange;
  userId?: string;
}

export interface ApplyRequest {
  action: SyncAction;
  changePlan: ChangePlan;
  overrideReason?: string;
  userId?: string;
}

const MAX_AUTO_EXPANSION_DAYS = 90;

export class ScheduleSyncService {
  async evaluate(request: EvaluateRequest): Promise<ChangePlan> {
    const { entityType, entityId, proposedDates } = request;

    const items: ChangePlanItem[] = [];
    const warnings: string[] = [];

    if (entityType === 'task') {
      const cascadeResult = await this.evaluateTaskCascade(entityId, proposedDates);
      items.push(...cascadeResult.items);
      warnings.push(...cascadeResult.warnings);
    } else if (entityType === 'epic') {
      const cascadeResult = await this.evaluateEpicCascade(entityId, proposedDates);
      items.push(...cascadeResult.items);
      warnings.push(...cascadeResult.warnings);
    } else if (entityType === 'deliverable') {
      const cascadeResult = await this.evaluateDeliverableCascade(entityId, proposedDates);
      items.push(...cascadeResult.items);
      warnings.push(...cascadeResult.warnings);
    }

    return {
      triggeredBy: { entityType, entityId, proposedDates },
      items,
      impactedCount: items.length,
      warnings,
      maxExpansionDays: MAX_AUTO_EXPANSION_DAYS
    };
  }

  private async evaluateTaskCascade(taskId: string, proposedDates: DateChange): Promise<{ items: ChangePlanItem[]; warnings: string[] }> {
    const items: ChangePlanItem[] = [];
    const warnings: string[] = [];

    const task = await db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).then(rows => rows[0]);
    if (!task || !task.epicId) return { items, warnings };

    const epic = await db.select().from(schema.epics).where(eq(schema.epics.id, task.epicId)).then(rows => rows[0]);
    if (!epic) return { items, warnings };

    const taskDeadline = proposedDates.dueDate || proposedDates.endDate;
    if (!taskDeadline) return { items, warnings };

    const taskDate = new Date(taskDeadline);
    const epicEndDate = new Date(epic.endDate);

    if (taskDate > epicEndDate) {
      const daysDiff = Math.ceil((taskDate.getTime() - epicEndDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff > MAX_AUTO_EXPANSION_DAYS) {
        warnings.push(`Expansion of ${daysDiff} days exceeds maximum allowed ${MAX_AUTO_EXPANSION_DAYS} days`);
        items.push({
          entityType: 'epic',
          entityId: epic.id,
          entityTitle: epic.title,
          currentDates: { startDate: epic.startDate, endDate: epic.endDate },
          proposedDates: { endDate: taskDeadline },
          reason: `Task deadline extends beyond epic end date by ${daysDiff} days`,
          warningCode: 'max_expansion_exceeded'
        });
      } else {
        items.push({
          entityType: 'epic',
          entityId: epic.id,
          entityTitle: epic.title,
          currentDates: { startDate: epic.startDate, endDate: epic.endDate },
          proposedDates: { endDate: taskDeadline },
          reason: `Epic end date will be extended by ${daysDiff} days to accommodate task`,
          warningCode: 'cascade_expansion'
        });

        const epicCascade = await this.evaluateEpicCascadeFromDates(epic.id, epic.deliverableId, { endDate: taskDeadline });
        items.push(...epicCascade.items);
        warnings.push(...epicCascade.warnings);
      }
    }

    // Evaluate Task-to-Task dependencies (Finish-to-Start)
    const dependencies = await db.select()
      .from(schema.taskDependencies)
      .where(eq(schema.taskDependencies.dependsOnTaskId, taskId));

    for (const dep of dependencies) {
      const depTask = await db.select().from(schema.tasks).where(eq(schema.tasks.id, dep.taskId)).then(rows => rows[0]);
      if (depTask && depTask.deadline) {
        const depDeadlineDate = new Date(depTask.deadline);
        if (taskDate >= depDeadlineDate) {
          // Push dependent task out to at least the day after this task finishes
          const newDepDeadlineDate = new Date(taskDate);
          newDepDeadlineDate.setDate(newDepDeadlineDate.getDate() + 1);
          const newDepDeadlineStr = newDepDeadlineDate.toISOString().split('T')[0];

          items.push({
            entityType: 'task',
            entityId: depTask.id,
            entityTitle: depTask.title,
            currentDates: { dueDate: depTask.deadline },
            proposedDates: { dueDate: newDepDeadlineStr },
            reason: `Dependent task pushed out to accommodate blocking task deadline`,
            warningCode: 'cascade_expansion'
          });

          const depCascade = await this.evaluateTaskCascade(depTask.id, { dueDate: newDepDeadlineStr });
          items.push(...depCascade.items);
          warnings.push(...depCascade.warnings);
        }
      }
    }

    return { items, warnings };
  }

  private async evaluateEpicCascade(epicId: string, proposedDates: DateChange): Promise<{ items: ChangePlanItem[]; warnings: string[] }> {
    const epic = await db.select().from(schema.epics).where(eq(schema.epics.id, epicId)).then(rows => rows[0]);
    if (!epic) return { items: [], warnings: [] };

    return this.evaluateEpicCascadeFromDates(epicId, epic.deliverableId, proposedDates);
  }

  private async evaluateEpicCascadeFromDates(epicId: string, deliverableId: string, proposedDates: DateChange): Promise<{ items: ChangePlanItem[]; warnings: string[] }> {
    const items: ChangePlanItem[] = [];
    const warnings: string[] = [];

    const deliverable = await db.select().from(schema.deliverables).where(eq(schema.deliverables.id, deliverableId)).then(rows => rows[0]);
    if (!deliverable) return { items, warnings };

    const epicEndDate = proposedDates.endDate;
    if (!epicEndDate) return { items, warnings };

    const epicDate = new Date(epicEndDate);
    const deliverableDueDate = new Date(deliverable.dueDate);

    if (epicDate > deliverableDueDate) {
      const daysDiff = Math.ceil((epicDate.getTime() - deliverableDueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff > MAX_AUTO_EXPANSION_DAYS) {
        warnings.push(`Deliverable expansion of ${daysDiff} days exceeds maximum allowed ${MAX_AUTO_EXPANSION_DAYS} days`);
        items.push({
          entityType: 'deliverable',
          entityId: deliverable.id,
          entityTitle: deliverable.title,
          currentDates: { startDate: deliverable.startDate || undefined, dueDate: deliverable.dueDate },
          proposedDates: { dueDate: epicEndDate },
          reason: `Epic end date extends beyond deliverable due date by ${daysDiff} days`,
          warningCode: 'max_expansion_exceeded'
        });
      } else {
        items.push({
          entityType: 'deliverable',
          entityId: deliverable.id,
          entityTitle: deliverable.title,
          currentDates: { startDate: deliverable.startDate || undefined, dueDate: deliverable.dueDate },
          proposedDates: { dueDate: epicEndDate },
          reason: `Deliverable due date will be extended by ${daysDiff} days to accommodate epic`,
          warningCode: 'cascade_expansion'
        });
      }
    }

    return { items, warnings };
  }

  private async evaluateDeliverableCascade(deliverableId: string, proposedDates: DateChange): Promise<{ items: ChangePlanItem[]; warnings: string[] }> {
    return { items: [], warnings: [] };
  }

  async apply(request: ApplyRequest): Promise<{ success: boolean; appliedChanges: number; auditId: string }> {
    const { action, changePlan, overrideReason, userId } = request;
    const auditId = crypto.randomUUID();
    const normalizedUserId = userId ?? null;

    await db.insert(schema.scheduleSyncAudit).values({
      id: auditId,
      entityType: changePlan.triggeredBy.entityType,
      entityId: changePlan.triggeredBy.entityId,
      action,
      changePlan: {
        items: changePlan.items,
        impactedCount: changePlan.impactedCount,
        warnings: changePlan.warnings
      },
      userId: normalizedUserId,
    });

    if (action === 'cancelled') {
      return { success: true, appliedChanges: 0, auditId };
    }

    if (action === 'override_saved') {
      await this.applyTriggerChange(changePlan.triggeredBy, userId);

      await this.markAsOverride(
        changePlan.triggeredBy.entityType,
        changePlan.triggeredBy.entityId,
        overrideReason || 'User chose to skip sync',
        userId
      );

      return { success: true, appliedChanges: 1, auditId };
    }

    if (action === 'sync_applied') {
      await this.applyTriggerChange(changePlan.triggeredBy, userId);

      for (const item of changePlan.items) {
        await this.applyItemChange(item, userId);
      }

      await this.clearOverrideFlag(changePlan.triggeredBy.entityType, changePlan.triggeredBy.entityId);

      return { success: true, appliedChanges: 1 + changePlan.items.length, auditId };
    }

    return { success: false, appliedChanges: 0, auditId };
  }

  private async applyTriggerChange(trigger: ChangePlan['triggeredBy'], userId?: string): Promise<void> {
    const { entityType, entityId, proposedDates } = trigger;

    if (entityType === 'task') {
      const updates: Partial<typeof schema.tasks.$inferInsert> = { updatedAt: new Date() };
      if (proposedDates.dueDate) updates.deadline = proposedDates.dueDate;
      await db.update(schema.tasks).set(updates).where(eq(schema.tasks.id, entityId));
    } else if (entityType === 'epic') {
      const updates: Partial<typeof schema.epics.$inferInsert> = {};
      if (proposedDates.startDate) updates.startDate = proposedDates.startDate;
      if (proposedDates.endDate) updates.endDate = proposedDates.endDate;
      await db.update(schema.epics).set(updates).where(eq(schema.epics.id, entityId));
    } else if (entityType === 'deliverable') {
      const updates: Partial<typeof schema.deliverables.$inferInsert> = {};
      if (proposedDates.startDate) updates.startDate = proposedDates.startDate;
      if (proposedDates.dueDate) updates.dueDate = proposedDates.dueDate;
      await db.update(schema.deliverables).set(updates).where(eq(schema.deliverables.id, entityId));
    }
  }

  private async applyItemChange(item: ChangePlanItem, userId?: string): Promise<void> {
    const { entityType, entityId, proposedDates } = item;

    if (entityType === 'epic') {
      const updates: Partial<typeof schema.epics.$inferInsert> = {};
      if (proposedDates.startDate) updates.startDate = proposedDates.startDate;
      if (proposedDates.endDate) updates.endDate = proposedDates.endDate;
      await db.update(schema.epics).set(updates).where(eq(schema.epics.id, entityId));
    } else if (entityType === 'deliverable') {
      const updates: Partial<typeof schema.deliverables.$inferInsert> = {};
      if (proposedDates.startDate) updates.startDate = proposedDates.startDate;
      if (proposedDates.dueDate) updates.dueDate = proposedDates.dueDate;
      await db.update(schema.deliverables).set(updates).where(eq(schema.deliverables.id, entityId));
    }
  }

  private async markAsOverride(entityType: EntityType, entityId: string, reason: string, userId?: string): Promise<void> {
    const now = new Date();
    const normalizedUserId = userId ?? null;

    if (entityType === 'task') {
      await db.update(schema.tasks).set({
        scheduleOverride: true,
        overrideReason: reason,
        overrideAt: now,
        overrideBy: normalizedUserId,
        updatedAt: now
      }).where(eq(schema.tasks.id, entityId));
    } else if (entityType === 'epic') {
      await db.update(schema.epics).set({
        scheduleOverride: true,
        overrideReason: reason,
        overrideAt: now,
        overrideBy: normalizedUserId
      }).where(eq(schema.epics.id, entityId));
    }
  }

  private async clearOverrideFlag(entityType: EntityType, entityId: string): Promise<void> {
    if (entityType === 'task') {
      await db.update(schema.tasks).set({
        scheduleOverride: false,
        overrideReason: null,
        overrideAt: null,
        overrideBy: null,
        updatedAt: new Date()
      }).where(eq(schema.tasks.id, entityId));
    } else if (entityType === 'epic') {
      await db.update(schema.epics).set({
        scheduleOverride: false,
        overrideReason: null,
        overrideAt: null,
        overrideBy: null
      }).where(eq(schema.epics.id, entityId));
    }
  }

  async bulkResolveOverrides(entityType: EntityType, entityIds: string[], userId?: string): Promise<number> {
    if (entityType === 'task') {
      const result = await db.update(schema.tasks).set({
        scheduleOverride: false,
        overrideReason: null,
        overrideAt: null,
        overrideBy: null,
        updatedAt: new Date()
      }).where(and(
        inArray(schema.tasks.id, entityIds),
        eq(schema.tasks.scheduleOverride, true)
      ));
      return entityIds.length;
    } else if (entityType === 'epic') {
      await db.update(schema.epics).set({
        scheduleOverride: false,
        overrideReason: null,
        overrideAt: null,
        overrideBy: null
      }).where(and(
        inArray(schema.epics.id, entityIds),
        eq(schema.epics.scheduleOverride, true)
      ));
      return entityIds.length;
    }
    return 0;
  }

  async getOverriddenEntities(projectId?: string): Promise<{ tasks: (typeof schema.tasks.$inferSelect)[]; epics: (typeof schema.epics.$inferSelect)[] }> {
    let tasksQuery = db.select().from(schema.tasks).where(eq(schema.tasks.scheduleOverride, true));
    let epicsQuery = db.select().from(schema.epics).where(eq(schema.epics.scheduleOverride, true));

    if (projectId) {
      tasksQuery = db.select().from(schema.tasks).where(
        and(eq(schema.tasks.scheduleOverride, true), eq(schema.tasks.projectId, projectId))
      );
    }

    const [tasks, epics] = await Promise.all([tasksQuery, epicsQuery]);

    return { tasks, epics };
  }
}

export const scheduleSyncService = new ScheduleSyncService();
