import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Platform, Pressable,
  Modal, TextInput, ActivityIndicator, RefreshControl, Image, ImageBackground,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { API_URL, useHenFarm } from '@/contexts/HenFarmApiContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatNumber } from '@/constants/helpers';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useToast } from '@/components/Toast';
import { cardShadow, heroShadow } from '@/constants/shadows';
import { useFocusEffect, useRouter } from 'expo-router';

interface SellerListing {
  userId: string;
  userName: string;
  location: string;
  totalHens: number;
  pricePerHen: number;
  eggBuyRate: number;
  responseMinutes: number;
  rating: number;
  verified: boolean;
  easyPaisaAccount?: string;
  jazzCashAccount?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountTitle?: string;
  whatsappNumber?: string;
}

export default function MarketplaceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { availableEggs, user, authFetch, token } = useHenFarm();
  const { showToast } = useToast();

  const [sellers, setSellers] = useState<SellerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<SellerListing | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [orderType, setOrderType] = useState<'buy-hen' | 'sell-egg'>('buy-hen');
  const [paymentMethod, setPaymentMethod] = useState<'easypaisa' | 'jazzcash' | 'bank'>('easypaisa');
  const [paymentProof, setPaymentProof] = useState('');
  const [paymentProofImage, setPaymentProofImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [receiverAccount, setReceiverAccount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSellers = useCallback(async () => {
    try {
      setLoading(true);
      const sellersRes = await fetch(`${API_URL}/marketplace/sellers`);
      const data = await sellersRes.json();
      if (data.success) setSellers(data.sellers || []);
    } catch {
      showToast('Failed to load marketplace. Check your connection.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchSellers(); }, [fetchSellers]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSellers();
    setRefreshing(false);
  }, [fetchSellers]);

  const handleBuyPress = (seller: SellerListing) => {
    setSelectedSeller(seller);
    setOrderType('buy-hen');
    setQuantity('1');
    // Auto-select first available payment method
    const defaultMethod = seller.easyPaisaAccount ? 'easypaisa' : seller.jazzCashAccount ? 'jazzcash' : 'bank';
    setPaymentMethod(defaultMethod);
    setPaymentProof('');
    setPaymentProofImage(null);
    setReceiverAccount('');
    setShowPurchaseModal(true);
  };

  const handleSellEggsPress = (seller: SellerListing) => {
    setSelectedSeller(seller);
    setOrderType('sell-egg');
    setQuantity(availableEggs > 0 ? String(Math.floor(availableEggs)) : '1');
    const defaultMethod = seller.easyPaisaAccount ? 'easypaisa' : seller.jazzCashAccount ? 'jazzcash' : 'bank';
    setPaymentMethod(defaultMethod);
    setPaymentProof('');
    setPaymentProofImage(null);
    setReceiverAccount('');
    setShowPurchaseModal(true);
  };

  // Pick screenshot from gallery and upload directly to Cloudinary
  const pickAndUploadImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('Gallery permission required to upload screenshot', 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const imageUri = result.assets[0].uri;
      setIsUploadingImage(true);

      // Step 1: Get signed upload params from backend
      // Use raw fetch with token directly — NOT authFetch because
      // authFetch sets Content-Type: application/json which breaks FormData
      const tokenRes = await fetch(`${API_URL}/upload/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const signData = await tokenRes.json();

      if (!signData.success) {
        showToast('Failed to prepare upload. Try again.', 'error');
        return;
      }

      // Step 2: Upload directly to Cloudinary
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: result.assets[0].mimeType || 'image/jpeg',
        name: 'payment-proof.jpg',
      } as any);
      formData.append('api_key', signData.apiKey);
      formData.append('timestamp', String(signData.timestamp));
      formData.append('signature', signData.signature);
      formData.append('folder', signData.folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );

      const uploadData = await uploadRes.json();

      if (uploadData.secure_url) {
        setPaymentProofImage(uploadData.secure_url);
        showToast('Screenshot uploaded!', 'success');
      } else {
        console.error('Cloudinary error:', JSON.stringify(uploadData));
        showToast('Upload failed. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Upload error:', err);
      showToast('Failed to upload screenshot. Try again.', 'error');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const confirmPurchase = async () => {
    if (!selectedSeller || !user) {
      showToast('Please login first', 'error');
      return;
    }

    const qty = Number(quantity);
    const unitPrice = orderType === 'buy-hen' ? selectedSeller.pricePerHen : selectedSeller.eggBuyRate;

    if (qty < 1) { showToast('Quantity must be at least 1', 'warning'); return; }
    if (orderType === 'buy-hen' && qty > selectedSeller.totalHens) {
      showToast(`Dealer only has ${selectedSeller.totalHens} hens available`, 'warning'); return;
    }
    if (orderType === 'sell-egg' && qty > availableEggs) {
      showToast(`You only have ${formatNumber(availableEggs)} eggs available to sell`, 'warning'); return;
    }

    setIsSubmitting(true);
    try {
      const response = await authFetch(`${API_URL}/orders/create`, {
        method: 'POST',
        body: JSON.stringify({
          sellerId: selectedSeller.userId,
          orderType,
          quantity: qty,
          pricePerUnit: unitPrice,
          paymentMethod,
          paymentProof,
          paymentProofImage: paymentProofImage || '',
          receiverAccount,
        }),
      });

      const data = await response.json();
      if (data.success && data.order) {
        setShowPurchaseModal(false);
        setSelectedSeller(null);
        showToast(
          orderType === 'buy-hen'
            ? `Order sent! ${qty} hens request pending dealer approval.`
            : `Egg sale request sent! Awaiting dealer response.`,
          'success'
        );
        router.push('/orders');
      } else {
        showToast(data.error || 'Order creation failed', 'error');
      }
    } catch {
      showToast('Failed to create order. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCost = (Number(quantity) || 0) * (selectedSeller
    ? (orderType === 'buy-hen' ? selectedSeller.pricePerHen : selectedSeller.eggBuyRate)
    : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Platform.OS === 'web' ? 67 + 20 : insets.top + 20 },
          { paddingBottom: Platform.OS === 'web' ? 84 + 20 : insets.bottom + 84 + 20 },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <ImageBackground
          source={require('@/assets/images/splash-bg.png')}
          style={styles.header}
          imageStyle={styles.headerImage}
        >
          <View style={styles.headerOverlay} />
          <View style={styles.headerBadge}>
            <Image source={require('@/assets/images/icon_3.png')} style={styles.headerBadgeImage} />
          </View>
          <View>
            <Text style={styles.title}>Marketplace</Text>
            <Text style={styles.subtitle}>
              Buy hens or sell eggs with verified dealers
            </Text>
          </View>
          <Pressable
            onPress={fetchSellers}
            style={styles.refreshBtn}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
          </Pressable>
        </ImageBackground>

        {/* Eggs Info Banner */}
        {availableEggs > 0 && (
          <LinearGradient
            colors={['#065F46', '#047857']}
            style={[styles.eggsInfoBanner, heroShadow(colors)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <MaterialCommunityIcons name="egg" size={28} color="#FFFFFF" />
            <View style={{ flex: 1 }}>
              <Text style={styles.eggsInfoTitle}>Eggs Ready to Sell!</Text>
              <Text style={styles.eggsInfoSubtitle}>
                You have {formatNumber(availableEggs)} eggs in stock — tap "Sell Eggs" on any dealer below.
              </Text>
            </View>
          </LinearGradient>
        )}

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading sellers...</Text>
          </View>
        )}

        {/* Empty State */}
        {!loading && sellers.length === 0 && (
          <View style={[styles.emptyState, { backgroundColor: colors.card }, cardShadow(colors)]}>
            <Image source={require('@/assets/images/icon_3.png')} style={styles.emptyStateImage} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Sellers Available</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No sellers are listing hens right now. Pull down to refresh!
            </Text>
          </View>
        )}

        {/* Seller Cards */}
        {!loading && sellers.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {sellers.length} Verified Dealer{sellers.length !== 1 ? 's' : ''} Available
            </Text>

            {sellers.map((seller) => (
              <View
                key={seller.userId}
                style={[styles.sellerCard, { backgroundColor: colors.card, borderColor: colors.border }, cardShadow(colors)]}
              >
                {/* Card Header */}
                <View style={styles.sellerHeader}>
                  <View style={[styles.avatarCircle, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="person" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.sellerInfo}>
                    <View style={styles.sellerNameRow}>
                      <Text
                        style={[styles.sellerName, { color: colors.foreground }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {seller.userName}
                      </Text>
                      {seller.verified && (
                        <View style={styles.verifiedBadge}>
                          <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                          <Text style={styles.verifiedText}>Verified</Text>
                        </View>
                      )}
                    </View>
                    {seller.location ? (
                      <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={13} color={colors.mutedForeground} />
                        <Text style={[styles.location, { color: colors.mutedForeground }]}>
                          {seller.location}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {seller.rating > 0 && (
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={13} color="#F59E0B" />
                      <Text style={styles.rating}>{seller.rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>

                {/* Pricing Row */}
                <View style={[styles.pricingRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.pricingItem}>
                    <MaterialCommunityIcons name="egg" size={18} color={colors.primary} />
                    <View>
                      <Text style={[styles.pricingLabel, { color: colors.mutedForeground }]}>Hen Price</Text>
                      <Text style={[styles.pricingValue, { color: colors.foreground }]}>
                        Rs {formatNumber(seller.pricePerHen)}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.pricingDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.pricingItem}>
                    <MaterialCommunityIcons name="cash" size={18} color="#10B981" />
                    <View>
                      <Text style={[styles.pricingLabel, { color: colors.mutedForeground }]}>Egg Buy Rate</Text>
                      <Text style={[styles.pricingValue, { color: '#10B981' }]}>
                        Rs {formatNumber(seller.eggBuyRate)}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.pricingDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.pricingItem}>
                    <Ionicons name="layers" size={18} color="#F59E0B" />
                    <View>
                      <Text style={[styles.pricingLabel, { color: colors.mutedForeground }]}>Available</Text>
                      <Text style={[styles.pricingValue, { color: '#F59E0B' }]}>
                        {seller.totalHens} hens
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Response time */}
                {seller.responseMinutes > 0 && (
                  <View style={styles.responseRow}>
                    <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
                    <Text style={[styles.responseText, { color: colors.mutedForeground }]}>
                      Responds within {seller.responseMinutes} min
                    </Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.dealerActions}>
                  <Pressable
                    onPress={() => handleBuyPress(seller)}
                    style={({ pressed }) => [
                      styles.dealerBtn,
                      { backgroundColor: colors.primary },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <MaterialCommunityIcons name="egg" size={16} color="#FFFFFF" />
                    <Text style={styles.dealerBtnText}>Buy Hens</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleSellEggsPress(seller)}
                    style={({ pressed }) => [
                      styles.dealerBtn,
                      { backgroundColor: '#047857' },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <MaterialCommunityIcons name="cash-multiple" size={16} color="#FFFFFF" />
                    <Text style={styles.dealerBtnText}>Sell Eggs</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Order Modal */}
      <Modal
        visible={showPurchaseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPurchaseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {/* Modal Handle */}
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {orderType === 'buy-hen' ? '🐔 Purchase Hens' : '🥚 Sell Eggs'}
              </Text>
              <Pressable
                onPress={() => setShowPurchaseModal(false)}
                style={[styles.closeBtn, { backgroundColor: colors.background }]}
              >
                <Ionicons name="close" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedSeller && (
                <>
                  {/* Seller Info Summary */}
                  <View style={[styles.modalSellerRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Ionicons name="person-circle-outline" size={32} color={colors.primary} />
                    <View>
                      <Text style={[styles.modalSellerName, { color: colors.foreground }]}>{selectedSeller.userName}</Text>
                      <Text style={[styles.modalSellerSub, { color: colors.mutedForeground }]}>
                        {orderType === 'buy-hen'
                          ? `Rs ${formatNumber(selectedSeller.pricePerHen)} per hen`
                          : `Pays Rs ${formatNumber(selectedSeller.eggBuyRate)} per egg unit`}
                      </Text>
                    </View>
                  </View>

                  {/* Quantity Input */}
                  <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Quantity</Text>
                  <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Ionicons name="layers-outline" size={20} color="#94A3B8" style={{ marginRight: 10 }} />
                    <TextInput
                      style={[styles.modalInput, { color: colors.foreground }]}
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="number-pad"
                      placeholder="Enter quantity"
                      placeholderTextColor="#64748B"
                    />
                  </View>

                  {/* Total Cost */}
                  <View style={[styles.totalCostBox, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                    <Text style={[styles.totalCostLabel, { color: colors.mutedForeground }]}>Total Amount</Text>
                    <Text style={[styles.totalCostValue, { color: colors.primary }]}>
                      Rs {formatNumber(totalCost)}
                    </Text>
                  </View>

                  {/* Payment Method */}
                  <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Payment Method</Text>
                  <View style={styles.paymentMethodsRow}>
                    {(['easypaisa', 'jazzcash', 'bank'] as const).map((method) => {
                      const isAvailable =
                        method === 'easypaisa' ? !!selectedSeller.easyPaisaAccount :
                        method === 'jazzcash' ? !!selectedSeller.jazzCashAccount :
                        !!selectedSeller.bankAccountNumber;
                      const isSelected = paymentMethod === method;
                      return (
                        <Pressable
                          key={method}
                          onPress={() => isAvailable && setPaymentMethod(method)}
                          style={[
                            styles.paymentMethodBtn,
                            {
                              backgroundColor: isSelected ? colors.primary : colors.background,
                              borderColor: isSelected ? colors.primary : colors.border,
                              opacity: isAvailable ? 1 : 0.35,
                            },
                          ]}
                        >
                          <Text style={[
                            styles.paymentMethodText,
                            { color: isSelected ? '#FFFFFF' : colors.mutedForeground },
                          ]}>
                            {method === 'easypaisa' ? 'EasyPaisa' : method === 'jazzcash' ? 'JazzCash' : 'Bank'}
                          </Text>
                          {!isAvailable && (
                            <Text style={[styles.paymentMethodNA, { color: colors.mutedForeground }]}>N/A</Text>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Payment Details */}
                  <View style={[styles.paymentDetailsBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    {orderType === 'buy-hen' ? (
                      <>
                        <Text style={[styles.paymentDetailsTitle, { color: colors.foreground }]}>
                          Send Payment To:
                        </Text>
                        {paymentMethod === 'easypaisa' && selectedSeller.easyPaisaAccount && (
                          <Text style={[styles.paymentDetailText, { color: colors.foreground }]}>
                            📱 EasyPaisa: {selectedSeller.easyPaisaAccount}
                          </Text>
                        )}
                        {paymentMethod === 'jazzcash' && selectedSeller.jazzCashAccount && (
                          <Text style={[styles.paymentDetailText, { color: colors.foreground }]}>
                            📱 JazzCash: {selectedSeller.jazzCashAccount}
                          </Text>
                        )}
                        {paymentMethod === 'bank' && selectedSeller.bankName && (
                          <>
                            <Text style={[styles.paymentDetailText, { color: colors.foreground }]}>
                              🏦 Bank: {selectedSeller.bankName}
                            </Text>
                            <Text style={[styles.paymentDetailText, { color: colors.foreground }]}>
                              Account: {selectedSeller.bankAccountNumber} ({selectedSeller.bankAccountTitle})
                            </Text>
                          </>
                        )}
                        {/* Screenshot Upload */}
                        <Text style={[styles.paymentDetailHint, { color: colors.mutedForeground, marginTop: 8 }]}>
                          Upload payment screenshot:
                        </Text>
                        {paymentProofImage ? (
                          <View style={styles.screenshotPreviewWrapper}>
                            <Image
                              source={{ uri: paymentProofImage }}
                              style={styles.screenshotPreview}
                              resizeMode="cover"
                            />
                            <Pressable
                              onPress={() => setPaymentProofImage(null)}
                              style={styles.screenshotRemoveBtn}
                            >
                              <Ionicons name="close-circle" size={22} color="#EF4444" />
                            </Pressable>
                          </View>
                        ) : (
                          <Pressable
                            onPress={pickAndUploadImage}
                            disabled={isUploadingImage}
                            style={[styles.uploadBtn, { borderColor: colors.primary, opacity: isUploadingImage ? 0.6 : 1 }]}
                          >
                            {isUploadingImage ? (
                              <>
                                <ActivityIndicator size="small" color={colors.primary} />
                                <Text style={[styles.uploadBtnText, { color: colors.primary }]}>Uploading...</Text>
                              </>
                            ) : (
                              <>
                                <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
                                <Text style={[styles.uploadBtnText, { color: colors.primary }]}>Upload Screenshot</Text>
                              </>
                            )}
                          </Pressable>
                        )}
                      </>
                    ) : (
                      <>
                        <Text style={[styles.paymentDetailsTitle, { color: colors.foreground }]}>
                          Receive Payment At:
                        </Text>
                        <Text style={[styles.paymentDetailHint, { color: colors.mutedForeground }]}>
                          Enter your {paymentMethod === 'easypaisa' ? 'EasyPaisa' : paymentMethod === 'jazzcash' ? 'JazzCash' : 'bank'} account:
                        </Text>
                        <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 8 }]}>
                          <Ionicons name="wallet-outline" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                          <TextInput
                            style={[styles.modalInput, { color: colors.foreground }]}
                            value={receiverAccount}
                            onChangeText={setReceiverAccount}
                            placeholder={paymentMethod === 'bank' ? 'Your bank account number' : 'Your account (03xxxxxxxxx)'}
                            placeholderTextColor="#64748B"
                            autoCapitalize="none"
                          />
                        </View>
                      </>
                    )}
                  </View>

                  {/* Modal Actions */}
                  <View style={styles.modalActions}>
                    <Pressable
                      onPress={() => setShowPurchaseModal(false)}
                      style={[styles.modalCancelBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                    >
                      <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={confirmPurchase}
                      disabled={isSubmitting}
                      style={[styles.modalConfirmBtn, { backgroundColor: colors.primary, opacity: isSubmitting ? 0.6 : 1 }]}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.modalConfirmText}>
                          {orderType === 'buy-hen' ? 'Send Request' : 'Confirm Sale'}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
    borderRadius: 24,
    padding: 20,
    paddingTop: 16,
    minHeight: 120,
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
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeImage: { width: 20, height: 20 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 2, color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.9)' },
  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eggsInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    gap: 14,
  },
  eggsInfoTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#FFFFFF', marginBottom: 2 },
  eggsInfoSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#D1FAE5', lineHeight: 17 },
  loadingContainer: { alignItems: 'center', paddingVertical: 60, gap: 14 },
  loadingText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  emptyState: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyStateImage: { width: 72, height: 72, opacity: 0.5 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 16, opacity: 0.8 },
  sellerCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 18,
    padding: 16,
  },
  sellerHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 12 },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerInfo: { flex: 1, minWidth: 0 },
  sellerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  sellerName: { fontSize: 16, fontFamily: 'Inter_700Bold', flexShrink: 1 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    flexShrink: 0,
  },
  verifiedText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#065F46' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  location: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
  },
  rating: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#F59E0B' },
  pricingRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  pricingItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  pricingDivider: { width: 1 },
  pricingLabel: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  pricingValue: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  responseRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 14 },
  responseText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  dealerActions: { flexDirection: 'row', gap: 10 },
  dealerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
    gap: 8,
  },
  dealerBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  modalSellerName: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  modalSellerSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  inputLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 16,
  },
  modalInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
  totalCostBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  totalCostLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  totalCostValue: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  paymentMethodsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  paymentMethodBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  paymentMethodNA: { fontSize: 9, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 1, opacity: 0.7 },
  paymentDetailsBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    gap: 6,
  },
  paymentDetailsTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  paymentDetailText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  paymentDetailHint: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  modalConfirmBtn: {
    flex: 2,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  uploadBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  screenshotPreviewWrapper: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  screenshotPreview: {
    width: '100%',
    height: 160,
    borderRadius: 12,
  },
  screenshotRemoveBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
});
