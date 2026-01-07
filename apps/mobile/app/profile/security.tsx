// @ts-nocheck
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/auth';
import { API_URL } from '../../constants/Config';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/theme';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export default function SecurityScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token, user, updateUser } = useAuth();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Select/Email Update, 2: Password Change Code, 3: Password Update
  
  const [email, setEmail] = useState(user?.email || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: boolean}>({});

  const passwordRequirements = [
    { label: t('auth.reqLength'), met: newPassword.length >= 8 },
    { label: t('auth.reqUppercase'), met: /[A-Z]/.test(newPassword) },
    { label: t('auth.reqLowercase'), met: /[a-z]/.test(newPassword) },
    { label: t('auth.reqNumber'), met: /\d/.test(newPassword) },
    { label: t('auth.reqSpecial'), met: /[@$!%*?&.]/.test(newPassword) },
  ];

  const handleRequestPasswordChange = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/profile/request-password-change`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
      });

      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: t('common.save'),
          text2: t('profile.passwordCodeSent'),
        });
        setStep(3); // Go to verify code and new password
        setFieldErrors({});
      } else {
        const data = await response.json();
        Toast.show({
          type: 'error',
          text1: t('common.error'),
          text2: data.error || 'Failed to request code',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: 'Something went wrong',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    const errors: {[key: string]: boolean} = {};
    if (!code) errors.code = true;
    if (!newPassword) errors.newPassword = true;
    if (!confirmPassword) errors.confirmPassword = true;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), 'Passwords do not match');
      return;
    }
    
    const isStrong = passwordRequirements.every(r => r.met);
    if (!isStrong) {
      Alert.alert(t('common.error'), t('auth.passwordStrength'));
      return;
    }
    setFieldErrors({});

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/profile/change-password`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ code, newPassword }),
      });

      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: t('common.save'),
          text2: t('profile.passwordChangedSuccess'),
        });
        router.back();
      } else {
        const data = await response.json();
        Toast.show({
          type: 'error',
          text1: t('common.error'),
          text2: data.error || 'Failed to change password',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: 'Something went wrong',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!email) {
      setFieldErrors({ email: true });
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/profile/update`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const data = await response.json();
        await updateUser({ ...user, email });
        Toast.show({
          type: 'success',
          text1: t('common.save'),
          text2: t('profile.emailUpdatedSuccess'),
        });
        router.back();
      } else {
        const data = await response.json();
        Toast.show({
          type: 'error',
          text1: t('common.error'),
          text2: data.error || 'Failed to update email',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: 'Something went wrong',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ 
        headerShown: true,
        headerTitle: t('profile.security'),
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerStyle: { backgroundColor: colors.background },
        headerLeft: () => (
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ flexDirection: 'row', alignItems: 'center', marginLeft: -5 }}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="chevron-back" size={28} color={colors.text} />
              <Text style={{ fontSize: 17, color: colors.text, marginLeft: -4, marginTop: -2 }}>{t('profile.meins')}</Text>
            </View>
          </TouchableOpacity>
        ),
        headerTitleAlign: 'center',
        headerShadowVisible: false,
      }} />
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {step === 1 && (
          <View style={styles.section}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>{t('auth.email')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F9FAFB', borderColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB', color: colors.text }, fieldErrors.email && styles.inputError]}
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: false });
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor={colorScheme === 'dark' ? '#4B5563' : '#9CA3AF'}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.secondaryButton, { borderBottomColor: colorScheme === 'dark' ? '#334155' : '#F3F4F6' }]}
              onPress={() => {
                setStep(2);
                setFieldErrors({});
              }}
            >
              <Text style={styles.secondaryButtonText}>{t('profile.changePassword')}</Text>
              <Ionicons name="chevron-forward" size={20} color="#586EEF" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleUpdateProfile}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>{t('common.save')}</Text>}
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.section}>
            <Text style={[styles.infoText, { color: colors.text }]}>
              To change your password, we will send a verification code to your email address: {user?.email}
            </Text>
            <TouchableOpacity 
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleRequestPasswordChange}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>{t('profile.requestPasswordChange')}</Text>}
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                setStep(1);
                setFieldErrors({});
              }} 
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <View style={styles.section}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>Verification Code</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F9FAFB', borderColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB', color: colors.text }, fieldErrors.code && styles.inputError]}
                value={code}
                onChangeText={(val) => {
                  setCode(val);
                  if (fieldErrors.code) setFieldErrors({ ...fieldErrors, code: false });
                }}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="6-digit code"
                placeholderTextColor={colorScheme === 'dark' ? '#4B5563' : '#9CA3AF'}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>{t('profile.newPassword')}</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[
                    styles.input, 
                    { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F9FAFB', borderColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB', color: colors.text },
                    fieldErrors.newPassword && styles.inputError,
                    newPassword.length > 0 && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }
                  ]}
                  value={newPassword}
                  onChangeText={(val) => {
                    setNewPassword(val);
                    if (fieldErrors.newPassword) setFieldErrors({ ...fieldErrors, newPassword: false });
                  }}
                  secureTextEntry={!showPassword}
                  placeholder="********"
                  placeholderTextColor={colorScheme === 'dark' ? '#4B5563' : '#9CA3AF'}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                </TouchableOpacity>
              </View>
              {newPassword.length > 0 && (
                <View style={[styles.requirementsContainer, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F9FAFB', borderColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB' }]}>
                  {passwordRequirements.map((req, index) => (
                    <View key={index} style={styles.requirementRow}>
                      <Ionicons 
                        name={req.met ? "checkmark-circle" : "ellipse-outline"} 
                        size={16} 
                        color={req.met ? "#10B981" : colorScheme === 'dark' ? '#4B5563' : "#9CA3AF"} 
                      />
                      <Text style={[styles.requirementText, req.met && styles.requirementMet, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }, req.met && { color: '#10B981' }]}>
                        {req.label}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>{t('profile.confirmNewPassword')}</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F9FAFB', borderColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB', color: colors.text }, fieldErrors.confirmPassword && styles.inputError]}
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: false });
                  }}
                  secureTextEntry={!showPassword}
                  placeholder="********"
                  placeholderTextColor={colorScheme === 'dark' ? '#4B5563' : '#9CA3AF'}
                />
                <TouchableOpacity 
                  style={styles.eyeIcon} 
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.primaryButtonText}>{t('common.save')}</Text>}
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                setStep(2);
                setFieldErrors({});
              }} 
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    paddingTop: 20,
  },
  section: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputGroup: {
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  primaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#586EEF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#586EEF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 20,
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#586EEF',
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  cancelButton: {
    marginTop: 20,
    alignItems: 'center',
    padding: 10,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  infoText: {
    marginBottom: 20,
    textAlign: 'center',
  },
  passwordInputContainer: {
    position: 'relative',
    width: '100%',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 17,
  },
  requirementsContainer: {
    backgroundColor: '#F9FAFB',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#E5E7EB',
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  requirementMet: {
    color: '#10B981',
  },
  inputError: {
    borderColor: '#EF4444',
  }
});
