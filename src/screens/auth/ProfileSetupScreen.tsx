import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import type { AuthStackParamList } from '../../types/navigation';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { fontSize, fontWeight } from '../../constants/typography';

type Props = StackScreenProps<AuthStackParamList, 'ProfileSetup'>;

export function ProfileSetupScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleContinue() {
    if (!fullName.trim()) {
      setError('Ad Soyad zorunludur');
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: err } = await supabase.from('users').upsert({
      id: user.id,
      full_name: fullName.trim(),
      phone_number: user.phone,
    });
    setLoading(false);

    if (err) {
      setError('Bir hata oluştu. Tekrar deneyin.');
      return;
    }

    await supabase.auth.updateUser({ data: { full_name: fullName.trim() } });
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>
        <View style={styles.top}>
          <Text style={styles.title}>Profilinizi Oluşturun</Text>
          <Text style={styles.subtitle}>Adınızı girin, arkadaşlarınız sizi tanısın.</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Ad Soyad"
            placeholder="Adınız ve soyadınız"
            value={fullName}
            onChangeText={setFullName}
            error={error}
            autoCapitalize="words"
          />
          <Button label="Devam Et" onPress={handleContinue} loading={loading} />
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
});
