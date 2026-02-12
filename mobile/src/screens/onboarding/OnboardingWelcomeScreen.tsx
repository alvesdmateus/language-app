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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, radii, shadows, typography } from '../../theme';

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
    <LinearGradient
      colors={gradients.secondary}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
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
          <Ionicons name="globe-outline" size={100} color={colors.textInverse} />
          <View style={styles.sparkle1}>
            <Ionicons name="sparkles" size={28} color={colors.gold} />
          </View>
          <View style={styles.sparkle2}>
            <Ionicons name="sparkles" size={22} color={colors.gold} />
          </View>
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
            <Ionicons name="flash" size={28} color={colors.accent} style={styles.featureIcon} />
            <Text style={styles.featureText}>Battle Players Worldwide</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="trophy" size={28} color={colors.gold} style={styles.featureIcon} />
            <Text style={styles.featureText}>Climb the Rankings</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="flame" size={28} color={colors.danger} style={styles.featureIcon} />
            <Text style={styles.featureText}>Use Strategic Power-Ups</Text>
          </View>
        </View>

        {/* CTA Button */}
        <TouchableOpacity style={styles.startButton} onPress={handleStart} activeOpacity={0.8}>
          <Text style={styles.startButtonText}>Let's Get Started!</Text>
          <Ionicons name="rocket" size={20} color={colors.secondary} style={{ marginLeft: spacing.sm }} />
        </TouchableOpacity>

        {/* Duration indicator */}
        <Text style={styles.duration}>Takes less than 60 seconds</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  heroContainer: {
    position: 'relative',
    marginBottom: spacing.xxxl,
  },
  sparkle1: {
    position: 'absolute',
    top: -10,
    right: -20,
  },
  sparkle2: {
    position: 'absolute',
    bottom: 10,
    left: -15,
  },
  title: {
    ...typography.h2,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: colors.textInverse,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
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
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  featureIcon: {
    marginRight: spacing.lg,
  },
  featureText: {
    ...typography.subtitle,
    color: colors.textInverse,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: radii.full,
    ...shadows.xl,
    marginBottom: spacing.lg,
  },
  startButtonText: {
    ...typography.button,
    color: colors.secondary,
  },
  duration: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
});

export default OnboardingWelcomeScreen;
