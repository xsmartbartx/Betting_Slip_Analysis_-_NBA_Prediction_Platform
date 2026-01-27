import { Pool } from 'pg';
import { config } from '../config/environment';
import { logger } from '../config/logger';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Initialize database - creates database if it doesn't exist
 */
async function initDatabase(): Promise<void> {
  // Connect to postgres database to create our target database
  const adminPool = new Pool({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: 'postgres', // Connect to default postgres database
  });

  try {
    logger.info('Checking if database exists...');

    // Check if database exists
    const result = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [config.database.name]
    );

    if (result.rows.length === 0) {
      logger.info(`Database '${config.database.name}' does not exist. Creating...`);
      await adminPool.query(`CREATE DATABASE ${config.database.name}`);
      logger.info(`Database '${config.database.name}' created successfully`);
    } else {
      logger.info(`Database '${config.database.name}' already exists`);
    }

    await adminPool.end();
  } catch (error) {
    logger.error('Error initializing database', error);
    await adminPool.end();
    throw error;
  }
}

/**
 * Run migrations
 */
async function runMigrations(): Promise<void> {
  // Use DATABASE_URL if provided, otherwise construct from config
  const poolConfig = config.database.url
    ? { connectionString: config.database.url }
    : {
        host: config.database.host,
        port: config.database.port,
        database: config.database.name,
        user: config.database.user,
        password: config.database.password,
      };

  const pool = new Pool(poolConfig);

  try {
    // Create migrations table to track applied migrations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get list of migration files
    const migrationsDir = path.join(__dirname, '../../migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    logger.info(`Found ${migrationFiles.length} migration file(s)`);

    for (const file of migrationFiles) {
      // Check if migration already applied
      const checkResult = await pool.query(
        'SELECT 1 FROM schema_migrations WHERE migration_name = $1',
        [file]
      );

      if (checkResult.rows.length > 0) {
        logger.info(`Migration ${file} already applied, skipping...`);
        continue;
      }

      logger.info(`Running migration: ${file}`);

      const migrationSQL = fs.readFileSync(
        path.join(migrationsDir, file),
        'utf-8'
      );

      // Execute migration
      await pool.query(migrationSQL);

      // Record migration
      await pool.query(
        'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
        [file]
      );

      logger.info(`Migration ${file} applied successfully`);
    }

    await pool.end();
    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Error running migrations', error);
    await pool.end();
    throw error;
  }
}

/**
 * Main initialization function
 */
async function main(): Promise<void> {
  try {
    logger.info('Starting database initialization...');

    // Step 1: Create database if it doesn't exist
    await initDatabase();

    // Step 2: Run migrations
    await runMigrations();

    logger.info('Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Database initialization failed', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { initDatabase, runMigrations };
