import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import { isAdmin } from '@/lib/admin';
export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized. Check your admin token.' }, { status: 401 });
  try { await connectDB(); const bookings = await Booking.find().sort({ date: -1, startHour: 1 }).limit(500).lean(); return NextResponse.json({ bookings: bookings.map(b => ({ id: String(b._id), customerName: b.customerName, phone: b.phone, email: b.email ?? '', gameType: b.gameType, date: b.date, session: b.session ?? 'day', startHour: b.startHour, duration: b.duration, ratePerHour: b.ratePerHour, total: b.total, status: b.status, createdAt: b.createdAt })) }); }
  catch (error) { console.error('Admin list error:', error); return NextResponse.json({ error: 'Could not load bookings.' }, { status: 500 }); }
}
