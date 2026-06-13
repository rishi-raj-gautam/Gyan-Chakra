import { MegaChallenge, IMegaChallenge, ChallengeStatus } from '../models/MegaChallenge';
import { MegaChallengeParticipation, IMegaChallengeParticipation } from '../models/MegaChallengeParticipation';

export class MegaChallengeRepository {
  async create(data: Partial<IMegaChallenge>): Promise<IMegaChallenge> {
    return MegaChallenge.create(data);
  }

  async findById(id: string): Promise<IMegaChallenge | null> {
    return MegaChallenge.findById(id);
  }

  async findActive(): Promise<IMegaChallenge | null> {
    return MegaChallenge.findOne({ status: ChallengeStatus.OPEN });
  }

  async update(id: string, data: Partial<IMegaChallenge>): Promise<IMegaChallenge | null> {
    return MegaChallenge.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  async delete(id: string): Promise<void> {
    await MegaChallenge.findByIdAndDelete(id);
  }

  async findAll(skip = 0, limit = 20) {
    const [challenges, total] = await Promise.all([
      MegaChallenge.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      MegaChallenge.countDocuments(),
    ]);
    return { challenges, total };
  }

  // Participation
  async findParticipation(userId: string, challengeId: string): Promise<IMegaChallengeParticipation | null> {
    return MegaChallengeParticipation.findOne({ userId, challengeId });
  }

  async createParticipation(data: Partial<IMegaChallengeParticipation>): Promise<IMegaChallengeParticipation> {
    return MegaChallengeParticipation.create(data);
  }

  async getShortlistedParticipants(challengeId: string): Promise<IMegaChallengeParticipation[]> {
    return MegaChallengeParticipation.find({ challengeId, shortlisted: true }).populate('userId');
  }

  async incrementParticipants(challengeId: string, shortlisted: boolean): Promise<void> {
    await MegaChallenge.findByIdAndUpdate(challengeId, {
      $inc: {
        totalParticipants: 1,
        ...(shortlisted ? { shortlistedCount: 1 } : {}),
      },
    });
  }
}

export const megaChallengeRepository = new MegaChallengeRepository();
