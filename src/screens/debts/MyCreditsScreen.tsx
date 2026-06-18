import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  FlatList, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import { fontSize, fontWeight } from '../../constants/typography';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { supabase } from '../../lib/supabase';
import type { DebtsStackParamList } from '../../types/navigation';

type NavProp = StackNavigationProp<DebtsStackParamList, 'MyCredits'>;

function formatAmount(amount: number, currency = 'TRY') {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency', currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

const NUDGE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export function MyCreditsScreen() {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuthStore();
  const [nudgeTimes, setNudgeTimes] = useState<Record<string, number>>({});

  const { data: credits = [], isLoading } = useQuery({
    queryKey: ['my-credits', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('debts')
        .select('*, debtor:users!debtor_id(id, full_name, avatar_url), groups(title)')
        .eq('creditor_id', user!.id)
        .eq('is_settled', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const totalCredit = (credits as any[]).reduce((s: number, d: any) => s + Number(d.amount), 0);

  const canNudge = useCallback((debtId: string) => {
    const last = nudgeTimes[debtId];
    if (!last) return true;
    return Date.now() - last >= NUDGE_COOLDOWN_MS;
  }, [nudgeTimes]);

  const handleNudge = (debtId: string, debtorName: string) => {
    if (!canNudge(debtId)) {
      Alert.alert('Bekleme Süresi', 'Aynı kişiyi 24 saat içinde tekrar dürtüleyemezsiniz.');
      return;
    }
    setNudgeTimes((prev) => ({ ...prev, [debtId]: Date.now() }));
    Alert.alert('Dürt gönderildi', `${debtorName} bilgilendirildi.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.tabLink}>← Borçlarım</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alacaklarım</Text>
        <View style={{ width: 80 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary[500]} />
      ) : (
        <FlatList
          data={credits as any[]}
          keyExtractor={(item: any) => item.id}
          ListHeaderComponent={() =>
            credits.length > 0 ? (
              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Toplam Alacağım</Text>
                <Text style={styles.totalAmount}>{formatAmount(totalCredit)}</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={() => (
            <EmptyState
              icon="trending-up"
              title="Alacağınız yok"
              subtitle="Herkes borcunu ödemiş görünüyor."
            />
          )}
          renderItem={({ item }: { item: any }) => {
            const nudgeable = canNudge(item.id);
            return (
              <View style={styles.creditRow}>
                <Avatar
                  name={item.debtor?.full_name ?? '?'}
                  avatarUrl={item.debtor?.avatar_url}
                  size="md"
                />
                <View style={styles.creditInfo}>
                  <Text style={styles.debtorName} numberOfLines={1}>
                    {item.debtor?.full_name ?? 'Bilinmeyen'}
                  </Text>
                  <Text style={styles.groupName} numberOfLines={1}>
                    {item.groups?.title ?? '—'}
                  </Text>
                </View>
                <View style={styles.creditRight}>
                  <Text style={styles.creditAmount}>
                    {formatAmount(item.amount, item.currency)}
                  </Text>
                  <TouchableOpacity
                    style={[styles.nudgeBtn, !nudgeable && styles.nudgeBtnDisabled]}
                    onPress={() => handleNudge(item.id, item.debtor?.full_name ?? '?')}
                    disabled={!nudgeable}
                  >
                    <Feather name="zap" size={14} color={nudgeable ? colors.warning[500] : colors.neutral[400]} />
                    <Text style={[styles.nudgeBtnText, !nudgeable && styles.nudgeBtnTextDisabled]}>
                      {nudgeable ? 'Dürt' : 'Bekleniyor'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[4], paddingVertical: spacing[4],
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.neutral[200],
  },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.neutral[900] },
  tabLink: { fontSize: fontSize.md, color: colors.primary[500], fontWeight: fontWeight.medium, width: 80 },

  totalCard: {
    margin: spacing[4],
    backgroundColor: colors.success[100],
    borderRadius: radius.lg, padding: spacing[5],
    borderWidth: 1, borderColor: colors.success[500],
    alignItems: 'center',
  },
  totalLabel: { fontSize: fontSize.md, color: colors.success[500] },
  totalAmount: {
    fontSize: fontSize['2xl'], fontWeight: fontWeight.bold,
    color: colors.success[500], marginTop: spacing[1],
  },

  creditRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing[4], marginBottom: spacing[2],
    borderRadius: radius.md, padding: spacing[3],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    gap: spacing[3],
  },
  creditInfo: { flex: 1 },
  debtorName: {
    fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.neutral[900],
  },
  groupName: { fontSize: fontSize.sm, color: colors.neutral[500], marginTop: 2 },
  creditRight: { alignItems: 'flex-end', gap: spacing[2] },
  creditAmount: {
    fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.success[500],
  },
  nudgeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: colors.warning[500],
    borderRadius: radius.full,
    paddingHorizontal: spacing[2], paddingVertical: spacing[1],
  },
  nudgeBtnDisabled: { borderColor: colors.neutral[200] },
  nudgeBtnText: { fontSize: fontSize.xs, color: colors.warning[500], fontWeight: fontWeight.medium },
  nudgeBtnTextDisabled: { color: colors.neutral[400] },
  listContent: { paddingBottom: spacing[8] },
});
