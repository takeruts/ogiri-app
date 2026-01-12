// 壁打ちオオギリ - モダンでポップで優しいテーマ

export const colors = {
  // Primary colors - 明るく優しいブルー
  primary: '#4A90E2',
  primaryLight: '#6BA3E8',
  primaryDark: '#3B7BC9',
  primarySoft: '#E8F4FF',

  // Secondary colors - 温かみのあるオレンジ
  secondary: '#FF9F66',
  secondaryLight: '#FFB485',
  secondaryDark: '#FF8547',
  secondarySoft: '#FFF4ED',

  // Accent colors - ポップなピンク
  accent: '#FF6B9D',
  accentLight: '#FF88B0',
  accentDark: '#FF528A',
  accentSoft: '#FFF0F5',

  // Success - 優しいグリーン
  success: '#66D9B3',
  successLight: '#85E0C4',
  successDark: '#4DC99F',
  successSoft: '#EDFCF7',

  // Warning - 柔らかいイエロー
  warning: '#FFD166',
  warningSoft: '#FFF8E6',

  // Error - 優しいレッド
  error: '#FF6B6B',
  errorSoft: '#FFECEC',

  // Neutral colors - 柔らかいグレー
  background: '#F8FAFB',
  surface: '#FFFFFF',
  surfaceHover: '#F5F7F9',
  border: '#E3E8EC',
  borderLight: '#F0F3F6',

  // Text colors
  text: '#2C3E50',
  textSecondary: '#7C8BA1',
  textLight: '#A4B4C4',
  textInverse: '#FFFFFF',

  // Special
  overlay: 'rgba(44, 62, 80, 0.5)',
  shadow: 'rgba(74, 144, 226, 0.15)',
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
