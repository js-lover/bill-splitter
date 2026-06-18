import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import type { AppTabParamList } from '../types/navigation';
import { HomeStack } from './HomeStack';
import { DebtsStack } from './DebtsStack';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { ProfileStack } from './ProfileStack';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.neutral[200],
          borderTopWidth: 1,
          height: spacing.tabBarHeight + 16,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarLabelStyle: { fontSize: 10 },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Feather.glyphMap> = {
            HomeTab: 'home',
            DebtsTab: 'trending-down',
            NotificationsTab: 'bell',
            ProfileTab: 'user',
          };
          return <Feather name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ tabBarLabel: 'Ana Sayfa' }} />
      <Tab.Screen name="DebtsTab" component={DebtsStack} options={{ tabBarLabel: 'Borçlar' }} />
      <Tab.Screen name="NotificationsTab" component={NotificationsScreen} options={{ tabBarLabel: 'Bildirimler' }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ tabBarLabel: 'Profil' }} />
    </Tab.Navigator>
  );
}
