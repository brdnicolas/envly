// Mirrors the web app's dark theme (shadcn neutral palette + Geist).

export const Colors = {
  bg: '#0A0A0A',
  card: '#171717',
  elevated: '#1F1F1F',
  muted: '#262626',
  text: '#FAFAFA',
  text2: '#A1A1A1',
  text3: '#737373',
  border: 'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.16)',
  primary: '#E5E5E5',
  onPrimary: '#171717',
  danger: '#FF6467',
  success: '#34D399',
  successBg: 'rgba(52,211,153,0.10)',
  successBorder: 'rgba(52,211,153,0.35)',
  star: '#FBBF24',
  scrim: 'rgba(10,10,10,0.72)',
} as const;

export type Theme = typeof Colors;

/** The app is dark-only, like the web experience it mirrors. */
export function useTheme(): Theme {
  return Colors;
}

export const Space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, x3: 32, x4: 40 } as const;
export const Radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 } as const;

export const Fonts = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semibold: 'Geist_600SemiBold',
  bold: 'Geist_700Bold',
} as const;

export const Type = {
  largeTitle: { fontFamily: Fonts.bold, fontSize: 30, lineHeight: 36, letterSpacing: -0.9 },
  title: { fontFamily: Fonts.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.6 },
  title2: { fontFamily: Fonts.semibold, fontSize: 20, lineHeight: 26, letterSpacing: -0.4 },
  headline: { fontFamily: Fonts.semibold, fontSize: 16, lineHeight: 21, letterSpacing: -0.2 },
  body: { fontFamily: Fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: Fonts.medium, fontSize: 15, lineHeight: 22 },
  callout: { fontFamily: Fonts.medium, fontSize: 14, lineHeight: 19 },
  subhead: { fontFamily: Fonts.regular, fontSize: 14, lineHeight: 20 },
  footnote: { fontFamily: Fonts.regular, fontSize: 13, lineHeight: 17 },
  caption: { fontFamily: Fonts.medium, fontSize: 12, lineHeight: 15 },
  micro: { fontFamily: Fonts.regular, fontSize: 11, lineHeight: 14 },
  price: { fontFamily: Fonts.semibold, fontSize: 13, lineHeight: 17, letterSpacing: -0.2, fontVariant: ['tabular-nums' as const] },
  priceLarge: { fontFamily: Fonts.bold, fontSize: 26, lineHeight: 34, letterSpacing: -0.8, fontVariant: ['tabular-nums' as const] },
} as const;

export type TypeVariant = keyof typeof Type;
