import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface SimBadgeProps {
  size?: 'sm' | 'md';
}

export function SimBadge({ size = 'md' }: SimBadgeProps) {
  const colors = useColors();

  return (
    <View style={[styles.badge, { backgroundColor: colors.destructive }, size === 'sm' && styles.badgeSm]}>
      <Text style={[styles.text, { color: colors.destructiveForeground }, size === 'sm' && styles.textSm]}>
        SIMULATION ONLY
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  textSm: {
    fontSize: 9,
  },
});
