// src/lib/db.ts
import pkg from 'pg';
const { Pool } = pkg;

const connectionString = import.meta.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no está definida en .env");
}

export const pool = new Pool({
  connectionString,
});
