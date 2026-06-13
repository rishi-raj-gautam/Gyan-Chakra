import { User, IUser, UserStatus } from '../models/User';
import { FilterQuery } from 'mongoose';

export class UserRepository {
  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async findByMobile(mobile: string): Promise<IUser | null> {
    return User.findOne({ mobile }).select('+password');
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  async findByReferralCode(code: string): Promise<IUser | null> {
    return User.findOne({ referralCode: code });
  }

  async create(data: Partial<IUser>): Promise<IUser> {
    return User.create(data);
  }

  async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }

  async softDelete(id: string): Promise<void> {
    await User.findByIdAndUpdate(id, { deletedAt: new Date(), status: UserStatus.INACTIVE });
  }

  async findAll(
    filter: FilterQuery<IUser> = {},
    skip = 0,
    limit = 20,
    sort: Record<string, 1 | -1> = { createdAt: -1 }
  ): Promise<{ users: IUser[]; total: number }> {
    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(limit).sort(sort),
      User.countDocuments(filter),
    ]);
    return { users, total };
  }

  async updateFcmToken(userId: string, token: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { fcmToken: token });
  }

  async incrementStats(userId: string, won: boolean): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $inc: {
        totalContestsPlayed: 1,
        ...(won ? { totalContestsWon: 1 } : {}),
      },
    });
  }

  async creditWallet(userId: string, amount: number): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          walletBalance: amount,
          lifetimeEarnings: amount,
        },
      },
      { new: true }
    );
  }
}

export const userRepository = new UserRepository();
