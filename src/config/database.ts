import { Pool } from 'pg';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

// Xata PostgreSQL connection (production) or local PostgreSQL (development)
const isProduction = process.env.NODE_ENV === 'production';
const xataUrl = process.env.XATA_DATABASE_URL;

let poolConfig;

if (isProduction && xataUrl) {
  // Xata PostgreSQL configuration (production)
  poolConfig = {
    connectionString: xataUrl,
    ssl: {
      rejectUnauthorized: false
    },
    max: 20, // Free tier: 20 concurrent connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
  logger.info('Using Xata PostgreSQL database');
} else {
  // Local PostgreSQL configuration (development)
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'finance_app',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
  logger.info('Using local PostgreSQL database');
}

const pool = new Pool(poolConfig);

// Test database connection
pool.on('connect', () => {
  const dbType = isProduction && xataUrl ? 'Xata PostgreSQL' : 'local PostgreSQL';
  logger.info(`Connected to ${dbType} database`);
});

pool.on('error', (err) => {
  logger.error('Database connection error', err);
  process.exit(-1);
});

export default pool;
