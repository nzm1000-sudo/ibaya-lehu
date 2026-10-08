import { router } from 'expo-router';
import { View } from 'react-native';

import { Icon } from '@/components/icon';
import { Btn, Screen, ScreenHeader, Tag, TextLink, Txt, frameStyle } from '@/components/ui';
import { S } from '@/constants/strings';
import { hardNowAnswers } from '@/data/curated';
import { dayKey } from '@/data/qa';
import { now } from '@/lib/editor';
import { useSpeech } from '@/lib/speech';
import { useAppState, useTheme } from '@/state/app-state';

/** A quiet screen: up to three short calming answers, and one small link to "קווי סיוע". No search, no long lists. */
export default function HardNowScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const { preview } = useAppState();
  const items = hardNowAnswers(preview, dayKey(now()));
  const { speakingKey, toggle } = useSpeech();

  return (
    <Screen tabBar={false}>
      <ScreenHeader title={S.hardNow.title} onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />

      {items.length ? (
        <>
          <Txt w="500" size={15} align="center" accessibilityRole="header" style={{ marginTop: 18, marginBottom: 12 }}>
            {S.hardNow.readTitle}
          </Txt>
          <View style={{ gap: 14 }}>
            {items.map(({ q, approved }) => {
              const on = speakingKey === q.id;
              return (
                <View key={q.id} style={[frameStyle(theme, 6), { marginHorizontal: 3, paddingVertical: 16, paddingHorizontal: 16, backgroundColor: c.pillBg }]}>
                  {!approved && (
                    <View style={{ position: 'absolute', top: 8, end: 8 }}>
                      <Tag label={S.hardNow.draft} />
                    </View>
                  )}
                  <Txt w="500" size={15} lh={1.45} scaled align="center" style={{ paddingHorizontal: approved ? 0 : 28 }}>
                    {q.question}
                  </Txt>
                  <Txt w="300" size={15} lh={1.7} scaled color={c.ink3} style={{ marginTop: 8 }}>
                    {q.answer}
                  </Txt>
                  <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 18, marginTop: 4 }}>
                    <Btn
                      label={on ? S.hardNow.stopA11y : S.hardNow.readA11y}
                      accessibilityState={{ selected: on }}
                      onPress={() => toggle(q.id, `${q.question}. ${q.answer}`)}
                      style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Icon name={on ? 'stop' : 'speaker'} size={17} color={c.acc} />
                      <Txt w="500" size={13.5} color={c.acc}>
                        {on ? S.hardNow.stop : S.hardNow.read}
                      </Txt>
                    </Btn>
                    <TextLink label={S.hardNow.full} size={13} onPress={() => router.push({ pathname: '/answer/[id]', params: { id: q.id } })} />
                  </View>
                </View>
              );
            })}
          </View>
        </>
      ) : null}

      <View style={{ alignItems: 'center', marginTop: 24 }}>
        <TextLink label={S.hardNow.helpLink} size={13} icon="phone" onPress={() => router.push('/help')} />
      </View>
    </Screen>
  );
}
