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
          <Text style={styles.title}>Time for Your First Battle!</Text>
          <Text style={styles.subtitle}>
            Let's test your skills in a practice match against our Training Bot
          </Text>
        </View>

        {/* Training Bot Card */}
        <View style={styles.botCard}>
          <View style={styles.botHeader}>
            <Text style={styles.botEmoji}>🤖</Text>
            <View style={styles.botInfo}>
              <Text style={styles.botName}>Training Bot</Text>
              <Text style={styles.botDescription}>Beginner-Friendly</Text>
            </View>
          </View>

          <View style={styles.botStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>ELO Rating</Text>
              <Text style={styles.statValue}>800</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Difficulty</Text>
              <Text style={styles.statValue}>Easy</Text>
            </View>
          </View>

          <View style={styles.botFeatures}>
            <View style={styles.featureRow}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>5 questions at easy difficulty</Text>
            </View>
            <View style={styles.featureRow}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>45 seconds per question</Text>
            </View>
            <View style={styles.featureRow}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>No ELO changes (practice only)</Text>
            </View>
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Quick Tips</Text>
          <Text style={styles.tipsText}>
            Answer correctly and quickly to win. If you tie on accuracy, the fastest time wins!
          </Text>
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
            <Text style={styles.startButtonText}>Start Battle</Text>
          )}
        </TouchableOpacity>

        {/* Info Text */}
        <Text style={styles.infoText}>
          This is a practice match to help you learn the game
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#8B98A5',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  botCard: {
    backgroundColor: '#1A2332',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#2A3A4A',
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
  botStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: '#0F1419',
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#2A3A4A',
  },
  statLabel: {
    fontSize: 12,
    color: '#8B98A5',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  botFeatures: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureBullet: {
    fontSize: 18,
    color: '#1E88E5',
    marginRight: 12,
    width: 20,
  },
  featureText: {
    fontSize: 15,
    color: '#D1D5DB',
    flex: 1,
  },
  tipsCard: {
    backgroundColor: '#1A2F3A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonDisabled: {
    backgroundColor: '#4A5568',
    shadowOpacity: 0,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 13,
    color: '#8B98A5',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default OnboardingFirstBattleScreen;
