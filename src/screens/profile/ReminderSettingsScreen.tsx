import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, Switch,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import { fontSize, fontWeight } from '../../constants/typography';
import { BILL_CATEGORIES } from '../../constants/categories';
import { EXPENSE_CATEGORIES } from '../../constants/categories';

const DAYS_OPTIONS = [3, 5, 7];

type CategoryState = { enabled: boolean; days: number };

function getCategoryLabel(cat: string) {
  return EXPENSE_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
}

function getCategoryIcon(cat: string) {
  return EXPENSE_CATEGORIES.find((c) => c.value === cat)?.icon ?? 'bell';
}

export function ReminderSettingsScreen() {
  const [settings, setSettings] = useState<Record<string, CategoryState>>(() => {
    const initial: Record<string, CategoryState> = {};
    BILL_CATEGORIES.forEach((cat) => { initial[cat] = { enabled: true, days: 5 }; });
    return initial;
  });

  const toggleCategory = (cat: string) => {
    setSettings((prev) => ({
      ...prev,
      [cat]: { ...prev[cat], enabled: !prev[cat].enabled },
    }));
  };

  const setDays = (cat: string, days: number) => {
    setSettings((prev) => ({
      ...prev,
      [cat]: { ...prev[cat], days },
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.infoCard}>
          <Feather name="info" size={16} color={colors.info[500]} />
          <Text style={styles.infoText}>
            Değişiklikler bir sonraki fatura kaydedildiğinde geçerli olacak.
          </Text>
        </View>

        {BILL_CATEGORIES.map((cat) => {
          const state = settings[cat];
          if (!state) return null;
          const icon = getCategoryIcon(cat);
          const label = getCategoryLabel(cat);
          return (
            <View key={cat} style={styles.catCard}>
              <View style={styles.catHeader}>
                <View style={styles.catIconBox}>
                  <Feather name={icon as any} size={20} color={colors.primary[500]} />
                </View>
                <Text style={styles.catLabel}>{label}</Text>
                <Switch
                  value={state.enabled}
                  onValueChange={() => toggleCategory(cat)}
                  trackColor={{ true: colors.primary[400], false: colors.neutral[200] }}
                  thumbColor={state.enabled ? colors.white : colors.neutral[400]}
                />
              </View>

              {state.enabled && (
                <View style={styles.daysRow}>
                  <Text style={styles.daysLabel}>Kaç gün önce?</Text>
                  <View style={styles.daysChips}>
                    {DAYS_OPTIONS.map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[styles.dayChip, state.days === d && styles.dayChipActive]}
                        onPress={() => setDays(cat, d)}
                      >
                        <Text style={[styles.dayChipText, state.days === d && styles.dayChipTextActive]}>
                          {d} gün
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  scroll: { padding: spacing[4], paddingBottom: spacing[8] },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2],
    backgroundColor: colors.info[100],
    borderRadius: radius.md, padding: spacing[3],
    marginBottom: spacing[4],
  },
  infoText: {
    flex: 1, fontSize: fontSize.sm, color: colors.neutral[700],
    lineHeight: 20,
  },

  catCard: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing[4], marginBottom: spacing[3],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  catIconBox: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center', justifyContent: 'center',
  },
  catLabel: { flex: 1, fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.neutral[900] },

  daysRow: { marginTop: spacing[3], paddingTop: spacing[3], borderTopWidth: 1, borderTopColor: colors.neutral[100] },
  daysLabel: { fontSize: fontSize.sm, color: colors.neutral[500], marginBottom: spacing[2] },
  daysChips: { flexDirection: 'row', gap: spacing[2] },
  dayChip: {
    paddingHorizontal: spacing[3], paddingVertical: spacing[1] + 2,
    borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[100],
  },
  dayChipActive: { borderColor: colors.primary[500], backgroundColor: colors.primary[50] },
  dayChipText: { fontSize: fontSize.md, color: colors.neutral[500] },
  dayChipTextActive: { color: colors.primary[500], fontWeight: fontWeight.semibold },
});
