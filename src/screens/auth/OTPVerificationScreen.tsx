import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../types/navigation';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import { fontSize, fontWeight } from '../../constants/typography';

type Props = StackScreenProps<AuthStackParamList, 'OTPVerification'>;

const OTP_LENGTH = 6;
const DEV_TEST_OTP = '123456';

export function OTPVerificationScreen({ navigation, route }: Props) {
  const { phoneNumber } = route.params;
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function handleChange(value: string, index: number) {
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
    if (next.every(Boolean)) verify(next.join(''));
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !otp[index] && index > 0) inputs.current[index - 1]?.focus();
  }

  async function verify(code: string) {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase.auth.verifyOtp({
      phone: phoneNumber,
      token: code,
      type: 'sms',
    });
    setLoading(false);
    if (err) {
      setError('Kod hatalı veya süresi dolmuş. Tekrar deneyin.');
      setOtp(Array(OTP_LENGTH).fill(''));
      inputs.current[0]?.focus();
      return;
    }
    const isNew = !data.user?.user_metadata?.full_name;
    if (isNew) navigation.replace('ProfileSetup');
    // If existing user, RootNavigator session listener handles navigation
  }

  async function resend() {
    await supabase.auth.signInWithOtp({ phone: phoneNumber });
    setCountdown(60);
    setError('');
    setOtp(Array(OTP_LENGTH).fill(''));
    inputs.current[0]?.focus();
  }

  function fillTestOtp() {
    const digits = DEV_TEST_OTP.split('');
    setOtp(digits);
    verify(DEV_TEST_OTP);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.top}>
          <Text style={styles.title}>Doğrulama Kodu</Text>
          <Text style={styles.subtitle}>
            <Text style={styles.phone}>{phoneNumber}</Text>
            {' '}numarasına gönderilen 6 haneli kodu girin.
          </Text>
        </View>

        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(r) => { inputs.current[i] = r; }}
              style={[styles.otpBox, digit && styles.otpBoxFilled, !!error && styles.otpBoxError]}
              value={digit}
              onChangeText={(v) => handleChange(v, i)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              autoFocus={i === 0}
            />
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {loading && (
          <View style={styles.loadingRow}>
            <Button label="Doğrulanıyor..." loading disabled />
          </View>
        )}

        <TouchableOpacity onPress={resend} disabled={countdown > 0 || loading}>
          <Text style={[styles.resend, (countdown > 0 || loading) && styles.resendDisabled]}>
            {countdown > 0 ? `Tekrar gönder (${countdown}s)` : 'Kodu tekrar gönder'}
          </Text>
        </TouchableOpacity>

        {__DEV__ && (
          <View style={styles.devBox}>
            <Text style={styles.devTitle}>🧪 Test Modu</Text>
            <Text style={styles.devDesc}>
              Supabase test numarası için OTP: <Text style={styles.devCode}>{DEV_TEST_OTP}</Text>
            </Text>
            <TouchableOpacity
              style={styles.devBtn}
              onPress={fillTestOtp}
              disabled={loading}
            >
              <Text style={styles.devBtnText}>"{DEV_TEST_OTP}" ile Otomatik Doldur</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  inner: { flex: 1, paddingHorizontal: spacing.screenH, paddingTop: spacing[8], gap: spacing[5] },
  top: { gap: spacing[2] },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.neutral[900] },
  subtitle: { fontSize: fontSize.base, color: colors.neutral[500], lineHeight: 22 },
  phone: { fontWeight: fontWeight.semibold, color: colors.neutral[700] },
  otpRow: { flexDirection: 'row', gap: spacing[2], justifyContent: 'center' },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.neutral[300],
    textAlign: 'center',
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.neutral[900],
    backgroundColor: colors.white,
  },
  otpBoxFilled: { borderColor: colors.primary[500] },
  otpBoxError: { borderColor: colors.danger[500] },
  error: { fontSize: fontSize.sm, color: colors.danger[500], textAlign: 'center' },
  loadingRow: { alignItems: 'center' },
  resend: {
    fontSize: fontSize.base,
    color: colors.primary[500],
    textAlign: 'center',
    fontWeight: fontWeight.medium,
  },
  resendDisabled: { color: colors.neutral[400] },

  devBox: {
    backgroundColor: colors.warning[100],
    borderRadius: radius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.warning[500],
    gap: spacing[2],
  },
  devTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.neutral[900] },
  devDesc: { fontSize: fontSize.sm, color: colors.neutral[700] },
  devCode: { fontFamily: 'monospace', fontWeight: fontWeight.bold },
  devBtn: {
    backgroundColor: colors.warning[500],
    borderRadius: radius.md,
    padding: spacing[3],
    alignItems: 'center',
  },
  devBtnText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.white },
});
