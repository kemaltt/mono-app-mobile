
// @ts-nocheck
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { useState } from 'react';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/theme';
import { API_URL } from '../../constants/Config';

export default function DeleteAccountScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { user, token, refreshUser, signOut } = useAuth();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  // If user is null, we can't do anything (shouldn't happen on this screen)
  if (!user) return null;

  const isPendingDeletion = user.status === 'CANCELED_REQUEST';

  const handleRequestCode = async () => {
    try {
      setLoading(true);
      const endpoint = isPendingDeletion 
        ? '/profile/undo-delete-request' 
        : '/profile/delete-request';
      
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok) {
        setCodeSent(true);
        Toast.show({
            type: 'success',
            text1: t('common.success'),
            text2: t('auth.codeSent') || 'Code sent to your email'
        });
      } else {
        Alert.alert(t('common.error'), data.error || 'Failed to send code');
      }
    } catch (e) {
      Alert.alert(t('common.error'), 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!code || code.length !== 6) {
      Alert.alert(t('common.error'), t('auth.invalidCode') || 'Invalid code');
      return;
    }

    try {
      setLoading(true);
      const endpoint = isPendingDeletion 
        ? '/profile/undo-delete-confirm' 
        : '/profile/delete-confirm';
      
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code })
      });

      const data = await res.json();
      if (res.ok) {
        await refreshUser();
        Toast.show({
            type: 'success',
            text1: t('common.success'),
            text2: isPendingDeletion ? t('deleteAccount.successUndo') : t('deleteAccount.successDelete')
        });
        router.back();
      } else {
        Alert.alert(t('common.error'), data.error || 'Operation failed');
      }
    } catch (e) {
      Alert.alert(t('common.error'), 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Stack.Screen options={{ title: isPendingDeletion ? t('deleteAccount.undoTitle') : t('deleteAccount.title') }} />

      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: isPendingDeletion ? '#ECFDF5' : '#FEF2F2' }]}>
            <Ionicons 
                name={isPendingDeletion ? "shield-checkmark-outline" : "warning-outline"} 
                size={48} 
                color={isPendingDeletion ? "#10B981" : "#EF4444"} 
            />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
            {isPendingDeletion ? t('deleteAccount.undoTitle') : t('deleteAccount.title')}
        </Text>

        <Text style={[styles.description, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>
            {isPendingDeletion 
                ? t('deleteAccount.undoDescription')
                : t('deleteAccount.description')
            }
        </Text>

        {!codeSent ? (
            <TouchableOpacity 
                style={[styles.mainButton, { backgroundColor: isPendingDeletion ? '#10B981' : '#EF4444' }]} 
                onPress={handleRequestCode}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="white" /> : (
                    <Text style={styles.mainButtonText}>
                        {isPendingDeletion ? t('deleteAccount.undoButton') : t('deleteAccount.startButton')}
                    </Text>
                )}
            </TouchableOpacity>
        ) : (
            <View style={styles.codeSection}>
                <Text style={[styles.label, { color: colors.text }]}>{t('deleteAccount.enterCode')}</Text>
                <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.icon || '#E5E7EB', backgroundColor: colorScheme === 'dark' ? '#1f2937' : '#FFFFFF' }]}
                    value={code}
                    onChangeText={setCode}
                    placeholder="123456"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={6}
                />
                <TouchableOpacity 
                    style={[styles.mainButton, { backgroundColor: isPendingDeletion ? '#10B981' : '#EF4444', marginTop: 20 }]} 
                    onPress={handleConfirm}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="white" /> : (
                        <Text style={styles.mainButtonText}>
                            {isPendingDeletion ? t('deleteAccount.confirmUndoButton') : t('deleteAccount.confirmButton')}
                        </Text>
                    )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setCodeSent(false)} style={styles.cancelLink}>
                    <Text style={[styles.cancelLinkText, { color: colors.text }]}>{t('deleteAccount.cancel')}</Text>
                </TouchableOpacity>
            </View>
        )}

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  mainButton: {
    width: '100%',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  mainButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  codeSection: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
  },
  cancelLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  cancelLinkText: {
    fontSize: 16,
    fontWeight: '600',
  }
});
