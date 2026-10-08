import { router } from 'expo-router';
import { View } from 'react-native';

import { Icon } from '@/components/icon';
import { Btn, frameStyle, Txt } from '@/components/ui';
import { S } from '@/constants/strings';
import { useTheme } from '@/state/app-state';

/** A card that opens "קווי סיוע" (Topics and Settings). */
export function HelpEntryCard({ style }: { style?: object }) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <Btn label={`${S.help.entry}. ${S.help.entryDesc}`} accessibilityHint={S.help.entryHint} onPress={() => router.push('/help')} style={style}>
      <View style={[frameStyle(theme, 14), { marginHorizontal: 3, paddingHorizontal: 14, minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.pillBg }]}>
        <Icon name="phone" size={20} color={c.metalIcon} />
        <View style={{ flex: 1 }}>
          <Txt w="500" size={15.5}>
            {S.help.entry}
          </Txt>
          <Txt w="300" size={12.5} color={c.ink2}>
            {S.help.entryDesc}
          </Txt>
        </View>
        <Icon name="chevForward" size={16} color={c.ink2} />
      </View>
    </Btn>
  );
}
