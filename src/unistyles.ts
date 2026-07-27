import { StyleSheet } from 'react-native-unistyles';
import { Platform } from 'react-native';

import '@/global.css';

const fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

/**
 * Typography scale. Weights/sizes follow the booking reference:
 * tight geometric sans, heavy titles, muted secondary rows.
 */
const typography = {
  cardTitle: { fontSize: 20, lineHeight: 24, fontWeight: '700' },
  sectionTitle: { fontSize: 16, lineHeight: 20, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 20, fontWeight: '500' },
  label: { fontSize: 13, lineHeight: 16, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 15, fontWeight: '500' },
  ringValue: { fontSize: 15, lineHeight: 17, fontWeight: '700' },
  macroValue: { fontSize: 18, lineHeight: 22, fontWeight: '700' },
} as const;

const shared = {
  fonts,
  typography,
  spacing: {
    half: 2,
    one: 4,
    two: 8,
    three: 16,
    four: 24,
    five: 32,
    six: 64,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  /** Progress ring geometry — shared by header ring and its check-morph state. */
  ring: {
    size: 44,
    strokeWidth: 4,
  },
  maxContentWidth: 800,
} as const;

const lightTheme = {
  colors: {
    primary: 'purple',
    surface: '#ffffff',
    text: '#12132D',
    textSecondary: '#60646C',
    textMuted: '#9A9DAA',
    background: '#F4F4FA',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',

    /** Card container — Mimo reference: white sheet on tinted page, hairline border. */
    card: '#FFFFFF',
    cardBorder: '#ECECF3',
    divider: '#EEEEF4',

    accent: '#3B5BFE',
    /** Meal row that already has a recipe attached. */
    mealFilled: '#F3F6FF',
    mealFilledBorder: '#DCE4FF',

    badgeBackground: '#F1F1F7',
    badgeText: '#3C4050',

    progressTrack: '#ECECF3',
    /** Ring animates start -> end as filled/total grows. */
    progressStart: '#BFD8CB',
    progressEnd: '#5FBF8D',
    success: '#5FBF8D',
  },
  shadow: {
    card: {
      shadowColor: '#1B1C3A',
      shadowOpacity: 0.06,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
  },
  ...shared,
} as const;

const darkTheme = {
  colors: {
    primary: 'purple',
    surface: '#101014',
    text: '#FFFFFF',
    textSecondary: '#B0B4BA',
    textMuted: '#7C808C',
    background: '#0A0A0D',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',

    card: '#17171C',
    cardBorder: '#26262E',
    divider: '#26262E',

    accent: '#6E86FF',
    mealFilled: '#1B1F31',
    mealFilledBorder: '#2C3350',

    badgeBackground: '#212228',
    badgeText: '#D5D7E0',

    progressTrack: '#26262E',
    progressStart: '#3E5A4C',
    progressEnd: '#5FBF8D',
    success: '#5FBF8D',
  },
  shadow: {
    card: {
      shadowColor: '#000000',
      shadowOpacity: 0.4,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
    },
  },
  ...shared,
} as const;

/**
 * TODO(colors): per-meal accent palette is not decided yet.
 * Health-app reference uses one pastel per meal type — enable once colors are approved:
 *
 * mealAccents: {
 *   breakfast: '#F6D7CE',
 *   lunch:     '#CFE8DF',
 *   dinner:    '#CFD2F2',
 *   snack:     '#F3C4C4',
 * }
 *
 * Until then meal rows stay neutral and use `mealFilled` for the filled state only.
 */

const appThemes = {
  light: lightTheme,
  dark: darkTheme,
};

const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
} as const;

type AppThemes = typeof appThemes;
type AppBreakpoints = typeof breakpoints;

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
  themes: appThemes,
  breakpoints,
  settings: {
    adaptiveThemes: true,
  },
});
