import mongoose, { Document, Schema } from 'mongoose';

export enum QuizStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  COMPLETED = 'completed',
}

export interface IOption {
  text: string;
  index: number;
}

export interface IDailyQuiz extends Document {
  title: string;
  question: string;
  options: IOption[];
  correctAnswerIndex: number;
  rewardAmount: number;
  startTime: Date;
  endTime: Date;
  status: QuizStatus;
  participantsCount: number;
  correctAnswersCount: number;
  createdBy: mongoose.Types.ObjectId;
  winnerId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const dailyQuizSchema = new Schema<IDailyQuiz>(
  {
    title: { type: String, required: true, trim: true },
    question: { type: String, required: true, trim: true },
    options: [
      {
        text: { type: String, required: true },
        index: { type: Number, required: true },
      },
    ],
    correctAnswerIndex: { type: Number, required: true, min: 0, max: 3 },
    rewardAmount: { type: Number, required: true, min: 0 },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true },
    status: { type: String, enum: Object.values(QuizStatus), default: QuizStatus.DRAFT, index: true },
    participantsCount: { type: Number, default: 0 },
    correctAnswersCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    winnerId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

dailyQuizSchema.index({ status: 1, startTime: 1 });
dailyQuizSchema.index({ createdAt: -1 });

export const DailyQuiz = mongoose.model<IDailyQuiz>('DailyQuiz', dailyQuizSchema);
