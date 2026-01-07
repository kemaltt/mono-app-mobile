// @ts-nocheck
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function EditAccountScreen() {
  const { t } = useTranslation();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { user } = useAuth();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ 
        headerTitle: t('profile.editAccount'),
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
              <Text style={{ fontSize: 17, color: colors.text, marginLeft: -4, marginTop: -2 }}>{t('profile.account')}</Text>
            </View>
          </TouchableOpacity>
        ),
        headerTitleAlign: 'center',
        headerShadowVisible: false,
      }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.accessData')}</Text>
        
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>{t('profile.usernameEmail')}</Text>
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldValue, { color: colors.text }]}>{user?.email}</Text>
            <TouchableOpacity 
              style={[styles.changeButton, { borderColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB' }]}
              onPress={() => router.push('/profile/security')}
            >
              <Text style={[styles.changeButtonText, { color: colorScheme === 'dark' ? '#E2E8F0' : '#4B5563' }]}>{t('profile.change')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>{t('auth.password')}</Text>
          <View style={styles.fieldRow}>
            <Text style={[styles.fieldValue, { color: colors.text }]}>••••••••</Text>
            <TouchableOpacity 
              style={[styles.changeButton, { borderColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB' }]}
              onPress={() => router.push('/profile/security')}
            >
              <Text style={[styles.changeButtonText, { color: colorScheme === 'dark' ? '#E2E8F0' : '#4B5563' }]}>{t('profile.change')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colorScheme === 'dark' ? '#334155' : '#F3F4F6' }]} />

        <View style={styles.googleSection}>
          <View style={styles.googleHeader}>
            <Ionicons name="logo-google" size={24} color="#EA4335" />
            <Text style={[styles.googleText, { color: colors.text }]}>Google</Text>
          </View>
          <Text style={[styles.googleSubLabel, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>Linked with kemalty@gmail.com</Text>
          <View style={styles.googleFooter}>
            <Text style={[styles.googleStatus, { color: colorScheme === 'dark' ? '#10B981' : '#059669' }]}>CONNECTED</Text>
            <TouchableOpacity style={[styles.disconnectButton, { borderColor: '#EF4444' }]}>
              <Text style={styles.disconnectButtonText}>DISCONNECT</Text>
            </TouchableOpacity>
          </View>
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
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
  },
  field: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  fieldValue: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  changeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 32,
  },
  googleSection: {
    gap: 12,
  },
  googleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  googleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  googleSubLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  googleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  googleStatus: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  disconnectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  disconnectButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
});
