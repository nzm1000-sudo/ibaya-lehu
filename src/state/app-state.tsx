import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { EDITOR_MODE } from '@/lib/editor';
import { adoptLegacy, submitQuestion, type SubmitResult } from '@/lib/questions';
import type { DailySettings } from '@/lib/notify';
import { DEFAULT_DARK, DEFAULT_LIGHT, THEME_BY_ID, type Theme, type ThemeId } from '@/theme/themes';

export type ThemeChoice = 'system' | ThemeId;

export type PendingQuestion = { text: string; createdAt: string };

type Persisted = {
  themeChoice: ThemeChoice;
  textScale: number;
  readAloud: boolean;
  saved: string[];
  /** Legacy: questions kept only on the device by older versions; moved into the send queue on load. */
  pending: PendingQuestion[];
  /** Editors only: show curated items that are not yet approved ("תצוגת טיוטה"). */
  previewDrafts: boolean;
  /** Daily question by topic (local notifications). */
  daily: DailySettings;
  /** Life paths: answer ids marked "קראתי", per path key. */
  pathsRead: Record<string, string[]>;
};

const KEY = 'ibaya.state.v1';
const DEFAULTS: Persisted = { themeChoice: 'system', textScale: 1, readAloud: false, saved: [], pending: [], previewDrafts: false, daily: { enabled: false, topics: [], hour: 20 }, pathsRead: {} };

export const TEXT_SCALE_MIN = 0.85;
export const TEXT_SCALE_MAX = 1.45;
export const TEXT_SCALE_STEP = 0.1;

type Ctx = Persisted & {
  ready: boolean;
  theme: Theme;
  setThemeChoice: (c: ThemeChoice) => void;
  setTextScale: (s: number) => void;
  bumpTextScale: (dir: 1 | -1) => void;
  setReadAloud: (v: boolean) => void;
  /** True when draft (unapproved) curated items may be shown. */
  preview: boolean;
  setPreviewDrafts: (v: boolean) => void;
  setDaily: (patch: Partial<DailySettings>) => void;
  toggleRead: (path: string, id: string) => void;
  isSaved: (id: string) => boolean;
  toggleSaved: (id: string) => void;
  /** Sends an unanswered question (text only), or queues it until there is a connection. */
  submitQuestion: (text: string, honeypot?: string) => Promise<SubmitResult>;
};

const AppStateContext = createContext<Ctx | null>(null);

const clamp = (n: number) =>
  Math.round(Math.min(TEXT_SCALE_MAX, Math.max(TEXT_SCALE_MIN, n)) * 100) / 100;

async function readStore(): Promise<Partial<Persisted>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Partial<Persisted>) : {};
  } catch {
    return {};
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const [state, setState] = useState<Persisted>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    readStore().then(async (s) => {
      if (s.pending?.length) {
        await adoptLegacy(s.pending);
        s.pending = [];
      }
      if (!alive) return;
      setState((prev) => ({ ...prev, ...s, daily: { ...prev.daily, ...s.daily }, textScale: clamp(s.textScale ?? prev.textScale) }));
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const update = useCallback((patch: (s: Persisted) => Partial<Persisted>) => {
    setState((s) => ({ ...s, ...patch(s) }));
  }, []);

  const value = useMemo<Ctx>(() => {
    const id: ThemeId =
      state.themeChoice === 'system'
        ? scheme === 'dark'
          ? DEFAULT_DARK
          : DEFAULT_LIGHT
        : state.themeChoice;
    const saved = new Set(state.saved);
    return {
      ...state,
      ready,
      theme: THEME_BY_ID[id] ?? THEME_BY_ID[DEFAULT_LIGHT],
      setThemeChoice: (c) => update(() => ({ themeChoice: c })),
      setTextScale: (n) => update(() => ({ textScale: clamp(n) })),
      bumpTextScale: (dir) => update((s) => ({ textScale: clamp(s.textScale + dir * TEXT_SCALE_STEP) })),
      setReadAloud: (v) => update(() => ({ readAloud: v })),
      preview: EDITOR_MODE && state.previewDrafts,
      setPreviewDrafts: (v) => update(() => ({ previewDrafts: v })),
      setDaily: (patch) => update((s) => ({ daily: { ...s.daily, ...patch } })),
      toggleRead: (path, qid) =>
        update((s) => {
          const cur = s.pathsRead[path] ?? [];
          return { pathsRead: { ...s.pathsRead, [path]: cur.includes(qid) ? cur.filter((x) => x !== qid) : [...cur, qid] } };
        }),
      isSaved: (qid) => saved.has(qid),
      toggleSaved: (qid) =>
        update((s) => ({
          saved: s.saved.includes(qid) ? s.saved.filter((x) => x !== qid) : [qid, ...s.saved],
        })),
      submitQuestion,
    };
  }, [state, ready, scheme, update]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
}

export function useTheme() {
  return useAppState().theme;
}
