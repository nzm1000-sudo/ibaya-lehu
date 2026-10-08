import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { Icon, topicIcon } from '@/components/icon';
import { QuestionList } from '@/components/question-list';
import { Screen, ScreenHeader, Txt } from '@/components/ui';
import { byTopic } from '@/data/qa';
import { useTheme } from '@/state/app-state';
import { S } from '@/constants/strings';

export default function TopicScreen() {
  const c = useTheme().colors;
  const { name = '' } = useLocalSearchParams<{ name: string }>();
  const items = useMemo(() => byTopic(name), [name]);
  return (
    <Screen tabBar={false}>
      <ScreenHeader title={name} onBack={() => (router.canGoBack() ? router.back() : router.replace('/topics'))} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 14, marginBottom: 18 }}>
        <Icon name={topicIcon(name)} size={15} color={c.metalIcon} />
        <Txt size={13} color={c.ink2}>
          {S.topics.count(items.length)}
        </Txt>
      </View>
      {items.length ? (
        <QuestionList items={items} showTopic={false} />
      ) : (
        <Txt size={14} color={c.ink3} align="center">
          {S.topics.empty}
        </Txt>
      )}
    </Screen>
  );
}
