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

const { width } = Dimensions.get('window');

interface TutorialStep {
  icon: string;
  title: string;
  description: string;
  visual: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    icon: '⚔️',
    title: 'Battle Mode',
    description: 'Answer 5 questions in 45 seconds each. Race against opponents to prove your language skills!',
    visual: '📝',
  },
  {
    icon: '⏱️',
    title: 'Beat the Timer',
    description: 'Each question has a timer. Answer quickly and accurately to win. Speed matters in tiebreakers!',
    visual: '⏰',
  },
  {
    icon: '🔥',
    title: 'Power-Ups',
    description: 'Use Freeze to stop your timer or Burn to speed up your opponent\'s. Strategic timing is key!',
    visual: '❄️',
  },
  {
    icon: '🏆',
    title: 'Climb the Ranks',
    description: 'Win matches to increase your ELO rating and rise through 8 divisions - from Bronze to Grandmaster!',
    visual: '📈',
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
          <Text style={styles.mainIcon}>{currentStepData.icon}</Text>
          <Text style={styles.visual}>{currentStepData.visual}</Text>
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
          <Text style={[styles.navButtonText, currentStep === 0 && styles.navButtonTextDisabled]}>
            ← Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.nextButtonText}>
            {currentStep === tutorialSteps.length - 1 ? 'Continue' : 'Next'} →
          </Text>
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  skipButton: {
    width: 60,
  },
  skipText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  progressDotActive: {
    backgroundColor: '#4A90E2',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  visualContainer: {
    position: 'relative',
    marginBottom: 50,
  },
  mainIcon: {
    fontSize: 120,
  },
  visual: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    fontSize: 50,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  navButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4A90E2',
    alignItems: 'center',
  },
  navButtonDisabled: {
    borderColor: '#e0e0e0',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
  },
  navButtonTextDisabled: {
    color: '#ccc',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  timeRemaining: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default OnboardingTutorialScreen;
