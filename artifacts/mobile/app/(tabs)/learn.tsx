import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useSimulation } from '@/contexts/SimulationContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const RED_FLAGS = [
  { icon: 'trending-up' as const, text: 'Guaranteed high returns with little or no risk' },
  { icon: 'eye-off-outline' as const, text: 'Unregistered investments' },
  { icon: 'lock-closed-outline' as const, text: 'Secretive or complex strategies' },
  { icon: 'people-outline' as const, text: 'Recruiting required to earn returns' },
  { icon: 'time-outline' as const, text: 'Pressure to invest quickly' },
];

export default function LearnScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { simState } = useSimulation();
  const [expandedAccordion, setExpandedAccordion] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Platform.OS === 'web' ? 67 + 20 : insets.top + 20 },
          { paddingBottom: Platform.OS === 'web' ? 84 + 20 : insets.bottom + 84 + 20 },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Financial Education</Text>

        <Pressable
          onPress={() => router.push('/learn/flow')}
          style={({ pressed }) => [
            styles.ctaCard,
            { backgroundColor: colors.primary },
            pressed && styles.ctaCardPressed,
          ]}
        >
          <Ionicons name="school-outline" size={32} color={colors.primaryForeground} />
          <View style={styles.ctaContent}>
            <Text style={[styles.ctaTitle, { color: colors.primaryForeground }]}>Start Educational Flow</Text>
            <Text style={[styles.ctaSubtitle, { color: colors.primaryForeground }]}>
              8-step interactive lesson on how Ponzi schemes work
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.primaryForeground} />
        </Pressable>

        <Pressable
          onPress={() => setExpandedAccordion(!expandedAccordion)}
          style={[styles.accordionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.accordionHeader}>
            <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
            <Text style={[styles.accordionTitle, { color: colors.foreground }]}>What is a Ponzi Scheme?</Text>
            <Ionicons name={expandedAccordion ? 'chevron-up' : 'chevron-down'} size={20} color={colors.mutedForeground} />
          </View>
          {expandedAccordion && (
            <View style={styles.accordionBody}>
              <Text style={[styles.bodyText, { color: colors.foreground }]}>
                A Ponzi scheme is a fraudulent investment operation where returns are paid to earlier investors using
                the capital from newer investors, rather than from legitimate business profits.
              </Text>
              <Text style={[styles.bodyText, { color: colors.foreground }]}>
                The scheme relies on a continuous flow of new investors to sustain itself. When the flow of new money
                slows down or stops, the scheme inevitably collapses, leaving most investors with significant losses.
              </Text>
              <Text style={[styles.bodyText, { color: colors.foreground }]}>
                Named after Charles Ponzi, who became infamous for using this technique in the 1920s, though he was not
                the first to employ it.
              </Text>
            </View>
          )}
        </Pressable>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="flag-outline" size={24} color={colors.destructive} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Ponzi Red Flags</Text>
          </View>
          <View style={styles.flagsList}>
            {RED_FLAGS.map((flag, index) => (
              <View key={index} style={styles.flagRow}>
                <View style={[styles.flagIcon, { backgroundColor: colors.destructive + '15' }]}>
                  <Ionicons name={flag.icon} size={18} color={colors.destructive} />
                </View>
                <Text style={[styles.flagText, { color: colors.foreground }]}>{flag.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="library-outline" size={24} color={colors.accent} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Real Examples</Text>
          </View>
          <View style={styles.examplesBody}>
            <View style={styles.exampleItem}>
              <Text style={[styles.exampleTitle, { color: colors.foreground }]}>Bernie Madoff (2008)</Text>
              <Text style={[styles.exampleText, { color: colors.mutedForeground }]}>
                Operated a $65 billion Ponzi scheme for decades, defrauding thousands of investors before its collapse
                during the 2008 financial crisis.
              </Text>
            </View>
            <View style={styles.exampleItem}>
              <Text style={[styles.exampleTitle, { color: colors.foreground }]}>Charles Ponzi (1920)</Text>
              <Text style={[styles.exampleText, { color: colors.mutedForeground }]}>
                Promised 50% returns in 45 days through postal reply coupons. Collected $20 million before the scheme
                collapsed.
              </Text>
            </View>
          </View>
        </View>

        {simState.phase === 'collapsed' && (
          <Pressable
            onPress={() => router.push('/summary')}
            style={({ pressed }) => [
              styles.alertCard,
              { backgroundColor: colors.destructive + '15', borderColor: colors.destructive },
              pressed && styles.alertCardPressed,
            ]}
          >
            <Ionicons name="warning-outline" size={32} color={colors.destructive} />
            <View style={styles.alertContent}>
              <Text style={[styles.alertTitle, { color: colors.destructive }]}>The simulation has collapsed!</Text>
              <Text style={[styles.alertSubtitle, { color: colors.foreground }]}>
                Review the Final Warning to understand what happened.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.destructive} />
          </Pressable>
        )}
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
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    marginBottom: 24,
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  ctaCardPressed: {
    opacity: 0.9,
  },
  ctaContent: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  ctaSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    opacity: 0.9,
  },
  accordionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accordionTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  accordionBody: {
    marginTop: 16,
    paddingTop: 16,
    gap: 12,
  },
  bodyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  flagsList: {
    gap: 12,
  },
  flagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flagIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    lineHeight: 18,
  },
  examplesBody: {
    gap: 16,
  },
  exampleItem: {
    gap: 6,
  },
  exampleTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  exampleText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 20,
  },
  alertCardPressed: {
    opacity: 0.8,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  alertSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
});
