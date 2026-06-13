import mongoose, { Document, Schema } from 'mongoose';

export interface ISettings extends Document {
  key: string;
  value: unknown;
  description?: string;
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);
