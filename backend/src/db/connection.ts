import pg from 'pg';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
if (!process.env.DATABASE_URL) {
  dotenv.config();
}

// Get DATABASE_URL from environment variables or .env file
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('[v0] ERROR: DATABASE_URL is not set!');
  console.error('[v0] Please set DATABASE_URL in your environment variables or .env file.');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('[v0] Unexpected error on idle client', err);
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export const getClient = async () => {
  return pool.connect();
};

export { pool };

export default pool;
