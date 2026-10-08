import { HDate } from '@hebcal/core';

import { visible, type Approvable } from './curated';
import { ALL, dayKey, hash, notifySafe, type QA } from './qa';

/** A window in the Hebrew calendar mapped to topics and question keywords (assets/data/curated/seasons.json). */
export type Season = Approvable & {
  key: string;
  /** Shown as "לקראת <label>". */
  label: string;
  from: [string, number];
  to: [string, number];
  topics: string[];
  keywords: string[];
  reason: string;
};

const SEASONS = (require('../../assets/data/curated/seasons.json') as { items: Season[] }).items;

/** hebcal month names; "Adar" means Adar II in a leap year (Purim and the run-up to Pesach). */
function hd(day: number, month: string, year: number): HDate {
  const m = month === 'Adar' && HDate.isLeapYear(year) ? 'Adar II' : month;
  return new HDate(day, m, year);
}

function inSeason(s: Season, today: HDate): boolean {
  const t = today.abs();
  const y = today.getFullYear();
  for (const sy of [y, y - 1]) {
    const start = hd(s.from[1], s.from[0], sy).abs();
    if (start > t) continue;
    // Hebrew years turn at Tishrei, so a window from Elul ends in the next year.
    let end = hd(s.to[1], s.to[0], sy).abs();
    if (end < start) end = hd(s.to[1], s.to[0], sy + 1).abs();
    if (t <= end) return true;
  }
  return false;
}

export function activeSeason(d: Date, preview: boolean): Season | undefined {
  const today = new HDate(d);
  return visible(SEASONS, preview).find((s) => inSeason(s, today));
}

/**
 * Answers that fit the season: a mapped topic plus a keyword in the question, strongest matches first.
 * notifySafe also drops sensitive records.
 */
export function seasonCandidates(s: Season): QA[] {
  const scored = ALL.filter((q) => notifySafe(q) && q.topics.some((t) => s.topics.includes(t)))
    .map((q) => ({ q, score: s.keywords.filter((k) => q.question.includes(k)).length }))
    .filter((x) => x.score > 0);
  scored.sort((a, b) => b.score - a.score || a.q.question.length - b.q.question.length);
  return scored.map((x) => x.q);
}

/** Two answers for the home screen, stable through the day. */
export function seasonPicks(s: Season, d: Date, n = 2): QA[] {
  const pool = seasonCandidates(s).slice(0, 16);
  if (pool.length <= n) return pool;
  const start = hash(`season:${s.key}:${dayKey(d)}`) % pool.length;
  return Array.from({ length: n }, (_, i) => pool[(start + i * 5) % pool.length]).filter((q, i, a) => a.indexOf(q) === i);
}
