import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TurfSettings from '@/models/TurfSettings';
import { isAdmin } from '@/lib/admin';
export const runtime = 'nodejs';
const defaults = { dayRate: Number(process.env.DAY_HOURLY_RATE ?? 800), nightRate: Number(process.env.NIGHT_HOURLY_RATE ?? 1000), dayOpeningHour: 5, dayClosingHour: 17, nightOpeningHour: 17, nightClosingHour: 23 };
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized. Enter the configured admin token.' }, { status: 401 });
  try { await connectDB(); const saved = await TurfSettings.findOne({ key: 'main' }).lean(); return NextResponse.json({ settings: { ...defaults, ...(saved ?? {}), dayOpeningHour: 5, dayClosingHour: 17, nightOpeningHour: 17, nightClosingHour: 23 } }); }
  catch (error) { console.error('Settings read error:', error); return NextResponse.json({ error: 'Could not load settings.' }, { status: 500 }); }
}
export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 }); }
  const dayRate = Number(body.dayRate), nightRate = Number(body.nightRate);
  if (!Number.isFinite(dayRate) || dayRate < 0 || dayRate > 1000000 || !Number.isFinite(nightRate) || nightRate < 0 || nightRate > 1000000) return NextResponse.json({ error: 'Enter valid non-negative day and night rates.' }, { status: 400 });
  try { await connectDB(); const settings = await TurfSettings.findOneAndUpdate({ key: 'main' }, { $set: { dayRate, nightRate, dayOpeningHour: 5, dayClosingHour: 17, nightOpeningHour: 17, nightClosingHour: 23 }, $setOnInsert: { key: 'main' } }, { upsert: true, new: true, runValidators: true }); return NextResponse.json({ settings }); }
  catch (error) { console.error('Settings update error:', error); return NextResponse.json({ error: 'Could not save pricing settings.' }, { status: 500 }); }
}
