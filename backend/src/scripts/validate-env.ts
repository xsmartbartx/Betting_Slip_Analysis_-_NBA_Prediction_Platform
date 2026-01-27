import { config } from '../config/environment';
import { logger } from '../config/logger';
import { testDatabaseConnection } from '../config/database';

/**
 * Validate environment configuration
 */
async function validateEnvironment(): Promise<boolean> {
  const errors: string[] = [];
  const warnings: string[] = [];

  logger.info('Validating environment configuration...');

  // Check database configuration
  if (!config.database.url) {
    // If no DATABASE_URL, check individual components
    if (!config.database.host) {
      errors.push('DATABASE_URL or DATABASE_HOST must be set');
    }
    if (!config.database.name) {
      errors.push('DATABASE_NAME must be set');
    }
    if (!config.database.user) {
      errors.push('DATABASE_USER must be set');
    }
  }

  // Check JWT configuration
  if (config.jwt.secret === 'your-secret-key' || config.jwt.secret.length < 32) {
    warnings.push('JWT_SECRET should be changed from default and be at least 32 characters');
  }

  if (config.jwt.refreshSecret === 'your-refresh-secret-key' || config.jwt.refreshSecret.length < 32) {
    warnings.push('JWT_REFRESH_SECRET should be changed from default and be at least 32 characters');
  }

  // Check external API keys (warnings only, not required for basic functionality)
  if (!config.externalApis.nbaApiKey) {
    warnings.push('NBA_API_KEY not set - NBA data features will be limited');
  }

  if (!config.externalApis.oddsApiKey) {
    warnings.push('ODDS_API_KEY not set - Odds data features will be limited');
  }

  // Display warnings
  if (warnings.length > 0) {
    logger.warn('Configuration warnings:');
    warnings.forEach((warning) => logger.warn(`  - ${warning}`));
  }

  // Display errors and exit if any
  if (errors.length > 0) {
    logger.error('Configuration errors:');
    errors.forEach((error) => logger.error(`  - ${error}`));
    return false;
  }

  logger.info('Environment configuration is valid');

  // Test database connection
  logger.info('Testing database connection...');
  const dbConnected = await testDatabaseConnection();

  if (!dbConnected) {
    logger.error('Database connection test failed');
    return false;
  }

  logger.info('All environment validations passed');
  return true;
}

/**
 * Main validation function
 */
async function main(): Promise<void> {
  try {
    const isValid = await validateEnvironment();
    process.exit(isValid ? 0 : 1);
  } catch (error) {
    logger.error('Environment validation failed', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { validateEnvironment };
