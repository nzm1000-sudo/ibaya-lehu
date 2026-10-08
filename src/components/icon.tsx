import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

/** Line icons from the approved design (24×24, round caps), plus a few in the same hand for new screens. */
export type IconName =
  | 'search' | 'mic' | 'home' | 'grid' | 'bookmark' | 'bookmarkFilled' | 'chevBack' | 'chevForward'
  | 'arrow' | 'heart' | 'kids' | 'coin' | 'leaf' | 'fork' | 'star' | 'briefcase' | 'rings' | 'mirror'
  | 'fence' | 'houses' | 'wave' | 'candle' | 'dots' | 'house' | 'share' | 'speaker' | 'stop'
  | 'gear' | 'check' | 'close' | 'send' | 'textSmaller' | 'textLarger' | 'phone' | 'chat';

type Props = { name: IconName; size?: number; color: string; strokeWidth?: number };

export function Icon({ name, size = 20, color, strokeWidth = 1.6 }: Props) {
  const p = { stroke: color, strokeWidth, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {render(name, p, color)}
    </Svg>
  );
}

function render(name: IconName, p: Record<string, unknown>, color: string) {
  switch (name) {
    case 'search':
      return (<><Circle cx={11} cy={11} r={6.5} {...p} /><Path d="M16 16l4 4" {...p} /></>);
    case 'mic':
      return (<><Rect x={9} y={3.5} width={6} height={11} rx={3} {...p} /><Path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" {...p} /></>);
    case 'home':
      return <Path d="M4 10.5L12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" {...p} />;
    case 'grid':
      return (<><Rect x={4} y={4} width={6.5} height={6.5} rx={2} {...p} /><Rect x={13.5} y={4} width={6.5} height={6.5} rx={2} {...p} /><Rect x={4} y={13.5} width={6.5} height={6.5} rx={2} {...p} /><Rect x={13.5} y={13.5} width={6.5} height={6.5} rx={2} {...p} /></>);
    case 'bookmark':
      return <Path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z" {...p} />;
    case 'bookmarkFilled':
      return <Path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z" {...p} fill={color} />;
    // RTL: "back" points right, "forward" points left.
    case 'chevBack':
      return <Path d="M9.5 6l6 6-6 6" {...p} />;
    case 'chevForward':
      return <Path d="M14.5 6l-6 6 6 6" {...p} />;
    case 'arrow':
      return <Path d="M19 12H6M11 7l-5 5 5 5" {...p} />;
    case 'heart':
      return <Path d="M12 19s-6.5-4-8.2-8.2A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 8.2 2.8C18.5 15 12 19 12 19z" {...p} />;
    case 'kids':
      return (<><Circle cx={9} cy={8} r={3} {...p} /><Circle cx={16.5} cy={10} r={2.3} {...p} /><Path d="M3.5 19a5.5 5.5 0 0 1 11 0M14 19a4 4 0 0 1 7 -2.6" {...p} /></>);
    case 'coin':
      return (<><Ellipse cx={12} cy={7} rx={7} ry={3} {...p} /><Path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" {...p} /></>);
    case 'leaf':
      return <Path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14zM5 19l8-8" {...p} />;
    case 'fork':
      return <Path d="M12 20v-7M12 13 6 7M12 13l6-6M6 7V4M6 7H3M18 7V4M18 7h3" {...p} />;
    case 'star':
      return <Path d="M12 4l2.2 5 5.3.4-4 3.5 1.3 5.2L12 15.4 7.2 18.1l1.3-5.2-4-3.5 5.3-.4z" {...p} />;
    case 'briefcase':
      return (<><Rect x={3.5} y={7.5} width={17} height={11.5} rx={2} {...p} /><Path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3.5 12.5h17" {...p} /></>);
    case 'rings':
      return (<><Circle cx={9.5} cy={14} r={5} {...p} /><Circle cx={14.5} cy={14} r={5} {...p} /><Path d="M10.5 5.5 12 4l1.5 1.5L12 7z" {...p} /></>);
    case 'mirror':
      return (<><Ellipse cx={12} cy={10} rx={5.5} ry={6.5} {...p} /><Path d="M12 16.5V20M9 20h6M10 7.5c.6-.8 1.3-1.2 2.2-1.3" {...p} /></>);
    case 'fence':
      return <Path d="M6 20V7l1.5-2L9 7v13M15 20V7l1.5-2L18 7v13M6 10h12M6 16h12" {...p} />;
    case 'houses':
      return <Path d="M3 12l5-4.5 5 4.5v7.5H3zM13 10.5l4-3.5 4 3.5v9h-8M6.5 19.5v-3.5h3v3.5" {...p} />;
    case 'wave':
      return <Path d="M3 9c2.5-2.5 4.5-2.5 7 0s4.5 2.5 7 0 3-2 4-1.5M3 15c2.5-2.5 4.5-2.5 7 0s4.5 2.5 7 0 3-2 4-1.5" {...p} />;
    case 'candle':
      return <Path d="M9.5 20.5h5V11h-5zM12 11V9M12 9c-1.6-1.4-1.6-3 0-5 1.6 2 1.6 3.6 0 5zM7.5 20.5h9" {...p} />;
    case 'dots':
      return (<><Circle cx={6} cy={12} r={1.2} {...p} /><Circle cx={12} cy={12} r={1.2} {...p} /><Circle cx={18} cy={12} r={1.2} {...p} /></>);
    case 'house':
      return <Path d="M4 11 12 4.5l8 6.5M6 9.5V20h12V9.5M10 20v-5h4v5" {...p} />;
    case 'share':
      return <Path d="M12 15V4M8 8l4-4 4 4M6 11H5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-1" {...p} />;
    case 'speaker':
      return <Path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" {...p} />;
    case 'stop':
      return <Rect x={6.5} y={6.5} width={11} height={11} rx={2} {...p} />;
    case 'gear':
      return (<><Path d="M4 7h9M17 7h3M4 17h3M11 17h9" {...p} /><Circle cx={15} cy={7} r={2} {...p} /><Circle cx={9} cy={17} r={2} {...p} /></>);
    case 'check':
      return <Path d="M5 12.5l4.5 4.5L19 7.5" {...p} />;
    case 'close':
      return <Path d="M6.5 6.5l11 11M17.5 6.5l-11 11" {...p} />;
    case 'send':
      return <Path d="M20 4 3.5 11l6.5 2.5L12.5 20zM20 4l-10 9.5" {...p} />;
    case 'textSmaller':
      return <Path d="M4 18l4.5-11L13 18M5.6 14h5.8M15.5 12.5h5" {...p} />;
    case 'phone':
      return <Path d="M6.5 4h3l1.5 4-2 1.3a10 10 0 0 0 5.7 5.7l1.3-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 5 5.6 1.5 1.5 0 0 1 6.5 4z" {...p} />;
    case 'chat':
      return <Path d="M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-8l-4.5 3.5V16H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM8 9.5h8M8 12.5h5" {...p} />;
    case 'textLarger':
      return <Path d="M4 18l4.5-11L13 18M5.6 14h5.8M15.5 12.5h5M18 10v5" {...p} />;
  }
}

const TOPIC_ICONS: Record<string, IconName> = {
  זוגיות: 'heart',
  הורות: 'kids',
  כסף: 'coin',
  פרנסה: 'coin',
  בריאות: 'leaf',
  החלטות: 'fork',
  אמונה: 'star',
  'עבודה ועסקים': 'briefcase',
  היכרויות: 'rings',
  'דימוי עצמי': 'mirror',
  גבולות: 'fence',
  'משפחה מורחבת': 'houses',
  משפחה: 'house',
  'פחד וחרדה': 'wave',
  'אבל ומשבר': 'candle',
  אחר: 'dots',
};

export function topicIcon(topic: string): IconName {
  return TOPIC_ICONS[topic] ?? 'dots';
}
