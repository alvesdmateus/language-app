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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, radii, shadows, typography } from '../../theme';
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

  const confettiColors = [colors.danger, colors.primary, colors.secondary, colors.accent, colors.gold, colors.purple, '#FF9FF3'];

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
    <LinearGradient
      colors={gradients.dark}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
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
          <View style={styles.trophyIconWrapper}>
            <Ionicons
              name={isWinner ? 'trophy' : 'star'}
              size={80}
              color={colors.gold}
            />
          </View>
          <View style={styles.sparkleContainer}>
            <View style={styles.sparkle1}>
              <Ionicons name="sparkles" size={22} color={colors.gold} />
            </View>
            <View style={styles.sparkle2}>
              <Ionicons name="sparkles" size={18} color={colors.gold} />
            </View>
            <View style={styles.sparkle3}>
              <Ionicons name="star" size={16} color={colors.accent} />
            </View>
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
              <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
              <Text style={styles.statValue}>{correctAnswers}/{totalQuestions}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons
                name={isWinner ? 'medal' : 'flag'}
                size={32}
                color={isWinner ? colors.gold : colors.secondary}
              />
              <Text style={styles.statValue}>{isWinner ? 'Won' : 'Completed'}</Text>
              <Text style={styles.statLabel}>Result</Text>
            </View>
          </View>
        </View>

        {/* Achievement */}
        <View style={styles.achievementCard}>
          <View style={styles.achievementBadge}>
            <Ionicons name="ribbon" size={28} color={colors.gold} />
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
          <LinearGradient
            colors={isCompleting ? [colors.textSecondary, colors.textSecondary] : gradients.secondary}
            style={styles.continueButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.continueButtonText}>
              {isCompleting ? 'Loading...' : 'Start Your Journey'}
            </Text>
            {!isCompleting && (
              <Ionicons name="arrow-forward" size={20} color={colors.textInverse} style={{ marginLeft: spacing.sm }} />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingHorizontal: spacing.xxxl,
    paddingVertical: 40,
  },
  trophyContainer: {
    position: 'relative',
    marginBottom: spacing.xxl,
  },
  trophyIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 200, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  sparkle1: {
    position: 'absolute',
    top: -10,
    right: -20,
  },
  sparkle2: {
    position: 'absolute',
    bottom: 20,
    left: -25,
  },
  sparkle3: {
    position: 'absolute',
    top: 20,
    right: -30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.gold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing.xxxl,
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radii.lg,
    padding: spacing.xl,
    width: '100%',
    marginBottom: spacing.xl,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  statValue: {
    ...typography.stat,
    color: colors.textInverse,
  },
  statLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  achievementCard: {
    backgroundColor: 'rgba(255, 200, 0, 0.12)',
    borderRadius: radii.lg,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 0, 0.25)',
  },
  achievementBadge: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 200, 0, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    ...typography.label,
    color: colors.gold,
    marginBottom: spacing.xs,
  },
  achievementName: {
    ...typography.title,
    color: colors.textInverse,
    marginBottom: 2,
  },
  achievementDesc: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  welcomeCard: {
    backgroundColor: 'rgba(28, 176, 246, 0.15)',
    borderRadius: radii.lg,
    padding: spacing.xl,
    width: '100%',
    marginBottom: spacing.xxxl,
  },
  welcomeTitle: {
    ...typography.subtitle,
    color: colors.secondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  welcomeText: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
    textAlign: 'center',
  },
  continueButton: {
    width: '100%',
    borderRadius: radii.full,
    overflow: 'hidden',
    ...shadows.lg,
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    ...typography.button,
    color: colors.textInverse,
    fontSize: 18,
  },
});

export default OnboardingCelebrationScreen;
