/** Public Q&A records (built by scripts/build-data.py; whitelisted public fields only). */
export type QA = {
  id: string;
  question: string;
  answer: string;
  topics: string[];
  applies_when: string | null;
  not_when: string | null;
  faith: boolean;
  source_kind: string | null;
  /**
   * Abuse / violence records. Not in the public data yet (so no record is sensitive); when an approved
   * flag is added, such records lose sharing and never appear in notifications.
   */
  sensitive?: boolean;
};

function load(): QA[] {
  // The full set (assets/data/qa.json) is git-ignored until production finishes; fall back to the
  // committed sample. Expo's Metro config allows optional requires inside try/catch.
  try {
    return require('../../assets/data/qa.json') as QA[];
  } catch {
    return require('../../assets/data/qa.sample.json') as QA[];
  }
}

export const ALL: QA[] = load();
const BY_ID = new Map(ALL.map((q) => [q.id, q]));

export function getQA(id: string | undefined | null): QA | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export type TopicCount = { name: string; count: number };

/** All topics by frequency; the catch-all "אחר" goes last. */
export const TOPICS: TopicCount[] = (() => {
  const m = new Map<string, number>();
  for (const q of ALL) for (const t of q.topics) m.set(t, (m.get(t) ?? 0) + 1);
  return [...m.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => (a.name === 'אחר' ? 1 : b.name === 'אחר' ? -1 : b.count - a.count));
})();

export function byTopic(topic: string): QA[] {
  return ALL.filter((q) => q.topics.includes(topic));
}

/** Minutes to read an answer (~180 Hebrew words a minute), at least 1. */
export function readingMinutes(q: QA): number {
  const words = q.answer.split(/\s+/).length;
  return Math.max(1, Math.round(words / 180));
}

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function dayKey(d = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Answers that read well as a teaser: a full but not overlong answer. */
const DAILY_POOL = ALL.filter((q) => q.answer.length > 280 && q.answer.length < 1400 && q.question.length < 64);

/** Deterministic "question of the day" for the local date. */
export function dailyQuestion(d = new Date()): QA {
  const pool = DAILY_POOL.length ? DAILY_POOL : ALL;
  return pool[hash('daily:' + dayKey(d)) % pool.length];
}

/** Two picks for the user: biased toward topics of saved answers, stable through the day. */
export function forYou(savedIds: string[], d = new Date(), n = 2): QA[] {
  const daily = dailyQuestion(d);
  const savedTopics = new Set(savedIds.flatMap((id) => getQA(id)?.topics ?? []));
  const saved = new Set(savedIds);
  let pool = ALL.filter((q) => q.id !== daily.id && !saved.has(q.id) && q.question.length < 80);
  if (savedTopics.size) {
    const near = pool.filter((q) => q.topics.some((t) => savedTopics.has(t)));
    if (near.length >= n) pool = near;
  }
  const out: QA[] = [];
  const seed = hash('foryou:' + dayKey(d));
  for (let i = 0; out.length < n && i < pool.length; i++) {
    const q = pool[(seed + i * 7919) % pool.length];
    if (!out.includes(q) && !out.some((o) => o.topics[0] === q.topics[0])) out.push(q);
  }
  return out;
}

export type SimilarBucket = 'few' | 'tens' | 'hundreds';
/** "לא רק אתם": how often a question like this was asked, as a coarse bucket only (see build-data.py). */
const SIMILAR = require('../../assets/data/similar.json') as Record<string, SimilarBucket>;

export function similarBucket(id: string): SimilarBucket | undefined {
  return SIMILAR[id];
}

/* ---------- daily question by topic (notifications) ---------- */

/** Never on a lock screen: grief topics and anything touching self-harm, abuse or violence. */
const NOTIFY_BLOCKED_TOPICS = new Set(['אבל ומשבר']);
const NOTIFY_BLOCKED_WORDS = /אובדנ|התאבד|פגיע|אלימ|התעלל|הטרד|מכה|מרביץ|הפלה|בגיד|בוגד|מוות|נפטר|סרטן|מחלה|מינית|התמכר/;

export function notifySafe(q: QA): boolean {
  return (
    !q.sensitive &&
    !q.topics.some((t) => NOTIFY_BLOCKED_TOPICS.has(t)) &&
    !NOTIFY_BLOCKED_WORDS.test(q.question) &&
    q.question.length <= 110
  );
}

/** Topics the user may pick for the daily question. */
export const DAILY_TOPICS = TOPICS.filter((t) => t.name !== 'אחר' && !NOTIFY_BLOCKED_TOPICS.has(t.name)).map((t) => t.name);

/** Deterministic pick for a date: the topic rotates by day, the question is hashed from date + topic. */
export function dailyForTopics(topics: string[], d: Date): QA | undefined {
  if (!topics.length) return undefined;
  const dayNo = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  const topic = topics[dayNo % topics.length];
  const pool = ALL.filter((q) => q.topics.includes(topic) && notifySafe(q));
  return pool.length ? pool[hash(`topic:${topic}:${dayKey(d)}`) % pool.length] : undefined;
}
