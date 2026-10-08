import { visible, type Approvable } from './curated';
import { getQA, type QA } from './qa';

/**
 * "הצד השני של השאלה" (assets/data/curated/other-side.json): editor-approved pairs of answers that
 * describe one situation from both sides. build-data.py guarantees the two never come from the same
 * recording. Links work in both directions.
 */
type Pair = Approvable & { a: string; b: string; kind: string; reason: string };

const PAIRS = (require('../../assets/data/curated/other-side.json') as { items: Pair[] }).items;

export function otherSide(id: string, preview: boolean): { q: QA; approved: boolean } | undefined {
  const p = visible(PAIRS, preview).find((x) => x.a === id || x.b === id);
  const q = p && getQA(p.a === id ? p.b : p.a);
  return p && q ? { q, approved: p.approved } : undefined;
}
