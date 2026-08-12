import type { User, UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { firestoreDb } from "../../db";
import crypto from "crypto";

function convertDates(data: any): any {
  if (!data) return data;
  const clean = { ...data };
  for (const key of Object.keys(clean)) {
    if (clean[key] && typeof clean[key].toDate === 'function') {
      clean[key] = clean[key].toDate();
    }
  }
  return clean;
}

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const doc = await firestoreDb.collection("users").doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...convertDates(doc.data()) } as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const snapshot = await firestoreDb.collection("users").where("email", "==", email).limit(1).get();
    if (snapshot.empty) return undefined;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...convertDates(doc.data()) } as User;
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
        const updateData = {
          email: existingById.email || userData.email,
          firstName: existingById.firstName || userData.firstName,
          lastName: existingById.lastName || userData.lastName,
          profileImageUrl: existingById.profileImageUrl || userData.profileImageUrl,
          name: existingById.name || name,
          updatedAt: new Date(),
        };
        await firestoreDb.collection("users").doc(userData.id).update(updateData);
        return { ...existingById, ...updateData };
      }
    }

    // Check 2: User exists by email (imported user or different auth provider)
    if (userData.email) {
      const existingUserByEmail = await this.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        const updateData = {
          firstName: existingUserByEmail.firstName || userData.firstName,
          lastName: existingUserByEmail.lastName || userData.lastName,
          profileImageUrl: existingUserByEmail.profileImageUrl || userData.profileImageUrl,
          name: existingUserByEmail.name || name,
          externalId: existingUserByEmail.externalId || userData.id,
          updatedAt: new Date(),
        };
        await firestoreDb.collection("users").doc(existingUserByEmail.id).update(updateData);
        return { ...existingUserByEmail, ...updateData };
      }
    }

    // No existing user - create new user with the provided ID
    const id = userData.id || crypto.randomUUID();
    const now = new Date();
    const newUser: any = {
      ...userData,
      name,
      createdAt: now,
      updatedAt: now,
    };
    delete newUser.id;
    for (const key of Object.keys(newUser)) {
      if (newUser[key] === undefined) delete newUser[key];
    }
    await firestoreDb.collection("users").doc(id).set(newUser);
    return { id, ...newUser } as User;
  }
}

export const authStorage = new AuthStorage();

