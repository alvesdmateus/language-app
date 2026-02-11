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
import { useNavigation } from '@react-navigation/native';
import { matchService } from '../services/api';
import { Match, MatchResult, User, Language, MatchType } from '../types';
import { useAuth } from '../context/AuthContext';

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
        return '#FF3B30';
      case 'BATTLE':
        return '#FF9500';
      case 'CASUAL':
        return '#34C759';
      case 'CUSTOM':
        return '#5856D6';
      default:
        return '#8E8E93';
    }
  };

  const getMatchTypeIcon = (type: MatchType) => {
    switch (type) {
      case 'RANKED':
        return '🏆';
      case 'BATTLE':
        return '⚔️';
      case 'CASUAL':
        return '🎮';
      case 'CUSTOM':
        return '⚙️';
      default:
        return '🎯';
    }
  };

  const getLanguageFlag = (language: Language) => {
    const flags: Record<Language, string> = {
      PORTUGUESE: '🇧🇷',
      SPANISH: '🇪🇸',
      ENGLISH: '🇬🇧',
      ITALIAN: '🇮🇹',
      FRENCH: '🇫🇷',
      GERMAN: '🇩🇪',
      JAPANESE: '🇯🇵',
      KOREAN: '🇰🇷',
    };
    return flags[language] || '🌍';
  };

  const getMatchOutcome = (match: MatchWithResults) => {
    if (match.status !== 'COMPLETED') {
      return { text: 'In Progress', color: '#FF9500', icon: '⏳' };
    }

    const userResult = match.results.find((r) => r.userId === user?.id);
    if (!userResult) {
      return { text: 'Unknown', color: '#8E8E93', icon: '❓' };
    }

    // Sort results by score, then by time
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
      return { text: 'Draw', color: '#FF9500', icon: '🤝' };
    }

    if (winnerResult.userId === user?.id) {
      return { text: 'Victory', color: '#34C759', icon: '🏆' };
    }

    return { text: 'Defeat', color: '#FF3B30', icon: '😔' };
  };

  const renderMatchCard = (match: MatchWithResults) => {
    const outcome = getMatchOutcome(match);
    const opponent = match.participants.find((p) => p.id !== user?.id);
    const userResult = match.results.find((r) => r.userId === user?.id);
    const opponentResult = match.results.find((r) => r.userId !== user?.id);

    return (
      <TouchableOpacity
        key={match.id}
        style={[
          styles.matchCard,
          match.status === 'IN_PROGRESS' && styles.activeMatchCard,
        ]}
        onPress={() => {
          if (match.status === 'IN_PROGRESS' && match.isAsync && !userResult) {
            // Navigate to game screen for async matches
            navigation.navigate('GameScreen' as never, { matchId: match.id, match } as never);
          }
          // For completed matches, could navigate to detailed view if needed
        }}
      >
        {/* Match Header */}
        <View style={styles.matchHeader}>
          <View style={styles.matchTypeContainer}>
            <Text style={styles.matchTypeIcon}>{getMatchTypeIcon(match.type)}</Text>
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
          <Text style={styles.outcomeIcon}>{outcome.icon}</Text>
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
              <Text
                style={[
                  styles.eloChange,
                  {
                    color: userResult.eloChange >= 0 ? '#34C759' : '#FF3B30',
                  },
                ]}
              >
                {userResult.eloChange >= 0 ? '+' : ''}
                {userResult.eloChange}
              </Text>
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
            <Text style={styles.actionPromptText}>Tap to play your turn</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3B30" />
        <Text style={styles.loadingText}>Loading match history...</Text>
      </View>
    );
  }

  const displayedMatches = getDisplayedMatches();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Match History</Text>
        <View style={styles.placeholder} />
      </View>

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
            <Text style={styles.emptyIcon}>
              {activeTab === 'active' ? '⏳' : '📊'}
            </Text>
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
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 60,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FF3B30',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  matchCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeMatchCard: {
    borderWidth: 2,
    borderColor: '#FF9500',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchTypeIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  matchType: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  asyncBadge: {
    marginLeft: 8,
    backgroundColor: '#FF9500',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  asyncText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  languageFlag: {
    fontSize: 24,
  },
  outcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  outcomeIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  outcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  matchDetails: {
    marginBottom: 12,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  playerScore: {
    fontSize: 14,
    color: '#666',
  },
  vsLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  vsDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  vsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    marginHorizontal: 8,
  },
  eloContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginBottom: 8,
  },
  eloLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 8,
  },
  eloChange: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  matchDate: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  actionPrompt: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  actionPromptText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9500',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MatchHistoryScreen;
