import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import crypto from "crypto";
import fs from "fs";

if (!process.env.FIREBASE_PROJECT_ID) {
  process.env.FIREBASE_PROJECT_ID = "demo-projectmgmt";
}

console.log("INITIALIZING FIRESTORE CLIENT:");
console.log("- FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
console.log("- FIRESTORE_EMULATOR_HOST:", process.env.FIRESTORE_EMULATOR_HOST);

if (getApps().length === 0) {
  const config: any = {
    projectId: process.env.FIREBASE_PROJECT_ID,
  };

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      config.credential = cert(serviceAccount);
      console.log("- Credentials loaded from FIREBASE_SERVICE_ACCOUNT_JSON env variable");
    } catch (err: any) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:", err.message);
    }
  } else {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credPath && fs.existsSync(credPath)) {
      console.log("- GOOGLE_APPLICATION_CREDENTIALS loaded from:", credPath);
      config.credential = cert(credPath);
    }
  }

  initializeApp(config);
}

// Actual Firestore database instance
export const firestoreDb = getFirestore();

// Helper to convert Firestore dates
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

import { FieldValue } from "firebase-admin/firestore";

// Clean data of undefined values for Firestore, and convert SQL increment objects into Firestore FieldValue.increment
function cleanForFirestore(data: any): any {
  if (!data) return data;
  const clean = { ...data };
  for (const key of Object.keys(clean)) {
    if (clean[key] === undefined) {
      delete clean[key];
      continue;
    }
    // Handle Drizzle SQL objects (typically increments in updates)
    const val = clean[key];
    if (val && typeof val === 'object') {
      // Check if it's a Drizzle SQL object (custom prototype or has queryChunks/sql/params)
      if (val.constructor && val.constructor.name === 'SQL' || val.queryChunks) {
        // Look for increment patterns (+ 1)
        const chunks = val.queryChunks || [];
        const isIncrement = chunks.some((c: any) => typeof c === 'string' && c.includes('+'));
        if (isIncrement) {
          clean[key] = FieldValue.increment(1);
        } else {
          // Fallback: strip SQL objects that aren't increments
          delete clean[key];
        }
      }
    }
  }
  return clean;
}

// Parse Drizzle Expressions into field filters
function extractConditions(expr: any): any[] {
  if (!expr) return [];
  const chunks = expr.queryChunks || [];
  
  if (expr.conditions) {
    let list: any[] = [];
    for (const cond of expr.conditions) {
      list = list.concat(extractConditions(cond));
    }
    return list;
  }
  
  const conditions: any[] = [];
  let currentColumn: string | null = null;
  let currentOperator: string | null = null;
  
  for (const chunk of chunks) {
    if (chunk && (chunk.conditions || chunk.queryChunks)) {
      conditions.push(...extractConditions(chunk));
    } else if (chunk && typeof chunk.name === 'string' && chunk.table) {
      currentColumn = chunk.name;
    } else if (chunk && Array.isArray(chunk.value)) {
      const opStr = chunk.value.join('').trim().toLowerCase();
      if (['=', '!=', '>', '>=', '<', '<=', 'is null', 'is not null', 'in', 'not in'].includes(opStr)) {
        currentOperator = opStr;
      }
    } else if (chunk && chunk.value !== undefined && currentColumn) {
      conditions.push({
        column: currentColumn,
        operator: currentOperator || '=',
        value: chunk.value
      });
      currentColumn = null;
      currentOperator = null;
    }
  }
  
  return conditions;
}

// Match a document against conditions
function matchConditions(docData: any, conditions: any[]): boolean {
  for (const cond of conditions) {
    const val = docData[cond.column];
    const target = cond.value;
    
    switch (cond.operator) {
      case '=':
        if (val !== target) return false;
        break;
      case '!=':
        if (val === target) return false;
        break;
      case 'is null':
        if (val !== null && val !== undefined) return false;
        break;
      case 'is not null':
        if (val === null || val === undefined) return false;
        break;
      case 'in':
        if (Array.isArray(target) && !target.includes(val)) return false;
        break;
      default:
        // default to equality check
        if (val !== target) return false;
    }
  }
  return true;
}

// Robust Drizzle table name extractor
function getTableName(table: any): string {
  if (!table) return "";
  if (typeof table === 'string') return table;
  if (table._?.name) return table._.name;
  if (table.tableName) return table.tableName;
  
  const symbols = Object.getOwnPropertySymbols(table);
  for (const sym of symbols) {
    if (sym.toString().includes("drizzle:BaseName")) {
      return table[sym];
    }
  }
  return "";
}

// Mock Query Builder implementing Drizzle interface
class MockQueryBuilder {
  private tableName: string = "";
  private operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private data: any = null;
  private whereExpr: any = null;

  constructor(operation: 'select' | 'insert' | 'update' | 'delete', table?: any) {
    this.operation = operation;
    if (table) {
      this.tableName = getTableName(table);
    }
  }

  from(table: any) {
    if (table) {
      this.tableName = getTableName(table);
    }
    return this;
  }

  values(data: any) {
    this.data = data;
    return this;
  }

  set(data: any) {
    this.data = data;
    return this;
  }

  where(expr: any) {
    this.whereExpr = expr;
    return this;
  }

  returning() {
    return this;
  }

  orderBy(..._args: any[]) {
    return this;
  }

  limit(_n: number) {
    return this;
  }

  offset(_n: number) {
    return this;
  }

  leftJoin(_table: any, _on: any) {
    return this;
  }

  innerJoin(_table: any, _on: any) {
    return this;
  }

  groupBy(..._args: any[]) {
    return this;
  }

  having(_expr: any) {
    return this;
  }

  // Promise thenable implementation to execute query on await
  async then(resolve: any, reject: any) {
    try {
      const res = await this.execute();
      resolve(res);
    } catch (err) {
      reject(err);
    }
  }

  async execute() {
    const colName = this.tableName;
    if (!colName) {
      throw new Error("Table name is not defined in query builder");
    }

    const conditions = extractConditions(this.whereExpr);

    if (this.operation === 'select') {
      const snapshot = await firestoreDb.collection(colName).get();
      let list = snapshot.docs.map(doc => ({ id: doc.id, ...convertDates(doc.data()) }));
      
      if (conditions.length > 0) {
        list = list.filter(item => matchConditions(item, conditions));
      }
      return list;
    }

    if (this.operation === 'insert') {
      const items = Array.isArray(this.data) ? this.data : [this.data];
      const results: any[] = [];
      
      for (const item of items) {
        const id = item.id || crypto.randomUUID();
        const cleanData = cleanForFirestore(item);
        delete cleanData.id;
        
        const now = new Date();
        if (!cleanData.createdAt) cleanData.createdAt = now;
        if (!cleanData.updatedAt) cleanData.updatedAt = now;

        await firestoreDb.collection(colName).doc(id).set(cleanData);
        results.push({ ...cleanData, id });
      }
      
      return Array.isArray(this.data) ? results : results;
    }

    if (this.operation === 'update') {
      const snapshot = await firestoreDb.collection(colName).get();
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const matched = list.filter(item => matchConditions(item, conditions));
      const results: any[] = [];

      for (const item of matched) {
        const cleanData = cleanForFirestore(this.data);
        cleanData.updatedAt = new Date();
        await firestoreDb.collection(colName).doc(item.id).update(cleanData);
        results.push({ ...item, ...cleanData, id: item.id });
      }
      return results;
    }

    if (this.operation === 'delete') {
      const snapshot = await firestoreDb.collection(colName).get();
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const matched = list.filter(item => matchConditions(item, conditions));

      for (const item of matched) {
        await firestoreDb.collection(colName).doc(item.id).delete();
      }
      return matched;
    }
  }
}

// Export the mock Drizzle db client proxy
export const db: any = {
  select: () => new MockQueryBuilder('select'),
  insert: (table: any) => new MockQueryBuilder('insert', table),
  update: (table: any) => new MockQueryBuilder('update', table),
  delete: (table: any) => new MockQueryBuilder('delete', table),
};

// Reconnection and connection diagnostics
let isDatabaseReady = false;

export function isDatabaseConnected(): boolean {
  return isDatabaseReady;
}

export function setDatabaseReady(ready: boolean): void {
  isDatabaseReady = ready;
}

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await firestoreDb.listCollections();
    console.log('Firestore connection verified successfully');
    return true;
  } catch (error: any) {
    console.error('Firestore connection failed:', error.message);
    throw new Error(`Failed to connect to Firestore: ${error.message}`);
  }
}

export async function connectWithRetry(maxRetries = 5, initialDelay = 2000): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await testDatabaseConnection();
      return true;
    } catch (error: any) {
      if (attempt === maxRetries) {
        console.error(`Firestore connection failed after ${attempt} attempts: ${error.message}`);
        throw error;
      }
      
      const delay = initialDelay * Math.pow(2, attempt - 1);
      console.log(`Firestore connection attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}
