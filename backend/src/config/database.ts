import { Pool, PoolConfig } from 'pg';
import { config } from './environment';
import { logger } from './logger';

let pool: Pool | null = null;

export const getDatabasePool = (): Pool => {
  if (pool) {
    return pool;
  }

  const poolConfig: PoolConfig = {
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };

  // Use DATABASE_URL if provided (for production)
  if (config.database.url) {
    pool = new Pool({
      connectionString: config.database.url,
      ...poolConfig,
    });
  } else {
    pool = new Pool(poolConfig);
  }

  pool.on('error', (err) => {
    logger.error('Unexpected error on idle client', err);
  });

  pool.on('connect', () => {
    logger.info('Database connection established');
  });

  return pool;
};

export const closeDatabasePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database pool closed');
  }
};

// Test database connection
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const db = getDatabasePool();
    const result = await db.query('SELECT NOW()');
    logger.info('Database connection test successful', { time: result.rows[0].now });
    return true;
  } catch (error) {
    logger.error('Database connection test failed', error);
    return false;
  }
};
