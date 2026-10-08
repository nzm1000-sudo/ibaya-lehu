import { flags, HebrewCalendar } from '@hebcal/core';

/** Shabbat or Yom Tov (Israel schedule) on this civil date. */
function restDay(d: Date): boolean {
  if (d.getDay() === 6) return true;
  const events = HebrewCalendar.getHolidaysOnDate(d, true) ?? [];
  return events.some((e) => (e.getFlags() & flags.CHAG) !== 0);
}

/**
 * True when a notification at this local time could fall on Shabbat or Yom Tov (Israel).
 * Conservative: the whole rest day is blocked, and the afternoon/evening before it from 15:00
 * (candle lighting is never earlier than ~16:00 in Israel).
 */
export function isRestTime(d: Date): boolean {
  if (restDay(d)) return true;
  if (d.getHours() >= 15) {
    const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 12);
    if (restDay(next)) return true;
  }
  return false;
}
