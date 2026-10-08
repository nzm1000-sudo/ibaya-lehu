import { visible, type Approvable } from './curated';

/** App dictionary (assets/data/curated/glossary.json): editorial one-line definitions, not the Rav's words. */
export type GlossaryItem = Approvable & { term: string; definition: string; not_followed_by?: string[] };

const ITEMS = (require('../../assets/data/curated/glossary.json') as { items: GlossaryItem[] }).items;

export type Segment = { text: string; item?: GlossaryItem };

const PREFIX = '(?:[והבלמשכ]|וה|שה|מה|בה|לה|וב|ול|ומ|וש)?';
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let cache: { preview: boolean; rx: RegExp | null; byTerm: Map<string, GlossaryItem> } | null = null;

function matcher(preview: boolean) {
  if (cache?.preview === preview) return cache;
  const items = visible(ITEMS, preview).sort((a, b) => b.term.length - a.term.length); // longest first
  const byTerm = new Map(items.map((i) => [i.term, i]));
  // No lookbehind (older engines): group 1 is the char before the word, group 2 a prefix, group 3 the term.
  const rx = items.length ? new RegExp(`(^|[^א-ת])(${PREFIX})(${items.map((i) => esc(i.term)).join('|')})(?=[^א-ת]|$)`, 'g') : null;
  cache = { preview, rx, byTerm };
  return cache;
}

/** Splits text into plain runs and glossary terms (each term marked once per text). */
export function segmentGlossary(text: string, preview: boolean): Segment[] {
  const { rx, byTerm } = matcher(preview);
  if (!rx) return [{ text }];
  const out: Segment[] = [];
  const seen = new Set<string>();
  let last = 0;
  rx.lastIndex = 0;
  for (let m = rx.exec(text); m; m = rx.exec(text)) {
    const term = m[3];
    const item = byTerm.get(term);
    const start = m.index + m[1].length + m[2].length;
    const end = start + term.length;
    const next = text.slice(end).trimStart();
    if (!item || seen.has(term) || item.not_followed_by?.some((w) => next.startsWith(w))) continue;
    seen.add(term);
    if (start > last) out.push({ text: text.slice(last, start) });
    out.push({ text: term, item });
    last = end;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}
