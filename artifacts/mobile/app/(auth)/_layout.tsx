import React, { useEffect } from 'react';
import { Stack, Redirect } from 'expo-router';
import { useSimulation } from '@/contexts/SimulationContext';

export default function AuthLayout() {
  const { user, isLoaded } = useSimulation();

  if (!isLoaded) return null;
  
  if (user) {
    return <Redirect href="/(tabs)/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="otp" />
    </Stack>
  );
}
