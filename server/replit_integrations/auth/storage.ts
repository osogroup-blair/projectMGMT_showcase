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
      
      if (existingUserByEmail && existingUserByEmail.id !== userData.id) {
        // User was imported with a different ID - update their ID to match auth provider
        // Store the original ID as externalId if not already set
        const [updatedUser] = await db
          .update(users)
          .set({
            id: userData.id, // Update to auth provider ID
            firstName: userData.firstName || existingUserByEmail.firstName,
            lastName: userData.lastName || existingUserByEmail.lastName,
            profileImageUrl: userData.profileImageUrl || existingUserByEmail.profileImageUrl,
            name: name || existingUserByEmail.name,
            externalId: existingUserByEmail.externalId || existingUserByEmail.id, // Preserve original ID
            updatedAt: new Date(),
          })
          .where(eq(users.email, userData.email))
          .returning();
        return updatedUser;
      }
    }

    // Standard upsert by ID
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
