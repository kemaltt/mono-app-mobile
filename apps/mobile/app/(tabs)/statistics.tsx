// @ts-nocheck
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../context/auth';
import { useFocusEffect, useRouter } from 'expo-router';
import { LineChart, BarChart } from "react-native-gifted-charts";
import { API_URL } from '../../constants/Config';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function StatisticsScreen() {
  const { t, i18n } = useTranslation();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { token } = useAuth();
  
  const timeRanges = [
    { label: t('statistics.day'), value: 'Day' },
    { label: t('statistics.week'), value: 'Week' },
    { label: t('statistics.month'), value: 'Month' },
    { label: t('statistics.year'), value: 'Year' }
  ];

  const [selectedRange, setSelectedRange] = useState('Month');
  const [selectedType, setSelectedType] = useState('Expense');
  const [chartType, setChartType] = useState('line'); // 'line' or 'bar'
  const [transactions, setTransactions] = useState([]);
  const [statsData, setStatsData] = useState([]);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      if (!token) return;
      const transRes = await fetch(`${API_URL}/transactions?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const transData = await transRes.json();
      setTransactions(transData.transactions || []);

      const statsRes = await fetch(`${API_URL}/transactions/stats?type=${selectedType.toUpperCase()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsResult = await statsRes.json();
      
      if (statsResult.chartData) {
        const formattedData = statsResult.chartData.map((item) => ({
          value: Number(item.value) || 0,
          label: item.label,
        }));
        setStatsData(formattedData);
      }
    } catch (error) {
      console.error(error);
    }
  }, [token, selectedType]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('statistics.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Time Range Selector */}
        <View style={[styles.rangeSelector, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F9FAFB' }]}>
          {timeRanges.map((range) => (
            <TouchableOpacity 
              key={range.value}
              onPress={() => setSelectedRange(range.value)}
              style={[styles.rangeButton, selectedRange === range.value && styles.rangeButtonActive]}
            >
              <Text style={[styles.rangeText, selectedRange === range.value ? styles.rangeTextActive : { color: colorScheme === 'dark' ? '#9CA3AF' : '#6B7280' }]}>
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Type and Chart Selector */}
        <View style={styles.typeSelectorRow}>
          <View style={[styles.chartToggle, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F3F4F6' }]}>
            <TouchableOpacity 
              onPress={() => setChartType('line')}
              style={[styles.toggleBtn, chartType === 'line' && styles.toggleBtnActive]}
            >
              <Ionicons name="trending-up" size={20} color={chartType === 'line' ? 'white' : (colorScheme === 'dark' ? '#9CA3AF' : '#6B7280')} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setChartType('bar')}
              style={[styles.toggleBtn, chartType === 'bar' && styles.toggleBtnActive]}
            >
              <Ionicons name="bar-chart" size={20} color={chartType === 'bar' ? 'white' : (colorScheme === 'dark' ? '#9CA3AF' : '#6B7280')} />
            </TouchableOpacity>
          </View>

          <View style={styles.typeSelectorContainer}>
            <TouchableOpacity 
              style={[styles.dropdownButton, { borderColor: colorScheme === 'dark' ? '#334155' : '#E5E7EB' }]}
              onPress={() => setShowTypeDropdown(!showTypeDropdown)}
            >
              <Text style={[styles.dropdownText, { color: colors.text }]}>{t(`home.${selectedType.toLowerCase()}`)}</Text>
              <Ionicons name={showTypeDropdown ? "chevron-up" : "chevron-down"} size={20} color={colors.text} />
            </TouchableOpacity>
            {showTypeDropdown && (
              <View style={[styles.dropdownMenu, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : 'white', borderColor: colorScheme === 'dark' ? '#475569' : '#E5E7EB' }]}>
                <TouchableOpacity onPress={() => { setSelectedType('Income'); setShowTypeDropdown(false); }} style={styles.dropdownOption}>
                  <Text style={[styles.optionText, { color: colors.text }]}>{t('home.income')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setSelectedType('Expense'); setShowTypeDropdown(false); }} style={styles.dropdownOption}>
                  <Text style={[styles.optionText, { color: colors.text }]}>{t('home.expense')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Dynamic Chart Display */}
        <View style={styles.chartWrapper}>
          {statsData.length > 0 ? (
            chartType === 'line' ? (
              <LineChart
                data={statsData}
                curved
                areaChart
                hideDataPoints={false}
                dataPointsColor="#586EEF"
                dataPointsRadius={4}
                isAnimated
                animationDuration={1200}
                startFillColor="#586EEF"
                startOpacity={0.2}
                endFillColor={colorScheme === 'dark' ? '#111827' : '#FFFFFF'}
                endOpacity={0.01}
                color="#586EEF"
                thickness={3}
                noOfSections={3}
                yAxisThickness={0}
                xAxisThickness={0}
                hideRules
                hideYAxisText
                xAxisLabelTextStyle={{
                    color: colorScheme === 'dark' ? '#9CA3AF' : '#9CA3AF', 
                    fontSize: 12, 
                    fontWeight: '500', 
                    textAlign: 'center'
                }}
                height={180}
                width={width - 40}
                spacing={(width - 80) / (statsData.length - 1)}
                initialSpacing={20}
                endSpacing={20}
                pointerConfig={{
                  pointerStripHeight: 160,
                  pointerStripColor: '#586EEF',
                  pointerStripWidth: 2,
                  pointerStripUptoDataPoint: true,
                  pointerStripDashArray: [5, 5],
                  pointerColor: '#586EEF',
                  radius: 6,
                  pointerLabelComponent: items => {
                    return (
                      <View style={styles.pointerLabel}>
                        <Text style={styles.pointerText}>
                          $ {items[0].value.toFixed(0)}
                        </Text>
                      </View>
                    );
                  },
                }}
              />
            ) : (
              <BarChart
                data={statsData.map((d, i) => ({
                  ...d, 
                  frontColor: i === statsData.length - 1 ? '#586EEF' : (colorScheme === 'dark' ? '#334155' : '#E0E7FF'),
                  labelTextStyle: { 
                    color: i === statsData.length - 1 ? '#586EEF' : '#9CA3AF',
                    fontWeight: i === statsData.length - 1 ? '700' : '400'
                  }
                }))}
                barWidth={32}
                barBorderRadius={10}
                noOfSections={3}
                yAxisThickness={0}
                xAxisThickness={0}
                hideRules
                hideYAxisText
                height={180}
                width={width - 60}
                spacing={25}
                initialSpacing={20}
                isAnimated
                animationDuration={800}
              />
            )
          ) : (
            <View style={styles.loadingChart}><ActivityIndicator color="#4361EE" /></View>
          )}
        </View>

        {/* Top Transactions Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {selectedType === 'Income' ? t('statistics.topIncome') : t('statistics.topSpending')}
          </Text>
          <TouchableOpacity>
            <Ionicons name="swap-vertical" size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          </TouchableOpacity>
        </View>

        <View style={styles.spendingList}>
          {transactions.filter(t => t.type === selectedType.toUpperCase()).slice(0, 5).map((t) => {
            const isSelected = selectedTransactionId === t.id;
            return (
              <TouchableOpacity 
                key={t.id} 
                style={[
                  styles.spendingItem,
                  isSelected ? styles.spendingItemActive : { 
                    backgroundColor: colorScheme === 'dark' ? '#1E293B' : (selectedType === 'Income' ? '#F0FDF4' : '#FEF2F2'),
                    borderColor: colorScheme === 'dark' ? '#334155' : (selectedType === 'Income' ? '#DCFCE7' : '#FEE2E2')
                  }
                ]}
                onPress={() => setSelectedTransactionId(isSelected ? null : t.id)}
              >
                <View style={styles.itemLeft}>
                  <View style={[
                    styles.itemIcon, 
                    { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : (colorScheme === 'dark' ? '#111827' : 'rgba(255,255,255,0.6)') }
                  ]}>
                    <Ionicons 
                       name={t.type === 'INCOME' ? "cash-outline" : "cart-outline"} 
                       size={24} 
                       color={isSelected ? "white" : (colorScheme === 'dark' ? '#CBD5E1' : '#1F2937')} 
                    />
                  </View>
                  <View>
                    <Text style={[styles.itemTitle, isSelected ? styles.textWhite : { color: colors.text }]}>{t.category}</Text>
                    <Text style={[styles.itemDate, isSelected && styles.textLight]}>
                      {new Date(t.date).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
                <Text style={[
                  styles.itemAmount, 
                  isSelected ? styles.textWhite : (t.type === 'INCOME' ? styles.textGreen : styles.textRed)
                ]}>
                  {t.type === 'INCOME' ? '+' : '-'} $ {Number(t.amount).toFixed(2)}
                </Text>
              </TouchableOpacity>
            );
          })}
          
          {transactions.filter(t => t.type === selectedType.toUpperCase()).length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="pie-chart-outline" size={48} color={colorScheme === 'dark' ? '#4B5563' : '#D1D5DB'} />
              <Text style={[styles.emptyText, { color: colorScheme === 'dark' ? '#9CA3AF' : '#9CA3AF' }]}>{t('statistics.noTransactions')}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  rangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginTop: 10,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  rangeButtonActive: {
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  rangeText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  rangeTextActive: {
    color: 'white',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 25,
    zIndex: 100,
  },
  chartToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  toggleBtn: {
    width: 40,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  typeSelectorContainer: {
    alignItems: 'flex-end',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 8,
    width: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  dropdownOption: {
    padding: 10,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  chartWrapper: {
    marginTop: 30,
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 240,
  },
  pointerLabel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#E0E7FF',
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointerText: {
    color: '#586EEF',
    fontSize: 12,
    fontWeight: '800',
  },
  loadingChart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  spendingList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  spendingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  spendingItemActive: {
    backgroundColor: '#586EEF',
    borderColor: '#586EEF',
    shadowColor: '#586EEF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  itemIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  itemDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  textWhite: {
    color: 'white',
  },
  textLight: {
    color: '#E0E7FF',
  },
  textRed: {
    color: '#EF4444',
  },
  textGreen: {
    color: '#10B981',
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
