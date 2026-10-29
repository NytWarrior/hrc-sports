import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import { CLOSING_HOUR, OPENING_HOUR, RATE_PER_HOUR, GAME_TYPES, validDate, validPhone } from '@/lib/booking';

export const runtime = 'nodejs';

// GET /api/bookings?date=YYYY-MM-DD returns occupied hours for the chosen date.
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date') ?? '';
  if (!validDate(date)) return NextResponse.json({ error: 'Provide a valid date in YYYY-MM-DD format.' }, { status: 400 });
  try {
    await connectDB();
    const bookings = await Booking.find({ date, status: { $ne: 'cancelled' } }).select('startHour duration status').lean();
    const unavailable = new Set<number>();
    for (const booking of bookings) for (let hour = booking.startHour; hour < booking.startHour + booking.duration; hour++) unavailable.add(hour);
    return NextResponse.json({ date, unavailableHours: [...unavailable], ratePerHour: RATE_PER_HOUR, openingHour: OPENING_HOUR, closingHour: CLOSING_HOUR });
  } catch (error) {
    console.error('Availability error:', error);
    return NextResponse.json({ error: 'Could not load availability. Check MongoDB configuration.' }, { status: 500 });
  }
}

// POST /api/bookings creates a pending reservation after checking conflicts.
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }); }
  const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const gameType = typeof body.gameType === 'string' ? body.gameType : '';
  const date = typeof body.date === 'string' ? body.date : '';
  const startHour = Number(body.startHour);
  const duration = Number(body.duration);
  if (customerName.length < 2 || customerName.length > 90) return NextResponse.json({ error: 'Enter a name between 2 and 90 characters.' }, { status: 400 });
  if (!validPhone(phone)) return NextResponse.json({ error: 'Enter a valid phone number with at least 10 digits.' }, { status: 400 });
  if (email && (!/^\S+@\S+\.\S+$/.test(email) || email.length > 150)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  if (!GAME_TYPES.includes(gameType as typeof GAME_TYPES[number])) return NextResponse.json({ error: 'Choose a valid game type.' }, { status: 400 });
  const todayInIndia = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  if (!validDate(date) || date < todayInIndia) return NextResponse.json({ error: 'Choose today or a future date.' }, { status: 400 });
  if (!Number.isInteger(startHour) || !Number.isInteger(duration) || ![1, 2, 3].includes(duration) || startHour < OPENING_HOUR || startHour + duration > CLOSING_HOUR) return NextResponse.json({ error: 'That time or duration is outside opening hours.' }, { status: 400 });

  try {
    await connectDB();
    // Query all active bookings on this date, then test interval overlap (including multi-hour reservations).
    const active = await Booking.find({ date, status: { $ne: 'cancelled' } }).select('startHour duration').lean();
    const conflict = active.some(b => startHour < b.startHour + b.duration && b.startHour < startHour + duration);
    if (conflict) return NextResponse.json({ error: 'That slot was just booked. Please choose another time.' }, { status: 409 });
    const booking = await Booking.create({ customerName, phone, email: email || undefined, gameType, date, startHour, duration, ratePerHour: RATE_PER_HOUR, total: RATE_PER_HOUR * duration, status: 'pending' });
    return NextResponse.json({ message: 'Booking request received. The turf will confirm it shortly.', booking: { id: booking.id, customerName: booking.customerName, date: booking.date, startHour: booking.startHour, duration: booking.duration, total: booking.total, status: booking.status } }, { status: 201 });
  } catch (error) {
    console.error('Create booking error:', error);
    return NextResponse.json({ error: 'Could not save booking. Check MongoDB configuration and try again.' }, { status: 500 });
  }
}
