import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';

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
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!hasSeenOnboarding) {
      if (!inOnboarding) {
        router.replace('/onboarding');
      }
      return;
    }

    // Determine redirection if onboarding is seen
    if (!token && !inAuthGroup && !inOnboarding) {
      // Redirect to login if a user has seen onboarding but has no token and is not in the auth group and not on onboarding
      router.replace('/(auth)/login');
    } else if (token && inAuthGroup) {
      // Redirect to home if token exists and trying to access auth pages
      router.replace('/(tabs)/home');
    }
  }, [token, segments, isLoading, hasSeenOnboarding]);

  const signIn = async (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
    await AsyncStorage.setItem('token', newToken);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
  };

  const signOut = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  };

  const updateUser = async (newUser: any) => {
    setUser(newUser);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const { API_URL } = require('../constants/Config');
      const response = await fetch(`${API_URL}/profile/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        await updateUser(userData);
      }
    } catch (e) {
      console.error('Failed to refresh user', e);
    }
  };

  const completeOnboarding = async () => {
    setHasSeenOnboarding(true);
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    // Navigation will be handled by useEffect
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, hasSeenOnboarding, signIn, signOut, updateUser, refreshUser, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}
