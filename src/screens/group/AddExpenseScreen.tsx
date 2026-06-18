import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import { fontSize, fontWeight } from '../../constants/typography';
import { EXPENSE_CATEGORIES } from '../../constants/categories';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import type { HomeStackParamList } from '../../types/navigation';

type NavProp = StackNavigationProp<HomeStackParamList, 'AddExpense'>;
type RouteP = RouteProp<HomeStackParamList, 'AddExpense'>;

type SplitType = 'EQUAL' | 'PERCENTAGE' | 'EXACT';
const CURRENCIES = ['TRY', 'USD', 'EUR'];

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatAmount(n: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency', currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(n);
}

export function AddExpenseScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteP>();
  const { groupId, prefillData } = route.params;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState(prefillData?.total_amount?.toString() ?? '');
  const [currency, setCurrency] = useState('TRY');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [description, setDescription] = useState(prefillData?.vendor_name ?? '');
  const [category, setCategory] = useState(prefillData?.category ?? '');
  const [date, setDate] = useState(todayStr());
  const [paidBy, setPaidBy] = useState(user!.id);
  const [splitType, setSplitType] = useState<SplitType>('EQUAL');

  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set([user!.id]));
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});

  const { data: members = [] } = useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_members')
        .select('*, users(id, full_name, avatar_url)')
        .eq('group_id', groupId);
      if (error) throw error;
      const rows = (data ?? []) as Array<{ user_id: string; users: { id: string; full_name: string; avatar_url: string | null } }>;
      setSelectedParticipants(new Set(rows.map((m) => m.user_id)));
      return rows;
    },
  });

  const numAmount = parseFloat(amount.replace(',', '.')) || 0;

  const toggleParticipant = (uid: string) => {
    setSelectedParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) { if (next.size > 1) next.delete(uid); }
      else next.add(uid);
      return next;
    });
  };

  const selectedList = useMemo(
    () => members.filter((m) => selectedParticipants.has(m.user_id)),
    [members, selectedParticipants],
  );

  const equalShare = selectedList.length > 0 ? numAmount / selectedList.length : 0;

  const percentTotal = useMemo(() =>
    selectedList.reduce((s, m) => s + (parseFloat(percentages[m.user_id] ?? '0') || 0), 0),
    [selectedList, percentages],
  );

  const exactTotal = useMemo(() =>
    selectedList.reduce((s, m) => s + (parseFloat((exactAmounts[m.user_id] ?? '0').replace(',', '.')) || 0), 0),
    [selectedList, exactAmounts],
  );

  const { mutate: saveExpense, isPending } = useMutation({
    mutationFn: async () => {
      if (numAmount <= 0) throw new Error('Tutar sıfırdan büyük olmalı');
      if (!description.trim()) throw new Error('Açıklama zorunludur');
      if (selectedList.length === 0) throw new Error('En az bir katılımcı seçin');

      if (splitType === 'PERCENTAGE') {
        if (Math.abs(percentTotal - 100) > 0.01) throw new Error(`Yüzdeler toplamı %100 olmalı (şu an: %${percentTotal.toFixed(1)})`);
      }
      if (splitType === 'EXACT') {
        if (Math.abs(exactTotal - numAmount) > 0.01) throw new Error(`Tutarlar toplamı ${formatAmount(numAmount)} olmalı (şu an: ${formatAmount(exactTotal)})`);
      }

      const { data: expense, error: expErr } = await supabase
        .from('expenses')
        .insert({
          group_id: groupId,
          paid_by: paidBy,
          amount: numAmount,
          currency,
          description: description.trim(),
          category: category || null,
          split_type: splitType,
          date: date || todayStr(),
        })
        .select()
        .single();
      if (expErr) throw expErr;

      const participants = selectedList.map((m) => {
        let exactAmt: number;
        if (splitType === 'EQUAL') {
          exactAmt = equalShare;
        } else if (splitType === 'PERCENTAGE') {
          exactAmt = numAmount * (parseFloat(percentages[m.user_id] ?? '0') / 100);
        } else {
          exactAmt = parseFloat((exactAmounts[m.user_id] ?? '0').replace(',', '.')) || 0;
        }
        return { expense_id: expense.id, user_id: m.user_id, exact_amount: exactAmt };
      });

      const { error: partErr } = await supabase.from('expense_participants').insert(participants);
      if (partErr) throw partErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
      navigation.goBack();
    },
    onError: (err: any) => {
      Alert.alert('Hata', err.message ?? 'Harcama kaydedilemedi.');
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Amount */}
          <View style={styles.amountBox}>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0,00"
              placeholderTextColor={colors.neutral[300]}
              keyboardType="decimal-pad"
              autoFocus
            />
            <TouchableOpacity
              style={styles.currencyBtn}
              onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
            >
              <Text style={styles.currencyText}>{currency}</Text>
              <Feather name="chevron-down" size={16} color={colors.neutral[500]} />
            </TouchableOpacity>
          </View>
          {showCurrencyPicker && (
            <View style={styles.currencyPicker}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c} style={styles.currencyOption}
                  onPress={() => { setCurrency(c); setShowCurrencyPicker(false); }}
                >
                  <Text style={[styles.currencyOptionText, c === currency && styles.currencyOptionActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Açıklama</Text>
            <TextInput
              style={styles.textInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Ne için?"
              placeholderTextColor={colors.neutral[300]}
            />
          </View>

          {/* Date */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Tarih</Text>
            <TextInput
              style={styles.textInput}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-AA-GG"
              placeholderTextColor={colors.neutral[300]}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          {/* Category */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Kategori</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {EXPENSE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.catChip, category === cat.value && styles.catChipActive]}
                  onPress={() => setCategory(category === cat.value ? '' : cat.value)}
                >
                  <Feather
                    name={cat.icon as any}
                    size={14}
                    color={category === cat.value ? colors.white : colors.neutral[500]}
                  />
                  <Text style={[styles.catText, category === cat.value && styles.catTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Paid by */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Kim ödedi?</Text>
            <View style={styles.memberList}>
              {members.map((m) => (
                <TouchableOpacity
                  key={m.user_id}
                  style={[styles.paidByRow, paidBy === m.user_id && styles.paidByRowActive]}
                  onPress={() => setPaidBy(m.user_id)}
                >
                  <Avatar name={m.users.full_name} avatarUrl={m.users.avatar_url} size="sm" />
                  <Text style={[styles.memberName, paidBy === m.user_id && styles.memberNameActive]}>
                    {m.users.full_name}
                  </Text>
                  {paidBy === m.user_id && (
                    <Feather name="check" size={18} color={colors.primary[500]} style={{ marginLeft: 'auto' }} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Split method */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Bölüşüm</Text>
            <View style={styles.splitTabs}>
              {(['EQUAL', 'PERCENTAGE', 'EXACT'] as SplitType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.splitTab, splitType === type && styles.splitTabActive]}
                  onPress={() => setSplitType(type)}
                >
                  <Text style={[styles.splitTabText, splitType === type && styles.splitTabTextActive]}>
                    {type === 'EQUAL' ? 'Eşit' : type === 'PERCENTAGE' ? 'Yüzde' : 'Tutar'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Participants */}
            <View style={styles.participantList}>
              {members.map((m) => {
                const isSelected = selectedParticipants.has(m.user_id);
                return (
                  <View key={m.user_id} style={styles.participantRow}>
                    <TouchableOpacity
                      style={[styles.participantCheck, isSelected && styles.participantCheckActive]}
                      onPress={() => toggleParticipant(m.user_id)}
                    >
                      {isSelected && <Feather name="check" size={14} color={colors.white} />}
                    </TouchableOpacity>
                    <Avatar name={m.users.full_name} avatarUrl={m.users.avatar_url} size="sm" />
                    <Text style={styles.participantName}>{m.users.full_name}</Text>

                    {splitType === 'EQUAL' && isSelected && (
                      <Text style={styles.participantAmount}>{formatAmount(equalShare)}</Text>
                    )}

                    {splitType === 'PERCENTAGE' && isSelected && (
                      <View style={styles.inputSmall}>
                        <TextInput
                          style={styles.inputSmallText}
                          value={percentages[m.user_id] ?? ''}
                          onChangeText={(v) => setPercentages((p) => ({ ...p, [m.user_id]: v }))}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor={colors.neutral[300]}
                        />
                        <Text style={styles.inputSmallSuffix}>%</Text>
                      </View>
                    )}

                    {splitType === 'EXACT' && isSelected && (
                      <View style={styles.inputSmall}>
                        <TextInput
                          style={styles.inputSmallText}
                          value={exactAmounts[m.user_id] ?? ''}
                          onChangeText={(v) => setExactAmounts((p) => ({ ...p, [m.user_id]: v }))}
                          keyboardType="decimal-pad"
                          placeholder="0,00"
                          placeholderTextColor={colors.neutral[300]}
                        />
                        <Text style={styles.inputSmallSuffix}>₺</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {splitType === 'PERCENTAGE' && (
              <Text style={[
                styles.totalCheck,
                { color: Math.abs(percentTotal - 100) < 0.01 ? colors.success[500] : colors.danger[500] },
              ]}>
                Toplam: %{percentTotal.toFixed(1)} {Math.abs(percentTotal - 100) < 0.01 ? '✓' : '(100 olmalı)'}
              </Text>
            )}
            {splitType === 'EXACT' && numAmount > 0 && (
              <Text style={[
                styles.totalCheck,
                { color: Math.abs(exactTotal - numAmount) < 0.01 ? colors.success[500] : colors.danger[500] },
              ]}>
                Toplam: {formatAmount(exactTotal)} {Math.abs(exactTotal - numAmount) < 0.01 ? '✓' : `(${formatAmount(numAmount)} olmalı)`}
              </Text>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label="Harcamayı Kaydet"
            onPress={() => saveExpense()}
            loading={isPending}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  scroll: { padding: spacing[4], paddingBottom: spacing[8] },

  amountBox: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginBottom: spacing[5],
    backgroundColor: colors.white,
    borderRadius: radius.lg, padding: spacing[4],
    borderWidth: 1, borderColor: colors.neutral[200],
  },
  amountInput: {
    flex: 1, fontSize: 32, fontWeight: fontWeight.bold,
    color: colors.neutral[900], textAlign: 'center',
  },
  currencyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingLeft: spacing[2],
  },
  currencyText: {
    fontSize: fontSize.base, fontWeight: fontWeight.semibold,
    color: colors.neutral[500],
  },
  currencyPicker: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.neutral[200],
    marginBottom: spacing[3], overflow: 'hidden',
  },
  currencyOption: { padding: spacing[3] },
  currencyOptionText: { fontSize: fontSize.base, color: colors.neutral[700] },
  currencyOptionActive: { fontWeight: fontWeight.bold, color: colors.primary[500] },

  field: { marginBottom: spacing[5] },
  fieldLabel: {
    fontSize: fontSize.sm, fontWeight: fontWeight.semibold,
    color: colors.neutral[500], marginBottom: spacing[2],
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: colors.white,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.neutral[200],
    paddingHorizontal: spacing[3], paddingVertical: spacing[3],
    fontSize: fontSize.base, color: colors.neutral[900],
  },

  catScroll: { marginHorizontal: -spacing[1] },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: spacing[1] + 2, paddingHorizontal: spacing[3],
    borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.neutral[200],
    backgroundColor: colors.white,
    marginHorizontal: spacing[1],
  },
  catChipActive: { backgroundColor: colors.primary[500], borderColor: colors.primary[500] },
  catText: { fontSize: fontSize.sm, color: colors.neutral[700] },
  catTextActive: { color: colors.white },

  memberList: { gap: spacing[2] },
  paidByRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    padding: spacing[3], borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.neutral[200],
  },
  paidByRowActive: { borderColor: colors.primary[500], backgroundColor: colors.primary[50] },
  memberName: { fontSize: fontSize.base, color: colors.neutral[700] },
  memberNameActive: { color: colors.primary[500], fontWeight: fontWeight.medium },

  splitTabs: {
    flexDirection: 'row', marginBottom: spacing[4],
    backgroundColor: colors.neutral[100],
    borderRadius: radius.md, padding: 3,
  },
  splitTab: {
    flex: 1, paddingVertical: spacing[2],
    borderRadius: radius.sm - 2,
    alignItems: 'center',
  },
  splitTabActive: { backgroundColor: colors.white, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  splitTabText: { fontSize: fontSize.md, color: colors.neutral[500] },
  splitTabTextActive: { fontWeight: fontWeight.semibold, color: colors.neutral[900] },

  participantList: { gap: spacing[2] },
  participantRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    padding: spacing[2],
  },
  participantCheck: {
    width: 22, height: 22, borderRadius: radius.sm,
    borderWidth: 1.5, borderColor: colors.neutral[300],
    alignItems: 'center', justifyContent: 'center',
  },
  participantCheckActive: { backgroundColor: colors.primary[500], borderColor: colors.primary[500] },
  participantName: { flex: 1, fontSize: fontSize.base, color: colors.neutral[700] },
  participantAmount: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.neutral[900] },

  inputSmall: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: colors.neutral[200],
    borderRadius: radius.sm, overflow: 'hidden',
    width: 80,
  },
  inputSmallText: {
    flex: 1, paddingHorizontal: spacing[2], paddingVertical: spacing[1] + 2,
    fontSize: fontSize.md, color: colors.neutral[900], textAlign: 'right',
  },
  inputSmallSuffix: {
    paddingHorizontal: spacing[1],
    fontSize: fontSize.md, color: colors.neutral[500],
  },
  totalCheck: {
    fontSize: fontSize.sm, marginTop: spacing[2],
    fontWeight: fontWeight.medium,
  },
  footer: {
    padding: spacing[4], borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
});
