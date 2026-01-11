// @ts-nocheck
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, Pressable, Animated, Switch, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/theme';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';
import { API_URL } from '../../constants/Config';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [designModalVisible, setDesignModalVisible] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const { theme, setTheme, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('FaceID');
  const [isPassModalVisible, setIsPassModalVisible] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { user: authUser } = useAuth();

  useEffect(() => {
    checkBiometricStatus();
  }, []);

  const checkBiometricStatus = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    setIsBiometricSupported(hasHardware);

    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricLabel('FaceID');
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricLabel('TouchID');
    } else {
        setBiometricLabel('Biometrics');
    }

    const storedPass = await SecureStore.getItemAsync('user_password');
    setIsBiometricEnabled(!!storedPass);
  };

  const toggleBiometric = async (value: boolean) => {
    if (value) {
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!isEnrolled) {
            Toast.show({
                type: 'info',
                text1: "Biometrics not enrolled",
                text2: "Please enroll FaceID/TouchID in your device settings to use this feature.",
                visibilityTime: 4000
            });
        }
        setIsPassModalVisible(true);
    } else {
        await SecureStore.deleteItemAsync('user_email');
        await SecureStore.deleteItemAsync('user_password');
        setIsBiometricEnabled(false);
    }
  };

  const handleConfirmPassword = async () => {
      if (!confirmPassword) {
          Toast.show({
              type: 'error',
              text1: t('common.error'),
              text2: t('auth.fillAll')
          });
          return;
      }
      
      setIsVerifying(true);
      try {
          // Verify password with backend by attempting a login
          const response = await fetch(`${API_URL}/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  email: authUser?.email,
                  password: confirmPassword
              })
          });

          const data = await response.json();

          if (response.ok) {
              if (authUser?.email) {
                  await SecureStore.setItemAsync('user_email', authUser.email);
                  await SecureStore.setItemAsync('user_password', confirmPassword);
                  setIsBiometricEnabled(true);
                  setIsPassModalVisible(false);
                  setConfirmPassword('');
                  setShowPassword(false);
                  Toast.show({
                      type: 'success',
                      text1: t('common.success'),
                      text2: `${biometricLabel} enabled successfully!`
                  });
              }
          } else {
              Toast.show({
                  type: 'error',
                  text1: t('common.error'),
                  text2: data.error || "Invalid password"
              });
          }
      } catch (e) {
          console.error(e);
          Toast.show({
              type: 'error',
              text1: 'Error',
              text2: "Connection failed. Please try again."
          });
      } finally {
          setIsVerifying(false);
      }
  };

  const changeLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng);
    await AsyncStorage.setItem('user-language', lng);
    hideLanguagePicker();
  };

  const handleDesignChange = async (mode: string) => {
    setTheme(mode);
    hideDesignPicker();
  };

  const showDesignPicker = () => {
    setDesignModalVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideDesignPicker = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setDesignModalVisible(false));
  };

  const showLanguagePicker = () => {
    setLangModalVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideLanguagePicker = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setLangModalVisible(false));
  };

  const settingsItems = [
    { icon: 'notifications-outline', label: t('profile.notifications'), onPress: () => {} },
    { icon: 'contrast-outline', label: t('profile.design'), onPress: showDesignPicker },
    { icon: 'language-outline', label: t('profile.language'), onPress: showLanguagePicker },
    ...(isBiometricSupported ? [{ 
        icon: biometricLabel === 'FaceID' ? 'scan-outline' : 'finger-print-outline', 
        label: biometricLabel === 'FaceID' ? t('auth.loginWithFaceID') : t('auth.loginWithTouchID'), 
        isSwitch: true, 
        value: isBiometricEnabled, 
        onValueChange: toggleBiometric 
    }] : []),
    { icon: 'list-outline', label: 'Sonstiges', onPress: () => {} },
  ];

  const legalItems = [
    { label: 'Impressum', onPress: () => {} },
    { label: 'Barrierefreiheit', onPress: () => {} },
    { label: 'Infos zum Tracking', onPress: () => {} },
    { label: t('profile.privacy'), onPress: () => {} },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ 
        headerTitle: t('profile.settings'),
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
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          {settingsItems.map((item, index) => (
            <TouchableOpacity 
                key={index} 
                style={[styles.item, { borderBottomColor: colorScheme === 'dark' ? '#334155' : '#F3F4F6' }]} 
                onPress={item.onPress}
                disabled={item.isSwitch}
            >
              <View style={styles.itemLeft}>
                <Ionicons name={item.icon} size={22} color={colorScheme === 'dark' ? '#9CA3AF' : '#4B5563'} />
                <Text style={[styles.itemLabel, { color: colors.text }]}>{item.label}</Text>
              </View>
              <View style={styles.itemRight}>
                {item.isSwitch ? (
                    <Switch
                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                        thumbColor={item.value ? "#586EEF" : "#f4f3f4"}
                        onValueChange={item.onValueChange}
                        value={item.value}
                    />
                ) : (
                    <>
                        {item.label === t('profile.design') && (
                        <Text style={[styles.currentValueText, { color: colorScheme === 'dark' ? '#6B7280' : '#9CA3AF' }]}>
                            {t(`profile.${theme}`)}
                        </Text>
                        )}
                        {item.label === t('profile.language') && (
                        <Text style={[styles.currentValueText, { color: colorScheme === 'dark' ? '#6B7280' : '#9CA3AF' }]}>
                            {i18n.language === 'en' ? 'English' : i18n.language === 'tr' ? 'Türkçe' : 'Deutsch'}
                        </Text>
                        )}
                        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                    </>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.divider, { backgroundColor: colorScheme === 'dark' ? '#111827' : '#F9FAFB' }]} />

        <View style={styles.section}>
          {legalItems.map((item, index) => (
            <TouchableOpacity key={index} style={[styles.item, { borderBottomColor: colorScheme === 'dark' ? '#334155' : '#F3F4F6' }]} onPress={item.onPress}>
              <Text style={[styles.itemLabelLegal, { color: colors.text }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Modern Design Picker Modal */}
      <Modal
        visible={designModalVisible}
        transparent
        animationType="none"
        onRequestClose={hideDesignPicker}
      >
        <Pressable style={styles.modalOverlay} onPress={hideDesignPicker}>
          <Animated.View style={[styles.modalBackdrop, { opacity: fadeAnim }]} />
          <Animated.View 
            style={[
              styles.bottomSheet, 
              { transform: [{ translateY: slideAnim }], backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }
            ]}
          >
            <View style={styles.sheetHeader}>
              <View style={[styles.sheetHandle, { backgroundColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB' }]} />
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{t('profile.design')}</Text>
            </View>

            <View style={styles.optionsContainer}>
              {[
                { id: 'light', icon: 'sunny-outline', label: t('profile.light') },
                { id: 'dark', icon: 'moon-outline', label: t('profile.dark') },
                { id: 'system', icon: 'settings-outline', label: t('profile.system') },
              ].map((option) => (
                <TouchableOpacity 
                  key={option.id}
                  style={[
                    styles.optionItem,
                    { backgroundColor: colorScheme === 'dark' ? '#111827' : '#F9FAFB', borderColor: colorScheme === 'dark' ? '#334155' : '#F3F4F6' },
                    theme === option.id && (colorScheme === 'dark' ? { backgroundColor: '#1E293B', borderColor: '#586EEF' } : styles.optionItemSelected)
                  ]}
                  onPress={() => handleDesignChange(option.id)}
                >
                  <View style={styles.optionLeft}>
                    <View style={[
                      styles.optionIconWrapper,
                      { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' },
                      theme === option.id && styles.optionIconWrapperSelected
                    ]}>
                      <Ionicons 
                        name={option.icon} 
                        size={20} 
                        color={theme === option.id ? '#FFFFFF' : (colorScheme === 'dark' ? '#9CA3AF' : '#4B5563')} 
                      />
                    </View>
                    <Text style={[
                      styles.optionLabel,
                      { color: colorScheme === 'dark' ? '#E2E8F0' : '#4B5563' },
                      theme === option.id && styles.optionLabelSelected,
                      theme === option.id && colorScheme === 'dark' && { color: 'white' }
                    ]}>
                      {option.label}
                    </Text>
                  </View>
                  {theme === option.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#586EEF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.cancelButton, { backgroundColor: colorScheme === 'dark' ? '#111827' : '#F9FAFB' }]} 
              onPress={hideDesignPicker}
            >
              <Text style={[styles.cancelButtonText, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>
      {/* Modern Language Picker Modal */}
      <Modal
        visible={langModalVisible}
        transparent
        animationType="none"
        onRequestClose={hideLanguagePicker}
      >
        <Pressable style={styles.modalOverlay} onPress={hideLanguagePicker}>
          <Animated.View style={[styles.modalBackdrop, { opacity: fadeAnim }]} />
          <Animated.View 
            style={[
              styles.bottomSheet, 
              { transform: [{ translateY: slideAnim }], backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }
            ]}
          >
            <View style={styles.sheetHeader}>
              <View style={[styles.sheetHandle, { backgroundColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB' }]} />
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{t('profile.language')}</Text>
            </View>

            <View style={styles.optionsContainer}>
              {[
                { id: 'en', label: 'English', icon: 'flag-outline' },
                { id: 'tr', label: 'Türkçe', icon: 'flag-outline' },
                { id: 'de', label: 'Deutsch', icon: 'flag-outline' },
              ].map((option) => (
                <TouchableOpacity 
                  key={option.id}
                  style={[
                    styles.optionItem,
                    { backgroundColor: colorScheme === 'dark' ? '#111827' : '#F9FAFB', borderColor: colorScheme === 'dark' ? '#334155' : '#F3F4F6' },
                    i18n.language === option.id && (colorScheme === 'dark' ? { backgroundColor: '#1E293B', borderColor: '#586EEF' } : styles.optionItemSelected)
                  ]}
                  onPress={() => changeLanguage(option.id)}
                >
                  <View style={styles.optionLeft}>
                    <View style={[
                      styles.optionIconWrapper,
                      { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' },
                      i18n.language === option.id && styles.optionIconWrapperSelected
                    ]}>
                      <Ionicons 
                        name={option.icon} 
                        size={20} 
                        color={i18n.language === option.id ? '#FFFFFF' : (colorScheme === 'dark' ? '#9CA3AF' : '#4B5563')} 
                      />
                    </View>
                    <Text style={[
                      styles.optionLabel,
                      { color: colorScheme === 'dark' ? '#E2E8F0' : '#4B5563' },
                      i18n.language === option.id && styles.optionLabelSelected,
                      i18n.language === option.id && colorScheme === 'dark' && { color: 'white' }
                    ]}>
                      {option.label}
                    </Text>
                  </View>
                  {i18n.language === option.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#586EEF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.cancelButton, { backgroundColor: colorScheme === 'dark' ? '#111827' : '#F9FAFB' }]} 
              onPress={hideLanguagePicker}
            >
              <Text style={[styles.cancelButtonText, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>

      <Modal
        visible={isPassModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPassModalVisible(false)}
      >
        <View style={styles.passwordModalOverlay}>
            <View style={[styles.passwordModal, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
                <Text style={[styles.passwordTitle, { color: colors.text }]}>{t('common.confirmPassword')}</Text>
                <Text style={[styles.passwordSub, { color: colors.subtext }]}>
                    Please enter your password to enable {biometricLabel}
                </Text>
                <View style={[styles.passwordInputContainer, { 
                    backgroundColor: colorScheme === 'dark' ? '#111827' : '#F9FAFB',
                    borderColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB'
                }]}>
                    <TextInput
                        style={[styles.passwordInput, { color: colors.text }]}
                        placeholder={t('auth.password')}
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showPassword}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        autoFocus
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
                <View style={styles.passwordButtons}>
                    <TouchableOpacity 
                        style={[styles.passBtn, styles.passBtnCancel]} 
                        onPress={() => {
                            setIsPassModalVisible(false);
                            setConfirmPassword('');
                            setShowPassword(false);
                        }}
                    >
                        <Text style={styles.passBtnCancelText}>{t('common.cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.passBtn, styles.passBtnConfirm, isVerifying && { opacity: 0.7 }]} 
                        onPress={handleConfirmPassword}
                        disabled={isVerifying}
                    >
                        {isVerifying ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <Text style={styles.passBtnConfirmText}>{t('common.confirm')}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemLabel: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  itemLabelLegal: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '400',
  },
  currentValueText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  divider: {
    height: 10,
    backgroundColor: '#F9FAFB',
    marginVertical: 10,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 25,
    paddingBottom: 40,
    paddingTop: 15,
    minHeight: 350,
  },
  sheetHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 15,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 25,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  optionItemSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#586EEF',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  optionIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIconWrapperSelected: {
    backgroundColor: '#586EEF',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
  },
  optionLabelSelected: {
    color: '#111827',
  },
  cancelButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  passwordModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  passwordModal: {
      width: '100%',
      padding: 25,
      borderRadius: 24,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
  },
  passwordTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10,
      textAlign: 'center',
  },
  passwordSub: {
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 20,
  },
  passwordInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 56,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 20,
      paddingHorizontal: 16,
  },
  passwordInput: {
      flex: 1,
      height: '100%',
      fontSize: 16,
  },
  eyeIcon: {
      padding: 4,
  },
  passwordButtons: {
      flexDirection: 'row',
      gap: 12,
  },
  passBtn: {
      flex: 1,
      height: 50,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
  },
  passBtnCancel: {
      backgroundColor: '#F3F4F6',
  },
  passBtnConfirm: {
      backgroundColor: '#586EEF',
  },
  passBtnCancelText: {
      color: '#4B5563',
      fontWeight: '600',
  },
  passBtnConfirmText: {
      color: '#FFFFFF',
      fontWeight: '600',
  }
});
