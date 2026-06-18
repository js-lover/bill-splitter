import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import { fontSize, fontWeight } from '../../constants/typography';
import { Avatar } from '../../components/ui/Avatar';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import type { ProfileStackParamList } from '../../types/navigation';

type NavProp = StackNavigationProp<ProfileStackParamList, 'Profile'>;

function validateIBAN(iban: string): boolean {
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  return /^TR\d{24}$/.test(cleaned);
}

export function ProfileScreen() {
  const navigation = useNavigation<NavProp>();
  const { user, setUser, clear } = useAuthStore();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [iban, setIban] = useState(user?.iban ?? '');
  const [kolayAdres, setKolayAdres] = useState(user?.kolay_adres ?? '');
  const [ibanError, setIbanError] = useState('');

  useEffect(() => {
    setFullName(user?.full_name ?? '');
    setIban(user?.iban ?? '');
    setKolayAdres(user?.kolay_adres ?? '');
  }, [user]);

  const { mutate: saveProfile, isPending: saving } = useMutation({
    mutationFn: async () => {
      const trimmedName = fullName.trim();
      if (!trimmedName) throw new Error('Ad Soyad zorunludur');

      const trimmedIban = iban.trim();
      if (trimmedIban && !validateIBAN(trimmedIban)) {
        setIbanError('Geçerli bir TR IBAN girin (TR + 24 rakam)');
        throw new Error('validation');
      }
      setIbanError('');

      const updates = {
        full_name: trimmedName,
        iban: trimmedIban || null,
        kolay_adres: kolayAdres.trim() || null,
      };

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user!.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setUser(data);
      Alert.alert('Kaydedildi', 'Profiliniz güncellendi.');
    },
    onError: (err: any) => {
      if (err.message !== 'validation') {
        Alert.alert('Hata', err.message ?? 'Profil güncellenemedi.');
      }
    },
  });

  const handleSignOut = () => {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap', style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          queryClient.clear();
          clear();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Profile header */}
          <View style={styles.profileHeader}>
            <Avatar
              name={user?.full_name ?? '?'}
              avatarUrl={user?.avatar_url}
              size="lg"
            />
            <Text style={styles.profileName}>{user?.full_name ?? 'Kullanıcı'}</Text>
            {user?.phone_number && (
              <Text style={styles.profilePhone}>{user.phone_number}</Text>
            )}
          </View>

          {/* Edit form */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profil Bilgileri</Text>

            <Input
              label="Ad Soyad"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Adınız ve soyadınız"
            />

            <View style={{ marginTop: spacing[3] }}>
              <Input
                label="IBAN (Opsiyonel)"
                value={iban}
                onChangeText={(v) => { setIban(v); if (ibanError) setIbanError(''); }}
                placeholder="TR000000000000000000000000"
                autoCapitalize="characters"
                keyboardType="default"
                error={ibanError}
              />
            </View>

            <View style={{ marginTop: spacing[3] }}>
              <Input
                label="Kolay Adres (Opsiyonel)"
                value={kolayAdres}
                onChangeText={setKolayAdres}
                placeholder="@kullaniciadiniz"
              />
            </View>

            <View style={{ marginTop: spacing[4] }}>
              <Button
                label="Değişiklikleri Kaydet"
                onPress={() => saveProfile()}
                loading={saving}
              />
            </View>
          </View>

          {/* Reminder settings link */}
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('ReminderSettings')}
          >
            <Feather name="bell" size={20} color={colors.neutral[700]} />
            <Text style={styles.linkText}>Hatırlatıcı Ayarları</Text>
            <Feather name="chevron-right" size={18} color={colors.neutral[400]} />
          </TouchableOpacity>

          {/* Sign out */}
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Feather name="log-out" size={20} color={colors.danger[500]} />
            <Text style={styles.signOutText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  scroll: { padding: spacing[4], paddingBottom: spacing[8] },

  profileHeader: {
    alignItems: 'center', paddingVertical: spacing[6],
    backgroundColor: colors.white, borderRadius: radius.lg,
    marginBottom: spacing[4],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  profileName: {
    fontSize: fontSize.xl, fontWeight: fontWeight.bold,
    color: colors.neutral[900], marginTop: spacing[3],
  },
  profilePhone: { fontSize: fontSize.md, color: colors.neutral[500], marginTop: spacing[1] },

  section: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing[4], marginBottom: spacing[3],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionTitle: {
    fontSize: fontSize.sm, fontWeight: fontWeight.semibold,
    color: colors.neutral[500], marginBottom: spacing[4],
    textTransform: 'uppercase', letterSpacing: 0.5,
  },

  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing[4], marginBottom: spacing[3],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  linkText: { flex: 1, fontSize: fontSize.base, color: colors.neutral[700] },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing[2], padding: spacing[4],
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.danger[500],
    backgroundColor: colors.danger[100],
    marginTop: spacing[2],
  },
  signOutText: {
    fontSize: fontSize.base, fontWeight: fontWeight.medium,
    color: colors.danger[500],
  },
});
