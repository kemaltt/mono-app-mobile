// @ts-nocheck
import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function TabLayout() {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const TAB_BAR_HEIGHT = 60; // Slightly slimmer
  const TAB_BAR_WIDTH = width * 0.9; // 90% width
  const TAB_BAR_LEFT = (width - TAB_BAR_WIDTH) / 2; // Center it

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1E293B' : '#FFFFFF',
          height: Platform.OS === 'ios' ? 88 : 70,
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: colorScheme === 'dark' ? 0.2 : 0.05,
          shadowRadius: 15,
          paddingHorizontal: 15,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#586EEF',
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#4B5563' : '#D1D5DB',
        tabBarItemStyle: {
          height: 60,
          justifyContent: 'center',
          alignItems: 'center',
        }
      }}>
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "bar-chart" : "bar-chart-outline"} size={26} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          tabBarIcon: () => (
            <View style={styles.addButtonContainer}>
              <Ionicons name="add" size={30} color="#FFFFFF" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "wallet" : "wallet-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} /> 
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addButtonContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#586EEF',
    justifyContent: 'center',
    alignItems: 'center',
    // No margins or offsets to ensure perfect centering
    shadowColor: '#586EEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
