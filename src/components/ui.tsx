import { useId, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from 'react-native-svg';

import { useAppState, useTheme } from '@/state/app-state';
import { rgba, type Theme } from '@/theme/themes';

import { Icon, type IconName } from './icon';

export const GUTTER = 22;
export const TAB_BAR_SPACE = 96;

/* ---------- text ---------- */

type Weight = '300' | '400' | '500' | 'disp';
type TxtProps = {
  children: ReactNode;
  w?: Weight;
  size: number;
  color?: string;
  /** line height as a multiple of size */
  lh?: number;
  ls?: number;
  align?: TextStyle['textAlign'];
  /** apply the user's text-size setting */
  scaled?: boolean;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  accessibilityRole?: 'header' | 'text' | 'link';
  selectable?: boolean;
};

export function Txt({ children, w = '400', size, color, lh, ls, align, scaled, numberOfLines, style, accessibilityRole, selectable }: TxtProps) {
  const { theme, textScale } = useAppState();
  const s = scaled ? size * textScale : size;
  const family = w === 'disp' ? theme.fonts.disp : theme.fonts[`body${w}`];
  return (
    <Text
      numberOfLines={numberOfLines}
      accessibilityRole={accessibilityRole}
      selectable={selectable}
      maxFontSizeMultiplier={2}
      style={[
        {
          fontFamily: family,
          fontSize: s,
          color: color ?? theme.colors.ink,
          lineHeight: lh ? Math.round(s * lh) : undefined,
          letterSpacing: ls,
          textAlign: align,
          writingDirection: 'rtl',
        },
        style,
      ]}>
      {children}
    </Text>
  );
}

/* ---------- backdrop: four blurred colour blobs (CSS blur(70px) approximated with radial gradients) ---------- */

export function Backdrop() {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  // [cx, cy, w, h] from the design's .b1-.b4 boxes (390-wide frame), anchored to the matching edges.
  const boxes: [number, number, number, number][] = [
    [-120 + 160, -110 + 150, 320, 300],
    [width + 170 - 150, 260 + 150, 300, 300],
    [-120 + 150, height - 60 - 130, 300, 260],
    [width + 40 - 130, height + 60 - 100, 260, 200],
  ];
  const SIG = 70;
  // Gradient ids must be unique per instance: stacked screens keep their (hidden) SVGs in the document.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.bg }]} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          {boxes.map(([, , w, h], i) => {
            const R = w / 2 + 2 * SIG;
            const [c, o] = theme.blobs[i];
            return (
              <RadialGradient key={i} id={`${uid}b${i}`} cx="50%" cy="50%" r="50%">
                <Stop offset={0} stopColor={c} stopOpacity={o * 0.95} />
                <Stop offset={(w / 2 - SIG) / R} stopColor={c} stopOpacity={o * 0.8} />
                <Stop offset={(w / 2) / R} stopColor={c} stopOpacity={o * 0.5} />
                <Stop offset={(w / 2 + SIG) / R} stopColor={c} stopOpacity={o * 0.16} />
                <Stop offset={1} stopColor={c} stopOpacity={0} />
              </RadialGradient>
            );
          })}
        </Defs>
        {boxes.map(([cx, cy, w, h], i) => (
          <Ellipse key={i} cx={cx} cy={cy} rx={w / 2 + 2 * SIG} ry={h / 2 + 2 * SIG} fill={`url(#${uid}b${i})`} />
        ))}
      </Svg>
    </View>
  );
}

/* ---------- glass surface ---------- */

export function glassStyle(theme: Theme): ViewStyle {
  const c = theme.colors;
  const gradient = `linear-gradient(160deg, ${c.gA}, ${c.gB})`;
  return {
    borderWidth: 1,
    borderColor: c.gBorder,
    boxShadow: `0 10px 30px ${c.shadow}, inset 0 1px 0 ${c.gInset}`,
    ...(Platform.OS === 'web'
      ? ({ backgroundImage: gradient, backdropFilter: 'blur(24px) saturate(1.2)', WebkitBackdropFilter: 'blur(24px) saturate(1.2)' } as object)
      : ({ experimental_backgroundImage: gradient } as object)),
  };
}

export function Glass({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return <View style={[glassStyle(theme), style]}>{children}</View>;
}

/** The gold double frame: a 1px metal border with a faint second rule 2px outside it. */
export function frameStyle(theme: Theme, radius = 4): ViewStyle {
  return {
    borderWidth: 1,
    borderColor: theme.colors.metal,
    borderRadius: radius,
    outlineWidth: 1,
    outlineStyle: 'solid',
    outlineColor: rgba(theme.colors.metal, 0.3),
    outlineOffset: 2,
  };
}

/* ---------- ornaments ---------- */

const ORN_HALF = [
  'M104 9h3',
  'M110 9c3-6 11-6 11-1 0 3-4 3.6-4.6 1.2',
  'M116 11.2c3.5 4.2 10.5 4.2 13.5 0',
  'M121 8.4c9 .8 16-3.4 26-1.4 9 1.8 17 2.6 30 2',
  'M177 9c4 0 8-.6 12-1.6',
  'M135 6.2c2-3 6-3.6 8-1.6',
  'M135 11.4c2 3 6 3.6 8 1.6',
];

/** Victorian rule under the wordmark (200×18 in the design). */
export function Ornament({ width = 200 }: { width?: number }) {
  const theme = useTheme();
  const orn = theme.colors.orn;
  const half = (
    <>
      {ORN_HALF.map((d) => (
        <Path key={d} d={d} />
      ))}
      <Circle cx={191.5} cy={7} r={1.1} fill={orn} stroke="none" />
    </>
  );
  return (
    <Svg width={width} height={(width * 18) / 200} viewBox="0 0 200 18" style={{ alignSelf: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <G fill="none" stroke={orn} strokeWidth={0.9} strokeLinecap="round">
        <Path d="M100 3.2l4.2 5.8-4.2 5.8-4.2-5.8z" fill={orn} stroke="none" />
        <Circle cx={100} cy={9} r={1.2} fill={theme.colors.bg} stroke="none" />
        {half}
        <G transform="translate(200 0) scale(-1 1)">{half}</G>
      </G>
    </Svg>
  );
}

/** Small framed ב״ה, always at the top-right corner of a screen. */
export function BH() {
  const theme = useTheme();
  return (
    <View
      accessible
      accessibilityLabel="בעזרת השם"
      style={[frameStyle(theme, 2), { position: 'absolute', start: 0, top: 0, paddingHorizontal: 6, paddingTop: 4, paddingBottom: 3 }]}>
      <Txt w="disp" size={11} color={theme.colors.metalText} lh={1.1}>
        ב״ה
      </Txt>
    </View>
  );
}

/* ---------- controls ---------- */

type BtnProps = Omit<PressableProps, 'style' | 'children'> & { style?: StyleProp<ViewStyle>; children?: ReactNode; label: string };

/** Pressable with a 44pt minimum touch target, button role and label. */
export function Btn({ style, children, label, hitSlop, ...rest }: BtnProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={hitSlop ?? 8}
      style={({ pressed }) => [style, pressed && { opacity: 0.6 }]}
      {...rest}>
      {children}
    </Pressable>
  );
}

/** Round 32px control in the avatar slot of the design (touch area 44+). */
export function CircleBtn({ icon, label, onPress, active }: { icon: IconName; label: string; onPress: () => void; active?: boolean }) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <Btn label={label} onPress={onPress} hitSlop={10} accessibilityState={active === undefined ? undefined : { selected: active }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: rgba(c.acc, 0.35),
          backgroundColor: c.avBg,
        }}>
        <Icon name={icon} size={17} color={c.acc} strokeWidth={1.6} />
      </View>
    </Btn>
  );
}

/** Text-link CTA: label + left arrow (forward in RTL). */
export function TextLink({ label, onPress, icon = 'arrow', size = 13.5 }: { label: string; onPress: () => void; icon?: IconName; size?: number }) {
  const theme = useTheme();
  return (
    <Btn label={label} onPress={onPress} accessibilityRole="link" style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Txt w="500" size={size} color={theme.colors.acc}>
          {label}
        </Txt>
        <Icon name={icon} size={15} color={theme.colors.acc} strokeWidth={1.7} />
      </View>
    </Btn>
  );
}

export function Tag({ label }: { label: string }) {
  const c = useTheme().colors;
  return (
    <View style={{ backgroundColor: c.tagBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Txt size={11.5} color={c.tagFg}>
        {label}
      </Txt>
    </View>
  );
}

/** Centered section heading with an optional "all" link pinned to the left edge. */
export function SectionHeader({ title, action }: { title: string; action?: { label: string; onPress: () => void } }) {
  const c = useTheme().colors;
  return (
    <View style={{ marginTop: 28, marginBottom: 12, marginHorizontal: 2, alignItems: 'center', justifyContent: 'center', minHeight: 22 }}>
      <Txt w="500" size={15} ls={0.1} accessibilityRole="header">
        {title}
      </Txt>
      {action && (
        <Btn label={action.label} onPress={action.onPress} style={{ position: 'absolute', end: 0, bottom: -11, minHeight: 44, justifyContent: 'center' }}>
          <Txt size={12.5} color={c.ink2}>
            {action.label}
          </Txt>
        </Btn>
      )}
    </View>
  );
}

/* ---------- screen scaffolding ---------- */

export function Screen({ children, scroll = true, tabBar = true }: { children: ReactNode; scroll?: boolean; tabBar?: boolean }) {
  const insets = useSafeAreaInsets();
  const pad = {
    paddingTop: Math.max(insets.top, 40) + 8,
    paddingHorizontal: GUTTER,
    paddingBottom: (tabBar ? TAB_BAR_SPACE : 32) + insets.bottom,
  };
  return (
    <View style={{ flex: 1 }}>
      <Backdrop />
      {scroll ? (
        <ScrollView
          contentContainerStyle={[pad, { maxWidth: 560, width: '100%', alignSelf: 'center' }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[pad, { flex: 1, maxWidth: 560, width: '100%', alignSelf: 'center' }]}>{children}</View>
      )}
    </View>
  );
}

/**
 * Header for inner screens: ב״ה top-right, then a row with the back control on the right (RTL),
 * the title centered in the display face, and an optional action on the left.
 */
export function ScreenHeader({ title, onBack, action, ornament = true }: { title?: string; onBack?: () => void; action?: ReactNode; ornament?: boolean }) {
  return (
    <View style={{ paddingTop: 30 }}>
      <BH />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
        <View style={{ width: 44, alignItems: 'flex-start' }}>{onBack && <CircleBtn icon="chevBack" label="חזרה" onPress={onBack} />}</View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          {title ? (
            <Txt w="disp" size={24} lh={1.3} accessibilityRole="header" align="center">
              {title}
            </Txt>
          ) : null}
        </View>
        <View style={{ width: 44, alignItems: 'flex-end' }}>{action}</View>
      </View>
      {ornament && (
        <View style={{ marginTop: 4 }}>
          <Ornament width={150} />
        </View>
      )}
    </View>
  );
}
