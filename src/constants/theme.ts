// オオギリ検定 - モダンでポップで優しいテーマ

export const colors = {
  // Primary - ネオンパープル
  primary: '#A855F7',
  primaryLight: '#C084FC',
  primaryDark: '#7C3AED',
  primarySoft: 'rgba(168,85,247,0.16)',

  // Secondary - ピンク
  secondary: '#F472B6',
  secondaryLight: '#F9A8D4',
  secondaryDark: '#EC4899',
  secondarySoft: 'rgba(236,72,153,0.16)',

  // Accent - ホットピンク
  accent: '#EC4899',
  accentLight: '#F472B6',
  accentDark: '#DB2777',
  accentSoft: 'rgba(236,72,153,0.16)',

  // Success - ミントグリーン
  success: '#34D399',
  successLight: '#6EE7B7',
  successDark: '#10B981',
  successSoft: 'rgba(52,211,153,0.16)',

  // Warning - アンバー
  warning: '#FBBF24',
  warningSoft: 'rgba(251,191,36,0.16)',

  // Error - ローズ
  error: '#FB7185',
  errorSoft: 'rgba(251,113,133,0.16)',

  // Neutral - ダーク（診断の世界観）
  background: '#0E0A1F',
  surface: '#181030',
  surfaceHover: '#221640',
  border: 'rgba(255,255,255,0.14)',
  borderLight: 'rgba(255,255,255,0.08)',

  // Text colors
  text: '#F5F3FF',
  textSecondary: '#B9AEDB',
  textLight: '#8B7FB0',
  textInverse: '#FFFFFF',

  // Special
  overlay: 'rgba(8,5,18,0.72)',
  shadow: 'rgba(168,85,247,0.30)',
};

// 診断（お笑いセンス診断）用デザイントークン
// ダーク × 紫→ピンクのネオン／ガラスモーフィズムの世界観
export const diag = {
  bg: '#0E0A1F',
  bgCard: '#181030',
  glass: 'rgba(255,255,255,0.06)',
  glassBorder: 'rgba(255,255,255,0.14)',
  purple: '#A855F7',
  purpleSoft: '#C4B5FD',
  pink: '#EC4899',
  pinkLight: '#F472B6',
  text: '#F5F3FF',
  textSub: '#B9AEDB',
  star: '#FBBF24',
  starEmpty: 'rgba(255,255,255,0.18)',
  // 検定（認定証・段位）用ゴールド
  gold: '#F59E0B',
  goldLight: '#FCD34D',
  goldSoft: 'rgba(245,158,11,0.16)',
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
