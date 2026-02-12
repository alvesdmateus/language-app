import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PowerUpType, MatchType, Language } from '../types';
import { matchService } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import { colors, gradients, spacing, radii, shadows, typography, commonStyles } from '../theme';

const PowerUpSelectionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { language, matchType, isBattleMode } = route.params as {
    language: Language;
    matchType: MatchType;
    isBattleMode?: boolean;
  };
  const { socket } = useWebSocket();

  const [selectedPowerUp, setSelectedPowerUp] = useState<PowerUpType>(PowerUpType.NONE);
  const [isSearching, setIsSearching] = useState(false);

  const powerUps = [
    {
      type: PowerUpType.FREEZE,
      name: 'Freeze',
      icon: 'snowflake' as const,
      color: colors.secondary,
      colorLight: colors.secondaryLight,
      gradient: gradients.secondary,
      description: 'Freeze your timer for the current question',
      details: [
        'Stops your timer temporarily',
        'Gives you more time to think',
        'Adds 5 second penalty to total time',
        '60 second cooldown'
      ],
      pros: ['More time to answer', 'Less pressure'],
      cons: ['5s time penalty', 'Affects tiebreaker']
    },
    {
      type: PowerUpType.BURN,
      name: 'Burn',
      icon: 'fire' as const,
      color: colors.danger,
      colorLight: colors.dangerLight,
      gradient: gradients.danger,
      description: 'Speed up your opponent\'s timer',
      details: [
        'Doubles opponent\'s timer speed',
        'Lasts for current question only',
        'Puts pressure on opponent',
        '60 second cooldown'
      ],
      pros: ['Disrupts opponent', 'Strategic advantage'],
      cons: ['Requires good timing', 'Can be countered']
    },
    {
      type: PowerUpType.NONE,
      name: 'No Power-Up',
      icon: 'cancel' as const,
      color: colors.textTertiary,
      colorLight: colors.surfaceSecondary,
      gradient: gradients.dark,
      description: 'Play without power-ups',
      details: [
        'No special abilities',
        'No time penalties',
        'Pure skill-based gameplay',
        'Reliable strategy'
      ],
      pros: ['No penalties', 'Simple gameplay'],
      cons: ['No tactical options']
    },
  ];

  const handlePowerUpSelect = (powerUpType: PowerUpType) => {
    setSelectedPowerUp(powerUpType);
  };

  const handleStartMatch = async () => {
    try {
      setIsSearching(true);

      // Join matchmaking with selected power-up
      const response = await matchService.findMatch(matchType, language, {
        isBattleMode: isBattleMode || matchType === 'BATTLE',
        equippedPowerUp: selectedPowerUp,
        customSettings: {
          questionDuration: 45,
          difficulty: 'MEDIUM',
          powerUpsEnabled: true,
        },
      });

      // Navigate to game screen when match is found
      if (response.matchId) {
        navigation.navigate('GameScreen' as never, {
          matchId: response.matchId,
          match: response.match,
        } as never);
      }

    } catch (error: any) {
      console.error('Failed to find match:', error);
      Alert.alert(
        'Matchmaking Error',
        error?.response?.data?.message || 'Failed to find a match. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSearching(false);
    }
  };

  const selectedPowerUpData = powerUps.find(p => p.type === selectedPowerUp);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={gradients.purple}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textInverse} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <MaterialCommunityIcons name="lightning-bolt" size={32} color={colors.textInverse} />
        <Text style={styles.headerTitle}>Select Power-Up</Text>
        <Text style={styles.headerSubtitle}>
          Choose your strategy for this match
        </Text>
      </LinearGradient>

      {/* Power-Up Cards */}
      <View style={styles.powerUpsContainer}>
        {powerUps.map((powerUp) => {
          const isSelected = selectedPowerUp === powerUp.type;

          return (
            <TouchableOpacity
              key={powerUp.type}
              style={[
                styles.powerUpCard,
                isSelected && styles.powerUpCardSelected,
                { borderColor: isSelected ? powerUp.color : colors.border }
              ]}
              onPress={() => handlePowerUpSelect(powerUp.type)}
              activeOpacity={0.7}
            >
              {/* Power-Up Header */}
              <View style={styles.powerUpHeader}>
                <View style={[styles.powerUpIconCircle, { backgroundColor: powerUp.colorLight }]}>
                  <MaterialCommunityIcons name={powerUp.icon} size={28} color={powerUp.color} />
                </View>
                <View style={styles.powerUpTitleContainer}>
                  <Text style={[styles.powerUpName, isSelected && { color: powerUp.color }]}>
                    {powerUp.name}
                  </Text>
                  <Text style={styles.powerUpDescription}>{powerUp.description}</Text>
                </View>
                {isSelected && (
                  <View style={[styles.selectedBadge, { backgroundColor: powerUp.color }]}>
                    <Ionicons name="checkmark" size={18} color={colors.textInverse} />
                  </View>
                )}
              </View>

              {/* Details */}
              <View style={styles.detailsContainer}>
                {powerUp.details.map((detail, index) => (
                  <View key={index} style={styles.detailRow}>
                    <Ionicons name="ellipse" size={6} color={colors.textTertiary} style={{ marginTop: 6, marginRight: spacing.sm }} />
                    <Text style={styles.detailText}>{detail}</Text>
                  </View>
                ))}
              </View>

              {/* Pros & Cons */}
              {isSelected && (
                <View style={styles.prosConsContainer}>
                  <View style={styles.prosContainer}>
                    <View style={styles.prosConsTitleRow}>
                      <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
                      <Text style={styles.prosTitle}>Pros:</Text>
                    </View>
                    {powerUp.pros.map((pro, index) => (
                      <Text key={index} style={styles.prosText}>  {pro}</Text>
                    ))}
                  </View>
                  <View style={styles.consContainer}>
                    <View style={styles.prosConsTitleRow}>
                      <Ionicons name="alert-circle" size={16} color={colors.accentDark} />
                      <Text style={styles.consTitle}>Cons:</Text>
                    </View>
                    {powerUp.cons.map((con, index) => (
                      <Text key={index} style={styles.consText}>  {con}</Text>
                    ))}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <View style={styles.infoTitleRow}>
          <Ionicons name="information-circle" size={18} color={colors.secondaryDark} />
          <Text style={styles.infoTitle}>How Power-Ups Work</Text>
        </View>
        <Text style={styles.infoText}>
          {'\u2022'} Power-ups activate during matches{'\n'}
          {'\u2022'} Each power-up has a 60-second cooldown{'\n'}
          {'\u2022'} Freeze and Burn can cancel each other{'\n'}
          {'\u2022'} Strategic timing is key!
        </Text>
      </View>

      {/* Start Button */}
      <TouchableOpacity
        style={[
          styles.startButton,
          isSearching && styles.startButtonDisabled,
        ]}
        onPress={handleStartMatch}
        disabled={isSearching}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={selectedPowerUpData?.gradient || gradients.dark}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.startButtonGradient}
        >
          {isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={colors.textInverse} size="small" />
              <Text style={styles.startButtonText}>Finding Match...</Text>
            </View>
          ) : (
            <View style={styles.startButtonContent}>
              {selectedPowerUp !== PowerUpType.NONE && selectedPowerUpData && (
                <MaterialCommunityIcons
                  name={selectedPowerUpData.icon}
                  size={22}
                  color={colors.textInverse}
                  style={{ marginRight: spacing.sm }}
                />
              )}
              <Text style={styles.startButtonText}>
                {selectedPowerUp === PowerUpType.NONE
                  ? 'Start Match (No Power-Up)'
                  : `Start Match with ${selectedPowerUpData?.name}`}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  backButtonText: {
    ...typography.subtitle,
    color: colors.textInverse,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textInverse,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  powerUpsContainer: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  powerUpCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 3,
    ...shadows.md,
  },
  powerUpCardSelected: {
    ...shadows.lg,
  },
  powerUpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  powerUpIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  powerUpTitleContainer: {
    flex: 1,
  },
  powerUpName: {
    ...typography.stat,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  powerUpDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  selectedBadge: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs + 2,
  },
  detailText: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  prosConsContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  prosConsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  prosContainer: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radii.sm,
  },
  prosTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: '#2E7D32',
  },
  prosText: {
    ...typography.caption,
    color: '#2E7D32',
    marginLeft: spacing.xs,
  },
  consContainer: {
    backgroundColor: colors.accentLight,
    padding: spacing.md,
    borderRadius: radii.sm,
  },
  consTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.accentDark,
  },
  consText: {
    ...typography.caption,
    color: colors.accentDark,
    marginLeft: spacing.xs,
  },
  infoBox: {
    backgroundColor: colors.secondaryLight,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderRadius: radii.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoTitle: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.secondaryDark,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.secondaryDark,
    lineHeight: 22,
  },
  startButton: {
    marginHorizontal: spacing.xl,
    marginBottom: 30,
    borderRadius: radii.md,
    overflow: 'hidden',
    ...shadows.lg,
  },
  startButtonGradient: {
    padding: 18,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  startButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  startButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  startButtonText: {
    color: colors.textInverse,
    ...typography.button,
  },
});

export default PowerUpSelectionScreen;
