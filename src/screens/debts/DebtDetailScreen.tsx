import React from 'react';
import {
  View, Text, StyleSheet,
  ScrollView, TouchableOpacity, Alert, Clipboard, ActivityIndicator, Linking} from 'react-native';
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
import { Avatar } from '../../components/ui/Avatar';
import type { DebtsStackParamList } from '../../types/navigation';

type NavProp = StackNavigationProp<DebtsStackParamList, 'DebtDetail'>;
type RouteP = RouteProp<DebtsStackParamList, 'DebtDetail'>;

function formatAmount(amount: number, currency = 'TRY') {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency', currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function DebtDetailScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteP>();
  const { debtId } = route.params;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: debt, isLoading } = useQuery({
    queryKey: ['debt', debtId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('debts')
        .select('*, creditor:users!creditor_id(id, full_name, avatar_url, iban, kolay_adres), groups(title)')
        .eq('id', debtId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { mutate: markSettled, isPending: settling } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('debts')
        .update({ is_settled: true, settled_at: new Date().toISOString() })
        .eq('id', debtId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-debts'] });
      queryClient.invalidateQueries({ queryKey: ['my-credits'] });
      navigation.goBack();
    },
    onError: () => Alert.alert('Hata', 'İşlem tamamlanamadı.'),
  });

  const handleMarkSettled = () => {
    Alert.alert(
      'Ödeme Onayı',
      `${formatAmount(debt?.amount ?? 0, debt?.currency)} tutarında ödeme yaptınız mı?`,
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Evet, Ödedim', onPress: () => markSettled() },
      ],
    );
  };

  const handleCopyIban = () => {
    const iban = debt?.creditor?.iban;
    if (!iban) return;
    Clipboard.setString(iban);
    Alert.alert('Kopyalandı', 'IBAN panoya kopyalandı.');
  };

  const handleBankApp = () => {
    Linking.openURL('https://www.google.com').catch(() =>
      Alert.alert('Hata', 'Banka uygulaması açılamadı.'),
    );
  };

  const handleShowQR = () => {
    if (!debt) return;
    navigation.navigate('QRPayment', {
      debtId: debt.id,
      amount: Number(debt.amount),
      ibanNumber: debt.creditor?.iban ?? '',
      creditorName: debt.creditor?.full_name ?? '',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary[500]} />
      </SafeAreaView>
    );
  }

  if (!debt) return null;

  const isDebtor = debt.debtor_id === user?.id;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Amount hero */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>{isDebtor ? 'Borcunuz' : 'Alacağınız'}</Text>
          <Text style={[styles.amount, { color: isDebtor ? colors.danger[500] : colors.success[500] }]}>
            {formatAmount(debt.amount, debt.currency)}
          </Text>
          <Text style={styles.groupName}>{debt.groups?.title ?? '—'}</Text>
        </View>

        {/* Creditor card */}
        <View style={styles.personCard}>
          <Text style={styles.cardLabel}>{isDebtor ? 'Alacaklı' : 'Borçlu'}</Text>
          <View style={styles.personRow}>
            <Avatar
              name={debt.creditor?.full_name ?? '?'}
              avatarUrl={debt.creditor?.avatar_url}
              size="lg"
            />
            <View style={styles.personInfo}>
              <Text style={styles.personName}>{debt.creditor?.full_name ?? 'Bilinmeyen'}</Text>
              {debt.creditor?.iban && (
                <Text style={styles.ibanText} numberOfLines={1}>{debt.creditor.iban}</Text>
              )}
              {debt.creditor?.kolay_adres && (
                <Text style={styles.kolayText}>{debt.creditor.kolay_adres}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Payment options — only shown to debtor */}
        {isDebtor && (
          <View style={styles.actionsCard}>
            <Text style={styles.cardLabel}>Ödeme Seçenekleri</Text>

            {debt.creditor?.iban && (
              <TouchableOpacity style={styles.actionRow} onPress={handleCopyIban}>
                <View style={styles.actionIcon}>
                  <Feather name="copy" size={20} color={colors.primary[500]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>IBAN Kopyala</Text>
                  <Text style={styles.actionDesc}>{debt.creditor.iban}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.neutral[400]} />
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.actionRow} onPress={handleBankApp}>
              <View style={styles.actionIcon}>
                <Feather name="external-link" size={20} color={colors.primary[500]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>Bankaya Git</Text>
                <Text style={styles.actionDesc}>Banka uygulamanızı açın</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.neutral[400]} />
            </TouchableOpacity>

            {debt.creditor?.iban && (
              <TouchableOpacity style={styles.actionRow} onPress={handleShowQR}>
                <View style={styles.actionIcon}>
                  <Feather name="maximize" size={20} color={colors.primary[500]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>QR Kod ile Öde</Text>
                  <Text style={styles.actionDesc}>TR Karekod göster</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.neutral[400]} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {isDebtor && (
          <TouchableOpacity
            style={[styles.settledBtn, settling && { opacity: 0.6 }]}
            onPress={handleMarkSettled}
            disabled={settling}
          >
            <Feather name="check-circle" size={20} color={colors.white} />
            <Text style={styles.settledBtnText}>Ödendi Olarak İşaretle</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  scroll: { padding: spacing[4], paddingBottom: spacing[8] },

  amountCard: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing[5], marginBottom: spacing[4],
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  amountLabel: { fontSize: fontSize.md, color: colors.neutral[500] },
  amount: { fontSize: 36, fontWeight: fontWeight.bold, marginVertical: spacing[1] },
  groupName: { fontSize: fontSize.sm, color: colors.neutral[400] },

  personCard: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing[4], marginBottom: spacing[4],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardLabel: {
    fontSize: fontSize.sm, fontWeight: fontWeight.semibold,
    color: colors.neutral[500], marginBottom: spacing[3],
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  personInfo: { flex: 1 },
  personName: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.neutral[900] },
  ibanText: { fontSize: fontSize.sm, color: colors.neutral[500], marginTop: 2, fontFamily: 'monospace' },
  kolayText: { fontSize: fontSize.sm, color: colors.primary[500], marginTop: 2 },

  actionsCard: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing[4], marginBottom: spacing[4],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: 1, borderBottomColor: colors.neutral[100],
  },
  actionIcon: {
    width: 40, height: 40, borderRadius: radius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center', justifyContent: 'center',
  },
  actionTitle: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.neutral[900] },
  actionDesc: { fontSize: fontSize.sm, color: colors.neutral[500] },

  settledBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing[2], padding: spacing[4],
    borderRadius: radius.lg, backgroundColor: colors.success[500],
  },
  settledBtnText: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.white },
});
