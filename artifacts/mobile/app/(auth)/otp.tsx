import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useSimulation } from '@/contexts/SimulationContext';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OtpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useSimulation();
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length === 6) {
      router.replace('/(tabs)/');
    }
  };

  return (
    <LinearGradient
      colors={[colors.primary, colors.background]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <View
        style={[
          styles.content,
          { paddingTop: Platform.OS === 'web' ? 67 + 60 : insets.top + 60 },
          { paddingBottom: Platform.OS === 'web' ? 34 + 40 : insets.bottom + 40 },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Verify Your Account</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Verification code sent to {user?.email || 'your email'}
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.otpInput,
                  { backgroundColor: colors.background, color: colors.foreground, borderColor: digit ? colors.primary : colors.border },
                ]}
                value={digit}
                onChangeText={value => handleChange(index, value)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <Pressable
            onPress={handleVerify}
            disabled={otp.join('').length !== 6}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: otp.join('').length === 6 ? colors.primary : colors.muted },
              pressed && otp.join('').length === 6 && styles.buttonPressed,
            ]}
          >
            <Text style={[styles.buttonText, { color: otp.join('').length === 6 ? colors.primaryForeground : colors.mutedForeground }]}>
              Verify
            </Text>
          </Pressable>

          <View style={styles.resendRow}>
            <Text style={[styles.resendText, { color: colors.mutedForeground }]}>
              {timer > 0 ? `Resend in ${timer}s` : 'Didn\'t receive?'}
            </Text>
            {timer === 0 && (
              <Pressable onPress={() => setTimer(60)}>
                <Text style={[styles.resendLink, { color: colors.primary }]}>Resend</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 40,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 8,
  },
  otpInput: {
    flex: 1,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  button: {
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  resendText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  resendLink: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});
