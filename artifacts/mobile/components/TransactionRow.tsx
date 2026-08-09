import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { ReferralActivity } from '@/constants/types';
import { formatDate } from '@/constants/helpers';
import { Ionicons } from '@expo/vector-icons';

interface TransactionRowProps {
  transaction: ReferralActivity;
}

export function TransactionRow({ transaction }: TransactionRowProps) {
  const colors = useColors();
  const isReferral = transaction.type === 'referral-egg-bonus';
  const icon: keyof typeof Ionicons.glyphMap = isReferral ? 'people' : 'egg-outline';
  const tint = isReferral ? colors.accent : colors.primary;

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: `${tint}15` }]}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.description, { color: colors.foreground }]} numberOfLines={2}>
          {transaction.description}
        </Text>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>
          {formatDate(transaction.createdAt)}
        </Text>
      </View>
      <Text style={[styles.amount, { color: colors.primary }]}>
        +{transaction.quantity}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  amount: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },
});
