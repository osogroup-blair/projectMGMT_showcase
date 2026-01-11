import { db } from "../../db";
import { users } from "@shared/models/auth";
import { userIdentities } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import type { 
  IdentityPublic,
  UserProfileWithIdentities,
  LinkIdentityRequest,
  UpdateIdentityRequest,
  UpdateProfileRequest,
  MergeUsersRequest,
  MergeUsersResult,
} from "@shared/contracts/user-identity";

function toIdentityPublic(identity: typeof userIdentities.$inferSelect): IdentityPublic {
  return {
    id: identity.id,
    userId: identity.userId,
    systemId: identity.systemId,
    systemType: identity.systemType,
    systemName: identity.systemName,
    workspaceId: identity.workspaceId,
    externalUserId: identity.externalUserId,
    externalUsername: identity.externalUsername,
    externalEmail: identity.externalEmail,
    identityType: identity.identityType,
    status: identity.status,
    roles: identity.roles as string[] | null,
    profile: identity.profile as IdentityPublic["profile"],
    syncSourceOfTruth: identity.syncSourceOfTruth,
    lastSyncedAt: identity.lastSyncedAt,
    syncStatus: identity.syncStatus,
    createdAt: identity.createdAt,
    updatedAt: identity.updatedAt,
  };
}

export async function getUserProfileWithIdentities(userId: string): Promise<UserProfileWithIdentities | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return null;

  const identities = await db
    .select()
    .from(userIdentities)
    .where(eq(userIdentities.userId, userId));

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
    avatar: user.avatar,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    identities: identities.map(toIdentityPublic),
    primaryIdentityId: identities.length > 0 ? identities[0].id : null,
  };
}

export async function updateUserProfile(
  userId: string, 
  data: UpdateProfileRequest,
  updatedBy?: string
): Promise<UserProfileWithIdentities | null> {
  const updateData: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle;
  if (data.avatar !== undefined) updateData.avatar = data.avatar;

  await db.update(users).set(updateData).where(eq(users.id, userId));

  return getUserProfileWithIdentities(userId);
}

export async function getUserIdentities(userId: string): Promise<IdentityPublic[]> {
  const identities = await db
    .select()
    .from(userIdentities)
    .where(eq(userIdentities.userId, userId));

  return identities.map(toIdentityPublic);
}

export async function getIdentityById(identityId: string): Promise<IdentityPublic | null> {
  const [identity] = await db
    .select()
    .from(userIdentities)
    .where(eq(userIdentities.id, identityId));

  return identity ? toIdentityPublic(identity) : null;
}

export async function linkIdentityToUser(
  userId: string,
  data: LinkIdentityRequest,
  createdBy?: string
): Promise<IdentityPublic> {
  const existingByExternal = await db
    .select()
    .from(userIdentities)
    .where(
      and(
        eq(userIdentities.systemId, data.systemId),
        eq(userIdentities.externalUserId, data.externalUserId),
        data.workspaceId ? eq(userIdentities.workspaceId, data.workspaceId) : sql`true`
      )
    );

  if (existingByExternal.length > 0) {
    const existing = existingByExternal[0];
    if (existing.userId !== userId) {
      throw new Error(`This external identity is already linked to another user`);
    }
    return toIdentityPublic(existing);
  }

  const id = `identity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const [created] = await db
    .insert(userIdentities)
    .values({
      id,
      userId,
      systemId: data.systemId,
      systemType: data.systemType || null,
      systemName: data.systemName || null,
      workspaceId: data.workspaceId || null,
      externalUserId: data.externalUserId,
      externalUsername: data.externalUsername || null,
      externalEmail: data.externalEmail || null,
      identityType: data.identityType || "user",
      status: "active",
      auth: data.auth ? {
        authType: data.auth.authType,
        provider: data.auth.provider,
        scopes: data.auth.scopes,
      } : null,
      profile: data.profile || null,
      roles: data.roles || [],
      syncSourceOfTruth: "external",
      syncStatus: "healthy",
      createdBy: createdBy || null,
      updatedBy: createdBy || null,
    })
    .returning();

  return toIdentityPublic(created);
}

export async function unlinkIdentityFromUser(
  userId: string,
  identityId: string
): Promise<boolean> {
  const identities = await db
    .select()
    .from(userIdentities)
    .where(eq(userIdentities.userId, userId));

  if (identities.length <= 1) {
    throw new Error("Cannot unlink the last identity. User must have at least one linked identity.");
  }

  const identityToRemove = identities.find(i => i.id === identityId);
  if (!identityToRemove) {
    throw new Error("Identity not found or does not belong to this user");
  }

  await db.delete(userIdentities).where(eq(userIdentities.id, identityId));
  return true;
}

export async function updateIdentity(
  identityId: string,
  data: UpdateIdentityRequest,
  updatedBy?: string
): Promise<IdentityPublic | null> {
  const updateData: Partial<typeof userIdentities.$inferInsert> = {
    updatedAt: new Date(),
    updatedBy: updatedBy || null,
  };

  if (data.status !== undefined) updateData.status = data.status;
  if (data.externalUsername !== undefined) updateData.externalUsername = data.externalUsername;
  if (data.externalEmail !== undefined) updateData.externalEmail = data.externalEmail;
  if (data.syncSourceOfTruth !== undefined) updateData.syncSourceOfTruth = data.syncSourceOfTruth;
  if (data.profile !== undefined) updateData.profile = data.profile;
  if (data.roles !== undefined) updateData.roles = data.roles;

  const [updated] = await db
    .update(userIdentities)
    .set(updateData)
    .where(eq(userIdentities.id, identityId))
    .returning();

  return updated ? toIdentityPublic(updated) : null;
}

export async function resolveOrCreateUserFromAuth(authPayload: {
  provider: string;
  externalUserId: string;
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}): Promise<{ user: UserProfileWithIdentities; created: boolean }> {
  const existingIdentity = await db
    .select()
    .from(userIdentities)
    .where(
      and(
        eq(userIdentities.systemId, authPayload.provider),
        eq(userIdentities.externalUserId, authPayload.externalUserId)
      )
    );

  if (existingIdentity.length > 0) {
    const profile = await getUserProfileWithIdentities(existingIdentity[0].userId);
    if (profile) {
      return { user: profile, created: false };
    }
  }

  let matchedUser: typeof users.$inferSelect | null = null;
  if (authPayload.email) {
    const [byEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, authPayload.email));
    matchedUser = byEmail || null;
  }

  if (!matchedUser) {
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const [created] = await db
      .insert(users)
      .values({
        id: userId,
        email: authPayload.email || null,
        name: authPayload.name || null,
        firstName: authPayload.firstName || null,
        lastName: authPayload.lastName || null,
        profileImageUrl: authPayload.avatarUrl || null,
        systemRole: "member",
        permissions: [],
      })
      .returning();
    matchedUser = created;
  }

  await linkIdentityToUser(matchedUser.id, {
    systemId: authPayload.provider,
    systemType: "identity_provider",
    systemName: authPayload.provider,
    externalUserId: authPayload.externalUserId,
    externalEmail: authPayload.email,
    identityType: "user",
    auth: {
      authType: "sso",
      provider: authPayload.provider,
    },
    profile: {
      displayName: authPayload.name,
      avatarUrl: authPayload.avatarUrl,
    },
  });

  const profile = await getUserProfileWithIdentities(matchedUser.id);
  return { user: profile!, created: !matchedUser };
}

export async function mergeUsers(
  request: MergeUsersRequest,
  performedBy: string
): Promise<MergeUsersResult> {
  const { sourceUserId, targetUserId } = request;

  if (sourceUserId === targetUserId) {
    throw new Error("Cannot merge a user into themselves");
  }

  const [sourceUser] = await db.select().from(users).where(eq(users.id, sourceUserId));
  const [targetUser] = await db.select().from(users).where(eq(users.id, targetUserId));

  if (!sourceUser || !targetUser) {
    throw new Error("One or both users not found");
  }

  const sourceIdentities = await db
    .select()
    .from(userIdentities)
    .where(eq(userIdentities.userId, sourceUserId));

  for (const identity of sourceIdentities) {
    await db
      .update(userIdentities)
      .set({
        userId: targetUserId,
        updatedAt: new Date(),
        updatedBy: performedBy,
      })
      .where(eq(userIdentities.id, identity.id));
  }

  await db
    .update(users)
    .set({
      status: `Merged into ${targetUserId}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, sourceUserId));

  return {
    mergedUserId: targetUserId,
    identitiesMoved: sourceIdentities.length,
    sourceUserMarkedMerged: true,
  };
}

export async function findIdentityByExternal(
  systemId: string,
  externalUserId: string,
  workspaceId?: string
): Promise<IdentityPublic | null> {
  const conditions = [
    eq(userIdentities.systemId, systemId),
    eq(userIdentities.externalUserId, externalUserId),
  ];
  
  if (workspaceId) {
    conditions.push(eq(userIdentities.workspaceId, workspaceId));
  }

  const [identity] = await db
    .select()
    .from(userIdentities)
    .where(and(...conditions));

  return identity ? toIdentityPublic(identity) : null;
}
