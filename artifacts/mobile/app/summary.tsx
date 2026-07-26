import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useSimulation } from '@/contexts/SimulationContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SummaryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { resetSimulation } = useSimulation();

  const handleRestart = () => {
    resetSimulation();
    router.push('/(tabs)/');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.destructive + '15' }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Platform.OS === 'web' ? 67 + 40 : insets.top + 40 },
          { paddingBottom: Platform.OS === 'web' ? 34 + 40 : insets.bottom + 40 },
        ]}
      >
        <View style={[styles.header, { backgroundColor: colors.destructive }]}>
          <Ionicons name="alert-circle" size={64} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Scheme Collapsed</Text>
          <Text style={styles.headerSubtitle}>Educational Final Warning</Text>
        </View>

        <View style={styles.blocks}>
          {[
            {
              icon: 'storefront-outline' as const,
              title: 'Real Businesses',
              text: 'Legitimate businesses generate revenue from selling products or services. Their profits come from actual economic activity, not from recruiting new investors.',
            },
            {
              icon: 'arrow-redo-circle-outline' as const,
              title: 'Ponzi Schemes',
              text: 'Ponzi schemes pay old investors with new investor money. There is no real business generating value. The money just circulates until it runs out.',
            },
            {
              icon: 'trending-down' as const,
              title: 'When Growth Stops',
              text: 'All Ponzi schemes eventually collapse. When new recruits slow down, there is not enough money to pay existing investors. Collapse is inevitable.',
            },
            {
              icon: 'flag-outline' as const,
              title: 'Red Flag Rule',
              text: 'If an investment promises guaranteed high returns with no clear business model or product, it is likely a Ponzi scheme. Stay away.',
            },
          ].map((block, i) => (
            <View key={i} style={[styles.block, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.blockIcon, { backgroundColor: colors.destructive + '20' }]}>
                <Ionicons name={block.icon} size={32} color={colors.destructive} />
              </View>
              <Text style={[styles.blockTitle, { color: colors.foreground }]}>{block.title}</Text>
              <Text style={[styles.blockText, { color: colors.mutedForeground }]}>{block.text}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={handleRestart}
          style={({ pressed }) => [
            styles.restartButton,
            { backgroundColor: colors.primary },
            pressed && styles.restartButtonPressed,
          ]}
        >
          <Text style={[styles.restartButtonText, { color: colors.primaryForeground }]}>Restart Simulation</Text>
        </Pressable>

        <View style={[styles.educationalSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.educationalTitle, { color: colors.foreground }]}>
            How to Spot a Real Ponzi Scheme
          </Text>
          <View style={styles.educationalList}>
            {[
              'Promises of guaranteed high returns with little or no risk',
              'Overly consistent returns regardless of market conditions',
              'Unregistered investments or unlicensed sellers',
              'Secretive or complex investment strategies',
              'Issues with paperwork or account statements',
              'Difficulty withdrawing your money',
            ].map((item, i) => (
              <View key={i} style={styles.educationalItem}>
                <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
                <Text style={[styles.educationalText, { color: colors.foreground }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  blocks: {
    gap: 16,
    marginBottom: 24,
  },
  block: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  blockIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  blockTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  blockText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    textAlign: 'center',
  },
  restartButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  restartButtonPressed: {
    opacity: 0.8,
  },
  restartButtonText: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  educationalSection: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  educationalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 16,
  },
  educationalList: {
    gap: 12,
  },
  educationalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  educationalText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
});
