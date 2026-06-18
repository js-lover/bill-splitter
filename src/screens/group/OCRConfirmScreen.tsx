import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, Image, TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';

import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import { fontSize, fontWeight } from '../../constants/typography';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import type { HomeStackParamList } from '../../types/navigation';

type NavProp = StackNavigationProp<HomeStackParamList, 'OCRConfirm'>;
type RouteP = RouteProp<HomeStackParamList, 'OCRConfirm'>;

export function OCRConfirmScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteP>();
  const { imagePath, groupId } = route.params;

  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [processing] = useState(false);

  const handleConfirm = () => {
    if (!amount.trim()) {
      Alert.alert('Hata', 'Tutar zorunludur.');
      return;
    }
    navigation.navigate('AddExpense', {
      groupId,
      prefillData: {
        vendor_name: vendor.trim() || undefined,
        total_amount: parseFloat(amount.replace(',', '.')) || undefined,
        invoice_date: date || null,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Document thumbnail */}
        <View style={styles.imageCard}>
          <Image
            source={{ uri: imagePath }}
            style={styles.thumbnail}
            resizeMode="contain"
          />
          <View style={styles.ocrNote}>
            <Feather name="info" size={14} color={colors.info[500]} />
            <Text style={styles.ocrNoteText}>
              OCR özelliği yakında. Bilgileri manuel olarak düzenleyin.
            </Text>
          </View>
        </View>

        {/* Editable fields */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Harcama Bilgileri</Text>

          <Input
            label="Satıcı / Yer"
            value={vendor}
            onChangeText={setVendor}
            placeholder="Ör: Migros, ENKA"
          />
          <View style={{ marginTop: spacing[3] }}>
            <Input
              label="Tutar"
              value={amount}
              onChangeText={setAmount}
              placeholder="0,00"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={{ marginTop: spacing[3] }}>
            <Input
              label="Tarih"
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-AA-GG"
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </View>

        <Button
          label="Harcamaya Devam Et"
          onPress={handleConfirm}
          loading={processing}
        />

        <TouchableOpacity style={styles.retakeBtn} onPress={() => navigation.goBack()}>
          <Feather name="camera" size={16} color={colors.neutral[500]} />
          <Text style={styles.retakeText}>Yeniden Tara</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  scroll: { padding: spacing[4], paddingBottom: spacing[8] },

  imageCard: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    overflow: 'hidden', marginBottom: spacing[4],
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  thumbnail: { width: '100%', height: 200 },
  ocrNote: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    padding: spacing[3], backgroundColor: colors.info[100],
  },
  ocrNoteText: { flex: 1, fontSize: fontSize.sm, color: colors.neutral[700] },

  formCard: {
    backgroundColor: colors.white, borderRadius: radius.lg,
    padding: spacing[4], marginBottom: spacing[4],
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  formTitle: {
    fontSize: fontSize.base, fontWeight: fontWeight.semibold,
    color: colors.neutral[900], marginBottom: spacing[4],
  },

  retakeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing[2], marginTop: spacing[3],
    padding: spacing[3],
  },
  retakeText: { fontSize: fontSize.md, color: colors.neutral[500] },
});
