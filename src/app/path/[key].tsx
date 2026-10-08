import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Icon } from '@/components/icon';
import { Btn, Glass, Screen, ScreenHeader, Tag, TextLink, Txt, frameStyle } from '@/components/ui';
import { S } from '@/constants/strings';
import { getPath, pathSteps } from '@/data/paths';
import { useAppState, useTheme } from '@/state/app-state';
import { rgba } from '@/theme/themes';

/** One life path: numbered steps, each an editor transition line, the question, an excerpt and "קראתי". */
export default function PathScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const { key } = useLocalSearchParams<{ key: string }>();
  const { preview, pathsRead, toggleRead } = useAppState();
  const path = getPath(key, preview);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/paths'));

  if (!path) {
    return (
      <Screen tabBar={false}>
        <ScreenHeader onBack={back} />
        <Txt size={15} color={c.ink3} align="center" style={{ marginTop: 40 }}>
          {S.paths.notFound}
        </Txt>
      </Screen>
    );
  }

  const steps = pathSteps(path);
  const read = new Set(pathsRead[path.key] ?? []);
  const done = steps.filter((s) => read.has(s.q.id)).length;

  return (
    <Screen tabBar={false}>
      <ScreenHeader title={path.title} onBack={back} />
      <View style={{ alignItems: 'center', marginTop: 12, gap: 6 }}>
        <Txt w="300" size={14} color={c.ink3} align="center">
          {path.subtitle}
        </Txt>
        {!path.approved && <Tag label={S.paths.draft} />}
        <View style={{ width: 180, height: 4, borderRadius: 2, backgroundColor: c.divider, overflow: 'hidden', marginTop: 4 }}>
          <View style={{ width: `${steps.length ? (done / steps.length) * 100 : 0}%`, height: 4, backgroundColor: c.acc, alignSelf: 'flex-start' }} />
        </View>
        <Txt size={12} color={c.ink2} accessibilityRole="text">
          {S.paths.progress(done, steps.length)}
        </Txt>
      </View>

      <View style={{ marginTop: 18 }}>
        {steps.map(({ step, q }, i) => {
          const isRead = read.has(q.id);
          const last = i === steps.length - 1;
          return (
            <View key={q.id} style={{ flexDirection: 'row', gap: 12 }}>
              {/* rail: number + connecting line */}
              <View style={{ alignItems: 'center', width: 30 }}>
                <View
                  style={[
                    frameStyle(theme, 15),
                    { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: isRead ? c.acc : c.pillBg, marginTop: 2 },
                  ]}>
                  {isRead ? (
                    <Icon name="check" size={15} color={c.bg} strokeWidth={2} />
                  ) : (
                    <Txt w="500" size={13} color={c.metalText}>
                      {i + 1}
                    </Txt>
                  )}
                </View>
                {!last && <View style={{ flex: 1, width: 1, backgroundColor: rgba(c.metal, 0.4), marginVertical: 4 }} />}
              </View>

              <View style={{ flex: 1, minWidth: 0, paddingBottom: last ? 0 : 18 }}>
                <Txt w="300" size={13} lh={1.5} color={c.ink2} style={{ marginTop: 6 }}>
                  {step.note}
                </Txt>
                <Glass style={{ marginTop: 8, borderRadius: 16, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 }}>
                  <Txt w="500" size={15} lh={1.45} scaled>
                    {q.question}
                  </Txt>
                  <Txt w="300" size={13.5} lh={1.55} scaled color={c.ink3} numberOfLines={3} style={{ marginTop: 4 }}>
                    {q.answer}
                  </Txt>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Btn
                      label={isRead ? S.paths.unmarkRead : S.paths.markRead}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isRead }}
                      onPress={() => toggleRead(path.key, q.id)}
                      style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          borderWidth: 1.5,
                          borderColor: isRead ? c.acc : c.ink2,
                          backgroundColor: isRead ? c.acc : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        {isRead && <Icon name="check" size={12} color={c.bg} strokeWidth={2.2} />}
                      </View>
                      <Txt size={13.5} color={isRead ? c.acc : c.ink2} w={isRead ? '500' : '400'}>
                        {S.paths.read}
                      </Txt>
                    </Btn>
                    <TextLink label={S.paths.open} size={13} onPress={() => router.push({ pathname: '/answer/[id]', params: { id: q.id } })} />
                  </View>
                </Glass>
              </View>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}
