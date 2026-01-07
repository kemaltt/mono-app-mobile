// @ts-nocheck
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/theme';
import { API_URL } from '../../constants/Config';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, token, updateUser, refreshUser } = useAuth();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Refresh user data on mount
  useEffect(() => {
    refreshUser();
  }, []);

  // Sync state when user object updates
  useEffect(() => {
    if (user) {
      if (user.firstName) setFirstName(user.firstName);
      if (user.lastName) setLastName(user.lastName);
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/profile/update`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ firstName, lastName }),
      });

      if (response.ok) {
        const data = await response.json();
        await updateUser({ ...user, ...data.user });
        Toast.show({
          type: 'success',
          text1: t('common.save'),
        });
        router.back();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
            text1: t('profile.profilePictureUpdated'),
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ 
        headerShown: true,
        headerTitle: t('tabs.profile'),
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerTitleAlign: 'center',
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
        headerShadowVisible: false,
      }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.text }]}>{t('tabs.profile')}</Text>
          <Text style={[styles.subtitle, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>Verwalte deine persönlichen Informationen</Text>
        </View>

        <View style={styles.avatarContainer}>
          <TouchableOpacity 
            style={[styles.avatarWrapper, { borderColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB' }]} 
            onPress={handleImagePick}
            disabled={uploading}
          >
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F3F4F6' }]}>
                <Ionicons name="person" size={40} color={colorScheme === 'dark' ? '#4B5563' : '#9CA3AF'} />
              </View>
            )}
            {uploading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color="white" />
              </View>
            )}
            <View style={[styles.editBadge, { borderColor: colors.background }]}>
              <Ionicons name="camera" size={12} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>Vorname</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F9FAFB', borderColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB', color: colors.text }]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Vorname"
              placeholderTextColor={colorScheme === 'dark' ? '#4B5563' : '#9CA3AF'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>Nachname</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F9FAFB', borderColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB', color: colors.text }]}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Nachname"
              placeholderTextColor={colorScheme === 'dark' ? '#4B5563' : '#9CA3AF'}
            />
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.disabledButton]} 
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Speichern</Text>
            )}
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
  scrollContent: {
    padding: 20,
  },
  headerSection: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarWrapper: {
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 60,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#586EEF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 4,
  },
  input: {
    height: 56,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  saveButton: {
    height: 56,
    backgroundColor: '#586EEF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#586EEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.7,
  },
});
