import { router } from 'expo-router';
import { useMemo } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';

import { Icon, topicIcon, type IconName } from '@/components/icon';
import { BH, Btn, CircleBtn, Glass, GUTTER, Ornament, Screen, SectionHeader, Tag, TextLink, Txt, frameStyle } from '@/components/ui';
import { dailyQuestion, forYou, readingMinutes, TOPICS, type TopicCount } from '@/data/qa';
import { useAppState, useTheme } from '@/state/app-state';
import { rgba } from '@/theme/themes';

function greeting(h: number) {
  if (h >= 5 && h < 12) return 'בוקר טוב';
  if (h >= 12 && h < 17) return 'צהריים טובים';
  if (h >= 17 && h < 22) return 'ערב טוב';
  return 'לילה טוב';
}

/* ---------- topic pills: six pills in two centered rows of three ---------- */

const PILL_GAP = 6;
const PILL_MARGIN = 3; // room for the outer rule of the double frame
const MORE = 'more' as const;
type PillItem = TopicCount | typeof MORE;

/** Rough pill width (icon + gap + padding + border + text at 13.5px), deliberately on the wide side. */
function pillWidth(name: string) {
  return 15 + 5 + 22 + 2 + name.length * 7.3 + 2 * PILL_MARGIN;
}

function rowWidth(row: PillItem[]) {
  return row.reduce((w, t) => w + pillWidth(t === MORE ? 'עוד' : t.name), 0) + PILL_GAP * (row.length - 1);
}

/** Balance the pills over two rows (longest with shortest); if a row still overflows, show five + "עוד". */
function topicRows(top: TopicCount[], avail: number): PillItem[][] {
  const byLen = [...top].sort((a, b) => b.name.length - a.name.length);
  const keep = (t: TopicCount) => top.indexOf(t);
  const split = (items: PillItem[]) => {
    const a: PillItem[] = [];
    const b: PillItem[] = [];
    items.forEach((t, i) => ([0, 3, 4].includes(i) ? a : b).push(t));
    const order = (r: PillItem[]) => r.sort((x, y) => (x === MORE ? 1 : y === MORE ? -1 : keep(x) - keep(y)));
    return [order(a), order(b)];
  };
  const six = split(byLen);
  if (six.every((r) => rowWidth(r) <= avail)) return six;
  const five = top.slice(0, 5).sort((a, b) => b.name.length - a.name.length);
  return split([...five, MORE]);
}

function TopicPill({ name, icon, label, onPress }: { name: string; icon: IconName; label: string; onPress: () => void }) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <Btn
      label={label}
      onPress={onPress}
      style={[
        frameStyle(theme, 4),
        {
          margin: PILL_MARGIN,
          height: 34,
          minWidth: 44,
          flexShrink: 1,
          paddingStart: 11,
          paddingEnd: 11,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          backgroundColor: c.pillBg,
        },
      ]}>
      <Icon name={icon} size={15} color={c.metalIcon} strokeWidth={1.6} />
      <Txt size={13.5} numberOfLines={1} style={{ flexShrink: 1 }}>
        {name}
      </Txt>
    </Btn>
  );
}

export default function Home() {
  const theme = useTheme();
  const c = theme.colors;
  const { saved } = useAppState();
  const now = new Date();
  const daily = dailyQuestion(now);
  const picks = useMemo(() => forYou(saved), [saved]);
  const { width } = useWindowDimensions();
  const pillRows = useMemo(() => topicRows(TOPICS.filter((t) => t.name !== 'אחר').slice(0, 6), Math.min(width, 560) - 2 * GUTTER), [width]);

  const micGradient = `linear-gradient(150deg, ${c.mic1}, ${c.mic2})`;

  return (
    <Screen>
      {/* header: ב״ה right, wordmark + ornament centered, settings in the avatar slot on the left */}
      <View style={{ paddingTop: 6, alignItems: 'center' }}>
        <BH />
        <View style={{ position: 'absolute', end: 0, top: -4 }}>
          <CircleBtn icon="gear" label="הגדרות" onPress={() => router.push('/settings')} />
        </View>
        <Txt w="disp" size={27} lh={1.3} ls={theme.wmLetterSpacing} color={c.wmInk} accessibilityRole="header">
          אִיבַּעְיָא לְהוּ
        </Txt>
        <View style={{ marginTop: 2 }}>
          <Ornament />
        </View>
      </View>

      <View style={{ marginTop: 18, alignItems: 'center' }}>
        <Txt size={13} color={c.ink2} ls={0.2}>
          {greeting(now.getHours())}
        </Txt>
        <Txt size={21} lh={1.3} ls={-0.2} style={{ marginTop: 2 }} align="center" accessibilityRole="header">
          על מה תרצה לחשוב היום?
        </Txt>
      </View>

      <Btn label="חיפוש שאלה" accessibilityHint="פותח את מסך החיפוש" onPress={() => router.push('/search')}>
        <Glass
          style={{
            marginTop: 20,
            height: 46,
            borderRadius: 23,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingStart: 16,
            paddingEnd: 6,
          }}>
          <Icon name="search" size={18} color={c.ink2} />
          <Txt w="300" size={15} color={c.ink2} style={{ flex: 1 }} numberOfLines={1}>
            כתוב או אמור את השאלה שלך
          </Txt>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: c.mic2,
              boxShadow: `inset 1px 1px 2px ${c.micHi}, inset -1.5px -1.5px 3px ${rgba(c.acc, 0.22)}, 0 2px 6px ${rgba(c.acc, 0.18)}`,
              ...(Platform.OS === 'web' ? ({ backgroundImage: micGradient } as object) : ({ experimental_backgroundImage: micGradient } as object)),
            }}>
            <Icon name="mic" size={17} color={c.micIcon} strokeWidth={1.7} />
          </View>
        </Glass>
      </Btn>

      <Glass style={{ marginTop: 22, borderRadius: 20, paddingTop: 18, paddingHorizontal: 18, paddingBottom: 8, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Txt w="500" size={12} ls={0.4} color={c.acc}>
            שאלת היום
          </Txt>
          <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: c.metal }} />
          <Txt size={12} ls={0.4} color={c.ink2}>
            {readingMinutes(daily) === 1 ? 'דקת קריאה' : `${readingMinutes(daily)} דקות קריאה`}
          </Txt>
        </View>
        <Txt w="500" size={17} lh={1.4} ls={-0.1} align="center" style={{ marginTop: 8 }}>
          {daily.question}
        </Txt>
        <Txt w="300" size={14} lh={1.55} color={c.ink3} align="center" numberOfLines={2} style={{ marginTop: 4 }}>
          {daily.answer}
        </Txt>
        <View style={{ marginTop: 0 }}>
          <TextLink label="לקריאת התשובה" onPress={() => router.push({ pathname: '/answer/[id]', params: { id: daily.id } })} />
        </View>
      </Glass>

      <SectionHeader title="נושאים" action={{ label: 'כל הנושאים', onPress: () => router.navigate('/topics') }} />
      <View style={{ alignItems: 'center', gap: 6 }}>
        {pillRows.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row', justifyContent: 'center', gap: PILL_GAP, maxWidth: '100%' }}>
            {row.map((t) =>
              t === MORE ? (
                <TopicPill key="more" name="עוד" icon="grid" label="כל הנושאים" onPress={() => router.navigate('/topics')} />
              ) : (
                <TopicPill
                  key={t.name}
                  name={t.name}
                  icon={topicIcon(t.name)}
                  label={`${t.name}, ${t.count} שאלות`}
                  onPress={() => router.push({ pathname: '/topic/[name]', params: { name: t.name } })}
                />
              ),
            )}
          </View>
        ))}
      </View>

      <SectionHeader title="שאלות בשבילך" action={{ label: 'הכול', onPress: () => router.push('/search') }} />
      <Glass style={{ borderRadius: 18, paddingHorizontal: 14 }}>
        {picks.map((q, i) => (
          <Btn
            key={q.id}
            label={q.question}
            onPress={() => router.push({ pathname: '/answer/[id]', params: { id: q.id } })}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              minHeight: 50,
              borderTopWidth: i ? 1 : 0,
              borderTopColor: c.divider,
            }}>
            <Txt size={14.5} numberOfLines={1} style={{ flex: 1, minWidth: 0 }}>
              {q.question}
            </Txt>
            <Tag label={q.topics[0] ?? ''} />
          </Btn>
        ))}
      </Glass>
    </Screen>
  );
}
