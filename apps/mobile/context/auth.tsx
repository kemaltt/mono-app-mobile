import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import * as Localization from 'expo-localization';

// Define context shape
interface AuthContextType {
  token: string | null;
  user: any | null;
  isLoading: boolean;
  hasSeenOnboarding: boolean;
  signIn: (token: string, user: any) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: any) => Promise<void>;
  refreshUser: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  hasSeenOnboarding: false,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
  updateUser: async () => {},
  refreshUser: async () => {},
  completeOnboarding: async () => {},
});

// Hook for easy access
export const useAuth = () => useContext(AuthContext);

// Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // Check for stored token on mount
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        const storedOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }

        if (storedOnboarding === 'true') {
          setHasSeenOnboarding(true);
        }
      } catch (e) {
        console.error('Failed to load token', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadToken();
  }, []);

  useEffect(() => {
    // 1. Don't do anything if loading or navigation is not ready
    if (isLoading || !navigationState?.key) return;

    const rootSegment = segments[0];

    // 2. Identify where we are and where we should be
    if (!hasSeenOnboarding) {
      if (rootSegment !== 'onboarding') {
        setTimeout(() => router.replace('/onboarding'), 1);
      }
      return;
    }

    if (!token) {
      // User has seen onboarding but no token
      if (rootSegment !== '(auth)') {
        setTimeout(() => router.replace('/(auth)/login'), 1);
      }
    } else {
      // User has token
      // Redirect to home if on a guest page
      const s0 = rootSegment as any;
      const isGuestPage = !s0 || s0 === '(auth)' || s0 === 'onboarding' || s0 === 'index';
      if (isGuestPage) {
        setTimeout(() => router.replace('/(tabs)/home'), 1);
      }
    }
  }, [token, segments[0], isLoading, hasSeenOnboarding, navigationState?.key]);

  const signIn = useCallback(async (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
    await AsyncStorage.setItem('token', newToken);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
  }, []);

  const signOut = useCallback(async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  }, []);

  const updateUser = useCallback(async (newUser: any) => {
    setUser(newUser);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const { API_URL } = require('../constants/Config');
      const response = await fetch(`${API_URL}/profile/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        let userData = await response.json();
        
        // Check timezone mismatch
        const deviceTimezone = Localization.getCalendars()[0]?.timeZone || 'UTC';
        if (userData.timezone && userData.timezone !== deviceTimezone) {
            try {
                const updateRes = await fetch(`${API_URL}/profile/update`, {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify({ timezone: deviceTimezone })
                });
                
                if (updateRes.ok) {
                    const updateData = await updateRes.json();
                    if (updateData.user) {
                        userData = updateData.user;
                    }
                }
            } catch (err) {
                console.log('Failed to auto-update timezone', err);
            }
        }

        await updateUser(userData);
      }
    } catch (e) {
      console.error('Failed to refresh user', e);
    }
  }, [token, updateUser]);

  const completeOnboarding = useCallback(async () => {
    setHasSeenOnboarding(true);
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
  }, []);

  const contextValue = React.useMemo(() => ({
    token,
    user,
    isLoading,
    hasSeenOnboarding,
    signIn,
    signOut,
    updateUser,
    refreshUser,
    completeOnboarding
  }), [token, user, isLoading, hasSeenOnboarding, signIn, signOut, updateUser, refreshUser, completeOnboarding]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
