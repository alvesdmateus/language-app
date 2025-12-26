import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { matchService } from '../services/api';

const MatchmakingScreen = () => {
  const [searching, setSearching] = useState(false);

  const findMatch = async (type: 'RANKED' | 'CASUAL') => {
    try {
      setSearching(true);
      const response = await matchService.findMatch(type);
      Alert.alert('Match Found!', 'Starting match...');
    } catch (error) {
      Alert.alert('Error', 'Failed to find match');
    } finally {
      setSearching(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Matchmaking</Text>
      <Text style={styles.subtitle}>Choose your game mode</Text>

      <TouchableOpacity
        style={[styles.button, styles.rankedButton]}
        onPress={() => findMatch('RANKED')}
        disabled={searching}
      >
        <Text style={styles.buttonTitle}>Ranked Match</Text>
        <Text style={styles.buttonSubtitle}>Compete for ELO rating</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.casualButton]}
        onPress={() => findMatch('CASUAL')}
        disabled={searching}
      >
        <Text style={styles.buttonTitle}>Casual Match</Text>
        <Text style={styles.buttonSubtitle}>Practice without pressure</Text>
      </TouchableOpacity>

      {searching && <Text style={styles.searchingText}>Searching for opponent...</Text>}
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
  searchingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#007AFF',
    marginTop: 20,
  },
});

export default MatchmakingScreen;
