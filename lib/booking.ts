export const DAY_OPENING_HOUR = 5;
export const DAY_CLOSING_HOUR = 17;
export const NIGHT_OPENING_HOUR = 17;
export const NIGHT_CLOSING_HOUR = 23;
export const MAX_DURATION = 6;
export const GAME_TYPES = ['Friendly match', 'Practice session', 'Corporate game', 'Tournament / league'] as const;
export type SessionType = 'day' | 'night';
export function sessionHours(session: SessionType) {
  return session === 'night'
    ? { openingHour: NIGHT_OPENING_HOUR, closingHour: NIGHT_CLOSING_HOUR }
    : { openingHour: DAY_OPENING_HOUR, closingHour: DAY_CLOSING_HOUR };
}
export function validDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T12:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}
export function validPhone(phone: string) {
  return /^[+()\-\s\d]{10,24}$/.test(phone) && phone.replace(/\D/g, '').length >= 10;
}
export function overlaps(startA: number, durationA: number, startB: number, durationB: number) {
  return startA < startB + durationB && startB < startA + durationA;
}
export function isSession(value: unknown): value is SessionType { return value === 'day' || value === 'night'; }
