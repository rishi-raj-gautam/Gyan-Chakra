import { DailyQuiz, IDailyQuiz, QuizStatus } from '../models/DailyQuiz';
import { DailyQuizParticipation, IDailyQuizParticipation } from '../models/DailyQuizParticipation';

export class DailyQuizRepository {
  async create(data: Partial<IDailyQuiz>): Promise<IDailyQuiz> {
    return DailyQuiz.create(data);
  }

  async findById(id: string): Promise<IDailyQuiz | null> {
    return DailyQuiz.findById(id).populate('createdBy', 'name');
  }

  async findActive(): Promise<IDailyQuiz | null> {
    return DailyQuiz.findOne({ status: QuizStatus.ACTIVE });
  }

  async findScheduled(): Promise<IDailyQuiz[]> {
    return DailyQuiz.find({
      status: QuizStatus.SCHEDULED,
      startTime: { $lte: new Date() },
    });
  }

  async findExpired(): Promise<IDailyQuiz[]> {
    return DailyQuiz.find({
      status: QuizStatus.ACTIVE,
      endTime: { $lte: new Date() },
    });
  }

  async update(id: string, data: Partial<IDailyQuiz>): Promise<IDailyQuiz | null> {
    return DailyQuiz.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  async delete(id: string): Promise<void> {
    await DailyQuiz.findByIdAndDelete(id);
  }

  async findAll(skip = 0, limit = 20): Promise<{ quizzes: IDailyQuiz[]; total: number }> {
    const [quizzes, total] = await Promise.all([
      DailyQuiz.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      DailyQuiz.countDocuments(),
    ]);
    return { quizzes, total };
  }

  async incrementParticipants(quizId: string, isCorrect: boolean): Promise<void> {
    await DailyQuiz.findByIdAndUpdate(quizId, {
      $inc: {
        participantsCount: 1,
        ...(isCorrect ? { correctAnswersCount: 1 } : {}),
      },
    });
  }

  // Participation
  async findParticipation(userId: string, quizId: string): Promise<IDailyQuizParticipation | null> {
    return DailyQuizParticipation.findOne({ userId, quizId });
  }

  async createParticipation(data: Partial<IDailyQuizParticipation>): Promise<IDailyQuizParticipation> {
    return DailyQuizParticipation.create(data);
  }

  async getCorrectParticipants(quizId: string): Promise<IDailyQuizParticipation[]> {
    return DailyQuizParticipation.find({ quizId, isCorrect: true }).populate('userId');
  }

  async getParticipationStats(quizId: string) {
    return DailyQuizParticipation.aggregate([
      { $match: { quizId: new (require('mongoose').Types.ObjectId)(quizId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          correct: { $sum: { $cond: ['$isCorrect', 1, 0] } },
        },
      },
    ]);
  }
}

export const dailyQuizRepository = new DailyQuizRepository();
