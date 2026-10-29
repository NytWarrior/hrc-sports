import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';

export const runtime = 'nodejs';
function authorized(request: NextRequest) {
  const token = process.env.ADMIN_TOKEN;
  return Boolean(token && request.headers.get('authorization') === `Bearer ${token}`);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized. Check your admin token.' }, { status: 401 });
  try {
    await connectDB();
    const bookings = await Booking.find().sort({ date: -1, startHour: 1 }).limit(500).lean();
    return NextResponse.json({ bookings: bookings.map(b => ({ id: String(b._id), customerName: b.customerName, phone: b.phone, email: b.email ?? '', gameType: b.gameType, date: b.date, startHour: b.startHour, duration: b.duration, total: b.total, status: b.status, createdAt: b.createdAt })) });
  } catch (error) {
    console.error('Admin list error:', error);
    return NextResponse.json({ error: 'Could not load bookings.' }, { status: 500 });
  }
}
