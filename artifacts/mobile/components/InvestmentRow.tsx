import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Investment, HenPackage } from '@/constants/types';

interface InvestmentRowProps {
  investment: Investment;
  packageInfo: HenPackage;
}

const TIER_COLORS = {
  basic: '#0F9D58',
  silver: '#9E9E9E',
  gold: '#FFD700',
  platinum: '#7B68EE',
};

export function InvestmentRow({ investment, packageInfo }: InvestmentRowProps) {
  const colors = useColors();
  const tierColor = TIER_COLORS[investment.tier as keyof typeof TIER_COLORS];
  
  const now = new Date();
  const expires = new Date(investment.expiresAt);
  const started = new Date(investment.purchasedAt);
  const totalDuration = expires.getTime() - started.getTime();
  const elapsed = now.getTime() - started.getTime();
  const progress = Math.min(Math.max(elapsed / totalDuration, 0), 1);
  
  const daysRemaining = Math.max(0, Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const isExpired = investment.status === 'expired';

  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.tierDot, { backgroundColor: tierColor }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: colors.foreground }]}>{investment.packageName}</Text>
          <Text style={[styles.days, { color: isExpired ? colors.destructive : colors.mutedForeground }]}>
            {isExpired ? 'Expired' : `${daysRemaining}d left`}
          </Text>
        </View>
        <Text style={[styles.eggs, { color: colors.mutedForeground }]}>
          {investment.eggsPerDay} eggs/day
        </Text>
        <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
          <View style={[styles.progressFill, { backgroundColor: tierColor, width: `${progress * 100}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  tierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  days: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  eggs: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
