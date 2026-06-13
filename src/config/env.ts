import { z } from 'zod';
import dotenv from 'dotenv';

const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: envFile });

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  REDIS_URL: z.string().optional(),
  REDIS_ENABLED: z.string().default('false'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().default('587'),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('Gyaan Chakra <noreply@gyaanchakra.com>'),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX: z.string().default('100'),
  OTP_EXPIRY_MINUTES: z.string().default('10'),
  REFERRAL_REWARD_AMOUNT: z.string().default('50'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  port: parseInt(parsed.data.PORT, 10),
  nodeEnv: parsed.data.NODE_ENV,
  isDev: parsed.data.NODE_ENV === 'development',
  isProd: parsed.data.NODE_ENV === 'production',
  mongoUri: parsed.data.MONGO_URI,
  jwt: {
    secret: parsed.data.JWT_SECRET,
    refreshSecret: parsed.data.JWT_REFRESH_SECRET,
    expiresIn: parsed.data.JWT_EXPIRES_IN,
    refreshExpiresIn: parsed.data.JWT_REFRESH_EXPIRES_IN,
  },
  redis: {
    url: parsed.data.REDIS_URL,
    enabled: parsed.data.REDIS_ENABLED === 'true',
  },
  cloudinary: {
    cloudName: parsed.data.CLOUDINARY_CLOUD_NAME,
    apiKey: parsed.data.CLOUDINARY_API_KEY,
    apiSecret: parsed.data.CLOUDINARY_API_SECRET,
  },
  email: {
    host: parsed.data.EMAIL_HOST,
    port: parseInt(parsed.data.EMAIL_PORT, 10),
    user: parsed.data.EMAIL_USER,
    pass: parsed.data.EMAIL_PASS,
    from: parsed.data.EMAIL_FROM,
  },
  firebase: {
    projectId: parsed.data.FIREBASE_PROJECT_ID,
    privateKey: parsed.data.FIREBASE_PRIVATE_KEY,
    clientEmail: parsed.data.FIREBASE_CLIENT_EMAIL,
  },
  rateLimit: {
    windowMs: parseInt(parsed.data.RATE_LIMIT_WINDOW_MS, 10),
    max: parseInt(parsed.data.RATE_LIMIT_MAX, 10),
  },
  otpExpiryMinutes: parseInt(parsed.data.OTP_EXPIRY_MINUTES, 10),
  referralRewardAmount: parseInt(parsed.data.REFERRAL_REWARD_AMOUNT, 10),
  allowedOrigins: parsed.data.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
};
