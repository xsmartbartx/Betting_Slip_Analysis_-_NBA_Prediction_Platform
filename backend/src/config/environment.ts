import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || 'http://localhost:3001',

  // Database
  database: {
    url: process.env.DATABASE_URL || '',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    name: process.env.DATABASE_NAME || 'betting_app',
    user: process.env.DATABASE_USER || 'user',
    password: process.env.DATABASE_PASSWORD || 'password',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  // External APIs
  externalApis: {
    nbaApiKey: process.env.NBA_API_KEY || '',
    oddsApiKey: process.env.ODDS_API_KEY || '',
  },

  // ML Engine
  mlEngine: {
    url: process.env.ML_ENGINE_URL || 'http://localhost:8000',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};
