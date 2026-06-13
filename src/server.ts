import app from './app';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { logger } from './utils/logger';
import { initCronJobs } from './cron';

const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Connect to Redis (optional)
    await connectRedis();

    // Start cron jobs
    initCronJobs();

    // Start server
    const server = app.listen(env.port, () => {
      logger.info(`
╔══════════════════════════════════════════╗
║     🧠 Gyaan Chakra API Server           ║
║     Port: ${env.port}                           ║
║     Env:  ${env.nodeEnv.padEnd(30)}║
║     Docs: http://localhost:${env.port}/api-docs  ║
╚══════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        const { disconnectDatabase } = await import('./config/database');
        await disconnectDatabase();
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection:', { reason, promise });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
