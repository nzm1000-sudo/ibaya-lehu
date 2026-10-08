/**
 * Editorial (curated) data: lists, pairings, paths and definitions written by the editors.
 * Every item carries `approved`; the app shows only approved items, except in draft preview
 * (editor builds, Settings > "תצוגת טיוטה").
 */
import { getQA, hash, type QA } from './qa';

export type Approvable = { approved: boolean };

export function visible<T extends Approvable>(items: readonly T[], preview: boolean): T[] {
  return items.filter((i) => i.approved || preview);
}

/** Resolves answer ids to records, dropping ids missing from the current data set (e.g. the dev sample). */
export function resolve(ids: readonly string[]): QA[] {
  return ids.map(getQA).filter((q): q is QA => !!q);
}

/* ---------- קשה לי עכשיו ---------- */

type HardNowItem = Approvable & { id: string; reason: string };
const HARD_NOW = (require('../../assets/data/curated/hard-now.json') as { items: HardNowItem[] }).items;

export type CuratedQA = { q: QA; approved: boolean };

/** Up to `n` calming answers for the day, picked deterministically from the visible list. */
export function hardNowAnswers(preview: boolean, day: string, n = 3): CuratedQA[] {
  const pool = visible(HARD_NOW, preview)
    .map((i) => ({ q: getQA(i.id), approved: i.approved }))
    .filter((x): x is CuratedQA => !!x.q && !x.q.sensitive);
  if (pool.length <= n) return pool;
  const start = hash('hardnow:' + day) % pool.length;
  return Array.from({ length: n }, (_, k) => pool[(start + k) % pool.length]);
}
