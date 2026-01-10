// @ts-nocheck
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/theme';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/auth';
import { API_URL } from '../../constants/Config';

export default function AchievementsScreen() {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const { token } = useAuth();
    
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAchievements = async () => {
        try {
            const res = await fetch(`${API_URL}/profile/achievements`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setAchievements(data.achievements);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAchievements();
    }, []);

    const renderAchievement = ({ item }: { item: any }) => (
        <View style={[
            styles.card, 
            { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F9FAFB' },
            !item.isUnlocked && { opacity: 0.6 }
        ]}>
            <View style={[styles.iconBox, { backgroundColor: item.isUnlocked ? '#EEF2FF' : '#E5E7EB' }]}>
                <MaterialCommunityIcons 
                    name={item.icon || 'trophy'} 
                    size={32} 
                    color={item.isUnlocked ? '#586EEF' : '#9CA3AF'} 
                />
                {!item.isUnlocked && (
                    <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={14} color="white" />
                    </View>
                )}
            </View>
            <View style={styles.info}>
                <Text style={[styles.name, { color: colors.text }]}>
                    {t(`achievements.badge_${item.key}`)}
                </Text>
                <Text style={[styles.desc, { color: colors.subtext }]}>
                    {t(`achievements.desc_${item.key}`)}
                </Text>
                {item.isUnlocked && (
                    <Text style={styles.unlockedText}>
                        {t('achievements.unlockedAt')}: {new Date(item.unlockedAt).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                )}
            </View>
            <View style={styles.xpReward}>
                <Text style={styles.xpValue}>+{item.xpReward}</Text>
                <Text style={styles.xpText}>{t('achievements.xp')}</Text>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ 
                headerShown: true, 
                headerTitle: t('achievements.title'),
                headerTitleStyle: { fontWeight: '700', color: colors.text },
                headerStyle: { backgroundColor: colors.background },
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                ),
            }} />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#586EEF" />
                </View>
            ) : (
                <FlatList
                    data={achievements}
                    renderItem={renderAchievement}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 20,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
        position: 'relative',
    },
    lockOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#9CA3AF',
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    info: {
        flex: 1,
        gap: 2,
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
    },
    desc: {
        fontSize: 12,
    },
    unlockedText: {
        fontSize: 10,
        color: '#10B981',
        fontWeight: '600',
        marginTop: 4,
    },
    xpReward: {
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 50,
    },
    xpValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#586EEF',
    },
    xpText: {
        fontSize: 10,
        color: '#6B7280',
        fontWeight: '600',
    }
});
