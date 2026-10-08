import { router } from 'expo-router';
import { View } from 'react-native';

import { Icon } from '@/components/icon';
import { QuestionList } from '@/components/question-list';
import { Screen, ScreenHeader, TextLink, Txt } from '@/components/ui';
import { getQA, type QA } from '@/data/qa';
import { useAppState, useTheme } from '@/state/app-state';
import { S } from '@/constants/strings';

export default function SavedScreen() {
  const c = useTheme().colors;
  const { saved } = useAppState();
  const items = saved.map(getQA).filter((q): q is QA => !!q);
  return (
    <Screen>
      <ScreenHeader title={S.saved.title} />
      {items.length ? (
        <>
          <Txt size={13} color={c.ink2} align="center" style={{ marginTop: 14, marginBottom: 18 }}>
            {S.saved.count(items.length)}
          </Txt>
          <QuestionList items={items} excerpt />
        </>
      ) : (
        <View style={{ alignItems: 'center', marginTop: 48, gap: 10 }}>
          <Icon name="bookmark" size={28} color={c.metalIcon} strokeWidth={1.3} />
          <Txt w="500" size={16} align="center">
            {S.saved.emptyTitle}
          </Txt>
          <Txt w="300" size={14} lh={1.55} color={c.ink3} align="center" style={{ maxWidth: 280 }}>
            {S.saved.emptyBody}
          </Txt>
          <TextLink label={S.saved.toSearch} onPress={() => router.push('/search')} />
        </View>
      )}
    </Screen>
  );
}
