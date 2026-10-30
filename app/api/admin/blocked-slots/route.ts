import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import BlockedSlot from '@/models/BlockedSlot';
import Booking from '@/models/Booking';
import { overlaps } from '@/lib/booking';
import { isAdmin } from '@/lib/admin';
import { validDate } from '@/lib/booking';
export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  try { await connectDB(); const date = request.nextUrl.searchParams.get('date'); const query = date && validDate(date) ? { date } : {}; const blocks = await BlockedSlot.find(query).sort({ date: 1, startHour: 1 }).limit(500).lean(); return NextResponse.json({ blocks: blocks.map(b => ({ id: String(b._id), date: b.date, startHour: b.startHour, duration: b.duration, reason: b.reason })) }); }
  catch (error) { console.error('Blocked slots read error:', error); return NextResponse.json({ error: 'Could not load blocked slots.' }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }); }
  const date = typeof body.date === 'string' ? body.date : '', startHour = Number(body.startHour), duration = Number(body.duration), reason = typeof body.reason === 'string' ? body.reason.trim().slice(0,160) : 'Blocked by admin';
  if (!validDate(date) || !Number.isInteger(startHour) || !Number.isInteger(duration) || duration < 1 || duration > 6 || !((startHour >= 5 && startHour + duration <= 17) || (startHour >= 17 && startHour + duration <= 23))) return NextResponse.json({ error: 'Choose a valid date and a 1–6 hour range fully within day or night session.' }, { status: 400 });
  try { await connectDB(); const bookings = await Booking.find({ date, status: { $ne: 'cancelled' } }).select('startHour duration').lean(); if (bookings.some(b => overlaps(startHour, duration, b.startHour, b.duration))) return NextResponse.json({ error: 'This range overlaps an active booking. Cancel the booking first, or choose another time.' }, { status: 409 }); const block = await BlockedSlot.create({ date, startHour, duration, reason: reason || 'Blocked by admin' }); return NextResponse.json({ block: { id: String(block._id), date, startHour, duration, reason: block.reason } }, { status: 201 }); }
  catch (error) { console.error('Blocked slot create error:', error); return NextResponse.json({ error: 'Could not block that time.' }, { status: 500 }); }
}
export async function DELETE(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const id = request.nextUrl.searchParams.get('id'); if (!id || !mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Provide a valid block ID.' }, { status: 400 });
  try { await connectDB(); const deleted = await BlockedSlot.findByIdAndDelete(id); if (!deleted) return NextResponse.json({ error: 'Blocked slot not found.' }, { status: 404 }); return NextResponse.json({ message: 'Blocked time removed.' }); }
  catch (error) { console.error('Blocked slot delete error:', error); return NextResponse.json({ error: 'Could not remove blocked time.' }, { status: 500 }); }
}
