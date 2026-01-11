
import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/theme';
import { Colors } from '../constants/theme';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

interface AiLimitModalProps {
  isVisible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  message?: string;
}

const { width } = Dimensions.get('window');

export default function AiLimitModal({ isVisible, onClose, onUpgrade, message }: AiLimitModalProps) {
  const { t } = useTranslation();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const router = useRouter();

  const handleUpgradeNavigation = () => {
    onClose();
    if (onUpgrade) {
        onUpgrade();
    } else {
        router.push('/profile/membership');
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={20} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
        )}
        
        <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="sparkles" size={40} color="#586EEF" />
            </View>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {t('common.aiLimitTitle') || 'Daily Limit Reached'}
          </Text>
          
          <Text style={[styles.description, { color: colors.subtext }]}>
            {message || t('common.aiLimitMessage') || 'You have reached your daily AI limit. Please upgrade your membership for unlimited usage.'}
          </Text>

          <TouchableOpacity 
            style={styles.upgradeBtn}
            onPress={handleUpgradeNavigation}
          >
            <Text style={styles.upgradeBtnText}>
              {t('common.upgradeNow') || 'Upgrade Membership'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.closeBtn}
            onPress={onClose}
          >
            <Text style={[styles.closeBtnText, { color: colors.subtext }]}>
              {t('common.maybeLater') || 'Maybe Later'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: width * 0.85,
    borderRadius: 32,
    padding: 30,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  upgradeBtn: {
    backgroundColor: '#586EEF',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeBtn: {
    paddingVertical: 10,
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
