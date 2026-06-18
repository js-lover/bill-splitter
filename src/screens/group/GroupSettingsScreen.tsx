import React, { useState } from 'react';
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
import { Avatar } from '../../components/ui/Avatar';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import type { HomeStackParamList } from '../../types/navigation';

type NavProp = StackNavigationProp<HomeStackParamList, 'GroupSettings'>;
type RouteP = RouteProp<HomeStackParamList, 'GroupSettings'>;

export function GroupSettingsScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteP>();
  const { groupId } = route.params;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [newTitle, setNewTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['group', groupId],
    queryFn: async () => {
      const { data, error } = await supabase.from('groups').select('*').eq('id', groupId).single();
      if (error) throw error;
      if (!editingTitle) setNewTitle(data.title);
      return data;
    },
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['group-members', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_members').select('*, users(id, full_name, avatar_url)').eq('group_id', groupId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const isOwner = group?.created_by === user?.id;

  const { mutate: updateTitle, isPending: updatingTitle } = useMutation({
    mutationFn: async () => {
      const trimmed = newTitle.trim();
      if (!trimmed) throw new Error('Grup adı boş olamaz');
      const { error } = await supabase.from('groups').update({ title: trimmed }).eq('id', groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setEditingTitle(false);
      Alert.alert('Başarılı', 'Grup adı güncellendi.');
    },
    onError: (err: any) => Alert.alert('Hata', err.message),
  });

  const { mutate: removeMember } = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
    },
    onError: () => Alert.alert('Hata', 'Üye çıkarılamadı.'),
  });

  const { mutate: deleteGroup, isPending: deleting } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('groups')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      navigation.navigate('Home');
    },
    onError: () => Alert.alert('Hata', 'Grup silinemedi.'),
  });

  const handleRemoveMember = (memberId: string, name: string) => {
    if (memberId === group?.created_by) {
      Alert.alert('Uyarı', 'Grup sahibi çıkarılamaz.');
      return;
    }
    Alert.alert('Üyeyi Çıkar', `${name} grubdan çıkarılsın mı?`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkar', style: 'destructive', onPress: () => removeMember(memberId) },
    ]);
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      'Grubu Sil',
      'Bu grubu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => deleteGroup() },
      ],
    );
  };

  if (groupLoading || membersLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary[500]} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Rename group */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grup Adı</Text>
          {editingTitle ? (
            <View style={styles.editRow}>
              <View style={{ flex: 1 }}>
                <Input
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="Grup adı"
                  autoFocus
                />
              </View>
              <Button
                label="Kaydet"
                onPress={() => updateTitle()}
                loading={updatingTitle}
                variant="primary"
              />
              <TouchableOpacity onPress={() => { setEditingTitle(false); setNewTitle(group?.title ?? ''); }}>
                <Text style={styles.cancelText}>İptal</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.titleRow}
              onPress={() => isOwner && setEditingTitle(true)}
            >
              <Text style={styles.groupTitle}>{group?.title}</Text>
              {isOwner && <Feather name="edit-2" size={16} color={colors.neutral[400]} />}
            </TouchableOpacity>
          )}
        </View>

        {/* Members */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Üyeler ({members.length})</Text>
          {(members as any[]).map((m: any) => (
            <View key={m.user_id} style={styles.memberRow}>
              <Avatar name={m.users?.full_name ?? '?'} avatarUrl={m.users?.avatar_url} size="md" />
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{m.users?.full_name ?? 'Bilinmeyen'}</Text>
                {m.user_id === group?.created_by && (
                  <Text style={styles.ownerBadge}>Sahibi</Text>
                )}
              </View>
              {isOwner && m.user_id !== user?.id && (
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemoveMember(m.user_id, m.users?.full_name ?? '?')}
                >
                  <Feather name="user-x" size={18} color={colors.danger[500]} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Danger zone */}
        {isOwner && (
          <View style={styles.dangerSection}>
            <Text style={styles.dangerTitle}>Tehlikeli Bölge</Text>
            <TouchableOpacity
              style={styles.deleteGroupBtn}
              onPress={handleDeleteGroup}
              disabled={deleting}
            >
              <Feather name="trash-2" size={18} color={colors.danger[500]} />
              <Text style={styles.deleteGroupText}>Grubu Sil</Text>
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

  section: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing[4], marginBottom: spacing[4],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionTitle: {
    fontSize: fontSize.sm, fontWeight: fontWeight.semibold,
    color: colors.neutral[500], marginBottom: spacing[3],
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  titleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: spacing[1],
  },
  groupTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.neutral[900] },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  cancelText: { fontSize: fontSize.md, color: colors.neutral[500] },

  memberRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing[3], paddingVertical: spacing[2],
    borderBottomWidth: 1, borderBottomColor: colors.neutral[100],
  },
  memberName: { fontSize: fontSize.base, color: colors.neutral[900] },
  ownerBadge: { fontSize: fontSize.xs, color: colors.primary[500], fontWeight: fontWeight.medium },
  removeBtn: { padding: spacing[1] },

  dangerSection: {
    backgroundColor: colors.danger[100], borderRadius: radius.lg,
    padding: spacing[4], borderWidth: 1, borderColor: colors.danger[500],
  },
  dangerTitle: {
    fontSize: fontSize.sm, fontWeight: fontWeight.semibold,
    color: colors.danger[500], marginBottom: spacing[3],
  },
  deleteGroupBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    padding: spacing[3], borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.danger[500],
  },
  deleteGroupText: {
    fontSize: fontSize.base, fontWeight: fontWeight.medium,
    color: colors.danger[500],
  },
});
