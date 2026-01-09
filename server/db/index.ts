import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

export const db = drizzle(pool, { schema });

export async function testDatabaseConnection(): Promise<boolean> {
  const timeout = 10000;
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Database connection timeout after ${timeout}ms`)), timeout);
  });
  
  try {
    const client = await Promise.race([pool.connect(), timeoutPromise]);
    await client.query('SELECT 1');
    client.release();
    console.log('Database connection verified successfully');
    return true;
  } catch (error: any) {
    console.error('Database connection failed:', error.message);
    throw new Error(`Failed to connect to database: ${error.message}`);
  }
}
