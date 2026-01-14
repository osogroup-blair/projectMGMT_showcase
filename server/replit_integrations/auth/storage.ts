import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const name = [userData.firstName, userData.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || userData.email || "User";

    // Check 1: User exists by the provided ID (direct match or SSO ID as primary key)
    if (userData.id) {
      const existingById = await this.getUser(userData.id);
      if (existingById) {
        // User exists with this ID - update profile fields but preserve existing data
        const [updatedUser] = await db
          .update(users)
          .set({
            email: existingById.email || userData.email,
            firstName: existingById.firstName || userData.firstName,
            lastName: existingById.lastName || userData.lastName,
            profileImageUrl: existingById.profileImageUrl || userData.profileImageUrl,
            name: existingById.name || name,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userData.id))
          .returning();
        return updatedUser;
      }
    }

    // Check 2: User exists by email (imported user or different auth provider)
    if (userData.email) {
      const existingUserByEmail = await this.getUserByEmail(userData.email);
      
      if (existingUserByEmail) {
        // User already exists - preserve their original ID, just update profile fields
        // Store the SSO provider ID as externalId for reference
        const [updatedUser] = await db
          .update(users)
          .set({
            // DO NOT change the id - keep the original user ID intact
            // Only update profile fields if not already set
            firstName: existingUserByEmail.firstName || userData.firstName,
            lastName: existingUserByEmail.lastName || userData.lastName,
            profileImageUrl: existingUserByEmail.profileImageUrl || userData.profileImageUrl,
            name: existingUserByEmail.name || name,
            // Store the SSO provider ID as externalId for linking purposes
            externalId: existingUserByEmail.externalId || userData.id,
            updatedAt: new Date(),
          })
          .where(eq(users.email, userData.email))
          .returning();
        return updatedUser;
      }
    }

    // No existing user - create new user with the provided ID
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        name,
      })
      .returning();
    return user;
  }
}

export const authStorage = new AuthStorage();
