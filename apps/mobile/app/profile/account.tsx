// @ts-nocheck
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, FlatList, ActivityIndicator, Pressable, Animated } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/theme';

import { useState, useRef } from 'react';
import { useAuth } from '../../context/auth';
import { API_URL } from '../../constants/Config';
import Toast from 'react-native-toast-message';

export default function AccountScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { user, token, updateUser } = useAuth();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [updating, setUpdating] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  
  const isPendingDeletion = user?.status === 'CANCELED_REQUEST';

  const showModal = () => {
    setModalVisible(true);
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

  const hideModal = () => {
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
    ]).start(() => setModalVisible(false));
  };

  const handleTimezoneSelect = async (timezone: string) => {
    if (timezone === user?.timezone) {
      hideModal();
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`${API_URL}/profile/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timezone }),
      });

      if (response.ok) {
        const data = await response.json();
        await updateUser(data.user);
        Toast.show({
          type: 'success',
          text1: t('common.success'),
          text2: t('profile.timezoneUpdated'),
        });
        hideModal();
      } else {
        throw new Error('Failed to update timezone');
      }
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: 'Could not update timezone',
      });
    } finally {
      setUpdating(false);
    }
  };

  const allTimezones = [
    "UTC", "Africa/Cairo", "Africa/Johannesburg", "Africa/Lagos", "Africa/Nairobi",
    "America/Anchorage", "America/Argentina/Buenos_Aires", "America/Chicago", 
    "America/Denver", "America/Los_Angeles", "America/Mexico_City", "America/New_York",
    "America/Phoenix", "America/Sao_Paulo", "Asia/Baku", "Asia/Bangkok", "Asia/Dubai",
    "Asia/Hong_Kong", "Asia/Istanbul", "Asia/Jerusalem", "Asia/Kolkata", "Asia/Seoul",
    "Asia/Singapore", "Asia/Tokyo", "Australia/Adelaide", "Australia/Brisbane", "Australia/Sydney",
    "Europe/Amsterdam", "Europe/Berlin", "Europe/Brussels", "Europe/Budapest", "Europe/Copenhagen",
    "Europe/Dublin", "Europe/Helsinki", "Europe/Istanbul", "Europe/Lisbon", "Europe/London",
    "Europe/Madrid", "Europe/Moscow", "Europe/Oslo", "Europe/Paris", "Europe/Prague",
    "Europe/Rome", "Europe/Stockholm", "Europe/Vienna", "Europe/Warsaw", "Europe/Zurich",
    "Pacific/Auckland", "Pacific/Honolulu"
  ].sort();

  const filteredTimezones = allTimezones.filter(tz => 
    tz.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const menuItems = [
    { icon: 'id-card-outline', label: t('profile.contactData'), onPress: () => {} },
    { icon: 'create-outline', label: t('profile.editAccount'), onPress: () => router.push('/profile/edit-account') },
    { 
       icon: isPendingDeletion ? 'shield-checkmark-outline' : 'trash-outline', 
       label: isPendingDeletion ? 'Cancel Deletion' : t('profile.deleteAccount'), 
       onPress: () => router.push('/profile/delete-account') 
    },
    { icon: 'time-outline', label: t('profile.timezone'), value: user?.timezone, onPress: showModal },
    { icon: 'star-outline', label: t('profile.plusMembership'), onPress: () => {} },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ 
        headerTitle: t('profile.account'),
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
      <ScrollView>
        <View style={styles.section}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={[styles.item, { borderBottomColor: colorScheme === 'dark' ? '#334155' : '#F3F4F6' }]} onPress={item.onPress}>
              <View style={styles.itemLeft}>
                <Ionicons name={item.icon} size={22} color={colorScheme === 'dark' ? '#9CA3AF' : '#4B5563'} />
                <Text style={[styles.itemLabel, { color: colors.text }]}>{item.label}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {item.value && (
                    <Text style={{ color: '#9CA3AF', marginRight: 8, fontSize: 14 }}>{item.value}</Text>
                )}
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={hideModal}
      >
        <Pressable style={styles.modalOverlay} onPress={hideModal}>
          <Animated.View style={[styles.modalBackdrop, { opacity: fadeAnim }]} />
          <Animated.View 
            style={[
              styles.bottomSheet, 
              { transform: [{ translateY: slideAnim }], backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }
            ]}
          >
            <View style={styles.sheetHeader}>
              <View style={[styles.sheetHandle, { backgroundColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB' }]} />
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{t('profile.timezone')}</Text>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: colorScheme === 'dark' ? '#111827' : '#F3F4F6' }]}>
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={t('profile.searchText')}
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredTimezones}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.timezoneItem,
                    user?.timezone === item && { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#EEF2FF', borderColor: '#586EEF' }
                  ]}
                  onPress={() => handleTimezoneSelect(item)}
                >
                  <Text style={[styles.timezoneLabel, { color: colors.text }, user?.timezone === item && { color: '#586EEF', fontWeight: '700' }]}>
                    {item}
                  </Text>
                  {user?.timezone === item && (
                    <Ionicons name="checkmark-circle" size={22} color="#586EEF" />
                  )}
                </TouchableOpacity>
              )}
              style={{ maxHeight: 400 }}
              contentContainerStyle={{ paddingBottom: 20 }}
            />

            {updating && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#586EEF" />
              </View>
            )}

            <TouchableOpacity 
              style={[styles.cancelButton, { backgroundColor: colorScheme === 'dark' ? '#111827' : '#F9FAFB' }]} 
              onPress={hideModal}
            >
              <Text style={[styles.cancelButtonText, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
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
    marginTop: 20,
    backgroundColor: 'transparent',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
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
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 25,
    paddingBottom: 40,
    paddingTop: 15,
    height: '80%',
  },
  sheetHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 15,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 15,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  timezoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 15,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  timezoneLabel: {
    fontSize: 16,
  },
  cancelButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: 32,
  }
});
