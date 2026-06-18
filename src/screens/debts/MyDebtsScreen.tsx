import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import { fontSize, fontWeight } from '../../constants/typography';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import type { DebtsStackParamList } from '../../types/navigation';

type NavProp = StackNavigationProp<DebtsStackParamList, 'MyDebts'>;

function formatAmount(amount: number, currency = 'TRY') {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency', currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function isOverdue(createdAt: string) {
  const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return days > 7;
}

export function MyDebtsScreen() {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuthStore();

  const { data: debts = [], isLoading } = useQuery({
    queryKey: ['my-debts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('debts')
        .select('*, creditor:users!creditor_id(id, full_name, avatar_url, iban), groups(title)')
        .eq('debtor_id', user!.id)
        .eq('is_settled', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const totalDebt = (debts as any[]).reduce((s: number, d: any) => s + Number(d.amount), 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Borçlarım</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MyCredits')}>
          <Text style={styles.tabLink}>Alacaklarım →</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary[500]} />
      ) : (
        <FlatList
          data={debts as any[]}
          keyExtractor={(item: any) => item.id}
          ListHeaderComponent={() =>
            debts.length > 0 ? (
              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Toplam Borcum</Text>
                <Text style={styles.totalAmount}>{formatAmount(totalDebt)}</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={() => (
            <EmptyState
              icon="check-circle"
              title="Borcunuz yok!"
              subtitle="Tüm borçlarınız ödenmiş durumda."
            />
          )}
          renderItem={({ item }: { item: any }) => {
            const overdue = isOverdue(item.created_at);
            return (
              <TouchableOpacity
                style={styles.debtRow}
                onPress={() => navigation.navigate('DebtDetail', { debtId: item.id })}
              >
                <Avatar
                  name={item.creditor?.full_name ?? '?'}
                  avatarUrl={item.creditor?.avatar_url}
                  size="md"
                />
                <View style={styles.debtInfo}>
                  <View style={styles.debtNameRow}>
                    <Text style={styles.creditorName} numberOfLines={1}>
                      {item.creditor?.full_name ?? 'Bilinmeyen'}
                    </Text>
                    {overdue && (
                      <View style={styles.overdueBadge}>
                        <Text style={styles.overdueText}>Gecikmiş</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.groupName} numberOfLines={1}>
                    {item.groups?.title ?? '—'}
                  </Text>
                </View>
                <View style={styles.debtRight}>
                  <Text style={styles.debtAmount}>{formatAmount(item.amount, item.currency)}</Text>
                  <TouchableOpacity
                    style={styles.payBtn}
                    onPress={() => navigation.navigate('DebtDetail', { debtId: item.id })}
                  >
                    <Text style={styles.payBtnText}>Öde</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
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
  tabLink: { fontSize: fontSize.md, color: colors.primary[500], fontWeight: fontWeight.medium },

  totalCard: {
    margin: spacing[4],
    backgroundColor: colors.danger[100],
    borderRadius: radius.lg, padding: spacing[5],
    borderWidth: 1, borderColor: colors.danger[500],
    alignItems: 'center',
  },
  totalLabel: { fontSize: fontSize.md, color: colors.danger[500] },
  totalAmount: {
    fontSize: fontSize['2xl'], fontWeight: fontWeight.bold,
    color: colors.danger[500], marginTop: spacing[1],
  },

  debtRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing[4], marginBottom: spacing[2],
    borderRadius: radius.md, padding: spacing[3],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    gap: spacing[3],
  },
  debtInfo: { flex: 1 },
  debtNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  creditorName: {
    fontSize: fontSize.base, fontWeight: fontWeight.medium,
    color: colors.neutral[900], flex: 1,
  },
  overdueBadge: {
    backgroundColor: colors.warning[100],
    borderRadius: radius.full,
    paddingHorizontal: spacing[2], paddingVertical: 2,
  },
  overdueText: { fontSize: fontSize.xs, color: colors.warning[500], fontWeight: fontWeight.medium },
  groupName: { fontSize: fontSize.sm, color: colors.neutral[500], marginTop: 2 },
  debtRight: { alignItems: 'flex-end', gap: spacing[2] },
  debtAmount: {
    fontSize: fontSize.base, fontWeight: fontWeight.bold,
    color: colors.danger[500],
  },
  payBtn: {
    backgroundColor: colors.primary[500],
    borderRadius: radius.full,
    paddingHorizontal: spacing[3], paddingVertical: spacing[1],
  },
  payBtnText: { fontSize: fontSize.sm, color: colors.white, fontWeight: fontWeight.medium },
  listContent: { paddingBottom: spacing[8] },
});
