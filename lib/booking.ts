export const OPENING_HOUR = 5;
export const CLOSING_HOUR = 22;
export const MAX_DURATION = 17;
export const PRICE_CATEGORIES = [
  { key: 'morning', label: 'Morning', start: 5, end: 11 },
  { key: 'afternoon', label: 'Afternoon', start: 11, end: 17 },
  { key: 'evening', label: 'Evening', start: 17, end: 22 },
] as const;
export const GAME_TYPES = ['Friendly match', 'Practice session', 'Corporate game', 'Tournament / league'] as const;
export type SessionType = 'day' | 'night';
export function categoryForHour(hour: number) { return PRICE_CATEGORIES.find(c => hour >= c.start && hour < c.end)!; }
export function calculatePrice(startHour: number, endHour: number, rates: { morningRate: number; afternoonRate: number; eveningRate: number }) {
  let total = 0; const breakdown: { category: string; hours: number; rate: number; amount: number }[] = [];
  for (const c of PRICE_CATEGORIES) { const hours = Math.max(0, Math.min(endHour, c.end) - Math.max(startHour, c.start)); if (hours) { const rate = rates[`${c.key}Rate` as keyof typeof rates]; breakdown.push({ category: c.label, hours, rate, amount: hours * rate }); total += hours * rate; } }
  return { total, breakdown };
}
export function validDate(date: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false; const parsed = new Date(`${date}T12:00:00.000Z`); return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date; }
export function validPhone(phone: string) { return /^[+()\-\s\d]{10,24}$/.test(phone) && phone.replace(/\D/g, '').length >= 10; }
export function overlaps(startA: number, durationA: number, startB: number, durationB: number) { return startA < startB + durationB && startB < startA + durationA; }
export function isSession(value: unknown): value is SessionType { return value === 'day' || value === 'night'; }
