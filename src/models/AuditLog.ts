import mongoose, { Document, Schema } from 'mongoose';

export enum AuditAction {
  WINNER_SELECTED = 'winner_selected',
  DRAW_INITIATED = 'draw_initiated',
  USER_SUSPENDED = 'user_suspended',
  USER_BLOCKED = 'user_blocked',
  REWARD_CREDITED = 'reward_credited',
  SETTINGS_UPDATED = 'settings_updated',
}

export interface IAuditLog extends Document {
  action: AuditAction;
  performedBy: mongoose.Types.ObjectId;
  targetId?: string;
  targetType?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, enum: Object.values(AuditAction), required: true, index: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetId: { type: String },
    targetType: { type: String },
    details: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
