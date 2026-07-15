// オオギリ検定 - モダンでポップで優しいテーマ

export const colors = {
  // Primary - ローズピンク（受験ボタン等）
  primary: '#EC4899',
  primaryLight: '#F472B6',
  primaryDark: '#DB2777',
  primarySoft: 'rgba(236,72,153,0.12)',

  // Secondary - ラベンダー
  secondary: '#A78BFA',
  secondaryLight: '#C4B5FD',
  secondaryDark: '#8B5CF6',
  secondarySoft: 'rgba(167,139,250,0.14)',

  // Accent - ゴールド（段位・認定証・ハイライト）
  accent: '#E0A400',
  accentLight: '#F59E0B',
  accentDark: '#B45309',
  accentSoft: 'rgba(224,164,0,0.14)',

  // Success - ミントグリーン
  success: '#10B981',
  successLight: '#34D399',
  successDark: '#059669',
  successSoft: 'rgba(16,185,129,0.14)',

  // Warning - アンバー
  warning: '#D97706',
  warningSoft: 'rgba(217,119,6,0.14)',

  // Error - ローズ
  error: '#F43F5E',
  errorSoft: 'rgba(244,63,94,0.12)',

  // Neutral - ライト（やわらかい女性向け）
  background: '#FFF6F9',
  surface: '#FFFFFF',
  surfaceHover: '#FCEEF4',
  border: 'rgba(61,43,54,0.10)',
  borderLight: 'rgba(61,43,54,0.05)',

  // Text colors
  text: '#3D2B36',
  textSecondary: '#8A6E7C',
  textLight: '#B7A2AD',
  textInverse: '#FFFFFF',

  // Special
  overlay: 'rgba(61,43,54,0.40)',
  shadow: 'rgba(236,72,153,0.18)',
};

// 診断・段位・認定証まわりのデザイントークン
// ライト × ピンク／ラベンダー／上品なゴールドのやわらかい世界観
export const diag = {
  bg: '#FFF6F9',
  bgCard: '#FFFFFF',
  glass: 'rgba(236,72,153,0.06)',
  glassBorder: 'rgba(61,43,54,0.10)',
  purple: '#8B5CF6',
  purpleSoft: '#7C3AED',
  // 偏差値の大きな数字・ネオンボタン等で使用（ライト背景でも読めるビビッドピンク）
  pink: '#EC4899',
  pinkLight: '#DB2777',
  text: '#3D2B36',
  textSub: '#8A6E7C',
  star: '#F59E0B',
  starEmpty: 'rgba(61,43,54,0.15)',
  // 検定（認定証・段位）用ゴールド（ライト背景で読める濃さ）
  gold: '#D9A400',
  goldLight: '#B45309',
  goldSoft: 'rgba(217,164,0,0.14)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 999,
};

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    color: colors.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    color: colors.text,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    color: colors.text,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    color: colors.text,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    color: colors.textLight,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
};

export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
};

export type Theme = typeof theme;
