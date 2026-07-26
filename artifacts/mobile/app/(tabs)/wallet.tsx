import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable, TextInput, Alert, FlatList } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useSimulation } from '@/contexts/SimulationContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SimBadge } from '@/components/SimBadge';
import { TransactionRow } from '@/components/TransactionRow';
import { formatNumber } from '@/constants/helpers';
import { Ionicons } from '@expo/vector-icons';

export default function WalletScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { virtualBalance, transactions, simState, deposit, withdraw } = useSimulation();
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);

  const handleDeposit = () => {
    const num = Number(amount);
    if (num > 0) {
      deposit(num);
      setAmount('');
      setShowDeposit(false);
    }
  };

  const handleWithdraw = () => {
    const num = Number(amount);
    if (num > 0) {
      withdraw(num);
      setAmount('');
      setShowWithdraw(false);
    }
  };

  const handlePaymentDemo = (method: string) => {
    Alert.alert(
      'Demo Only',
      `Real payments are disabled. This is an educational simulation. "${method}" is shown for demonstration purposes only.`
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.banner, { backgroundColor: colors.destructive }]}>
        <Text style={[styles.bannerText, { color: colors.destructiveForeground }]}>
          No real money accepted. All balances and transactions are simulated for educational purposes.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: 20 },
          { paddingBottom: Platform.OS === 'web' ? 84 + 20 : insets.bottom + 84 + 20 },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Wallet</Text>
        </View>

        <View style={[styles.balanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>Virtual Balance</Text>
          <Text style={[styles.balanceValue, { color: colors.foreground }]}>{formatNumber(virtualBalance)}</Text>
          <Text style={[styles.balanceSubtitle, { color: colors.mutedForeground }]}>Simulation Coins</Text>
        </View>

        {simState.phase !== 'collapsed' && (
          <View style={styles.buttonsRow}>
            <Pressable
              onPress={() => {
                setShowWithdraw(false);
                setShowDeposit(!showDeposit);
                setAmount('');
              }}
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: colors.primary },
                pressed && styles.actionButtonPressed,
              ]}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primaryForeground} />
              <Text style={[styles.actionButtonText, { color: colors.primaryForeground }]}>Deposit</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setShowDeposit(false);
                setShowWithdraw(!showWithdraw);
                setAmount('');
              }}
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: colors.secondary, borderColor: colors.border, borderWidth: 1 },
                pressed && styles.actionButtonPressed,
              ]}
            >
              <Ionicons name="remove-circle-outline" size={20} color={colors.secondaryForeground} />
              <Text style={[styles.actionButtonText, { color: colors.secondaryForeground }]}>Withdraw</Text>
            </Pressable>
          </View>
        )}

        {showDeposit && (
          <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>Deposit Amount</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.input }]}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
            />
            <Pressable
              onPress={handleDeposit}
              style={({ pressed }) => [
                styles.submitButton,
                { backgroundColor: colors.primary },
                pressed && styles.submitButtonPressed,
              ]}
            >
              <Text style={[styles.submitButtonText, { color: colors.primaryForeground }]}>Confirm Deposit</Text>
            </Pressable>
          </View>
        )}

        {showWithdraw && (
          <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.inputLabel, { color: colors.foreground }]}>Withdraw Amount</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.input }]}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
            />
            <Pressable
              onPress={handleWithdraw}
              style={({ pressed }) => [
                styles.submitButton,
                { backgroundColor: colors.destructive },
                pressed && styles.submitButtonPressed,
              ]}
            >
              <Text style={[styles.submitButtonText, { color: colors.destructiveForeground }]}>Confirm Withdraw</Text>
            </Pressable>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Transaction History</Text>

        <View style={[styles.transactionsList, { backgroundColor: colors.card }]}>
          {transactions.slice(0, visibleCount).map(tx => (
            <TransactionRow key={tx.id} transaction={tx} />
          ))}
        </View>

        {visibleCount < transactions.length && (
          <Pressable
            onPress={() => setVisibleCount(prev => prev + 20)}
            style={({ pressed }) => [
              styles.loadMoreButton,
              { backgroundColor: colors.muted },
              pressed && styles.loadMoreButtonPressed,
            ]}
          >
            <Text style={[styles.loadMoreText, { color: colors.foreground }]}>Load More</Text>
          </Pressable>
        )}

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Payment Methods (Demo)</Text>

        {['JazzCash', 'Easypaisa', 'Credit/Debit Card'].map(method => (
          <Pressable
            key={method}
            onPress={() => handlePaymentDemo(method)}
            style={({ pressed }) => [
              styles.paymentCard,
              { backgroundColor: colors.muted, borderColor: colors.border },
              pressed && styles.paymentCardPressed,
            ]}
          >
            <Ionicons name="lock-closed" size={20} color={colors.mutedForeground} />
            <Text style={[styles.paymentText, { color: colors.mutedForeground }]}>{method} (Demo)</Text>
            <View style={[styles.demoBadge, { backgroundColor: colors.destructive }]}>
              <Text style={[styles.demoText, { color: colors.destructiveForeground }]}>Demo</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    padding: 12,
  },
  bannerText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    lineHeight: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
  },
  balanceCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 48,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
    marginBottom: 4,
  },
  balanceSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  inputCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 12,
    borderWidth: 1,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonPressed: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 12,
  },
  transactionsList: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  loadMoreButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  loadMoreButtonPressed: {
    opacity: 0.7,
  },
  loadMoreText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  paymentCardPressed: {
    opacity: 0.7,
  },
  paymentText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  demoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  demoText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
});
