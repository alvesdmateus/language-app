import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Language } from '../../types';
import { api } from '../../services/api';
import LanguageSelector from '../../components/LanguageSelector';

type BattleMode = 'RANKED' | 'CASUAL';

const BattleModeTab = () => {
  const navigation = useNavigation();
  const [selectedMode, setSelectedMode] = useState<BattleMode>('RANKED');
  const [languageStats, setLanguageStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
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
        type: selectedMode === 'RANKED' ? 'BATTLE' : 'CASUAL',
        language,
        isBattleMode: true,
        isAsync,
      });

      const response = await api.post('/match/find', {
        type: selectedMode === 'RANKED' ? 'BATTLE' : 'CASUAL',
        language,
        isBattleMode: true,
        isAsync,
      });

      console.log('Matchmaking response:', response.data);

      if (response.data.data.matched) {
        console.log('Match found immediately, navigating to GameScreen');
        navigation.navigate('GameScreen' as never, {
          matchId: response.data.data.match.id,
          match: response.data.data.match,
        } as never);
      } else {
        console.log('No immediate match, navigating to Matchmaking screen');
        navigation.navigate('Matchmaking' as never, {
          language,
          mode: selectedMode === 'RANKED' ? 'BATTLE' : 'CASUAL',
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
    } finally {
      setSearching(false);
      setSelectedLanguage(null);
    }
  };

  const ModeSelector = () => (
    <View style={styles.modeSelector}>
      <TouchableOpacity
        style={[
          styles.modeButton,
          selectedMode === 'RANKED' && styles.modeButtonActive,
        ]}
        onPress={() => setSelectedMode('RANKED')}
        disabled={searching}
      >
        <Text style={styles.modeIcon}>⚔️</Text>
        <Text
          style={[
            styles.modeButtonText,
            selectedMode === 'RANKED' && styles.modeButtonTextActive,
          ]}
        >
          Ranked
        </Text>
        <Text style={styles.modeSubtext}>ELO rating affected</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.modeButton,
          selectedMode === 'CASUAL' && styles.modeButtonActive,
        ]}
        onPress={() => setSelectedMode('CASUAL')}
        disabled={searching}
      >
        <Text style={styles.modeIcon}>🎮</Text>
        <Text
          style={[
            styles.modeButtonText,
            selectedMode === 'CASUAL' && styles.modeButtonTextActive,
          ]}
        >
          Casual
        </Text>
        <Text style={styles.modeSubtext}>Practice mode</Text>
      </TouchableOpacity>
    </View>
  );


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ModeSelector />

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
          <Text style={styles.infoIcon}>🏆</Text>
          <Text style={styles.infoText}>Winner: Most accurate, then fastest</Text>
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

      <View style={styles.languageSelector}>
        <Text style={styles.sectionTitle}>Select Language</Text>
        <LanguageSelector
          selectedLanguage={selectedLanguage}
          onSelectLanguage={handleLanguageSelect}
          disabled={searching}
          languageStats={getLanguageStatsRecord()}
          showStats={true}
          navigation={navigation}
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
  modeSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modeButton: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  modeButtonActive: {
    backgroundColor: '#FFF0F0',
    borderColor: '#FF3B30',
  },
  modeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  modeButtonTextActive: {
    color: '#FF3B30',
  },
  modeSubtext: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 20,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
  },
  languageSelector: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  matchTypeCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchTypeTitle: {
    fontSize: 14,
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
    padding: 12,
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
    fontSize: 28,
    marginBottom: 6,
  },
  toggleIconActive: {
    // Active state handled by parent
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 3,
  },
  toggleTextActive: {
    color: '#4A90E2',
  },
  toggleSubtext: {
    fontSize: 10,
    color: '#999',
  },
  toggleSubtextActive: {
    color: '#4A90E2',
  },
});

export default BattleModeTab;
