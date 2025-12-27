import React, { useState, useEffect } from 'react';
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
import { Language } from '../types';
import { api } from '../services/api';

const BattleModeScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { mode } = route.params as { mode: 'RANKED' | 'CASUAL' };
  const [languageStats, setLanguageStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [searching, setSearching] = useState(false);

  const LANGUAGE_INFO = {
    PORTUGUESE: { name: 'Portuguese', flag: '🇧🇷', color: '#009739' },
    SPANISH: { name: 'Spanish', flag: '🇪🇸', color: '#C60B1E' },
    ENGLISH: { name: 'English', flag: '🇺🇸', color: '#3C3B6E' },
    ITALIAN: { name: 'Italian', flag: '🇮🇹', color: '#009246' },
    FRENCH: { name: 'French', flag: '🇫🇷', color: '#0055A4' },
    GERMAN: { name: 'German', flag: '🇩🇪', color: '#000000' },
    JAPANESE: { name: 'Japanese', flag: '🇯🇵', color: '#BC002D' },
    KOREAN: { name: 'Korean', flag: '🇰🇷', color: '#003478' },
  };

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

  const handleLanguageSelect = async (language: Language) => {
    setSelectedLanguage(language);
    setSearching(true);

    try {
      const response = await api.post('/match/find', {
        type: mode === 'RANKED' ? 'BATTLE' : 'CASUAL',
        language,
        isBattleMode: true,
      });

      if (response.data.data.matched) {
        // Match found immediately
        navigation.navigate('GameScreen' as never, {
          matchId: response.data.data.match.id,
          match: response.data.data.match,
        } as never);
      } else {
        // Waiting for opponent
        navigation.navigate('Matchmaking' as never, {
          language,
          mode: mode === 'RANKED' ? 'BATTLE' : 'CASUAL',
        } as never);
      }
    } catch (error: any) {
      console.error('Failed to join matchmaking:', error);
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to start matchmaking'
      );
      setSearching(false);
      setSelectedLanguage(null);
    }
  };

  const LanguageCard = ({ language }: { language: Language }) => {
    const info = LANGUAGE_INFO[language];
    const stats = getStatsForLanguage(language);
    const winRate =
      stats.totalMatches > 0
        ? ((stats.wins / stats.totalMatches) * 100).toFixed(1)
        : '0.0';
    const isSearching = searching && selectedLanguage === language;

    return (
      <TouchableOpacity
        style={[
          styles.languageCard,
          { borderLeftColor: info.color },
          isSearching && styles.languageCardSearching,
        ]}
        onPress={() => handleLanguageSelect(language)}
        disabled={searching}
        activeOpacity={0.7}
      >
        <View style={styles.languageHeader}>
          <Text style={styles.languageFlag}>{info.flag}</Text>
          <View style={styles.languageInfo}>
            <Text style={styles.languageName}>{info.name}</Text>
            <Text style={styles.languageSubtitle}>
              {stats.totalMatches} matches played
            </Text>
          </View>
          {isSearching && (
            <ActivityIndicator size="small" color={info.color} />
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>ELO</Text>
            <Text style={[styles.statValue, { color: info.color }]}>
              {stats.eloRating}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Division</Text>
            <Text style={styles.statValue}>{stats.division}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Win Rate</Text>
            <Text style={styles.statValue}>{winRate}%</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
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

      {/* Battle Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Battle Mode Rules</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📝</Text>
          <Text style={styles.infoText}>5 questions per match</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>⏱️</Text>
          <Text style={styles.infoText}>45 seconds per question</Text>
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
      </View>

      {/* Language Selection */}
      <ScrollView style={styles.languageList}>
        <Text style={styles.sectionTitle}>Select Language</Text>
        {Object.keys(LANGUAGE_INFO).map((lang) => (
          <LanguageCard key={lang} language={lang as Language} />
        ))}
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
  languageList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  languageCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  languageCardSearching: {
    opacity: 0.7,
  },
  languageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  languageFlag: {
    fontSize: 36,
    marginRight: 12,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  languageSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default BattleModeScreen;
