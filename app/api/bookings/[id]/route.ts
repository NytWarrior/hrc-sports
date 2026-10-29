import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';

export const runtime = 'nodejs';
function authorized(request: NextRequest) {
  const token = process.env.ADMIN_TOKEN;
  return Boolean(token && request.headers.get('authorization') === `Bearer ${token}`);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized. Check your admin token.' }, { status: 401 });
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid booking ID.' }, { status: 400 });
  let body: { status?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }); }
  if (!['pending', 'confirmed', 'cancelled'].includes(body.status ?? '')) return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  try {
    await connectDB();
    const booking = await Booking.findByIdAndUpdate(id, { status: body.status }, { new: true, runValidators: true });
    if (!booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    return NextResponse.json({ booking: { id: booking.id, status: booking.status } });
  } catch (error) {
    console.error('Update booking error:', error);
    return NextResponse.json({ error: 'Could not update booking.' }, { status: 500 });
  }
}
