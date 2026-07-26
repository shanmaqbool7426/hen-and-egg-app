import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { HenPackage } from '@/constants/types';
import { formatNumber } from '@/constants/helpers';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface HenCardProps {
  package: HenPackage;
  onBuy: () => void;
  disabled: boolean;
  disabledReason?: string;
}

const TIER_COLORS: Record<HenPackage['tier'], readonly [string, string]> = {
  basic: ['#0F9D58', '#0F9D58'],
  silver: ['#B8B8B8', '#9E9E9E'],
  gold: ['#FFD700', '#FFA500'],
  platinum: ['#9D7BEE', '#7B68EE'],
};

export function HenCard({ package: pkg, onBuy, disabled, disabledReason }: HenCardProps) {
  const colors = useColors();
  const tierColors = TIER_COLORS[pkg.tier];
  const roi = ((pkg.totalReturn / pkg.virtualPrice) * 100).toFixed(0);

  const handlePress = () => {
    if (!disabled) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onBuy();
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <LinearGradient colors={tierColors} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={styles.tierName}>{pkg.name}</Text>
        <View style={styles.tierBadge}>
          <Text style={styles.tierLabel}>{pkg.tier.toUpperCase()}</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.priceRow}>
          <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>Virtual Price</Text>
          <Text style={[styles.price, { color: colors.foreground }]}>{formatNumber(pkg.virtualPrice)}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.stat}>
            <Ionicons name="egg-outline" size={18} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{pkg.eggsPerDay}/day</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="time-outline" size={18} color={colors.accent} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{pkg.lifespanDays} days</Text>
          </View>
        </View>

        <View style={[styles.roiRow, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.roiLabel, { color: colors.foreground }]}>Total Return</Text>
          <Text style={[styles.roiValue, { color: colors.primary }]}>{formatNumber(pkg.totalReturn)} ({roi}% ROI)</Text>
        </View>

        {pkg.tier === 'platinum' && (
          <View style={[styles.tooltip, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.warning} />
            <Text style={[styles.tooltipText, { color: colors.warningForeground }]}>
              This ROI looks suspiciously good — just like real Ponzi promises.
            </Text>
          </View>
        )}

        <Pressable
          onPress={handlePress}
          disabled={disabled}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: disabled ? colors.muted : colors.primary },
            pressed && !disabled && styles.buttonPressed,
          ]}
        >
          <Text style={[styles.buttonText, { color: disabled ? colors.mutedForeground : colors.primaryForeground }]}>
            {disabled ? (disabledReason || 'Cannot Buy') : 'Buy Hen'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierName: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  tierBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tierLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  body: {
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  price: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  roiRow: {
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roiLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  roiValue: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  tooltip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  tooltipText: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    lineHeight: 16,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
});
