import mongoose, { Document, Schema } from 'mongoose';

export enum ContestType {
  DAILY_QUIZ = 'daily_quiz',
  MEGA_CHALLENGE = 'mega_challenge',
}

export enum WinnerStatus {
  PENDING = 'pending',
  ANNOUNCED = 'announced',
  PAID = 'paid',
  DISQUALIFIED = 'disqualified',
}

export interface IWinner extends Document {
  contestType: ContestType;
  contestId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  rewardAmount: number;
  winnerStatus: WinnerStatus;
  announcementDate?: Date;
  remarks?: string;
  drawId: string;
  selectedBy: 'auto' | 'admin';
  selectedByAdminId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const winnerSchema = new Schema<IWinner>(
  {
    contestType: { type: String, enum: Object.values(ContestType), required: true, index: true },
    contestId: { type: Schema.Types.ObjectId, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rewardAmount: { type: Number, required: true },
    winnerStatus: { type: String, enum: Object.values(WinnerStatus), default: WinnerStatus.PENDING },
    announcementDate: { type: Date },
    remarks: { type: String },
    drawId: { type: String, required: true, unique: true },
    selectedBy: { type: String, enum: ['auto', 'admin'], default: 'auto' },
    selectedByAdminId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

winnerSchema.index({ contestType: 1, contestId: 1 });
winnerSchema.index({ userId: 1, createdAt: -1 });

export const Winner = mongoose.model<IWinner>('Winner', winnerSchema);
