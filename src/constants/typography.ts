import { Platform } from 'react-native';

export const fontFamily = {
  regular: Platform.OS === 'ios' ? 'System' : 'Roboto',
  medium: Platform.OS === 'ios' ? 'System' : 'Roboto-Medium',
  bold: Platform.OS === 'ios' ? 'System' : 'Roboto-Bold',
};

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
  amount: {
    sm: 16,
    md: 20,
    lg: 32,
  },
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const lineHeight = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
};
