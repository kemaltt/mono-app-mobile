// @ts-nocheck
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/theme';
import { useAuth } from '../../context/auth';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { API_URL } from '../../constants/Config';
import { Colors } from '../../constants/theme';

export default function DebtsScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const { token } = useAuth();
    
    const [debts, setDebts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDebts = async () => {
        try {
            const res = await fetch(`${API_URL}/debts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setDebts(data.debts || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchDebts();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchDebts();
        setRefreshing(false);
    };

    const handleToggleResolve = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`${API_URL}/debts/${id}/resolve`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isResolved: !currentStatus })
            });
            if (res.ok) {
                fetchDebts();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            "Delete Entry",
            "Are you sure you want to delete this entry?",
            [
                { text: "No", style: "cancel" },
                { 
                    text: "Yes", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await fetch(`${API_URL}/debts/${id}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            fetchDebts();
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colorScheme === 'dark' ? '#111827' : '#FFFFFF' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('debts.title')}</Text>
                <TouchableOpacity onPress={() => router.push('/debts/add')} style={styles.addButton}>
                    <Ionicons name="add" size={24} color="#586EEF" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#586EEF" />
                </View>
            ) : (
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    {debts.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="handshake-outline" size={64} color="#D1D5DB" />
                            <Text style={[styles.emptyText, { color: colors.subtext }]}>{t('debts.empty')}</Text>
                        </View>
                    ) : (
                        debts.map((debt: any) => (
                            <View key={debt.id} style={[styles.card, debt.isResolved && { opacity: 0.6 }, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F9FAFB' }]}>
                                <View style={styles.cardHeader}>
                                    <View style={[styles.iconBox, { backgroundColor: debt.type === 'LENT' ? '#DCFCE7' : '#FEE2E2' }]}>
                                        <Ionicons 
                                            name={debt.type === 'LENT' ? "arrow-up" : "arrow-down"} 
                                            size={20} 
                                            color={debt.type === 'LENT' ? "#16A34A" : "#DC2626"} 
                                        />
                                    </View>
                                    <View style={styles.cardInfo}>
                                        <Text style={[styles.name, { color: colors.text }]}>{debt.personName}</Text>
                                        <Text style={[styles.typeText, { color: colors.subtext }]}>
                                            {t(`debts.${debt.type.toLowerCase()}`)} 
                                            {debt.dueDate ? ` • ${new Date(debt.dueDate).toLocaleDateString()}` : ''}
                                        </Text>
                                    </View>
                                    <View style={styles.amountContainer}>
                                        <Text style={[styles.amount, { color: debt.type === 'LENT' ? "#16A34A" : "#DC2626" }]}>
                                            {debt.amount}
                                        </Text>
                                        <TouchableOpacity 
                                            style={[styles.statusBadge, { backgroundColor: debt.isResolved ? '#DCFCE7' : '#FEF3C7' }]}
                                            onPress={() => handleToggleResolve(debt.id, debt.isResolved)}
                                        >
                                            <Text style={[styles.statusText, { color: debt.isResolved ? '#16A34A' : '#D97706' }]}>
                                                {debt.isResolved ? t('debts.resolved') : t('debts.active')}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => handleDelete(debt.id)} style={styles.deleteBtn}>
                                    <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButton: {
        padding: 4,
    },
    addButton: {
        padding: 4,
    },
    scrollContent: {
        padding: 20,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
    },
    card: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    cardInfo: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
    },
    typeText: {
        fontSize: 12,
        marginTop: 2,
    },
    amountContainer: {
        alignItems: 'flex-end',
        marginRight: 12,
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    deleteBtn: {
        padding: 8,
    },
});
