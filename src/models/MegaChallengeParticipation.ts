import mongoose, { Document, Schema } from 'mongoose';

export interface IAnswer {
  questionIndex: number;
  selectedAnswerIndex: number;
  isCorrect: boolean;
}

export interface IMegaChallengeParticipation extends Document {
  userId: mongoose.Types.ObjectId;
  challengeId: mongoose.Types.ObjectId;
  answers: IAnswer[];
  score: number;
  totalQuestions: number;
  shortlisted: boolean;
  submittedAt: Date;
}

const schema = new Schema<IMegaChallengeParticipation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    challengeId: { type: Schema.Types.ObjectId, ref: 'MegaChallenge', required: true, index: true },
    answers: [
      {
        questionIndex: { type: Number, required: true },
        selectedAnswerIndex: { type: Number, required: true },
        isCorrect: { type: Boolean, required: true },
      },
    ],
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 10 },
    shortlisted: { type: Boolean, default: false, index: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// One submission per user per challenge
schema.index({ userId: 1, challengeId: 1 }, { unique: true });
schema.index({ challengeId: 1, score: -1 });

export const MegaChallengeParticipation = mongoose.model<IMegaChallengeParticipation>(
  'MegaChallengeParticipation',
  schema
);
