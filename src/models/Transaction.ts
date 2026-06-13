import mongoose, { Document, Schema } from 'mongoose';

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVERSED = 'reversed',
}

export enum TransactionCategory {
  CONTEST_WIN = 'contest_win',
  REFERRAL_BONUS = 'referral_bonus',
  WITHDRAWAL = 'withdrawal',
  REFUND = 'refund',
  ADMIN_CREDIT = 'admin_credit',
}

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  status: TransactionStatus;
  referenceId?: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: Object.values(TransactionType), required: true },
    category: { type: String, enum: Object.values(TransactionCategory), required: true },
    description: { type: String, required: true },
    status: { type: String, enum: Object.values(TransactionStatus), default: TransactionStatus.COMPLETED },
    referenceId: { type: String },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ referenceId: 1 }, { sparse: true });

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
