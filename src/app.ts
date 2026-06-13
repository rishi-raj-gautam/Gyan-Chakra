import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { errorMiddleware } from './middlewares/error.middleware';
import { logger } from './utils/logger';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import dailyQuizRoutes from './routes/dailyQuiz.routes';
import megaChallengeRoutes from './routes/megaChallenge.routes';
import walletRoutes from './routes/wallet.routes';
import notificationRoutes from './routes/notification.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: env.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Logging
if (env.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
}

// Health check
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Gyaan Chakra API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: env.nodeEnv,
  });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Gyaan Chakra API Docs',
}));

// API Routes
const API_PREFIX = '/api/v1';
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/daily-quiz`, dailyQuizRoutes);
app.use(`${API_PREFIX}/mega-challenge`, megaChallengeRoutes);
app.use(`${API_PREFIX}/wallet`, walletRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorMiddleware);

export default app;
