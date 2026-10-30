import mongoose, { Schema, type Model } from 'mongoose';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type SessionType = 'day' | 'night';
export interface BookingDocument extends mongoose.Document {
  customerName: string; phone: string; email?: string; gameType: string; date: string;
  session: SessionType; startHour: number; duration: number; ratePerHour: number; total: number;
  status: BookingStatus; createdAt: Date; updatedAt: Date;
}
const BookingSchema = new Schema<BookingDocument>({
  customerName: { type: String, required: true, trim: true, minlength: 2, maxlength: 90 },
  phone: { type: String, required: true, trim: true, maxlength: 24 },
  email: { type: String, trim: true, lowercase: true, maxlength: 150 },
  gameType: { type: String, required: true, enum: ['Friendly match', 'Practice session', 'Corporate game', 'Tournament / league'] },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  session: { type: String, required: true, enum: ['day', 'night'] },
  startHour: { type: Number, required: true, min: 5, max: 22 },
  duration: { type: Number, required: true, min: 1, max: 6, validate: { validator: Number.isInteger, message: 'Duration must be a whole number of hours.' } },
  ratePerHour: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending', required: true }
}, { timestamps: true });
BookingSchema.index({ date: 1, status: 1, startHour: 1 });
const Booking: Model<BookingDocument> = mongoose.models.Booking || mongoose.model<BookingDocument>('Booking', BookingSchema);
export default Booking;
