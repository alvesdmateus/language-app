import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { matchService } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';

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
      <Text style={styles.title}>Matchmaking</Text>

      {!connected && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>⚠️ Connecting to server...</Text>
        </View>
      )}

      {!searching && !routeMode ? (
        <>
          <Text style={styles.subtitle}>Choose your game mode</Text>

          <TouchableOpacity
            style={[styles.button, styles.rankedButton]}
            onPress={() => findMatch('RANKED')}
            disabled={!connected}
          >
            <Text style={styles.buttonTitle}>Ranked Match</Text>
            <Text style={styles.buttonSubtitle}>Compete for ELO rating</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.casualButton]}
            onPress={() => findMatch('CASUAL')}
            disabled={!connected}
          >
            <Text style={styles.buttonTitle}>Casual Match</Text>
            <Text style={styles.buttonSubtitle}>Practice without pressure</Text>
          </TouchableOpacity>
        </>
      ) : searching || routeMode ? (
        <View style={styles.searchingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.searchingText}>
            Searching for {matchType?.toLowerCase()} opponent...
          </Text>

          {lobbyStatus && (
            <View style={styles.lobbyInfo}>
              <Text style={styles.lobbyText}>
                Players in lobby: {lobbyStatus.totalPlayers}
              </Text>
              <Text style={styles.lobbyText}>
                {matchType === 'RANKED' ? 'Ranked' : 'Casual'}: {' '}
                {matchType === 'RANKED' ? lobbyStatus.rankedPlayers : lobbyStatus.casualPlayers}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.cancelButton} onPress={handleCancelSearch}>
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
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningText: {
    color: '#856404',
    textAlign: 'center',
    fontSize: 14,
  },
  button: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  rankedButton: {
    backgroundColor: '#FF3B30',
  },
  casualButton: {
    backgroundColor: '#34C759',
  },
  buttonTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  buttonSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  searchingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  searchingText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#007AFF',
    marginTop: 20,
    fontWeight: '600',
  },
  lobbyInfo: {
    marginTop: 30,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
  },
  lobbyText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 40,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MatchmakingScreen;
