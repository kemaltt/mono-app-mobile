// @ts-nocheck
import { View, Text, ScrollView, TouchableOpacity, Platform, RefreshControl, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useEffect, useState, useCallback } from 'react';
import { Image } from 'react-native';
import { useAuth } from '../../context/auth';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/theme';
import { API_URL } from '../../constants/Config';
import Toast from 'react-native-toast-message';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { user, token } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (isRefreshing = false) => {
    try {
        if (!token) return;
        if (!isRefreshing) setLoading(true);

        // Fetch Dashboard
        const dashRes = await fetch(`${API_URL}/transactions/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dashData = await dashRes.json();
        setDashboard(dashData);

        // Fetch Transactions
        const transRes = await fetch(`${API_URL}/transactions?limit=5`, {
             headers: { 'Authorization': `Bearer ${token}` }
        });
        const transData = await transRes.json();
        setTransactions(transData.transactions || []);

    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  }, [fetchData]);

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        {/* <ActivityIndicator size="large" color={colors.primary} /> */}
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }

  const handleDeleteTransaction = async (id: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      const response = await fetch(`${API_URL}/transactions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setTransactions(prev => prev.filter(t => t.id !== id));
        fetchData(); // Refresh summary totals
        Toast.show({
          type: 'success',
          text1: t('common.success'),
          text2: t('common.delete'),
        });
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Fehler',
        text2: 'Vorgang konnte nicht gelöscht werden',
      });
    }
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return t('home.goodMorning');
    if (hours < 18) return t('home.goodAfternoon');
    return t('home.goodEvening');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerLeft} onPress={() => router.push('/profile')}>
            {/* Avatar */}
              <View style={styles.avatar}>
                  {user?.avatarUrl ? (
                    <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
                  ) : (
                      <Text style={styles.avatarText}>👋</Text>
                  )}
              </View>
            <View>
                <Text style={[styles.greeting, { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>{getGreeting()}</Text>
                <Text style={[styles.username, { color: colors.text }]}>{user?.firstName || 'User'}</Text>
            </View>
        </TouchableOpacity>
        <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
                <View>
                    <Text style={styles.balanceLabel}>{t('home.balance')}</Text>
                    <Text style={styles.balanceAmount}>
                        {dashboard ? `$${Number(dashboard.balance).toFixed(2)}` : '...'}
                    </Text>
                </View>
                <TouchableOpacity style={styles.moreButton}>
                    <Ionicons name="ellipsis-horizontal" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <View style={styles.statsContainer}>
                <View>
                    <View style={styles.statRow}>
                        <View style={styles.incomeIcon}>
                           <Ionicons name="arrow-down" size={12} color="white" />
                        </View>
                        <Text style={styles.statLabel}>{t('home.income')}</Text>
                    </View>
                    <Text style={styles.statAmount}>
                         {dashboard ? `$${Number(dashboard.income).toFixed(2)}` : '...'}
                    </Text>
                </View>
                <View>
                    <View style={styles.statRow}>
                         <View style={styles.expenseIcon}>
                           <Ionicons name="arrow-up" size={12} color="white" />
                        </View>
                        <Text style={styles.statLabel}>{t('home.expense')}</Text>
                    </View>
                    <Text style={styles.statAmount}>
                        {dashboard ? `$${Number(dashboard.expense).toFixed(2)}` : '...'}
                    </Text>
                </View>
            </View>
        </View>

        {/* In-App Widget Section (Premium Look) */}
        <View style={styles.widgetRow}>
            <TouchableOpacity style={[styles.miniWidget, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F3F4F6' }]}>
                <Ionicons name="sparkles" size={20} color="#586EEF" />
                <Text style={[styles.miniWidgetText, { color: colors.text }]}>{t('home.seeAll')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.miniWidget, { backgroundColor: '#586EEF' }]} 
                onPress={() => router.push('/add')}
            >
                <Ionicons name="add-circle" size={20} color="white" />
                <Text style={[styles.miniWidgetText, { color: 'white' }]}>{t('add.addExpense')}</Text>
            </TouchableOpacity>
        </View>

        {/* Transactions History Header */}
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.recentTransactions')}</Text>
            <TouchableOpacity onPress={() => router.push('/statistics')}>
                <Text style={styles.seeAllText}>{t('home.seeAll')}</Text>
            </TouchableOpacity>
        </View>

        {/* Transaction Items */}
        <View style={styles.transactionsList}>
            {transactions.map((t) => (
                <Swipeable
                    key={t.id}
                    renderRightActions={(progress, dragX) => (
                        <TouchableOpacity 
                            style={styles.deleteAction} 
                            onPress={() => handleDeleteTransaction(t.id)}
                        >
                            <Ionicons name="trash-outline" size={24} color="white" />
                        </TouchableOpacity>
                    )}
                    friction={2}
                    rightThreshold={40}
                >
                    <TransactionItem 
                        icon={getCategoryIcon(t.category)} 
                        iconColor={getCategoryColor(t.category)}
                        iconBg={colorScheme === 'dark' ? '#1E293B' : '#F3F4F6'}
                        title={t.category} 
                        subtitle={t.description}
                        date={new Date(t.date).toLocaleDateString()} 
                        amount={`${t.type === 'INCOME' ? '+' : '-'}$${Number(t.amount).toFixed(2)}`}
                        isExpense={t.type === 'EXPENSE'}
                        onPress={() => router.push(`/transaction/${t.id}`)}
                        colors={colors}
                    />
                </Swipeable>
            ))}
            
            {transactions.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={48} color={colorScheme === 'dark' ? '#4B5563' : '#D1D5DB'} />
                <Text style={[styles.emptyText, { color: colorScheme === 'dark' ? '#9CA3AF' : '#9CA3AF' }]}>{t('home.noTransactions')}</Text>
              </View>
            )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function TransactionItem({ icon, iconColor, iconBg, title, subtitle, date, amount, isExpense = false, onPress, colors }: any) {
    return (
        <TouchableOpacity style={[styles.transactionItem, { backgroundColor: colors.background === '#fff' ? '#F9FAFB' : '#1E293B', borderWidth: colors.background === '#fff' ? 0 : 1, borderColor: '#334155' }]} onPress={onPress}>
            <View style={styles.transactionLeft}>
                <View style={[styles.transactionIcon, { backgroundColor: iconBg }]}>
                    <Ionicons name={icon} size={24} color={iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.transactionTitle, { color: colors.text }]} numberOfLines={1}>{title}</Text>
                    {subtitle ? (
                      <Text style={[styles.transactionSubtitle, { color: colors.text === '#000000' ? '#6B7280' : '#9CA3AF' }]} numberOfLines={1}>{subtitle}</Text>
                    ) : null}
                    <Text style={styles.transactionDate}>{date}</Text>
                </View>
            </View>
            <Text style={[styles.transactionAmount, isExpense ? styles.amountExpense : styles.amountIncome]}>
                {amount}
            </Text>
        </TouchableOpacity>
    )
}

function getCategoryIcon(category: string) {
  const cat = category?.toLowerCase() || '';
  if (cat.includes('yemek') || cat.includes('food') || cat.includes('restaurant')) return 'restaurant-outline';
  if (cat.includes('netflix') || cat.includes('spotify') || cat.includes('abo')) return 'play-circle-outline';
  if (cat.includes('shopping') || cat.includes('market')) return 'cart-outline';
  if (cat.includes('maaş') || cat.includes('salary') || cat.includes('gelir')) return 'cash-outline';
  if (cat.includes('deneme') || cat.includes('test')) return 'flask-outline';
  return 'receipt-outline';
}

function getCategoryColor(category: string) {
  const cat = category?.toLowerCase() || '';
  if (cat.includes('yemek') || cat.includes('food')) return '#F59E0B';
  if (cat.includes('netflix') || cat.includes('spotify')) return '#EF4444';
  if (cat.includes('maaş') || cat.includes('salary')) return '#10B981';
  return '#586EEF';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    backgroundColor: '#E5E7EB',
    borderRadius: 20,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    fontSize: 20,
  },
  greeting: {
    color: '#6B7280',
    fontSize: 12,
  },
  username: {
    fontWeight: 'bold',
    color: '#1F2937',
    fontSize: 18,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 96,
  },
  balanceCard: {
    backgroundColor: '#586EEF',
    borderRadius: 24,
    padding: 24,
    marginTop: 16,
    marginBottom: 24,
    shadowColor: '#586EEF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  balanceLabel: {
    color: '#DBEAFE',
    marginBottom: 4,
  },
  balanceAmount: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  incomeIcon: {
    width: 24,
    height: 24,
    backgroundColor: 'rgba(96, 165, 250, 0.5)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  expenseIcon: {
    width: 24,
    height: 24,
    backgroundColor: 'rgba(96, 165, 250, 0.5)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  statLabel: {
    color: '#DBEAFE',
    fontSize: 12,
  },
  statAmount: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  seeAllText: {
    color: '#6B7280',
    fontSize: 12,
  },
  transactionsList: {
    gap: 16,
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
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  transactionTitle: {
    fontWeight: 'bold',
    color: '#1F2937',
    fontSize: 16,
  },
  transactionDate: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  transactionSubtitle: {
    fontSize: 13,
    marginBottom: 2,
  },
  transactionAmount: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  amountExpense: {
    color: '#EF4444',
  },
  amountIncome: {
    color: '#22C55E',
  },
  deleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: '85%',
    alignSelf: 'center',
    borderRadius: 16,
    marginHeight: 10,
  },
  widgetRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
  },
  miniWidget: {
      flex: 1,
      height: 60,
      borderRadius: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 12,
  },
  miniWidgetText: {
      fontWeight: '700',
      fontSize: 13,
  }
});
