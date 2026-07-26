import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useSimulation } from '@/contexts/SimulationContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SimBadge } from '@/components/SimBadge';
import { StatCard } from '@/components/StatCard';
import { TransactionRow } from '@/components/TransactionRow';
import { formatNumber } from '@/constants/helpers';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { HEN_PACKAGES } from '@/contexts/SimulationContext';

const PHASE_COLORS = {
  growing: '#0F9D58',
  peak: '#F5A623',
  stalling: '#FF8C00',
  collapsed: '#E5484D',
};

const TIER_COLORS = {
  basic: '#0F9D58',
  silver: '#9E9E9E',
  gold: '#FFD700',
  platinum: '#7B68EE',
};

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    virtualBalance,
    totalInvestment,
    investments,
    transactions,
    simState,
    dailyEggIncome,
  } = useSimulation();

  const [bannerDismissed, setBannerDismissed] = useState(false);

  const activeInvestments = investments.filter(
    inv => inv.status === 'active' && new Date(inv.expiresAt) > new Date()
  );

  const henCounts = {
    basic: activeInvestments.filter(inv => inv.tier === 'basic').length,
    silver: activeInvestments.filter(inv => inv.tier === 'silver').length,
    gold: activeInvestments.filter(inv => inv.tier === 'gold').length,
    platinum: activeInvestments.filter(inv => inv.tier === 'platinum').length,
  };

  const phaseColor = PHASE_COLORS[simState.phase];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Platform.OS === 'web' ? 67 + 20 : insets.top + 20 },
          { paddingBottom: Platform.OS === 'web' ? 84 + 20 : insets.bottom + 84 + 20 },
        ]}
      >
        {!bannerDismissed && (
          <View style={[styles.banner, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
            <Ionicons name="information-circle" size={20} color={colors.warning} />
            <Text style={[styles.bannerText, { color: colors.warningForeground }]}>
              This is a simulation. No real money is used. You are learning how Ponzi schemes work.
            </Text>
            <Pressable onPress={() => setBannerDismissed(true)}>
              <Ionicons name="close" size={20} color={colors.warningForeground} />
            </Pressable>
          </View>
        )}

        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.foreground }]}>Dashboard</Text>
          <SimBadge size="sm" />
        </View>

        <LinearGradient
          colors={[colors.primary, colors.accent]}
          style={styles.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.balanceLabel}>Virtual Balance</Text>
          <Text style={styles.balanceValue}>{formatNumber(virtualBalance)}</Text>
          <Text style={styles.balanceSubtitle}>Simulation Coins</Text>
        </LinearGradient>

        <View style={styles.statsRow}>
          <View style={{ flex: 1 }}>
            <StatCard label="Total Invested" value={formatNumber(totalInvestment)} icon="wallet-outline" />
          </View>
          <View style={{ flex: 1 }}>
            <StatCard
              label="Daily Income"
              value={formatNumber(dailyEggIncome)}
              icon="trending-up"
              color={colors.accent}
              subtitle="eggs/day"
            />
          </View>
        </View>

        <View style={styles.henCountsRow}>
          {(['basic', 'silver', 'gold', 'platinum'] as const).map(tier => (
            <View key={tier} style={[styles.henTile, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.henDot, { backgroundColor: TIER_COLORS[tier] }]} />
              <Text style={[styles.henCount, { color: colors.foreground }]}>{henCounts[tier]}</Text>
              <Text style={[styles.henLabel, { color: colors.mutedForeground }]}>{tier}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.creditCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.creditIcon, { backgroundColor: `${colors.primary}18` }]}>
            <Ionicons name="egg-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.creditContent}>
            <Text style={[styles.creditTitle, { color: colors.foreground }]}>
              Daily egg credits are automatic
            </Text>
            <Text style={[styles.creditSubtitle, { color: colors.mutedForeground }]}>
              {dailyEggIncome > 0
                ? `${formatNumber(dailyEggIncome)} virtual eggs are added each simulated day.`
                : 'Buy a virtual hen to start receiving daily credits.'}
            </Text>
          </View>
        </View>

        <View style={[styles.phaseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.phaseHeader}>
            <Text style={[styles.phaseTitle, { color: colors.foreground }]}>Simulation Phase</Text>
            <View style={[styles.phaseBadge, { backgroundColor: phaseColor + '20' }]}>
              <View style={[styles.phaseDot, { backgroundColor: phaseColor }]} />
              <Text style={[styles.phaseLabel, { color: phaseColor }]}>{simState.phase.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.phaseStats}>
            <View>
              <Text style={[styles.phaseStatLabel, { color: colors.mutedForeground }]}>Day</Text>
              <Text style={[styles.phaseStatValue, { color: colors.foreground }]}>{simState.simulationDay}</Text>
            </View>
            <View>
              <Text style={[styles.phaseStatLabel, { color: colors.mutedForeground }]}>Virtual Investors</Text>
              <Text style={[styles.phaseStatValue, { color: colors.foreground }]}>
                {formatNumber(simState.investorCount)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Activity</Text>
        </View>

        {transactions.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Ionicons name="receipt-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No transactions yet</Text>
          </View>
        ) : (
          <View style={[styles.activityList, { backgroundColor: colors.card }]}>
            {transactions.slice(0, 5).map(tx => (
              <TransactionRow key={tx.id} transaction={tx} />
            ))}
          </View>
        )}

        <View style={styles.quickNav}>
          {[
            { label: 'Farm', icon: 'sprout' as const, route: '/(tabs)/farm' },
            { label: 'Wallet', icon: 'wallet-outline' as const, route: '/(tabs)/wallet' },
            { label: 'Learn', icon: 'book-outline' as const, route: '/(tabs)/learn' },
            { label: 'Charts', icon: 'bar-chart-outline' as const, route: '/(tabs)/charts' },
          ].map(item => (
            <Pressable
              key={item.label}
              onPress={() => router.push(item.route as any)}
              style={({ pressed }) => [
                styles.navTile,
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed && styles.navTilePressed,
              ]}
            >
              {item.icon === 'sprout' ? (
                <MaterialCommunityIcons name="sprout" size={24} color={colors.primary} />
              ) : (
                <Ionicons name={item.icon} size={24} color={colors.primary} />
              )}
              <Text style={[styles.navLabel, { color: colors.foreground }]}>{item.label}</Text>
            </Pressable>
          ))}
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    lineHeight: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
  },
  balanceCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 48,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 4,
  },
  balanceSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#FFFFFF',
    opacity: 0.8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  henCountsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  henTile: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  henDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 6,
  },
  henCount: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  henLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    textTransform: 'capitalize',
  },
  creditCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  creditIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  creditContent: {
    flex: 1,
  },
  creditTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  creditSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  phaseCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  phaseTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  phaseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  phaseLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  phaseStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  phaseStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
    textAlign: 'center',
  },
  phaseStatValue: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  activityList: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
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
  },
  quickNav: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  navTile: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  navTilePressed: {
    opacity: 0.7,
  },
  navLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
});
