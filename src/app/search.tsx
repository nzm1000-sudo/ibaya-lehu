import { router, useLocalSearchParams } from 'expo-router';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';

import { Icon } from '@/components/icon';
import { QuestionList } from '@/components/question-list';
import { Btn, Glass, Screen, ScreenHeader, TextLink, Txt, frameStyle } from '@/components/ui';
import { TOPICS } from '@/data/qa';
import { search, SEARCH_LIMIT, warmSearch } from '@/data/search';
import { useAppState, useTheme } from '@/state/app-state';

export default function SearchScreen() {
  const theme = useTheme();
  const c = theme.colors;
  const { textScale } = useAppState();
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(params.q ?? '');
  const deferred = useDeferredValue(query);

  useEffect(() => {
    warmSearch();
  }, []);

  const results = useMemo(() => search(deferred), [deferred]);
  const trimmed = deferred.trim();

  return (
    <Screen tabBar={false}>
      <ScreenHeader title="חיפוש" onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />

      <Glass style={{ marginTop: 18, minHeight: 46, borderRadius: 23, flexDirection: 'row', alignItems: 'center', gap: 10, paddingStart: 16, paddingEnd: 8 }}>
        <Icon name="search" size={18} color={c.ink2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          autoFocus
          placeholder="כתוב את השאלה שלך"
          placeholderTextColor={c.ink2}
          returnKeyType="search"
          accessibilityLabel="שאלה לחיפוש"
          style={{
            flex: 1,
            minHeight: 44,
            fontFamily: theme.fonts.body400,
            fontSize: 15 * textScale,
            color: c.ink,
            textAlign: 'right',
            writingDirection: 'rtl',
            outlineStyle: 'none' as never,
          }}
        />
        {query ? (
          <Btn label="ניקוי החיפוש" onPress={() => setQuery('')} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="close" size={16} color={c.ink2} />
          </Btn>
        ) : null}
      </Glass>

      {!trimmed ? (
        <>
          <Txt size={13} color={c.ink2} align="center" style={{ marginTop: 22 }}>
            אפשר לחפש במילים פשוטות, או לבחור נושא
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 14 }}>
            {TOPICS.map((t) => (
              <Btn
                key={t.name}
                label={t.name}
                onPress={() => router.push({ pathname: '/topic/[name]', params: { name: t.name } })}
                style={[frameStyle(theme), { margin: 3, height: 34, paddingHorizontal: 13, justifyContent: 'center', backgroundColor: c.pillBg }]}>
                <Txt size={13.5}>{t.name}</Txt>
              </Btn>
            ))}
          </View>
        </>
      ) : results.length ? (
        <>
          <Txt size={12.5} color={c.ink2} align="center" style={{ marginTop: 18, marginBottom: 10 }} accessibilityRole="text">
            {results.length >= SEARCH_LIMIT ? 'התשובות הקרובות ביותר' : results.length === 1 ? 'תשובה אחת' : `${results.length} תשובות`}
          </Txt>
          <QuestionList items={results} excerpt />
        </>
      ) : (
        <NotFound key={trimmed} query={trimmed} />
      )}
    </Screen>
  );
}

function NotFound({ query }: { query: string }) {
  const theme = useTheme();
  const c = theme.colors;
  const { submitQuestion, textScale } = useAppState();
  const [text, setText] = useState(query);
  const [sent, setSent] = useState(false);

  return (
    <View style={{ marginTop: 28, alignItems: 'center' }}>
      <Txt w="disp" size={22} lh={1.3} align="center" accessibilityRole="header">
        לא מצאתי תשובה
      </Txt>
      <Txt w="300" size={14} lh={1.55} color={c.ink3} align="center" style={{ marginTop: 6, maxWidth: 300 }}>
        אפשר לשלוח את השאלה כמו שהיא. נשתדל להוסיף עליה תשובה.
      </Txt>
      <Glass style={{ marginTop: 18, borderRadius: 20, padding: 16, alignSelf: 'stretch' }}>
        {sent ? (
          <View style={{ alignItems: 'center', gap: 8, paddingVertical: 8 }} accessibilityLiveRegion="polite">
            <Icon name="check" size={22} color={c.acc} />
            <Txt w="500" size={15} align="center">
              השאלה נשמרה
            </Txt>
            <Txt w="300" size={13.5} color={c.ink3} align="center">
              תודה. נעדכן כשתהיה תשובה.
            </Txt>
          </View>
        ) : (
          <>
            <Txt w="500" size={12} ls={0.4} color={c.acc} align="center">
              השאלה שלך
            </Txt>
            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              accessibilityLabel="נוסח השאלה לשליחה"
              placeholder="נסח את השאלה במילים שלך"
              placeholderTextColor={c.ink2}
              style={{
                marginTop: 10,
                minHeight: 96,
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: c.divider,
                fontFamily: theme.fonts.body400,
                fontSize: 15 * textScale,
                lineHeight: 22 * textScale,
                color: c.ink,
                textAlign: 'right',
                writingDirection: 'rtl',
                textAlignVertical: 'top',
              }}
            />
            <View style={{ marginTop: 4 }}>
              <TextLink
                label="שליחת השאלה"
                onPress={async () => {
                  if (!text.trim()) return;
                  await submitQuestion(text.trim());
                  setSent(true);
                }}
              />
            </View>
          </>
        )}
      </Glass>
    </View>
  );
}
