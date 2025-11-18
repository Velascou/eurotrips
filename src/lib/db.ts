// src/lib/db.ts
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

// Intentar leer de process.env
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL sigue sin estar definida. Comprueba tu archivo .env en la raíz del proyecto.');
  throw new Error('DATABASE_URL no está definida');
}

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // necesario con Neon en muchos casos
  },
});
