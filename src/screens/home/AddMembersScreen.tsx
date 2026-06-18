import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, Share, Alert, Clipboard,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import { fontSize, fontWeight } from '../../constants/typography';
import { Button } from '../../components/ui/Button';
import type { HomeStackParamList } from '../../types/navigation';

type NavProp = StackNavigationProp<HomeStackParamList, 'AddMembers'>;
type RouteP = RouteProp<HomeStackParamList, 'AddMembers'>;

export function AddMembersScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteP>();
  const { groupId } = route.params;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { mutate: generateInvite, isPending } = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('group_invites')
        .insert({ group_id: groupId, created_by: user!.id })
        .select('token')
        .single();
      if (error) throw error;
      return `orkakesap://join?token=${data.token}`;
    },
    onSuccess: (link) => {
      setInviteLink(link);
    },
    onError: () => {
      Alert.alert('Hata', 'Davet linki oluşturulamadı.');
    },
  });

  const handleShare = async () => {
    if (!inviteLink) return;
    try {
      await Share.share({
        message: `Ortak Hesap grubuna katılmak için bu linke tıkla: ${inviteLink}`,
        title: 'Gruba Davet',
      });
    } catch {}
  };

  const handleCopy = () => {
    if (!inviteLink) return;
    Clipboard.setString(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDone = () => {
    queryClient.invalidateQueries({ queryKey: ['groups'] });
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.illustration}>
          <Feather name="users" size={56} color={colors.primary[500]} />
        </View>

        <Text style={styles.title}>Üyeleri Davet Et</Text>
        <Text style={styles.desc}>
          Bir davet linki oluşturun ve arkadaşlarınızla paylaşın.
          Link 7 gün geçerlidir.
        </Text>

        {!inviteLink ? (
          <Button
            label="Davet Linki Oluştur"
            onPress={() => generateInvite()}
            loading={isPending}
          />
        ) : (
          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={2} selectable>
              {inviteLink}
            </Text>
            <View style={styles.linkActions}>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                <Feather
                  name={copied ? 'check' : 'copy'}
                  size={18}
                  color={copied ? colors.success[500] : colors.primary[500]}
                />
                <Text style={[styles.copyText, copied && styles.copyTextDone]}>
                  {copied ? 'Kopyalandı' : 'Kopyala'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                <Feather name="share-2" size={18} color={colors.white} />
                <Text style={styles.shareText}>Paylaş</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {inviteLink && (
          <TouchableOpacity style={styles.newLinkBtn} onPress={() => generateInvite()}>
            <Text style={styles.newLinkText}>Yeni link oluştur</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <Button
          label="Grubu Aç"
          onPress={handleDone}
          variant="primary"
        />
        <TouchableOpacity style={styles.skipBtn} onPress={handleDone}>
          <Text style={styles.skipText}>Şimdi değil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  content: {
    flex: 1, padding: spacing[6],
    alignItems: 'center', justifyContent: 'center',
  },
  illustration: {
    width: 96, height: 96,
    borderRadius: radius.full,
    backgroundColor: colors.primary[50],
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing[5],
  },
  title: {
    fontSize: fontSize.xl, fontWeight: fontWeight.bold,
    color: colors.neutral[900], textAlign: 'center',
    marginBottom: spacing[2],
  },
  desc: {
    fontSize: fontSize.base, color: colors.neutral[500],
    textAlign: 'center', lineHeight: 22,
    marginBottom: spacing[6],
  },
  linkBox: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.neutral[200],
    padding: spacing[4],
  },
  linkText: {
    fontSize: fontSize.sm, color: colors.neutral[700],
    fontFamily: 'monospace',
    marginBottom: spacing[3],
  },
  linkActions: {
    flexDirection: 'row', gap: spacing[2],
  },
  copyBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: spacing[1],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.primary[500],
  },
  copyText: {
    fontSize: fontSize.md, fontWeight: fontWeight.medium,
    color: colors.primary[500],
  },
  copyTextDone: { color: colors.success[500] },
  shareBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: spacing[1],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    backgroundColor: colors.primary[500],
  },
  shareText: {
    fontSize: fontSize.md, fontWeight: fontWeight.medium,
    color: colors.white,
  },
  newLinkBtn: { marginTop: spacing[3] },
  newLinkText: {
    fontSize: fontSize.sm, color: colors.neutral[400],
    textDecorationLine: 'underline',
  },
  footer: {
    padding: spacing[4], gap: spacing[2],
    borderTopWidth: 1, borderTopColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
  skipBtn: { alignItems: 'center', paddingVertical: spacing[2] },
  skipText: { fontSize: fontSize.md, color: colors.neutral[400] },
});
