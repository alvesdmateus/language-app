import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import { matchService } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import { colors, gradients, spacing, radii, shadows, typography, commonStyles } from '../theme';

const MatchmakingScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { mode: routeMode, language } = (route.params as any) || {};
  const [searching, setSearching] = useState(false);
  const [matchType, setMatchType] = useState<'RANKED' | 'CASUAL' | 'BATTLE' | null>(routeMode || null);
  const [lobbyStatus, setLobbyStatus] = useState<any>(null);
  const [matchFound, setMatchFound] = useState(false); // Track if match was found
  const { socket, connected, joinMatchmaking, leaveMatchmaking } = useWebSocket();

  // Auto-start search if mode was passed from Battle tab
  // Note: We don't call findMatch here because the API was already called
  // from BattleModeTab. We just need to join the WebSocket room and wait for events.
  useEffect(() => {
    if (routeMode && connected && !searching) {
      console.log('Auto-starting matchmaking for:', routeMode, language);
      setSearching(true);
      setMatchType(routeMode);
      // Join via WebSocket only (API was already called from previous screen)
      joinMatchmaking(routeMode === 'BATTLE' ? 'RANKED' : routeMode);
    }
  }, [routeMode, connected]);

  useEffect(() => {
    if (!socket) return;

    // Listen for matchmaking events
    socket.on('matchmaking:joined', (data) => {
      console.log('Joined matchmaking:', data);
      setLobbyStatus(data.lobbyStatus);
    });

    socket.on('matchmaking:lobby_update', (data) => {
      console.log('Lobby update:', data);
      setLobbyStatus(data.lobbyStatus);
    });

    socket.on('matchmaking:match_found', (data) => {
      console.log('Match found!', data);
      setSearching(false);
      setMatchType(null);
      setMatchFound(true); // Mark that match was found

      // Use setTimeout to ensure navigation happens after current render cycle
      setTimeout(() => {
        console.log('Navigating to GameScreen with match:', data.matchId);
        navigation.navigate('GameScreen' as never, {
          matchId: data.matchId,
          match: data,
        } as never);
      }, 100);
    });

    socket.on('match:started', (data) => {
      console.log('Match started!', data);
      // Match has been confirmed to start - this event is received while already in GameScreen
    });

    socket.on('match:cancelled', (data) => {
      console.log('Match cancelled:', data.reason);
      setSearching(false);
      setMatchType(null);
      setMatchFound(false); // Reset match found state
      Alert.alert('Match Cancelled', data.reason || 'The match was cancelled');

      // Navigate back if requested
      if (data.canRequeue && navigation.canGoBack()) {
        navigation.goBack();
      }
    });

    socket.on('matchmaking:left', () => {
      setSearching(false);
      setMatchType(null);
      setMatchFound(false); // Reset match found state
      setLobbyStatus(null);
    });

    return () => {
      socket.off('matchmaking:joined');
      socket.off('matchmaking:lobby_update');
      socket.off('matchmaking:match_found');
      socket.off('match:started');
      socket.off('match:cancelled');
      socket.off('matchmaking:left');
    };
  }, [socket]);

  // Cleanup on unmount - only leave matchmaking if we didn't find a match
  useEffect(() => {
    return () => {
      if (searching && !matchFound) {
        handleCancelSearch();
      }
    };
  }, [searching, matchFound]);

  const findMatch = async (type: 'RANKED' | 'CASUAL' | 'BATTLE', lang?: string) => {
    try {
      setSearching(true);
      setMatchType(type);

      // Use provided language or default to SPANISH
      const selectedLanguage = lang || language || 'SPANISH';

      // Join via WebSocket
      joinMatchmaking(type === 'BATTLE' ? 'RANKED' : type);

      // Call API to register in lobby and potentially find immediate match
      const response = await matchService.findMatch(type, selectedLanguage);

      // If match is immediately found via API, the socket event will still be emitted
      // and handled by the socket listener, so no need to handle it here
    } catch (error) {
      console.error('Failed to join matchmaking:', error);
      Alert.alert('Error', 'Failed to join matchmaking');
      setSearching(false);
      setMatchType(null);
    }
  };

  const handleCancelSearch = async () => {
    try {
      leaveMatchmaking();
      await matchService.leaveLobby();
      setSearching(false);
      setMatchType(null);
      setMatchFound(false); // Reset match found state
      setLobbyStatus(null);

      // Navigate back to previous screen
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Failed to leave matchmaking:', error);
      // Still navigate back even if there's an error
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={gradients.secondary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <MaterialCommunityIcons name="sword-cross" size={28} color={colors.textInverse} />
        <Text style={styles.title}>Matchmaking</Text>
      </LinearGradient>

      {!connected && (
        <View style={styles.warningBox}>
          <Ionicons name="warning-outline" size={18} color="#856404" style={{ marginRight: spacing.sm }} />
          <Text style={styles.warningText}>Connecting to server...</Text>
        </View>
      )}

      {!searching && !routeMode ? (
        <>
          <Text style={styles.subtitle}>Choose your game mode</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => findMatch('RANKED')}
            disabled={!connected}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={gradients.ranked}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Ionicons name="trophy" size={24} color={colors.textInverse} style={{ marginRight: spacing.md }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.buttonTitle}>Ranked Match</Text>
                <Text style={styles.buttonSubtitle}>Compete for ELO rating</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={colors.textInverse} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => findMatch('CASUAL')}
            disabled={!connected}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={gradients.casual}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Ionicons name="game-controller" size={24} color={colors.textInverse} style={{ marginRight: spacing.md }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.buttonTitle}>Casual Match</Text>
                <Text style={styles.buttonSubtitle}>Practice without pressure</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={colors.textInverse} />
            </LinearGradient>
          </TouchableOpacity>
        </>
      ) : searching || routeMode ? (
        <View style={styles.searchingContainer}>
          <View style={styles.searchingPulse}>
            <MaterialCommunityIcons name="sword-cross" size={40} color={colors.secondary} />
          </View>
          <ActivityIndicator size="large" color={colors.secondary} style={{ marginTop: spacing.xl }} />
          <Text style={styles.searchingText}>
            Searching for {matchType?.toLowerCase()} opponent...
          </Text>

          {lobbyStatus && (
            <View style={styles.lobbyInfo}>
              <View style={styles.lobbyRow}>
                <Ionicons name="people" size={18} color={colors.textSecondary} />
                <Text style={styles.lobbyText}>
                  Players in lobby: {lobbyStatus.totalPlayers}
                </Text>
              </View>
              <View style={styles.lobbyRow}>
                <Ionicons
                  name={matchType === 'RANKED' ? 'trophy' : 'game-controller'}
                  size={18}
                  color={colors.textSecondary}
                />
                <Text style={styles.lobbyText}>
                  {matchType === 'RANKED' ? 'Ranked' : 'Casual'}:{' '}
                  {matchType === 'RANKED' ? lobbyStatus.rankedPlayers : lobbyStatus.casualPlayers}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelSearch} activeOpacity={0.8}>
            <Ionicons name="close-circle-outline" size={20} color={colors.textInverse} style={{ marginRight: spacing.sm }} />
            <Text style={styles.cancelButtonText}>Cancel Search</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingTop: 56,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.textInverse,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.xxxl,
  },
  warningBox: {
    backgroundColor: colors.goldLight,
    padding: spacing.md,
    borderRadius: radii.sm,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningText: {
    color: '#856404',
    textAlign: 'center',
    ...typography.bodySmall,
  },
  button: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
  },
  buttonTitle: {
    color: colors.textInverse,
    ...typography.h3,
  },
  buttonSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    ...typography.bodySmall,
    marginTop: spacing.xs,
  },
  searchingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  searchingPulse: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchingText: {
    textAlign: 'center',
    ...typography.title,
    color: colors.secondary,
    marginTop: spacing.xl,
  },
  lobbyInfo: {
    marginTop: spacing.xxxl,
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    width: '100%',
    ...shadows.sm,
    gap: spacing.md,
  },
  lobbyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  lobbyText: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: spacing.xxxl + spacing.sm,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.xxxl + spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.dangerButton,
  },
  cancelButtonText: {
    color: colors.textInverse,
    ...typography.button,
  },
});

export default MatchmakingScreen;
