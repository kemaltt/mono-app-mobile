// @ts-nocheck
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/auth';
import { useRouter, useFocusEffect } from 'expo-router';
import { API_URL } from '../../constants/Config';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/theme';
import BudgetCard from '../../components/BudgetCard';
import Toast from 'react-native-toast-message';

export default function WalletScreen() {
  const { t, i18n } = useTranslation();
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [creating, setCreating] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      if (!token) return;

      // Dashboard for balance
      const dashRes = await fetch(`${API_URL}/transactions/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dashData = await dashRes.json();
      setDashboard(dashData);

      setDashboard(dashData);
 
      // Budgets list
      const budgetRes = await fetch(`${API_URL}/budgets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const budgetData = await budgetRes.json();
      setBudgets(budgetData.budgets || []);

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

  const handleCreate = async () => {
      if (!newName || !newAmount || !newCategory) {
          Toast.show({type: 'error', text1: t('common.error'), text2: t('auth.fillAll')});
          return;
      }
      setCreating(true);
      try {
          const res = await fetch(`${API_URL}/budgets`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: newName,
                amount: parseFloat(newAmount),
                category: newCategory
            })
          });
          const data = await res.json();
          if (res.ok) {
              setModalVisible(false);
              setNewName(''); setNewAmount(''); setNewCategory('');
              fetchData();
              setSuccessVisible(true);
              setTimeout(() => setSuccessVisible(false), 2000); // Auto hide
              // Toast.show({type: 'success', text1: 'Success', text2: 'Budget created'});
          } else {
              Toast.show({type: 'error', text1: 'Error', text2: data.error || 'Failed'});
          }
      } catch (e) {
          console.error(e);
      } finally {
          setCreating(false);
      }
  };

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
          {/* Subscriptions Section */}
          <View style={{ paddingHorizontal: 25, marginBottom: 20 }}>
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>{t('subscriptions.title')}</Text>
             </View>
             <TouchableOpacity 
                style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: 16, 
                    backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#EEF2FF', 
                    borderRadius: 16 
                }}
                onPress={() => router.push('/subscriptions')}
             >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#586EEF', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Ionicons name="repeat" size={20} color="white" />
                    </View>
                    <View>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{t('subscriptions.manage')}</Text>
                        <Text style={{ fontSize: 12, color: colors.subtext }}>Netflix, Spotify...</Text>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
             </TouchableOpacity>
          </View>

          {/* Budget List Header */}
          <View style={styles.listHeader}>
             <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('wallet.history')}</Text>
             <TouchableOpacity style={styles.smallAddButton} onPress={() => setModalVisible(true)}>
                 <Ionicons name="add" size={24} color="white" />
             </TouchableOpacity>
          </View>

          <View style={styles.budgetsList}>
             {budgets.map((budget: any) => (
                 <BudgetCard 
                    key={budget.id}
                    name={budget.name}
                    amount={Number(budget.amount)}
                    spent={Number(budget.spent)}
                    category={budget.category}
                    currency={dashboard?.currency === 'EUR' ? '€' : '$'}
                 />
             ))}
                 
             {budgets.length === 0 && (
                <View style={styles.emptyContainer}>
                    <Ionicons name="pie-chart-outline" size={48} color={colorScheme === 'dark' ? '#4B5563' : '#D1D5DB'} />
                    <Text style={[styles.emptyText, { color: colorScheme === 'dark' ? '#9CA3AF' : '#9CA3AF' }]}>{t('wallet.empty')}</Text>
                    <TouchableOpacity style={styles.createButton} onPress={() => setModalVisible(true)}>
                        <Text style={styles.createButtonText}>{t('wallet.createNew')}</Text>
                    </TouchableOpacity>
                </View>
             )}
          </View>
        </ScrollView>

        {/* Create Modal */}
        <Modal
            visible={modalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setModalVisible(false)}
        >
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{t('wallet.createNew')}</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>{t('wallet.budgetName')}</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#334155' : '#F3F4F6', color: colors.text }]}
                            placeholder={t('wallet.namePlaceholder')}
                            placeholderTextColor="#9CA3AF"
                            value={newName}
                            onChangeText={setNewName}
                        />
                    </View>
                    
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>{t('wallet.budgetAmount')}</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#334155' : '#F3F4F6', color: colors.text }]}
                            placeholder={t('wallet.amountPlaceholder')}
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            value={newAmount}
                            onChangeText={setNewAmount}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                         <Text style={styles.inputLabel}>{t('wallet.budgetCategory')}</Text>
                         <TextInput 
                            style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#334155' : '#F3F4F6', color: colors.text }]}
                            placeholder={t('wallet.categoryPlaceholder')}
                            placeholderTextColor="#9CA3AF"
                            value={newCategory}
                            onChangeText={setNewCategory}
                        />
                    </View>

                    <TouchableOpacity 
                        style={[styles.modalButton, creating && { opacity: 0.7 }]} 
                        onPress={handleCreate}
                        disabled={creating}
                    >
                        {creating ? <ActivityIndicator color="white" /> : <Text style={styles.modalButtonText}>{t('wallet.create')}</Text>}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>

        {/* Success Modal */}
        <Modal
            visible={successVisible}
            transparent
            animationType="fade"
        >
            <View style={styles.successOverlay}>
                <View style={[styles.successContent, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
                    <LottieView
                        source={require('../../assets/lottie/success.json')}
                        autoPlay
                        loop={false}
                        style={{ width: 100, height: 100 }}
                    />
                    <Text style={[styles.successText, { color: colors.text }]}>{t('wallet.successCreated')}</Text>
                </View>
            </View>
        </Modal>


      </View>
    </View>
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
  listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 25,
      paddingTop: 30,
      marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  smallAddButton: {
      backgroundColor: '#2D4BFF',
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#2D4BFF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
  },
  budgetsList: {
      paddingHorizontal: 25,
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
    marginBottom: 10,
  },
  createButton: {
      backgroundColor: '#EEF2FF',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
  },
  createButtonText: {
      color: '#586EEF',
      fontWeight: '600',
  },
  // Modal
  modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      padding: 25,
      paddingBottom: 40,
  },
  modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 25,
  },
  modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
  },
  inputContainer: {
      marginBottom: 15,
  },
  inputLabel: {
      fontSize: 14,
      color: '#6B7280',
      marginBottom: 8,
      fontWeight: '500',
  },
  input: {
      backgroundColor: '#F9FAFB',
      padding: 15,
      borderRadius: 12,
      fontSize: 16,
  },
  modalButton: {
      backgroundColor: '#2D4BFF',
      padding: 18,
      borderRadius: 16,
      alignItems: 'center',
      marginTop: 10,
  },
  modalButtonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 16,
  },
   successOverlay: {
       flex: 1,
       justifyContent: 'center',
       alignItems: 'center',
       backgroundColor: 'rgba(0,0,0,0.3)',
   },
   successContent: {
       padding: 24,
       borderRadius: 24,
       alignItems: 'center',
       justifyContent: 'center',
       width: 180,
       height: 180,
       shadowColor: "#000",
       shadowOffset: { width: 0, height: 10 },
       shadowOpacity: 0.1,
       shadowRadius: 20,
       elevation: 5,
   },
   successText: {
       fontSize: 15,
       fontWeight: '600',
       marginTop: 5,
       textAlign: 'center',
   },
   scrollContent: {
       paddingBottom: 40,
   },
});
