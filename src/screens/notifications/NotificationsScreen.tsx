import React from 'react';
import {
  View, Text, StyleSheet,
  FlatList, TouchableOpacity, ActivityIndicator} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import { fontSize, fontWeight } from '../../constants/typography';
import { EmptyState } from '../../components/ui/EmptyState';

type NotifType =
  | 'expense_added' | 'payment_pending' | 'payment_confirmed'
  | 'payment_rejected' | 'nudge' | 'overdue_reminder' | 'bill_reminder';

const NOTIF_ICONS: Record<string, string> = {
  expense_added: 'dollar-sign',
  payment_pending: 'clock',
  payment_confirmed: 'check-circle',
  payment_rejected: 'x-circle',
  nudge: 'zap',
  overdue_reminder: 'alert-triangle',
  bill_reminder: 'bell',
};

const NOTIF_COLORS: Record<string, string> = {
  expense_added: colors.primary[500],
  payment_pending: colors.warning[500],
  payment_confirmed: colors.success[500],
  payment_rejected: colors.danger[500],
  nudge: colors.warning[500],
  overdue_reminder: colors.danger[500],
  bill_reminder: colors.info[500],
};

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins} dakika önce`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} saat önce`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} gün önce`;
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(new Date(dateStr));
}

export function NotificationsScreen() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { mutate: markRead } = useMutation({
    mutationFn: async (notifId: string) => {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const { mutate: markAllRead } = useMutation({
    mutationFn: async () => {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user!.id)
        .eq('is_read', false);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = (notifications as any[]).filter((n: any) => !n.is_read).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bildirimler</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => markAllRead()}>
            <Text style={styles.readAllBtn}>Tümünü Oku</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary[500]} />
      ) : (
        <FlatList
          data={notifications as any[]}
          keyExtractor={(item: any) => item.id}
          ListEmptyComponent={() => (
            <EmptyState
              icon="bell"
              title="Bildirim yok"
              subtitle="Yeni bildirimleriniz burada görünecek"
            />
          )}
          renderItem={({ item }: { item: any }) => {
            const iconName = NOTIF_ICONS[item.type as NotifType] ?? 'bell';
            const iconColor = NOTIF_COLORS[item.type as NotifType] ?? colors.neutral[500];
            return (
              <TouchableOpacity
                style={[styles.notifRow, !item.is_read && styles.notifRowUnread]}
                onPress={() => !item.is_read && markRead(item.id)}
              >
                {!item.is_read && <View style={styles.unreadDot} />}
                <View style={[styles.iconBox, { backgroundColor: iconColor + '20' }]}>
                  <Feather name={iconName as any} size={20} color={iconColor} />
                </View>
                <View style={styles.notifContent}>
                  <Text style={styles.notifTitle}>{item.title}</Text>
                  <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
                  <Text style={styles.notifTime}>{formatRelativeTime(item.created_at)}</Text>
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
  readAllBtn: { fontSize: fontSize.md, color: colors.primary[500], fontWeight: fontWeight.medium },

  notifRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: colors.white,
    padding: spacing[4], marginBottom: 1,
    position: 'relative',
  },
  notifRowUnread: { backgroundColor: colors.primary[50] },
  unreadDot: {
    position: 'absolute', left: spacing[2], top: spacing[4] + 8,
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.primary[500],
  },
  iconBox: {
    width: 44, height: 44, borderRadius: radius.full,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing[3], flexShrink: 0,
  },
  notifContent: { flex: 1 },
  notifTitle: {
    fontSize: fontSize.base, fontWeight: fontWeight.semibold,
    color: colors.neutral[900], marginBottom: 2,
  },
  notifBody: { fontSize: fontSize.md, color: colors.neutral[700], lineHeight: 20 },
  notifTime: { fontSize: fontSize.xs, color: colors.neutral[400], marginTop: spacing[1] },
  listContent: { paddingBottom: spacing[8] },
});
