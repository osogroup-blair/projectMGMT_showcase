import { db } from "../../db";
import { users } from "@shared/models/auth";
import { eq, ilike, or, sql, desc } from "drizzle-orm";
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
  const { search, role, limit = 50, offset = 0 } = params;

  let query = db.select().from(users);
  
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

  const baseQuery = conditions.length > 0 
    ? db.select().from(users).where(conditions[0])
    : db.select().from(users);

  const allUsers = await baseQuery
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(users);

  return {
    users: allUsers.map(toPublicUser),
    total: Number(countResult[0]?.count || 0),
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
