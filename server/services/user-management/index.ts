import { db } from "../../db";
import { users } from "@shared/models/auth";
import { 
  tasks, 
  comments, 
  deliverables, 
  epics, 
  milestones, 
  projects, 
  sprints,
  roleAssignments,
  sprintMembers,
  sprintScopeEvents,
  sprintPulseUpdates,
  scheduleSyncAudit,
  dayPlans,
  userPreferences,
  workBlocks,
  userRoleEligibility,
  projectFavorites,
  userIdentities
} from "@shared/schema";
import { eq, ilike, or, sql, desc, asc, and, isNull, isNotNull, lt, gt, exists, notExists, inArray } from "drizzle-orm";
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
    permissions: user.permissions || [],
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
        db.select({ one: sql`1` }).from(tasks).where(eq(tasks.assigneeId, users.id))
      )
    );
  } else if (hasTasks === "no") {
    conditions.push(
      notExists(
        db.select({ one: sql`1` }).from(tasks).where(eq(tasks.assigneeId, users.id))
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
      permissions: data.permissions || [],
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
  // Delete or nullify all related records before deleting user
  // Order matters due to foreign key constraints
  
  // 1. Delete user-owned records that should be removed with the user
  await db.delete(comments).where(eq(comments.authorId, id));
  await db.delete(roleAssignments).where(eq(roleAssignments.userId, id));
  await db.delete(sprintMembers).where(eq(sprintMembers.userId, id));
  await db.delete(sprintScopeEvents).where(eq(sprintScopeEvents.userId, id));
  await db.delete(sprintPulseUpdates).where(eq(sprintPulseUpdates.userId, id));
  await db.delete(scheduleSyncAudit).where(eq(scheduleSyncAudit.userId, id));
  await db.delete(dayPlans).where(eq(dayPlans.userId, id));
  await db.delete(userPreferences).where(eq(userPreferences.userId, id));
  await db.delete(workBlocks).where(eq(workBlocks.userId, id));
  await db.delete(userRoleEligibility).where(eq(userRoleEligibility.userId, id));
  await db.delete(projectFavorites).where(eq(projectFavorites.userId, id));
  await db.delete(userIdentities).where(eq(userIdentities.userId, id));
  
  // 2. Nullify optional references on shared entities (only nullable fields)
  // Tasks - all user references are nullable
  await db.update(tasks).set({ assigneeId: null }).where(eq(tasks.assigneeId, id));
  await db.update(tasks).set({ createdBy: null }).where(eq(tasks.createdBy, id));
  await db.update(tasks).set({ updatedBy: null }).where(eq(tasks.updatedBy, id));
  await db.update(tasks).set({ overrideBy: null }).where(eq(tasks.overrideBy, id));
  
  // Epics - ownerId is NOT NULL, but createdBy/updatedBy/overrideBy are nullable
  await db.update(epics).set({ createdBy: null }).where(eq(epics.createdBy, id));
  await db.update(epics).set({ updatedBy: null }).where(eq(epics.updatedBy, id));
  await db.update(epics).set({ overrideBy: null }).where(eq(epics.overrideBy, id));
  
  // Deliverables - ownerId is NOT NULL, but createdBy/updatedBy are nullable
  await db.update(deliverables).set({ createdBy: null }).where(eq(deliverables.createdBy, id));
  await db.update(deliverables).set({ updatedBy: null }).where(eq(deliverables.updatedBy, id));
  
  // Milestones - ownerId is NOT NULL, but createdBy/updatedBy are nullable
  await db.update(milestones).set({ createdBy: null }).where(eq(milestones.createdBy, id));
  await db.update(milestones).set({ updatedBy: null }).where(eq(milestones.updatedBy, id));
  
  // Projects - ownerId is nullable
  await db.update(projects).set({ ownerId: null }).where(eq(projects.ownerId, id));
  await db.update(projects).set({ createdBy: null }).where(eq(projects.createdBy, id));
  await db.update(projects).set({ updatedBy: null }).where(eq(projects.updatedBy, id));
  
  // Sprints - ownerUserId is nullable
  await db.update(sprints).set({ ownerUserId: null }).where(eq(sprints.ownerUserId, id));
  await db.update(sprints).set({ createdBy: null }).where(eq(sprints.createdBy, id));
  await db.update(sprints).set({ updatedBy: null }).where(eq(sprints.updatedBy, id));
  
  // 3. Check if user still owns any entities with required ownerId
  const ownedDeliverables = await db.select({ count: sql<number>`count(*)` }).from(deliverables).where(eq(deliverables.ownerId, id));
  const ownedEpics = await db.select({ count: sql<number>`count(*)` }).from(epics).where(eq(epics.ownerId, id));
  const ownedMilestones = await db.select({ count: sql<number>`count(*)` }).from(milestones).where(eq(milestones.ownerId, id));
  
  const hasBlockingOwnership = 
    Number(ownedDeliverables[0]?.count || 0) > 0 ||
    Number(ownedEpics[0]?.count || 0) > 0 ||
    Number(ownedMilestones[0]?.count || 0) > 0;
    
  if (hasBlockingOwnership) {
    throw new Error("Cannot delete user: they still own deliverables, epics, or milestones. Please reassign ownership first.");
  }
  
  // 4. Finally delete the user
  await db.delete(users).where(eq(users.id, id));
  return true;
}

export async function bulkUpdateRole(ids: string[], role: string): Promise<number> {
  if (ids.length === 0) return 0;
  
  await db
    .update(users)
    .set({ 
      systemRole: role,
      updatedAt: new Date(),
    })
    .where(inArray(users.id, ids));

  return ids.length;
}

export async function bulkDeactivate(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  
  await db
    .update(users)
    .set({ 
      status: "Deactivated",
      updatedAt: new Date(),
    })
    .where(inArray(users.id, ids));

  return ids.length;
}

export async function bulkActivate(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  
  await db
    .update(users)
    .set({ 
      status: "Active",
      updatedAt: new Date(),
    })
    .where(inArray(users.id, ids));

  return ids.length;
}

export async function bulkDelete(ids: string[]): Promise<{ deleted: number; failed: string[] }> {
  if (ids.length === 0) return { deleted: 0, failed: [] };
  
  const failed: string[] = [];
  let deleted = 0;
  
  // Delete users one by one to handle foreign key constraints properly
  for (const id of ids) {
    try {
      await deleteUser(id);
      deleted++;
    } catch (error: any) {
      failed.push(id);
    }
  }

  return { deleted, failed };
}
