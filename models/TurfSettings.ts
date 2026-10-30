import mongoose, { Schema, type Model } from 'mongoose';
export interface TurfSettingsDocument extends mongoose.Document { key: string; dayRate: number; nightRate: number; dayOpeningHour: number; dayClosingHour: number; nightOpeningHour: number; nightClosingHour: number; updatedAt: Date; }
const TurfSettingsSchema = new Schema<TurfSettingsDocument>({
  key: { type: String, required: true, unique: true, default: 'main' },
  dayRate: { type: Number, required: true, min: 0, default: 800 }, nightRate: { type: Number, required: true, min: 0, default: 1000 },
  dayOpeningHour: { type: Number, required: true, default: 5 }, dayClosingHour: { type: Number, required: true, default: 17 },
  nightOpeningHour: { type: Number, required: true, default: 17 }, nightClosingHour: { type: Number, required: true, default: 23 }
}, { timestamps: true });
const TurfSettings: Model<TurfSettingsDocument> = mongoose.models.TurfSettings || mongoose.model<TurfSettingsDocument>('TurfSettings', TurfSettingsSchema);
export default TurfSettings;
