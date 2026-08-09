import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable, Alert, ActivityIndicator, Linking } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { API_URL, useHenFarm } from '@/contexts/HenFarmApiContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatNumber, formatDate } from '@/constants/helpers';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { cardShadow, heroShadow } from '@/constants/shadows';
import { TransactionRow } from '@/components/TransactionRow';

interface Order {
  _id: string;
  buyerId: { _id: string; name: string; phone: string; whatsappNumber?: string };
  sellerId: { _id: string; name: string; phone: string; whatsappNumber?: string; easyPaisaAccount?: string; jazzCashAccount?: string; bankName?: string; bankAccountNumber?: string; bankAccountTitle?: string };
  orderType: 'buy-hen' | 'sell-egg';
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'completed' | 'cancelled';
  paymentMethod?: string;
  paymentProof?: string;
  buyerPaymentAccount?: string;
  whatsappProof?: string;
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
  henExpiry?: {
    status: 'incubating' | 'laying' | 'expired';
    daysRemaining: number;
    expiresAt: string;
  } | null;
}

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, authFetch, totalEggsEarned, referralActivity } = useHenFarm();
  const { tab } = useLocalSearchParams<{ tab?: string }>();

  const [buyOrders, setBuyOrders] = useState<Order[]>([]);
  const [sellOrders, setSellOrders] = useState<Order[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'myOrders' | 'approvals' | 'earnings'>(
    tab === 'earnings' ? 'earnings' : 'myOrders'
  );

  // Every eggs-for-cash withdrawal is a dealer-approved sell-egg order the
  // user initiated (order.buyerId is always the initiator, regardless of
  // orderType - see routes/orders.ts).
  const withdrawals = useMemo(
    () => buyOrders.filter((o) => o.orderType === 'sell-egg' && o.status === 'approved'),
    [buyOrders]
  );
  const totalWithdrawn = useMemo(
    () => withdrawals.reduce((sum, o) => sum + o.totalAmount, 0),
    [withdrawals]
  );

  useEffect(() => {
    if (user?._id) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user?._id) return;
    
    try {
      setLoading(true);
      
      // Fetch orders where user is buyer or seller
      const myOrdersResponse = await authFetch(`${API_URL}/orders/my-orders/${user._id}`);
      const myOrdersData = await myOrdersResponse.json();

      if (myOrdersData.buyOrders) {
        setBuyOrders(myOrdersData.buyOrders);
      }
      if (myOrdersData.sellOrders) {
        setSellOrders(myOrdersData.sellOrders);
      }

      // Fetch pending orders waiting for approval (where user is seller)
      const approvalsResponse = await authFetch(`${API_URL}/orders/pending-approvals/${user._id}`);
      const approvalsData = await approvalsResponse.json();
      
      if (approvalsData.pendingOrders) {
        setPendingApprovals(approvalsData.pendingOrders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      Alert.alert('Error', 'Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrder = async (order: Order) => {
    if (!user?._id) return;

    const isHenOrder = order.orderType === 'buy-hen';
    Alert.alert(
      'Approve Order',
      isHenOrder
        ? `Have you RECEIVED Rs ${formatNumber(order.totalAmount)} from the buyer? Approving will assign ${order.quantity} hens to their farm.`
        : `Have you SENT Rs ${formatNumber(order.totalAmount)} to the buyer? Approving will remove ${order.quantity} eggs from their inventory.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              const response = await authFetch(`${API_URL}/orders/approve/${order._id}`, {
                method: 'POST',
              });

              const data = await response.json();
              
              if (data.success && data.order) {
                Alert.alert('Success', 'Order approved successfully!');
                fetchOrders(); // Refresh orders
              } else {
                Alert.alert('Error', data.error || 'Failed to approve order');
              }
            } catch (error) {
              console.error('Approve error:', error);
              Alert.alert('Error', 'Failed to approve order. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleRejectOrder = async (orderId: string) => {
    if (!user?._id) return;
    
    Alert.prompt(
      'Reject Order',
      'Please provide a reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (reason?: string) => {
            try {
              const response = await authFetch(`${API_URL}/orders/reject/${orderId}`, {
                method: 'POST',
                body: JSON.stringify({
                  rejectionReason: reason || 'Payment not received',
                }),
              });

              const data = await response.json();
              
              if (data.success && data.order) {
                Alert.alert('Order Rejected', 'The order has been rejected.');
                fetchOrders(); // Refresh orders
              } else {
                Alert.alert('Error', data.error || 'Failed to reject order');
              }
            } catch (error) {
              console.error('Reject error:', error);
              Alert.alert('Error', 'Failed to reject order. Please try again.');
            }
          },
        },
      ],
      'plain-text',
      ''
    );
  };

  const openWhatsApp = (phoneNumber: string, orderDetails: string) => {
    const message = encodeURIComponent(orderDetails);
    const url = `whatsapp://send?phone=${phoneNumber}&text=${message}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert('Error', 'WhatsApp is not installed on this device');
        }
      })
      .catch((err) => {
        console.error('WhatsApp error:', err);
        Alert.alert('Error', 'Failed to open WhatsApp');
      });
  };

  const renderOrderCard = (order: Order, isBuyer: boolean) => {
    const isHenOrder = order.orderType === 'buy-hen';
    const otherParty = isBuyer ? order.sellerId : order.buyerId;
    
    const getStatusColor = () => {
      switch (order.status) {
        case 'approved': return '#00C853';
        case 'rejected': return '#D32F2F';
        case 'pending': return '#FFA000';
        case 'expired': return '#94A3B8';
        default: return colors.mutedForeground;
      }
    };

    const getStatusIcon = () => {
      switch (order.status) {
        case 'approved': return 'checkmark-circle';
        case 'rejected': return 'close-circle';
        case 'pending': return 'time';
        case 'expired': return 'alert-circle';
        default: return 'help-circle';
      }
    };

    return (
      <View
        key={order._id}
        style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        {/* Header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderTypeRow}>
            <MaterialCommunityIcons
              name={isHenOrder ? 'egg' : 'cash'}
              size={24}
              color={colors.primary}
            />
            <Text style={[styles.orderType, { color: colors.foreground }]}>
              {isBuyer ? (isHenOrder ? 'Buying Hens' : 'Selling Eggs') : (isHenOrder ? 'Selling Hens' : 'Buying Eggs')}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
            <Ionicons name={getStatusIcon()} size={16} color={getStatusColor()} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Order Details */}
        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
              {isBuyer ? 'Seller' : 'Buyer'}:
            </Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>
              {otherParty?.name || 'Unknown'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Quantity:</Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>
              {order.quantity} {isHenOrder ? 'hens' : 'eggs'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Price/Unit:</Text>
            <Text style={[styles.detailValue, { color: colors.foreground }]}>
              Rs {formatNumber(order.pricePerUnit)}
            </Text>
          </View>
          
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Total Amount:</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              Rs {formatNumber(order.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Payment Details (for pending orders) */}
        {order.status === 'pending' && isBuyer && order.sellerId && (
          <View style={[styles.paymentSection, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}>
            <Text style={[styles.paymentTitle, { color: colors.primary }]}>
              <Ionicons name="card-outline" size={14} /> Seller Payment Details
            </Text>
            {order.sellerId.easyPaisaAccount && (
              <Text style={[styles.paymentDetail, { color: colors.foreground }]}>
                EasyPaisa: {order.sellerId.easyPaisaAccount}
              </Text>
            )}
            {order.sellerId.jazzCashAccount && (
              <Text style={[styles.paymentDetail, { color: colors.foreground }]}>
                JazzCash: {order.sellerId.jazzCashAccount}
              </Text>
            )}
            {order.sellerId.bankName && (
              <Text style={[styles.paymentDetail, { color: colors.foreground }]}>
                Bank: {order.sellerId.bankName}
              </Text>
            )}
            {order.sellerId.bankAccountNumber && (
              <Text style={[styles.paymentDetail, { color: colors.foreground }]}>
                Account: {order.sellerId.bankAccountNumber}
              </Text>
            )}
            {order.paymentMethod && (
              <Text style={[styles.paymentDetail, { color: colors.foreground }]}>
                Method: {order.paymentMethod}
              </Text>
            )}
            {order.orderType === 'sell-egg' && order.buyerPaymentAccount && (
              <Text style={[styles.paymentDetail, { color: colors.foreground }]}>
                Your account to receive payment: {order.buyerPaymentAccount}
              </Text>
            )}
            {order.paymentProof && (
              <Text style={[styles.paymentDetail, { color: colors.accent }]}>
                Your Transaction ID: {order.paymentProof}
              </Text>
            )}
          </View>
        )}

        {/* Rejection Reason */}
        {order.status === 'rejected' && order.rejectionReason && (
          <View style={[styles.rejectionBox, { backgroundColor: '#D32F2F15', borderColor: '#D32F2F' }]}>
            <Ionicons name="information-circle" size={16} color="#D32F2F" />
            <Text style={[styles.rejectionText, { color: '#D32F2F' }]}>
              Reason: {order.rejectionReason}
            </Text>
          </View>
        )}

        {/* Hen Expiry Countdown (approved buy-hen orders only) */}
        {isBuyer && isHenOrder && order.henExpiry && (
          <View
            style={[
              styles.expiryBox,
              {
                backgroundColor: (order.henExpiry.status === 'expired' ? '#94A3B8' : colors.primary) + '10',
                borderColor: order.henExpiry.status === 'expired' ? '#94A3B8' : colors.primary,
              },
            ]}
          >
            <Ionicons
              name="time-outline"
              size={14}
              color={order.henExpiry.status === 'expired' ? '#94A3B8' : colors.primary}
            />
            <Text
              style={[
                styles.expiryText,
                { color: order.henExpiry.status === 'expired' ? '#94A3B8' : colors.primary },
              ]}
            >
              {order.henExpiry.status === 'expired'
                ? 'Batch expired - no longer laying'
                : order.henExpiry.status === 'incubating'
                ? `Incubating - starts laying in ${order.henExpiry.daysRemaining} day${order.henExpiry.daysRemaining !== 1 ? 's' : ''}`
                : `Laying - expires in ${order.henExpiry.daysRemaining} day${order.henExpiry.daysRemaining !== 1 ? 's' : ''}`}
            </Text>
          </View>
        )}

        {/* Date */}
        <Text style={[styles.orderDate, { color: colors.mutedForeground }]}>
          {new Date(order.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>

        {/* Actions */}
        {order.status === 'pending' && (
          <View style={styles.actionsRow}>
            {isBuyer && otherParty?.whatsappNumber && (
              <Pressable
                onPress={() =>
                  openWhatsApp(
                    otherParty.whatsappNumber!,
                    `Hi! Regarding Order #${order._id.slice(-6)}: ${order.quantity} ${isHenOrder ? 'hens' : 'eggs'} for Rs ${formatNumber(order.totalAmount)}. I have sent the payment via ${order.paymentMethod || 'EasyPaisa'}${order.paymentProof ? ` (Transaction ID: ${order.paymentProof})` : ''}.`
                  )
                }
                style={[styles.whatsappButton, { backgroundColor: '#25D366' }]}
              >
                <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                <Text style={styles.whatsappButtonText}>Contact Seller</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderApprovalCard = (order: Order) => {
    const isHenOrder = order.orderType === 'buy-hen';
    const buyer = order.buyerId;

    return (
      <View
        key={order._id}
        style={[styles.approvalCard, { backgroundColor: colors.card, borderColor: colors.accent }]}
      >
        <View style={[styles.approvalHeader, { backgroundColor: colors.accent + '15' }]}>
          <MaterialCommunityIcons
            name={isHenOrder ? 'egg' : 'cash'}
            size={28}
            color={colors.accent}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.approvalTitle, { color: colors.foreground }]}>
              New {isHenOrder ? 'Hen Sale' : 'Egg Purchase'} Request
            </Text>
            <Text style={[styles.approvalSubtitle, { color: colors.mutedForeground }]}>
              From: {buyer?.name || 'Unknown'}
            </Text>
          </View>
        </View>

        <View style={styles.approvalDetails}>
          <View style={styles.approvalRow}>
            <Text style={[styles.approvalLabel, { color: colors.mutedForeground }]}>Quantity:</Text>
            <Text style={[styles.approvalValue, { color: colors.foreground }]}>
              {order.quantity} {isHenOrder ? 'hens' : 'eggs'}
            </Text>
          </View>
          <View style={styles.approvalRow}>
            <Text style={[styles.approvalLabel, { color: colors.mutedForeground }]}>Amount:</Text>
            <Text style={[styles.approvalAmountValue, { color: colors.accent }]}>
              Rs {formatNumber(order.totalAmount)}
            </Text>
          </View>
          {buyer?.whatsappNumber && (
            <Pressable
              onPress={() =>
                openWhatsApp(
                  buyer.whatsappNumber!,
                  `Hi! Regarding your ${isHenOrder ? 'hen purchase' : 'egg sale'} request #${order._id.slice(-6)}: ${order.quantity} ${isHenOrder ? 'hens' : 'eggs'} for Rs ${formatNumber(order.totalAmount)}.`
                )
              }
              style={styles.approvalRow}
            >
              <Text style={[styles.approvalLabel, { color: colors.mutedForeground }]}>
                <Ionicons name="logo-whatsapp" size={14} color="#25D366" /> WhatsApp:
              </Text>
              <Text style={[styles.approvalValue, { color: '#25D366' }]}>
                {buyer.whatsappNumber}
              </Text>
            </Pressable>
          )}
          {order.paymentMethod && (
            <View style={styles.approvalRow}>
              <Text style={[styles.approvalLabel, { color: colors.mutedForeground }]}>
                <Ionicons name="card-outline" size={14} /> Payment:
              </Text>
              <Text style={[styles.approvalValue, { color: colors.foreground }]}>
                {order.paymentMethod}
              </Text>
            </View>
          )}
          {order.orderType === 'sell-egg' && order.buyerPaymentAccount && (
            <View style={[styles.paymentProofBox, { backgroundColor: '#00B0FF15', borderColor: '#00B0FF' }]}>
              <Ionicons name="card-outline" size={14} color="#00B0FF" />
              <Text style={[styles.paymentProofText, { color: '#00B0FF' }]}>
                Send payment to: {order.buyerPaymentAccount}
              </Text>
            </View>
          )}
          {order.paymentProof && (
            <View style={[styles.paymentProofBox, { backgroundColor: '#FFA00015', borderColor: '#FFA000' }]}>
              <Ionicons name="document-text-outline" size={14} color="#FFA000" />
              <Text style={[styles.paymentProofText, { color: '#FFA000' }]}>
                Transaction ID: {order.paymentProof}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.approvalActions}>
          <Pressable
            onPress={() => handleRejectOrder(order._id)}
            style={[styles.rejectButton, { backgroundColor: '#D32F2F' }]}
          >
            <Ionicons name="close-circle" size={20} color="#FFFFFF" />
            <Text style={styles.rejectButtonText}>Reject</Text>
          </Pressable>
          <Pressable
            onPress={() => handleApproveOrder(order)}
            style={[styles.approveButton, { backgroundColor: '#00C853' }]}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.approveButtonText}>Approve</Text>
          </Pressable>
        </View>

        <Text style={[styles.approvalDate, { color: colors.mutedForeground }]}>
          {new Date(order.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === 'web' ? 67 + 20 : insets.top + 20,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Orders</Text>
        <Pressable onPress={fetchOrders}>
          <Ionicons name="refresh" size={24} color={colors.primary} />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => setActiveTab('myOrders')}
          style={[
            styles.tab,
            activeTab === 'myOrders' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'myOrders' ? colors.primary : colors.mutedForeground },
            ]}
          >
            My Orders ({buyOrders.length + sellOrders.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('approvals')}
          style={[
            styles.tab,
            activeTab === 'approvals' && { borderBottomColor: colors.accent, borderBottomWidth: 2 },
          ]}
        >
          <View style={styles.tabWithBadge}>
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'approvals' ? colors.accent : colors.mutedForeground },
              ]}
            >
              Pending Approvals
            </Text>
            {pendingApprovals.length > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                <Text style={styles.badgeText}>{pendingApprovals.length}</Text>
              </View>
            )}
          </View>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('earnings')}
          style={[
            styles.tab,
            activeTab === 'earnings' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'earnings' ? colors.primary : colors.mutedForeground },
            ]}
          >
            Earnings
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === 'web' ? 84 + 20 : insets.bottom + 84 + 20 },
        ]}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Loading orders...
            </Text>
          </View>
        ) : activeTab === 'myOrders' ? (
          <>
            {buyOrders.length === 0 && sellOrders.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                <MaterialCommunityIcons name="package-variant" size={64} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Orders Yet</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Start buying hens or selling eggs to see your orders here.
                </Text>
              </View>
            ) : (
              <>
                {buyOrders.length > 0 && (
                  <>
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                      Buy Orders ({buyOrders.length})
                    </Text>
                    {buyOrders.map((order) => renderOrderCard(order, true))}
                  </>
                )}
                {sellOrders.length > 0 && (
                  <>
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                      Sell Orders ({sellOrders.length})
                    </Text>
                    {sellOrders.map((order) => renderOrderCard(order, false))}
                  </>
                )}
              </>
            )}
          </>
        ) : activeTab === 'approvals' ? (
          <>
            {pendingApprovals.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                <MaterialCommunityIcons name="check-decagram" size={64} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  No Pending Approvals
                </Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Orders waiting for your approval will appear here.
                </Text>
              </View>
            ) : (
              pendingApprovals.map((order) => renderApprovalCard(order))
            )}
          </>
        ) : (
          <>
            {/* Totals */}
            <View style={styles.earningsTotalsRow}>
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                style={[styles.earningsTotalCard, heroShadow(colors)]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons name="egg" size={22} color="#FFFFFF" />
                <Text style={styles.earningsTotalValue}>{formatNumber(totalEggsEarned)}</Text>
                <Text style={styles.earningsTotalLabel}>Eggs Earned</Text>
              </LinearGradient>
              <View style={[styles.earningsTotalCard, { backgroundColor: colors.card }, cardShadow(colors)]}>
                <MaterialCommunityIcons name="cash-multiple" size={22} color={colors.primary} />
                <Text style={[styles.earningsTotalValue, { color: colors.foreground }]}>
                  Rs {formatNumber(totalWithdrawn)}
                </Text>
                <Text style={[styles.earningsTotalLabel, { color: colors.mutedForeground }]}>Total Withdrawn</Text>
              </View>
            </View>

            {/* Withdrawal History */}
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Withdrawal History ({withdrawals.length})
            </Text>
            {withdrawals.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                <MaterialCommunityIcons name="cash-remove" size={56} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Withdrawals Yet</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  When a dealer approves an egg sale, the cash you received shows up here.
                </Text>
              </View>
            ) : (
              <View style={[styles.withdrawalList, { backgroundColor: colors.card }, cardShadow(colors)]}>
                {withdrawals.map((order) => (
                  <View key={order._id} style={[styles.withdrawalRow, { borderBottomColor: colors.border }]}>
                    <View style={[styles.withdrawalIcon, { backgroundColor: colors.primary + '15' }]}>
                      <MaterialCommunityIcons name="cash-check" size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.withdrawalTitle, { color: colors.foreground }]}>
                        Withdrawal from {order.sellerId?.name || 'dealer'}
                      </Text>
                      <Text style={[styles.withdrawalDate, { color: colors.mutedForeground }]}>
                        {formatDate(order.approvedAt || order.createdAt)}
                      </Text>
                    </View>
                    <Text style={[styles.withdrawalAmount, { color: colors.primary }]}>
                      +Rs {formatNumber(order.totalAmount)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Earning History */}
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Earning History ({referralActivity.length})
            </Text>
            {referralActivity.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                <MaterialCommunityIcons name="egg-off" size={56} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Earnings Yet</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Eggs from your hens or referral bonuses will show up here as they're credited.
                </Text>
              </View>
            ) : (
              <View style={[styles.withdrawalList, { backgroundColor: colors.card }, cardShadow(colors)]}>
                {referralActivity.map((tx) => (
                  <TransactionRow key={tx._id} transaction={tx} />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  tabWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  scrollContent: {
    padding: 20,
  },
  earningsTotalsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  earningsTotalCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
  },
  earningsTotalValue: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  earningsTotalLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  withdrawalList: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  withdrawalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  withdrawalIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawalTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  withdrawalDate: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  withdrawalAmount: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  emptyState: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
    marginTop: 8,
  },
  orderCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderType: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  orderDetails: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  detailValue: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  totalValue: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  paymentSection: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
    gap: 6,
  },
  paymentTitle: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  paymentDetail: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
  },
  rejectionText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  expiryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
  },
  expiryText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  orderDate: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 12,
  },
  actionsRow: {
    marginTop: 12,
    gap: 8,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
  },
  whatsappButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  approvalCard: {
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  approvalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  approvalTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  approvalSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  approvalDetails: {
    padding: 16,
    gap: 10,
  },
  approvalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  approvalLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  approvalValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  approvalAmountValue: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  paymentProofBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  paymentProofText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  approvalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 12,
  },
  rejectButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 12,
  },
  approveButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  approvalDate: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
});
