import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

export const connectDatabase = async (retries = MAX_RETRIES): Promise<void> => {
  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info('✅ MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  } catch (error) {
    if (retries > 0) {
      logger.warn(`MongoDB connection failed. Retrying in ${RETRY_DELAY_MS / 1000}s... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDatabase(retries - 1);
    }
    logger.error('MongoDB connection failed after all retries:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
};
