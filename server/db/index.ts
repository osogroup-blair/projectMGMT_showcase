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
  const isAdminShutdown = err.message?.includes('terminating connection') || 
                          (err as any).code === '57P01';
  if (isAdminShutdown) {
    console.log('Database connection terminated by admin (57P01) - will reconnect on next query');
  } else {
    console.error('Unexpected database pool error:', err.message);
  }
});

export const db = drizzle(pool, { schema });

let isDatabaseReady = false;

export function isDatabaseConnected(): boolean {
  return isDatabaseReady;
}

export function setDatabaseReady(ready: boolean): void {
  isDatabaseReady = ready;
}

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

export async function connectWithRetry(maxRetries = 5, initialDelay = 2000): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await testDatabaseConnection();
      return true;
    } catch (error: any) {
      const isRetryable = error.message?.includes('terminating connection') ||
                          error.message?.includes('57P01') ||
                          error.message?.includes('ECONNREFUSED') ||
                          error.message?.includes('timeout');
      
      if (attempt === maxRetries || !isRetryable) {
        console.error(`Database connection failed after ${attempt} attempts: ${error.message}`);
        throw error;
      }
      
      const delay = initialDelay * Math.pow(2, attempt - 1);
      console.log(`Database connection attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}
