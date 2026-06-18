import React from 'react';
import {
  View, Text, StyleSheet, Clipboard, Alert,
  TouchableOpacity} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, type RouteProp } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';

import { colors } from '../../constants/colors';
import { spacing, radius } from '../../constants/spacing';
import { fontSize, fontWeight } from '../../constants/typography';
import type { DebtsStackParamList } from '../../types/navigation';

type RouteP = RouteProp<DebtsStackParamList, 'QRPayment'>;

function formatAmount(amount: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency', currency: 'TRY',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function QRPaymentScreen() {
  const route = useRoute<RouteP>();
  const { amount, ibanNumber, creditorName } = route.params;

  const qrContent = ibanNumber
    ? `TR-KAREKOD:IBAN=${ibanNumber};AMOUNT=${amount.toFixed(2)};NAME=${creditorName}`
    : `TR-KAREKOD:NAME=${creditorName};AMOUNT=${amount.toFixed(2)}`;

  const handleCopyIban = () => {
    if (!ibanNumber) return;
    Clipboard.setString(ibanNumber);
    Alert.alert('Kopyalandı', 'IBAN panoya kopyalandı.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>QR Kod ile Öde</Text>
        <Text style={styles.subtitle}>
          Bu QR kodu banka uygulamanızda okutun
        </Text>

        <View style={styles.qrCard}>
          <QRCode
            value={qrContent}
            size={200}
            color={colors.neutral[900]}
            backgroundColor={colors.white}
          />
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Alacaklı</Text>
            <Text style={styles.infoValue}>{creditorName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tutar</Text>
            <Text style={[styles.infoValue, styles.amountText]}>{formatAmount(amount)}</Text>
          </View>
          {ibanNumber ? (
            <TouchableOpacity style={styles.infoRow} onPress={handleCopyIban}>
              <Text style={styles.infoLabel}>IBAN</Text>
              <Text style={[styles.infoValue, styles.ibanText]} numberOfLines={1}>
                {ibanNumber}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {ibanNumber && (
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopyIban}>
            <Text style={styles.copyBtnText}>IBAN Kopyala</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  content: {
    flex: 1, padding: spacing[4],
    alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.xl, fontWeight: fontWeight.bold,
    color: colors.neutral[900], marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: fontSize.base, color: colors.neutral[500],
    textAlign: 'center', marginBottom: spacing[6],
  },
  qrCard: {
    backgroundColor: colors.white,
    padding: spacing[6],
    borderRadius: radius.xl,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
    marginBottom: spacing[5],
  },
  infoCard: {
    width: '100%', backgroundColor: colors.white,
    borderRadius: radius.lg, padding: spacing[4],
    borderWidth: 1, borderColor: colors.neutral[200],
    marginBottom: spacing[4],
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderBottomWidth: 1, borderBottomColor: colors.neutral[100],
  },
  infoLabel: { fontSize: fontSize.md, color: colors.neutral[500] },
  infoValue: {
    fontSize: fontSize.md, fontWeight: fontWeight.medium,
    color: colors.neutral[900], flex: 1, textAlign: 'right',
  },
  amountText: { color: colors.danger[500], fontWeight: fontWeight.bold, fontSize: fontSize.base },
  ibanText: { fontFamily: 'monospace', fontSize: fontSize.sm },

  copyBtn: {
    width: '100%', padding: spacing[4],
    borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.primary[500],
    alignItems: 'center',
  },
  copyBtnText: {
    fontSize: fontSize.base, fontWeight: fontWeight.semibold,
    color: colors.primary[500],
  },
});
