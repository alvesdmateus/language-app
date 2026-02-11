import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Language } from '../types';
import { api } from '../services/api';
import LanguageSelector from '../components/LanguageSelector';

const BattleModeScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { mode } = route.params as { mode: 'RANKED' | 'CASUAL' };
  const [languageStats, setLanguageStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [searching, setSearching] = useState(false);
  const [isAsync, setIsAsync] = useState(false);

  useEffect(() => {
    loadLanguageStats();
  }, []);

  const loadLanguageStats = async () => {
    try {
      const response = await api.get('/language-stats');
      setLanguageStats(response.data.data.stats || []);
    } catch (error) {
      console.error('Failed to load language stats:', error);
      Alert.alert('Error', 'Failed to load language statistics');
    } finally {
      setLoading(false);
    }
  };

  const getStatsForLanguage = (language: Language) => {
    return languageStats.find((s) => s.language === language) || {
      eloRating: 1000,
      division: 'BRONZE',
      totalMatches: 0,
      wins: 0,
      losses: 0,
      draws: 0,
    };
  };

  const getLanguageStatsRecord = () => {
    const statsRecord: Record<Language, any> = {} as Record<Language, any>;
    const languages: Language[] = ['PORTUGUESE', 'SPANISH', 'ENGLISH', 'ITALIAN', 'FRENCH', 'GERMAN', 'JAPANESE', 'KOREAN'];

    languages.forEach((lang) => {
      statsRecord[lang] = getStatsForLanguage(lang);
    });

    return statsRecord;
  };

  const handleLanguageSelect = async (language: Language) => {
    setSelectedLanguage(language);
    setSearching(true);

    try {
      console.log('Starting matchmaking with:', {
        type: mode === 'RANKED' ? 'BATTLE' : 'CASUAL',
        language,
        isBattleMode: true,
        isAsync,
      });

      const response = await api.post('/match/find', {
        type: mode === 'RANKED' ? 'BATTLE' : 'CASUAL',
        language,
        isBattleMode: true,
        isAsync,
      });

      console.log('Matchmaking response:', response.data);

      if (response.data.data.matched) {
        // Match found immediately
        console.log('Match found immediately, navigating to GameScreen');
        navigation.navigate('GameScreen' as never, {
          matchId: response.data.data.match.id,
          match: response.data.data.match,
        } as never);
      } else {
        // Waiting for opponent
        console.log('No immediate match, navigating to Matchmaking screen');
        navigation.navigate('Matchmaking' as never, {
          language,
          mode: mode === 'RANKED' ? 'BATTLE' : 'CASUAL',
        } as never);
      }
    } catch (error: any) {
      console.error('Failed to join matchmaking - Full error:', error);
      console.error('Error response:', error?.response?.data);
      console.error('Error status:', error?.response?.status);
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to start matchmaking. Check console for details.'
      );
      setSearching(false);
      setSelectedLanguage(null);
    }
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading language stats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          disabled={searching}
        >
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>
            {mode === 'RANKED' ? '⚔️' : '🎮'}
          </Text>
          <Text style={styles.headerTitle}>
            {mode === 'RANKED' ? 'Ranked Battle' : 'Casual Battle'}
          </Text>
          <Text style={styles.headerSubtitle}>
            Choose your language to begin
          </Text>
        </View>
      </View>

      {/* Match Type Selector */}
      <View style={styles.matchTypeCard}>
        <Text style={styles.matchTypeTitle}>Match Type</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, !isAsync && styles.toggleButtonActive]}
            onPress={() => setIsAsync(false)}
            disabled={searching}
          >
            <Text style={[styles.toggleIcon, !isAsync && styles.toggleIconActive]}>⚡</Text>
            <Text style={[styles.toggleText, !isAsync && styles.toggleTextActive]}>
              Synchronous
            </Text>
            <Text style={[styles.toggleSubtext, !isAsync && styles.toggleSubtextActive]}>
              Real-time battle
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleButton, isAsync && styles.toggleButtonActive]}
            onPress={() => setIsAsync(true)}
            disabled={searching}
          >
            <Text style={[styles.toggleIcon, isAsync && styles.toggleIconActive]}>⏳</Text>
            <Text style={[styles.toggleText, isAsync && styles.toggleTextActive]}>
              Asynchronous
            </Text>
            <Text style={[styles.toggleSubtext, isAsync && styles.toggleSubtextActive]}>
              Take your time
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Battle Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Battle Mode Rules</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📝</Text>
          <Text style={styles.infoText}>5 questions per match</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>⏱️</Text>
          <Text style={styles.infoText}>
            {isAsync ? '24 hours to complete all questions' : '45 seconds per question'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🎯</Text>
          <Text style={styles.infoText}>
            {mode === 'RANKED'
              ? 'ELO rating will be affected'
              : 'Practice mode - no ELO changes'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🏆</Text>
          <Text style={styles.infoText}>
            Winner: Most accurate, then fastest
          </Text>
        </View>
        {isAsync && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🔔</Text>
            <Text style={styles.infoText}>
              Get notified when your opponent finishes
            </Text>
          </View>
        )}
      </View>

      {/* Language Selection */}
      <View style={styles.languageSelector}>
        <Text style={styles.sectionTitle}>Select Language</Text>
        <LanguageSelector
          selectedLanguage={selectedLanguage}
          onSelectLanguage={handleLanguageSelect}
          disabled={searching}
          languageStats={getLanguageStatsRecord()}
          showStats={true}
        />
      </View>
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
    backgroundColor: 'white',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    fontSize: 16,
    color: '#4A90E2',
    marginBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#666',
  },
  matchTypeCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchTypeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  toggleButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#4A90E2',
  },
  toggleIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  toggleIconActive: {
    // Active state handled by parent
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  toggleTextActive: {
    color: '#4A90E2',
  },
  toggleSubtext: {
    fontSize: 11,
    color: '#999',
  },
  toggleSubtextActive: {
    color: '#4A90E2',
  },
  infoCard: {
    backgroundColor: 'white',
    margin: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 10,
    width: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  languageSelector: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
});

export default BattleModeScreen;
