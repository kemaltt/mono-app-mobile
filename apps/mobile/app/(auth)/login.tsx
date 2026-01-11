// @ts-nocheck
import { View, Text, TextInput, TouchableOpacity, Platform, StyleSheet, KeyboardAvoidingView, ScrollView, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/auth';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Localization from 'expo-localization';

const { width, height } = Dimensions.get('window');
import { API_URL } from '../../constants/Config';
import Toast from 'react-native-toast-message';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (hasHardware && isEnrolled) {
        setIsBiometricAvailable(true);
        if (supportedTypes.length > 0) {
            setBiometricType(supportedTypes[0]);
        }
      }
    })();
  }, []);

  const handleBiometricLogin = async () => {
    if (loading) return;
    
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('auth.loginWithBiometrics') || 'Authenticate to log in',
        fallbackLabel: t('common.cancel'),
        disableDeviceFallback: false,
      });

      if (result.success) {
        const storedEmail = await SecureStore.getItemAsync('user_email');
        const storedPass = await SecureStore.getItemAsync('user_password');

        if (storedEmail && storedPass) {
            setEmail(storedEmail);
            setPassword(storedPass);
            await handleLogin(storedEmail, storedPass);
        } else {
            Toast.show({
                type: 'info',
                text1: t('common.info'),
                text2: "FaceID data not found. Please log in manually once.",
            });
        }
      }
    } catch (e: any) {
        console.log('Biometric Login Error:', e);
        Toast.show({
            type: 'error',
            text1: t('common.error'),
            text2: e?.message || "Biometric authentication failed"
        });
    }
  };

  const handleLogin = async (manualEmail?: any, manualPass?: string) => {
    const loginEmail = (typeof manualEmail === 'string' ? manualEmail : email || '').toString().trim();
    const loginPass = typeof manualPass === 'string' ? manualPass : password;

    const newErrors: {[key: string]: string} = {};
    if (!loginEmail) newErrors.email = t('auth.fillAll');
    if (!loginPass) newErrors.password = t('auth.fillAll');

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    // Normalize email: remove all whitespace-like characters and convert to lowercase
    const normalizedEmail = loginEmail.replace(/\s/g, '').toLowerCase();
    
    // Standard email regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(normalizedEmail)) {
      console.log('Validation failed for email:', `"${normalizedEmail}"`);
      setFieldErrors({ email: t('auth.invalidEmail') });
      return;
    }

    const finalEmail = normalizedEmail;

    setFieldErrors({});
    setLoading(true);
    
    try {
      const timezone = Localization.getCalendars()[0]?.timeZone || 'UTC';
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: finalEmail, password: loginPass, timezone }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.notVerified) {
          router.push({
            pathname: '/(auth)/verify',
            params: { email: data.email }
          });
          return;
        }
        throw new Error(data.error || 'Login failed');
      }

      await signIn(data.token, data.user);
      
      // Save credentials for biometrics
      await SecureStore.setItemAsync('user_email', finalEmail);
      await SecureStore.setItemAsync('user_password', loginPass);
      
    } catch (err: any) {
      const message = typeof err.message === 'object' ? 'An unexpected error occurred' : err.message;
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Slanted Background */}
      <View style={styles.slantedBg} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
           <Text style={styles.headerTitle}>{t('auth.loginTitle')}</Text>
        </View>

        {/* Main Card */}
        <View style={styles.cardContainer}>
           {/* Peeking Character */}
           <View style={styles.characterWrapper}>
              <Image 
                source={require('../../assets/images/Guy.png')} 
                style={styles.characterImg}
                resizeMode="contain"
              />
           </View>

           <View style={styles.card}>
              <View style={styles.form}>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('auth.email').toUpperCase()}</Text>
                  <TextInput
                    style={[styles.input, fieldErrors.email && styles.inputError]}
                    placeholder={t('auth.email')}
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text.trim());
                      if (fieldErrors.email) {
                        const newErrs = { ...fieldErrors };
                        delete newErrs.email;
                        setFieldErrors(newErrs);
                      }
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  {fieldErrors.email ? <Text style={styles.fieldError}>{fieldErrors.email}</Text> : null}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('auth.password').toUpperCase()}</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.input, styles.passwordInput, fieldErrors.password && styles.inputError]}
                      placeholder={t('auth.password')}
                      placeholderTextColor="#9CA3AF"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (fieldErrors.password) {
                          const newErrs = { ...fieldErrors };
                          delete newErrs.password;
                          setFieldErrors(newErrs);
                        }
                      }}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity 
                      style={styles.eyeIcon} 
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons 
                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                        size={22} 
                        color="#6B7280" 
                      />
                    </TouchableOpacity>
                  </View>
                  {fieldErrors.password ? <Text style={styles.fieldError}>{fieldErrors.password}</Text> : null}
                </View>
              </View>

              {/* Login Button - Now inside the card */}
              <TouchableOpacity 
                onPress={handleLogin}
                disabled={loading}
                style={[styles.loginButton, loading && styles.buttonDisabled]}
                activeOpacity={0.9}
              >
                <Text style={styles.buttonText}>
                  {loading ? t('auth.loggingIn') : t('common.login')}
                </Text>
              </TouchableOpacity>
           </View>
           
           {isBiometricAvailable && (
             <TouchableOpacity 
               onPress={handleBiometricLogin}
               style={styles.biometricButton}
             >
                <Ionicons 
                   name={biometricType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION ? "scan-outline" : "finger-print-outline"} 
                   size={28} 
                   color="#586EEF" 
                />
                <Text style={styles.biometricText}>
                   {biometricType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION ? 'FaceID' : 'TouchID'}
                </Text>
             </TouchableOpacity>
           )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.noAccount')} </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.link}>{t('auth.signUpTitle')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  slantedBg: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: height * 0.65,
    backgroundColor: '#869DFF', // Vibrant purple-blue from image
    transform: [{ skewY: '-8deg' }],
    marginTop: -height * 0.1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: 80,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 50,
    fontWeight: '900',
    // color: '#3B5998', 
    color: '#FFFFFF', 
    letterSpacing: -1,
  },
  cardContainer: {
    alignItems: 'center',
    paddingHorizontal: 25,
    marginTop: 0,
  },
  characterWrapper: {
    height: 140,
    width: 140,
    zIndex: 10,
    marginBottom: -45, 
    alignItems: 'center',
  },
  characterImg: {
    width: 160,
    height: 160,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    padding: 30,
    paddingTop: 65,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 20,
  },
  form: {
    gap: 25,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    padding: 18,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    paddingRight: 55,
  },
  eyeIcon: {
    position: 'absolute',
    right: 18,
    height: '100%',
    justifyContent: 'center',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  loginButton: {
    marginTop: 30, 
    width: '100%',
    backgroundColor: '#586EEF',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#586EEF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  error: {
    color: '#EF4444',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 10,
  },
  fieldError: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '500',
  },
  link: {
    color: '#586EEF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  biometricButton: {
    marginTop: 25,
    alignItems: 'center',
    padding: 10,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F3F6FF',
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  biometricText: {
    color: '#586EEF',
    fontWeight: '700',
    fontSize: 16,
  }
});
