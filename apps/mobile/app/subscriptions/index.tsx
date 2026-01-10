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

export default function SubscriptionsScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const subtextColor = '#9CA3AF';
    const { token } = useAuth();
    
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchSubscriptions = async () => {
        try {
            const res = await fetch(`${API_URL}/subscriptions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setSubscriptions(data.subscriptions || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchSubscriptions();
        }, [])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchSubscriptions();
        setRefreshing(false);
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            "Cancel Subscription",
            "Are you sure you want to cancel this subscription?",
            [
                { text: "No", style: "cancel" },
                { 
                    text: "Yes", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await fetch(`${API_URL}/subscriptions/${id}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            fetchSubscriptions();
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
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('subscriptions.title')}</Text>
                <TouchableOpacity onPress={() => router.push('/subscriptions/add')} style={styles.addButton}>
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
                    {subscriptions.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="calendar-refresh" size={64} color="#D1D5DB" />
                            <Text style={[styles.emptyText, { color: subtextColor }]}>{t('subscriptions.empty')}</Text>
                        </View>
                    ) : (
                        subscriptions.map((sub: any) => (
                            <View key={sub.id} style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F9FAFB' }]}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.iconBox}>
                                        <Text style={styles.iconText}>{sub.name.charAt(0).toUpperCase()}</Text>
                                    </View>
                                    <View style={styles.cardInfo}>
                                        <Text style={[styles.name, { color: colors.text }]}>{sub.name}</Text>
                                        <Text style={[styles.cycle, { color: subtextColor }]}>{sub.billingCycle} • {new Date(sub.nextPaymentDate).toLocaleDateString()}</Text>
                                    </View>
                                    <Text style={[styles.amount, { color: colors.text }]}>
                                        {sub.currency === 'USD' ? '$' : '€'}{sub.amount}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => handleDelete(sub.id)} style={styles.deleteBtn}>
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
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
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    iconText: {
        color: '#586EEF',
        fontWeight: 'bold',
        fontSize: 18,
    },
    cardInfo: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
    },
    cycle: {
        fontSize: 12,
        marginTop: 2,
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 12,
    },
    deleteBtn: {
        padding: 8,
    },
});
