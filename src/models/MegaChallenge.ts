import mongoose, { Document, Schema } from 'mongoose';

export enum ChallengeStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  CLOSED = 'closed',
  COMPLETED = 'completed',
}

export interface IQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  points: number;
}

export interface IMegaChallenge extends Document {
  title: string;
  description: string;
  bannerImage?: string;
  rewardAmount: number;
  startDate: Date;
  endDate: Date;
  status: ChallengeStatus;
  questions: IQuestion[];
  totalParticipants: number;
  shortlistedCount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswerIndex: { type: Number, required: true },
  points: { type: Number, default: 10 },
});

const megaChallengeSchema = new Schema<IMegaChallenge>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    bannerImage: { type: String },
    rewardAmount: { type: Number, required: true, default: 100000 },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: Object.values(ChallengeStatus), default: ChallengeStatus.DRAFT, index: true },
    questions: { type: [questionSchema], validate: [(v: IQuestion[]) => v.length === 10, 'Must have exactly 10 questions'] },
    totalParticipants: { type: Number, default: 0 },
    shortlistedCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

megaChallengeSchema.index({ status: 1, startDate: 1 });

export const MegaChallenge = mongoose.model<IMegaChallenge>('MegaChallenge', megaChallengeSchema);
