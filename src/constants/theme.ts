// オオギリ検定 - モダンでポップで優しいテーマ

export const colors = {
  // Primary - くすみローズ／モーヴ（受験ボタン等）
  primary: '#B0798B',
  primaryLight: '#C79AA8',
  primaryDark: '#8F6274',
  primarySoft: 'rgba(176,121,139,0.12)',

  // Secondary - くすみラベンダー
  secondary: '#9C92A8',
  secondaryLight: '#B6ADC0',
  secondaryDark: '#7C7189',
  secondarySoft: 'rgba(156,146,168,0.14)',

  // Accent - くすみゴールド（段位・認定証・ハイライト）
  accent: '#B8945F',
  accentLight: '#C9A971',
  accentDark: '#8C6B3A',
  accentSoft: 'rgba(184,148,95,0.16)',

  // Success - くすみセージ
  success: '#7FA087',
  successLight: '#9DBBA3',
  successDark: '#5F8069',
  successSoft: 'rgba(127,160,135,0.16)',

  // Warning - くすみマスタード
  warning: '#C99A5B',
  warningSoft: 'rgba(201,154,91,0.16)',

  // Error - くすみテラコッタ
  error: '#C57B6E',
  errorSoft: 'rgba(197,123,110,0.14)',

  // Neutral - ライト×グレージュ（今どきのニュアンス）
  background: '#F6F1EE',
  surface: '#FFFFFF',
  surfaceHover: '#F1E7E3',
  border: 'rgba(74,64,63,0.10)',
  borderLight: 'rgba(74,64,63,0.05)',

  // Text colors
  text: '#47403E',
  textSecondary: '#8A7E79',
  textLight: '#B4A9A3',
  textInverse: '#FFFFFF',

  // Special
  overlay: 'rgba(47,40,39,0.40)',
  shadow: 'rgba(176,121,139,0.16)',
};

// 診断・段位・認定証まわりのデザイントークン
// ライト × ピンク／ラベンダー／上品なゴールドのやわらかい世界観
export const diag = {
  bg: '#F6F1EE',
  bgCard: '#FFFFFF',
  glass: 'rgba(176,121,139,0.06)',
  glassBorder: 'rgba(74,64,63,0.10)',
  purple: '#9C92A8',
  purpleSoft: '#7C7189',
  // 偏差値の大きな数字・ボタン等で使用（くすみローズ）
  pink: '#B0798B',
  pinkLight: '#8F6274',
  text: '#47403E',
  textSub: '#8A7E79',
  star: '#C9A971',
  starEmpty: 'rgba(74,64,63,0.15)',
  // 検定（認定証・段位）用のくすみゴールド
  gold: '#B8945F',
  goldLight: '#8C6B3A',
  goldSoft: 'rgba(184,148,95,0.14)',
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
