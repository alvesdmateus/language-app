import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MatchCompletedEvent } from '../types';
import { useAuth } from '../context/AuthContext';

const MatchResultsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { matchId, result } = route.params as {
    matchId: string;
    result: MatchCompletedEvent;
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

  const isWinner = result.winnerId === user?.id;
  const isLoser = result.winnerId && result.winnerId !== user?.id;
  const isDraw = result.isDraw;

  const userResult = result.results.find((r) => r.userId === user?.id);
  const opponentResult = result.results.find((r) => r.userId !== user?.id);

  const userEloChange = result.eloChanges?.find((e) => e.id === user?.id);
  const userDivisionChange = result.divisionChanges?.find((d) => d.userId === user?.id);

  const getResultStatus = () => {
    if (isDraw) return { text: 'Draw!', emoji: '🤝', color: '#FF9500' };
    if (isWinner) return { text: 'Victory!', emoji: '🏆', color: '#34C759' };
    return { text: 'Defeat', emoji: '😔', color: '#FF3B30' };
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
          <Text style={styles.resultEmoji}>{status.emoji}</Text>
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
              <Text style={styles.timeLabel}>Your Time:</Text>
              <Text style={styles.timeValue}>
                {formatTime(userResult?.totalTimeMs || 0)}
              </Text>
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Opponent Time:</Text>
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
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>✅</Text>
              <Text style={styles.statValue}>{userResult?.correctAnswers || 0}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>⏱️</Text>
              <Text style={styles.statValue}>
                {formatTime(userResult?.totalTimeMs || 0)}
              </Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>⭐</Text>
              <Text style={styles.statValue}>{userResult?.score || 0}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>📊</Text>
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
                <Text
                  style={[
                    styles.eloChangeValue,
                    {
                      color: userEloChange.change >= 0 ? '#34C759' : '#FF3B30',
                    },
                  ]}
                >
                  {userEloChange.change >= 0 ? '+' : ''}
                  {userEloChange.change}
                </Text>
                <Text style={styles.newElo}>{userEloChange.newRating}</Text>
              </View>
            </View>

            {userDivisionChange && (
              <View style={styles.divisionChange}>
                <Text style={styles.divisionChangeTitle}>🎉 Division Promoted!</Text>
                <View style={styles.divisionFlow}>
                  <Text style={styles.divisionOld}>
                    {userDivisionChange.oldDivision}
                  </Text>
                  <Text style={styles.divisionArrow}>→</Text>
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
          <Text style={styles.infoTitle}>How Winners Are Determined</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoNumber}>1.</Text>
            <Text style={styles.infoText}>Most correct answers wins</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoNumber}>2.</Text>
            <Text style={styles.infoText}>
              If tied, fastest total time wins
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoNumber}>3.</Text>
            <Text style={styles.infoText}>If still tied, it's a draw</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.playAgainButton}
          onPress={() => {
            navigation.navigate('BattleMode' as never, { mode: 'RANKED' } as never);
          }}
        >
          <Text style={styles.playAgainText}>⚔️ Play Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('Home' as never)}
        >
          <Text style={styles.homeButtonText}>🏠 Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  resultText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  resultSubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  scoreCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  playerColumn: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  winnerColumn: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#34C759',
  },
  loserColumn: {
    opacity: 0.7,
  },
  playerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  playerScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  playerSubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  vsContainer: {
    marginHorizontal: 12,
  },
  vsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#999',
  },
  timeComparisonContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  eloCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  eloChange: {
    alignItems: 'center',
  },
  eloLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  eloValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  oldElo: {
    fontSize: 24,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  eloChangeValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  newElo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  divisionChange: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  divisionChangeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  divisionFlow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  divisionOld: {
    fontSize: 16,
    color: '#999',
  },
  divisionArrow: {
    fontSize: 20,
    color: '#FFD700',
  },
  divisionNew: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginRight: 8,
    width: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1976D2',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 30,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    flexDirection: 'row',
    gap: 12,
  },
  playAgainButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playAgainText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  homeButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  homeButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MatchResultsScreen;
