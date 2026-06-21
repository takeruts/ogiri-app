// オオギリ検定 - モダンでポップで優しいテーマ

export const colors = {
  // Primary - ディープパープル（受験ボタン等）
  primary: '#7C3AED',
  primaryLight: '#8B5CF6',
  primaryDark: '#6D28D9',
  primarySoft: 'rgba(124,58,237,0.16)',

  // Secondary - ゴールド
  secondary: '#F59E0B',
  secondaryLight: '#FCD34D',
  secondaryDark: '#D97706',
  secondarySoft: 'rgba(245,158,11,0.16)',

  // Accent - ゴールド（段位・認定証・ハイライト）
  accent: '#F59E0B',
  accentLight: '#FCD34D',
  accentDark: '#D97706',
  accentSoft: 'rgba(245,158,11,0.16)',

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

  // Neutral - ダークネイビー（検定の世界観）
  background: '#0F172A',
  surface: '#111827',
  surfaceHover: '#1E293B',
  border: 'rgba(255,255,255,0.12)',
  borderLight: 'rgba(255,255,255,0.06)',

  // Text colors
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textLight: '#64748B',
  textInverse: '#FFFFFF',

  // Special
  overlay: 'rgba(2,6,23,0.72)',
  shadow: 'rgba(245,158,11,0.30)',
};

// 診断（お笑いセンス診断）用デザイントークン
// ダーク × 紫→ピンクのネオン／ガラスモーフィズムの世界観
export const diag = {
  bg: '#0F172A',
  bgCard: '#111827',
  glass: 'rgba(255,255,255,0.05)',
  glassBorder: 'rgba(255,255,255,0.12)',
  purple: '#7C3AED',
  purpleSoft: '#A5B4FC',
  // 旧ピンク枠 → 検定ゴールドに統一（偏差値・ネオンボタン等で使用）
  pink: '#F59E0B',
  pinkLight: '#FCD34D',
  text: '#F8FAFC',
  textSub: '#94A3B8',
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
