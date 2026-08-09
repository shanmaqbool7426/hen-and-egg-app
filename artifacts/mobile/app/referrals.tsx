import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Pressable, Share, Clipboard } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useHenFarm } from '@/contexts/HenFarmApiContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { cardShadow, heroShadow } from '@/constants/shadows';

export default function ReferralsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    myReferralCode,
    completedReferralCount,
  } = useHenFarm();

  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    Clipboard.setString(myReferralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join HenFarm and buy real hens & eggs from verified sellers! Use my referral code ${myReferralCode} when you sign up.`,
        title: 'Join HenFarm',
      });
    } catch (error) {
      console.error(error);
    }
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
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>Referral Program</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Referral Code Card */}
        <LinearGradient
          colors={[colors.primary, colors.accent]}
          style={[styles.codeCard, heroShadow(colors)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{myReferralCode}</Text>
          </View>

          <View style={styles.codeActions}>
            <Pressable onPress={handleCopyCode} style={styles.codeActionBtn}>
              <Ionicons name={copied ? 'checkmark' : 'copy'} size={18} color="#FFFFFF" />
              <Text style={styles.codeActionText}>{copied ? 'Copied!' : 'Copy Code'}</Text>
            </Pressable>

            <View style={styles.actionDivider} />

            <Pressable onPress={handleShare} style={styles.codeActionBtn}>
              <Ionicons name="share-social" size={18} color="#FFFFFF" />
              <Text style={styles.codeActionText}>Share</Text>
            </Pressable>
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={[styles.statCard, { backgroundColor: colors.card }, cardShadow(colors)]}>
          <MaterialCommunityIcons name="account-group" size={32} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.foreground }]}>{completedReferralCount}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Completed Referrals</Text>
        </View>

        {/* Rewards Explainer */}
        <View style={[styles.ratesCard, { backgroundColor: colors.card }, cardShadow(colors)]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Your Reward</Text>

          <View style={styles.rateItem}>
            <View style={styles.rateIcon}>
              <MaterialCommunityIcons name="egg" size={24} color={colors.primary} />
            </View>
            <View style={styles.rateContent}>
              <Text style={[styles.rateTitle, { color: colors.foreground }]}>
                2 real eggs per referral
              </Text>
              <Text style={[styles.rateValue, { color: colors.primary }]}>
                When a friend you referred buys their first hen, 2 real eggs are added to your
                account - sell them to any dealer for real cash. One-time per friend.
              </Text>
            </View>
          </View>
        </View>

        {/* How It Works */}
        <View style={[styles.howItWorksCard, { backgroundColor: colors.card }, cardShadow(colors)]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>How It Works</Text>

          <View style={styles.stepsList}>
            {[
              {
                icon: 'share-social',
                title: 'Share Your Code',
                desc: 'Send your referral code to friends and family',
              },
              {
                icon: 'person-add',
                title: 'They Sign Up',
                desc: 'Your friend registers using your code',
              },
              {
                icon: 'cart',
                title: 'They Buy Their First Hen',
                desc: 'Once the dealer confirms the sale, you get 2 real eggs credited to your account',
              },
            ].map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <View style={[styles.stepIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name={step.icon as any} size={20} color={colors.primary} />
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: colors.foreground }]}>{step.title}</Text>
                  <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <Pressable onPress={handleShare} style={[styles.ctaButton, { backgroundColor: colors.primary }, cardShadow(colors)]}>
          <MaterialCommunityIcons name="share-variant" size={24} color="#FFFFFF" />
          <Text style={styles.ctaButtonText}>Share Your Code Now</Text>
        </Pressable>

        {/* FAQs */}
        <View style={[styles.faqCard, { backgroundColor: colors.card }, cardShadow(colors)]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Frequently Asked Questions</Text>

          {[
            {
              q: 'Is this real cash?',
              a: 'No - the app never holds money. Your reward is 2 real eggs, which you sell to any dealer directly for real cash, just like eggs from your own hens.',
            },
            {
              q: 'When do the eggs arrive?',
              a: 'As soon as the dealer confirms your referral\'s first hen purchase - not when they just sign up.',
            },
            {
              q: 'Do I keep earning from their future orders?',
              a: 'No. The 2-egg reward is one-time per referred friend. This keeps the program simple and never dependent on new signups.',
            },
          ].map((faq, index) => (
            <View key={index} style={styles.faqItem}>
              <Text style={[styles.faqQuestion, { color: colors.foreground }]}>{faq.q}</Text>
              <Text style={[styles.faqAnswer, { color: colors.mutedForeground }]}>{faq.a}</Text>
            </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  codeCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 12,
  },
  codeBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  codeText: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  codeActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  actionDivider: {
    width: 1,
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
  },
  codeActionText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
  },
  statCard: {
    padding: 20,
    borderRadius: 18,
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
  ratesCard: {
    padding: 20,
    borderRadius: 18,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 16,
  },
  rateItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  rateIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateContent: {
    flex: 1,
  },
  rateTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  rateValue: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    lineHeight: 18,
  },
  howItWorksCard: {
    padding: 20,
    borderRadius: 18,
    marginBottom: 20,
  },
  stepsList: {
    gap: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  ctaButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  faqCard: {
    padding: 20,
    borderRadius: 18,
    marginBottom: 20,
  },
  faqItem: {
    marginBottom: 16,
  },
  faqQuestion: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
});
