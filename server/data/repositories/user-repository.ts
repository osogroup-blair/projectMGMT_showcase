import { eq } from "drizzle-orm";
import { db } from "../../db";
import * as schema from "@shared/schema";
import type { User, InsertUser, UserIdentity, InsertUserIdentity } from "@shared/schema";

export async function getUsers(): Promise<User[]> {
  return await db.select().from(schema.users);
}

export async function getUserById(id: string): Promise<User | undefined> {
  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
  return user;
}

export async function createUser(user: InsertUser): Promise<User> {
  const id = (user as any).id || crypto.randomUUID();
  const [created] = await db.insert(schema.users).values({ ...user, id } as any).returning();
  return created;
}

export async function updateUser(id: string, user: Partial<User>): Promise<User> {
  const [updated] = await db.update(schema.users).set(user).where(eq(schema.users.id, id)).returning();
  return updated;
}

export async function deleteUser(id: string): Promise<void> {
  await db.delete(schema.users).where(eq(schema.users.id, id));
}

export async function getUserIdentities(): Promise<UserIdentity[]> {
  return db.select().from(schema.userIdentities);
}

export async function getUserIdentitiesByUserId(userId: string): Promise<UserIdentity[]> {
  return db.select().from(schema.userIdentities).where(eq(schema.userIdentities.userId, userId));
}

export async function createUserIdentity(identity: InsertUserIdentity): Promise<UserIdentity> {
  const id = (identity as any).id || crypto.randomUUID();
  const [created] = await db.insert(schema.userIdentities).values({ ...identity, id } as any).returning();
  return created;
}

export async function deleteUserIdentity(id: string): Promise<void> {
  await db.delete(schema.userIdentities).where(eq(schema.userIdentities.id, id));
}
