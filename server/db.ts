import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '@shared/schema';

const { Pool } = pg;

// Initialize PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Export drizzle DB instance
export const db = drizzle(pool, { schema });

// Export raw pool for direct query execution if needed
export { pool };