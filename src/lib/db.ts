import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL no está definida');
}

export const pool = new Pool({
  connectionString,
  // por seguridad con Neon en serverless:
  ssl: {
    rejectUnauthorized: false,
  },
});