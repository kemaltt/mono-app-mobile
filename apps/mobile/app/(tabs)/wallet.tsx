// @ts-nocheck
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/auth';
import { useRouter, useFocusEffect } from 'expo-router';
import { API_URL } from '../../constants/Config';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/theme';

export default function WalletScreen() {
  const { t, i18n } = useTranslation();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      if (!token) return;

      // Dashboard for balance
      const dashRes = await fetch(`${API_URL}/transactions/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dashData = await dashRes.json();
      setDashboard(dashData);

      // Transactions for list
      const transRes = await fetch(`${API_URL}/transactions?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const transData = await transRes.json();
      setTransactions(transData.transactions || []);

    } catch (error) {
      console.error(error);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === 'dark' ? '#111827' : '#2D4BFF' }]}>
      {/* Blue Header */}
      <View style={[styles.blueHeader, { backgroundColor: colorScheme === 'dark' ? '#111827' : '#2D4BFF' }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('wallet.title')}</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      {/* Main Content (White Section) */}
      <View style={[styles.whiteSection, { backgroundColor: colors.background }]}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2D4BFF']} />}
        >
          {/* Balance Section */}
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>{t('wallet.balance')}</Text>
            <Text style={[styles.balanceAmount, { color: colors.text }]}>
              $ {dashboard ? Number(dashboard.balance).toLocaleString(i18n.language, { minimumFractionDigits: 2 }) : '...'}
            </Text>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <View style={styles.actionItem}>
                <TouchableOpacity 
                   style={[styles.actionButton, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF', borderColor: '#2D4BFF' }]}
                   onPress={() => router.push('/(tabs)/add')}
                >
                  <Ionicons name="add" size={32} color="#2D4BFF" />
                </TouchableOpacity>
                <Text style={styles.actionLabel}>{t('wallet.add')}</Text>
              </View>

              <View style={styles.actionItem}>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF', borderColor: '#2D4BFF' }]}>
                  <Ionicons name="grid" size={26} color="#2D4BFF" />
                </TouchableOpacity>
                <Text style={styles.actionLabel}>{t('wallet.pay')}</Text>
              </View>

              <View style={styles.actionItem}>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF', borderColor: '#2D4BFF' }]}>
                  <Ionicons name="paper-plane" size={26} color="#2D4BFF" />
                </TouchableOpacity>
                <Text style={styles.actionLabel}>{t('wallet.send')}</Text>
              </View>
            </View>
          </View>

          {/* Transactions History */}
          <View style={styles.transactionsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('wallet.history')}</Text>
            
            {transactions.map((item) => (
              <TransactionItem 
                 key={item.id}
                 item={item}
                 lang={i18n.language}
                 onPress={() => router.push(`/transaction/${item.id}`)}
                 colors={colors}
                 colorScheme={colorScheme}
              />
            ))}

            {transactions.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="wallet-outline" size={48} color={colorScheme === 'dark' ? '#4B5563' : '#D1D5DB'} />
                <Text style={[styles.emptyText, { color: colorScheme === 'dark' ? '#9CA3AF' : '#9CA3AF' }]}>{t('wallet.empty')}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function TransactionItem({ item, onPress, lang, colors, colorScheme }) {
  const isIncome = item.type === 'INCOME';
  
  const getIconContainerColor = () => {
    if (colorScheme === 'dark') return '#111827';
    switch(item.category?.toLowerCase()) {
      case 'upwork': return '#E8F5E9';
      case 'paypal': return '#E3F2FD';
      case 'transfer': return '#FFF3E0';
      default: return '#F3F4F6';
    }
  };

  return (
    <TouchableOpacity style={styles.transactionCard} onPress={onPress}>
      <View style={styles.transactionLeft}>
        <View style={[styles.iconBox, { backgroundColor: getIconContainerColor() }]}>
          <Ionicons 
             name={isIncome ? "arrow-down-outline" : "arrow-up-outline"} 
             size={20} 
             color={isIncome ? "#10B981" : "#EF4444"} 
          />
        </View>
        <View style={styles.transactionTextInfo}>
          <Text style={[styles.transactionTitle, { color: colors.text }]} numberOfLines={1}>{item.category || 'Transaction'}</Text>
          {item.description ? (
            <Text style={{ fontSize: 13, color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280', marginBottom: 2 }} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
          <Text style={styles.transactionDate}>
            {new Date(item.date).toLocaleDateString(lang, { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>
      </View>
      <Text style={[styles.transactionAmount, { color: isIncome ? '#10B981' : '#EF4444' }]}>
        {isIncome ? '+ ' : '- '} $ {Number(item.amount).toLocaleString(lang, { minimumFractionDigits: 2 })}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D4BFF',
  },
  blueHeader: {
    height: 140,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  whiteSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -20,
  },
  scrollContent: {
    paddingTop: 40,
    paddingBottom: 120,
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 40,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  actionItem: {
    alignItems: 'center',
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: '#2D4BFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  actionLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  transactionsSection: {
    paddingHorizontal: 25,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 25,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  transactionTextInfo: {
    justifyContent: 'center',
  },
  transactionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  transactionDate: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 17,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  }
});
