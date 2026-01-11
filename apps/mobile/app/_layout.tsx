// @ts-nocheck
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../i18n/index';
import React, { useEffect, useMemo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../context/auth';
import { ThemeProvider, useTheme } from '../context/theme';
import { DefaultTheme, DarkTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { GamificationProvider } from '../context/gamification';

SplashScreen.preventAutoHideAsync();

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#4ADE80', backgroundColor: '#4ADE80', height: 'auto', paddingVertical: 10 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF'
      }}
      text2Style={{
        fontSize: 14,
        color: '#F0FFF4'
      }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#F87171', backgroundColor: '#F87171', height: 'auto', paddingVertical: 10 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF'
      }}
      text2Style={{
        fontSize: 14,
        color: '#FEF2F2'
      }}
    />
  ),
};



export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <RootLayoutContent />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, savePushTokenToServer } from '../utils/notifications';
import { API_URL } from '../constants/Config';

function RootLayoutContent() {
  const { colorScheme } = useTheme();
  const { isLoading, user, token, refreshUser } = useAuth();
  const lastRegisteredToken = React.useRef<string | null>(null);

  useEffect(() => {
    if (user && token) {
      const registerPush = async () => {
        try {
          const pushToken = await registerForPushNotificationsAsync();
          if (pushToken && pushToken !== lastRegisteredToken.current) {
            await savePushTokenToServer(pushToken, API_URL, token);
            lastRegisteredToken.current = pushToken;
            console.log('Push token successfully registered and cached.');
          }
        } catch (error) {
          console.error('Push registration error:', error);
        }
      };
      registerPush();

      // Listen for foreground notifications to refresh badge count
      const subscription = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received in foreground:', notification);
        refreshUser();
      });

      return () => {
        subscription.remove();
      };
    }
  }, [user?.id, token, refreshUser]); // Use user.id to avoid running on every user object change


  return useMemo(() => (
    <GamificationProvider>
      <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="subscriptions" options={{ headerShown: false }} />
          <Stack.Screen name="debts" options={{ headerShown: false }} />
          {/* <Stack.Screen name="profile" options={{ headerShown: false }} /> */}
          <Stack.Screen name="transaction/[id]" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Toast config={toastConfig} topOffset={60} />
      </NavigationThemeProvider>
    </GamificationProvider>
  ), [colorScheme, isLoading]);
}
