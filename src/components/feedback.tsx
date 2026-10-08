import { useMemo, type ReactNode } from 'react';
import { View } from 'react-native';

import { S } from '@/constants/strings';
import { type QA } from '@/data/qa';
import { related } from '@/data/search';
import { useAppState, useTheme, type FeedbackReason } from '@/state/app-state';

import { Icon, type IconName } from './icon';
import { QuestionList } from './question-list';
import { Btn, frameStyle, Txt } from './ui';

const REASONS: FeedbackReason[] = ['different', 'tried', 'unclear', 'other'];

/** "זה עזר?": helped / not for me; "not for me" asks why, then offers the caveats and two related answers. */
export function FeedbackRow({ q, notWhen }: { q: QA; notWhen: ReactNode }) {
  const theme = useTheme();
  const c = theme.colors;
  const { feedback, setFeedback } = useAppState();
  const f = feedback[q.id];
  const nearby = useMemo(() => (f && !f.helped && f.reason ? related(q) : []), [f, q]);

  return (
    <View style={{ marginTop: 28, alignItems: 'center' }}>
      <Txt w="500" size={14} color={c.ink2} accessibilityRole="header">
        {S.feedback.ask}
      </Txt>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <Choice icon="check" label={S.feedback.helped} on={f?.helped === true} onPress={() => setFeedback(q.id, { helped: true })} />
        <Choice icon="close" label={S.feedback.notForMe} on={f?.helped === false} onPress={() => setFeedback(q.id, { helped: false })} />
      </View>

      {f?.helped ? (
        <Txt w="300" size={13.5} color={c.ink3} align="center" style={{ marginTop: 12 }} accessibilityRole="text">
          {S.feedback.thanks}
        </Txt>
      ) : null}

      {f && !f.helped ? (
        <View style={{ alignSelf: 'stretch', marginTop: 16 }} accessibilityLiveRegion="polite">
          <Txt w="500" size={13} ls={0.3} color={c.acc} align="center">
            {S.feedback.why}
          </Txt>
          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 8 }}>
            {REASONS.map((r) => {
              const on = f.reason === r;
              return (
                <Btn
                  key={r}
                  label={S.feedback.reasons[r]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => setFeedback(q.id, { helped: false, reason: r })}
                  style={[
                    frameStyle(theme, 4),
                    { margin: 3, height: 34, paddingHorizontal: 12, justifyContent: 'center', backgroundColor: on ? c.tagBg : c.pillBg },
                    !on && { borderColor: c.divider, outlineColor: 'transparent' },
                  ]}>
                  <Txt size={13.5} w={on ? '500' : '400'}>
                    {S.feedback.reasons[r]}
                  </Txt>
                </Btn>
              );
            })}
          </View>
          {f.reason ? (
            <>
              {notWhen}
              {nearby.length ? (
                <>
                  <Txt w="300" size={13.5} color={c.ink3} align="center" style={{ marginTop: 18, marginBottom: 10 }}>
                    {S.feedback.noted}
                  </Txt>
                  <QuestionList items={nearby} excerpt showTopic={false} />
                </>
              ) : null}
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function Choice({ icon, label, on, onPress }: { icon: IconName; label: string; on: boolean; onPress: () => void }) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <Btn
      label={label}
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={{
        minHeight: 40,
        paddingHorizontal: 16,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: on ? c.acc : c.divider,
        backgroundColor: on ? c.tagBg : c.pillBg,
      }}>
      <Icon name={icon} size={15} color={on ? c.acc : c.ink2} />
      <Txt size={14} w={on ? '500' : '400'} color={on ? c.ink : c.ink2}>
        {label}
      </Txt>
    </Btn>
  );
}
