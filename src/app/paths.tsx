import { router } from 'expo-router';
import { View } from 'react-native';

import { Icon } from '@/components/icon';
import { Btn, Glass, Screen, ScreenHeader, Tag, Txt } from '@/components/ui';
import { S } from '@/constants/strings';
import { lifePaths, pathSteps } from '@/data/paths';
import { useAppState, useTheme } from '@/state/app-state';

export default function PathsScreen() {
  const c = useTheme().colors;
  const { preview, pathsRead } = useAppState();
  const paths = lifePaths(preview);
  return (
    <Screen tabBar={false}>
      <ScreenHeader title={S.paths.title} onBack={() => (router.canGoBack() ? router.back() : router.replace('/topics'))} />
      <Txt w="300" size={13.5} lh={1.5} color={c.ink2} align="center" style={{ marginTop: 14, marginBottom: 18 }}>
        {S.paths.intro}
      </Txt>
      {paths.length ? (
        <Glass style={{ borderRadius: 18, paddingHorizontal: 14 }}>
          {paths.map((p, i) => {
            const total = pathSteps(p).length;
            const done = (pathsRead[p.key] ?? []).length;
            return (
              <Btn
                key={p.key}
                label={`${p.title}. ${p.subtitle}`}
                onPress={() => router.push({ pathname: '/path/[key]', params: { key: p.key } })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 72, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: c.divider }}>
                <Icon name={p.icon} size={20} color={c.metalIcon} />
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Txt w="500" size={15.5} scaled>
                      {p.title}
                    </Txt>
                    {!p.approved && <Tag label={S.paths.draft} />}
                  </View>
                  <Txt w="300" size={13} lh={1.45} color={c.ink3}>
                    {p.subtitle}
                  </Txt>
                  <Txt size={12} color={done ? c.acc : c.ink2} style={{ marginTop: 2 }}>
                    {done ? S.paths.progress(Math.min(done, total), total) : S.paths.steps(total)}
                  </Txt>
                </View>
                <Icon name="chevForward" size={16} color={c.ink2} />
              </Btn>
            );
          })}
        </Glass>
      ) : (
        <Txt size={14} color={c.ink3} align="center">
          {S.paths.empty}
        </Txt>
      )}
    </Screen>
  );
}
