// @ts-nocheck
import { View, Text, TextInput, TouchableOpacity, Platform, StyleSheet, KeyboardAvoidingView, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/auth';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');
import { API_URL } from '../../constants/Config';
import Toast from 'react-native-toast-message';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signIn } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [showPassword, setShowPassword] = useState(false);
  
  const passwordRequirements = [
    { label: t('auth.reqLength'), met: password.length >= 8 },
    { label: t('auth.reqUppercase'), met: /[A-Z]/.test(password) },
    { label: t('auth.reqLowercase'), met: /[a-z]/.test(password) },
    { label: t('auth.reqNumber'), met: /\d/.test(password) },
    { label: t('auth.reqSpecial'), met: /[@$!%*?&.]/.test(password) },
  ];

  const handleRegister = async () => {
    const newErrors: {[key: string]: string} = {};
    if (!firstName) newErrors.firstName = t('auth.fillAll');
    if (!lastName) newErrors.lastName = t('auth.fillAll');
    if (!email) newErrors.email = t('auth.fillAll');
    if (!password) newErrors.password = t('auth.fillAll');

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFieldErrors({ email: t('auth.invalidEmail') });
      return;
    }

    // Password validation
    const isStrong = passwordRequirements.every(r => r.met);
    if (!isStrong) {
      setFieldErrors({ password: t('auth.passwordStrength') });
      return;
    }

    setFieldErrors({});
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Instead of direct sign-in, redirect to verify
      router.push({
        pathname: '/(auth)/verify',
        params: { email: email }
      });
      
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
           <Text style={styles.headerTitle}>{t('auth.signUpTitle')}</Text>
        </View>

        {/* Main Card */}
        <View style={styles.cardContainer}>
           <View style={styles.card}>
              <View style={styles.form}>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>{t('profile.firstName').toUpperCase()}</Text>
                    <TextInput
                      style={[styles.input, fieldErrors.firstName && styles.inputError]}
                      placeholder={t('profile.firstName')}
                      placeholderTextColor="#9CA3AF"
                      value={firstName}
                      onChangeText={(text) => {
                        setFirstName(text);
                        if (fieldErrors.firstName) {
                          const newErrs = { ...fieldErrors };
                          delete newErrs.firstName;
                          setFieldErrors(newErrs);
                        }
                      }}
                    />
                    {fieldErrors.firstName ? <Text style={styles.fieldError}>{fieldErrors.firstName}</Text> : null}
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>{t('profile.lastName').toUpperCase()}</Text>
                    <TextInput
                      style={[styles.input, fieldErrors.lastName && styles.inputError]}
                      placeholder={t('profile.lastName')}
                      placeholderTextColor="#9CA3AF"
                      value={lastName}
                      onChangeText={(text) => {
                        setLastName(text);
                        if (fieldErrors.lastName) {
                          const newErrs = { ...fieldErrors };
                          delete newErrs.lastName;
                          setFieldErrors(newErrs);
                        }
                      }}
                    />
                    {fieldErrors.lastName ? <Text style={styles.fieldError}>{fieldErrors.lastName}</Text> : null}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('auth.email').toUpperCase()}</Text>
                  <TextInput
                    style={[styles.input, fieldErrors.email && styles.inputError]}
                    placeholder={t('auth.email')}
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
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
                      style={[
                        styles.input, 
                        styles.passwordInput, 
                        fieldErrors.password && styles.inputError,
                        password.length > 0 && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
                      ]}
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
                  {password.length > 0 && (
                    <View style={styles.requirementsContainer}>
                      {passwordRequirements.map((req, index) => (
                        <View key={index} style={styles.requirementRow}>
                          <Ionicons 
                            name={req.met ? "checkmark-circle" : "ellipse-outline"} 
                            size={14} 
                            color={req.met ? "#10B981" : "#9CA3AF"} 
                          />
                          <Text style={[styles.requirementText, req.met && styles.requirementMet]}>
                            {req.label}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {fieldErrors.password ? <Text style={styles.fieldError}>{fieldErrors.password}</Text> : null}
                </View>

                {/* Profile Picture Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('auth.profilePicture').toUpperCase()}</Text>
                  <TouchableOpacity style={styles.fileInput} activeOpacity={0.7}>
                    <Ionicons name="add-circle" size={20} color="#6B7280" />
                    <Text style={styles.fileInputText}>{t('auth.addPicture')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sign Up Button - Now inside the card */}
              <TouchableOpacity 
                onPress={handleRegister}
                disabled={loading}
                style={[styles.signUpButton, loading && styles.buttonDisabled]}
                activeOpacity={0.9}
              >
                <Text style={styles.buttonText}>
                  {loading ? t('auth.creatingAccount') : t('auth.signUpTitle')}
                </Text>
              </TouchableOpacity>
           </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.haveAccount')} </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.link}>{t('auth.loginTitle')}</Text>
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
    height: height * 0.60,
    backgroundColor: '#869DFF', 
    transform: [{ skewY: '-8deg' }],
    marginTop: -height * 0.1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: 80,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 50,
    fontWeight: '900',
    // color: '#304FFE', 
    color: '#FFFFFF', 
    letterSpacing: -1,
  },
  cardContainer: {
    alignItems: 'center',
    paddingHorizontal: 25,
    marginTop: 10,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    padding: 30,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 20,
  },
  form: {
    gap: 15,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
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
    borderColor: '#F3F4F6',
    borderRadius: 16,
    padding: 15,
    fontSize: 15,
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
  fileInput: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 18,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  fileInputText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 15,
  },
  signUpButton: {
    marginTop: 25, 
    width: '100%',
    backgroundColor: '#586EEF',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#586EEF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  error: {
    color: '#EF4444',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 5,
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
    marginTop: 25,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
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
  requirementsContainer: {
    backgroundColor: '#F9FAFB',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    padding: 12,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: '#F3F4F6',
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 6,
  },
  requirementMet: {
    color: '#10B981',
  }
});
