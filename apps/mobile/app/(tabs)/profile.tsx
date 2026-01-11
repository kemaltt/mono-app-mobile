// @ts-nocheck
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/auth';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/theme';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '../../constants/Config';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, signOut, token, updateUser, refreshUser } = useAuth();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
        refreshUser();
    }, [])
  );

  useEffect(() => {
    // Simulate initial loading to show ActivityIndicator and hide bundling artifact
    const timer = setTimeout(() => setLoading(false), 150);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.replace('/onboarding');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setUploading(true);
      
      try {
        const formData = new FormData();
        formData.append('file', {
          uri: asset.uri,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as any);

        const response = await fetch(`${API_URL}/profile/avatar`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        });

        const data = await response.json();
        if (response.ok) {
          await updateUser({ ...user, avatarUrl: data.avatarUrl });
          Toast.show({
            type: 'success',
            text1: t('common.save'),
            text2: t('profile.profilePictureUpdated'),
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setUploading(false);
      }
    }
  };

  const profileCards = [
    { 
      id: 'notifications', 
      title: t('profile.notifications'), 
      subtitle: t('profile.notificationsSubtitle'), 
      icon: 'notifications-outline', 
      onPress: () => {} 
    },
    { 
      id: 'profile', 
      title: t('tabs.profile'), 
      subtitle: t('profile.profileSubtitle'), 
      icon: 'person-outline', 
      onPress: () => router.push('/profile/edit') 
    },
    { 
      id: 'account', 
      title: t('profile.account'), 
      subtitle: t('profile.accountSubtitle'), 
      icon: 'lock-closed-outline', 
      onPress: () => router.push('/profile/account') 
    },
    { 
      id: 'settings', 
      title: t('profile.settings'), 
      subtitle: t('profile.settingsSubtitle'), 
      icon: 'settings-outline', 
      onPress: () => router.push('/profile/settings') 
    },
    { 
      id: 'achievements', 
      title: t('wallet.achievements'), 
      subtitle: t('wallet.badges'), 
      icon: 'trophy-outline', 
      onPress: () => router.push('/profile/achievements') 
    },
    ...(user?.role === 'ADMIN' ? [{
      id: 'admin',
      title: t('profile.adminPanel'),
      subtitle: t('profile.adminPanelSubtitle'),
      icon: 'shield-checkmark-outline',
      onPress: () => router.push('/profile/admin')
    }] : []),
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ 
        headerShown: true, 
        headerTitle: t('profile.meins'),
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        headerTitleAlign: 'center',
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerLeft: () => (
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 5 }}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
        ),
      }} />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroSection}>
          <View style={styles.titleContainer}>
            <Text style={[styles.heroTitle, { color: colors.text }]}>{t('profile.hello')} {user?.firstName || 'User'}</Text>
            <View style={styles.sparkleContainer}>
              <View style={[styles.sparkle, { transform: [{ rotate: '45deg' }] }]} />
              <View style={[styles.sparkle, { transform: [{ rotate: '0deg' }] }]} />
              <View style={[styles.sparkle, { transform: [{ rotate: '-45deg' }] }]} />
            </View>
          </View>
          <Text style={styles.heroSubtitle}>{t('profile.welcomeProfile')}</Text>

          {/* User Level / XP Bar */}
          <View style={[styles.levelContainer, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F3F4F6' }]}>
            <View style={styles.levelHeader}>
                <Text style={[styles.levelLabel, { color: colors.text }]}>{t('wallet.level')} {user?.level || 1}</Text>
                <Text style={styles.xpLabel}>{user?.xp || 0} / {(user?.level || 1) * 100} {t('wallet.xp')}</Text>
            </View>
            <View style={[styles.xpBarBackground, { backgroundColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB' }]}>
                <View style={[styles.xpBarFill, { width: `${Math.min(((user?.xp || 0) % 100), 99)}%` }]} />
            </View>
          </View>

          {/* Membership Status */}
          <TouchableOpacity 
            style={[styles.membershipCard, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF', borderColor: colorScheme === 'dark' ? '#334155' : '#EEF2FF' }]}
            onPress={() => {
                 router.push('/profile/membership');
            }}
          >
            <View style={styles.membershipIcon}>
              <Ionicons name="diamond" size={24} color="#586EEF" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.membershipLabel, { color: colors.subtext }]}>{t('profile.membership')}</Text>
              <Text style={[styles.membershipTier, { color: colors.text }]}>
                {user?.licenseTier === 'TRIAL' ? t('profile.trial') : (user?.licenseTier === 'PRO' ? t('profile.pro') : t('profile.ultimate'))}
              </Text>
            </View>
            {user?.licenseTier === 'TRIAL' && user?.trialEndsAt && (
                <View style={styles.trialBadge}>
                    <Text style={styles.trialBadgeText}>
                        {Math.ceil((new Date(user.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} {t('profile.days')}
                    </Text>
                </View>
            )}
            <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
          </TouchableOpacity>
        </View>

        <View style={styles.gridContainer}>
          {profileCards.map((card) => (
            <TouchableOpacity 
              key={card.id} 
              style={[
                styles.card, 
                { 
                  backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF',
                  borderColor: colorScheme === 'dark' ? '#334155' : '#F3F4F6'
                }
              ]} 
              onPress={card.onPress}
              activeOpacity={0.85}
            >
              <View style={styles.cardIconWrapper}>
                <Ionicons name={card.icon} size={24} color={colors.text} />
              </View>
              <View style={styles.cardTextWrapper}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{card.title}</Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>{card.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colorScheme === 'dark' ? '#451a1a' : '#FEF2F2' }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text style={styles.logoutText}>{t('common.logout')}</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  heroSection: {
    marginBottom: 40,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000000',
  },
  sparkleContainer: {
    flexDirection: 'row',
    marginLeft: 10,
    gap: 4,
  },
  sparkle: {
    width: 15,
    height: 4,
    backgroundColor: '#00FFCC',
    borderRadius: 2,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '400',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  card: {
    width: (width - 55) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    minHeight: 110,
  },
  cardIconWrapper: {
    marginBottom: 12,
  },
  cardTextWrapper: {
    gap: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    gap: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  levelContainer: {
      marginTop: 20,
      padding: 16,
      borderRadius: 20,
  },
  levelHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
  },
  levelLabel: {
      fontWeight: '700',
      fontSize: 14,
  },
  xpLabel: {
      fontSize: 12,
      color: '#9CA3AF',
  },
  xpBarBackground: {
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
  },
  xpBarFill: {
      backgroundColor: '#586EEF',
      borderRadius: 4,
  },
  membershipCard: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 15,
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
  },
  membershipIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: '#EEF2FF',
      justifyContent: 'center',
      alignItems: 'center',
  },
  membershipLabel: {
      fontSize: 12,
      fontWeight: '500',
      marginBottom: 2,
      textTransform: 'uppercase',
  },
  membershipTier: {
      fontSize: 18,
      fontWeight: '700',
  },
  trialBadge: {
      backgroundColor: '#586EEF',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
      marginRight: 10,
  },
  trialBadgeText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '700',
  }
});
