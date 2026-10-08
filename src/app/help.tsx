import { router } from 'expo-router';
import { Linking, View } from 'react-native';

import { Icon } from '@/components/icon';
import { Btn, Glass, Screen, ScreenHeader, Txt } from '@/components/ui';
import { S } from '@/constants/strings';
import { HELP_LINES, type HelpLine } from '@/data/help-lines';
import { useTheme } from '@/state/app-state';

/** "קווי סיוע": help lines on their own screen (Home, Topics, Settings and a link from "קשה לי עכשיו"). */
export default function HelpScreen() {
  const c = useTheme().colors;
  return (
    <Screen tabBar={false}>
      <ScreenHeader title={S.help.title} onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      <Glass style={{ marginTop: 18, borderRadius: 20, paddingTop: 16, paddingHorizontal: 16, paddingBottom: 12 }}>
        <Txt w="500" size={15} align="center" accessibilityRole="header">
          {S.help.intro}
        </Txt>
        <View style={{ marginTop: 8 }}>
          {HELP_LINES.map((l, i) => (
            <LineRow key={l.key} line={l} first={i === 0} />
          ))}
        </View>
        <Txt w="300" size={12.5} lh={1.5} color={c.ink2} align="center" style={{ marginTop: 8 }}>
          {S.help.note}
        </Txt>
      </Glass>
    </Screen>
  );
}

function LineRow({ line, first }: { line: HelpLine; first: boolean }) {
  const c = useTheme().colors;
  const t = S.help.lines[line.key];
  const isCall = line.url.startsWith('tel:');
  return (
    <Btn
      label={isCall ? S.help.callA11y(t.name, line.number) : S.help.chatA11y(t.name)}
      accessibilityRole="link"
      onPress={() => Linking.openURL(line.url).catch(() => {})}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54, paddingVertical: 6, borderTopWidth: first ? 0 : 1, borderTopColor: c.divider }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt w="500" size={15}>
          {t.name}
        </Txt>
        <Txt w="300" size={12.5} lh={1.45} color={c.ink2}>
          {t.desc}
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Txt w="500" size={17} color={c.acc} style={{ fontVariant: ['tabular-nums'] }}>
          {isCall ? line.number : S.help.chat}
        </Txt>
        <Icon name={isCall ? 'phone' : 'chat'} size={18} color={c.acc} />
      </View>
    </Btn>
  );
}
