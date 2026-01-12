import { db } from "../../db";
import { eq, and } from "drizzle-orm";
import * as schema from "@shared/schema";
import type {
  Sprint, InsertSprint,
  SprintMember, InsertSprintMember,
  SprintScopeEvent, InsertSprintScopeEvent,
  SprintScopeTarget, InsertSprintScopeTarget,
  SprintPulseUpdate, InsertSprintPulseUpdate,
} from "@shared/schema";

export async function getSprints(): Promise<Sprint[]> {
  return await db.select().from(schema.sprints);
}

export async function getSprintById(id: string): Promise<Sprint | undefined> {
  const [sprint] = await db.select().from(schema.sprints).where(eq(schema.sprints.id, id));
  return sprint;
}

export async function getSprintsByProjectId(projectId: string): Promise<Sprint[]> {
  return await db.select().from(schema.sprints).where(eq(schema.sprints.projectId, projectId));
}

export async function createSprint(sprint: InsertSprint): Promise<Sprint> {
  const id = (sprint as any).id || crypto.randomUUID();
  const [created] = await db.insert(schema.sprints).values({ ...sprint, id }).returning();
  return created;
}

export async function updateSprint(id: string, sprint: Partial<Sprint>): Promise<Sprint> {
  const [updated] = await db.update(schema.sprints).set(sprint).where(eq(schema.sprints.id, id)).returning();
  return updated;
}

export async function deleteSprint(id: string): Promise<void> {
  await db.delete(schema.sprints).where(eq(schema.sprints.id, id));
}

export async function getSprintMembers(): Promise<SprintMember[]> {
  return await db.select().from(schema.sprintMembers);
}

export async function getSprintMemberById(id: string): Promise<SprintMember | undefined> {
  const [member] = await db.select().from(schema.sprintMembers).where(eq(schema.sprintMembers.id, id));
  return member;
}

export async function getSprintMembersBySprintId(sprintId: string): Promise<SprintMember[]> {
  return await db.select().from(schema.sprintMembers).where(eq(schema.sprintMembers.sprintId, sprintId));
}

export async function createSprintMember(member: InsertSprintMember): Promise<SprintMember> {
  const id = (member as any).id || crypto.randomUUID();
  const [created] = await db.insert(schema.sprintMembers).values({ ...member, id }).returning();
  return created;
}

export async function updateSprintMember(id: string, member: Partial<SprintMember>): Promise<SprintMember> {
  const [updated] = await db.update(schema.sprintMembers).set(member).where(eq(schema.sprintMembers.id, id)).returning();
  return updated;
}

export async function deleteSprintMember(id: string): Promise<void> {
  await db.delete(schema.sprintMembers).where(eq(schema.sprintMembers.id, id));
}

export async function getSprintScopeEvents(): Promise<SprintScopeEvent[]> {
  return await db.select().from(schema.sprintScopeEvents);
}

export async function getSprintScopeEventsBySprintId(sprintId: string): Promise<SprintScopeEvent[]> {
  return await db.select().from(schema.sprintScopeEvents).where(eq(schema.sprintScopeEvents.sprintId, sprintId));
}

export async function createSprintScopeEvent(event: InsertSprintScopeEvent): Promise<SprintScopeEvent> {
  const id = (event as any).id || crypto.randomUUID();
  const [created] = await db.insert(schema.sprintScopeEvents).values({ ...event, id }).returning();
  return created;
}

export async function getSprintScopeTargets(): Promise<SprintScopeTarget[]> {
  return await db.select().from(schema.sprintScopeTargets);
}

export async function getSprintScopeTargetsBySprintId(sprintId: string): Promise<SprintScopeTarget[]> {
  return await db.select().from(schema.sprintScopeTargets).where(eq(schema.sprintScopeTargets.sprintId, sprintId));
}

export async function createSprintScopeTarget(target: InsertSprintScopeTarget): Promise<SprintScopeTarget> {
  const id = (target as any).id || crypto.randomUUID();
  const [created] = await db.insert(schema.sprintScopeTargets).values({ ...target, id }).returning();
  return created;
}

export async function deleteSprintScopeTarget(id: string): Promise<void> {
  await db.delete(schema.sprintScopeTargets).where(eq(schema.sprintScopeTargets.id, id));
}

export async function deleteSprintScopeTargetsBySprintId(sprintId: string): Promise<void> {
  await db.delete(schema.sprintScopeTargets).where(eq(schema.sprintScopeTargets.sprintId, sprintId));
}

export async function getSprintPulseUpdates(): Promise<SprintPulseUpdate[]> {
  return await db.select().from(schema.sprintPulseUpdates);
}

export async function getSprintPulseUpdatesBySprintId(sprintId: string): Promise<SprintPulseUpdate[]> {
  return await db.select().from(schema.sprintPulseUpdates).where(eq(schema.sprintPulseUpdates.sprintId, sprintId));
}

export async function getSprintPulseUpdateByUserAndDate(sprintId: string, userId: string, date: string): Promise<SprintPulseUpdate | undefined> {
  const [update] = await db.select().from(schema.sprintPulseUpdates)
    .where(and(
      eq(schema.sprintPulseUpdates.sprintId, sprintId),
      eq(schema.sprintPulseUpdates.userId, userId),
      eq(schema.sprintPulseUpdates.date, date)
    ));
  return update;
}

export async function createSprintPulseUpdate(update: InsertSprintPulseUpdate): Promise<SprintPulseUpdate> {
  const id = (update as any).id || crypto.randomUUID();
  const [created] = await db.insert(schema.sprintPulseUpdates).values({ ...update, id }).returning();
  return created;
}

export async function updateSprintPulseUpdate(id: string, update: Partial<SprintPulseUpdate>): Promise<SprintPulseUpdate> {
  const [updated] = await db.update(schema.sprintPulseUpdates)
    .set({ ...update, updatedAt: new Date() })
    .where(eq(schema.sprintPulseUpdates.id, id))
    .returning();
  return updated;
}

export async function deleteSprintPulseUpdate(id: string): Promise<void> {
  await db.delete(schema.sprintPulseUpdates).where(eq(schema.sprintPulseUpdates.id, id));
}
