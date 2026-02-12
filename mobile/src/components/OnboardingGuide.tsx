import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, shadows, typography } from '../theme';

const { width, height } = Dimensions.get('window');

export interface GuideStep {
  id: string;
  title: string;
  description: string;
  position: 'top' | 'center' | 'bottom';
  highlightArea?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  arrow?: 'up' | 'down' | 'none';
  autoAdvance?: boolean;
  autoAdvanceDelay?: number;
}

interface OnboardingGuideProps {
  steps: GuideStep[];
  currentStep: number;
  onStepComplete: () => void;
  onSkip: () => void;
  visible: boolean;
}

const OnboardingGuide: React.FC<OnboardingGuideProps> = ({
  steps,
  currentStep,
  onStepComplete,
  onSkip,
  visible,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    const step = steps[currentStep];
    if (step?.autoAdvance && visible) {
      const timer = setTimeout(() => {
        onStepComplete();
      }, step.autoAdvanceDelay || 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, visible, steps]);

  if (!visible || currentStep >= steps.length) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const getTooltipPosition = () => {
    switch (step.position) {
      case 'top':
        return { top: 120 };
      case 'center':
        return { top: height / 2 - 100 };
      case 'bottom':
        return { bottom: 180 };
      default:
        return { top: height / 2 - 100 };
    }
  };

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <View style={styles.backdrop} />

      {step.highlightArea && (
        <Animated.View
          style={[
            styles.highlight,
            {
              top: step.highlightArea.top,
              left: step.highlightArea.left,
              width: step.highlightArea.width,
              height: step.highlightArea.height,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      )}

      <View style={[styles.tooltipContainer, getTooltipPosition()]}>
        {step.arrow === 'up' && <View style={styles.arrowUp} />}

        <View style={styles.tooltip}>
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>
              {currentStep + 1} / {steps.length}
            </Text>
          </View>

          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.description}>{step.description}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={onStepComplete}
            >
              <Text style={styles.nextButtonText}>
                {isLastStep ? 'Got it!' : 'Next'}
              </Text>
              {!isLastStep && (
                <Ionicons name="arrow-forward" size={16} color={colors.textInverse} style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {step.arrow === 'down' && <View style={styles.arrowDown} />}
      </View>

      <View style={styles.progressDots}>
        {steps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentStep && styles.dotActive,
              index < currentStep && styles.dotCompleted,
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayDark,
  },
  highlight: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: colors.secondary,
    borderRadius: radii.md,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  tooltipContainer: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    alignItems: 'center',
  },
  tooltip: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    width: '100%',
    ...shadows.xl,
  },
  arrowUp: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.surface,
    marginBottom: -1,
  },
  arrowDown: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.surface,
    marginTop: -1,
  },
  stepIndicator: {
    position: 'absolute',
    top: -12,
    right: spacing.lg,
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  stepText: {
    color: colors.textInverse,
    ...typography.caption,
    fontWeight: '700',
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  skipButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  skipButtonText: {
    ...typography.buttonSmall,
    color: colors.textTertiary,
  },
  nextButton: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: colors.primaryDark,
    ...shadows.primaryButton,
  },
  nextButtonText: {
    ...typography.buttonSmall,
    color: colors.textInverse,
  },
  progressDots: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  dotCompleted: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
});

export default OnboardingGuide;
