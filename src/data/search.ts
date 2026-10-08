import MiniSearch from 'minisearch';

import { normalize, prefixVariants, STOPWORDS, tokenize } from '@/lib/hebrew';

import { ALL, getQA, type QA } from './qa';

type Doc = { id: string; question: string; answer: string; topics: string; applies: string };

let index: MiniSearch<Doc> | null = null;

const indexTerm = (term: string) => {
  const t = normalize(term);
  if (!t || STOPWORDS.has(t)) return null;
  return prefixVariants(t);
};

function getIndex(): MiniSearch<Doc> {
  if (index) return index;
  index = new MiniSearch<Doc>({
    fields: ['question', 'answer', 'topics', 'applies'],
    storeFields: [],
    tokenize: (text) => tokenize(text),
    processTerm: indexTerm,
    searchOptions: {
      // Query terms arrive here already normalized and expanded (see search()).
      processTerm: (t) => t,
    },
  });
  index.addAll(
    ALL.map((q) => ({
      id: q.id,
      question: q.question,
      answer: q.answer,
      topics: q.topics.join(' '),
      applies: q.applies_when ?? '',
    })),
  );
  return index;
}

/** Build the index ahead of time (e.g. when the search screen mounts). */
export function warmSearch() {
  getIndex();
}

export const SEARCH_LIMIT = 60;

const BOOST = { question: 5, topics: 2, applies: 1.2, answer: 1 };

/**
 * Local Hebrew search over approved answers. Question matches rank above answer matches.
 * Each query word matches with or without prefixes (ו ה ב ל מ ש כ); all words must match first,
 * then partial matches follow.
 */
export function search(query: string, limit = SEARCH_LIMIT): QA[] {
  const words = tokenize(query).filter((t) => !STOPWORDS.has(t));
  if (!words.length) return [];
  const idx = getIndex();
  const last = words.length - 1;
  const wordQuery = (w: string, i: number, fuzzy: boolean) => ({
    combineWith: 'OR' as const,
    queries: prefixVariants(w),
    // only the word being typed is completed as a prefix (so "אמון" does not match "אמונה")
    prefix: i === last,
    fuzzy: fuzzy && w.length >= 5 ? 0.2 : false,
  });
  const opts = { boost: BOOST };
  const strict = idx.search({ combineWith: 'AND', queries: words.map((w, i) => wordQuery(w, i, true)) }, opts);
  const seen = new Set(strict.map((r) => r.id));
  let loose: typeof strict = [];
  if (words.length > 1 && strict.length < limit) {
    // Partial matches: exact words only, and at least half of the query words must appear.
    const need = Math.ceil(words.length / 2);
    const variantsOf = words.map((w) => new Set(prefixVariants(w)));
    loose = idx
      .search({ combineWith: 'OR', queries: words.map((w, i) => wordQuery(w, i, false)) }, opts)
      .filter((r) => !seen.has(r.id))
      .filter((r) => variantsOf.filter((vs) => r.queryTerms.some((t) => vs.has(t) || [...vs].some((v) => t.startsWith(v)))).length >= need);
  }
  return [...strict, ...loose]
    .slice(0, limit)
    .map((r) => getQA(String(r.id)))
    .filter((q): q is QA => !!q);
}

/** Answers close to this one: same first topic, ranked by MiniSearch similarity of the question. */
export function related(q: QA, n = 2): QA[] {
  const topic = q.topics[0];
  const hits = search(q.question, 80).filter((r) => r.id !== q.id && (!topic || r.topics.includes(topic)));
  return hits.slice(0, n);
}
