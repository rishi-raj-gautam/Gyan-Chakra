import { Transaction, TransactionType, TransactionCategory, TransactionStatus } from '../models/Transaction';
import { userRepository } from '../repositories/UserRepository';
import { ApiError } from '../utils/apiError';

export class WalletService {
  async getBalance(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    return {
      balance: user.walletBalance,
      lifetimeEarnings: user.lifetimeEarnings,
    };
  }

  async getTransactionHistory(userId: string, skip = 0, limit = 20) {
    const [transactions, total] = await Promise.all([
      Transaction.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Transaction.countDocuments({ userId }),
    ]);
    return { transactions, total };
  }

  async creditWallet(
    userId: string,
    amount: number,
    category: TransactionCategory,
    description: string,
    referenceId?: string
  ) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');

    const balanceBefore = user.walletBalance;
    const updatedUser = await userRepository.creditWallet(userId, amount);

    await Transaction.create({
      userId,
      amount,
      type: TransactionType.CREDIT,
      category,
      description,
      status: TransactionStatus.COMPLETED,
      referenceId,
      balanceBefore,
      balanceAfter: balanceBefore + amount,
    });

    return updatedUser;
  }
}

export const walletService = new WalletService();
