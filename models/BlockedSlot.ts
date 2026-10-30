import mongoose, { Schema, type Model } from 'mongoose';
export interface BlockedSlotDocument extends mongoose.Document { date: string; startHour: number; duration: number; reason: string; createdAt: Date; }
const BlockedSlotSchema = new Schema<BlockedSlotDocument>({
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  startHour: { type: Number, required: true, min: 5, max: 22 },
  duration: { type: Number, required: true, min: 1, max: 6 },
  reason: { type: String, trim: true, maxlength: 160, default: 'Blocked by admin' }
}, { timestamps: true });
BlockedSlotSchema.index({ date: 1, startHour: 1 });
const BlockedSlot: Model<BlockedSlotDocument> = mongoose.models.BlockedSlot || mongoose.model<BlockedSlotDocument>('BlockedSlot', BlockedSlotSchema);
export default BlockedSlot;
