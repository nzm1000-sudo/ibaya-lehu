import { S } from '@/constants/strings';

/**
 * Design tokens for the 7 selectable themes.
 * Source of truth: design/p10/p10-build.py + design/rose/palettes/palettes.md (approved by the user).
 * Theme ids follow the palette numbers: 04 = default light, 07 = default dark.
 */

export type ThemeId = '04' | '07' | '02' | '05' | '06' | '09' | '10';

export type FontSet = {
  /** Display face: wordmark, ב״ה, screen titles. */
  disp: string;
  body300: string;
  body400: string;
  body500: string;
};

export type ThemeColors = {
  bg: string;
  ink: string;
  /** muted / secondary text */
  ink2: string;
  /** body text (excerpts, answers) */
  ink3: string;
  /** accent: daily eyebrow, links, active tab */
  acc: string;
  /** gold frame / ornament metal */
  metal: string;
  metalText: string;
  metalIcon: string;
  orn: string;
  wmInk: string;
  tagFg: string;
  tagBg: string;
  shadow: string;
  mic1: string;
  mic2: string;
  micIcon: string;
  micHi: string;
  /** glass gradient start / end, border, top inset highlight */
  gA: string;
  gB: string;
  gBorder: string;
  gInset: string;
  avBg: string;
  pillBg: string;
  divider: string;
};

export type Theme = {
  id: ThemeId;
  slug: string;
  name: string;
  desc: string;
  scheme: 'light' | 'dark';
  colors: ThemeColors;
  blobs: [string, number][];
  fonts: FontSet;
  wmLetterSpacing: number;
};

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}
export function rgba(hex: string, a: number) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

const F = {
  frank500: 'FrankRuhlLibre_500Medium',
  frank600: 'FrankRuhlLibre_600SemiBold',
  david500: 'DavidLibre_500Medium',
  notoSerif500: 'NotoSerifHebrew_500Medium',
};
const plex: Omit<FontSet, 'disp'> = {
  body300: 'IBMPlexSansHebrew_300Light',
  body400: 'IBMPlexSansHebrew_400Regular',
  body500: 'IBMPlexSansHebrew_500Medium',
};
const rubik: Omit<FontSet, 'disp'> = {
  body300: 'Rubik_300Light',
  body400: 'Rubik_400Regular',
  body500: 'Rubik_500Medium',
};
const heebo: Omit<FontSet, 'disp'> = {
  body300: 'Heebo_300Light',
  body400: 'Heebo_400Regular',
  body500: 'Heebo_500Medium',
};
// David Libre has no 300 face; the design stands 400 in for it (W3(400,400,500)).
const david: Omit<FontSet, 'disp'> = {
  body300: 'DavidLibre_400Regular',
  body400: 'DavidLibre_400Regular',
  body500: 'DavidLibre_500Medium',
};

type Raw = {
  bg: string; ink: string; ink2: string; ink3: string; acc: string;
  b: [string, string, string, string]; o: [number, number, number, number];
  shadow: string; mic1: string; mic2: string; tagFg: string; tagBg: string;
  metal: string; metalText: string; metalIcon: string;
} & Partial<ThemeColors>;

const LIGHT_GLASS = {
  gA: 'rgba(255,255,255,.52)',
  gB: 'rgba(255,255,255,.26)',
  gBorder: 'rgba(255,255,255,.75)',
  gInset: 'rgba(255,255,255,.9)',
  avBg: 'rgba(255,255,255,.35)',
  pillBg: 'rgba(255,255,255,.34)',
  micHi: 'rgba(255,255,255,.8)',
  divA: 0.09,
};

function make(
  id: ThemeId,
  slug: string,
  name: string,
  desc: string,
  scheme: 'light' | 'dark',
  raw: Raw,
  fonts: FontSet,
  extra: { divA?: number; wmLetterSpacing?: number } = {},
): Theme {
  const { b, o, ...c } = raw;
  const colors: ThemeColors = {
    gA: LIGHT_GLASS.gA,
    gB: LIGHT_GLASS.gB,
    gBorder: LIGHT_GLASS.gBorder,
    gInset: LIGHT_GLASS.gInset,
    avBg: LIGHT_GLASS.avBg,
    pillBg: LIGHT_GLASS.pillBg,
    micHi: LIGHT_GLASS.micHi,
    micIcon: c.acc,
    orn: c.metal,
    wmInk: c.ink,
    divider: rgba(c.ink, extra.divA ?? LIGHT_GLASS.divA),
    ...c,
  } as ThemeColors;
  return {
    id,
    slug,
    name,
    desc,
    scheme,
    colors,
    blobs: b.map((col, i) => [col, o[i]] as [string, number]),
    fonts,
    wmLetterSpacing: extra.wmLetterSpacing ?? 0.5,
  };
}

export const THEMES: Theme[] = [
  make('04', 'paper-ink', S.themes['04'].name, S.themes['04'].desc, 'light', {
    bg: '#FFFFFF', ink: '#141414', ink2: '#5C5C5C', ink3: '#353535', acc: '#141414',
    b: ['#EDEDED', '#E2E2E2', '#EAEAEA', '#F3F3F3'], o: [0.9, 0.6, 0.7, 0.9],
    shadow: 'rgba(0,0,0,.07)', mic1: '#FFFFFF', mic2: '#ECECEC', tagFg: '#333333', tagBg: 'rgba(0,0,0,.06)',
    metal: '#1A1A1A', metalText: '#1A1A1A', metalIcon: '#1A1A1A',
    gBorder: 'rgba(0,0,0,.10)', gInset: 'rgba(255,255,255,1)',
  }, { disp: F.frank500, ...plex }),
  make('07', 'night-gold', S.themes['07'].name, S.themes['07'].desc, 'dark', {
    bg: '#1A1714', ink: '#EFE7D8', ink2: '#B9AE9C', ink3: '#D6CCBA', acc: '#D8B26E',
    b: ['#4A3626', '#3A3346', '#2C3A30', '#3D2E25'], o: [0.9, 0.7, 0.7, 0.9],
    shadow: 'rgba(0,0,0,.35)', mic1: '#4A3A2A', mic2: '#2E251D', micIcon: '#E2BF7E', micHi: 'rgba(255,235,200,.18)',
    tagFg: '#C9D1B8', tagBg: 'rgba(160,175,140,.16)',
    metal: '#C6A15B', metalText: '#D8B26E', metalIcon: '#D0AC68',
    gA: 'rgba(255,245,230,.10)', gB: 'rgba(255,245,230,.04)', gBorder: 'rgba(255,240,215,.16)', gInset: 'rgba(255,240,215,.12)',
    avBg: 'rgba(255,245,230,.06)', pillBg: 'rgba(255,245,230,.05)',
  }, { disp: F.frank500, ...rubik }, { divA: 0.12 }),
  make('02', 'raw-clay', S.themes['02'].name, S.themes['02'].desc, 'light', {
    bg: '#ECE0D2', ink: '#382B22', ink2: '#6C5A4C', ink3: '#4F4036', acc: '#7E5338',
    b: ['#D6BDA2', '#BE9F86', '#C8C0A9', '#E3D2BF'], o: [0.9, 0.55, 0.65, 0.9],
    shadow: 'rgba(100,75,50,.10)', mic1: '#EEDFCD', mic2: '#D6BDA2', tagFg: '#5F5644', tagBg: 'rgba(160,145,115,.22)',
    metal: '#A3814F', metalText: '#7A5E35', metalIcon: '#8C6C3F',
  }, { disp: F.david500, ...heebo }),
  make('05', 'old-press', S.themes['05'].name, S.themes['05'].desc, 'light', {
    bg: '#F3EBD9', ink: '#1F1B16', ink2: '#5A5044', ink3: '#3A332B', acc: '#A0281D',
    b: ['#E9DCBE', '#D9C7A0', '#E3D6B8', '#EFE3C8'], o: [0.9, 0.55, 0.7, 0.9],
    shadow: 'rgba(80,60,30,.10)', mic1: '#F7EFDF', mic2: '#E9DCBE', tagFg: '#8A2219', tagBg: 'rgba(160,40,29,.09)',
    metal: '#2A241E', metalText: '#A0281D', metalIcon: '#2A241E', orn: '#A0281D',
  }, { disp: F.frank600, ...david }),
  make('06', 'sage-olive', S.themes['06'].name, S.themes['06'].desc, 'light', {
    bg: '#ECEEE4', ink: '#2B3125', ink2: '#5F6655', ink3: '#454C3C', acc: '#55653D',
    b: ['#CCD4BA', '#A9B394', '#D9CDB1', '#E1E6D4'], o: [0.9, 0.55, 0.6, 0.9],
    shadow: 'rgba(60,75,45,.10)', mic1: '#EEF1E5', mic2: '#CCD4BA', tagFg: '#6A5A3A', tagBg: 'rgba(190,170,120,.25)',
    metal: '#A88B50', metalText: '#7A6233', metalIcon: '#8C7140',
  }, { disp: F.frank500, ...rubik }),
  // 09: the design used Bellefair for the wordmark; it read too thin, so Frank Ruhl Libre 500 per the user's note.
  make('09', 'cloud-mocha', S.themes['09'].name, S.themes['09'].desc, 'light', {
    bg: '#F0EEE9', ink: '#2E2925', ink2: '#6A6058', ink3: '#4B433D', acc: '#7D5A47',
    b: ['#E2D6CB', '#C6AE9E', '#D4D3CB', '#EAE4DB'], o: [0.9, 0.55, 0.6, 0.9],
    shadow: 'rgba(90,70,55,.09)', mic1: '#F5F2EE', mic2: '#E2D6CB', tagFg: '#5D554C', tagBg: 'rgba(164,120,100,.16)',
    metal: '#B79F78', metalText: '#746040', metalIcon: '#957E57',
  }, { disp: F.frank500, ...heebo }),
  make('10', 'tekhelet', S.themes['10'].name, S.themes['10'].desc, 'light', {
    bg: '#E9EDF0', ink: '#1E2836', ink2: '#566273', ink3: '#3A4656', acc: '#2F4A72',
    b: ['#BFCBD9', '#9FB0C6', '#D6CEBE', '#DDE4EB'], o: [0.9, 0.55, 0.6, 0.9],
    shadow: 'rgba(40,60,90,.10)', mic1: '#EEF2F6', mic2: '#BFCBD9', tagFg: '#6A5733', tagBg: 'rgba(190,160,100,.22)',
    metal: '#A98B55', metalText: '#7A6234', metalIcon: '#8D7243',
  }, { disp: F.notoSerif500, ...plex }),
];

export const THEME_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t])) as Record<ThemeId, Theme>;
export const DEFAULT_LIGHT: ThemeId = '04';
export const DEFAULT_DARK: ThemeId = '07';
