import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { matchService } from '../services/api';
import { Match, MatchResult, User, Language, MatchType } from '../types';
import { useAuth } from '../context/AuthContext';
import { LANGUAGE_INFO } from '../theme/languages';
import { colors, gradients, spacing, radii, shadows, typography } from '../theme';

interface MatchWithResults extends Match {
  results: (MatchResult & { user: User })[];
}

type TabType = 'all' | 'active' | 'completed';

const MatchHistoryScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [matches, setMatches] = useState<{
    activeMatches: MatchWithResults[];
    completedMatches: MatchWithResults[];
    allMatches: MatchWithResults[];
  }>({
    activeMatches: [],
    completedMatches: [],
    allMatches: [],
  });

  const fetchMatches = async () => {
    try {
      const response = await matchService.getUserMatches();
      setMatches(response.data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMatches();
  };

  const getDisplayedMatches = () => {
    switch (activeTab) {
      case 'active':
        return matches.activeMatches;
      case 'completed':
        return matches.completedMatches;
      default:
        return matches.allMatches;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getMatchTypeColor = (type: MatchType) => {
    switch (type) {
      case 'RANKED':
        return colors.ranked;
      case 'BATTLE':
        return colors.battle;
      case 'CASUAL':
        return colors.casual;
      case 'CUSTOM':
        return colors.purple;
      default:
        return colors.textTertiary;
    }
  };

  const getMatchTypeIconName = (type: MatchType): { name: string; lib: 'ion' | 'mci' } => {
    switch (type) {
      case 'RANKED':
        return { name: 'trophy', lib: 'ion' };
      case 'BATTLE':
        return { name: 'sword-cross', lib: 'mci' };
      case 'CASUAL':
        return { name: 'game-controller', lib: 'ion' };
      case 'CUSTOM':
        return { name: 'settings', lib: 'ion' };
      default:
        return { name: 'ellipse', lib: 'ion' };
    }
  };

  const getLanguageFlag = (language: Language) => {
    return LANGUAGE_INFO[language]?.flag || '';
  };

  const getMatchOutcome = (match: MatchWithResults) => {
    if (match.status !== 'COMPLETED') {
      return { text: 'In Progress', color: colors.accent, iconName: 'time-outline' as const };
    }

    const userResult = match.results.find((r) => r.userId === user?.id);
    if (!userResult) {
      return { text: 'Unknown', color: colors.textTertiary, iconName: 'help-circle-outline' as const };
    }

    const sortedResults = [...match.results].sort((a, b) => {
      if (b.correctAnswers !== a.correctAnswers) {
        return b.correctAnswers - a.correctAnswers;
      }
      return a.totalTimeMs - b.totalTimeMs;
    });

    const winnerResult = sortedResults[0];
    const isDraw =
      sortedResults.length > 1 &&
      sortedResults[0].correctAnswers === sortedResults[1].correctAnswers &&
      sortedResults[0].totalTimeMs === sortedResults[1].totalTimeMs;

    if (isDraw) {
      return { text: 'Draw', color: colors.accent, iconName: 'handshake' as const };
    }

    if (winnerResult.userId === user?.id) {
      return { text: 'Victory', color: colors.primary, iconName: 'trophy' as const };
    }

    return { text: 'Defeat', color: colors.danger, iconName: 'sad-outline' as const };
  };

  const renderMatchCard = (match: MatchWithResults) => {
    const outcome = getMatchOutcome(match);
    const opponent = match.participants.find((p) => p.id !== user?.id);
    const userResult = match.results.find((r) => r.userId === user?.id);
    const opponentResult = match.results.find((r) => r.userId !== user?.id);
    const matchTypeIcon = getMatchTypeIconName(match.type);

    return (
      <TouchableOpacity
        key={match.id}
        style={[
          styles.matchCard,
          match.status === 'IN_PROGRESS' && styles.activeMatchCard,
        ]}
        onPress={() => {
          if (match.status === 'IN_PROGRESS' && match.isAsync && !userResult) {
            navigation.navigate('GameScreen' as never, { matchId: match.id, match } as never);
          }
        }}
        activeOpacity={0.7}
      >
        {/* Match Header */}
        <View style={styles.matchHeader}>
          <View style={styles.matchTypeContainer}>
            {matchTypeIcon.lib === 'ion' ? (
              <Ionicons name={matchTypeIcon.name as any} size={18} color={getMatchTypeColor(match.type)} />
            ) : (
              <MaterialCommunityIcons name={matchTypeIcon.name as any} size={18} color={getMatchTypeColor(match.type)} />
            )}
            <Text
              style={[styles.matchType, { color: getMatchTypeColor(match.type) }]}
            >
              {match.type}
            </Text>
            {match.isAsync && (
              <View style={styles.asyncBadge}>
                <Text style={styles.asyncText}>ASYNC</Text>
              </View>
            )}
          </View>
          <Text style={styles.languageFlag}>{getLanguageFlag(match.language)}</Text>
        </View>

        {/* Match Outcome */}
        <View style={styles.outcomeContainer}>
          {outcome.iconName === 'handshake' ? (
            <MaterialCommunityIcons name="handshake" size={24} color={outcome.color} />
          ) : (
            <Ionicons name={outcome.iconName as any} size={24} color={outcome.color} />
          )}
          <Text style={[styles.outcomeText, { color: outcome.color }]}>
            {outcome.text}
          </Text>
        </View>

        {/* Match Details */}
        <View style={styles.matchDetails}>
          <View style={styles.playerRow}>
            <Text style={styles.playerName}>You</Text>
            <Text style={styles.playerScore}>
              {userResult ? `${userResult.correctAnswers} correct` : '-'}
            </Text>
          </View>
          <View style={styles.vsLine}>
            <View style={styles.vsDivider} />
            <Text style={styles.vsText}>VS</Text>
            <View style={styles.vsDivider} />
          </View>
          <View style={styles.playerRow}>
            <Text style={styles.playerName}>
              {opponent?.displayName || opponent?.username || 'Opponent'}
            </Text>
            <Text style={styles.playerScore}>
              {opponentResult ? `${opponentResult.correctAnswers} correct` : '-'}
            </Text>
          </View>
        </View>

        {/* ELO Change for completed ranked/battle matches */}
        {match.status === 'COMPLETED' &&
          (match.type === 'RANKED' || match.type === 'BATTLE') &&
          userResult?.eloChange !== undefined && (
            <View style={styles.eloContainer}>
              <Text style={styles.eloLabel}>ELO Change:</Text>
              <View style={styles.eloChangeRow}>
                <Ionicons
                  name={userResult.eloChange >= 0 ? 'arrow-up' : 'arrow-down'}
                  size={16}
                  color={userResult.eloChange >= 0 ? colors.primary : colors.danger}
                />
                <Text
                  style={[
                    styles.eloChange,
                    {
                      color: userResult.eloChange >= 0 ? colors.primary : colors.danger,
                    },
                  ]}
                >
                  {userResult.eloChange >= 0 ? '+' : ''}
                  {userResult.eloChange}
                </Text>
              </View>
            </View>
          )}

        {/* Match Date */}
        <Text style={styles.matchDate}>
          {match.endedAt
            ? `Ended ${formatDate(match.endedAt)}`
            : `Started ${formatDate(match.startedAt || match.createdAt)}`}
        </Text>

        {/* Action prompt for async matches */}
        {match.status === 'IN_PROGRESS' && match.isAsync && !userResult && (
          <View style={styles.actionPrompt}>
            <Ionicons name="play-circle" size={16} color={colors.accent} />
            <Text style={styles.actionPromptText}>Tap to play your turn</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.danger} />
        <Text style={styles.loadingText}>Loading match history...</Text>
      </View>
    );
  }

  const displayedMatches = getDisplayedMatches();

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={gradients.ranked} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Match History</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All ({matches.allMatches.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text
            style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}
          >
            Active ({matches.activeMatches.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'completed' && styles.activeTabText,
            ]}
          >
            Completed ({matches.completedMatches.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Match List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {displayedMatches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name={activeTab === 'active' ? 'time-outline' : 'bar-chart-outline'}
              size={64}
              color={colors.textTertiary}
            />
            <Text style={styles.emptyTitle}>No matches found</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'active'
                ? 'You have no active matches at the moment'
                : activeTab === 'completed'
                ? 'You have no completed matches yet'
                : 'Start playing to build your match history!'}
            </Text>
          </View>
        ) : (
          displayedMatches.map(renderMatchCard)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    ...typography.body,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: spacing.xl,
  },
  backButton: {
    padding: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.textInverse,
  },
  placeholder: {
    width: 60,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.danger,
  },
  tabText: {
    ...typography.buttonSmall,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.textInverse,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  matchCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  activeMatchCard: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  matchTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  matchType: {
    ...typography.buttonSmall,
  },
  asyncBadge: {
    marginLeft: spacing.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radii.sm / 2,
  },
  asyncText: {
    ...typography.label,
    fontSize: 10,
    color: colors.textInverse,
  },
  languageFlag: {
    fontSize: 24,
  },
  outcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  outcomeText: {
    ...typography.title,
    fontSize: 18,
  },
  matchDetails: {
    marginBottom: spacing.md,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  playerName: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  playerScore: {
    ...typography.bodySmall,
  },
  vsLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  vsDivider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  vsText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textTertiary,
    marginHorizontal: spacing.sm,
  },
  eloContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: spacing.sm,
  },
  eloLabel: {
    ...typography.bodySmall,
    marginRight: spacing.sm,
  },
  eloChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  eloChange: {
    ...typography.title,
  },
  matchDate: {
    ...typography.caption,
    textAlign: 'center',
  },
  actionPrompt: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.accentLight,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  actionPromptText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.accent,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    ...typography.h3,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MatchHistoryScreen;
