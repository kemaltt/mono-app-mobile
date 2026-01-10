
// @ts-nocheck
import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, { 
  FadeInUp, 
  FadeOutUp, 
  FadeInDown, 
  FadeOutDown,
  Layout,
  SlideInUp
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface GamificationContextType {
  showXP: (amount: number) => void;
  showAchievement: (achievement: { name: string, icon: string, xpReward: number }) => void;
}

const GamificationContext = createContext<GamificationContextType>({
  showXP: () => {},
  showAchievement: () => {},
});

export const useGamification = () => useContext(GamificationContext);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const [xpQueue, setXpQueue] = useState<number[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);

  const showXP = useCallback((amount: number) => {
    setXpQueue(prev => [...prev, amount]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      setXpQueue(prev => prev.slice(1));
    }, 2000);
  }, []);

  const showAchievement = useCallback((achievement: any) => {
    setAchievements(prev => [...prev, achievement]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      setAchievements(prev => prev.slice(1));
    }, 5000);
  }, []);

  return (
    <GamificationContext.Provider value={{ showXP, showAchievement }}>
      {children}
      
      {/* XP Popups */}
      <View style={styles.xpContainer} pointerEvents="none">
        {xpQueue.map((amount, index) => (
          <Animated.View 
            key={index}
            entering={FadeInDown.duration(500)}
            exiting={FadeOutUp.duration(500)}
            style={styles.xpBadge}
          >
            <Text style={styles.xpText}>+{amount} XP</Text>
          </Animated.View>
        ))}
      </View>

      {/* Achievement Modal */}
      {achievements.length > 0 && (
        <View style={styles.fullOverlay}>
          <LottieView
            source={require('../assets/lottie/success.json')}
            autoPlay
            loop={false}
            style={styles.lottie}
            pointerEvents="none"
          />
          <Animated.View 
            entering={SlideInUp.springify()}
            style={styles.achievementCard}
          >
            <View style={styles.iconCircle}>
                <Ionicons name={achievements[0].icon as any || "trophy"} size={40} color="#FFD700" />
            </View>
            <Text style={styles.congratsText}>Congratulations!</Text>
            <Text style={styles.achievementName}>{achievements[0].name}</Text>
            <Text style={styles.achievementDesc}>{achievements[0].description}</Text>
            <View style={styles.rewardBadge}>
                <Text style={styles.rewardText}>+{achievements[0].xpReward} XP</Text>
            </View>
          </Animated.View>
        </View>
      )}
    </GamificationContext.Provider>
  );
}

export default GamificationProvider;

const styles = StyleSheet.create({
  xpContainer: {
    position: 'absolute',
    bottom: 100,
    width: '100%',
    alignItems: 'center',
    zIndex: 9999,
  },
  xpBadge: {
    backgroundColor: '#586EEF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#586EEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 10,
  },
  xpText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  fullOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  lottie: {
    width: width,
    height: width,
    position: 'absolute',
    top: height * 0.1,
  },
  achievementCard: {
    backgroundColor: '#FFFFFF',
    width: width * 0.85,
    borderRadius: 32,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F8F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 4,
    borderColor: '#FFD700',
  },
  congratsText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 10,
  },
  achievementDesc: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
  },
  rewardBadge: {
    backgroundColor: '#586EEF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  rewardText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  }
});
