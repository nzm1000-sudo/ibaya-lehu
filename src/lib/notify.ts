import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { S } from '@/constants/strings';
import { dailyForTopics } from '@/data/qa';

import { isRestTime } from './shabbat';

export type DailySettings = { enabled: boolean; topics: string[]; hour: number };

/** Local notifications exist only in the phone apps. */
export const NOTIFY_SUPPORTED = Platform.OS !== 'web';

const CHANNEL = 'daily';
/** Scheduled ahead each time the app opens or the settings change (iOS keeps at most 64). */
const DAYS_AHEAD = 14;

if (NOTIFY_SUPPORTED) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

export async function requestNotifyPermission(): Promise<boolean> {
  if (!NOTIFY_SUPPORTED) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, { name: S.daily.channel, importance: Notifications.AndroidImportance.DEFAULT });
  }
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/**
 * Replaces every scheduled notification with the daily questions for the next DAYS_AHEAD days.
 * Skips Shabbat and Yom Tov (Israel). The text is only a neutral title and the question.
 */
export async function rescheduleDaily(s: DailySettings, from = new Date()): Promise<number> {
  if (!NOTIFY_SUPPORTED) return 0;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!s.enabled || !s.topics.length) return 0;
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return 0;
  let n = 0;
  for (let i = 0; i <= DAYS_AHEAD; i++) {
    const at = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i, s.hour, 0, 0);
    if (at.getTime() <= from.getTime() + 60_000 || isRestTime(at)) continue;
    const q = dailyForTopics(s.topics, at);
    if (!q) continue;
    await Notifications.scheduleNotificationAsync({
      content: { title: S.daily.notifyTitle, body: q.question, data: { id: q.id } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL },
    });
    n++;
  }
  return n;
}

/** Opens the answer when a daily notification is tapped. Returns an unsubscribe function. */
export function onDailyTapped(open: (id: string) => void): () => void {
  if (!NOTIFY_SUPPORTED) return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener((r) => {
    const id = r.notification.request.content.data?.id;
    if (typeof id === 'string') open(id);
  });
  return () => sub.remove();
}
