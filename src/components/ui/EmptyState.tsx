import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from './Button';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { fontSize, fontWeight } from '../../constants/typography';

interface EmptyStateProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Feather name={icon} size={64} color={colors.neutral[300]} />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} style={styles.button} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[10],
    gap: spacing[3],
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.neutral[700],
    textAlign: 'center',
    marginTop: spacing[2],
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: fontSize.md * 1.5,
  },
  button: {
    marginTop: spacing[2],
    paddingHorizontal: spacing[8],
  },
});
