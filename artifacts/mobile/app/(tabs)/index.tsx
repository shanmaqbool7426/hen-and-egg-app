import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Image, ImageBackground } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { API_URL, useHenFarm } from '@/contexts/HenFarmApiContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatNumber } from '@/constants/helpers';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useToast } from '@/components/Toast';
import { cardShadow, heroShadow } from '@/constants/shadows';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showToast } = useToast();
  const {
    user,
    hensOwned,
    availableEggs,
    totalEggsEarned,
    completedReferralCount,
    refreshData,
    authFetch,
  } = useHenFarm();

  const [pendingOrders, setPendingOrders] = useState(0);

  // A seller's relevant "hens" number is their selling stock, not hens they
  // personally bought (hensOwned) - those are two different things.
  const isSeller = user?.role === 'seller';
  const primaryHensCount = isSeller ? (user?.availableHens || 0) : hensOwned;

  const fetchOrderSummary = useCallback(async () => {
    if (!user?._id) return;
    try {
      const res = await authFetch(`${API_URL}/orders/my-orders/${user._id}`);
      const data = await res.json();
      if (data.success) {
        const pending = [...(data.buyOrders || []), ...(data.sellOrders || [])].filter(
          (o: any) => o.status === 'pending'
        );
        setPendingOrders(pending.length);
      }
    } catch (e) {
      console.error('Failed to load order summary', e);
    }
  }, [user?._id, authFetch]);

  // Refetch every time this tab regains focus (e.g. after approving/creating
  // an order elsewhere), not just once on mount - otherwise counts go stale.
  useFocusEffect(
    useCallback(() => {
      fetchOrderSummary();
    }, [fetchOrderSummary])
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
        {/* Welcome Header */}
        <ImageBackground
          source={require('@/assets/images/splash-bg.png')}
          style={styles.header}
          imageStyle={styles.headerImage}
        >
          <View style={styles.headerOverlay} />
          <View style={styles.headerBadge}>
            <Image source={require('@/assets/images/icon_3.png')} style={styles.headerBadgeImage} />
          </View>
          <View style={styles.headerGreeting}>
            <Text style={styles.greeting} numberOfLines={1}>
              Welcome back, {user?.name?.split(' ')[0] || 'Friend'}!
            </Text>
            <Text style={styles.subGreeting}>
              Real hens, real eggs, real orders
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.refreshButton}
              onPress={async () => {
                try {
                  await Promise.all([refreshData(), fetchOrderSummary()]);
                  showToast('Data refreshed successfully', 'success');
                } catch {
                  showToast('Failed to refresh data', 'error');
                }
              }}
            >
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </ImageBackground>

        {/* Eggs Ready Card */}
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
            <Text style={styles.eggsLabel}>Eggs Ready to Sell</Text>
            <Text style={styles.eggsValue}>{formatNumber(availableEggs)}</Text>
          </View>
          {availableEggs > 0 && (
            <Pressable style={styles.sellBtn} onPress={() => router.push('/(tabs)/farm')}>
              <Text style={styles.sellBtnText}>Sell</Text>
            </Pressable>
          )}
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: colors.card }, cardShadow(colors)]}>
            <View style={[styles.statIconCircle, { backgroundColor: colors.primary + '1A' }]}>
              <MaterialCommunityIcons name="bird" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{primaryHensCount}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{isSeller ? 'My Hen Stock' : 'Hens Owned'}</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: colors.card }, cardShadow(colors)]}>
            <View style={[styles.statIconCircle, { backgroundColor: '#F0A93C1A' }]}>
              <Ionicons name="time-outline" size={20} color="#F0A93C" />
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{pendingOrders}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Pending Orders</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: colors.card }, cardShadow(colors)]}>
            <View style={[styles.statIconCircle, { backgroundColor: '#3B82F61A' }]}>
              <Ionicons name="people" size={20} color="#3B82F6" />
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{completedReferralCount}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Referrals</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: colors.card }, cardShadow(colors)]}>
            <View style={[styles.statIconCircle, { backgroundColor: colors.accent + '1A' }]}>
              <MaterialCommunityIcons name="egg" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{formatNumber(availableEggs)}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Eggs in Stock</Text>
          </View>
        </View>

        {/* Call to Action */}
        {isSeller ? (
          <Pressable
            style={[styles.quickBuyCard, { backgroundColor: colors.card }, cardShadow(colors)]}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View style={styles.quickBuyContent}>
              <MaterialCommunityIcons name="storefront" size={32} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.quickBuyTitle, { color: colors.foreground }]}>
                  Manage Your Stock & Pricing
                </Text>
                <Text style={[styles.quickBuySubtitle, { color: colors.mutedForeground }]}>
                  You have {primaryHensCount} hens listed - update your rates in Profile
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.mutedForeground} />
            </View>
          </Pressable>
        ) : hensOwned === 0 ? (
          <View style={[styles.ctaCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary }, cardShadow(colors)]}>
            <MaterialCommunityIcons name="storefront-outline" size={48} color={colors.primary} />
            <Text style={[styles.ctaTitle, { color: colors.foreground }]}>
              Browse the Marketplace
            </Text>
            <Text style={[styles.ctaSubtitle, { color: colors.mutedForeground }]}>
              Buy real, verified hens directly from dealers near you.
            </Text>
            <Pressable
              style={[styles.ctaButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/farm')}
            >
              <Text style={styles.ctaButtonText}>Go to Marketplace →</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={[styles.quickBuyCard, { backgroundColor: colors.card }, cardShadow(colors)]}
            onPress={() => router.push('/(tabs)/farm')}
          >
            <View style={styles.quickBuyContent}>
              <MaterialCommunityIcons name="plus-circle" size={32} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.quickBuyTitle, { color: colors.foreground }]}>
                  Browse More Sellers
                </Text>
                <Text style={[styles.quickBuySubtitle, { color: colors.mutedForeground }]}>
                  Find more verified dealers in the Marketplace
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.mutedForeground} />
            </View>
          </Pressable>
        )}

        {/* Earnings Summary */}
        <Pressable
          onPress={() => router.push('/orders?tab=earnings')}
          style={[styles.earningsCard, { backgroundColor: colors.card }, cardShadow(colors)]}
        >
          <View style={[styles.earningsIconCircle, { backgroundColor: colors.primary + '1A' }]}>
            <MaterialCommunityIcons name="chart-line" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.earningsTitle, { color: colors.foreground }]}>
              {formatNumber(totalEggsEarned)} eggs earned so far
            </Text>
            <Text style={[styles.earningsSubtitle, { color: colors.mutedForeground }]}>
              View full earnings history →
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
        </Pressable>

        {/* Quick Navigation */}
        <View style={styles.quickNav}>
          {[
            { label: 'Marketplace', icon: 'storefront' as const, route: '/(tabs)/farm', color: '#0F9D58' },
            { label: 'My Farm', icon: 'bird' as const, route: '/(tabs)/wallet', color: '#00B0FF' },
            { label: 'Earnings', icon: 'trending-up' as const, route: '/orders?tab=earnings', color: '#0A8A4C' },
            { label: 'Referrals', icon: 'people' as const, route: '/referrals', color: '#FF9100' },
            { label: 'Orders', icon: 'receipt-outline' as const, route: '/orders', color: '#E040FB' },
            ...(user?.role === 'admin'
              ? [{ label: 'Admin Panel', icon: 'settings' as const, route: '/admin', color: '#D32F2F' }]
              : []),
          ].map(item => (
            <Pressable
              key={item.label}
              onPress={() => router.push(item.route as any)}
              style={({ pressed }) => [
                styles.navTile,
                { backgroundColor: colors.card },
                cardShadow(colors),
                pressed && styles.navTilePressed,
              ]}
            >
              <View style={[styles.navIconCircle, { backgroundColor: item.color + '20' }]}>
                {item.icon === 'bird' ? (
                  <MaterialCommunityIcons name="bird" size={20} color={item.color} />
                ) : (
                  <Ionicons name={item.icon} size={20} color={item.color} />
                )}
              </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
    borderRadius: 24,
    padding: 20,
    paddingTop: 16,
    minHeight: 130,
    overflow: 'hidden',
  },
  headerImage: {
    borderRadius: 24,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,46,26,0.45)',
    borderRadius: 24,
  },
  headerBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeImage: {
    width: 22,
    height: 22,
  },
  headerGreeting: {
    flex: 1,
    marginRight: 12,
  },
  greeting: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subGreeting: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.9)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButtonText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  eggsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    gap: 14,
  },
  eggsIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eggsLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 2,
  },
  eggsValue: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  sellBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  sellBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
    gap: 8,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  earningsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    marginBottom: 20,
  },
  earningsIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningsTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  earningsSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  ctaCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    marginBottom: 20,
  },
  ctaTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  ctaButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  quickBuyCard: {
    padding: 16,
    borderRadius: 18,
    marginBottom: 20,
  },
  quickBuyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickBuyTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  quickBuySubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  quickNav: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  navTile: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  navTilePressed: {
    opacity: 0.7,
  },
  navIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
});
