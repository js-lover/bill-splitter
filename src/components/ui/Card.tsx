import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { colors } from '../../constants/colors';
import { radius, spacing } from '../../constants/spacing';

interface CardProps extends ViewProps {
  bordered?: boolean;
}

export function Card({ bordered, style, children, ...props }: CardProps) {
  return (
    <View style={[styles.base, bordered ? styles.bordered : styles.shadowed, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.cardPad,
  },
  shadowed: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  bordered: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
});
