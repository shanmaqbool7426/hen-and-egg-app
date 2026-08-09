import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Platform, Pressable, RefreshControl
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { API_URL, useHenFarm } from '@/contexts/HenFarmApiContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { formatNumber, formatDate } from '@/constants/helpers';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { cardShadow, heroShadow } from '@/constants/shadows';

interface HenHoldingInfo {
  _id: string;
  quantity: number;
  purchasedAt: string;
  layingStartsAt: string;
  expiresAt: string;
  status: 'incubating' | 'laying';
  daysRemaining: number;
}

interface HensSummary {
  totalHens: number;
  layingHens: number;
  incubatingHens: number;
  eggsPerDay: number;
}

const EMPTY_SUMMARY: HensSummary = { totalHens: 0, layingHens: 0, incubatingHens: 0, eggsPerDay: 0 };

export default function WalletScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, availableEggs, totalEggsEarned, refreshData, authFetch } = useHenFarm();

  const [holdings, setHoldings] = useState<HenHoldingInfo[]>([]);
  const [summary, setSummary] = useState<HensSummary>(EMPTY_SUMMARY);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyHens = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await authFetch(`${API_URL}/orders/my-hens/${user._id}`);
      const data = await res.json();
      if (data.success) {
        setHoldings(data.holdings || []);
        setSummary(data.summary || EMPTY_SUMMARY);
      }
    } catch (e) {
      console.error('Failed to load hens', e);
    }
  }, [user?._id, authFetch]);

  useFocusEffect(
    useCallback(() => {
      fetchMyHens();
    }, [fetchMyHens])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshData(), fetchMyHens()]);
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Platform.OS === 'web' ? 67 + 20 : insets.top + 20 },
          { paddingBottom: Platform.OS === 'web' ? 84 + 20 : insets.bottom + 84 + 20 },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>My Farm</Text>
        </View>

        {/* Seller Stock */}
        {user?.role === 'seller' && (
          <Pressable
            style={[styles.sellerStockCard, { backgroundColor: colors.card }, cardShadow(colors)]}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View style={[styles.henOrderIcon, { backgroundColor: colors.primary + '20' }]}>
              <MaterialCommunityIcons name="storefront" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.henOrderTitle, { color: colors.foreground }]}>
                {formatNumber(user.availableHens || 0)} hens in your selling stock
              </Text>
              <Text style={[styles.henOrderSubtitle, { color: colors.mutedForeground }]}>
                Listed at Rs {formatNumber(user.henSellPrice || 0)}/hen - tap to update pricing
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
          </Pressable>
        )}

        {/* Egg Production */}
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          style={[styles.eggsCard, heroShadow(colors)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.eggsIconCircle}>
            <MaterialCommunityIcons name="egg" size={32} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.eggsLabel}>
              {summary.layingHens > 0
                ? `${summary.layingHens} hen${summary.layingHens > 1 ? 's' : ''} producing ${summary.eggsPerDay} egg${summary.eggsPerDay > 1 ? 's' : ''}/day`
                : 'Eggs Ready to Sell'}
            </Text>
            <Text style={styles.eggsValue}>{formatNumber(availableEggs)}</Text>
          </View>
          {availableEggs > 0 && (
            <Pressable style={styles.sellBtn} onPress={() => router.push('/(tabs)/farm')}>
              <Text style={styles.sellBtnText}>Sell</Text>
            </Pressable>
          )}
        </LinearGradient>

        {/* My Hens */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>My Hens</Text>
          <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>{summary.totalHens} owned</Text>
        </View>

        {holdings.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }, cardShadow(colors)]}>
            <MaterialCommunityIcons name="egg-off" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No hens purchased yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Go to Marketplace to buy real hens from verified sellers.
            </Text>
          </View>
        ) : (
          holdings.map(h => (
            <View key={h._id} style={[styles.henOrderCard, { backgroundColor: colors.card }, cardShadow(colors)]}>
              <View style={[styles.henOrderIcon, { backgroundColor: (h.status === 'laying' ? '#0F9D58' : '#FF9100') + '20' }]}>
                <MaterialCommunityIcons name="bird" size={24} color={h.status === 'laying' ? '#0F9D58' : '#FF9100'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.henOrderTitle, { color: colors.foreground }]}>
                  {h.quantity} hen{h.quantity > 1 ? 's' : ''} - bought {formatDate(h.purchasedAt)}
                </Text>
                <Text style={[styles.henOrderSubtitle, { color: colors.mutedForeground }]}>
                  {h.status === 'incubating'
                    ? `Incubating - starts laying in ${h.daysRemaining} day${h.daysRemaining > 1 ? 's' : ''}`
                    : `Laying - ${h.daysRemaining} day${h.daysRemaining > 1 ? 's' : ''} left in this cycle`}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: (h.status === 'laying' ? '#0F9D58' : '#FF9100') + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: h.status === 'laying' ? '#0F9D58' : '#FF9100' }]}>
                  {h.status === 'laying' ? 'Laying' : 'Incubating'}
                </Text>
              </View>
            </View>
          ))
        )}

        {/* Earnings Summary */}
        <Pressable
          style={[styles.sellerStockCard, { backgroundColor: colors.card }, cardShadow(colors)]}
          onPress={() => router.push('/orders?tab=earnings')}
        >
          <View style={[styles.henOrderIcon, { backgroundColor: colors.primary + '20' }]}>
            <MaterialCommunityIcons name="chart-line" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.henOrderTitle, { color: colors.foreground }]}>
              {formatNumber(totalEggsEarned)} eggs earned so far
            </Text>
            <Text style={[styles.henOrderSubtitle, { color: colors.mutedForeground }]}>
              View full earnings history →
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: { marginBottom: 20 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  eggsCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, marginBottom: 24, gap: 14 },
  eggsIconCircle: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  eggsLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#FFFFFF', opacity: 0.9, marginBottom: 4 },
  eggsValue: { fontSize: 32, fontFamily: 'Inter_700Bold', color: '#FFFFFF', letterSpacing: -1 },
  sellBtn: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  sellBtnText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Inter_700Bold' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  sectionCount: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  henOrderCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, marginBottom: 10 },
  sellerStockCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, marginBottom: 20 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusBadgeText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  henOrderIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  henOrderTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  henOrderSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  emptyState: { padding: 32, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginTop: 10 },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 4 },
});
