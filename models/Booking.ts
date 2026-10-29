import mongoose, { Schema, type Model } from 'mongoose';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export interface BookingDocument extends mongoose.Document {
  customerName: string;
  phone: string;
  email?: string;
  gameType: string;
  date: string; // YYYY-MM-DD, local turf date
  startHour: number; // 6..21
  duration: number;
  ratePerHour: number;
  total: number;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<BookingDocument>({
  customerName: { type: String, required: true, trim: true, maxlength: 90 },
  phone: { type: String, required: true, trim: true, maxlength: 24 },
  email: { type: String, trim: true, lowercase: true, maxlength: 150 },
  gameType: { type: String, required: true, enum: ['Friendly match', 'Practice session', 'Corporate game', 'Tournament / league'] },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  startHour: { type: Number, required: true, min: 6, max: 21 },
  duration: { type: Number, required: true, enum: [1, 2, 3] },
  ratePerHour: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending', required: true }
}, { timestamps: true });

BookingSchema.index({ date: 1, startHour: 1, status: 1 });
const Booking: Model<BookingDocument> = mongoose.models.Booking || mongoose.model<BookingDocument>('Booking', BookingSchema);
export default Booking;
