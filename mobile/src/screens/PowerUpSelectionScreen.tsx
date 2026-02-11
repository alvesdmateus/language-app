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
import { useNavigation, useRoute } from '@react-navigation/native';
import { PowerUpType, MatchType, Language } from '../types';
import { matchService } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';

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
      icon: '❄️',
      color: '#4FC3F7',
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
      icon: '🔥',
      color: '#FF6B6B',
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
      icon: '⭕',
      color: '#9E9E9E',
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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Power-Up</Text>
        <Text style={styles.headerSubtitle}>
          Choose your strategy for this match
        </Text>
      </View>

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
                { borderColor: isSelected ? powerUp.color : '#e0e0e0' }
              ]}
              onPress={() => handlePowerUpSelect(powerUp.type)}
              activeOpacity={0.7}
            >
              {/* Power-Up Header */}
              <View style={styles.powerUpHeader}>
                <Text style={styles.powerUpIcon}>{powerUp.icon}</Text>
                <View style={styles.powerUpTitleContainer}>
                  <Text style={[styles.powerUpName, isSelected && { color: powerUp.color }]}>
                    {powerUp.name}
                  </Text>
                  <Text style={styles.powerUpDescription}>{powerUp.description}</Text>
                </View>
                {isSelected && (
                  <View style={[styles.selectedBadge, { backgroundColor: powerUp.color }]}>
                    <Text style={styles.selectedBadgeText}>✓</Text>
                  </View>
                )}
              </View>

              {/* Details */}
              <View style={styles.detailsContainer}>
                {powerUp.details.map((detail, index) => (
                  <View key={index} style={styles.detailRow}>
                    <Text style={styles.detailBullet}>•</Text>
                    <Text style={styles.detailText}>{detail}</Text>
                  </View>
                ))}
              </View>

              {/* Pros & Cons */}
              {isSelected && (
                <View style={styles.prosConsContainer}>
                  <View style={styles.prosContainer}>
                    <Text style={styles.prosTitle}>✅ Pros:</Text>
                    {powerUp.pros.map((pro, index) => (
                      <Text key={index} style={styles.prosText}>• {pro}</Text>
                    ))}
                  </View>
                  <View style={styles.consContainer}>
                    <Text style={styles.consTitle}>⚠️ Cons:</Text>
                    {powerUp.cons.map((con, index) => (
                      <Text key={index} style={styles.consText}>• {con}</Text>
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
        <Text style={styles.infoTitle}>ℹ️ How Power-Ups Work</Text>
        <Text style={styles.infoText}>
          • Power-ups activate during matches{'\n'}
          • Each power-up has a 60-second cooldown{'\n'}
          • Freeze and Burn can cancel each other{'\n'}
          • Strategic timing is key!
        </Text>
      </View>

      {/* Start Button */}
      <TouchableOpacity
        style={[
          styles.startButton,
          selectedPowerUpData && { backgroundColor: selectedPowerUpData.color },
          isSearching && styles.startButtonDisabled,
        ]}
        onPress={handleStartMatch}
        disabled={isSearching}
      >
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="white" size="small" />
            <Text style={styles.startButtonText}>Finding Match...</Text>
          </View>
        ) : (
          <Text style={styles.startButtonText}>
            {selectedPowerUp === PowerUpType.NONE
              ? 'Start Match (No Power-Up)'
              : `Start Match with ${selectedPowerUpData?.icon} ${selectedPowerUpData?.name}`}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  powerUpsContainer: {
    padding: 20,
    gap: 16,
  },
  powerUpCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  powerUpCardSelected: {
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  powerUpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  powerUpIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  powerUpTitleContainer: {
    flex: 1,
  },
  powerUpName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  powerUpDescription: {
    fontSize: 13,
    color: '#666',
  },
  selectedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedBadgeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailsContainer: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailBullet: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  prosConsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  prosContainer: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
  },
  prosTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  prosText: {
    fontSize: 12,
    color: '#2E7D32',
    marginLeft: 4,
  },
  consContainer: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
  },
  consTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 4,
  },
  consText: {
    fontSize: 12,
    color: '#E65100',
    marginLeft: 4,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 20,
  },
  startButton: {
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  startButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PowerUpSelectionScreen;
