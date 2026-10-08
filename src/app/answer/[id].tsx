import { router, useLocalSearchParams } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { barGlassStyle, BrandHeader, Btn, Glass, Screen, Tag, Txt, frameStyle } from '@/components/ui';
import { getQA, readingMinutes, similarBucket, type QA } from '@/data/qa';
import { TEXT_SCALE_MAX, TEXT_SCALE_MIN, useAppState, useTheme } from '@/state/app-state';
import { S } from '@/constants/strings';

export default function AnswerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = getQA(id);
  const c = useTheme().colors;
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!q) {
    return (
      <Screen tabBar={false}>
        <BrandHeader onBack={back} />
        <Txt size={15} color={c.ink3} align="center" style={{ marginTop: 40 }}>
          {S.answer.notFound}
        </Txt>
      </Screen>
    );
  }
  return <Answer q={q} onBack={back} />;
}

function Answer({ q, onBack }: { q: QA; onBack: () => void }) {
  const theme = useTheme();
  const c = theme.colors;
  const { isSaved, toggleSaved, readAloud, textScale, bumpTextScale } = useAppState();
  const saved = isSaved(q.id);
  const insets = useSafeAreaInsets();
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => void Speech.stop(), []);

  const speak = async () => {
    if (speaking) {
      await Speech.stop();
      setSpeaking(false);
      return;
    }
    let voice: string | undefined;
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      voice = voices.find((v) => v.language?.toLowerCase().startsWith('he'))?.identifier;
    } catch {}
    const parts = [q.question, q.answer, q.applies_when && `${S.answer.appliesWhen}: ${q.applies_when}`, q.not_when && `${S.answer.notWhen}: ${q.not_when}`];
    setSpeaking(true);
    Speech.speak(parts.filter(Boolean).join('. '), {
      language: 'he-IL',
      voice,
      rate: 0.95,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const share = async () => {
    try {
      await Share.share(
        { title: S.share.title, message: `${q.question}\n\n${q.answer}\n\n${S.common.appName}` },
        { dialogTitle: S.share.title, subject: q.question },
      );
    } catch {}
  };

  const minutes = readingMinutes(q);
  const similar = similarBucket(q.id);

  return (
    <View style={{ flex: 1 }}>
      <Screen tabBar>
        <BrandHeader onBack={onBack} />

        <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 6, marginTop: 18 }}>
          {q.topics.map((t) => (
            <Btn key={t} label={S.common.topicA11y(t)} onPress={() => router.push({ pathname: '/topic/[name]', params: { name: t } })} hitSlop={12}>
              <Tag label={t} />
            </Btn>
          ))}
        </View>

        <Txt w="500" size={21} lh={1.4} ls={-0.2} scaled align="center" accessibilityRole="header" style={{ marginTop: 14 }} selectable>
          {q.question}
        </Txt>
        <Txt size={12} color={c.ink2} align="center" style={{ marginTop: 8 }}>
          {S.common.readingTime(minutes)}
        </Txt>
        {similar ? (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <Icon name="kids" size={14} color={c.metalIcon} />
            <Txt w="300" size={13} color={c.ink2}>
              {S.answer.notAlone[similar]}
            </Txt>
          </View>
        ) : null}

        <Glass style={{ marginTop: 18, borderRadius: 20, paddingVertical: 20, paddingHorizontal: 20 }}>
          <Txt w="400" size={16} lh={1.75} scaled color={c.ink3} selectable>
            {q.answer}
          </Txt>
        </Glass>

        {q.applies_when ? <FitBox title={S.answer.appliesWhen} body={q.applies_when} icon="check" /> : null}
        {q.not_when ? <FitBox title={S.answer.notWhen} body={q.not_when} icon="close" /> : null}
      </Screen>

      {/* action bar in the tab-bar language: save, share, A-, A+, read aloud */}
      <View
        accessibilityRole="toolbar"
        style={[
          barGlassStyle(theme),
          {
            position: 'absolute',
            bottom: 20 + insets.bottom,
            alignSelf: 'center',
            height: 52,
            borderRadius: 26,
            paddingHorizontal: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 2,
          },
        ]}>
        <BarBtn icon={saved ? 'bookmarkFilled' : 'bookmark'} label={saved ? S.answer.toolbarSaved : S.answer.toolbarSave} a11y={saved ? S.answer.unsaveA11y : S.answer.saveA11y} on={saved} onPress={() => toggleSaved(q.id)} />
        <BarBtn icon="share" label={S.answer.share} a11y={S.answer.shareA11y} onPress={share} />
        <BarBtn icon="textSmaller" label={S.answer.smaller} a11y={S.answer.smallerA11y} disabled={textScale <= TEXT_SCALE_MIN} onPress={() => bumpTextScale(-1)} />
        <BarBtn icon="textLarger" label={S.answer.larger} a11y={S.answer.largerA11y} disabled={textScale >= TEXT_SCALE_MAX} onPress={() => bumpTextScale(1)} />
        {readAloud && <BarBtn icon={speaking ? 'stop' : 'speaker'} label={speaking ? S.answer.stop : S.answer.read} a11y={speaking ? S.answer.stopA11y : S.answer.readA11y} on={speaking} onPress={speak} />}
      </View>
    </View>
  );
}

function BarBtn({ icon, label, a11y, onPress, on, disabled }: { icon: IconName; label: string; a11y: string; onPress: () => void; on?: boolean; disabled?: boolean }) {
  const c = useTheme().colors;
  const color = on ? c.acc : c.ink2;
  return (
    <Btn
      label={a11y}
      onPress={onPress}
      disabled={disabled}
      accessibilityState={{ disabled, selected: on }}
      hitSlop={2}
      style={{ width: 54, height: 50, alignItems: 'center', justifyContent: 'center', gap: 2, opacity: disabled ? 0.4 : 1 }}>
      <Icon name={icon} size={19} color={color} />
      <Txt size={10.5} w={on ? '500' : '400'} color={color}>
        {label}
      </Txt>
    </Btn>
  );
}

function FitBox({ title, body, icon }: { title: string; body: string; icon: IconName }) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <View style={[frameStyle(theme, 6), { marginTop: 22, marginHorizontal: 3, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: c.pillBg }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Icon name={icon} size={15} color={c.metalIcon} />
        <Txt w="500" size={13} ls={0.3} color={c.acc} accessibilityRole="header">
          {title}
        </Txt>
      </View>
      <Txt w="300" size={14.5} lh={1.6} scaled color={c.ink3} style={{ marginTop: 6 }} selectable>
        {body}
      </Txt>
    </View>
  );
}
