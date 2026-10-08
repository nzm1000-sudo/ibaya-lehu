import { router } from 'expo-router';
import { Switch, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Btn, Glass, Screen, ScreenHeader, SectionHeader, Txt, frameStyle } from '@/components/ui';
import { TEXT_SCALE_MAX, TEXT_SCALE_MIN, useAppState, useTheme, type ThemeChoice } from '@/state/app-state';
import { DEFAULT_DARK, DEFAULT_LIGHT, rgba, THEME_BY_ID, THEMES, type Theme } from '@/theme/themes';

export default function SettingsScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const { themeChoice, setThemeChoice, textScale, bumpTextScale, readAloud, setReadAloud } = useAppState();

  return (
    <Screen tabBar={false}>
      <ScreenHeader title="הגדרות" onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />

      <SectionHeader title="ערכת עיצוב" />
      <SystemOption selected={themeChoice === 'system'} onPress={() => setThemeChoice('system')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14, marginTop: 14 }}>
        {THEMES.map((t) => (
          <Swatch key={t.id} t={t} selected={themeChoice === t.id} onPress={() => setThemeChoice(t.id as ThemeChoice)} />
        ))}
      </View>

      <SectionHeader title="גודל הטקסט" />
      <Glass style={{ borderRadius: 18, padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Btn label="הקטנת הטקסט" disabled={textScale <= TEXT_SCALE_MIN} accessibilityState={{ disabled: textScale <= TEXT_SCALE_MIN }} onPress={() => bumpTextScale(-1)} style={[sizeBtn, { opacity: textScale <= TEXT_SCALE_MIN ? 0.4 : 1 }]}>
            <Icon name="textSmaller" size={20} color={c.acc} />
          </Btn>
          <Txt size={13} color={c.ink2} accessibilityRole="text">
            {`${Math.round(textScale * 100)}%`}
          </Txt>
          <Btn label="הגדלת הטקסט" disabled={textScale >= TEXT_SCALE_MAX} accessibilityState={{ disabled: textScale >= TEXT_SCALE_MAX }} onPress={() => bumpTextScale(1)} style={[sizeBtn, { opacity: textScale >= TEXT_SCALE_MAX ? 0.4 : 1 }]}>
            <Icon name="textLarger" size={20} color={c.acc} />
          </Btn>
        </View>
        <Txt w="300" size={16} lh={1.7} scaled color={c.ink3} align="center" style={{ marginTop: 10 }}>
          כך ייראו התשובות: טקסט נוח לקריאה, בקצב שלך.
        </Txt>
      </Glass>

      <SectionHeader title="הקראה" />
      <Glass style={{ borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Icon name="speaker" size={19} color={c.metalIcon} />
        <View style={{ flex: 1 }}>
          <Txt size={15}>הקראת תשובות בקול</Txt>
          <Txt w="300" size={12.5} lh={1.5} color={c.ink2}>
            מוסיף כפתור הקראה בדף התשובה
          </Txt>
        </View>
        <Switch
          value={readAloud}
          onValueChange={setReadAloud}
          accessibilityLabel="הקראת תשובות בקול"
          trackColor={{ false: rgba(c.ink, 0.18), true: c.acc }}
          thumbColor={theme.scheme === 'dark' ? c.ink : '#FFFFFF'}
          {...({ activeThumbColor: theme.scheme === 'dark' ? c.bg : '#FFFFFF' } as object)}
        />
      </Glass>
    </Screen>
  );
}

const sizeBtn = { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' } as const;

function SystemOption({ selected, onPress }: { selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  const c = theme.colors;
  const light = THEME_BY_ID[DEFAULT_LIGHT];
  const dark = THEME_BY_ID[DEFAULT_DARK];
  return (
    <Btn label="לפי הגדרת המכשיר (בהיר או כהה)" accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress}>
      <Glass style={[{ borderRadius: 14, paddingHorizontal: 14, minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12 }, selected && { borderColor: c.acc, borderWidth: 1.5 }]}>
        <View style={{ flexDirection: 'row', width: 40, height: 26, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: c.divider }}>
          <View style={{ flex: 1, backgroundColor: light.colors.bg }} />
          <View style={{ flex: 1, backgroundColor: dark.colors.bg }} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt size={14.5}>לפי המכשיר</Txt>
          <Txt w="300" size={12} color={c.ink2}>
            {`${light.name} ביום, ${dark.name} בלילה`}
          </Txt>
        </View>
        {selected && <Icon name="check" size={18} color={c.acc} />}
      </Glass>
    </Btn>
  );
}

/** Live preview of a theme drawn in its own colours and fonts. */
function Swatch({ t, selected, onPress }: { t: Theme; selected: boolean; onPress: () => void }) {
  const cur = useTheme();
  const k = t.colors;
  return (
    <Btn label={`ערכת ${t.name}`} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={{ width: '48%' }}>
      <View
        style={[
          {
            height: 118,
            borderRadius: 14,
            backgroundColor: k.bg,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: rgba(k.ink, 0.12),
            padding: 10,
            alignItems: 'center',
          },
          selected && { borderColor: cur.colors.acc, borderWidth: 2, padding: 9 },
        ]}>
        <View style={{ position: 'absolute', top: -30, start: -30, width: 90, height: 90, borderRadius: 45, backgroundColor: t.blobs[0][0], opacity: 0.7 }} />
        <View style={{ position: 'absolute', bottom: -40, end: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: t.blobs[1][0], opacity: 0.5 }} />
        <View style={[frameStyle(t, 2), { alignSelf: 'flex-start', paddingHorizontal: 3, paddingVertical: 1 }]}>
          <Text style={{ fontFamily: t.fonts.disp, fontSize: 7, color: k.metalText }}>ב״ה</Text>
        </View>
        <Text style={{ fontFamily: t.fonts.disp, fontSize: 17, color: k.wmInk, marginTop: -2 }}>אִיבַּעְיָא</Text>
        <View style={{ width: 60, height: 1, backgroundColor: k.orn, marginTop: 3 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <View style={[frameStyle(t, 3), { paddingHorizontal: 6, paddingVertical: 1, backgroundColor: k.pillBg }]}>
            <Text style={{ fontFamily: t.fonts.body400, fontSize: 9, color: k.ink }}>זוגיות</Text>
          </View>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: k.acc }} />
          <Text style={{ fontFamily: t.fonts.body400, fontSize: 9, color: k.ink2 }}>שאלת היום</Text>
        </View>
        <Text style={{ fontFamily: t.fonts.body500, fontSize: 12, color: k.ink, marginTop: 'auto' }}>{t.name}</Text>
      </View>
    </Btn>
  );
}
