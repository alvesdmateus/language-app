import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { MatchCompletedEvent } from '../../types';

const { width, height } = Dimensions.get('window');

type CelebrationRouteParams = {
  OnboardingCelebration: {
    result: MatchCompletedEvent;
    isWinner: boolean;
  };
};

// Confetti particle component
const ConfettiParticle = ({ delay, color }: { delay: number; color: string }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(Math.random() * width)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(-50);
      translateX.setValue(Math.random() * width);
      rotate.setValue(0);
      opacity.setValue(1);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: height + 50,
          duration: 3000 + Math.random() * 2000,
          delay,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: translateX._value + (Math.random() - 0.5) * 200,
          duration: 3000 + Math.random() * 2000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: Math.random() * 10,
          duration: 3000 + Math.random() * 2000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 3000 + Math.random() * 2000,
          delay,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };

    animate();
  }, []);

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          backgroundColor: color,
          transform: [
            { translateY },
            { translateX },
            {
              rotate: rotate.interpolate({
                inputRange: [0, 10],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
          opacity,
        },
      ]}
    />
  );
};

const OnboardingCelebrationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<CelebrationRouteParams, 'OnboardingCelebration'>>();
  const { completeOnboarding, user } = useAuth();

  const { result, isWinner } = route.params || { result: null, isWinner: true };

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const trophyBounce = useRef(new Animated.Value(0)).current;
  const [isCompleting, setIsCompleting] = useState(false);

  // Get user result from match
  const userResult = result?.results?.find((r) => r.userId === user?.id);
  const correctAnswers = userResult?.correctAnswers || 0;
  const totalQuestions = result?.results?.[0]?.score ? 5 : 5; // Default to 5 questions

  const confettiColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF9FF3'];

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Trophy bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(trophyBounce, {
          toValue: -15,
          duration: 500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(trophyBounce, {
          toValue: 0,
          duration: 500,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleContinue = async () => {
    try {
      setIsCompleting(true);
      await completeOnboarding();
      // Navigation will happen automatically when onboardingCompleted becomes true
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      setIsCompleting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Confetti */}
      {Array.from({ length: 30 }).map((_, index) => (
        <ConfettiParticle
          key={index}
          delay={index * 100}
          color={confettiColors[index % confettiColors.length]}
        />
      ))}

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Trophy */}
        <Animated.View
          style={[
            styles.trophyContainer,
            {
              transform: [{ scale: scaleAnim }, { translateY: trophyBounce }],
            },
          ]}
        >
          <Text style={styles.trophy}>{isWinner ? '🏆' : '🌟'}</Text>
          <View style={styles.sparkleContainer}>
            <Text style={styles.sparkle1}>✨</Text>
            <Text style={styles.sparkle2}>✨</Text>
            <Text style={styles.sparkle3}>⭐</Text>
          </View>
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>
          {isWinner ? 'Victory!' : 'Great Effort!'}
        </Text>
        <Text style={styles.subtitle}>
          You've completed your first battle!
        </Text>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>✅</Text>
              <Text style={styles.statValue}>{correctAnswers}/{totalQuestions}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>{isWinner ? '🥇' : '🎯'}</Text>
              <Text style={styles.statValue}>{isWinner ? 'Won' : 'Completed'}</Text>
              <Text style={styles.statLabel}>Result</Text>
            </View>
          </View>
        </View>

        {/* Achievement */}
        <View style={styles.achievementCard}>
          <View style={styles.achievementBadge}>
            <Text style={styles.achievementIcon}>🎖️</Text>
          </View>
          <View style={styles.achievementContent}>
            <Text style={styles.achievementTitle}>Achievement Unlocked!</Text>
            <Text style={styles.achievementName}>First Steps</Text>
            <Text style={styles.achievementDesc}>Complete your first battle</Text>
          </View>
        </View>

        {/* Welcome message */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome to Language Arena!</Text>
          <Text style={styles.welcomeText}>
            You're ready to battle players worldwide and climb the rankings. Keep practicing to improve your skills!
          </Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.continueButton, isCompleting && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={isCompleting}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            {isCompleting ? 'Loading...' : 'Start Your Journey'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  trophyContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  trophy: {
    fontSize: 100,
  },
  sparkleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  sparkle1: {
    position: 'absolute',
    fontSize: 24,
    top: -10,
    right: -20,
  },
  sparkle2: {
    position: 'absolute',
    fontSize: 20,
    bottom: 20,
    left: -25,
  },
  sparkle3: {
    position: 'absolute',
    fontSize: 18,
    top: 20,
    right: -30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 32,
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  achievementCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  achievementBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementIcon: {
    fontSize: 32,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  achievementName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  achievementDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  welcomeCard: {
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 30,
    width: '100%',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#666',
    shadowOpacity: 0,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
});

export default OnboardingCelebrationScreen;
