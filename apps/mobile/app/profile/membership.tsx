
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/auth';
import { API_URL } from '../../constants/Config';
import Toast from 'react-native-toast-message';

export default function MembershipScreen() {
  const { t } = useTranslation();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { user, token, refreshUser } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const plans = [
    {
      id: 'TRIAL',
      name: t('profile.trial'),
      price: '$0',
      period: t('profile.forever'),
      features: [
        `10 ${t('profile.scansPerDay')}`,
        t('profile.basicStats'),
        t('profile.standardSupport')
      ],
      color: '#64748B',
      isCurrent: user?.licenseTier === 'TRIAL'
    },
    {
      id: 'PRO',
      name: t('profile.pro'),
      price: '$9.99',
      period: `/ ${t('profile.month')}`,
      features: [
        `100 ${t('profile.scansPerDay')}`,
        t('profile.advancedInsights'),
        t('profile.customCategories'),
        t('profile.prioritySupport')
      ],
      color: '#586EEF',
      isCurrent: user?.licenseTier === 'PRO'
    },
    {
      id: 'ULTIMATE',
      name: t('profile.ultimate'),
      price: '$24.99',
      period: `/ ${t('profile.month')}`,
      features: [
        t('profile.unlimitedScans'),
        t('profile.fullReports'),
        t('profile.familySharing'),
        t('profile.personalAdvisor')
      ],
      color: '#10B981',
      isCurrent: user?.licenseTier === 'ULTIMATE'
    }
  ];

  const handleUpgrade = async (tier: string) => {
    if (user?.licenseTier === tier) return;
    
    setLoading(tier);
    try {
      const response = await fetch(`${API_URL}/membership/upgrade`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tier })
      });

      const data = await response.json();
      if (response.ok) {
        await refreshUser();
        Toast.show({
          type: 'success',
          text1: t('common.success'),
          text2: data.message
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || 'Upgrade failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ 
        headerTitle: t('profile.membership'),
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 5 }}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
        ),
      }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>{t('profile.choosePlan')}</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>{t('profile.choosePlanSubtitle')}</Text>

        {plans.map((plan) => (
          <View 
            key={plan.id} 
            style={[
                styles.planCard, 
                { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF', borderColor: plan.isCurrent ? plan.color : (colorScheme === 'dark' ? '#334155' : '#F1F5F9') }
            ]}
          >
            {plan.isCurrent && (
                <View style={[styles.currentBadge, { backgroundColor: plan.color }]}>
                    <Text style={styles.currentBadgeText}>{t('profile.currentPlan')}</Text>
                </View>
            )}
            
            <View style={styles.planHeader}>
              <View>
                <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
                <View style={styles.priceContainer}>
                  <Text style={[styles.planPrice, { color: colors.text }]}>{plan.price}</Text>
                  <Text style={[styles.planPeriod, { color: colors.subtext }]}>{plan.period}</Text>
                </View>
              </View>
              <View style={[styles.planIcon, { backgroundColor: `${plan.color}15` }]}>
                <Ionicons name={plan.id === 'ULTIMATE' ? 'shield-checkmark' : (plan.id === 'PRO' ? 'rocket' : 'leaf')} size={24} color={plan.color} />
              </View>
            </View>

            <View style={styles.featuresList}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={18} color={plan.color} />
                  <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
                </View>
              ))}
            </View>

            {!plan.isCurrent && (
              <TouchableOpacity 
                style={[styles.upgradeBtn, { backgroundColor: plan.color }]}
                onPress={() => handleUpgrade(plan.id)}
                disabled={!!loading}
              >
                {loading === plan.id ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.upgradeBtnText}>{t('auth.upgradeNow')}</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 30,
  },
  planCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  currentBadge: {
    position: 'absolute',
    top: -12,
    right: 24,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  currentBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '800',
  },
  planPeriod: {
    fontSize: 16,
    marginLeft: 4,
  },
  planIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuresList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    marginLeft: 10,
  },
  upgradeBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  upgradeBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
