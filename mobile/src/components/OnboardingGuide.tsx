import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';

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

      // Pulse animation for the highlight
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

  // Auto-advance if configured
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
      {/* Semi-transparent background */}
      <View style={styles.backdrop} />

      {/* Highlight area (if specified) */}
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

      {/* Tooltip */}
      <View style={[styles.tooltipContainer, getTooltipPosition()]}>
        {/* Arrow pointing up */}
        {step.arrow === 'up' && <View style={styles.arrowUp} />}

        <View style={styles.tooltip}>
          {/* Step indicator */}
          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>
              {currentStep + 1} / {steps.length}
            </Text>
          </View>

          {/* Content */}
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.description}>{step.description}</Text>

          {/* Buttons */}
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
            </TouchableOpacity>
          </View>
        </View>

        {/* Arrow pointing down */}
        {step.arrow === 'down' && <View style={styles.arrowDown} />}
      </View>

      {/* Progress dots */}
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  highlight: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 3,
    borderColor: '#4A90E2',
    borderRadius: 12,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  tooltipContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  tooltip: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  arrowUp: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'white',
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
    borderTopColor: 'white',
    marginTop: -1,
  },
  stepIndicator: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: '#4A90E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    marginTop: 8,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999',
  },
  nextButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
  },
  progressDots: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: '#4A90E2',
    width: 24,
  },
  dotCompleted: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
});

export default OnboardingGuide;
