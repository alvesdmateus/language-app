import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Language } from '../types';
import { api } from '../services/api';

const LanguageStatsScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [languageStats, setLanguageStats] = useState<any[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);

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
      setLanguageStats(response.data.stats || []);
    } catch (error) {
      console.error('Failed to load language stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLanguageStats();
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

  const LanguageCard = ({ language }: { language: Language }) => {
    const info = LANGUAGE_INFO[language];
    const stats = getStatsForLanguage(language);
    const winRate =
      stats.totalMatches > 0
        ? ((stats.wins / stats.totalMatches) * 100).toFixed(1)
        : '0.0';

    return (
      <TouchableOpacity
        style={[styles.languageCard, { borderLeftColor: info.color }]}
        onPress={() => setSelectedLanguage(selectedLanguage === language ? null : language)}
        activeOpacity={0.7}
      >
        <View style={styles.languageHeader}>
          <Text style={styles.languageFlag}>{info.flag}</Text>
          <View style={styles.languageInfo}>
            <Text style={styles.languageName}>{info.name}</Text>
            <Text style={styles.division}>
              {stats.divisionInfo?.displayName || stats.division}
            </Text>
          </View>
          <View style={styles.eloContainer}>
            <Text style={styles.eloLabel}>ELO</Text>
            <Text style={[styles.eloValue, { color: info.color }]}>
              {stats.eloRating}
            </Text>
          </View>
        </View>

        {selectedLanguage === language && (
          <View style={styles.expandedStats}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Matches</Text>
                <Text style={styles.statValue}>{stats.totalMatches}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Wins</Text>
                <Text style={[styles.statValue, { color: '#34C759' }]}>
                  {stats.wins}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Losses</Text>
                <Text style={[styles.statValue, { color: '#FF3B30' }]}>
                  {stats.losses}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Draws</Text>
                <Text style={[styles.statValue, { color: '#FF9500' }]}>
                  {stats.draws}
                </Text>
              </View>
            </View>

            <View style={styles.winRateContainer}>
              <Text style={styles.winRateLabel}>Win Rate</Text>
              <Text style={styles.winRateValue}>{winRate}%</Text>
            </View>

            <TouchableOpacity
              style={[styles.viewLeaderboardButton, { backgroundColor: info.color }]}
              onPress={() =>
                navigation.navigate('Leaderboard' as never, { language } as never)
              }
            >
              <Text style={styles.viewLeaderboardText}>
                View {info.name} Leaderboard
              </Text>
            </TouchableOpacity>
          </View>
        )}
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

  const sortedLanguages = Object.keys(LANGUAGE_INFO).sort((a, b) => {
    const statsA = getStatsForLanguage(a as Language);
    const statsB = getStatsForLanguage(b as Language);
    return statsB.eloRating - statsA.eloRating;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Language Stats</Text>
        <Text style={styles.headerSubtitle}>
          Track your progress in each language
        </Text>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <Text style={styles.infoText}>
          Each language has separate ELO rating and statistics. Tap a card to
          view details and leaderboard.
        </Text>
      </View>

      {/* Language List */}
      <ScrollView
        style={styles.languageList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {sortedLanguages.map((lang, index) => (
          <View key={lang}>
            {index === 0 && (
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>👑 Your Best Language</Text>
              </View>
            )}
            <LanguageCard language={lang as Language} />
          </View>
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
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#666',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 18,
  },
  languageList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  rankBadge: {
    backgroundColor: '#FFD700',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
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
  languageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  division: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  eloContainer: {
    alignItems: 'flex-end',
  },
  eloLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  eloValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  expandedStats: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  winRateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  winRateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  winRateValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  viewLeaderboardButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewLeaderboardText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LanguageStatsScreen;
