import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { HomeStackParamList } from '../types/navigation';
import { HomeScreen } from '../screens/home/HomeScreen';
import { CreateGroupScreen } from '../screens/home/CreateGroupScreen';
import { AddMembersScreen } from '../screens/home/AddMembersScreen';
import { GroupDetailScreen } from '../screens/group/GroupDetailScreen';
import { GroupSettingsScreen } from '../screens/group/GroupSettingsScreen';
import { AddExpenseScreen } from '../screens/group/AddExpenseScreen';
import { ExpenseDetailScreen } from '../screens/group/ExpenseDetailScreen';
import { DocumentScanScreen } from '../screens/group/DocumentScanScreen';
import { OCRConfirmScreen } from '../screens/group/OCRConfirmScreen';
import { colors } from '../constants/colors';

const Stack = createStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.neutral[50], shadowOpacity: 0 },
        headerTintColor: colors.neutral[900],
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: 'Grup Oluştur' }} />
      <Stack.Screen name="AddMembers" component={AddMembersScreen} options={{ title: 'Üye Ekle' }} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="GroupSettings" component={GroupSettingsScreen} options={{ title: 'Grup Ayarları' }} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Harcama Ekle' }} />
      <Stack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} options={{ title: 'Harcama Detayı' }} />
      <Stack.Screen name="DocumentScan" component={DocumentScanScreen} options={{ title: 'Belge Tara' }} />
      <Stack.Screen name="OCRConfirm" component={OCRConfirmScreen} options={{ title: 'Belgeyi Onayla' }} />
    </Stack.Navigator>
  );
}
