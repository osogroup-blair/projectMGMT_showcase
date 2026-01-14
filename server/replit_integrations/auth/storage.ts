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

    // First, check if a user with this email already exists (e.g., imported user)
    // This enables matching imported users to authenticated users
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

    // No existing user by email - create new user with the SSO provider ID
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        name,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          name,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
}

export const authStorage = new AuthStorage();
