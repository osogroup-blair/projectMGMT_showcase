import { eq, or, sql, asc, desc } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "@shared/schema";
import type { Task, InsertTask, TaskDependency, InsertTaskDependency } from "@shared/schema";

export async function getTasks(): Promise<Task[]> {
  return await db.select().from(schema.tasks);
}

export async function getTaskById(id: string): Promise<Task | undefined> {
  const [task] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
  return task;
}

export async function getTasksByProjectId(projectId: string): Promise<Task[]> {
  return await db.select().from(schema.tasks).where(eq(schema.tasks.projectId, projectId));
}

export interface PaginatedTasksOptions {
  projectId: string;
  page?: number;
  limit?: number;
  sortBy?: 'title' | 'status' | 'priority' | 'deadline' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
}

export interface PaginatedTasksResult {
  tasks: Task[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getProjectTasksPaginated(options: PaginatedTasksOptions): Promise<PaginatedTasksResult> {
  const { projectId, page = 1, limit = 50, sortBy = 'createdAt', sortDirection = 'desc' } = options;
  const offset = (page - 1) * limit;
  
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.tasks)
    .where(eq(schema.tasks.projectId, projectId));
  
  const total = countResult[0]?.count || 0;
  
  const sortColumn = {
    title: schema.tasks.title,
    status: schema.tasks.status,
    priority: schema.tasks.priority,
    deadline: schema.tasks.deadline,
    createdAt: schema.tasks.createdAt,
  }[sortBy] || schema.tasks.createdAt;
  
  const orderFn = sortDirection === 'asc' ? asc : desc;
  
  const tasks = await db
    .select()
    .from(schema.tasks)
    .where(eq(schema.tasks.projectId, projectId))
    .orderBy(orderFn(sortColumn))
    .limit(limit)
    .offset(offset);
  
  return {
    tasks,
    total,
    page,
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function createTask(task: InsertTask): Promise<Task> {
  const id = (task as any).id || crypto.randomUUID();
  const [created] = await db.insert(schema.tasks).values({ ...task, id } as any).returning();
  return created;
}

export async function updateTask(id: string, task: Partial<Task>): Promise<Task> {
  const [updated] = await db.update(schema.tasks).set(task).where(eq(schema.tasks.id, id)).returning();
  return updated;
}

export async function deleteTask(id: string): Promise<void> {
  await db.delete(schema.tasks).where(eq(schema.tasks.id, id));
}

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

export async function getDependentTasksByTaskId(taskId: string): Promise<TaskDependency[]> {
  return await db.select().from(schema.taskDependencies).where(eq(schema.taskDependencies.dependsOnTaskId, taskId));
}

export async function createTaskDependency(dependency: InsertTaskDependency): Promise<TaskDependency> {
  const id = crypto.randomUUID();
  const [created] = await db.insert(schema.taskDependencies).values({ ...dependency, id }).returning();
  return created;
}

export async function deleteTaskDependency(id: string): Promise<void> {
  await db.delete(schema.taskDependencies).where(eq(schema.taskDependencies.id, id));
}

export async function deleteTaskDependenciesByTaskId(taskId: string): Promise<void> {
  await db.delete(schema.taskDependencies).where(
    or(eq(schema.taskDependencies.taskId, taskId), eq(schema.taskDependencies.dependsOnTaskId, taskId))
  );
}

export async function getSubtasksByParentId(parentTaskId: string): Promise<Task[]> {
  return await db.select().from(schema.tasks).where(eq(schema.tasks.parentTaskId, parentTaskId));
}
