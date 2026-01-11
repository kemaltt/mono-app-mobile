import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/theme';
import { API_URL } from '../../constants/Config';
import Toast from 'react-native-toast-message';

export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { token } = useAuth();

  const [settings, setSettings] = useState({
    budget: true,
    security: true,
    weekly: true,
    gamification: true,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/profile/notification-settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setSettings(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSetting = async (key: string, value: boolean) => {
    setUpdating(key);
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      const response = await fetch(`${API_URL}/profile/notification-settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ [key]: value })
      });

      if (!response.ok) {
        throw new Error('Update failed');
      }
      
      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('profile.settingsUpdated'),
        position: 'bottom'
      });
    } catch (error) {
        // Revert 
        setSettings(settings);
        Toast.show({
            type: 'error',
            text1: t('common.error'),
            text2: 'Failed to update setting'
        });
    } finally {
        setUpdating(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#586EEF" />
      </View>
    );
  }

  const sections = [
    {
      title: 'Harcama Uyarıları',
      items: [
        {
          id: 'budget',
          title: 'Bütçe Sınırı Uyarıları',
          desc: 'Bütçenin %80 ve %100 limitine ulaştığında bildirim al.',
          icon: 'pie-chart-outline',
          color: '#586EEF'
        },
        {
          id: 'security',
          title: 'Güvenlik & Yüksek Harcama',
          desc: 'Beklenmedik büyük harcamalarda seni uyaralım.',
          icon: 'shield-checkmark-outline',
          color: '#10B981'
        }
      ]
    },
    {
      title: 'Finansal Analiz',
      items: [
        {
          id: 'weekly',
          title: 'Haftalık Özet Raporu',
          desc: 'Haftalık harcama alışkanlıklarını içeren özetler.',
          icon: 'trending-up-outline',
          color: '#F59E0B'
        }
      ]
    },
    {
      title: 'İlerleme & Ödüller',
      items: [
        {
          id: 'gamification',
          title: 'Seviye & Başarımlar',
          desc: 'Seviye atladığında veya yeni bir rozet kazandığında haberin olsun.',
          icon: 'trophy-outline',
          color: '#8B5CF6'
        }
      ]
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ 
        headerTitle: 'Bildirim Ayarları',
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerStyle: { backgroundColor: colors.background },
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
        ),
        headerShadowVisible: false,
      }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.headerDesc, { color: colorScheme === 'dark' ? '#94A3B8' : '#64748B' }]}>
            Sana en uygun bildirimleri seçerek finansal sağlığını kontrol altında tut.
        </Text>

        {sections.map((section, sIdx) => (
          <View key={sIdx} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
            <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F9FAFB' }]}>
              {section.items.map((item, iIdx) => (
                <View key={item.id} style={[
                    styles.itemRow, 
                    iIdx !== section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB' }
                ]}>
                  <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                    <Ionicons name={item.icon as any} size={22} color={item.color} />
                  </View>
                  <View style={styles.itemContent}>
                    <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={styles.itemDesc}>{item.desc}</Text>
                  </View>
                  <Switch
                    value={settings[item.id as keyof typeof settings]}
                    onValueChange={(val) => toggleSetting(item.id, val)}
                    trackColor={{ false: '#CBD5E1', true: '#586EEF' }}
                    thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : (settings[item.id as keyof typeof settings] ? '#FFFFFF' : '#F1F5F9')}
                    disabled={updating === item.id}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#64748B" />
            <Text style={styles.infoText}>
                Kritik sistem güncellemeleri ve güvenlik bildirimleri kapatılamaz.
            </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    marginLeft: -5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerDesc: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
    opacity: 0.6,
  },
  card: {
    borderRadius: 24,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100, 116, 139, 0.05)',
    padding: 16,
    borderRadius: 16,
    gap: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  }
});
