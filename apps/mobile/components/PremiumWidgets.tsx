import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/theme';
import { Colors } from '../constants/theme';

const { width } = Dimensions.get('window');

interface BudgetInfo {
  category: string;
  limit: number;
  spent: number;
  percent: number;
}

interface WeeklyData {
  day: string;
  amount: number;
}

interface PremiumWidgetsProps {
  weeklyChart?: WeeklyData[];
  budgetSummary?: BudgetInfo[];
}

export const PremiumWidgets: React.FC<PremiumWidgetsProps> = ({ weeklyChart = [], budgetSummary = [] }) => {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  const maxAmount = Math.max(...weeklyChart.map(d => d.amount), 1);

  return (
    <View style={styles.container}>
      {/* Weekly Outlook Sparkline Widget */}
      <View style={[styles.widget, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F9FAFB' }]}>
        <View style={styles.widgetHeader}>
          <Text style={[styles.widgetTitle, { color: colors.text }]}>Haftalık Bakış</Text>
          <Ionicons name="bar-chart-outline" size={16} color="#586EEF" />
        </View>
        <View style={styles.chartContainer}>
           {weeklyChart.length > 0 ? weeklyChart.map((item, index) => (
             <View key={index} style={styles.chartBarWrapper}>
                <View style={[
                    styles.chartBar, 
                    { 
                        height: (item.amount / maxAmount) * 60 + 5,
                        backgroundColor: index === weeklyChart.length - 1 ? '#586EEF' : '#94A3B8' 
                    }
                ]} />
                <Text style={styles.chartLabel}>{item.day}</Text>
             </View>
           )) : (
               <Text style={styles.noData}>Henüz veri yok</Text>
           )}
        </View>
      </View>

      {/* Budget Progress Widget */}
      <View style={[styles.widget, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F9FAFB' }]}>
        <View style={styles.widgetHeader}>
          <Text style={[styles.widgetTitle, { color: colors.text }]}>Bütçe Durumu</Text>
          <Ionicons name="pie-chart-outline" size={16} color="#10B981" />
        </View>
        <View style={styles.budgetList}>
          {budgetSummary.length > 0 ? budgetSummary.map((budget, index) => (
            <View key={index} style={styles.budgetItem}>
              <View style={styles.budgetInfo}>
                <Text style={[styles.budgetCategory, { color: colors.text }]}>{budget.category}</Text>
                <Text style={styles.budgetPercent}>%{budget.percent}</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[
                    styles.progressBarFill, 
                    { 
                        width: `${budget.percent}%`,
                        backgroundColor: budget.percent > 90 ? '#EF4444' : (budget.percent > 70 ? '#F59E0B' : '#10B981')
                    }
                ]} />
              </View>
            </View>
          )) : (
            <Text style={styles.noData}>Aktif bütçe bulunamadı</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    marginBottom: 24,
    flexDirection: 'row',
    gap: 12,
  },
  widget: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  widgetTitle: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.8,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
    paddingBottom: 10,
  },
  chartBarWrapper: {
    alignItems: 'center',
    gap: 4,
  },
  chartBar: {
    width: 6,
    borderRadius: 3,
  },
  chartLabel: {
    fontSize: 8,
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  budgetList: {
    gap: 12,
  },
  budgetItem: {
    width: '100%',
  },
  budgetInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  budgetCategory: {
    fontSize: 11,
    fontWeight: '600',
  },
  budgetPercent: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  noData: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 20,
  }
});
