// @ts-nocheck
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/theme';

import { useAuth } from '../../context/auth';

export default function AccountScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { user } = useAuth();
  
  const isPendingDeletion = user?.status === 'CANCELED_REQUEST';

  const menuItems = [
    { icon: 'id-card-outline', label: t('profile.contactData'), onPress: () => {} },
    { icon: 'create-outline', label: t('profile.editAccount'), onPress: () => router.push('/profile/edit-account') },
    { 
       icon: isPendingDeletion ? 'shield-checkmark-outline' : 'trash-outline', 
       label: isPendingDeletion ? 'Cancel Deletion' : t('profile.deleteAccount'), 
       onPress: () => router.push('/profile/delete-account') 
    },
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
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
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
});
