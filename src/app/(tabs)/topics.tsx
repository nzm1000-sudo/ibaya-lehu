import { router } from 'expo-router';
import { View } from 'react-native';

import { Icon, topicIcon } from '@/components/icon';
import { Btn, Glass, Screen, ScreenHeader, Txt } from '@/components/ui';
import { ALL, TOPICS } from '@/data/qa';
import { useTheme } from '@/state/app-state';

export default function TopicsScreen() {
  const c = useTheme().colors;
  return (
    <Screen>
      <ScreenHeader title="נושאים" />
      <Txt size={13} color={c.ink2} align="center" style={{ marginTop: 14, marginBottom: 18 }}>
        {`${ALL.length.toLocaleString('he-IL')} שאלות ותשובות`}
      </Txt>
      <Glass style={{ borderRadius: 18, paddingHorizontal: 14 }}>
        {TOPICS.map((t, i) => (
          <Btn
            key={t.name}
            label={`${t.name}, ${t.count} שאלות`}
            onPress={() => router.push({ pathname: '/topic/[name]', params: { name: t.name } })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54, borderTopWidth: i ? 1 : 0, borderTopColor: c.divider }}>
            <Icon name={topicIcon(t.name)} size={18} color={c.metalIcon} />
            <Txt size={15} scaled style={{ flex: 1 }}>
              {t.name}
            </Txt>
            <Txt size={12.5} color={c.ink2}>
              {t.count.toLocaleString('he-IL')}
            </Txt>
            <View style={{ width: 16 }}>
              <Icon name="chevForward" size={16} color={c.ink2} />
            </View>
          </Btn>
        ))}
      </Glass>
    </Screen>
  );
}
