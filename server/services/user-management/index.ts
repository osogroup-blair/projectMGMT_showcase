import { db } from "../../db";
import { users } from "@shared/models/auth";
import { tasks } from "@shared/schema";
import { eq, ilike, or, sql, desc, asc, and, isNull, isNotNull, lt, gt, exists, notExists } from "drizzle-orm";
import type { 
  ListUsersRequest, 
  ListUsersResponse, 
  UserPublic, 
  UpdateUserRequest,
  CreateUserRequest 
} from "@shared/contracts/user-management";

function toPublicUser(user: typeof users.$inferSelect): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
    jobTitle: user.jobTitle,
    status: user.status,
    systemRole: user.systemRole,
    createdAt: user.createdAt,
  };
}

export async function listUsers(params: ListUsersRequest): Promise<ListUsersResponse> {
  const { 
    search, 
    role, 
    status,
    page = 1, 
    pageSize = 50, 
    sortBy = "createdAt", 
    sortOrder = "desc",
    hasEmail,
    hasTasks,
    emailDomain,
    createdBefore,
    createdAfter,
    limit,
    offset 
  } = params;

  const actualLimit = limit ?? pageSize;
  const actualOffset = offset ?? ((page - 1) * pageSize);

  const conditions = [];
  
  if (search) {
    conditions.push(
      or(
        ilike(users.name, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(users.firstName, `%${search}%`),
        ilike(users.lastName, `%${search}%`)
      )
    );
  }
  
  if (role) {
    conditions.push(eq(users.systemRole, role));
  }

  if (status) {
    conditions.push(eq(users.status, status));
  }

  if (hasEmail === "yes") {
    conditions.push(isNotNull(users.email));
  } else if (hasEmail === "no") {
    conditions.push(isNull(users.email));
  }

  if (emailDomain) {
    conditions.push(ilike(users.email, `%@${emailDomain}`));
  }

  if (createdBefore) {
    conditions.push(lt(users.createdAt, new Date(createdBefore)));
  }

  if (createdAfter) {
    conditions.push(gt(users.createdAt, new Date(createdAfter)));
  }

  if (hasTasks === "yes") {
    conditions.push(
      exists(
        db.select({ one: sql`1` }).from(tasks).where(eq(tasks.ownerId, users.id))
      )
    );
  } else if (hasTasks === "no") {
    conditions.push(
      notExists(
        db.select({ one: sql`1` }).from(tasks).where(eq(tasks.ownerId, users.id))
      )
    );
  }

  const sortColumn = {
    name: users.name,
    email: users.email,
    systemRole: users.systemRole,
    status: users.status,
    createdAt: users.createdAt,
  }[sortBy] || users.createdAt;

  const orderFn = sortOrder === "asc" ? asc : desc;

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const allUsers = await db
    .select()
    .from(users)
    .where(whereClause)
    .orderBy(orderFn(sortColumn))
    .limit(actualLimit)
    .offset(actualOffset);

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(whereClause);

  const total = Number(countResult[0]?.count || 0);
  const totalPages = Math.ceil(total / pageSize);

  return {
    users: allUsers.map(toPublicUser),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getUserById(id: string): Promise<UserPublic | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user ? toPublicUser(user) : null;
}

export async function updateUser(id: string, data: UpdateUserRequest): Promise<UserPublic | null> {
  const updateData: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle;
  if (data.systemRole !== undefined) updateData.systemRole = data.systemRole;
  if (data.permissions !== undefined) updateData.permissions = data.permissions;

  const [updated] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning();

  return updated ? toPublicUser(updated) : null;
}

export async function createUser(data: CreateUserRequest): Promise<UserPublic> {
  const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const [created] = await db
    .insert(users)
    .values({
      id,
      email: data.email,
      name: data.name,
      jobTitle: data.jobTitle || null,
      systemRole: data.systemRole || "member",
      permissions: [],
    })
    .returning();

  return toPublicUser(created);
}

export async function deactivateUser(id: string): Promise<boolean> {
  const result = await db
    .update(users)
    .set({ 
      status: "Deactivated",
      updatedAt: new Date(),
    })
    .where(eq(users.id, id));

  return true;
}

export async function deleteUser(id: string): Promise<boolean> {
  await db.delete(users).where(eq(users.id, id));
  return true;
}

export async function bulkUpdateRole(ids: string[], role: string): Promise<number> {
  const result = await db
    .update(users)
    .set({ 
      systemRole: role,
      updatedAt: new Date(),
    })
    .where(sql`${users.id} = ANY(${ids})`);

  return ids.length;
}

export async function bulkDeactivate(ids: string[]): Promise<number> {
  const result = await db
    .update(users)
    .set({ 
      status: "Deactivated",
      updatedAt: new Date(),
    })
    .where(sql`${users.id} = ANY(${ids})`);

  return ids.length;
}
