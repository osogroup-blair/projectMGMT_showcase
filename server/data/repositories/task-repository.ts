import { eq, or, sql, asc, desc, and, inArray, isNull, ilike, gte, lte } from "drizzle-orm";
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
  search?: string;
  statuses?: string[];
  priorities?: string[];
  stageIds?: string[];
  epicIds?: string[];
  assigneeIds?: string[];
  sprintIds?: string[];
  taskTypeIds?: string[];
  dueDateFrom?: string;
  dueDateTo?: string;
  myTasksOnly?: string;
}

export interface PaginatedTasksResult {
  tasks: Task[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getProjectTasksPaginated(options: PaginatedTasksOptions): Promise<PaginatedTasksResult> {
  const { 
    projectId, 
    page = 1, 
    limit = 50, 
    sortBy = 'createdAt', 
    sortDirection = 'desc',
    search,
    statuses,
    priorities,
    stageIds,
    epicIds,
    assigneeIds,
    sprintIds,
    taskTypeIds,
    dueDateFrom,
    dueDateTo,
    myTasksOnly
  } = options;
  const offset = (page - 1) * limit;
  
  const conditions: any[] = [eq(schema.tasks.projectId, projectId)];
  
  if (search && search.trim()) {
    const searchPattern = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(schema.tasks.title, searchPattern),
        ilike(schema.tasks.description, searchPattern)
      )
    );
  }
  
  if (statuses && statuses.length > 0) {
    conditions.push(inArray(schema.tasks.status, statuses));
  }
  
  if (priorities && priorities.length > 0) {
    conditions.push(inArray(schema.tasks.priority, priorities));
  }
  
  if (stageIds && stageIds.length > 0) {
    conditions.push(inArray(schema.tasks.stageId, stageIds));
  }
  
  if (epicIds && epicIds.length > 0) {
    conditions.push(inArray(schema.tasks.epicId, epicIds));
  }
  
  if (assigneeIds && assigneeIds.length > 0) {
    if (assigneeIds.includes('unassigned')) {
      const otherIds = assigneeIds.filter(id => id !== 'unassigned');
      if (otherIds.length > 0) {
        conditions.push(or(isNull(schema.tasks.assigneeId), inArray(schema.tasks.assigneeId, otherIds)));
      } else {
        conditions.push(isNull(schema.tasks.assigneeId));
      }
    } else {
      conditions.push(inArray(schema.tasks.assigneeId, assigneeIds));
    }
  }
  
  if (sprintIds && sprintIds.length > 0) {
    if (sprintIds.includes('backlog')) {
      const otherIds = sprintIds.filter(id => id !== 'backlog');
      if (otherIds.length > 0) {
        conditions.push(or(isNull(schema.tasks.sprintId), inArray(schema.tasks.sprintId, otherIds)));
      } else {
        conditions.push(isNull(schema.tasks.sprintId));
      }
    } else {
      conditions.push(inArray(schema.tasks.sprintId, sprintIds));
    }
  }
  
  if (taskTypeIds && taskTypeIds.length > 0) {
    conditions.push(inArray(schema.tasks.taskTypeId, taskTypeIds));
  }
  
  if (dueDateFrom) {
    conditions.push(gte(schema.tasks.deadline, dueDateFrom));
  }
  
  if (dueDateTo) {
    conditions.push(lte(schema.tasks.deadline, dueDateTo));
  }
  
  if (myTasksOnly) {
    conditions.push(eq(schema.tasks.assigneeId, myTasksOnly));
  }
  
  const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];
  
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.tasks)
    .where(whereClause);
  
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
    .where(whereClause)
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
