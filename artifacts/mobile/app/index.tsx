import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useSimulation } from '@/contexts/SimulationContext';
import { useColors } from '@/hooks/useColors';

export default function IndexRedirect() {
  const { user, isLoaded } = useSimulation();
  const colors = useColors();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)/" />;
}
