import { router } from 'expo-router';
import { View } from 'react-native';

import { type QA } from '@/data/qa';
import { useTheme } from '@/state/app-state';

import { Icon } from './icon';
import { Btn, clayStyle, Glass, Tag, Txt } from './ui';

/** Questions as separate soft clay capsules (Home picks, "שאלות דומות"); each opens its answer. */
export function ClayQuestions({ items, showTopic = true }: { items: QA[]; showTopic?: boolean }) {
  const theme = useTheme();
  const c = theme.colors;
  if (!items.length) return null;
  return (
    <View style={{ gap: 10 }}>
      {items.map((q) => (
        <Btn
          key={q.id}
          label={showTopic && q.topics[0] ? `${q.question}, ${q.topics[0]}` : q.question}
          onPress={() => router.push({ pathname: '/answer/[id]', params: { id: q.id } })}
          style={[clayStyle(theme), { minHeight: 56, paddingVertical: 12, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', gap: 4 }]}>
          <Txt size={14.5} lh={1.45} scaled align="center" numberOfLines={2}>
            {q.question}
          </Txt>
          {showTopic && q.topics[0] ? (
            <Txt size={11.5} color={c.ink2} align="center">
              {q.topics[0]}
            </Txt>
          ) : null}
        </Btn>
      ))}
    </View>
  );
}

/** Glass list of questions; each row opens the answer page. */
export function QuestionList({ items, excerpt = false, showTopic = true }: { items: QA[]; excerpt?: boolean; showTopic?: boolean }) {
  const c = useTheme().colors;
  if (!items.length) return null;
  return (
    <Glass style={{ borderRadius: 18, paddingHorizontal: 14 }}>
      {items.map((q, i) => (
        <Btn
          key={q.id}
          label={q.question}
          onPress={() => router.push({ pathname: '/answer/[id]', params: { id: q.id } })}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            minHeight: 50,
            paddingVertical: excerpt ? 12 : 8,
            borderTopWidth: i ? 1 : 0,
            borderTopColor: c.divider,
          }}>
          <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
            <Txt size={14.5} lh={1.45} scaled numberOfLines={2}>
              {q.question}
            </Txt>
            {excerpt && (
              <Txt w="300" size={13} lh={1.5} scaled color={c.ink3} numberOfLines={2}>
                {q.answer}
              </Txt>
            )}
            {showTopic && excerpt && q.topics[0] ? (
              <View style={{ flexDirection: 'row', marginTop: 4 }}>
                <Tag label={q.topics[0]} />
              </View>
            ) : null}
          </View>
          {showTopic && !excerpt && q.topics[0] ? <Tag label={q.topics[0]} /> : null}
          <Icon name="chevForward" size={16} color={c.ink2} />
        </Btn>
      ))}
    </Glass>
  );
}
