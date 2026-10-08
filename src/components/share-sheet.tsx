import { useState } from 'react';
import { Platform, Share, View } from 'react-native';

import { S } from '@/constants/strings';
import { type QA } from '@/data/qa';
import { useTheme } from '@/state/app-state';

import { Icon } from './icon';
import { Sheet } from './sheet';
import { Btn, frameStyle, TextLink, Txt } from './ui';

/** The answer's opening sentences, cut at a sentence end near `max` characters. */
export function excerpt(text: string, max = 280): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('? '), cut.lastIndexOf('! '));
  return end > max * 0.5 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, '') + '…';
}

export function shareText(opener: string, q: QA): string {
  // TODO(web link): append a clean link to the answer once the public site exists. The link must carry
  // no sender id and no search string.
  return `${opener}\n\n${q.question}\n\n${excerpt(q.answer)}\n\n${S.common.appName}`;
}

/** "שלחו בעדינות": pick a pre-written neutral opener, then share opener + question + excerpt. */
export function ShareSheet({ q, visible, onClose }: { q: QA; visible: boolean; onClose: () => void }) {
  const theme = useTheme();
  const c = theme.colors;
  const [pick, setPick] = useState(0);
  const [copied, setCopied] = useState(false);
  const opener = S.share.openers[pick];

  const send = async () => {
    const message = shareText(opener, q);
    try {
      await Share.share({ title: S.share.title, message }, { dialogTitle: S.share.title, subject: q.question });
      onClose();
    } catch {
      // Web without the Web Share API: copy instead.
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(message);
          setCopied(true);
        } catch {}
      }
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={S.share.title}>
      <Txt w="300" size={13.5} lh={1.5} color={c.ink2} align="center">
        {S.share.intro}
      </Txt>
      <View accessibilityRole="radiogroup" style={{ marginTop: 12, gap: 8 }}>
        {S.share.openers.map((o, i) => {
          const on = i === pick;
          return (
            <Btn
              key={o}
              label={o}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => {
                setPick(i);
                setCopied(false);
              }}
              style={[
                frameStyle(theme, 6),
                { marginHorizontal: 3, minHeight: 48, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: on ? c.tagBg : c.pillBg },
                !on && { borderColor: c.divider, outlineColor: 'transparent' },
              ]}>
              <Txt size={15} style={{ flex: 1 }}>
                {o}
              </Txt>
              {on && <Icon name="check" size={17} color={c.acc} />}
            </Btn>
          );
        })}
      </View>

      <Txt w="500" size={12} ls={0.4} color={c.acc} align="center" style={{ marginTop: 18 }}>
        {S.share.preview}
      </Txt>
      <View style={{ marginTop: 8, borderRadius: 14, borderWidth: 1, borderColor: c.divider, padding: 14 }}>
        <Txt w="500" size={14} lh={1.5}>
          {opener}
        </Txt>
        <Txt size={14} lh={1.5} style={{ marginTop: 8 }}>
          {q.question}
        </Txt>
        <Txt w="300" size={13.5} lh={1.55} color={c.ink3} style={{ marginTop: 6 }} numberOfLines={4}>
          {excerpt(q.answer)}
        </Txt>
      </View>

      {copied ? (
        <Txt size={13} color={c.acc} align="center" style={{ marginTop: 14 }} accessibilityRole="text">
          {S.share.copied}
        </Txt>
      ) : null}
      <View style={{ marginTop: 6 }}>
        <TextLink label={S.share.send} icon="send" onPress={send} size={15} />
      </View>
    </Sheet>
  );
}
