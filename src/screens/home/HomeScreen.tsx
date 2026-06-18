import React from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { StackScreenProps } from '@react-navigation/stack';
import type { AppTabParamList, HomeStackParamList } from '../../types/navigation';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { EmptyState } from '../../components/ui/EmptyState';
import { GroupCard } from '../../components/group/GroupCard';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { fontSize, fontWeight } from '../../constants/typography';
import { Feather } from '@expo/vector-icons';
import { formatAmountCompact } from '../../utils/formatCurrency';
import type { DbGroup } from '../../types/database';

type Props = CompositeScreenProps<
  StackScreenProps<HomeStackParamList, 'Home'>,
  BottomTabScreenProps<AppTabParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);

  const { data: groups, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DbGroup[];
    },
    enabled: !!user,
  });

  return (
    <SafeAreaView style={styles.container}>
      <OfflineBanner />
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Merhaba, {user?.full_name?.split(' ')[0]} 👋</Text>
          <Text style={styles.subtitle}>Grup harcamalarınız</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('CreateGroup')} style={styles.addBtn}>
          <Feather name="plus" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary[500]} style={{ marginTop: spacing[8] }} />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
          ListEmptyComponent={
            <EmptyState
              icon="users"
              title="Henüz grubunuz yok"
              subtitle="İlk grubu oluşturmak için + butonuna dokun"
              actionLabel="Grup Oluştur"
              onAction={() => navigation.navigate('CreateGroup')}
            />
          }
          renderItem={({ item }) => (
            <GroupCard group={item} onPress={() => navigation.navigate('GroupDetail', { groupId: item.id })} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenH,
    paddingTop: spacing[5],
    paddingBottom: spacing[4],
  },
  greeting: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.neutral[900] },
  subtitle: { fontSize: fontSize.md, color: colors.neutral[500], marginTop: 2 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: { paddingHorizontal: spacing.screenH, paddingBottom: spacing[8] },
});
