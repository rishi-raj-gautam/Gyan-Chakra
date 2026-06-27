import { megaChallengeRepository } from '../repositories/MegaChallengeRepository';
import { ApiError } from '../utils/apiError';
import { ChallengeStatus } from '../models/MegaChallenge';
import { userRepository } from '../repositories/UserRepository';
import { notificationService } from './NotificationService';
import { logger } from '../utils/logger';

export class MegaChallengeService {
  async createChallenge(data: any, adminId: string) {
    if (!data.questions || data.questions.length !== 10) {
      throw ApiError.badRequest('Mega Challenge must have exactly 10 questions');
    }
    const challenge = await megaChallengeRepository.create({ ...data, createdBy: adminId });
    if (challenge.status === ChallengeStatus.OPEN) {
      await notificationService.sendChallengeOpened({
        id: challenge.id || challenge._id.toString(),
        title: challenge.title,
        rewardAmount: challenge.rewardAmount,
      }).catch((err) => logger.error('[MegaChallengeService] Failed to send challenge open notification:', err));
    }
    return challenge;
  }

  async updateChallenge(id: string, data: any) {
    const challenge = await megaChallengeRepository.findById(id);
    if (!challenge) throw ApiError.notFound('Challenge not found');
    if (challenge.status === ChallengeStatus.CLOSED || challenge.status === ChallengeStatus.COMPLETED) {
      throw ApiError.badRequest('Cannot edit a closed or completed challenge');
    }
    const updated = await megaChallengeRepository.update(id, data);
    if (updated && data.status === ChallengeStatus.OPEN && challenge.status !== ChallengeStatus.OPEN) {
      await notificationService.sendChallengeOpened({
        id: updated.id || updated._id.toString(),
        title: updated.title,
        rewardAmount: updated.rewardAmount,
      }).catch((err) => logger.error('[MegaChallengeService] Failed to send challenge open notification:', err));
    }
    return updated;
  }

  async deleteChallenge(id: string) {
    const challenge = await megaChallengeRepository.findById(id);
    if (!challenge) throw ApiError.notFound('Challenge not found');
    if (challenge.status === ChallengeStatus.OPEN) throw ApiError.badRequest('Cannot delete open challenge');
    await megaChallengeRepository.delete(id);
  }

  async getActiveChallenge(userId?: string) {
    const challenge = await megaChallengeRepository.findActive();
    if (!challenge) return null;

    let hasParticipated = false;
    let participation = null;
    if (userId) {
      participation = await megaChallengeRepository.findParticipation(userId, challenge.id);
      hasParticipated = !!participation;
    }

    // Strip correct answers from questions
    const challengeData = challenge.toJSON();
    challengeData.questions = challengeData.questions.map((q: any) => ({
      question: q.question,
      options: q.options,
      points: q.points,
    }));

    return { ...challengeData, hasParticipated, participation };
  }

  async submitAnswers(userId: string, challengeId: string, answers: number[]) {
    const challenge = await megaChallengeRepository.findById(challengeId);
    if (!challenge) throw ApiError.notFound('Challenge not found');
    if (challenge.status !== ChallengeStatus.OPEN) {
      throw ApiError.badRequest('Challenge is not open');
    }
    if (answers.length !== challenge.questions.length) {
      throw ApiError.badRequest('Must answer all questions');
    }

    const existing = await megaChallengeRepository.findParticipation(userId, challengeId);
    if (existing) throw ApiError.conflict('You have already submitted answers');

    // Grade answers
    const gradedAnswers = answers.map((selectedIndex, i) => ({
      questionIndex: i,
      selectedAnswerIndex: selectedIndex,
      isCorrect: selectedIndex === challenge.questions[i].correctAnswerIndex,
    }));

    const score = gradedAnswers.filter((a) => a.isCorrect).length;
    const shortlisted = score === challenge.questions.length; // All correct

    const participation = await megaChallengeRepository.createParticipation({
      userId: userId as any,
      challengeId: challengeId as any,
      answers: gradedAnswers,
      score,
      shortlisted,
    });

    await megaChallengeRepository.incrementParticipants(challengeId, shortlisted);
    await userRepository.incrementStats(userId, false);

    return {
      score,
      totalQuestions: challenge.questions.length,
      shortlisted,
      correctAnswers: challenge.questions.map((q, i) => q.correctAnswerIndex),
      message: shortlisted
        ? '🎉 Perfect score! You are shortlisted for the grand prize draw!'
        : `You scored ${score}/${challenge.questions.length}. All correct answers needed to qualify.`,
    };
  }

  async getAllChallenges(skip: number, limit: number) {
    return megaChallengeRepository.findAll(skip, limit);
  }
}

export const megaChallengeService = new MegaChallengeService();
