import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MatchCompletedEvent } from '../types';
import { useAuth } from '../context/AuthContext';
import { colors, gradients, spacing, radii, shadows, typography, commonStyles } from '../theme';

const MatchResultsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, completeOnboarding } = useAuth();
  const { matchId, result, isCPUMatch } = route.params as {
    matchId: string;
    result: MatchCompletedEvent;
    isCPUMatch?: boolean;
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Navigate to celebration screen if this was a CPU match (first battle)
  useEffect(() => {
    if (isCPUMatch && user && !user.onboardingCompleted) {
      // Wait a moment to let user see results, then go to celebration
      const timer = setTimeout(() => {
        navigation.navigate('OnboardingCelebration' as never, {
          result,
          isWinner: result.winnerId === user?.id,
        } as never);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isCPUMatch, user?.onboardingCompleted]);

  const isWinner = result.winnerId === user?.id;
  const isLoser = result.winnerId && result.winnerId !== user?.id;
  const isDraw = result.isDraw;

  const userResult = result.results?.find((r) => r.userId === user?.id);
  const opponentResult = result.results?.find((r) => r.userId !== user?.id);

  const userEloChange = result.eloChanges?.find((e) => e.id === user?.id);
  const userDivisionChange = result.divisionChanges?.find((d) => d.userId === user?.id);

  // Safety check - if results are incomplete, show error
  if (!result.results || result.results.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.accent} />
          <Text style={styles.errorTitle}>Match Incomplete</Text>
          <Text style={styles.errorText}>
            The match results are not available yet. This may happen if not all players finished the match.
          </Text>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.navigate('Home' as never)}
          >
            <Ionicons name="home" size={18} color={colors.textPrimary} style={{ marginRight: spacing.sm }} />
            <Text style={styles.homeButtonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getResultStatus = () => {
    if (isDraw) return { text: 'Draw!', icon: 'handshake' as const, color: colors.accent, gradient: gradients.accent };
    if (isWinner) return { text: 'Victory!', icon: 'trophy' as const, color: colors.primary, gradient: gradients.primary };
    return { text: 'Defeat', icon: 'emoticon-sad-outline' as const, color: colors.danger, gradient: gradients.danger };
  };

  const status = getResultStatus();

  const formatTime = (ms: number) => {
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Result Header */}
        <Animated.View
          style={[
            styles.resultHeader,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={[styles.resultIconCircle, { backgroundColor: status.color + '20' }]}>
            <MaterialCommunityIcons name={status.icon} size={56} color={status.color} />
          </View>
          <Text style={[styles.resultText, { color: status.color }]}>
            {status.text}
          </Text>
          {isDraw && (
            <Text style={styles.resultSubtext}>
              Same score and time - It's a tie!
            </Text>
          )}
        </Animated.View>

        {/* Score Comparison */}
        <View style={styles.scoreCard}>
          <Text style={styles.sectionTitle}>Match Summary</Text>
          <View style={styles.comparisonRow}>
            <View style={[styles.playerColumn, isWinner && styles.winnerColumn]}>
              <Text style={styles.playerLabel}>You</Text>
              <Text style={styles.playerScore}>{userResult?.correctAnswers || 0}</Text>
              <Text style={styles.playerSubtext}>correct</Text>
            </View>

            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
            </View>

            <View style={[styles.playerColumn, isLoser && styles.loserColumn]}>
              <Text style={styles.playerLabel}>Opponent</Text>
              <Text style={styles.playerScore}>{opponentResult?.correctAnswers || 0}</Text>
              <Text style={styles.playerSubtext}>correct</Text>
            </View>
          </View>

          {/* Time Comparison */}
          <View style={styles.timeComparisonContainer}>
            <View style={styles.timeRow}>
              <View style={styles.timeLabelRow}>
                <Ionicons name="timer-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.timeLabel}>Your Time:</Text>
              </View>
              <Text style={styles.timeValue}>
                {formatTime(userResult?.totalTimeMs || 0)}
              </Text>
            </View>
            <View style={styles.timeRow}>
              <View style={styles.timeLabelRow}>
                <Ionicons name="timer-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.timeLabel}>Opponent Time:</Text>
              </View>
              <Text style={styles.timeValue}>
                {formatTime(opponentResult?.totalTimeMs || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Detailed Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Your Performance</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statItem, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
              <Text style={styles.statValue}>{userResult?.correctAnswers || 0}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: colors.secondaryLight }]}>
              <Ionicons name="timer" size={28} color={colors.secondary} />
              <Text style={styles.statValue}>
                {formatTime(userResult?.totalTimeMs || 0)}
              </Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: colors.goldLight }]}>
              <Ionicons name="star" size={28} color={colors.gold} />
              <Text style={styles.statValue}>{userResult?.score || 0}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: colors.purpleLight }]}>
              <Ionicons name="analytics" size={28} color={colors.purple} />
              <Text style={styles.statValue}>
                {userResult?.correctAnswers
                  ? ((userResult.correctAnswers / result.results[0].score) * 100).toFixed(0)
                  : 0}
                %
              </Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
          </View>
        </View>

        {/* ELO Change */}
        {userEloChange && (
          <View style={styles.eloCard}>
            <Text style={styles.sectionTitle}>Rating Change</Text>
            <View style={styles.eloChange}>
              <Text style={styles.eloLabel}>ELO Rating</Text>
              <View style={styles.eloValues}>
                <Text style={styles.oldElo}>
                  {userEloChange.newRating - userEloChange.change}
                </Text>
                <View style={[styles.eloChangeBadge, { backgroundColor: userEloChange.change >= 0 ? colors.primaryLight : colors.dangerLight }]}>
                  <Ionicons
                    name={userEloChange.change >= 0 ? 'arrow-up' : 'arrow-down'}
                    size={14}
                    color={userEloChange.change >= 0 ? colors.primary : colors.danger}
                  />
                  <Text
                    style={[
                      styles.eloChangeValue,
                      {
                        color: userEloChange.change >= 0 ? colors.primary : colors.danger,
                      },
                    ]}
                  >
                    {userEloChange.change >= 0 ? '+' : ''}
                    {userEloChange.change}
                  </Text>
                </View>
                <Text style={styles.newElo}>{userEloChange.newRating}</Text>
              </View>
            </View>

            {userDivisionChange && (
              <View style={styles.divisionChange}>
                <LinearGradient
                  colors={gradients.gold}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.divisionGradient}
                >
                  <Ionicons name="ribbon" size={20} color={colors.white} style={{ marginRight: spacing.sm }} />
                  <Text style={styles.divisionChangeTitle}>Division Promoted!</Text>
                </LinearGradient>
                <View style={styles.divisionFlow}>
                  <Text style={styles.divisionOld}>
                    {userDivisionChange.oldDivision}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color={colors.gold} />
                  <Text style={styles.divisionNew}>
                    {userDivisionChange.newDivision}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Winner Determination Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoTitleRow}>
            <Ionicons name="information-circle" size={18} color={colors.secondary} style={{ marginRight: spacing.sm }} />
            <Text style={styles.infoTitle}>How Winners Are Determined</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoNumberBadge}>
              <Text style={styles.infoNumber}>1</Text>
            </View>
            <Text style={styles.infoText}>Most correct answers wins</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoNumberBadge}>
              <Text style={styles.infoNumber}>2</Text>
            </View>
            <Text style={styles.infoText}>
              If tied, fastest total time wins
            </Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoNumberBadge}>
              <Text style={styles.infoNumber}>3</Text>
            </View>
            <Text style={styles.infoText}>If still tied, it's a draw</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.playAgainButton}
          onPress={() => {
            // Navigate to Home, which brings user to the Battle tab
            navigation.navigate('Home' as never);
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={gradients.secondary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.playAgainGradient}
          >
            <MaterialCommunityIcons name="sword-cross" size={18} color={colors.textInverse} style={{ marginRight: spacing.sm }} />
            <Text style={styles.playAgainText}>Play Again</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('Home' as never)}
          activeOpacity={0.8}
        >
          <Ionicons name="home" size={18} color={colors.textPrimary} style={{ marginRight: spacing.sm }} />
          <Text style={styles.homeButtonText}>Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    ...typography.h2,
    color: colors.danger,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxl,
  },
  scrollContent: {
    padding: spacing.xl,
    paddingTop: 60,
    paddingBottom: 100,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  resultIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  resultText: {
    ...typography.h1,
    fontSize: 36,
  },
  resultSubtext: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  scoreCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  sectionTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  playerColumn: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.background,
  },
  winnerColumn: {
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  loserColumn: {
    opacity: 0.7,
  },
  playerLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  playerScore: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  playerSubtext: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  vsContainer: {
    marginHorizontal: spacing.md,
  },
  vsText: {
    ...typography.h3,
    color: colors.textTertiary,
  },
  timeComparisonContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  timeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timeLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  timeValue: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statItem: {
    width: '47%',
    padding: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  statValue: {
    ...typography.stat,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  eloCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  eloChange: {
    alignItems: 'center',
  },
  eloLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  eloValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  oldElo: {
    ...typography.h2,
    fontSize: 22,
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  eloChangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    gap: spacing.xs,
  },
  eloChangeValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  newElo: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  divisionChange: {
    marginTop: spacing.xl,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.gold,
    overflow: 'hidden',
  },
  divisionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  divisionChangeTitle: {
    ...typography.subtitle,
    fontWeight: '800',
    color: colors.textInverse,
    textAlign: 'center',
  },
  divisionFlow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.goldLight,
  },
  divisionOld: {
    ...typography.subtitle,
    color: colors.textTertiary,
  },
  divisionNew: {
    ...typography.title,
    fontSize: 18,
    color: colors.gold,
  },
  infoCard: {
    backgroundColor: colors.secondaryLight,
    borderRadius: radii.md,
    padding: spacing.lg,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.secondaryDark,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  infoNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: radii.full,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoNumber: {
    ...typography.label,
    color: colors.textInverse,
    textTransform: 'none',
    fontSize: 12,
    fontWeight: '800',
  },
  infoText: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.secondaryDark,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    paddingBottom: 30,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    gap: spacing.md,
  },
  playAgainButton: {
    flex: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
    ...shadows.secondaryButton,
  },
  playAgainGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: radii.md,
  },
  playAgainText: {
    color: colors.textInverse,
    ...typography.button,
  },
  homeButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  homeButtonText: {
    color: colors.textPrimary,
    ...typography.buttonSmall,
  },
});

export default MatchResultsScreen;
