export const OPENING_HOUR = 6;
export const CLOSING_HOUR = 22;
export const RATE_PER_HOUR = Math.max(0, Number(process.env.NEXT_PUBLIC_HOURLY_RATE ?? 800) || 0);
export const GAME_TYPES = ['Friendly match', 'Practice session', 'Corporate game', 'Tournament / league'] as const;

export function validDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T12:00:00`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

export function validPhone(phone: string) {
  return /^[+()\-\s\d]{10,24}$/.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

export function overlaps(startA: number, durationA: number, startB: number, durationB: number) {
  return startA < startB + durationB && startB < startA + durationA;
}
