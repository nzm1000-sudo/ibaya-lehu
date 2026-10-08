import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { AppState, Platform } from 'react-native';

/**
 * "לא מצאתם תשובה?": sends an unanswered question to the review endpoint (a Google Apps Script web app,
 * see server/google-apps-script). The payload is ONLY the question text, when it was written and the app
 * version. No device id, no user data, no search history.
 *
 * When the endpoint is missing or the request fails, the question waits in a local queue and is retried on
 * app start, when the app comes back to the foreground, when the browser reports it is online, and every
 * minute while the app is open and something is waiting.
 */

export const QUESTION_MAX = 500;
export const QUESTION_MIN = 3;
export const DAILY_LIMIT = 5;

const ENDPOINT = process.env.EXPO_PUBLIC_QUESTIONS_ENDPOINT ?? '';
const KEY = 'ibaya.questions.v1';
const DAY_MS = 24 * 60 * 60 * 1000;
const TIMEOUT_MS = 15000;

type Queued = { question: string; created_at: string };
type Stored = { queue: Queued[]; log: string[] };

export type SubmitResult = 'sent' | 'queued' | 'throttled' | 'invalid';

/** Trims and collapses whitespace; the server applies the same limits. */
export function cleanQuestion(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, QUESTION_MAX);
}

async function load(): Promise<Stored> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const d = raw ? (JSON.parse(raw) as Partial<Stored>) : {};
    return { queue: Array.isArray(d.queue) ? d.queue : [], log: Array.isArray(d.log) ? d.log : [] };
  } catch {
    return { queue: [], log: [] };
  }
}

async function store(d: Stored): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    // Storage full or unavailable: nothing more to do on the device.
  }
}

/** One POST. Text/plain keeps the browser from sending a CORS preflight, which Apps Script cannot answer. */
async function post(q: Queued, endpoint = ENDPOINT): Promise<boolean> {
  if (!endpoint) return false;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ question: q.question, created_at: q.created_at, app_version: Constants.expoConfig?.version ?? '', hp: '' }),
      signal: ctrl.signal,
    });
    if (res.status < 200 || res.status >= 300) return false;
    // Apps Script always answers 200; a busy or failing script says so in the body, and is retried.
    // "invalid" is not retried (the same text would be refused again).
    const body = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    return !(body && body.ok === false && body.error !== 'invalid');
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Submits a question. `honeypot` is the hidden form field: a person never fills it, so a filled one is
 * dropped silently (reported as queued, so nothing tells a bot it was caught).
 */
export async function submitQuestion(text: string, honeypot = ''): Promise<SubmitResult> {
  const question = cleanQuestion(text);
  if (question.length < QUESTION_MIN) return 'invalid';
  if (honeypot) return 'queued';
  const d = await load();
  const now = Date.now();
  d.log = d.log.filter((t) => now - Date.parse(t) < DAY_MS);
  if (d.log.length >= DAILY_LIMIT) return 'throttled';
  const item: Queued = { question, created_at: new Date(now).toISOString() };
  d.log.push(item.created_at);
  const ok = await post(item);
  if (!ok) d.queue.push(item);
  await store(d);
  if (!ok) scheduleRetry();
  return ok ? 'sent' : 'queued';
}

let flushing = false;

/** Sends what is waiting, oldest first; stops at the first failure. Returns how many are still waiting. */
export async function flushQueue(endpoint = ENDPOINT): Promise<number> {
  if (flushing) return -1;
  flushing = true;
  try {
    const d = await load();
    if (!d.queue.length || !endpoint) return d.queue.length;
    while (d.queue.length && (await post(d.queue[0], endpoint))) {
      d.queue.shift();
      await store(d);
    }
    return d.queue.length;
  } finally {
    flushing = false;
  }
}

/** Moves questions kept by older versions (stored only on the device) into the send queue, once. */
export async function adoptLegacy(items: { text: string; createdAt: string }[]): Promise<void> {
  if (!items.length) return;
  const d = await load();
  for (const p of items) {
    const question = cleanQuestion(p.text);
    if (question.length >= QUESTION_MIN) d.queue.push({ question, created_at: p.createdAt });
  }
  await store(d);
}

let timer: ReturnType<typeof setInterval> | undefined;

function scheduleRetry() {
  if (timer || !ENDPOINT) return;
  timer = setInterval(async () => {
    if (AppState.currentState !== 'active') return;
    const left = await flushQueue();
    if (left === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  }, 60000);
}

/** Call once at app start. Returns a cleanup function. */
export function startQuestionSync(): () => void {
  const retry = () => {
    flushQueue().then((left) => left > 0 && scheduleRetry());
  };
  retry();
  const sub = AppState.addEventListener('change', (s) => s === 'active' && retry());
  const onWeb = Platform.OS === 'web' && typeof window !== 'undefined';
  if (onWeb) window.addEventListener('online', retry);
  return () => {
    sub.remove();
    if (onWeb) window.removeEventListener('online', retry);
    if (timer) clearInterval(timer);
    timer = undefined;
  };
}
