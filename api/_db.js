// Serverless-friendly Postgres Pool helper
// Reuse a global Pool across invocations to avoid exhausting connections.
import pkg from 'pg';
const { Pool } = pkg;

function getPool() {
  if (!global.__pgPool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required in env for DB connections');
    }
    global.__pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Keep max modest for free-tier DBs
      max: parseInt(process.env.PG_MAX_POOL || '6', 10),
      idleTimeoutMillis: 10000,
    });
  }
  return global.__pgPool;
}

export { getPool };
