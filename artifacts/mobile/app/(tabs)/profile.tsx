import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Platform, Pressable,
  TextInput, ActivityIndicator, Alert, Image, ImageBackground
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useHenFarm } from '@/contexts/HenFarmApiContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useToast } from '@/components/Toast';
import { cardShadow, heroShadow } from '@/constants/shadows';

function Field({
  label, value, onChangeText, colors, keyboardType, placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  colors: any;
  keyboardType?: 'default' | 'phone-pad' | 'numeric';
  placeholder?: string;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType || 'default'}
      />
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout, updateProfile, changePassword, isLoading } = useHenFarm();
  const { showToast } = useToast();

  const isSeller = user?.role === 'seller';

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.location || '');
  const [whatsappNumber, setWhatsappNumber] = useState(user?.whatsappNumber || '');
  const [easyPaisaAccount, setEasyPaisaAccount] = useState(user?.easyPaisaAccount || '');
  const [jazzCashAccount, setJazzCashAccount] = useState(user?.jazzCashAccount || '');
  const [bankName, setBankName] = useState(user?.bankName || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(user?.bankAccountNumber || '');
  const [bankAccountTitle, setBankAccountTitle] = useState(user?.bankAccountTitle || '');
  const [henSellPrice, setHenSellPrice] = useState(String(user?.henSellPrice || ''));
  const [eggBuyRate, setEggBuyRate] = useState(String(user?.eggBuyRate || ''));

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const initials = (user?.name || '?')
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const updates: Record<string, string> = {
        name, phone, location, whatsappNumber,
        easyPaisaAccount, jazzCashAccount, bankName, bankAccountNumber, bankAccountTitle,
      };
      if (isSeller) {
        updates.henSellPrice = henSellPrice;
        updates.eggBuyRate = eggBuyRate;
      }
      await updateProfile(updates as any);
      showToast('Profile updated', 'success');
    } catch (e: any) {
      showToast(e?.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (!currentPassword || !newPassword) {
      showToast('Fill in both password fields', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'warning');
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      showToast('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      showToast(e?.message || 'Failed to change password', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Platform.OS === 'web' ? 67 + 20 : insets.top + 20 },
          { paddingBottom: Platform.OS === 'web' ? 84 + 20 : insets.bottom + 84 + 20 },
        ]}
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
          <Text style={styles.title}>My Profile</Text>
        </ImageBackground>

        {/* Identity Card */}
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          style={[styles.identityCard, heroShadow(colors)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.identityName}>{user?.name}</Text>
          <Text style={styles.identityEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons
              name={user?.role === 'admin' ? 'shield-checkmark' : user?.role === 'seller' ? 'storefront' : 'person'}
              size={13}
              color="#FFFFFF"
            />
            <Text style={styles.roleBadgeText}>{user?.role?.toUpperCase()}</Text>
          </View>
        </LinearGradient>

        {/* Personal Info */}
        <View style={[styles.card, { backgroundColor: colors.card }, cardShadow(colors)]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Personal Information</Text>
          <Field label="Full Name" value={name} onChangeText={setName} colors={colors} />
          <Field label="Phone" value={phone} onChangeText={setPhone} colors={colors} keyboardType="phone-pad" />
          <Field label="WhatsApp Number" value={whatsappNumber} onChangeText={setWhatsappNumber} colors={colors} keyboardType="phone-pad" />
          <Field label="Location / City" value={location} onChangeText={setLocation} colors={colors} />
        </View>

        {/* Payment Accounts */}
        <View style={[styles.card, { backgroundColor: colors.card }, cardShadow(colors)]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Payment Accounts</Text>
          <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>
            Shown to buyers/sellers you trade with directly, so they can pay you.
          </Text>
          <Field label="EasyPaisa Account" value={easyPaisaAccount} onChangeText={setEasyPaisaAccount} colors={colors} keyboardType="phone-pad" />
          <Field label="JazzCash Account" value={jazzCashAccount} onChangeText={setJazzCashAccount} colors={colors} keyboardType="phone-pad" />
          <Field label="Bank Name" value={bankName} onChangeText={setBankName} colors={colors} />
          <Field label="Bank Account Number" value={bankAccountNumber} onChangeText={setBankAccountNumber} colors={colors} />
          <Field label="Bank Account Title" value={bankAccountTitle} onChangeText={setBankAccountTitle} colors={colors} />
        </View>

        {/* Seller Pricing */}
        {isSeller && (
          <View style={[styles.card, { backgroundColor: colors.card }, cardShadow(colors)]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>My Pricing</Text>
            <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>
              Set your own rates - this is what buyers see in the Marketplace.
            </Text>
            <Field label="Hen Sell Price (Rs)" value={henSellPrice} onChangeText={setHenSellPrice} colors={colors} keyboardType="numeric" />
            <Field label="Egg Buy Rate (Rs)" value={eggBuyRate} onChangeText={setEggBuyRate} colors={colors} keyboardType="numeric" />
          </View>
        )}

        <Pressable
          onPress={saveProfile}
          disabled={savingProfile}
          style={[styles.saveButton, { backgroundColor: colors.primary, opacity: savingProfile ? 0.6 : 1 }]}
        >
          {savingProfile ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </Pressable>

        {/* Change Password */}
        <View style={[styles.card, { backgroundColor: colors.card }, cardShadow(colors)]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Change Password</Text>
          <Field label="Current Password" value={currentPassword} onChangeText={setCurrentPassword} colors={colors} placeholder="••••••••" />
          <Field label="New Password" value={newPassword} onChangeText={setNewPassword} colors={colors} placeholder="••••••••" />
          <Field label="Confirm New Password" value={confirmPassword} onChangeText={setConfirmPassword} colors={colors} placeholder="••••••••" />
          <Pressable
            onPress={savePassword}
            disabled={savingPassword}
            style={[styles.secondaryButton, { borderColor: colors.primary, opacity: savingPassword ? 0.6 : 1 }]}
          >
            {savingPassword ? <ActivityIndicator size="small" color={colors.primary} /> : (
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Update Password</Text>
            )}
          </Pressable>
        </View>

        {/* Logout */}
        <Pressable onPress={handleLogout} style={[styles.logoutButton, { borderColor: colors.destructive }]}>
          <MaterialCommunityIcons name="logout" size={18} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>Log Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 24,
    padding: 20,
    minHeight: 90,
    overflow: 'hidden',
  },
  headerImage: { borderRadius: 24 },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,46,26,0.45)',
    borderRadius: 24,
  },
  headerBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerBadgeImage: { width: 22, height: 22 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  identityCard: { padding: 24, borderRadius: 20, alignItems: 'center', marginBottom: 20 },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 26, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  identityName: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#FFFFFF', marginBottom: 2 },
  identityEmail: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#FFFFFF', opacity: 0.85, marginBottom: 10 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  roleBadgeText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#FFFFFF', letterSpacing: 0.5 },
  card: { padding: 20, borderRadius: 18, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  cardSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 14, lineHeight: 17 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  input: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 46,
    fontSize: 14, fontFamily: 'Inter_500Medium',
  },
  saveButton: {
    height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  saveButtonText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  secondaryButton: {
    height: 46, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  secondaryButtonText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 52, borderRadius: 14, borderWidth: 1.5, marginBottom: 20,
  },
  logoutText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
});
