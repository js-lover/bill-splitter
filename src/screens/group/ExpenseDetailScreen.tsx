import React from 'react';
import {
  View, Text, StyleSheet,
  ScrollView, TouchableOpacity, Alert, ActivityIndicator} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import { fontSize, fontWeight } from '../../constants/typography';
import { EXPENSE_CATEGORIES } from '../../constants/categories';
import { Avatar } from '../../components/ui/Avatar';
import type { HomeStackParamList } from '../../types/navigation';

type NavProp = StackNavigationProp<HomeStackParamList, 'ExpenseDetail'>;
type RouteP = RouteProp<HomeStackParamList, 'ExpenseDetail'>;

function formatAmount(amount: number, currency = 'TRY') {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency', currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(dateStr));
}

function splitTypeLabel(t: string) {
  if (t === 'EQUAL') return 'Eşit bölüşüm';
  if (t === 'PERCENTAGE') return 'Yüzde bölüşüm';
  if (t === 'EXACT') return 'Tutar bölüşüm';
  return t;
}

export function ExpenseDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteP>();
  const { expenseId, groupId } = route.params;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: expense, isLoading: expLoading } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, payer:users!paid_by(id, full_name, avatar_url)')
        .eq('id', expenseId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: participants = [], isLoading: partLoading } = useQuery({
    queryKey: ['expense-participants', expenseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense_participants')
        .select('*, users(id, full_name, avatar_url)')
        .eq('expense_id', expenseId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { mutate: deleteExpense, isPending: deleting } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
      navigation.goBack();
    },
    onError: () => Alert.alert('Hata', 'Harcama silinemedi.'),
  });

  const handleDelete = () => {
    Alert.alert(
      'Harcamayı Sil',
      'Bu harcamayı silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => deleteExpense() },
      ],
    );
  };

  if (expLoading || partLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary[500]} />
      </SafeAreaView>
    );
  }

  if (!expense) return null;

  const isOwner = expense.paid_by === user?.id;
  const catEntry = EXPENSE_CATEGORIES.find((c) => c.value === expense.category);
  const participantTotal = participants.reduce((s: number, p: any) => s + Number(p.exact_amount ?? 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Amount hero */}
        <View style={styles.amountCard}>
          {catEntry && (
            <View style={styles.catIcon}>
              <Feather name={catEntry.icon as any} size={22} color={colors.primary[500]} />
            </View>
          )}
          <Text style={styles.amountText}>
            {formatAmount(expense.amount, expense.currency)}
          </Text>
          <Text style={styles.descText}>{expense.description}</Text>
          <View style={styles.metaRow}>
            {catEntry && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{catEntry.label}</Text>
              </View>
            )}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{splitTypeLabel(expense.split_type)}</Text>
            </View>
          </View>
          {expense.date && (
            <Text style={styles.dateText}>{formatDate(expense.date)}</Text>
          )}
        </View>

        {/* Paid by */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ödeyen</Text>
          <View style={styles.payerRow}>
            <Avatar
              name={expense.payer?.full_name ?? '?'}
              avatarUrl={expense.payer?.avatar_url}
              size="md"
            />
            <Text style={styles.payerName}>{expense.payer?.full_name ?? 'Bilinmeyen'}</Text>
          </View>
        </View>

        {/* Participants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Katılımcılar</Text>
          <View style={styles.participantList}>
            {participants.map((p: any) => (
              <View key={p.user_id} style={styles.participantRow}>
                <Avatar name={p.users?.full_name ?? '?'} avatarUrl={p.users?.avatar_url} size="sm" />
                <Text style={styles.participantName}>{p.users?.full_name ?? 'Bilinmeyen'}</Text>
                <Text style={styles.participantAmount}>
                  {formatAmount(p.exact_amount ?? 0, expense.currency)}
                </Text>
              </View>
            ))}
            <View style={[styles.participantRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Toplam</Text>
              <Text style={styles.totalAmount}>
                {formatAmount(participantTotal, expense.currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        {isOwner && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDelete}
              disabled={deleting}
            >
              <Feather name="trash-2" size={18} color={colors.danger[500]} />
              <Text style={styles.deleteBtnText}>Harcamayı Sil</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  scroll: { padding: spacing[4], paddingBottom: spacing[8] },

  amountCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg, padding: spacing[5],
    alignItems: 'center', marginBottom: spacing[4],
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  catIcon: {
    width: 48, height: 48, borderRadius: radius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing[3],
  },
  amountText: {
    fontSize: 32, fontWeight: fontWeight.bold,
    color: colors.neutral[900], marginBottom: spacing[1],
  },
  descText: {
    fontSize: fontSize.lg, color: colors.neutral[700],
    marginBottom: spacing[3],
  },
  metaRow: { flexDirection: 'row', gap: spacing[2], flexWrap: 'wrap', justifyContent: 'center' },
  badge: {
    backgroundColor: colors.primary[50],
    borderRadius: radius.full,
    paddingHorizontal: spacing[3], paddingVertical: spacing[1],
  },
  badgeText: { fontSize: fontSize.sm, color: colors.primary[500], fontWeight: fontWeight.medium },
  dateText: { fontSize: fontSize.sm, color: colors.neutral[400], marginTop: spacing[2] },

  section: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing[4], marginBottom: spacing[3],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionTitle: {
    fontSize: fontSize.sm, fontWeight: fontWeight.semibold,
    color: colors.neutral[500], marginBottom: spacing[3],
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  payerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  payerName: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.neutral[900] },

  participantList: { gap: spacing[2] },
  participantRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    paddingVertical: spacing[1],
  },
  participantName: { flex: 1, fontSize: fontSize.base, color: colors.neutral[700] },
  participantAmount: {
    fontSize: fontSize.base, fontWeight: fontWeight.medium,
    color: colors.neutral[900],
  },
  totalRow: {
    borderTopWidth: 1, borderTopColor: colors.neutral[100],
    marginTop: spacing[2], paddingTop: spacing[2],
  },
  totalLabel: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.neutral[700] },
  totalAmount: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.neutral[900] },

  actions: { marginTop: spacing[2] },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing[2], padding: spacing[4],
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.danger[500],
    backgroundColor: colors.danger[100],
  },
  deleteBtnText: {
    fontSize: fontSize.base, fontWeight: fontWeight.medium,
    color: colors.danger[500],
  },
});
