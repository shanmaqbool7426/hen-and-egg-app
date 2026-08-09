import React, { useEffect } from 'react';
import { Stack, Redirect } from 'expo-router';
import { useHenFarm } from '@/contexts/HenFarmApiContext';

export default function AuthLayout() {
  const { user, isLoaded } = useHenFarm();

  if (!isLoaded) return null;
  
  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="otp" />
    </Stack>
  );
}
