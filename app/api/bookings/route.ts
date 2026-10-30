import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import BlockedSlot from '@/models/BlockedSlot';
import TurfSettings from '@/models/TurfSettings';
import { GAME_TYPES, isSession, overlaps, sessionHours, validDate, validPhone } from '@/lib/booking';
export const runtime = 'nodejs';
async function getSettings() {
  const doc = await TurfSettings.findOne({ key: 'main' }).lean();
  return { dayRate: doc?.dayRate ?? Number(process.env.DAY_HOURLY_RATE ?? 800), nightRate: doc?.nightRate ?? Number(process.env.NIGHT_HOURLY_RATE ?? 1000), dayOpeningHour: 5, dayClosingHour: 17, nightOpeningHour: 17, nightClosingHour: 23 };
}
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date') ?? '';
  const session = request.nextUrl.searchParams.get('session') ?? 'day';
  if (!validDate(date)) return NextResponse.json({ error: 'Provide a valid date in YYYY-MM-DD format.' }, { status: 400 });
  if (!isSession(session)) return NextResponse.json({ error: 'Session must be day or night.' }, { status: 400 });
  try {
    await connectDB();
    const settings = await getSettings();
    const openingHour = session === 'day' ? settings.dayOpeningHour : settings.nightOpeningHour;
    const closingHour = session === 'day' ? settings.dayClosingHour : settings.nightClosingHour;
    const ratePerHour = session === 'day' ? settings.dayRate : settings.nightRate;
    const [bookings, blocks] = await Promise.all([
      Booking.find({ date, status: { $ne: 'cancelled' } }).select('startHour duration').lean(),
      BlockedSlot.find({ date }).select('startHour duration reason').lean()
    ]);
    const unavailableHours = new Set<number>();
    for (const item of [...bookings, ...blocks]) for (let hour = item.startHour; hour < item.startHour + item.duration; hour++) unavailableHours.add(hour);
    return NextResponse.json({ date, session, unavailableHours: [...unavailableHours], ratePerHour, openingHour, closingHour, dayRate: settings.dayRate, nightRate: settings.nightRate });
  } catch (error) { console.error('Availability error:', error); return NextResponse.json({ error: 'Could not load availability. Check MONGODB_URI and MongoDB Atlas Network Access.' }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }); }
  const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const gameType = typeof body.gameType === 'string' ? body.gameType : '';
  const date = typeof body.date === 'string' ? body.date : '';
  const session = body.session;
  const startHour = Number(body.startHour), duration = Number(body.duration);
  if (customerName.length < 2 || customerName.length > 90) return NextResponse.json({ error: 'Enter a name between 2 and 90 characters.' }, { status: 400 });
  if (!validPhone(phone)) return NextResponse.json({ error: 'Enter a valid phone number with at least 10 digits.' }, { status: 400 });
  if (email && (!/^\S+@\S+\.\S+$/.test(email) || email.length > 150)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  if (!GAME_TYPES.includes(gameType as typeof GAME_TYPES[number])) return NextResponse.json({ error: 'Choose a valid game type.' }, { status: 400 });
  const todayInIndia = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  if (!validDate(date) || date < todayInIndia) return NextResponse.json({ error: 'Choose today or a future date.' }, { status: 400 });
  if (!isSession(session) || !Number.isInteger(startHour) || !Number.isInteger(duration) || duration < 1 || duration > 6) return NextResponse.json({ error: 'Choose a valid session, start time, and duration from 1–6 hours.' }, { status: 400 });
  try {
    await connectDB(); const settings = await getSettings();
    const openingHour = session === 'day' ? settings.dayOpeningHour : settings.nightOpeningHour;
    const closingHour = session === 'day' ? settings.dayClosingHour : settings.nightClosingHour;
    if (startHour < openingHour || startHour + duration > closingHour) return NextResponse.json({ error: 'The selected duration extends outside this session.' }, { status: 400 });
    const [active, blocks] = await Promise.all([
      Booking.find({ date, status: { $ne: 'cancelled' } }).select('startHour duration').lean(),
      BlockedSlot.find({ date }).select('startHour duration').lean()
    ]);
    if (active.some(item => overlaps(startHour, duration, item.startHour, item.duration))) return NextResponse.json({ error: 'That slot overlaps another booking. Please choose another time.' }, { status: 409 });
    if (blocks.some(item => overlaps(startHour, duration, item.startHour, item.duration))) return NextResponse.json({ error: 'That time is blocked by the turf admin. Please choose another slot.' }, { status: 409 });
    const ratePerHour = session === 'day' ? settings.dayRate : settings.nightRate;
    const booking = await Booking.create({ customerName, phone, email: email || undefined, gameType, date, session, startHour, duration, ratePerHour, total: ratePerHour * duration, status: 'pending' });
    return NextResponse.json({ message: 'Booking request received. The turf will confirm it shortly.', booking: { id: booking.id, customerName: booking.customerName, date, session, startHour, duration, total: booking.total, status: booking.status } }, { status: 201 });
  } catch (error) { console.error('Create booking error:', error); return NextResponse.json({ error: 'Could not save booking. Check MongoDB configuration and try again.' }, { status: 500 }); }
}
