import { TextStyle } from 'react-native';

export const FontFamily = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  black: 'Inter-Black',
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
};

export const LineHeight = {
  xs: 16,
  sm: 18,
  md: 22,
  lg: 24,
  xl: 28,
  xxl: 32,
  xxxl: 40,
  display: 48,
};

export const Typography: Record<string, TextStyle> = {
  display: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.display,
    lineHeight: LineHeight.display,
  },
  h1: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xxxl,
    lineHeight: LineHeight.xxxl,
  },
  h2: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xxl,
    lineHeight: LineHeight.xxl,
  },
  h3: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.xl,
    lineHeight: LineHeight.xl,
  },
  subtitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.lg,
    lineHeight: LineHeight.lg,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
  },
  bodyMedium: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
  },
  caption: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
  },
  captionMedium: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
  },
  small: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    lineHeight: LineHeight.xs,
  },
  button: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
  },
  amount: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xxxl,
    lineHeight: LineHeight.xxxl,
  },
  amountLarge: {
    fontFamily: FontFamily.black,
    fontSize: FontSize.display,
    lineHeight: LineHeight.display,
  },
};
