// @ts-nocheck
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, FlatList, Dimensions, Animated, Modal, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/theme';
import { API_URL } from '../../constants/Config';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export default function AdminScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token, user: authUser } = useAuth();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  
  const [filterLicense, setFilterLicense] = useState(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  const fetchData = useCallback(async (license = filterLicense) => {
    try {
      let usersUrl = `${API_URL}/admin/users`;
      if (license) usersUrl += `?licenseTier=${license}`;

      const [statsRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(usersUrl, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (statsRes.status === 403 || usersRes.status === 403) {
        Toast.show({ 
            type: 'error', 
            text1: t('admin.accessDenied'), 
            text2: t('admin.refreshPermissions') 
        });
        return;
      }

      if (statsRes.ok && usersRes.ok) {
        setStats(await statsRes.json());
        setUsers(await usersRes.json());
      }
    } catch (error) {
      console.error(error);
      Toast.show({ type: 'error', text1: t('common.error'), text2: t('admin.updateError') });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, filterLicense]);

  useEffect(() => {
    fetchData();
  }, [filterLicense]);

  const toggleFilter = (license) => {
    setFilterLicense(prev => prev === license ? null : license);
  };

  const showUserOptions = (user) => {
    setSelectedUser(user);
    setSheetVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const hideUserOptions = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 300, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setSheetVisible(false);
      setSelectedUser(null);
    });
  };

  const handleUpdateUser = async (updates) => {
    try {
      const response = await fetch(`${API_URL}/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        Toast.show({ type: 'success', text1: t('common.success'), text2: t('admin.updateSuccess') });
        hideUserOptions();
        fetchData();
      }
    } catch (error) {
        Toast.show({ type: 'error', text1: t('common.error'), text2: t('admin.updateError') });
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#586EEF" />
      </View>
    );
  }

  const StatCard = ({ title, value, icon, color, active, onPress }) => (
    <TouchableOpacity 
        onPress={onPress}
        style={[
            styles.statCard, 
            { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF', borderColor: colorScheme === 'dark' ? '#334155' : '#F3F4F6' },
            active && { borderColor: color, borderWidth: 2 }
        ]}
    >
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ 
          headerTitle: t('profile.adminPanel'),
          headerTitleStyle: { color: colors.text, fontWeight: '700' },
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 5 }}>
              <Ionicons name="chevron-back" size={28} color={colors.text} />
            </TouchableOpacity>
          )
      }} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Row 1: Overview */}
        <View style={styles.statsRow}>
          <StatCard title={t('admin.totalUsers')} value={stats?.totalUsers ?? 0} icon="people" color="#586EEF" active={!filterLicense} onPress={() => setFilterLicense(null)} />
          <StatCard title={t('admin.trialUsers')} value={stats?.trialUsers ?? 0} icon="time" color="#F59E0B" active={filterLicense === 'TRIAL'} onPress={() => toggleFilter('TRIAL')} />
        </View>

        {/* Stats Row 2: Paid Tiers */}
        <View style={styles.statsRow}>
          <StatCard title={t('admin.proUsers')} value={stats?.proUsers ?? 0} icon="diamond" color="#A855F7" active={filterLicense === 'PRO'} onPress={() => toggleFilter('PRO')} />
          <StatCard title={t('admin.ultimateUsers')} value={stats?.ultimateUsers ?? 0} icon="star" color="#3B82F6" active={filterLicense === 'ULTIMATE'} onPress={() => toggleFilter('ULTIMATE')} />
        </View>

        {/* Stats Row 3: Usage */}
        <View style={styles.statsRow}>
          <StatCard title={t('admin.aiScansTotal')} value={stats?.totalScans ?? 0} icon="scan" color="#10B981" />
        </View>

        {/* User List */}
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
                {filterLicense ? `${filterLicense} ${t('admin.users')}` : t('admin.allUsers')}
            </Text>
            {filterLicense && (
                <TouchableOpacity onPress={() => setFilterLicense(null)}>
                    <Text style={{ color: '#586EEF', fontWeight: '600' }}>{t('admin.clear')}</Text>
                </TouchableOpacity>
            )}
        </View>

        {users.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={[styles.userItem, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF', borderColor: colorScheme === 'dark' ? '#334155' : '#F3F4F6' }]}
            onPress={() => router.push({ pathname: '/profile/user-detail', params: { id: item.id } })}
            onLongPress={() => showUserOptions(item)}
          >
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>{item.firstName} {item.lastName}</Text>
              <Text style={styles.userEmail}>{item.email}</Text>
            </View>
            <View style={styles.userBadge}>
               <Text style={[styles.badgeText, { color: item.licenseTier === 'TRIAL' ? '#F59E0B' : '#586EEF' }]}>{item.licenseTier}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Admin Action Sheet */}
      <Modal visible={sheetVisible} transparent animationType="none">
        <Pressable style={styles.modalOverlay} onPress={hideUserOptions}>
          <Animated.View style={[styles.modalBackdrop, { opacity: fadeAnim }]} />
          <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }], backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{selectedUser?.email}</Text>
            </View>
            
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => { hideUserOptions(); router.push({ pathname: '/profile/user-detail', params: { id: selectedUser.id } }); }}>
                <Ionicons name="person" size={24} color="#586EEF" />
                <Text style={[styles.actionText, { color: colors.text }]}>{t('admin.viewFullProfile')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={() => handleUpdateUser({ licenseTier: 'PRO' })}>
                <Ionicons name="diamond" size={24} color="#A855F7" />
                <Text style={[styles.actionText, { color: colors.text }]}>{t('admin.makePro')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleUpdateUser({ licenseTier: 'ULTIMATE' })}>
                <Ionicons name="star" size={24} color="#586EEF" />
                <Text style={[styles.actionText, { color: colors.text }]}>{t('admin.makeUltimate')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleUpdateUser({ licenseTier: 'TRIAL', trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })}>
                <Ionicons name="time" size={24} color="#F59E0B" />
                <Text style={[styles.actionText, { color: colors.text }]}>{t('admin.extendTrial7')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, { borderBottomWidth: 0 }]} onPress={() => handleUpdateUser({ role: selectedUser?.role === 'ADMIN' ? 'USER' : 'ADMIN' })}>
                <Ionicons name="shield-half" size={24} color="#6B7280" />
                <Text style={[styles.actionText, { color: colors.text }]}>{selectedUser?.role === 'ADMIN' ? t('admin.removeAdmin') : t('admin.makeAdmin')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={hideUserOptions}>
              <Text style={styles.closeBtnText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 20 },
  statsRow: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  statCard: { flex: 1, padding: 15, borderRadius: 20, borderWidth: 1 },
  statIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statTitle: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600' },
  userEmail: { fontSize: 13, color: '#9CA3AF' },
  userBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F3F4F6', marginRight: 10 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  bottomSheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40 },
  sheetHeader: { alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 16, fontWeight: '600' },
  actions: { marginBottom: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 15 },
  actionText: { fontSize: 16, fontWeight: '500' },
  closeBtn: { height: 56, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { fontSize: 16, color: '#4B5563', fontWeight: '700' }
});
