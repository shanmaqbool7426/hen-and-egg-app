import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable, Modal, TextInput, Alert, ActivityIndicator, Switch } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { API_URL, useHenFarm } from '@/contexts/HenFarmApiContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatNumber } from '@/constants/helpers';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'buyer' | 'seller' | 'admin';
  verified: boolean;
  hensOwned: number;
  availableHens: number;
  henSellPrice: number;
  availableEggs: number;
  eggBuyRate: number;
  easyPaisaAccount?: string;
  jazzCashAccount?: string;
  whatsappNumber?: string;
  location?: string;
  rating?: number;
  createdAt?: string;
}

interface AdminOrder {
  _id: string;
  orderType: 'buy-hen' | 'sell-egg';
  buyerName: string;
  sellerName: string;
  quantity: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface AdminStats {
  users: number;
  sellers: number;
  buyers: number;
  orders: number;
  pendingOrders: number;
  completedOrders: number;
}

const EMPTY_STATS: AdminStats = {
  users: 0, sellers: 0, buyers: 0, orders: 0, pendingOrders: 0, completedOrders: 0,
};

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, authFetch } = useHenFarm();

  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [sellers, setSellers] = useState<AdminUser[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sellers' | 'users' | 'orders'>('sellers');
  const [showAddSeller, setShowAddSeller] = useState(false);

  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '', location: '',
    availableHens: '0', henSellPrice: '900', eggBuyRate: '12', verified: true,
    easyPaisaAccount: '', jazzCashAccount: '', whatsappNumber: '',
  });

  const loadAll = useCallback(async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const [statsRes, sellersRes, usersRes, ordersRes] = await Promise.all([
        authFetch(`${API_URL}/admin/stats`),
        authFetch(`${API_URL}/admin/sellers`),
        authFetch(`${API_URL}/admin/users`),
        authFetch(`${API_URL}/admin/orders`),
      ]);
      const [statsData, sellersData, usersData, ordersData] = await Promise.all([
        statsRes.json(), sellersRes.json(), usersRes.json(), ordersRes.json(),
      ]);
      if (statsData.success) setStats(statsData.stats);
      if (sellersData.success) setSellers(sellersData.sellers || []);
      if (usersData.success) setUsers(usersData.users || []);
      if (ordersData.success) setOrders(ordersData.orders || []);
    } catch (error) {
      console.error('Admin load error:', error);
      Alert.alert('Error', 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, [user?._id, authFetch]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const adminFetch = async (endpoint: string, method: string, body?: any) => {
    const response = await authFetch(`${API_URL}${endpoint}`, {
      method,
      body: body ? JSON.stringify(body) : undefined,
    });
    return response.json();
  };

  const createSeller = async () => {
    if (!form.name || !form.phone || !form.email || !form.password) {
      Alert.alert('Error', 'Name, phone, email and password are required');
      return;
    }
    try {
      const data = await adminFetch('/admin/sellers', 'POST', {
        ...form,
        availableHens: Number(form.availableHens) || 0,
        henSellPrice: Number(form.henSellPrice) || 900,
        eggBuyRate: Number(form.eggBuyRate) || 12,
        verified: form.verified,
      });
      if (data.success) {
        Alert.alert('Success', `Seller "${data.seller.name}" created`);
        setShowAddSeller(false);
        setForm({ name: '', phone: '', email: '', password: '', location: '', availableHens: '0', henSellPrice: '900', eggBuyRate: '12', verified: true, easyPaisaAccount: '', jazzCashAccount: '', whatsappNumber: '' });
        loadAll();
      } else {
        Alert.alert('Error', data.error || 'Failed to create seller');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create seller');
    }
  };

  const updateSeller = async (seller: AdminUser, updates: any) => {
    try {
      const data = await adminFetch(`/admin/sellers/${seller._id}`, 'PATCH', updates);
      if (data.success) {
        loadAll();
      } else {
        Alert.alert('Error', data.error || 'Failed to update seller');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update seller');
    }
  };

  const toggleVerified = (seller: AdminUser) => {
    updateSeller(seller, { verified: !seller.verified });
  };

  const addHens = (seller: AdminUser) => {
    Alert.prompt(
      'Add Hens',
      `Add hens to ${seller.name}'s inventory. Current: ${seller.availableHens}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (value?: string) => {
            const count = Number(value);
            if (!Number.isFinite(count) || count <= 0) {
              Alert.alert('Error', 'Enter a valid number of hens');
              return;
            }
            updateSeller(seller, { availableHens: seller.availableHens + count });
          },
        },
      ],
      'plain-text',
      ''
    );
  };

  const renderStat = (label: string, value: string, icon: keyof typeof Ionicons.glyphMap, color: string) => (
    <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );

  const renderSellerCard = (seller: AdminUser) => (
    <View key={seller._id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.sellerNameRow}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{seller.name}</Text>
          <View style={[styles.roleBadge, { backgroundColor: seller.verified ? '#00C85322' : '#FFA00022' }]}>
            <Ionicons name={seller.verified ? 'checkmark-circle' : 'time'} size={12} color={seller.verified ? '#00C853' : '#FFA000'} />
            <Text style={[styles.roleBadgeText, { color: seller.verified ? '#00C853' : '#FFA000' }]}>
              {seller.verified ? 'Verified' : 'Pending'}
            </Text>
          </View>
        </View>
        <Pressable onPress={() => toggleVerified(seller)}>
          <Switch
            value={seller.verified}
            onValueChange={() => toggleVerified(seller)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={seller.verified ? colors.primary : '#FFFFFF'}
          />
        </Pressable>
      </View>

      <View style={styles.cardInfo}>
        <Text style={[styles.cardInfoText, { color: colors.mutedForeground }]}>📱 {seller.phone}</Text>
        <Text style={[styles.cardInfoText, { color: colors.mutedForeground }]}>📧 {seller.email}</Text>
        {seller.location ? (
          <Text style={[styles.cardInfoText, { color: colors.mutedForeground }]}>📍 {seller.location}</Text>
        ) : null}
        {seller.easyPaisaAccount ? (
          <Text style={[styles.cardInfoText, { color: colors.mutedForeground }]}>💳 EasyPaisa: {seller.easyPaisaAccount}</Text>
        ) : null}
        {seller.jazzCashAccount ? (
          <Text style={[styles.cardInfoText, { color: colors.mutedForeground }]}>💳 JazzCash: {seller.jazzCashAccount}</Text>
        ) : null}
      </View>

      <View style={styles.cardStatsRow}>
        <View style={styles.miniStat}>
          <MaterialCommunityIcons name="egg" size={16} color={colors.primary} />
          <Text style={[styles.miniStatValue, { color: colors.foreground }]}>{formatNumber(seller.availableHens)}</Text>
          <Text style={[styles.miniStatLabel, { color: colors.mutedForeground }]}>hens</Text>
        </View>
        <View style={styles.miniStat}>
          <Ionicons name="pricetag-outline" size={16} color={colors.accent} />
          <Text style={[styles.miniStatValue, { color: colors.foreground }]}>Rs {formatNumber(seller.eggBuyRate)}</Text>
          <Text style={[styles.miniStatLabel, { color: colors.mutedForeground }]}>egg rate</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <Pressable
          onPress={() => addHens(seller)}
          style={[styles.smallButton, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.smallButtonText}>Add Hens</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderUserRow = (targetUser: AdminUser) => (
    <View key={targetUser._id} style={[styles.userRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <View style={styles.userNameRow}>
          <Text style={[styles.userName, { color: colors.foreground }]}>{targetUser.name}</Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[styles.roleBadgeText, { color: colors.primary }]}>{targetUser.role}</Text>
          </View>
        </View>
        <Text style={[styles.userMeta, { color: colors.mutedForeground }]}>📱 {targetUser.phone}</Text>
        <Text style={[styles.userMeta, { color: colors.mutedForeground }]}>📧 {targetUser.email}</Text>
      </View>
      <View style={styles.userRight}>
        <Text style={[styles.userBalance, { color: colors.foreground }]}>{targetUser.hensOwned || 0} hens</Text>
      </View>
    </View>
  );

  const renderOrderRow = (order: AdminOrder) => {
    const statusColor = order.status === 'approved' ? '#00C853' : order.status === 'pending' ? '#FFA000' : order.status === 'rejected' ? '#D32F2F' : colors.mutedForeground;
    return (
      <View key={order._id} style={[styles.orderRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <View style={styles.orderTypeRow}>
            <MaterialCommunityIcons name={order.orderType === 'buy-hen' ? 'egg' : 'cash'} size={18} color={colors.primary} />
            <Text style={[styles.orderType, { color: colors.foreground }]}>
              {order.orderType === 'buy-hen' ? 'Buy Hens' : 'Sell Eggs'} · {order.quantity}
            </Text>
          </View>
          <Text style={[styles.orderMeta, { color: colors.mutedForeground }]}>
            {order.buyerName} → {order.sellerName}
          </Text>
          <Text style={[styles.orderMeta, { color: colors.mutedForeground }]}>
            {new Date(order.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={styles.orderRight}>
          <Text style={[styles.orderAmount, { color: colors.foreground }]}>Rs {formatNumber(order.totalAmount)}</Text>
          <Text style={[styles.orderStatus, { color: statusColor }]}>{order.status}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'web' ? 67 + 20 : insets.top + 20 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Admin Panel</Text>
        <Pressable onPress={loadAll}>
          <Ionicons name="refresh" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === 'web' ? 40 : insets.bottom + 40 },
        ]}
      >
        <LinearGradient colors={[colors.primary, colors.accent]} style={styles.statsBanner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.bannerLabel}>Platform Activity</Text>
          <Text style={styles.bannerValue}>{stats.orders} orders</Text>
          <Text style={styles.bannerSub}>
            {stats.users} users · {stats.sellers} sellers
          </Text>
        </LinearGradient>

        <View style={styles.statsGrid}>
          {renderStat('Users', String(stats.users), 'people', colors.primary)}
          {renderStat('Sellers', String(stats.sellers), 'storefront', '#00C853')}
          {renderStat('Pending', String(stats.pendingOrders), 'time', '#FFA000')}
          {renderStat('Completed Orders', String(stats.completedOrders), 'checkmark-circle', '#0F9D58')}
        </View>

        <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => setActiveTab('sellers')} style={[styles.tab, activeTab === 'sellers' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
            <Text style={[styles.tabText, { color: activeTab === 'sellers' ? colors.primary : colors.mutedForeground }]}>
              Sellers ({sellers.length})
            </Text>
          </Pressable>
          <Pressable onPress={() => setActiveTab('users')} style={[styles.tab, activeTab === 'users' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
            <Text style={[styles.tabText, { color: activeTab === 'users' ? colors.primary : colors.mutedForeground }]}>
              Users ({users.length})
            </Text>
          </Pressable>
          <Pressable onPress={() => setActiveTab('orders')} style={[styles.tab, activeTab === 'orders' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
            <Text style={[styles.tabText, { color: activeTab === 'orders' ? colors.primary : colors.mutedForeground }]}>
              Orders ({orders.length})
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {activeTab === 'sellers' && (
              <>
                <Pressable onPress={() => setShowAddSeller(true)} style={[styles.addSellerBtn, { backgroundColor: colors.primary }]}>
                  <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.addSellerBtnText}>Add Seller</Text>
                </Pressable>
                {sellers.length === 0 ? (
                  <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                    <MaterialCommunityIcons name="store-off" size={48} color={colors.mutedForeground} />
                    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No sellers yet. Add your first seller!</Text>
                  </View>
                ) : (
                  sellers.map(renderSellerCard)
                )}
              </>
            )}

            {activeTab === 'users' && (
              users.map(renderUserRow)
            )}

            {activeTab === 'orders' && (
              orders.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                  <MaterialCommunityIcons name="package-variant" size={48} color={colors.mutedForeground} />
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No orders yet</Text>
                </View>
              ) : (
                orders.map(renderOrderRow)
              )
            )}
          </>
        )}
      </ScrollView>

      {/* Add Seller Modal */}
      <Modal visible={showAddSeller} transparent animationType="slide" onRequestClose={() => setShowAddSeller(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Seller</Text>
              <Pressable onPress={() => setShowAddSeller(false)}>
                <Ionicons name="close" size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              {[
                { key: 'name', label: 'Name', placeholder: 'Seller name', keyboard: 'default' as const },
                { key: 'phone', label: 'Phone', placeholder: '03xxxxxxxxx', keyboard: 'phone-pad' as const },
                { key: 'email', label: 'Email', placeholder: 'seller@mail.com', keyboard: 'email-address' as const },
                { key: 'password', label: 'Password', placeholder: 'Password', keyboard: 'default' as const },
                { key: 'location', label: 'Location', placeholder: 'City', keyboard: 'default' as const },
                { key: 'availableHens', label: 'Available Hens', placeholder: '0', keyboard: 'number-pad' as const },
                { key: 'henSellPrice', label: 'Hen Sell Price (Rs)', placeholder: '900', keyboard: 'number-pad' as const },
                { key: 'eggBuyRate', label: 'Egg Buy Rate (Rs)', placeholder: '12', keyboard: 'number-pad' as const },
                { key: 'easyPaisaAccount', label: 'EasyPaisa Account', placeholder: '03xxxxxxxxx', keyboard: 'phone-pad' as const },
                { key: 'jazzCashAccount', label: 'JazzCash Account', placeholder: '03xxxxxxxxx', keyboard: 'phone-pad' as const },
                { key: 'whatsappNumber', label: 'WhatsApp Number', placeholder: '+92...', keyboard: 'phone-pad' as const },
              ].map((field) => (
                <View key={field.key} style={[styles.formField, { borderColor: colors.border }]}>
                  <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>{field.label}</Text>
                  <TextInput
                    style={[styles.formInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                    value={(form as any)[field.key]}
                    onChangeText={(value) => setForm(prev => ({ ...prev, [field.key]: value }))}
                    placeholder={field.placeholder}
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType={field.keyboard}
                    secureTextEntry={field.key === 'password'}
                  />
                </View>
              ))}

              <View style={[styles.formField, { borderColor: colors.border }]}>
                <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>Verified Seller</Text>
                <Switch
                  value={form.verified}
                  onValueChange={(value) => setForm(prev => ({ ...prev, verified: value }))}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={form.verified ? colors.primary : '#FFFFFF'}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowAddSeller(false)} style={[styles.cancelButton, { backgroundColor: colors.muted }]}>
                <Text style={[styles.cancelButtonText, { color: colors.mutedForeground }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={createSeller} style={[styles.confirmButton, { backgroundColor: colors.primary }]}>
                <Text style={styles.confirmButtonText}>Create Seller</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  scrollContent: { padding: 20 },
  statsBanner: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  bannerLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#FFFFFF', opacity: 0.9, marginBottom: 6 },
  bannerValue: { fontSize: 30, fontFamily: 'Inter_700Bold', color: '#FFFFFF', marginBottom: 6 },
  bannerSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#FFFFFF', opacity: 0.85 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  statBox: {
    width: '47%',
    flexGrow: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  statValue: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  addSellerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    marginBottom: 16,
  },
  addSellerBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' },
  cardInfo: { gap: 4, marginBottom: 12 },
  cardInfoText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  cardStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  miniStat: { flex: 1, alignItems: 'center', gap: 2 },
  miniStatValue: { fontSize: 13, fontFamily: 'Inter_700Bold', marginTop: 2 },
  miniStatLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  cardActions: { flexDirection: 'row', gap: 10 },
  smallButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 10,
  },
  smallButtonText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  userName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  userMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  userRight: { alignItems: 'flex-end', gap: 8 },
  userBalance: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  adjustBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  adjustBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  orderTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  orderType: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  orderMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  orderRight: { alignItems: 'flex-end', gap: 4 },
  orderAmount: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  orderStatus: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' },
  loadingContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyState: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  formField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  formLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', width: 120 },
  formInput: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  confirmButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' },
});
