import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, FlatList } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useSimulation } from '@/contexts/SimulationContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SimBadge } from '@/components/SimBadge';
import { HenCard } from '@/components/HenCard';
import { InvestmentRow } from '@/components/InvestmentRow';
import { HEN_PACKAGES } from '@/contexts/SimulationContext';
import { Ionicons } from '@expo/vector-icons';

export default function FarmScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { virtualBalance, investments, simState, buyHen } = useSimulation();

  const activeInvestments = investments.filter(
    inv => inv.status === 'active' && new Date(inv.expiresAt) > new Date()
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Platform.OS === 'web' ? 67 + 20 : insets.top + 20 },
          { paddingBottom: Platform.OS === 'web' ? 84 + 20 : insets.bottom + 84 + 20 },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Virtual Farm</Text>
          <SimBadge size="sm" />
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          <Text style={[styles.summaryText, { color: colors.foreground }]}>
            {activeInvestments.length} active hen{activeInvestments.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Available Packages</Text>

        {HEN_PACKAGES.map(pkg => {
          const disabled =
            virtualBalance < pkg.virtualPrice || simState.phase === 'collapsed';
          const disabledReason = simState.phase === 'collapsed'
            ? 'Scheme has collapsed'
            : virtualBalance < pkg.virtualPrice
            ? 'Insufficient balance'
            : undefined;

          return (
            <HenCard
              key={pkg.id}
              package={pkg}
              onBuy={() => buyHen(pkg)}
              disabled={disabled}
              disabledReason={disabledReason}
            />
          );
        })}

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>My Active Hens</Text>

        {activeInvestments.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Ionicons name="leaf-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No hens yet — buy your first one above
            </Text>
          </View>
        ) : (
          <View style={styles.investmentsList}>
            {activeInvestments.map(inv => {
              const pkg = HEN_PACKAGES.find(p => p.id === inv.packageId);
              if (!pkg) return null;
              return <InvestmentRow key={inv.id} investment={inv} packageInfo={pkg} />;
            })}
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  summaryText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 16,
  },
  emptyState: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginTop: 12,
    textAlign: 'center',
  },
  investmentsList: {
    marginBottom: 20,
  },
});
