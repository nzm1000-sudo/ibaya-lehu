import { router } from 'expo-router';
import { useState } from 'react';
import { Switch, Text, View } from 'react-native';

import { Icon, topicIcon } from '@/components/icon';
import { Btn, Glass, Screen, ScreenHeader, SectionHeader, Txt, frameStyle } from '@/components/ui';
import { TEXT_SCALE_MAX, TEXT_SCALE_MIN, useAppState, useTheme, type ThemeChoice } from '@/state/app-state';
import { DEFAULT_DARK, DEFAULT_LIGHT, rgba, THEME_BY_ID, THEMES, type Theme } from '@/theme/themes';
import { S } from '@/constants/strings';
import { DAILY_TOPICS } from '@/data/qa';
import { EDITOR_MODE } from '@/lib/editor';
import { NOTIFY_SUPPORTED, requestNotifyPermission } from '@/lib/notify';

export default function SettingsScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const { themeChoice, setThemeChoice, textScale, bumpTextScale, readAloud, setReadAloud, previewDrafts, setPreviewDrafts } = useAppState();

  return (
    <Screen tabBar={false}>
      <ScreenHeader title={S.settings.title} onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />

      <SectionHeader title={S.settings.theme} />
      <SystemOption selected={themeChoice === 'system'} onPress={() => setThemeChoice('system')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14, marginTop: 14 }}>
        {THEMES.map((t) => (
          <Swatch key={t.id} t={t} selected={themeChoice === t.id} onPress={() => setThemeChoice(t.id as ThemeChoice)} />
        ))}
      </View>

      <SectionHeader title={S.settings.textSize} />
      <Glass style={{ borderRadius: 18, padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Btn label={S.settings.smallerA11y} disabled={textScale <= TEXT_SCALE_MIN} accessibilityState={{ disabled: textScale <= TEXT_SCALE_MIN }} onPress={() => bumpTextScale(-1)} style={[sizeBtn, { opacity: textScale <= TEXT_SCALE_MIN ? 0.4 : 1 }]}>
            <Icon name="textSmaller" size={20} color={c.acc} />
          </Btn>
          <Txt size={13} color={c.ink2} accessibilityRole="text">
            {`${Math.round(textScale * 100)}%`}
          </Txt>
          <Btn label={S.settings.largerA11y} disabled={textScale >= TEXT_SCALE_MAX} accessibilityState={{ disabled: textScale >= TEXT_SCALE_MAX }} onPress={() => bumpTextScale(1)} style={[sizeBtn, { opacity: textScale >= TEXT_SCALE_MAX ? 0.4 : 1 }]}>
            <Icon name="textLarger" size={20} color={c.acc} />
          </Btn>
        </View>
        <Txt w="300" size={16} lh={1.7} scaled color={c.ink3} align="center" style={{ marginTop: 10 }}>
          {S.settings.textSample}
        </Txt>
      </Glass>

      <SectionHeader title={S.settings.readAloudSection} />
      <Glass style={{ borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Icon name="speaker" size={19} color={c.metalIcon} />
        <View style={{ flex: 1 }}>
          <Txt size={15}>{S.settings.readAloud}</Txt>
          <Txt w="300" size={12.5} lh={1.5} color={c.ink2}>
            {S.settings.readAloudDesc}
          </Txt>
        </View>
        <Toggle value={readAloud} onValueChange={setReadAloud} label={S.settings.readAloud} />
      </Glass>

      <DailySection />

      {EDITOR_MODE && (
        <>
          <SectionHeader title={S.settings.editorSection} />
          <Glass style={{ borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="dots" size={19} color={c.metalIcon} />
            <View style={{ flex: 1 }}>
              <Txt size={15}>{S.settings.preview}</Txt>
              <Txt w="300" size={12.5} lh={1.5} color={c.ink2}>
                {S.settings.previewDesc}
              </Txt>
            </View>
            <Toggle value={previewDrafts} onValueChange={setPreviewDrafts} label={S.settings.preview} />
          </Glass>
        </>
      )}
    </Screen>
  );
}

function DailySection() {
  const theme = useTheme();
  const c = theme.colors;
  const { daily, setDaily } = useAppState();
  const [denied, setDenied] = useState(false);

  const toggle = async (on: boolean) => {
    if (on && NOTIFY_SUPPORTED) {
      const ok = await requestNotifyPermission();
      setDenied(!ok);
      if (!ok) return;
    }
    setDaily({ enabled: on, topics: on && !daily.topics.length ? DAILY_TOPICS.slice(0, 1) : daily.topics });
  };
  const pickTopic = (t: string) => {
    const has = daily.topics.includes(t);
    if (has) setDaily({ topics: daily.topics.filter((x) => x !== t) });
    else if (daily.topics.length < 3) setDaily({ topics: [...daily.topics, t] });
  };
  const hourBtn = (dir: 1 | -1) => setDaily({ hour: (daily.hour + dir + 24) % 24 });

  return (
    <>
      <SectionHeader title={S.daily.section} />
      <Glass style={{ borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Icon name="bell" size={19} color={c.metalIcon} />
          <View style={{ flex: 1 }}>
            <Txt size={15}>{S.daily.toggle}</Txt>
            <Txt w="300" size={12.5} lh={1.5} color={c.ink2}>
              {S.daily.toggleDesc}
            </Txt>
          </View>
          <Toggle value={daily.enabled} onValueChange={toggle} label={S.daily.toggle} />
        </View>
        {!NOTIFY_SUPPORTED || denied ? (
          <Txt w="300" size={12.5} lh={1.5} color={c.ink2} align="center" style={{ marginTop: 8 }}>
            {NOTIFY_SUPPORTED ? S.daily.denied : S.daily.webOnly}
          </Txt>
        ) : null}
        {daily.enabled ? (
          <View style={{ borderTopWidth: 1, borderTopColor: c.divider, marginTop: 10, paddingTop: 12 }}>
            <Txt w="500" size={12.5} ls={0.3} color={c.acc} align="center">
              {S.daily.topics}
            </Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 8 }}>
              {DAILY_TOPICS.map((t) => {
                const on = daily.topics.includes(t);
                const full = !on && daily.topics.length >= 3;
                return (
                  <Btn
                    key={t}
                    label={S.daily.topicA11y(t, on)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on, disabled: full }}
                    disabled={full}
                    onPress={() => pickTopic(t)}
                    style={[
                      frameStyle(theme, 4),
                      { margin: 3, height: 34, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: on ? c.tagBg : c.pillBg, opacity: full ? 0.45 : 1 },
                      !on && { borderColor: c.divider, outlineColor: 'transparent' },
                    ]}>
                    <Icon name={on ? 'check' : topicIcon(t)} size={14} color={on ? c.acc : c.metalIcon} />
                    <Txt size={13.5} w={on ? '500' : '400'}>
                      {t}
                    </Txt>
                  </Btn>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 14 }}>
              <Txt size={14} color={c.ink2}>
                {S.daily.hour}
              </Txt>
              <Btn label={S.daily.earlier} onPress={() => hourBtn(-1)} style={sizeBtn}>
                <Icon name="minus" size={18} color={c.acc} />
              </Btn>
              <Txt w="500" size={17} style={{ minWidth: 56, textAlign: 'center', fontVariant: ['tabular-nums'] }}>
                {S.daily.hourValue(daily.hour)}
              </Txt>
              <Btn label={S.daily.later} onPress={() => hourBtn(1)} style={sizeBtn}>
                <Icon name="plus" size={18} color={c.acc} />
              </Btn>
            </View>
          </View>
        ) : null}
      </Glass>
    </>
  );
}

function Toggle({ value, onValueChange, label }: { value: boolean; onValueChange: (v: boolean) => void; label: string }) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      accessibilityLabel={label}
      trackColor={{ false: rgba(c.ink, 0.18), true: c.acc }}
      thumbColor={theme.scheme === 'dark' ? c.ink : '#FFFFFF'}
      {...({ activeThumbColor: theme.scheme === 'dark' ? c.bg : '#FFFFFF' } as object)}
    />
  );
}

const sizeBtn = { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' } as const;

function SystemOption({ selected, onPress }: { selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  const c = theme.colors;
  const light = THEME_BY_ID[DEFAULT_LIGHT];
  const dark = THEME_BY_ID[DEFAULT_DARK];
  return (
    <Btn label={S.settings.systemA11y} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress}>
      <Glass style={[{ borderRadius: 14, paddingHorizontal: 14, minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12 }, selected && { borderColor: c.acc, borderWidth: 1.5 }]}>
        <View style={{ flexDirection: 'row', width: 40, height: 26, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: c.divider }}>
          <View style={{ flex: 1, backgroundColor: light.colors.bg }} />
          <View style={{ flex: 1, backgroundColor: dark.colors.bg }} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt size={14.5}>{S.settings.system}</Txt>
          <Txt w="300" size={12} color={c.ink2}>
            {S.settings.systemDesc(light.name, dark.name)}
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
    <Btn label={S.settings.themeA11y(t.name)} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={{ width: '48%' }}>
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
          <Text style={{ fontFamily: t.fonts.disp, fontSize: 7, color: k.metalText }}>{S.common.bh}</Text>
        </View>
        <Text style={{ fontFamily: t.fonts.disp, fontSize: 17, color: k.wmInk, marginTop: -2 }}>{S.settings.swatchWordmark}</Text>
        <View style={{ width: 60, height: 1, backgroundColor: k.orn, marginTop: 3 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <View style={[frameStyle(t, 3), { paddingHorizontal: 6, paddingVertical: 1, backgroundColor: k.pillBg }]}>
            <Text style={{ fontFamily: t.fonts.body400, fontSize: 9, color: k.ink }}>{S.settings.swatchTopic}</Text>
          </View>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: k.acc }} />
          <Text style={{ fontFamily: t.fonts.body400, fontSize: 9, color: k.ink2 }}>{S.settings.swatchDaily}</Text>
        </View>
        <Text style={{ fontFamily: t.fonts.body500, fontSize: 12, color: k.ink, marginTop: 'auto' }}>{t.name}</Text>
      </View>
    </Btn>
  );
}
