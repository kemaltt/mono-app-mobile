// @ts-nocheck
import { View, Text, Image, TouchableOpacity, Dimensions, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { useAuth } from '../context/auth';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

export default function Onboarding() {
  const { t } = useTranslation();
  const router = useRouter();
  const { completeOnboarding } = useAuth();
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim]);

  const coinTranslateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -25], 
  });

  const donutTranslateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 25],
  });

  const handleGetStarted = async () => {
    await completeOnboarding();
    router.push('/(auth)/register');
  };

  const handleLogin = async () => {
    await completeOnboarding();
    router.push('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />
      
      {/* Slanted Background */}
      <View style={styles.slantedBg}>
         {/* Concentric Circles Background */}
         <View style={[styles.circle, styles.circle1]} />
         <View style={[styles.circle, styles.circle2]} />
         <View style={[styles.circle, styles.circle3]} />
      </View>

      {/* Top Section with Content (Images) */}
      <View style={styles.topSection}>
         {/* Guy Image and Floating Elements */}
         <View style={styles.imageContainer}>
            <Image 
                source={require('../assets/images/Guy.png')} 
                style={styles.guyImage}
                resizeMode="contain"
            />
            
            {/* Floating Elements */}
            <Animated.Image 
                source={require('../assets/images/Coin.png')} 
                style={[styles.coinImage, { transform: [{ translateY: coinTranslateY }] }]}
                resizeMode="contain"
            />
            <Animated.Image 
                source={require('../assets/images/Donut.png')} 
                style={[styles.donutImage, { transform: [{ translateY: donutTranslateY }] }]}
                resizeMode="contain"
            />
         </View>
      </View>

      {/* Bottom Content Section */}
      <View style={styles.bottomSection}>
        <View style={styles.textContainer}>
            <Text style={styles.title}>{t('onboarding.title1')}</Text>
            <Text style={styles.title}>{t('onboarding.title2')}</Text>
        </View>
        
        <View style={styles.buttonContainer}>
            <TouchableOpacity 
                onPress={handleGetStarted}
                style={styles.button}
                activeOpacity={0.8}
            >
                <Text style={styles.buttonText}>{t('common.getStarted')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                onPress={handleLogin}
                style={styles.loginLink}
            >
                <Text style={styles.loginLinkText}>
                    {t('common.alreadyHaveAccount')} <Text style={styles.loginLinkHighlight}>{t('common.login')}</Text>
                </Text>
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  slantedBg: {
    position: 'absolute',
    top: 0,
    left: -width * 0.1,
    width: width * 1.2,
    height: Dimensions.get('window').height * 0.70,
    backgroundColor: '#3b82f6', 
    transform: [{ skewY: '-8deg' }],
    marginTop: -Dimensions.get('window').height * 0.1,
    overflow: 'hidden',
    zIndex: 1,
  },
  topSection: {
    height: height * 0.58,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 2,
  },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    left: '50%',
  },
  circle1: {
    width: 600,
    height: 600,
    marginLeft: -300, 
    top: 60,
  },
  circle2: {
    width: 450,
    height: 450,
    marginLeft: -225,
    top: 130,
  },
  circle3: {
    width: 300,
    height: 300,
    marginLeft: -150,
    top: 200,
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 0,
  },
  guyImage: {
    width: width * 0.8,
    height: height * 0.45,
  },
  coinImage: {
    position: 'absolute',
    width: 65,
    height: 95,
    top: height * 0.02,
    left: 30, 
  },
  donutImage: {
    position: 'absolute',
    width: 75,
    height: 75,
    top: height * 0.04,
    right: 20, 
  },
  bottomSection: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 50,
    paddingHorizontal: 24,
    zIndex: 3,
  },
  textContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#304FFE', 
    textAlign: 'center',
    letterSpacing: -1,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: '#586EEF',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#586EEF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 20,
    paddingVertical: 8,
  },
  loginLinkText: {
    color: '#6B7280',
    fontSize: 15,
  },
  loginLinkHighlight: {
    color: '#586EEF',
    fontWeight: 'bold',
  },
});
