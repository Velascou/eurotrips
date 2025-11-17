import pkg from 'pg';

const { Pool } = pkg;
const connectionString = "postgresql://neondb_owner:npg_QHKO0h1uEbDI@ep-calm-rain-ab04vpsb-pooler.eu-west-2.aws.neon.tech/eurotrips?sslmode=require&channel_binding=require";
const pool = new Pool({
  connectionString
});

export { pool as p };
