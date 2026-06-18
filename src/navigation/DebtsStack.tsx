import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { DebtsStackParamList } from '../types/navigation';
import { MyDebtsScreen } from '../screens/debts/MyDebtsScreen';
import { MyCreditsScreen } from '../screens/debts/MyCreditsScreen';
import { DebtDetailScreen } from '../screens/debts/DebtDetailScreen';
import { QRPaymentScreen } from '../screens/debts/QRPaymentScreen';
import { colors } from '../constants/colors';

const Stack = createStackNavigator<DebtsStackParamList>();

export function DebtsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.neutral[50], shadowOpacity: 0 },
        headerTintColor: colors.neutral[900],
      }}
    >
      <Stack.Screen name="MyDebts" component={MyDebtsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MyCredits" component={MyCreditsScreen} options={{ title: 'Alacaklarım' }} />
      <Stack.Screen name="DebtDetail" component={DebtDetailScreen} options={{ title: 'Borç Detayı' }} />
      <Stack.Screen name="QRPayment" component={QRPaymentScreen} options={{ title: 'QR Kod ile Öde' }} />
    </Stack.Navigator>
  );
}
