// @ts-nocheck
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/theme';
import { useAuth } from '../../context/auth';
import { useState } from 'react';
import { API_URL } from '../../constants/Config';
import { Colors } from '../../constants/theme';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddSubscriptionScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const subtextColor = '#9CA3AF';
    const { token } = useAuth();
    
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [cycle, setCycle] = useState('MONTHLY'); // MONTHLY, YEARLY, WEEKLY
    const [startDate, setStartDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!name || !amount) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please fill correctly' });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/subscriptions`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    amount: parseFloat(amount),
                    billingCycle: cycle,
                    startDate: startDate.toISOString(),
                    category: 'Subscription' // Default category
                })
            });
            
            if (res.ok) {
                router.back();
            } else {
                Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to create' });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setStartDate(selectedDate);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1}}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colorScheme === 'dark' ? '#111827' : '#FFFFFF' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>{t('subscriptions.add')}</Text>
                <View style={{ width: 32 }} /> 
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                
                <View style={styles.formGroup}>
                    <Text style={[styles.label, {color: subtextColor}]}>{t('subscriptions.name')}</Text>
                    <TextInput 
                        style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F9FAFB', color: colors.text }]}
                        value={name}
                        onChangeText={setName}
                        placeholder="Netflix, Spotify..."
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, {color: subtextColor}]}>{t('subscriptions.amount')}</Text>
                    <TextInput 
                        style={[styles.input, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F9FAFB', color: colors.text }]}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        placeholder="0.00"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, {color: subtextColor}]}>{t('subscriptions.billingCycle')}</Text>
                    <View style={styles.cycleRow}>
                        {['WEEKLY', 'MONTHLY', 'YEARLY'].map((c) => (
                            <TouchableOpacity 
                                key={c}
                                style={[styles.cycleBadge, cycle === c && styles.cycleActive]}
                                onPress={() => setCycle(c)}
                            >
                                <Text style={[styles.cycleText, cycle === c && styles.cycleTextActive]}>
                                    {t(`subscriptions.${c.toLowerCase()}`)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, {color: subtextColor}]}>{t('subscriptions.startDate')}</Text>
                    <TouchableOpacity 
                        style={[styles.dateInput, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#F9FAFB' }]}
                        onPress={() => setShowDatePicker(true)}
                    >
                         <Text style={{color: colors.text}}>{startDate.toLocaleDateString()}</Text>
                         <Ionicons name="calendar-outline" size={20} color={subtextColor} />
                    </TouchableOpacity>
                </View>
                
                {showDatePicker && (
                    <DateTimePicker
                        value={startDate}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                    />
                )}

                <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
                     {loading ? <ActivityIndicator color="white" /> : <Text style={styles.saveText}>{t('common.save')}</Text>}
                </TouchableOpacity>

            </ScrollView>
        </View>
        </KeyboardAvoidingView>
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
    content: {
        padding: 24,
    },
    formGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    input: {
        padding: 16,
        borderRadius: 16,
        fontSize: 16,
    },
    cycleRow: {
        flexDirection: 'row',
        gap: 12,
    },
    cycleBadge: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
    },
    cycleActive: {
        backgroundColor: '#586EEF',
    },
    cycleText: {
        color: '#6B7280',
        fontWeight: '600',
        fontSize: 14,
    },
    cycleTextActive: {
        color: '#FFFFFF',
    },
    dateInput: {
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    saveButton: {
        backgroundColor: '#586EEF',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    saveText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
