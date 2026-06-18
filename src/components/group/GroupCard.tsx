import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { fontSize, fontWeight } from '../../constants/typography';
import { GROUP_CATEGORIES } from '../../constants/categories';
import type { DbGroup } from '../../types/database';

interface GroupCardProps {
  group: DbGroup;
  onPress: () => void;
}

export function GroupCard({ group, onPress }: GroupCardProps) {
  const cat = GROUP_CATEGORIES.find((c) => c.value === group.category);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconBox}>
            <Text style={styles.icon}>{cat?.icon ?? '📁'}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>{group.title}</Text>
            <Text style={styles.cat}>{cat?.label ?? 'Diğer'}</Text>
          </View>
          <View style={styles.balance}>
            <Text style={styles.balanceLabel}>Bakiye</Text>
            <Text style={styles.balanceAmount}>—</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: spacing[3] },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { fontSize: 22 },
  info: { flex: 1 },
  title: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.neutral[900] },
  cat: { fontSize: fontSize.sm, color: colors.neutral[500], marginTop: 2 },
  balance: { alignItems: 'flex-end' },
  balanceLabel: { fontSize: fontSize.xs, color: colors.neutral[400] },
  balanceAmount: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.neutral[700] },
});
