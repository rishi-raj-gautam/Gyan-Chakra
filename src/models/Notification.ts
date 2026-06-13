import mongoose, { Document, Schema } from 'mongoose';

export enum NotificationType {
  QUIZ_STARTED = 'quiz_started',
  QUIZ_RESULT = 'quiz_result',
  WINNER_ANNOUNCED = 'winner_announced',
  MEGA_CHALLENGE_OPEN = 'mega_challenge_open',
  REWARD_CREDITED = 'reward_credited',
  PROMOTIONAL = 'promotional',
  SYSTEM = 'system',
}

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  isSent: boolean;
  sentAt?: Date;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false, index: true },
    isSent: { type: Boolean, default: false },
    sentAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
