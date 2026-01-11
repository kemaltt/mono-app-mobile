// @ts-nocheck
import { 
    StyleSheet, 
    Text, 
    View, 
    ScrollView, 
    TouchableOpacity, 
    TextInput, 
    KeyboardAvoidingView, 
    Platform, 
    Alert,
    Image,
    Modal,
    Pressable,
    Dimensions, 
    ActivityIndicator 
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/auth';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useGamification } from '../../context/gamification';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/theme';

import { API_URL } from '../../constants/Config';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Toast from 'react-native-toast-message';
import AiLimitModal from '../../components/AiLimitModal';

const { width } = Dimensions.get('window');

export default function AddTransactionScreen() {
  const { t, i18n } = useTranslation();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { token, user: authUser, updateUser } = useAuth();
  const { showXP, showAchievement, showLevelUp } = useGamification();
  
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [limitMessage, setLimitMessage] = useState('');
  const [attachment, setAttachment] = useState<any>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isScanModalVisible, setIsScanModalVisible] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setAttachment({
        uri: asset.uri,
        name: asset.fileName || 'receipt.jpg',
        type: 'image/jpeg'
      });
      return asset;
    }
    return null;
  };

  const handleScanReceipt = async () => {
    setIsScanModalVisible(true);
  };

  const processScannedAsset = async (asset: any) => {
    const isPdf = asset.mimeType?.includes('pdf') || asset.name?.toLowerCase().endsWith('.pdf');
    
    setAttachment({
      uri: asset.uri,
      name: asset.name || (isPdf ? 'receipt.pdf' : 'receipt.jpg'),
      type: isPdf ? 'application/pdf' : 'image/jpeg'
    });

    setIsScanModalVisible(false);
    setIsScanning(true);
    
    try {
        const formData = new FormData();
        formData.append('file', {
            uri: asset.uri,
            name: asset.name || (isPdf ? 'receipt.pdf' : 'receipt.jpg'),
            type: isPdf ? 'application/pdf' : 'image/jpeg'
        } as any);

        const response = await fetch(`${API_URL}/transactions/scan?lang=${i18n.language}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
            body: formData,
        });

        const data = await response.json();
        console.log('Scan Response Status:', response.status);
        console.log('Scan Response Data:', data);

        if (response.status === 403) {
            const msg = data.limitReached ? t('common.aiLimitMessage') : (data.trialExpired ? t('auth.trialExpiredMessage') : (data.message || data.error));
            setTimeout(() => {
                setLimitMessage(msg);
                setLimitModalVisible(true);
            }, 500);
            return;
        }

        if (response.ok) {
            setAmount(data.amount?.toString() || '');
            setCategory(data.category || '');
            setDescription(data.description || '');
            if (data.date) setDate(new Date(data.date));
            
            // Show Gamification Rewards
            if (data.xp) showXP(data.xp);
            if (data.unlockedAchievements && data.unlockedAchievements.length > 0) {
                data.unlockedAchievements.forEach((ach: any) => showAchievement(ach));
            }
            
            Toast.show({
                type: 'success',
                text1: t('add.scanSuccess'),
                text2: `${data.amount} detected`
            });
        } else {
            throw new Error(data.error || 'AI scan failed');
        }
    } catch (e) {
        console.error('Scan error:', e);
        Alert.alert(t('common.error'), 'Could not extract data from document');
    } finally {
        setIsScanning(false);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setAttachment({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/pdf'
        });
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  };

  const uploadFile = async () => {
    if (!attachment) return null;
    
    setUploadingAttachment(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: attachment.uri,
        name: attachment.name,
        type: attachment.type,
      } as any);

      const response = await fetch(`${API_URL}/transactions/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        return { url: data.attachmentUrl, type: data.attachmentType };
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert(t('common.error'), 'Failed to upload attachment');
      return null;
    } finally {
      setUploadingAttachment(false);
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    if (Platform.OS === 'android') {
        setShowDatePicker(false);
    }
    setDate(currentDate);
  };

  const resetForm = () => {
    setAmount('');
    setCategory('');
    setDescription('');
    setDate(new Date());
    setAttachment(null);
    setType('EXPENSE');
  };

  const handleSubmit = async () => {
    if (!amount || !category) {
        Alert.alert(t('common.error'), t('add.errorFill'));
        return;
    }

    setLoading(true);

    try {
        let attachmentData = null;
        if (attachment) {
            attachmentData = await uploadFile();
            if (!attachmentData && attachment) {
                setLoading(false);
                return; // Upload failed, error already shown
            }
        }

        const response = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                amount: parseFloat(amount),
                type,
                category,
                description,
                date: date.toISOString(),
                attachmentUrl: attachmentData?.url,
                attachmentType: attachmentData?.type
            })
        });

        const data = await response.json();

        if (response.status === 403 && data.trialExpired) {
            setLimitMessage(t('common.trialExpiredMessage'));
            setLimitModalVisible(true);
            setLoading(false);
            return;
        }

        if (!response.ok) {
            throw new Error(data.message || data.error || 'Failed to create transaction');
        }

        // Show Gamification Rewards
        if (data.gainedXP) showXP(data.gainedXP);
        if (data.level && authUser?.level !== undefined && data.level > authUser.level) {
            showLevelUp(data.level);
        }
        if (data.unlockedAchievements && data.unlockedAchievements.length > 0) {
            data.unlockedAchievements.forEach((ach: any) => showAchievement(ach));
        }

        // Update local user state for XP bar
        if (data.xp !== undefined && data.level !== undefined) {
            updateUser({ ...authUser, xp: data.xp, level: data.level });
        }

        // Reset state before leaving
        resetForm();

        setTimeout(() => {
            router.replace('/(tabs)/home');
        }, 1500);

    } catch (err) {
        console.error(err);
        Alert.alert(t('common.error'), t('add.errorSave'));
    } finally {
        setLoading(false);
    }
  };

  const isIncome = type === 'INCOME';
  const themeColor = isIncome ? (colorScheme === 'dark' ? '#059669' : '#00B495') : (colorScheme === 'dark' ? '#dc2626' : '#E4797F');
  const activeBorderColor = colorScheme === 'dark' ? '#586EEF' : '#2D4BFF';
  const defaultBorderColor = colorScheme === 'dark' ? '#334155' : '#E5E7EB';

  return (
    <View style={[styles.container, { backgroundColor: themeColor }]}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isIncome ? t('add.addIncome') : t('add.addExpense')}</Text>
        <TouchableOpacity style={styles.iconButton} onPress={handleScanReceipt} disabled={isScanning}>
          {isScanning ? (
              <ActivityIndicator color="white" size="small" />
          ) : (
              <View style={styles.customScanIcon}>
                  <Ionicons name="scan-outline" size={26} color="white" />
                  <View style={styles.scanLine} />
                  <View style={styles.scanCenterFill} />
              </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Content (White Card) */}
      <View style={[styles.whiteSection, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Form Fields */}
            <View style={styles.form}>
              
              {/* Type Switcher */}
              <View style={[styles.typeSwitcher, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F3F4F6' }]}>
                <TouchableOpacity 
                   style={[styles.typeBtn, isIncome && styles.typeBtnActiveIncome, isIncome && colorScheme === 'dark' && { backgroundColor: '#059669' }]}
                   onPress={() => setType('INCOME')}
                >
                  <Text style={[styles.typeBtnText, isIncome && styles.typeBtnTextActive]}>{t('home.income')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                   style={[styles.typeBtn, !isIncome && styles.typeBtnActiveExpense, !isIncome && colorScheme === 'dark' && { backgroundColor: '#dc2626' }]}
                   onPress={() => setType('EXPENSE')}
                >
                  <Text style={[styles.typeBtnText, !isIncome && styles.typeBtnTextActive]}>{t('home.expense')}</Text>
                </TouchableOpacity>
              </View>

              {/* Name/Category */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('add.nameLabel')}</Text>
                <TextInput
                    style={[
                        styles.input, 
                        { 
                          borderColor: focusedField === 'name' ? activeBorderColor : defaultBorderColor,
                          backgroundColor: colorScheme === 'dark' ? '#111827' : '#FFFFFF',
                          color: colors.text
                        }
                    ]}
                    placeholder={t('add.namePlaceholder')}
                    placeholderTextColor="#9CA3AF"
                    value={category}
                    onChangeText={setCategory}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Amount */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('add.amountLabel')}</Text>
                <View style={[
                   styles.amountContainer,
                   { 
                     borderColor: focusedField === 'amount' ? activeBorderColor : defaultBorderColor,
                     backgroundColor: colorScheme === 'dark' ? '#111827' : '#FFFFFF'
                   }
                ]}>
                  <Text style={[styles.amountPrefix, { color: focusedField === 'amount' ? activeBorderColor : '#9CA3AF' }]}>$</Text>
                  <TextInput
                    style={[styles.amountInput, { color: focusedField === 'amount' ? activeBorderColor : colors.text }]}
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    onFocus={() => setFocusedField('amount')}
                    onBlur={() => setFocusedField(null)}
                  />
                  {amount.length > 0 && (
                    <TouchableOpacity onPress={() => setAmount('')}>
                      <Text style={[styles.clearText, { color: focusedField === 'amount' ? activeBorderColor : '#9CA3AF' }]}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('add.dateLabel')}</Text>
                <TouchableOpacity 
                    style={[
                        styles.datePickerBtn,
                        { 
                          borderColor: focusedField === 'date' ? activeBorderColor : defaultBorderColor,
                          backgroundColor: colorScheme === 'dark' ? '#111827' : '#FFFFFF'
                        }
                    ]} 
                    onPress={() => {
                        setShowDatePicker(true);
                        setFocusedField('date');
                    }}
                >
                    <Text style={[styles.datePickerText, { color: colors.text }]}>
                        {date.toLocaleDateString(i18n.language, { 
                            weekday: 'short',
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric'
                        })}
                    </Text>
                    <Ionicons name="calendar" size={20} color={focusedField === 'date' ? activeBorderColor : "#9CA3AF"} />
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display="default"
                        onChange={(e, d) => {
                            onChangeDate(e, d);
                            setFocusedField(null);
                        }}
                    />
                )}
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('add.descLabel')}</Text>
                <TextInput
                    style={[
                        styles.input,
                        { 
                          borderColor: focusedField === 'desc' ? activeBorderColor : defaultBorderColor,
                          backgroundColor: colorScheme === 'dark' ? '#111827' : '#FFFFFF',
                          color: colors.text
                        }
                    ]}
                    placeholder={t('add.descPlaceholder')}
                    placeholderTextColor="#9CA3AF"
                    value={description}
                    onChangeText={setDescription}
                    onFocus={() => setFocusedField('desc')}
                    onBlur={() => setFocusedField(null)}
                />
              </View>

              {/* Add Receipt */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('add.receiptLabel')}</Text>
                
                {attachment ? (
                  <View style={[styles.attachmentPreview, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F9FAFB', borderColor: defaultBorderColor }]}>
                    <View style={styles.attachmentInfo}>
                      <Ionicons 
                        name={attachment.type.includes('pdf') ? "document-text" : "image"} 
                        size={24} 
                        color={themeColor} 
                      />
                      <Text style={[styles.attachmentName, { color: colors.text }]} numberOfLines={1}>
                        {attachment.name}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => setAttachment(null)}
                      style={styles.removeAttachment}
                    >
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.attachmentButtonsRow}>
                    <TouchableOpacity 
                      style={[styles.receiptBtn, { flex: 1, marginRight: 8, backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F9FAFB', borderColor: defaultBorderColor }]}
                      onPress={handlePickImage}
                      disabled={uploadingAttachment}
                    >
                       <Ionicons name="camera" size={20} color="#9CA3AF" />
                       <Text style={styles.receiptSmallText}>{t('add.addPhoto')}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.receiptBtn, { flex: 1, backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F9FAFB', borderColor: defaultBorderColor }]}
                      onPress={handlePickDocument}
                      disabled={uploadingAttachment}
                    >
                       <Ionicons name="document-attach" size={20} color="#9CA3AF" />
                       <Text style={styles.receiptSmallText}>{t('add.addPDF')}</Text>
                    </TouchableOpacity>
                  </View>
                )}
                  
                  {uploadingAttachment && (
                    <View style={styles.uploadingProgress}>
                      <ActivityIndicator size="small" color={themeColor} />
                      <Text style={styles.uploadingText}>{t('add.uploadingAttachment')}</Text>
                    </View>
                  )}
                  
                   {isScanning && (
                    <View style={styles.uploadingProgress}>
                      <ActivityIndicator size="small" color={themeColor} />
                      <Text style={styles.uploadingText}>{t('add.scanning')}</Text>
                    </View>
                  )}
              </View>

              <TouchableOpacity 
                onPress={handleSubmit}
                disabled={loading}
                style={[styles.saveButton, { backgroundColor: themeColor }]}
              >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.saveButtonText}>{t('add.saveTransaction')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
            {/* ... Other modals */}

            <AiLimitModal 
                isVisible={limitModalVisible}
                onClose={() => setLimitModalVisible(false)}
                onUpgrade={() => {
                    setLimitModalVisible(false);
                    router.push('/profile/membership');
                }}
                message={limitMessage}
            />
        </KeyboardAvoidingView>
      </View>
      <Modal
        visible={isScanModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsScanModalVisible(false)}
      >
        <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setIsScanModalVisible(false)}
        >
            <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : 'white' }]}>
                <View style={styles.modalHeader}>
                    <View style={[styles.modalIconBg, { backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F0F7FF' }]}>
                        <MaterialCommunityIcons name="auto-fix" size={28} color="#007AFF" />
                    </View>
                    <Text style={[styles.modalTitle, { color: colorScheme === 'dark' ? '#F3F4F6' : '#111827' }]}>{t('add.scanReceipt')}</Text>
                    <Text style={[styles.modalSubtitle, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>{t('add.chooseMethodAi')}</Text>
                    <View style={[styles.aiTag, { backgroundColor: colorScheme === 'dark' ? 'rgba(56, 189, 248, 0.1)' : '#F0F9FF' }]}>
                        <Ionicons name="sparkles" size={14} color="#007AFF" />
                        <Text style={styles.aiTagText}>{t('add.aiPowered')}</Text>
                    </View>
                </View>

                <View style={styles.modalOptions}>
                    <TouchableOpacity 
                        style={[
                            styles.modalOption, 
                            { 
                                backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F9FAFB', 
                                borderColor: colorScheme === 'dark' ? '#334155' : '#F3F4F6' 
                            }
                        ]}
                        onPress={async () => {
                            const { status } = await ImagePicker.requestCameraPermissionsAsync();
                            if (status !== 'granted') return Alert.alert('Error', 'Permission required');
                            const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
                            if (!result.canceled) processScannedAsset(result.assets[0]);
                        }}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#E0F2FE' }]}>
                            <Ionicons name="camera" size={24} color="#0EA5E9" />
                        </View>
                        <Text style={[styles.optionText, { color: colorScheme === 'dark' ? '#E5E7EB' : '#1F2937' }]}>{t('add.useCamera')}</Text>
                        <Ionicons name="chevron-forward" size={18} color={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[
                            styles.modalOption, 
                            { 
                                backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F9FAFB', 
                                borderColor: colorScheme === 'dark' ? '#334155' : '#F3F4F6' 
                            }
                        ]}
                        onPress={async () => {
                            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
                            if (!result.canceled) processScannedAsset(result.assets[0]);
                        }}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F0F9FF' }]}>
                            <Ionicons name="image" size={24} color="#0EA5E9" />
                        </View>
                        <Text style={[styles.optionText, { color: colorScheme === 'dark' ? '#E5E7EB' : '#1F2937' }]}>{t('add.useGallery')}</Text>
                        <Ionicons name="chevron-forward" size={18} color={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[
                            styles.modalOption, 
                            { 
                                backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F9FAFB', 
                                borderColor: colorScheme === 'dark' ? '#334155' : '#F3F4F6' 
                            }
                        ]}
                        onPress={async () => {
                            const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
                            if (!result.canceled) processScannedAsset(result.assets[0]);
                        }}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#EEF2FF' }]}>
                            <Ionicons name="document-text" size={24} color="#6366F1" />
                        </View>
                        <Text style={[styles.optionText, { color: colorScheme === 'dark' ? '#E5E7EB' : '#1F2937' }]}>{t('add.usePDF')}</Text>
                        <Ionicons name="chevron-forward" size={18} color={colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity 
                    style={styles.modalCancel}
                    onPress={() => setIsScanModalVisible(false)}
                >
                    <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
            </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whiteSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -20,
  },
  scrollContent: {
    paddingTop: 30,
    paddingBottom: 120, // Increased to clear the floating tab bar
    paddingHorizontal: 25,
  },
  form: {
    width: '100%',
  },
  typeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    padding: 4,
    marginBottom: 30,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
  },
  typeBtnActiveIncome: {
    backgroundColor: '#00B495',
  },
  typeBtnActiveExpense: {
    backgroundColor: '#E4797F',
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 18, // Reduced spacing
  },
  label: {
    fontSize: 11, // Slightly smaller
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    width: '100%',
    height: 48, // Reduced height
    borderWidth: 1.5,
    borderRadius: 12, // Slightly tighter corners
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
    backgroundColor: '#FFFFFF',
  },
  amountContainer: {
    width: '100%',
    height: 48, // Reduced height
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  amountPrefix: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  scanIconWrapper: {
    position: 'relative',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customScanIcon: {
    width: 26,
    height: 26,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanLine: {
    position: 'absolute',
    width: '80%',
    height: 1.5,
    backgroundColor: '#fff',
    borderRadius: 1,
    zIndex: 2,
  },
  scanCenterFill: {
    position: 'absolute',
    width: 14,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    zIndex: 1,
  },
  aiBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'white',
  },
  aiBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#000',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  aiTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007AFF',
  },
  modalOptions: {
    gap: 12,
    marginBottom: 24,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCancel: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },

  amountInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 0,
  },
  clearText: {
    fontWeight: '600',
    fontSize: 13,
  },
  datePickerBtn: {
    width: '100%',
    height: 48, // Reduced height
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  receiptBtn: {
    width: '100%',
    height: 48, // Reduced height
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  receiptText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  receiptSmallText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  attachmentButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attachmentPreview: {
    width: '100%',
    height: 48,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
  },
  attachmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  attachmentName: {
    marginLeft: 10,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  removeAttachment: {
    padding: 4,
  },
  uploadingProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  uploadingText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  saveButton: {
    width: '100%',
    height: 52, // Reduced height
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16, // Slightly smaller
    fontWeight: '700',
  },
});
