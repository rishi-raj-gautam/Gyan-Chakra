import * as admin from 'firebase-admin';
import { env } from './env';
import { logger } from '../utils/logger';

let messaging: admin.messaging.Messaging | null = null;
let isFirebaseInitialized = false;

try {
  if (env.firebase.projectId && env.firebase.privateKey && env.firebase.clientEmail) {
    // Process private key to handle newline characters if loaded from env string format
    const privateKey = env.firebase.privateKey.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.firebase.projectId,
        privateKey: privateKey,
        clientEmail: env.firebase.clientEmail,
      }),
    });
    
    messaging = admin.messaging();
    isFirebaseInitialized = true;
    logger.info('✅ Firebase Admin SDK initialized successfully');
  } else {
    logger.warn('⚠️ Firebase credentials not fully configured. Notification service will run in log-only mode.');
  }
} catch (error) {
  logger.error('❌ Failed to initialize Firebase Admin SDK:', error);
}

export { messaging, isFirebaseInitialized };
