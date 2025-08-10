import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions';
import categoryRoutes from './routes/categories';

// Import database connection
import pool from './config/database';

// Import security middleware
import { apiLimiter, authLimiter, sanitizeInput } from './middleware/security';

// Import token cleanup service
import { TokenCleanupService } from './services/tokenCleanup';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Vercel serverless (required for rate limiting)
app.set('trust proxy', 1);

// Middleware
app.use(helmet()); // Security headers
app.use(morgan('combined')); // Logging
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://finance-app-ruby-nu.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use(apiLimiter); // Rate limiting
app.use(sanitizeInput); // Input sanitization

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Finance App Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes); // Auth routes with stricter rate limiting
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Global error handler', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message || 'Something went wrong!'
  });
});

// Test database connection and start server
const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    logger.debug('Database connection successful');

    // Start server
    app.listen(PORT, () => {
      logger.startup(`Finance App Backend running on port ${PORT}`);
      logger.debug(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.debug(`Health check: http://localhost:${PORT}/health`);
      logger.debug(`API Base URL: http://localhost:${PORT}/api`);
      
      // Start token cleanup service
      const tokenCleanup = TokenCleanupService.getInstance();
      tokenCleanup.startPeriodicCleanup();
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.startup('SIGTERM received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.startup('SIGINT received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

// Export app for Vercel serverless (CommonJS format)
module.exports = app;

// Start server only in non-serverless environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  startServer();
}
