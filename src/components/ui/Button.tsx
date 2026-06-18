import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type TouchableOpacityProps,
} from 'react-native';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';
import { fontSize, fontWeight } from '../../constants/typography';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: Variant;
  loading?: boolean;
}

export function Button({ label, variant = 'primary', loading, disabled, style, ...props }: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], isDisabled && styles.disabled, style]}
      activeOpacity={0.8}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'destructive' ? colors.white : colors.primary[500]} />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
  },
  primary: {
    backgroundColor: colors.primary[500],
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary[500],
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  destructive: {
    backgroundColor: colors.danger[500],
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  primaryLabel: { color: colors.white },
  secondaryLabel: { color: colors.primary[500] },
  ghostLabel: { color: colors.primary[500] },
  destructiveLabel: { color: colors.white },
});
