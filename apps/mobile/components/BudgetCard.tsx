// @ts-nocheck
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/theme';
import { useTheme } from '../context/theme';
import { useTranslation } from 'react-i18next';

interface BudgetProps {
    name: string;
    amount: number;
    spent: number;
    category: string;
    currency?: string;
}

export default function BudgetCard({ name, amount, spent, category, currency = '$' }: BudgetProps) {
    const { t } = useTranslation();
    const { colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    
    // Calculate progress
    const progress = Math.min((spent / amount) * 100, 100);
    const isExceeded = spent > amount;
    const remaining = amount - spent;

    // Determine color based on category or default
    const getCategoryColor = (cat: string) => {
        // Simple mapping based on hash or fixed
        return '#586EEF';
    }

    return (
        <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF' }]}>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: colorScheme === 'dark' ? '#334155' : '#EEF2FF' }]}>
                    <Ionicons name="pricetag-outline" size={20} color={getCategoryColor(category)} />
                </View>
                <View style={styles.titleContainer}>
                    <Text style={[styles.title, { color: colors.text }]}>{name}</Text>
                    <Text style={styles.subtitle}>{category}</Text>
                </View>
                <Text style={[styles.amount, { color: colors.text }]}>
                    {currency}{Number(amount).toLocaleString()}
                </Text>
            </View>

            <View style={[styles.progressContainer, { backgroundColor: colorScheme === 'dark' ? '#334155' : '#F3F4F6' }]}>
                <View 
                    style={[
                        styles.progressBarFill, 
                        { 
                            width: `${progress}%`, 
                            backgroundColor: isExceeded ? '#EF4444' : '#10B981' 
                        }
                    ]} 
                />
            </View>

            <View style={styles.footer}>
                <Text style={styles.spentText}>
                    {t('wallet.spent')}: <Text style={{color: isExceeded ? '#EF4444' : colors.text}}>{currency}{Number(spent).toLocaleString()}</Text>
                </Text>
                <Text style={styles.remainingText}>
                    {t('wallet.left')}: <Text style={{color: remaining < 0 ? '#EF4444' : '#10B981'}}>{currency}{Number(Math.max(0, remaining)).toLocaleString()}</Text>
                </Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
    },
    subtitle: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    amount: {
        fontSize: 16,
        fontWeight: '700',
    },
    progressContainer: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    spentText: {
        fontSize: 13,
        color: '#6B7280',
    },
    remainingText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    }
});
