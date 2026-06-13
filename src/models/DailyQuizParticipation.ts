import mongoose, { Document, Schema } from 'mongoose';

export interface IDailyQuizParticipation extends Document {
  userId: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  selectedAnswerIndex: number;
  isCorrect: boolean;
  submittedAt: Date;
}

const schema = new Schema<IDailyQuizParticipation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    quizId: { type: Schema.Types.ObjectId, ref: 'DailyQuiz', required: true, index: true },
    selectedAnswerIndex: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Unique: one submission per user per quiz
schema.index({ userId: 1, quizId: 1 }, { unique: true });
schema.index({ quizId: 1, isCorrect: 1 });

export const DailyQuizParticipation = mongoose.model<IDailyQuizParticipation>(
  'DailyQuizParticipation',
  schema
);
