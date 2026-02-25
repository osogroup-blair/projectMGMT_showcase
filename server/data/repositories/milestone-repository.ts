import { eq } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "@shared/schema";
import type {
  Milestone, InsertMilestone,
  MilestoneScopeRule, InsertMilestoneScopeRule,
  MilestoneTaskLink, InsertMilestoneTaskLink,
} from "@shared/schema";

export async function getMilestones(): Promise<Milestone[]> {
  return await db.select().from(schema.milestones);
}

export async function getMilestoneById(id: string): Promise<Milestone | undefined> {
  const [milestone] = await db.select().from(schema.milestones).where(eq(schema.milestones.id, id));
  return milestone;
}

export async function getMilestonesByProjectId(projectId: string): Promise<Milestone[]> {
  return await db.select().from(schema.milestones).where(eq(schema.milestones.projectId, projectId));
}

export async function createMilestone(milestone: InsertMilestone): Promise<Milestone> {
  const id = (milestone as any).id || crypto.randomUUID();
  const [created] = await db.insert(schema.milestones).values({ ...(milestone as any), id }).returning();
  return created;
}

export async function updateMilestone(id: string, milestone: Partial<Milestone>): Promise<Milestone> {
  const [updated] = await db.update(schema.milestones).set(milestone).where(eq(schema.milestones.id, id)).returning();
  return updated;
}

export async function deleteMilestone(id: string): Promise<void> {
  await db.delete(schema.milestones).where(eq(schema.milestones.id, id));
}

export async function getMilestoneScopeRules(): Promise<MilestoneScopeRule[]> {
  return await db.select().from(schema.milestoneScopeRules);
}

export async function getMilestoneScopeRuleById(id: string): Promise<MilestoneScopeRule | undefined> {
  const [rule] = await db.select().from(schema.milestoneScopeRules).where(eq(schema.milestoneScopeRules.id, id));
  return rule;
}

export async function getMilestoneScopeRulesByMilestoneId(milestoneId: string): Promise<MilestoneScopeRule[]> {
  return await db.select().from(schema.milestoneScopeRules).where(eq(schema.milestoneScopeRules.milestoneId, milestoneId));
}

export async function createMilestoneScopeRule(rule: InsertMilestoneScopeRule): Promise<MilestoneScopeRule> {
  const id = (rule as any).id || crypto.randomUUID();
  const [created] = await db.insert(schema.milestoneScopeRules).values({ ...rule, id }).returning();
  return created;
}

export async function updateMilestoneScopeRule(id: string, rule: Partial<MilestoneScopeRule>): Promise<MilestoneScopeRule> {
  const [updated] = await db.update(schema.milestoneScopeRules).set(rule).where(eq(schema.milestoneScopeRules.id, id)).returning();
  return updated;
}

export async function deleteMilestoneScopeRule(id: string): Promise<void> {
  await db.delete(schema.milestoneScopeRules).where(eq(schema.milestoneScopeRules.id, id));
}

export async function getMilestoneTaskLinks(): Promise<MilestoneTaskLink[]> {
  return await db.select().from(schema.milestoneTaskLinks);
}

export async function getMilestoneTaskLinkById(id: string): Promise<MilestoneTaskLink | undefined> {
  const [link] = await db.select().from(schema.milestoneTaskLinks).where(eq(schema.milestoneTaskLinks.id, id));
  return link;
}

export async function getMilestoneTaskLinksByMilestoneId(milestoneId: string): Promise<MilestoneTaskLink[]> {
  return await db.select().from(schema.milestoneTaskLinks).where(eq(schema.milestoneTaskLinks.milestoneId, milestoneId));
}

export async function createMilestoneTaskLink(link: InsertMilestoneTaskLink): Promise<MilestoneTaskLink> {
  const id = (link as any).id || crypto.randomUUID();
  const [created] = await db.insert(schema.milestoneTaskLinks).values({ ...link, id }).returning();
  return created;
}

export async function updateMilestoneTaskLink(id: string, link: Partial<MilestoneTaskLink>): Promise<MilestoneTaskLink> {
  const [updated] = await db.update(schema.milestoneTaskLinks).set(link).where(eq(schema.milestoneTaskLinks.id, id)).returning();
  return updated;
}

export async function deleteMilestoneTaskLink(id: string): Promise<void> {
  await db.delete(schema.milestoneTaskLinks).where(eq(schema.milestoneTaskLinks.id, id));
}
