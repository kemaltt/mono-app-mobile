// @ts-nocheck
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, ScrollView, TextInput, Alert, Dimensions, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/auth';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/theme';

const { width, height } = Dimensions.get('window');
import { API_URL } from '../../constants/Config';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Image as RNImage } from 'react-native';

export default function TransactionDetailScreen() {
  const { t, i18n } = useTranslation();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editCategory, setEditCategory] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editType, setEditType] = useState('EXPENSE');
  const [editDate, setEditDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Attachment states
  const [editAttachment, setEditAttachment] = useState<{ uri: string, name: string, type: string } | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [receiptCleared, setReceiptCleared] = useState(false);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!id || !token) return;
    fetchTransaction();
  }, [id, token]);

  const fetchTransaction = async () => {
    try {
      const res = await fetch(`${API_URL}/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTransaction(data);
        // Initialize edit states
        setEditCategory(data.category);
        setEditAmount(data.amount.toString());
        setEditDescription(data.description || '');
        setEditType(data.type);
        setEditDate(new Date(data.date));
        
        // Reset edit attachment when data is loaded
        setEditAttachment(null);
        setReceiptCleared(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setEditAttachment({
        uri: asset.uri,
        name: asset.fileName || 'receipt.jpg',
        type: 'image/jpeg'
      });
      setReceiptCleared(false);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setEditAttachment({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || 'application/pdf'
        });
        setReceiptCleared(false);
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  };

  const uploadFile = async () => {
    if (!editAttachment) return null;
    
    setUploadingAttachment(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: editAttachment.uri,
        name: editAttachment.name,
        type: editAttachment.type,
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

  const handleSave = async () => {
    if (!editCategory || !editAmount) {
      Alert.alert(t('common.error'), t('transaction.errorFields'));
      return;
    }

    try {
      setIsSaving(true);
      
      let attachmentData = null;
      let hasNewAttachment = false;

      if (editAttachment) {
          attachmentData = await uploadFile();
          if (!attachmentData) {
              setIsSaving(false);
              return; // Upload failed
          }
          hasNewAttachment = true;
      }

      const patchBody: any = {
        category: editCategory,
        amount: parseFloat(editAmount),
        description: editDescription,
        type: editType,
        date: editDate.toISOString()
      };

      if (hasNewAttachment) {
          patchBody.attachmentUrl = attachmentData.url;
          patchBody.attachmentType = attachmentData.type;
      } else if (receiptCleared) {
          patchBody.attachmentUrl = null;
          patchBody.attachmentType = null;
      }

      const res = await fetch(`${API_URL}/transactions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(patchBody)
      });

      if (res.ok) {
        const updated = await res.json();
        setTransaction(updated);
        setIsEditing(false);
      } else {
        const err = await res.json();
        Alert.alert(t('common.error'), err.error || 'Failed to update');
      }
    } catch (e) {
      Alert.alert(t('common.error'), 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEditDate(selectedDate);
    }
  };

  const confirmDelete = async () => {
    try {
      setIsSaving(true);
      setShowDeleteModal(false);
      const res = await fetch(`${API_URL}/transactions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        router.replace('/(tabs)/home');
      } else {
        const err = await res.json();
        Alert.alert(t('common.error'), err.error || 'Failed to delete');
      }
    } catch (e) {
      Alert.alert(t('common.error'), 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#2D4BFF" />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>{t('transaction.notFound')}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
          <Text style={styles.backButtonText}>{t('transaction.goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isIncome = isEditing ? (editType === 'INCOME') : (transaction.type === 'INCOME');
  const dateObj = isEditing ? editDate : new Date(transaction.date);

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#111827' : '#2D4BFF' }]}>
      {/* Blue Header */}
      <View style={[styles.blueHeader, { backgroundColor: colorScheme === 'dark' ? '#111827' : '#2D4BFF' }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? t('transaction.editTitle') : t('transaction.details')}</Text>
          {!isEditing ? (
            <TouchableOpacity style={styles.iconButton} onPress={() => setShowDeleteModal(true)}>
              <Ionicons name="trash-outline" size={24} color={colorScheme === 'dark' ? '#EF4444' : '#FF6F61'} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>
      </View>

      {/* Main Content */}
      <View style={[styles.whiteSection, { backgroundColor: colors.background }]}>
        <ScrollView 
           showsVerticalScrollIndicator={false}
           contentContainerStyle={styles.scrollContent}
        >
          {/* Icon and Badge Section */}
          <View style={styles.topInfoContainer}>
            <View style={[styles.logoCircle, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
               <View style={[styles.innerCircle, { backgroundColor: isIncome ? (colorScheme === 'dark' ? '#065f46' : '#F0FDF4') : (colorScheme === 'dark' ? '#7f1d1d' : '#FEF2F2') }]}>
                  <Ionicons 
                    name={isIncome ? "arrow-down-outline" : "arrow-up-outline"} 
                    size={32} 
                    color={isIncome ? "#10B981" : "#EF4444"} 
                  />
               </View>
            </View>

            {isEditing ? (
              <View style={[styles.editTypeContainer, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F3F4F6' }]}>
                <TouchableOpacity 
                   style={[styles.typeToggle, editType === 'INCOME' && (colorScheme === 'dark' ? { backgroundColor: '#059669' } : styles.typeToggleActiveIncome)]}
                   onPress={() => setEditType('INCOME')}
                >
                  <Text style={[styles.typeToggleText, editType === 'INCOME' && (colorScheme === 'dark' ? { color: 'white' } : styles.typeToggleTextActive)]}>{t('home.income')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                   style={[styles.typeToggle, editType === 'EXPENSE' && (colorScheme === 'dark' ? { backgroundColor: '#dc2626' } : styles.typeToggleActiveExpense)]}
                   onPress={() => setEditType('EXPENSE')}
                >
                  <Text style={[styles.typeToggleText, editType === 'EXPENSE' && (colorScheme === 'dark' ? { color: 'white' } : styles.typeToggleTextActive)]}>{t('home.expense')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.typeBadge, { backgroundColor: isIncome ? (colorScheme === 'dark' ? '#065f46' : '#ECFDF5') : (colorScheme === 'dark' ? '#7f1d1d' : '#FEF2F2') }]}>
                <Text style={[styles.typeText, { color: isIncome ? (colorScheme === 'dark' ? '#10B981' : '#059669') : (colorScheme === 'dark' ? '#EF4444' : '#DC2626') }]}>
                  {isIncome ? t('home.income') : t('home.expense')}
                </Text>
              </View>
            )}

            {isEditing ? (
              <View style={[styles.amountInputContainer, { borderBottomColor: colorScheme === 'dark' ? '#586EEF' : '#2D4BFF' }]}>
                <Text style={[styles.currencySymbol, { color: colors.text }]}>$</Text>
                <TextInput 
                   style={[styles.amountInput, { color: colors.text }]}
                   value={editAmount}
                   onChangeText={setEditAmount}
                   keyboardType="decimal-pad"
                   placeholder="0.00"
                   placeholderTextColor="#6B7280"
                />
              </View>
            ) : (
              <Text style={[styles.amountText, { color: colors.text }]}>
                $ {Number(transaction.amount).toLocaleString(i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            )}
          </View>

          {/* Details Section */}
          <View style={styles.detailsList}>
            <View style={styles.sectionHeader}>
               <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('transaction.details')}</Text>
               <Ionicons name="chevron-up" size={20} color={colors.text} />
            </View>

            <DetailRow 
              label={t('transaction.status')} 
              value={isEditing ? (editType === 'INCOME' ? t('home.income') : t('home.expense')) : (isIncome ? t('home.income') : t('home.expense'))} 
              color={isIncome ? '#10B981' : '#EF4444'} 
              colors={colors}
            />
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{isIncome ? t('transaction.from') : t('transaction.to')}</Text>
              {isEditing ? (
                <TextInput 
                  style={[styles.editableValue, { color: colorScheme === 'dark' ? '#E0E7FF' : '#2D4BFF', backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F3F6FF' }]}
                  value={editCategory}
                  onChangeText={setEditCategory}
                  placeholder={t('transaction.category')}
                  placeholderTextColor="#6B7280"
                />
              ) : (
                <Text style={[styles.detailValue, { color: colors.text }]}>{transaction.category || 'Unknown'}</Text>
              )}
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('transaction.description')}</Text>
              {isEditing ? (
                <TextInput 
                  style={[styles.editableValue, { color: colorScheme === 'dark' ? '#E0E7FF' : '#2D4BFF', backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F3F6FF' }]}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  placeholder="..."
                  placeholderTextColor="#6B7280"
                />
              ) : (
                <Text style={[styles.detailValue, { color: colors.text }]}>{transaction.description || '...'}</Text>
              )}
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('transaction.date')}</Text>
              {isEditing ? (
                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                  <Text style={[styles.editableValue, { color: colorScheme === 'dark' ? '#E0E7FF' : '#2D4BFF', backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F3F6FF' }]}>
                    {editDate.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {dateObj.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              )}
            </View>

            <View style={styles.detailRow}>
               <Text style={styles.detailLabel}>{t('transaction.time')}</Text>
               <Text style={[styles.detailValue, { color: colors.text }]}>
                 {dateObj.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
               </Text>
            </View>
            
            <View style={[styles.divider, { backgroundColor: colorScheme === 'dark' ? '#334155' : '#F3F4F6' }]} />
            
            <DetailRow 
              label={isIncome ? t('transaction.earnings') : t('transaction.spending')} 
              value={`$ ${isEditing ? (parseFloat(editAmount) || 0).toFixed(2) : Number(transaction.amount).toFixed(2)}`} 
              colors={colors}
            />
            
            <View style={[styles.divider, { backgroundColor: colorScheme === 'dark' ? '#334155' : '#F3F4F6' }]} />
            
            <View style={[styles.divider, { backgroundColor: colorScheme === 'dark' ? '#334155' : '#F3F4F6' }]} />
            
            <DetailRow 
              label={t('transaction.total')} 
              value={`$ ${isEditing ? (parseFloat(editAmount) || 0).toFixed(2) : Number(transaction.amount).toFixed(2)}`} 
              isBold 
              colors={colors}
            />

            {/* Attachment Display/Edit Section */}
            <View style={[styles.divider, { backgroundColor: colorScheme === 'dark' ? '#334155' : '#F3F4F6' }]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('add.receiptLabel')}</Text>
            
            {isEditing ? (
              <View style={styles.editAttachmentSection} id="edit-attachment-section">
                {editAttachment ? (
                   <View style={[styles.attachmentPreviewChip, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F3F6FF', borderColor: colorScheme === 'dark' ? '#334155' : '#D1D5DB' }]}>
                      {editAttachment.type.includes('image') ? (
                          <RNImage source={{ uri: editAttachment.uri }} style={{ width: 40, height: 40, borderRadius: 8, marginRight: 10 }} />
                      ) : (
                          <Ionicons name="document-text" size={20} color="#2D4BFF" />
                      )}
                      <Text style={[styles.attachmentName, { color: colors.text }]} numberOfLines={1}>{editAttachment.name}</Text>
                      <TouchableOpacity onPress={() => setEditAttachment(null)}>
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </TouchableOpacity>
                   </View>
                ) : (
                  (transaction.attachmentUrl && !receiptCleared) ? (
                    <View style={[styles.attachmentPreviewChip, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F3F6FF', borderColor: colorScheme === 'dark' ? '#334155' : '#D1D5DB' }]}>
                       <Ionicons name={transaction.attachmentType === 'PDF' ? "document-text" : "image"} size={20} color="#2D4BFF" />
                       <Text style={[styles.attachmentName, { color: colors.text }]} numberOfLines={1}>
                         {transaction.attachmentType === 'PDF' ? 'Current PDF' : 'Existing Receipt'}
                       </Text>
                       <TouchableOpacity onPress={() => setReceiptCleared(true)}>
                         <Ionicons name="close-circle" size={20} color="#EF4444" />
                       </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.attachmentActionRow}>
                       <TouchableOpacity style={[styles.miniActionBtn, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F9FAFB', borderColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB' }]} onPress={handlePickImage} disabled={uploadingAttachment}>
                          <Ionicons name="camera" size={18} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                          <Text style={[styles.miniActionText, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>{t('add.addPhoto')}</Text>
                       </TouchableOpacity>
                       <TouchableOpacity style={[styles.miniActionBtn, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F9FAFB', borderColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB' }]} onPress={handlePickDocument} disabled={uploadingAttachment}>
                          <Ionicons name="document-attach" size={18} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                          <Text style={[styles.miniActionText, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>{t('add.addPDF')}</Text>
                       </TouchableOpacity>
                    </View>
                  )
                )}
                {uploadingAttachment && <ActivityIndicator size="small" color="#2D4BFF" style={{ marginTop: 10 }} />}
              </View>
            ) : (
                transaction.attachmentUrl ? (
                    <View style={styles.viewAttachmentContainer}>
                        {transaction.attachmentType === 'PDF' ? (
                            <TouchableOpacity style={[styles.pdfBadge, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFF5F5', borderColor: colorScheme === 'dark' ? '#7f1d1d' : '#FEE2E2' }]} onPress={() => Alert.alert('Download', 'PDF Viewer integration coming soon')}>
                                <Ionicons name="document-text" size={32} color="#EF4444" />
                                <View style={{ marginLeft: 15 }}>
                                    <Text style={[styles.attachmentTitle, { color: colors.text }]}>Receipt.pdf</Text>
                                    <Text style={styles.attachmentSubtitle}>Click to open document</Text>
                                </View>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.imagePreviewContainer} onPress={() => setShowImagePreview(true)}>
                                <RNImage 
                                    source={{ uri: transaction.attachmentUrl }} 
                                    style={styles.previewImage} 
                                    resizeMode="cover" 
                                />
                                <View style={styles.imageOverlay}>
                                    <Ionicons name="expand" size={20} color="white" />
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <Text style={styles.noAttachmentText}>No attachment added</Text>
                )
            )}

          </View>

          {showDatePicker && (
            <DateTimePicker
              value={editDate}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}

          {/* Action Buttons */}
          {isEditing ? (
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                 style={[styles.actionBtn, styles.saveBtn, colorScheme === 'dark' && { backgroundColor: '#586EEF' }]} 
                 onPress={handleSave}
                 disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.saveBtnText}>{t('transaction.save')}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                 style={[styles.actionBtn, styles.cancelBtn, colorScheme === 'dark' && { backgroundColor: '#1E293B' }]} 
                 onPress={() => {
                   setIsEditing(false);
                   setEditCategory(transaction.category);
                   setEditAmount(transaction.amount.toString());
                   setEditDescription(transaction.description || '');
                   setEditType(transaction.type);
                   setEditDate(new Date(transaction.date));
                   setEditAttachment(null);
                 }}
              >
                <Text style={[styles.cancelBtnText, colorScheme === 'dark' && { color: '#9CA3AF' }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[styles.editButton, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF', borderColor: '#2D4BFF' }]} onPress={() => setIsEditing(true)}>
              <Text style={styles.editButtonText}>{t('common.edit')}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Image Preview Modal */}
      <Modal visible={showImagePreview} transparent animationType="fade">
          <View style={styles.fullImageOverlay}>
              <TouchableOpacity style={styles.closePreview} onPress={() => setShowImagePreview(false)}>
                  <Ionicons name="close" size={32} color="white" />
              </TouchableOpacity>
              {transaction?.attachmentUrl && (
                  <RNImage 
                    source={{ uri: transaction.attachmentUrl }} 
                    style={styles.fullImage} 
                    resizeMode="contain" 
                  />
              )}
          </View>
      </Modal>

      {/* Premium Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
            <View style={[styles.warningIconContainer, { backgroundColor: colorScheme === 'dark' ? '#451a1a' : '#FFF5F5' }]}>
               <Ionicons name="warning" size={40} color="#FF6F61" />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('transaction.deleteConfirm')}</Text>
            <Text style={[styles.modalSubTitle, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>{t('transaction.deleteWarning')}</Text>
            
            <TouchableOpacity 
               style={styles.confirmDeleteBtn}
               onPress={confirmDelete}
            >
              <Text style={styles.confirmDeleteBtnText}>{t('transaction.yesDelete')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
               style={[styles.modalCancelBtn, { backgroundColor: colorScheme === 'dark' ? '#111827' : '#F3F4F6' }]}
               onPress={() => setShowDeleteModal(false)}
            >
              <Text style={[styles.modalCancelBtnText, colorScheme === 'dark' && { color: '#9CA3AF' }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {isSaving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color="white" />
        </View>
      )}
    </View>
  );
}

function DetailRow({ label, value, color, isBold = false, colors }) {
  const textColor = color || colors.text;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, { color: textColor, fontWeight: isBold ? '700' : '600' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D4BFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 20,
  },
  blueHeader: {
    height: 140,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
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
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 25,
  },
  topInfoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
    marginBottom: 20,
  },
  innerCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 15,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  amountText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111827',
  },
  editTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    padding: 4,
    marginBottom: 20,
  },
  typeToggle: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
  },
  typeToggleActiveIncome: {
    backgroundColor: '#ECFDF5',
  },
  typeToggleActiveExpense: {
    backgroundColor: '#FEF2F2',
  },
  typeToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeToggleTextActive: {
    color: '#111827',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#2D4BFF',
    paddingBottom: 5,
  },
  currencySymbol: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111827',
    marginRight: 5,
  },
  amountInput: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111827',
    minWidth: 100,
    textAlign: 'center',
  },
  detailsList: {
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  detailLabel: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
    flex: 2,
  },
  editableValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D4BFF',
    textAlign: 'right',
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#F3F6FF',
    borderRadius: 8,
    minWidth: 150,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 15,
  },
  editButton: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#2D4BFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    backgroundColor: '#FFFFFF',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D4BFF',
  },
  buttonGroup: {
    marginTop: 30,
  },
  actionBtn: {
    width: '100%',
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  saveBtn: {
    backgroundColor: '#2D4BFF',
  },
  saveBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    backgroundColor: '#F3F4F6',
  },
  cancelBtnText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  warningIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  modalSubTitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  confirmDeleteBtn: {
    width: '100%',
    height: 56,
    backgroundColor: '#FF6F61',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmDeleteBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  modalCancelBtn: {
    width: '100%',
    height: 56,
    backgroundColor: '#F3F4F6',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  modalCancelBtnText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '700',
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  editAttachmentSection: {
    marginTop: 10,
  },
  attachmentPreviewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F6FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  attachmentName: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  attachmentActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  miniActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flex: 1,
    justifyContent: 'center',
  },
  miniActionText: {
    marginLeft: 5,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  viewAttachmentContainer: {
    marginTop: 15,
  },
  pdfBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  attachmentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  attachmentSubtitle: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  imagePreviewContainer: {
    width: '100%',
    height: 180,
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 8,
  },
  noAttachmentText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 10,
  },
  fullImageOverlay: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closePreview: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  fullImage: {
    width: width,
    height: height * 0.8,
  },
});
