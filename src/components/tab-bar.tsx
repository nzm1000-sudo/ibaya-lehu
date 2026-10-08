import { type BottomTabBarProps } from 'expo-router/js-tabs';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/state/app-state';

import { Icon, type IconName } from './icon';
import { Btn, glassStyle, Txt } from './ui';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'בית', icon: 'home' },
  topics: { label: 'נושאים', icon: 'grid' },
  saved: { label: 'שמורים', icon: 'bookmark' },
};

/** Slim floating glass pill with three tabs (בית / נושאים / שמורים); first tab sits on the right (RTL). */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={[
        glassStyle(theme),
        {
          position: 'absolute',
          bottom: 20 + insets.bottom,
          alignSelf: 'center',
          width: 250,
          height: 52,
          borderRadius: 26,
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
        },
      ]}>
      {state.routes.map((route, i) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === i;
        const color = focused ? c.acc : c.ink2;
        return (
          <Btn
            key={route.key}
            label={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            onPress={() => {
              const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
            }}
            hitSlop={4}
            style={{ width: 64, height: 52, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <Icon name={tab.icon} size={19} color={color} strokeWidth={1.6} />
            <Txt size={10.5} w={focused ? '500' : '400'} color={color}>
              {tab.label}
            </Txt>
            {focused && <View style={{ position: 'absolute', bottom: 3, width: 16, height: 2, borderRadius: 2, backgroundColor: c.acc }} />}
          </Btn>
        );
      })}
    </View>
  );
}
