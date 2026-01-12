import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const OnboardingWelcomeScreen = () => {
  const navigation = useNavigation();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleStart = () => {
    // Skip tutorial - go directly to language selection for faster onboarding
    navigation.navigate('OnboardingLanguage' as never);
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Hero Icon */}
        <View style={styles.heroContainer}>
          <Text style={styles.heroEmoji}>🌍</Text>
          <Text style={styles.sparkle1}>✨</Text>
          <Text style={styles.sparkle2}>✨</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Welcome to</Text>
        <Text style={styles.appName}>Language Arena</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Master languages through exciting battles and challenges
        </Text>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>⚔️</Text>
            <Text style={styles.featureText}>Battle Players Worldwide</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🏆</Text>
            <Text style={styles.featureText}>Climb the Rankings</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🔥</Text>
            <Text style={styles.featureText}>Use Strategic Power-Ups</Text>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.8}>
          <Text style={styles.startButtonText}>Let's Get Started! 🚀</Text>
        </TouchableOpacity>

        {/* Duration indicator */}
        <Text style={styles.duration}>Takes less than 60 seconds</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4A90E2',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  heroContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  heroEmoji: {
    fontSize: 100,
  },
  sparkle1: {
    position: 'absolute',
    top: -10,
    right: -20,
    fontSize: 30,
  },
  sparkle2: {
    position: 'absolute',
    bottom: 10,
    left: -15,
    fontSize: 24,
  },
  title: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginBottom: 8,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginBottom: 50,
    lineHeight: 24,
    maxWidth: 300,
  },
  features: {
    width: '100%',
    marginBottom: 50,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: 'white',
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 16,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  duration: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
});

export default OnboardingWelcomeScreen;
