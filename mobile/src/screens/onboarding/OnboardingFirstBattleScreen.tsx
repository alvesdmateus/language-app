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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, radii, shadows, typography } from '../../theme';
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
        match: match,
        isCPUMatch: true,
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
    <LinearGradient
      colors={gradients.dark}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
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
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Ionicons name="flash" size={80} color={colors.accent} />
          <Text style={styles.title}>Ready to Battle?</Text>
          <Text style={styles.subtitle}>
            Practice against our Training Bot - we'll guide you through!
          </Text>
        </View>

        {/* Training Bot Card */}
        <View style={styles.botCard}>
          <View style={styles.botHeader}>
            <View style={styles.botIconContainer}>
              <Ionicons name="hardware-chip" size={36} color={colors.secondary} />
            </View>
            <View style={styles.botInfo}>
              <Text style={styles.botName}>Training Bot</Text>
              <Text style={styles.botDescription}>Beginner-Friendly</Text>
            </View>
          </View>

          <View style={styles.quickInfo}>
            <View style={styles.quickInfoItem}>
              <Ionicons name="document-text" size={28} color={colors.secondary} />
              <Text style={styles.quickInfoText}>5 questions</Text>
            </View>
            <View style={styles.quickInfoItem}>
              <Ionicons name="timer" size={28} color={colors.accent} />
              <Text style={styles.quickInfoText}>45s each</Text>
            </View>
            <View style={styles.quickInfoItem}>
              <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
              <Text style={styles.quickInfoText}>Easy mode</Text>
            </View>
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={[styles.startButton, isLoading && styles.startButtonDisabled]}
          onPress={handleStartBattle}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isLoading ? [colors.textSecondary, colors.textSecondary] : gradients.secondary}
            style={styles.startButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.textInverse} size="small" />
            ) : (
              <>
                <Text style={styles.startButtonText}>Let's Go!</Text>
                <Ionicons name="arrow-forward-circle" size={24} color={colors.textInverse} style={{ marginLeft: spacing.sm }} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Info Text */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textTertiary} style={{ marginRight: spacing.xs }} />
          <Text style={styles.infoText}>
            Don't worry - we'll show you how everything works
          </Text>
        </View>
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
    paddingHorizontal: spacing.xxl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    ...typography.h1,
    color: colors.textInverse,
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  botCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radii.xl,
    padding: spacing.xxl,
    marginBottom: 40,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    width: '100%',
  },
  botHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  botIconContainer: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(28, 176, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  botInfo: {
    flex: 1,
  },
  botName: {
    ...typography.h3,
    color: colors.textInverse,
    marginBottom: spacing.xs,
  },
  botDescription: {
    ...typography.subtitle,
    color: colors.primary,
  },
  quickInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickInfoItem: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  quickInfoText: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  startButton: {
    width: '100%',
    borderRadius: radii.full,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  startButtonDisabled: {
    opacity: 0.7,
  },
  startButtonGradient: {
    flexDirection: 'row',
    paddingVertical: spacing.xl,
    paddingHorizontal: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    ...typography.button,
    color: colors.textInverse,
    fontSize: 20,
    letterSpacing: 0.5,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});

export default OnboardingFirstBattleScreen;
