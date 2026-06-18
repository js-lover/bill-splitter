import React, { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, ScrollView} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import { fontSize, fontWeight } from '../../constants/typography';
import { EXPENSE_CATEGORIES } from '../../constants/categories';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import type { HomeStackParamList } from '../../types/navigation';

type NavProp = StackNavigationProp<HomeStackParamList, 'GroupDetail'>;
type RouteP = RouteProp<HomeStackParamList, 'GroupDetail'>;

function formatAmount(amount: number, currency = 'TRY') {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency', currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDateShort(dateStr: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric', month: 'short',
  }).format(new Date(dateStr));
}

export function GroupDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteP>();
  const { groupId } = route.params;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups').select('*').eq('id', groupId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_members')
        .select('*, users(id, full_name, avatar_url)')
        .eq('group_id', groupId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: expenses = [], isLoading: expLoading } = useQuery({
    queryKey: ['expenses', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, payer:users!paid_by(id, full_name, avatar_url)')
        .eq('group_id', groupId)
        .order('date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`group-detail-${groupId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'expenses',
        filter: `group_id=eq.${groupId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [groupId, queryClient]);

  const myBalance = useCallback(() => {
    let paid = 0;
    let owed = 0;
    expenses.forEach((exp: any) => {
      if (exp.paid_by === user?.id) paid += Number(exp.amount);
    });
    return paid - owed;
  }, [expenses, user]);

  const getCategoryIcon = (cat: string | null) => {
    const found = EXPENSE_CATEGORIES.find((c) => c.value === cat);
    return found?.icon ?? 'more-horizontal';
  };

  if (groupLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary[500]} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Feather name="arrow-left" size={22} color={colors.neutral[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {group?.title ?? 'Grup'}
        </Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('GroupSettings', { groupId })}
        >
          <Feather name="settings" size={22} color={colors.neutral[900]} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item: any) => item.id}
        ListHeaderComponent={() => (
          <>
            {/* Balance card */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceRow}>
                <View>
                  <Text style={styles.balanceLabel}>Toplam Harcama</Text>
                  <Text style={styles.balanceAmount}>
                    {formatAmount(expenses.reduce((s: number, e: any) => s + Number(e.amount), 0))}
                  </Text>
                </View>
                <View style={styles.myBalanceBox}>
                  <Text style={styles.balanceLabel}>Bakiyem</Text>
                  <Text style={[
                    styles.myBalance,
                    { color: myBalance() >= 0 ? colors.success[500] : colors.danger[500] },
                  ]}>
                    {myBalance() >= 0 ? '+' : ''}{formatAmount(myBalance())}
                  </Text>
                </View>
              </View>
            </View>

            {/* Members */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Üyeler</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.membersScroll}>
                {members.map((m: any) => (
                  <View key={m.user_id} style={styles.memberItem}>
                    <Avatar
                      name={m.users?.full_name ?? '?'}
                      avatarUrl={m.users?.avatar_url}
                      size="md"
                    />
                    <Text style={styles.memberName} numberOfLines={1}>
                      {m.users?.full_name?.split(' ')[0] ?? '?'}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.sectionTitle2}>Harcamalar</Text>
          </>
        )}
        ListEmptyComponent={() =>
          expLoading ? null : (
            <EmptyState
              icon="dollar-sign"
              title="Henüz harcama yok"
              subtitle="İlk harcamayı eklemek için + butonuna bas"
            />
          )
        }
        renderItem={({ item }: { item: any }) => (
          <TouchableOpacity
            style={styles.expenseRow}
            onPress={() =>
              navigation.navigate('ExpenseDetail', {
                expenseId: item.id, groupId,
              })
            }
          >
            <View style={styles.expenseCatBox}>
              <Feather
                name={getCategoryIcon(item.category) as any}
                size={18}
                color={colors.primary[500]}
              />
            </View>
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseDesc} numberOfLines={1}>{item.description}</Text>
              <Text style={styles.expenseMeta}>
                {item.payer?.full_name ?? 'Bilinmeyen'} · {item.date ? formatDateShort(item.date) : '—'}
              </Text>
            </View>
            <Text style={styles.expenseAmount}>{formatAmount(item.amount, item.currency)}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddExpense', { groupId })}
      >
        <Feather name="plus" size={26} color={colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
    backgroundColor: colors.white,
    borderBottomWidth: 1, borderBottomColor: colors.neutral[200],
  },
  headerBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: fontSize.base, fontWeight: fontWeight.semibold,
    color: colors.neutral[900],
  },
  balanceCard: {
    margin: spacing[4],
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  balanceLabel: { fontSize: fontSize.sm, color: colors.neutral[500] },
  balanceAmount: {
    fontSize: fontSize.xl, fontWeight: fontWeight.bold,
    color: colors.neutral[900], marginTop: spacing[1],
  },
  myBalanceBox: { alignItems: 'flex-end' },
  myBalance: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginTop: spacing[1] },
  section: { paddingHorizontal: spacing[4], marginBottom: spacing[4] },
  sectionTitle: {
    fontSize: fontSize.sm, fontWeight: fontWeight.semibold,
    color: colors.neutral[500], marginBottom: spacing[2],
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  sectionTitle2: {
    fontSize: fontSize.sm, fontWeight: fontWeight.semibold,
    color: colors.neutral[500], marginBottom: spacing[2],
    textTransform: 'uppercase', letterSpacing: 0.5,
    paddingHorizontal: spacing[4],
  },
  membersScroll: { marginHorizontal: -spacing[1] },
  memberItem: { alignItems: 'center', marginHorizontal: spacing[2], width: 56 },
  memberName: {
    fontSize: fontSize.xs, color: colors.neutral[700],
    marginTop: spacing[1], textAlign: 'center',
  },
  expenseRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing[4], marginBottom: spacing[2],
    borderRadius: radius.md,
    padding: spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  expenseCatBox: {
    width: 40, height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing[3],
  },
  expenseInfo: { flex: 1 },
  expenseDesc: {
    fontSize: fontSize.base, fontWeight: fontWeight.medium,
    color: colors.neutral[900],
  },
  expenseMeta: { fontSize: fontSize.sm, color: colors.neutral[500], marginTop: 2 },
  expenseAmount: {
    fontSize: fontSize.base, fontWeight: fontWeight.semibold,
    color: colors.neutral[900], marginLeft: spacing[2],
  },
  listContent: { paddingBottom: 80 },
  fab: {
    position: 'absolute', right: spacing[4], bottom: spacing[6],
    width: 56, height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary[500],
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
