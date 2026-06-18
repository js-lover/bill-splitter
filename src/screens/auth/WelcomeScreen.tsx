import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../types/navigation';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import { fontSize, fontWeight } from '../../constants/typography';

type Props = StackScreenProps<AuthStackParamList, 'Welcome'>;

const DEV_EMAIL = 'test@ortakhesap.dev';
const DEV_PASSWORD = 'Test1234!';

export function WelcomeScreen({ navigation }: Props) {
  const [devLoading, setDevLoading] = useState(false);

  async function handleDevLogin() {
    setDevLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: DEV_EMAIL,
      password: DEV_PASSWORD,
    });
    setDevLoading(false);
    if (error) {
      Alert.alert(
        'Test Girişi Başarısız',
        `Supabase Dashboard → Authentication → Users bölümünde şu kullanıcıyı oluşturun:\n\nE-posta: ${DEV_EMAIL}\nŞifre: ${DEV_PASSWORD}\n\nHata: ${error.message}`,
      );
    }
    // On success, RootNavigator session listener handles navigation automatically
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>₺</Text>
        </View>
        <Text style={styles.title}>Ortak Hesap</Text>
        <Text style={styles.subtitle}>Grup harcamalarını kolayca böl ve takip et.</Text>
      </View>

      <View style={styles.actions}>
        <Button label="Telefon ile Devam Et" onPress={() => navigation.navigate('PhoneInput')} />

        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>veya</Text>
          <View style={styles.orLine} />
        </View>

        <Button label="Google ile Devam Et" variant="secondary" onPress={() => {}} disabled />
        <Button label="Apple ile Devam Et" variant="secondary" onPress={() => {}} disabled />

        {__DEV__ && (
          <TouchableOpacity
            style={styles.devBtn}
            onPress={handleDevLogin}
            disabled={devLoading}
          >
            {devLoading
              ? <ActivityIndicator color={colors.white} />
              : <Text style={styles.devBtnText}>🧪  Test Hesabıyla Giriş Yap</Text>
            }
          </TouchableOpacity>
        )}

        {__DEV__ && (
          <View style={styles.devInfo}>
            <Text style={styles.devInfoText}>
              Test hesabı: {DEV_EMAIL} / {DEV_PASSWORD}
            </Text>
            <Text style={styles.devInfoSub}>
              Dashboard → Authentication → Users → Add user
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    paddingHorizontal: spacing.screenH,
    justifyContent: 'space-between',
    paddingBottom: spacing[8],
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  logoText: { fontSize: 40, color: colors.white, fontWeight: fontWeight.bold },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.neutral[900] },
  subtitle: { fontSize: fontSize.base, color: colors.neutral[500], textAlign: 'center' },

  actions: { gap: spacing[3] },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  orLine: { flex: 1, height: 1, backgroundColor: colors.neutral[200] },
  orText: { fontSize: fontSize.sm, color: colors.neutral[400] },

  devBtn: {
    backgroundColor: colors.warning[500],
    borderRadius: radius.xl,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  devBtnText: { fontSize: fontSize.base, fontWeight: fontWeight.bold, color: colors.white },

  devInfo: {
    backgroundColor: colors.warning[100],
    borderRadius: radius.md,
    padding: spacing[3],
    alignItems: 'center',
    gap: spacing[1],
  },
  devInfoText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.neutral[700] },
  devInfoSub: { fontSize: fontSize.xs, color: colors.neutral[500] },
});
