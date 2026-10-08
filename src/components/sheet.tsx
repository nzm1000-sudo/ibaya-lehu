import { type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { S } from '@/constants/strings';
import { useTheme } from '@/state/app-state';
import { rgba } from '@/theme/themes';

import { barGlassStyle, CircleBtn, Ornament, Txt } from './ui';

/** Bottom sheet in the bar-glass language: dimmed backdrop, title with ornament, close control. */
export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const theme = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={S.common.close}
          onPress={onClose}
          style={{ position: 'absolute', top: 0, bottom: 0, start: 0, end: 0, backgroundColor: rgba(theme.scheme === 'dark' ? '#000000' : c.ink, 0.28) }}
        />
        <View
          accessibilityViewIsModal
          style={[
            barGlassStyle(theme),
            {
              width: '100%',
              maxWidth: 560,
              alignSelf: 'center',
              maxHeight: '85%',
              borderTopLeftRadius: 26,
              borderTopRightRadius: 26,
              borderBottomWidth: 0,
              backgroundColor: c.bg,
              paddingTop: 10,
              paddingBottom: 16 + insets.bottom,
            },
          ]}>
          <View style={{ alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: c.divider }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 6, minHeight: 44 }}>
            <View style={{ width: 44 }} />
            <Txt w="disp" size={20} lh={1.3} align="center" accessibilityRole="header" style={{ flex: 1 }}>
              {title}
            </Txt>
            <View style={{ width: 44, alignItems: 'flex-end' }}>
              <CircleBtn icon="close" label={S.common.close} onPress={onClose} />
            </View>
          </View>
          <Ornament width={120} />
          <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 12 }} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
