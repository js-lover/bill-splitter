import React, { useState } from 'react';
import {
  View, Text, StyleSheet,
  TouchableOpacity, ScrollView, Alert} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import { fontSize, fontWeight } from '../../constants/typography';
import { GROUP_CATEGORIES, type GroupCategory } from '../../constants/categories';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import type { HomeStackParamList } from '../../types/navigation';

type NavProp = StackNavigationProp<HomeStackParamList, 'CreateGroup'>;

export function CreateGroupScreen() {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GroupCategory>('diger');
  const [titleError, setTitleError] = useState('');

  const { mutate: createGroup, isPending } = useMutation({
    mutationFn: async () => {
      const trimmed = title.trim();
      if (!trimmed) {
        setTitleError('Grup adı zorunludur');
        throw new Error('validation');
      }
      setTitleError('');

      const { data: group, error: gErr } = await supabase
        .from('groups')
        .insert({ title: trimmed, category, created_by: user!.id })
        .select()
        .single();
      if (gErr) throw gErr;

      const { error: mErr } = await supabase
        .from('group_members')
        .insert({ group_id: group.id, user_id: user!.id, role: 'owner' });
      if (mErr) throw mErr;

      return group;
    },
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      navigation.replace('AddMembers', { groupId: group.id });
    },
    onError: (err: any) => {
      if (err.message !== 'validation') {
        Alert.alert('Hata', 'Grup oluşturulamadı. Lütfen tekrar deneyin.');
      }
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>Grubu nasıl adlandırmak istersiniz?</Text>

        <Input
          label="Grup Adı"
          value={title}
          onChangeText={(t) => { setTitle(t); if (titleError) setTitleError(''); }}
          placeholder="Örn: Tatil, Ev Masrafları"
          maxLength={50}
          error={titleError}
          autoFocus
        />

        <Text style={styles.catLabel}>Kategori</Text>
        <View style={styles.catGrid}>
          {GROUP_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.catChip,
                category === cat.value && styles.catChipActive,
              ]}
              onPress={() => setCategory(cat.value as GroupCategory)}
            >
              <Feather
                name={cat.icon as any}
                size={20}
                color={category === cat.value ? colors.white : colors.neutral[500]}
              />
              <Text style={[
                styles.catChipText,
                category === cat.value && styles.catChipTextActive,
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Devam Et"
          onPress={() => createGroup()}
          loading={isPending}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  scroll: { padding: spacing[4] },
  subtitle: {
    fontSize: fontSize.base, color: colors.neutral[500],
    marginBottom: spacing[5],
  },
  catLabel: {
    fontSize: fontSize.md, fontWeight: fontWeight.semibold,
    color: colors.neutral[700], marginTop: spacing[5], marginBottom: spacing[3],
  },
  catGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2],
  },
  catChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing[2], paddingHorizontal: spacing[3],
    borderRadius: radius.full,
    borderWidth: 1.5, borderColor: colors.neutral[200],
    backgroundColor: colors.white,
    gap: spacing[1],
  },
  catChipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  catChipText: {
    fontSize: fontSize.md, fontWeight: fontWeight.medium,
    color: colors.neutral[700],
  },
  catChipTextActive: { color: colors.white },
  footer: {
    padding: spacing[4],
    borderTopWidth: 1, borderTopColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
});
