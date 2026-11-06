import mongoose, { Schema, type Model } from 'mongoose';
export interface TurfSettingsDocument extends mongoose.Document { key: string; morningRate: number; afternoonRate: number; eveningRate: number; logoDataUrl?: string; updatedAt: Date; }
const TurfSettingsSchema = new Schema<TurfSettingsDocument>({ key: { type: String, required: true, unique: true, default: 'main' }, morningRate: { type: Number, required: true, min: 0, default: 800 }, afternoonRate: { type: Number, required: true, min: 0, default: 800 }, eveningRate: { type: Number, required: true, min: 0, default: 1000 }, logoDataUrl: { type: String, default: '' } }, { timestamps: true });
const TurfSettings: Model<TurfSettingsDocument> = mongoose.models.TurfSettings || mongoose.model<TurfSettingsDocument>('TurfSettings', TurfSettingsSchema);
export default TurfSettings;
