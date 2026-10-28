import 'dotenv/config';

import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? 'notification_rules_db',
  user: process.env.DB_USER ?? 'notification_rules_app',
  password: process.env.DB_PASSWORD,
  max: 5,
  connectionTimeoutMillis: 3000,
  idleTimeoutMillis: 10000,
});

pool.on('error', (error) => {
  console.error(
    '[DATABASE] Error en una conexión inactiva:',
    error
  );
});
