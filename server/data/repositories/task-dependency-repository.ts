import { eq } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "@shared/schema";
import type {
  TaskDependency, InsertTaskDependency,
  TaskDependencyScopeRule, InsertTaskDependencyScopeRule,
} from "@shared/schema";

// Task Dependencies
export async function getTaskDependencies(): Promise<TaskDependency[]> {
  return await db.select().from(schema.taskDependencies);
}

export async function getTaskDependencyById(id: string): Promise<TaskDependency | undefined> {
  const [dependency] = await db.select().from(schema.taskDependencies).where(eq(schema.taskDependencies.id, id));
  return dependency;
}

export async function getTaskDependenciesByTaskId(taskId: string): Promise<TaskDependency[]> {
  return await db.select().from(schema.taskDependencies).where(eq(schema.taskDependencies.taskId, taskId));
}

export async function createTaskDependency(dependency: InsertTaskDependency): Promise<TaskDependency> {
  const id = (dependency as any).id || crypto.randomUUID();
  const [created] = await db.insert(schema.taskDependencies).values({ ...dependency, id }).returning();
  return created;
}

export async function updateTaskDependency(id: string, dependency: Partial<TaskDependency>): Promise<TaskDependency> {
  const [updated] = await db.update(schema.taskDependencies).set(dependency).where(eq(schema.taskDependencies.id, id)).returning();
  return updated;
}

export async function deleteTaskDependency(id: string): Promise<void> {
  await db.delete(schema.taskDependencies).where(eq(schema.taskDependencies.id, id));
}

// Task Dependency Scope Rules
export async function getTaskDependencyScopeRules(): Promise<TaskDependencyScopeRule[]> {
  return await db.select().from(schema.taskDependencyScopeRules);
}

export async function getTaskDependencyScopeRuleById(id: string): Promise<TaskDependencyScopeRule | undefined> {
  const [rule] = await db.select().from(schema.taskDependencyScopeRules).where(eq(schema.taskDependencyScopeRules.id, id));
  return rule;
}

export async function getTaskDependencyScopeRulesByTaskId(taskId: string): Promise<TaskDependencyScopeRule[]> {
  return await db.select().from(schema.taskDependencyScopeRules).where(eq(schema.taskDependencyScopeRules.taskId, taskId));
}

export async function createTaskDependencyScopeRule(rule: InsertTaskDependencyScopeRule): Promise<TaskDependencyScopeRule> {
  const id = (rule as any).id || crypto.randomUUID();
  const [created] = await db.insert(schema.taskDependencyScopeRules).values({ ...rule, id }).returning();
  return created;
}

export async function updateTaskDependencyScopeRule(id: string, rule: Partial<TaskDependencyScopeRule>): Promise<TaskDependencyScopeRule> {
  const [updated] = await db.update(schema.taskDependencyScopeRules)
    .set({ ...rule, updatedAt: new Date() })
    .where(eq(schema.taskDependencyScopeRules.id, id))
    .returning();
  return updated;
}

export async function deleteTaskDependencyScopeRule(id: string): Promise<void> {
  await db.delete(schema.taskDependencyScopeRules).where(eq(schema.taskDependencyScopeRules.id, id));
}
