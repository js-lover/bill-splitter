import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../types/navigation';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import { fontSize, fontWeight } from '../../constants/typography';

type Props = StackScreenProps<AuthStackParamList, 'PhoneInput'>;

// Test number configured in Supabase Dashboard → Auth → Phone → Test phone numbers
const DEV_TEST_PHONE = '5300000000';
const DEV_TEST_FORMATTED = '+905300000000';

export function PhoneInputScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSend(overridePhone?: string) {
    const raw = overridePhone ?? phone;
    const cleaned = raw.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setError('Geçerli bir telefon numarası girin');
      return;
    }
    const formatted = cleaned.startsWith('90') ? `+${cleaned}` : `+90${cleaned}`;
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithOtp({ phone: formatted });
    setLoading(false);
    if (err) {
      setError(`Kod gönderilemedi: ${err.message}`);
      return;
    }
    navigation.navigate('OTPVerification', { phoneNumber: formatted });
  }

  function useTestNumber() {
    setPhone(DEV_TEST_PHONE);
    // small delay so state updates before send
    setTimeout(() => handleSend(DEV_TEST_PHONE), 100);
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>
        <View style={styles.top}>
          <Text style={styles.title}>Telefon Numaranız</Text>
          <Text style={styles.subtitle}>SMS ile doğrulama kodu göndereceğiz.</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Telefon Numarası"
            placeholder="5XX XXX XXXX"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            error={error}
          />
          <Button label="Doğrulama Kodu Gönder" onPress={() => handleSend()} loading={loading} />

          {__DEV__ && (
            <View style={styles.devBox}>
              <Text style={styles.devTitle}>🧪 Simulator Test Modu</Text>
              <Text style={styles.devDesc}>
                Supabase Dashboard → Authentication → Phone → Test phone numbers bölümüne şunu ekleyin:
              </Text>
              <View style={styles.devCode}>
                <Text style={styles.devCodeText}>Numara: {DEV_TEST_FORMATTED}</Text>
                <Text style={styles.devCodeText}>OTP: 123456</Text>
              </View>
              <TouchableOpacity
                style={styles.devBtn}
                onPress={useTestNumber}
                disabled={loading}
              >
                <Text style={styles.devBtnText}>Test Numarası ile Giriş Yap</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  inner: { flex: 1, paddingHorizontal: spacing.screenH, justifyContent: 'space-between', paddingBottom: spacing[10] },
  top: { paddingTop: spacing[8], gap: spacing[2] },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.neutral[900] },
  subtitle: { fontSize: fontSize.base, color: colors.neutral[500] },
  form: { gap: spacing[4] },

  devBox: {
    backgroundColor: colors.warning[100],
    borderRadius: radius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.warning[500],
    gap: spacing[2],
  },
  devTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
  },
  devDesc: {
    fontSize: fontSize.sm,
    color: colors.neutral[700],
    lineHeight: 18,
  },
  devCode: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing[3],
    gap: spacing[1],
  },
  devCodeText: {
    fontSize: fontSize.sm,
    fontFamily: 'monospace',
    color: colors.neutral[900],
    fontWeight: fontWeight.semibold,
  },
  devBtn: {
    backgroundColor: colors.warning[500],
    borderRadius: radius.md,
    padding: spacing[3],
    alignItems: 'center',
  },
  devBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
});
