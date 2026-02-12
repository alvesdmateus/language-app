import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, radii, shadows, typography } from '../../theme';

const { width } = Dimensions.get('window');

interface TutorialStep {
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  description: string;
  visualName: keyof typeof Ionicons.glyphMap;
  visualColor: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    iconName: 'flash',
    iconColor: colors.accent,
    title: 'Battle Mode',
    description: 'Answer 5 questions in 45 seconds each. Race against opponents to prove your language skills!',
    visualName: 'document-text',
    visualColor: colors.secondary,
  },
  {
    iconName: 'timer',
    iconColor: colors.danger,
    title: 'Beat the Timer',
    description: 'Each question has a timer. Answer quickly and accurately to win. Speed matters in tiebreakers!',
    visualName: 'alarm',
    visualColor: colors.accent,
  },
  {
    iconName: 'flame',
    iconColor: colors.accent,
    title: 'Power-Ups',
    description: 'Use Freeze to stop your timer or Burn to speed up your opponent\'s. Strategic timing is key!',
    visualName: 'snow',
    visualColor: colors.secondary,
  },
  {
    iconName: 'trophy',
    iconColor: colors.gold,
    title: 'Climb the Ranks',
    description: 'Win matches to increase your ELO rating and rise through 8 divisions - from Bronze to Grandmaster!',
    visualName: 'trending-up',
    visualColor: colors.primary,
  },
];

const OnboardingTutorialScreen = () => {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      scrollViewRef.current?.scrollTo({
        x: nextStep * width,
        animated: true,
      });

      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: (nextStep + 1) / tutorialSteps.length,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      navigation.navigate('OnboardingLanguage' as never);
    }
  };

  const handleSkip = () => {
    navigation.navigate('OnboardingLanguage' as never);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      scrollViewRef.current?.scrollTo({
        x: prevStep * width,
        animated: true,
      });

      Animated.timing(progressAnim, {
        toValue: (prevStep + 1) / tutorialSteps.length,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const currentStepData = tutorialSteps[currentStep];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          {tutorialSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index <= currentStep && styles.progressDotActive,
              ]}
            />
          ))}
        </View>
        <View style={styles.skipButton} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Visual Icon */}
        <View style={styles.visualContainer}>
          <View style={styles.mainIconContainer}>
            <LinearGradient
              colors={gradients.secondary}
              style={styles.mainIconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={currentStepData.iconName} size={80} color={colors.textInverse} />
            </LinearGradient>
          </View>
          <View style={styles.visualBadge}>
            <Ionicons name={currentStepData.visualName} size={32} color={currentStepData.visualColor} />
          </View>
        </View>

        {/* Title & Description */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{currentStepData.title}</Text>
          <Text style={styles.description}>{currentStepData.description}</Text>
        </View>
      </View>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleBack}
          style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}
          disabled={currentStep === 0}
        >
          <Ionicons
            name="arrow-back"
            size={18}
            color={currentStep === 0 ? colors.textTertiary : colors.secondary}
            style={{ marginRight: spacing.xs }}
          />
          <Text style={[styles.navButtonText, currentStep === 0 && styles.navButtonTextDisabled]}>
            Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
          <LinearGradient
            colors={gradients.secondary}
            style={styles.nextButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === tutorialSteps.length - 1 ? 'Continue' : 'Next'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={colors.textInverse} style={{ marginLeft: spacing.xs }} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Timer indicator */}
      <Text style={styles.timeRemaining}>
        {Math.ceil(((tutorialSteps.length - currentStep) * 15))} seconds left
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: spacing.xl,
  },
  skipButton: {
    width: 60,
  },
  skipText: {
    ...typography.subtitle,
    color: colors.secondary,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.border,
  },
  progressDotActive: {
    backgroundColor: colors.secondary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  visualContainer: {
    position: 'relative',
    marginBottom: 50,
  },
  mainIconContainer: {
    borderRadius: radii.full,
    overflow: 'hidden',
    ...shadows.lg,
  },
  mainIconGradient: {
    width: 160,
    height: 160,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
    gap: spacing.md,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    borderColor: colors.border,
  },
  navButtonText: {
    ...typography.subtitle,
    color: colors.secondary,
  },
  navButtonTextDisabled: {
    color: colors.textTertiary,
  },
  nextButton: {
    flex: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
  timeRemaining: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    ...typography.caption,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
});

export default OnboardingTutorialScreen;
