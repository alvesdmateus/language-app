import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { matchService } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';

const MatchmakingScreen = () => {
  const [searching, setSearching] = useState(false);
  const [matchType, setMatchType] = useState<'RANKED' | 'CASUAL' | null>(null);
  const [lobbyStatus, setLobbyStatus] = useState<any>(null);
  const { socket, connected, joinMatchmaking, leaveMatchmaking } = useWebSocket();

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
      Alert.alert(
        'Match Found!',
        `Starting ${data.matchType} match against ${data.participants.find((p: any) => p.id !== socket.id)?.displayName || 'opponent'}`,
        [
          {
            text: 'Start Match',
            onPress: () => {
              // Navigate to match screen (to be implemented)
              console.log('Starting match:', data.matchId);
            },
          },
        ]
      );
    });

    socket.on('matchmaking:left', () => {
      setSearching(false);
      setMatchType(null);
      setLobbyStatus(null);
    });

    return () => {
      socket.off('matchmaking:joined');
      socket.off('matchmaking:lobby_update');
      socket.off('matchmaking:match_found');
      socket.off('matchmaking:left');
    };
  }, [socket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searching) {
        handleCancelSearch();
      }
    };
  }, [searching]);

  const findMatch = async (type: 'RANKED' | 'CASUAL') => {
    try {
      setSearching(true);
      setMatchType(type);

      // Join via WebSocket
      joinMatchmaking(type);

      // Also call API to register in lobby
      const response = await matchService.findMatch(type);

      // If match is immediately found
      if (response.data.matched) {
        setSearching(false);
        setMatchType(null);
        Alert.alert('Match Found!', 'Starting match...');
      }
    } catch (error) {
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
      setLobbyStatus(null);
    } catch (error) {
      console.error('Failed to leave matchmaking:', error);
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

      {!searching ? (
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
      ) : (
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
      )}
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
