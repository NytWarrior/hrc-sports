import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import BlockedSlot from '@/models/BlockedSlot';
import { isAdmin } from '@/lib/admin';
import { overlaps } from '@/lib/booking';
export const runtime = 'nodejs';
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized. Check your admin token.' }, { status: 401 });
  const { id } = await context.params; if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid booking ID.' }, { status: 400 });
  let body: { status?: string }; try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }); }
  if (!['pending', 'confirmed', 'cancelled'].includes(body.status ?? '')) return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  try {
    await connectDB(); const current = await Booking.findById(id); if (!current) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    if (body.status !== 'cancelled') {
      const others = await Booking.find({ _id: { $ne: id }, date: current.date, status: { $ne: 'cancelled' } }).select('startHour duration').lean();
      if (others.some(b => overlaps(current.startHour, current.duration, b.startHour, b.duration))) return NextResponse.json({ error: 'Cannot reopen/confirm this booking because it overlaps another active booking.' }, { status: 409 });
      const blocks = await BlockedSlot.find({ date: current.date }).select('startHour duration').lean();
      if (blocks.some(b => overlaps(current.startHour, current.duration, b.startHour, b.duration))) return NextResponse.json({ error: 'Cannot reopen/confirm this booking because its time is blocked by the admin.' }, { status: 409 });
    }
    current.status = body.status as 'pending' | 'confirmed' | 'cancelled'; await current.save(); return NextResponse.json({ booking: { id: current.id, status: current.status } });
  } catch (error) { console.error('Update booking error:', error); return NextResponse.json({ error: 'Could not update booking.' }, { status: 500 }); }
}
