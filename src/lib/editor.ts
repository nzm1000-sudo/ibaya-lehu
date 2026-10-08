import { Platform } from 'react-native';

/**
 * Editor mode: development builds, or a build made with EXPO_PUBLIC_EDITOR=1 for the editorial team.
 * Only in editor mode does Settings offer "תצוגת טיוטה" (preview of unapproved curated items)
 * and does the web build accept a `?date=YYYY-MM-DD` override for date-driven features.
 */
export const EDITOR_MODE = __DEV__ || process.env.EXPO_PUBLIC_EDITOR === '1';

function dateOverride(): Date | null {
  if (!EDITOR_MODE || Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const m = /[?&]date=(\d{4})-(\d{2})-(\d{2})/.exec(window.location.search);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), new Date().getHours(), new Date().getMinutes());
}

// Read once at start-up: in-app navigation drops the query string.
const OVERRIDE = dateOverride();

/** "Now", honouring the editor date override. */
export function now(): Date {
  return OVERRIDE ? new Date(OVERRIDE) : new Date();
}
