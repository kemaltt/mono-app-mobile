// @ts-nocheck
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Switch, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/theme';
import { API_URL } from '../../constants/Config';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function UserDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { token, user: authUser } = useAuth();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [user, setUser] = useState(null);
  const isSuperAdmin = authUser?.role === 'SUPER_ADMIN';
  
  // Edit states
  const [licenseTier, setLicenseTier] = useState('');
  const [status, setStatus] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [aiUsageCount, setAiUsageCount] = useState('');
  const [trialEndsAt, setTrialEndsAt] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [role, setRole] = useState('');

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/users/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setLicenseTier(data.licenseTier);
        setStatus(data.status);
        setIsVerified(data.isVerified);
        setAiUsageCount(data.aiUsageCount.toString());
        setTrialEndsAt(data.trialEndsAt ? new Date(data.trialEndsAt) : new Date());
        setRole(data.role);
      }
    } catch (error) {
      console.error(error);
      Toast.show({ type: 'error', text1: t('common.error'), text2: t('admin.updateError') });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setUpdating(true);
    try {
      const response = await fetch(`${API_URL}/admin/users/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          licenseTier,
          status,
          isVerified,
          aiUsageCount: parseInt(aiUsageCount),
          trialEndsAt: licenseTier === 'TRIAL' ? trialEndsAt.toISOString() : null,
          role
        })
      });

      if (response.ok) {
        Toast.show({ type: 'success', text1: t('common.success'), text2: t('admin.updateSuccess') });
        fetchUser();
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: t('common.error'), text2: t('admin.updateError') });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#586EEF" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ 
        headerTitle: user?.email || t('admin.userDetail'),
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 5 }}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
        )
      }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Info Header */}
        <View style={[styles.headerCard, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF', borderColor: colorScheme === 'dark' ? '#334155' : '#F3F4F6' }]}>
            <Text style={[styles.headerName, { color: colors.text }]}>{user.firstName} {user.lastName}</Text>
            <Text style={styles.headerEmail}>{user.email}</Text>
            <View style={styles.headerMeta}>
                <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>{t('admin.joined')}</Text>
                    <Text style={[styles.metaValue, { color: colors.text }]}>{new Date(user.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>{t('admin.level')}</Text>
                    <Text style={[styles.metaValue, { color: colors.text }]}>{user.level} ({user.xp} {t('admin.xp')})</Text>
                </View>
            </View>
        </View>

        {/* Edit Form */}
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('admin.management')}</Text>
            
            {/* License Tier */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('admin.licenseTier')}</Text>
                <View style={styles.pickerRow}>
                    {['TRIAL', 'PRO', 'ULTIMATE'].map(t => (
                        <TouchableOpacity 
                            key={t} 
                            onPress={() => isSuperAdmin && setLicenseTier(t)}
                            disabled={!isSuperAdmin}
                            style={[
                                styles.pickerItem, 
                                { borderColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB' },
                                licenseTier === t && { backgroundColor: '#586EEF', borderColor: '#586EEF' },
                                !isSuperAdmin && { opacity: 0.6 }
                            ]}
                        >
                            <Text style={[styles.pickerText, { color: colors.text }, licenseTier === t && { color: 'white' }]}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* User Status */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('admin.userStatus')}</Text>
                <View style={styles.pickerRow}>
                    {['ACTIVE', 'CANCELED_REQUEST', 'CANCELLED'].map(s => (
                        <TouchableOpacity 
                            key={s} 
                            onPress={() => isSuperAdmin && setStatus(s)}
                            disabled={!isSuperAdmin}
                            style={[
                                styles.pickerItem, 
                                { borderColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB' },
                                status === s && { backgroundColor: '#586EEF', borderColor: '#586EEF' },
                                !isSuperAdmin && { opacity: 0.6 }
                            ]}
                        >
                            <Text style={[styles.pickerText, { fontSize: 10, color: colors.text }, status === s && { color: 'white' }]}>{s.replace('_', ' ')}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Role */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('admin.role')}</Text>
                <View style={styles.pickerRow}>
                    {['USER', 'ADMIN', 'SUPER_ADMIN'].map(r => (
                        <TouchableOpacity 
                            key={r} 
                            onPress={() => isSuperAdmin && setRole(r)}
                            disabled={!isSuperAdmin}
                            style={[
                                styles.pickerItem, 
                                { borderColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB' },
                                role === r && { backgroundColor: r === 'SUPER_ADMIN' ? '#8B5CF6' : '#EF4444', borderColor: r === 'SUPER_ADMIN' ? '#8B5CF6' : '#EF4444' },
                                !isSuperAdmin && { opacity: 0.6 }
                            ]}
                        >
                            <Text style={[styles.pickerText, { color: colors.text }, role === r && { color: 'white' }]}>{r}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* AI Limit */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('admin.aiUsageToday')}</Text>
                <TextInput 
                    style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F9FAFB', borderColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB', color: colors.text }, !isSuperAdmin && { opacity: 0.6 }]}
                    value={aiUsageCount}
                    onChangeText={setAiUsageCount}
                    keyboardType="number-pad"
                    editable={isSuperAdmin}
                />
            </View>

            {/* Verification Toggle */}
            <View style={[styles.switchRow, { borderBottomColor: colorScheme === 'dark' ? '#334155' : '#F3F4F6' }]}>
                <Text style={[styles.label, { marginBottom: 0 }]}>{t('admin.emailVerified')}</Text>
                <Switch 
                    value={isVerified}
                    onValueChange={setIsVerified}
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={isVerified ? "#586EEF" : "#f4f3f4"}
                    disabled={!isSuperAdmin}
                />
            </View>

            {/* Trial Expiry (Visible only if TRIAL) */}
            {licenseTier === 'TRIAL' && (
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('admin.trialExpiresAt')}</Text>
                    <TouchableOpacity 
                        style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F9FAFB', borderColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB', justifyContent: 'center' }, !isSuperAdmin && { opacity: 0.6 }]}
                        onPress={() => isSuperAdmin && setShowDatePicker(true)}
                        disabled={!isSuperAdmin}
                    >
                        <Text style={{ color: colors.text }}>{trialEndsAt.toLocaleDateString()} {trialEndsAt.toLocaleTimeString()}</Text>
                    </TouchableOpacity>
                    {showDatePicker && isSuperAdmin && (
                        <DateTimePicker
                            value={trialEndsAt}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={(event, selectedDate) => {
                                setShowDatePicker(false);
                                if (selectedDate) setTrialEndsAt(selectedDate);
                            }}
                        />
                    )}
                </View>
            )}

            {isSuperAdmin && (
              <TouchableOpacity 
                  style={[styles.saveButton, updating && { opacity: 0.7 }]}
                  onPress={handleSave}
                  disabled={updating}
              >
                  {updating ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>{t('admin.applyChanges')}</Text>}
              </TouchableOpacity>
            )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20 },
  headerCard: { padding: 20, borderRadius: 24, borderWidth: 1, marginBottom: 25 },
  headerName: { fontSize: 24, fontWeight: '800' },
  headerEmail: { fontSize: 14, color: '#9CA3AF', marginBottom: 15 },
  headerMeta: { flexDirection: 'row', gap: 30 },
  metaLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 4 },
  metaValue: { fontSize: 14, fontWeight: '600' },
  section: { width: '100%' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginBottom: 8, textTransform: 'uppercase' },
  input: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 15, fontSize: 16 },
  pickerRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  pickerItem: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center', minWidth: 80 },
  pickerText: { fontSize: 12, fontWeight: '600' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, marginBottom: 20 },
  saveButton: { height: 56, backgroundColor: '#586EEF', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: 'white', fontSize: 18, fontWeight: '700' }
});
