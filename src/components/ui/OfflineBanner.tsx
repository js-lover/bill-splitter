import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { fontSize } from '../../constants/typography';
import { useUiStore } from '../../stores/uiStore';

export function OfflineBanner() {
  const isOffline = useUiStore((s) => s.isOffline);
  if (!isOffline) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>İnternet bağlantısı yok. Son veriler gösteriliyor.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.warning[100],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    alignItems: 'center',
  },
  text: {
    fontSize: fontSize.sm,
    color: colors.warning[500],
  },
});
