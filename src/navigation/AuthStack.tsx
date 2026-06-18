import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { AuthStackParamList } from '../types/navigation';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { PhoneInputScreen } from '../screens/auth/PhoneInputScreen';
import { OTPVerificationScreen } from '../screens/auth/OTPVerificationScreen';
import { ProfileSetupScreen } from '../screens/auth/ProfileSetupScreen';

const Stack = createStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="PhoneInput" component={PhoneInputScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </Stack.Navigator>
  );
}
