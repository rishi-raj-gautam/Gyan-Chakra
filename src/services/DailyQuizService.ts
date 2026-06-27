import { dailyQuizRepository } from '../repositories/DailyQuizRepository';
import { ApiError } from '../utils/apiError';
import { QuizStatus } from '../models/DailyQuiz';
import { userRepository } from '../repositories/UserRepository';
import { notificationService } from './NotificationService';
import { logger } from '../utils/logger';

export class DailyQuizService {
  async createQuiz(data: any, adminId: string) {
    const status = data.status || QuizStatus.SCHEDULED;
    const quiz = await dailyQuizRepository.create({ ...data, createdBy: adminId, status });
    if (status === QuizStatus.ACTIVE) {
      await notificationService.sendQuizStarted({
        id: quiz.id || quiz._id.toString(),
        title: quiz.title,
        rewardAmount: quiz.rewardAmount,
      }).catch((err) => logger.error('[DailyQuizService] Failed to send active quiz notification:', err));
    }
    return quiz;
  }

  async updateQuiz(id: string, data: any) {
    const quiz = await dailyQuizRepository.findById(id);
    if (!quiz) throw ApiError.notFound('Quiz not found');
    if (quiz.status === QuizStatus.ACTIVE || quiz.status === QuizStatus.COMPLETED) {
      throw ApiError.badRequest('Cannot edit an active or completed quiz');
    }
    const updatedQuiz = await dailyQuizRepository.update(id, data);
    if (updatedQuiz && data.status === QuizStatus.ACTIVE) {
      await notificationService.sendQuizStarted({
        id: updatedQuiz.id || updatedQuiz._id.toString(),
        title: updatedQuiz.title,
        rewardAmount: updatedQuiz.rewardAmount,
      }).catch((err) => logger.error('[DailyQuizService] Failed to send active quiz notification:', err));
    }
    return updatedQuiz;
  }

  async deleteQuiz(id: string) {
    const quiz = await dailyQuizRepository.findById(id);
    if (!quiz) throw ApiError.notFound('Quiz not found');
    if (quiz.status === QuizStatus.ACTIVE) throw ApiError.badRequest('Cannot delete active quiz');
    await dailyQuizRepository.delete(id);
  }

  async getActiveQuiz(userId?: string) {
    const quiz = await dailyQuizRepository.findActive();
    if (!quiz) return null;

    // Check if user already participated
    let hasParticipated = false;
    let userParticipation = null;
    if (userId) {
      userParticipation = await dailyQuizRepository.findParticipation(userId, quiz.id);
      hasParticipated = !!userParticipation;
    }

    // Hide correct answer from response
    const quizData = quiz.toJSON();
    return {
      ...quizData,
      correctAnswerIndex: undefined,
      hasParticipated,
      userParticipation: hasParticipated ? userParticipation : null,
    };
  }

  async submitAnswer(userId: string, quizId: string, selectedAnswerIndex: number) {
    const quiz = await dailyQuizRepository.findById(quizId);
    if (!quiz) throw ApiError.notFound('Quiz not found');
    if (quiz.status !== QuizStatus.ACTIVE) throw ApiError.badRequest('Quiz is not active');

    // Check duplicate submission
    const existing = await dailyQuizRepository.findParticipation(userId, quizId);
    if (existing) throw ApiError.conflict('You have already submitted your answer');

    const isCorrect = selectedAnswerIndex === quiz.correctAnswerIndex;

    const participation = await dailyQuizRepository.createParticipation({
      userId: userId as any,
      quizId: quizId as any,
      selectedAnswerIndex,
      isCorrect,
    });

    await dailyQuizRepository.incrementParticipants(quizId, isCorrect);
    await userRepository.incrementStats(userId, false);

    return {
      isCorrect,
      correctAnswerIndex: quiz.correctAnswerIndex,
      message: isCorrect
        ? '🎉 Correct! You are in the lucky draw pool.'
        : 'Incorrect answer. Better luck next time!',
    };
  }

  async getQuizResult(quizId: string, userId: string) {
    const quiz = await dailyQuizRepository.findById(quizId);
    if (!quiz) throw ApiError.notFound('Quiz not found');

    const participation = await dailyQuizRepository.findParticipation(userId, quizId);

    return {
      quiz: {
        id: quiz.id,
        title: quiz.title,
        question: quiz.question,
        correctAnswerIndex: quiz.correctAnswerIndex,
        participantsCount: quiz.participantsCount,
        correctAnswersCount: quiz.correctAnswersCount,
      },
      participation,
    };
  }

  async getAllQuizzes(skip: number, limit: number) {
    return dailyQuizRepository.findAll(skip, limit);
  }
}

export const dailyQuizService = new DailyQuizService();
