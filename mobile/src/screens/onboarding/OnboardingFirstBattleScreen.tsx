import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { matchService } from '../../services/api';
import { Language } from '../../types';

type FirstBattleRouteParams = {
  OnboardingFirstBattle: {
    language: Language;
  };
};

const OnboardingFirstBattleScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<FirstBattleRouteParams, 'OnboardingFirstBattle'>>();
  const language = route.params?.language || 'ENGLISH';

  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleStartBattle = async () => {
    try {
      setIsLoading(true);

      // Create CPU match
      const response = await matchService.createCPUMatch(language);
      const match = response.data.match;

      // Navigate to game screen with CPU match
      navigation.navigate('Game' as never, {
        matchId: match.id,
        isCPUMatch: true,
        language
      } as never);
    } catch (error: any) {
      console.error('Failed to create CPU match:', error);
      Alert.alert(
        'Error',
        'Failed to start your first battle. Please try again.',
        [
          {
            text: 'Retry',
            onPress: handleStartBattle,
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
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
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.emoji}>⚔️</Text>
          <Text style={styles.title}>Ready to Battle?</Text>
          <Text style={styles.subtitle}>
            Practice against our Training Bot - we'll guide you through!
          </Text>
        </View>

        {/* Training Bot Card - Simplified */}
        <View style={styles.botCard}>
          <View style={styles.botHeader}>
            <Text style={styles.botEmoji}>🤖</Text>
            <View style={styles.botInfo}>
              <Text style={styles.botName}>Training Bot</Text>
              <Text style={styles.botDescription}>Beginner-Friendly</Text>
            </View>
          </View>

          <View style={styles.quickInfo}>
            <View style={styles.quickInfoItem}>
              <Text style={styles.quickInfoIcon}>📝</Text>
              <Text style={styles.quickInfoText}>5 questions</Text>
            </View>
            <View style={styles.quickInfoItem}>
              <Text style={styles.quickInfoIcon}>⏱️</Text>
              <Text style={styles.quickInfoText}>45s each</Text>
            </View>
            <View style={styles.quickInfoItem}>
              <Text style={styles.quickInfoIcon}>🎯</Text>
              <Text style={styles.quickInfoText}>Easy mode</Text>
            </View>
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={[styles.startButton, isLoading && styles.startButtonDisabled]}
          onPress={handleStartBattle}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.startButtonText}>Let's Go!</Text>
          )}
        </TouchableOpacity>

        {/* Info Text */}
        <Text style={styles.infoText}>
          Don't worry - we'll show you how everything works
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 17,
    color: '#8B98A5',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  botCard: {
    backgroundColor: '#1A2332',
    borderRadius: 20,
    padding: 24,
    marginBottom: 40,
    borderWidth: 2,
    borderColor: '#2A3A4A',
    width: '100%',
  },
  botHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  botEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  botInfo: {
    flex: 1,
  },
  botName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  botDescription: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  quickInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickInfoItem: {
    alignItems: 'center',
  },
  quickInfoIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  quickInfoText: {
    fontSize: 14,
    color: '#D1D5DB',
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    width: '100%',
  },
  startButtonDisabled: {
    backgroundColor: '#4A5568',
    shadowOpacity: 0,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 14,
    color: '#8B98A5',
    textAlign: 'center',
  },
});

export default OnboardingFirstBattleScreen;
