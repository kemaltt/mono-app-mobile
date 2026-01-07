// @ts-nocheck
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/auth';
import { API_URL } from '../../constants/Config';

const { width, height } = Dimensions.get('window');

export default function VerifyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const { signIn } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleTextChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input
    if (text.length !== 0 && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && index > 0 && code[index] === '') {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async (codeOverride?: string[]) => {
    const codeToVerify = codeOverride || code;
    const fullCode = codeToVerify.join('');
    
    if (fullCode.length < 6) {
      Alert.alert(t('common.error'), t('auth.fillAll'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode }),
      });

      const data = await response.json();

      if (response.ok) {
        await signIn(data.token, data.user);
        // Auth context will automatically navigate to (tabs)
      } else {
        Alert.alert(t('common.error'), data.error || t('auth.invalidCode'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fullCode = code.join('');
    if (fullCode.length === 6 && !loading) {
      handleVerify(code);
    }
  }, [code]);

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setResending(true);
    try {
      const response = await fetch(`${API_URL}/auth/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setCountdown(30);
        Alert.alert('Success', t('auth.codeSent'));
      } else {
        const data = await response.json();
        Alert.alert(t('common.error'), data.error || 'Failed to resend');
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'Something went wrong');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#1F2937" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>{t('auth.verifyTitle')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.verifySubtitle')}
            </Text>
            <Text style={styles.emailText}>{email}</Text>
          </View>

          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                style={styles.codeInput}
                maxLength={1}
                keyboardType="number-pad"
                value={digit}
                onChangeText={(text) => handleTextChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                autoFocus={index === 0}
              />
            ))}
          </View>

          <View style={styles.statusContainer}>
            {loading && (
              <View style={styles.loadingWrapper}>
                <ActivityIndicator color="#586EEF" size="large" />
                <Text style={styles.verifyingText}>{t('auth.verifying') || 'Verifying...'}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.resendButton, (resending || countdown > 0 || loading) && styles.buttonDisabled]}
            onPress={handleResend}
            disabled={resending || countdown > 0 || loading}
          >
            {resending ? (
              <ActivityIndicator color="#586EEF" size="small" />
            ) : (
              <Text style={styles.resendText}>
                {countdown > 0 
                  ? `${t('auth.resendCode')} (${countdown}s)` 
                  : t('auth.resendCode')}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 60,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 40,
  },
  header: {
    width: '100%',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  emailText: {
    fontSize: 16,
    color: '#304FFE',
    fontWeight: '700',
    marginTop: 5,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
  },
  codeInput: {
    width: (width - 100) / 6,
    height: 60,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 15,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  statusContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  loadingWrapper: {
    alignItems: 'center',
    gap: 12,
  },
  verifyingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  resendButton: {
    padding: 10,
  },
  resendText: {
    color: '#586EEF',
    fontSize: 16,
    fontWeight: '600',
  },
});
