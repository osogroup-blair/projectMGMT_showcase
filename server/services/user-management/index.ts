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
    userType: user.userType || "internal",
    permissions: user.permissions || [],
    roleTemplateIds: user.roleTemplateIds || [],
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
    loginCount: user.loginCount,
  };
}

export async function listUsers(params: ListUsersRequest): Promise<ListUsersResponse> {
  const {
    search,
    role,
    status,
    userType,
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

  if (userType) {
    conditions.push(eq(users.userType, userType));
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
    lastLogin: users.lastLogin,
    loginCount: users.loginCount,
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
  if (data.userType !== undefined) updateData.userType = data.userType;
  if (data.permissions !== undefined) updateData.permissions = data.permissions;
  if (data.roleTemplateIds !== undefined) updateData.roleTemplateIds = data.roleTemplateIds;

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
      userType: data.userType || "internal",
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

export interface UserDeletionPreflight {
  canDelete: boolean;
  blockers: {
    isLastAdmin: boolean;
    ownedProjects: { id: string; name: string }[];
    ownedDeliverables: { id: string; name: string; projectName: string }[];
    ownedEpics: { id: string; name: string; projectName: string }[];
    ownedMilestones: { id: string; name: string; projectName: string }[];
    ownedSprints: { id: string; name: string; projectName: string }[];
  };
  warnings: {
    assignedTasks: number;
    comments: number;
    identities: number;
    roleAssignments: number;
    sprintMemberships: number;
  };
}

export async function getUserDeletionPreflight(userId: string): Promise<UserDeletionPreflight> {
  // Check if this is the last admin
  const admins = await db.select({ id: users.id }).from(users).where(eq(users.systemRole, "admin"));
  const isLastAdmin = admins.length === 1 && admins[0].id === userId;

  // Get owned projects
  const ownedProjectsData = await db
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(eq(projects.ownerId, userId));

  // Get owned deliverables with project names
  const ownedDeliverablesData = await db
    .select({
      id: deliverables.id,
      title: deliverables.title,
      projectName: projects.name
    })
    .from(deliverables)
    .leftJoin(projects, eq(deliverables.projectId, projects.id))
    .where(eq(deliverables.ownerId, userId));

  // Get owned epics with project names
  const ownedEpicsData = await db
    .select({
      id: epics.id,
      title: epics.title,
      projectName: projects.name
    })
    .from(epics)
    .leftJoin(deliverables, eq(epics.deliverableId, deliverables.id))
    .leftJoin(projects, eq(deliverables.projectId, projects.id))
    .where(eq(epics.ownerId, userId));

  // Get owned milestones with project names
  const ownedMilestonesData = await db
    .select({
      id: milestones.id,
      name: milestones.name,
      projectName: projects.name
    })
    .from(milestones)
    .leftJoin(projects, eq(milestones.projectId, projects.id))
    .where(eq(milestones.ownerId, userId));

  // Get owned sprints with project names
  const ownedSprintsData = await db
    .select({
      id: sprints.id,
      name: sprints.name,
      projectName: projects.name
    })
    .from(sprints)
    .leftJoin(projects, eq(sprints.projectId, projects.id))
    .where(eq(sprints.ownerUserId, userId));

  // Count warning items (things that will be deleted/nullified)
  const [assignedTasksCount] = await db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.assigneeId, userId));
  const [commentsCount] = await db.select({ count: sql<number>`count(*)` }).from(comments).where(eq(comments.authorId, userId));
  const [identitiesCount] = await db.select({ count: sql<number>`count(*)` }).from(userIdentities).where(eq(userIdentities.userId, userId));
  const [roleAssignmentsCount] = await db.select({ count: sql<number>`count(*)` }).from(roleAssignments).where(eq(roleAssignments.userId, userId));
  const [sprintMembershipsCount] = await db.select({ count: sql<number>`count(*)` }).from(sprintMembers).where(eq(sprintMembers.userId, userId));

  const hasBlockers = isLastAdmin ||
    ownedProjectsData.length > 0 ||
    ownedDeliverablesData.length > 0 ||
    ownedEpicsData.length > 0 ||
    ownedMilestonesData.length > 0 ||
    ownedSprintsData.length > 0;

  return {
    canDelete: !hasBlockers,
    blockers: {
      isLastAdmin,
      ownedProjects: ownedProjectsData.map(p => ({ id: p.id, name: p.name || "Unnamed" })),
      ownedDeliverables: ownedDeliverablesData.map(d => ({ id: d.id, name: d.title || "Unnamed", projectName: d.projectName || "Unknown" })),
      ownedEpics: ownedEpicsData.map(e => ({ id: e.id, name: e.title || "Unnamed", projectName: e.projectName || "Unknown" })),
      ownedMilestones: ownedMilestonesData.map(m => ({ id: m.id, name: m.name || "Unnamed", projectName: m.projectName || "Unknown" })),
      ownedSprints: ownedSprintsData.map(s => ({ id: s.id, name: s.name || "Unnamed", projectName: s.projectName || "Unknown" })),
    },
    warnings: {
      assignedTasks: Number(assignedTasksCount?.count || 0),
      comments: Number(commentsCount?.count || 0),
      identities: Number(identitiesCount?.count || 0),
      roleAssignments: Number(roleAssignmentsCount?.count || 0),
      sprintMemberships: Number(sprintMembershipsCount?.count || 0),
    },
  };
}

export async function transferOwnership(
  fromUserId: string,
  toUserId: string,
  entityType: "projects" | "deliverables" | "epics" | "milestones" | "sprints",
  entityIds: string[]
): Promise<number> {
  if (entityIds.length === 0) return 0;

  switch (entityType) {
    case "projects":
      await db.update(projects)
        .set({ ownerId: toUserId, updatedAt: new Date() })
        .where(and(eq(projects.ownerId, fromUserId), inArray(projects.id, entityIds)));
      break;
    case "deliverables":
      await db.update(deliverables)
        .set({ ownerId: toUserId, updatedAt: new Date() })
        .where(and(eq(deliverables.ownerId, fromUserId), inArray(deliverables.id, entityIds)));
      break;
    case "epics":
      await db.update(epics)
        .set({ ownerId: toUserId, updatedAt: new Date() })
        .where(and(eq(epics.ownerId, fromUserId), inArray(epics.id, entityIds)));
      break;
    case "milestones":
      await db.update(milestones)
        .set({ ownerId: toUserId, updatedAt: new Date() })
        .where(and(eq(milestones.ownerId, fromUserId), inArray(milestones.id, entityIds)));
      break;
    case "sprints":
      await db.update(sprints)
        .set({ ownerUserId: toUserId, updatedAt: new Date() })
        .where(and(eq(sprints.ownerUserId, fromUserId), inArray(sprints.id, entityIds)));
      break;
  }

  return entityIds.length;
}

export async function archiveUser(id: string): Promise<boolean> {
  await db.update(users)
    .set({
      status: "Archived",
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

export interface BulkDeleteResult {
  deleted: string[];
  archived: string[];
  failed: Array<{ id: string; reason: string }>;
}

export async function bulkDeleteWithPreflight(
  ids: string[],
  mode: "archive" | "delete" = "archive"
): Promise<BulkDeleteResult> {
  if (ids.length === 0) return { deleted: [], archived: [], failed: [] };

  const deleted: string[] = [];
  const archived: string[] = [];
  const failed: Array<{ id: string; reason: string }> = [];

  for (const id of ids) {
    try {
      const preflight = await getUserDeletionPreflight(id);

      if (preflight.blockers.isLastAdmin) {
        failed.push({ id, reason: "Cannot delete the last administrator" });
        continue;
      }

      if (!preflight.canDelete) {
        if (mode === "archive") {
          await archiveUser(id);
          archived.push(id);
        } else {
          const blockerCount =
            preflight.blockers.ownedProjects.length +
            preflight.blockers.ownedDeliverables.length +
            preflight.blockers.ownedEpics.length +
            preflight.blockers.ownedMilestones.length +
            preflight.blockers.ownedSprints.length;
          failed.push({ id, reason: `User owns ${blockerCount} entities that must be transferred first` });
        }
        continue;
      }

      await deleteUser(id);
      deleted.push(id);
    } catch (error: any) {
      failed.push({ id, reason: error.message || "Unknown error" });
    }
  }

  return { deleted, archived, failed };
}

export async function bulkDelete(ids: string[]): Promise<{ deleted: number; failed: string[] }> {
  const result = await bulkDeleteWithPreflight(ids, "archive");
  return {
    deleted: result.deleted.length + result.archived.length,
    failed: result.failed.map(f => f.id)
  };
}
