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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Language } from '../types';
import { api } from '../services/api';
import { LANGUAGE_INFO } from '../theme/languages';
import { colors, gradients, spacing, radii, shadows, typography } from '../theme';

const LanguageStatsScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [languageStats, setLanguageStats] = useState<any[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);

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
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {stats.wins}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Losses</Text>
                <Text style={[styles.statValue, { color: colors.danger }]}>
                  {stats.losses}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Draws</Text>
                <Text style={[styles.statValue, { color: colors.accent }]}>
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
              activeOpacity={0.8}
            >
              <Ionicons name="podium-outline" size={16} color={colors.textInverse} />
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
        <ActivityIndicator size="large" color={colors.secondary} />
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
      <LinearGradient colors={gradients.secondary} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonTouch}>
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Language Stats</Text>
        <Text style={styles.headerSubtitle}>
          Track your progress in each language
        </Text>
      </LinearGradient>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={22} color={colors.secondary} />
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
                <Ionicons name="trophy" size={14} color={colors.textPrimary} />
                <Text style={styles.rankText}>Your Best Language</Text>
              </View>
            )}
            <LanguageCard language={lang as Language} />
          </View>
        ))}
        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    ...typography.body,
    color: colors.textSecondary,
  },
  header: {
    paddingTop: 50,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  backButtonTouch: {
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.textInverse,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.subtitle,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.secondaryLight,
    margin: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.sm,
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.secondary,
  },
  languageList: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  rankBadge: {
    backgroundColor: colors.gold,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rankText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  languageCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    ...shadows.md,
  },
  languageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageFlag: {
    fontSize: 36,
    marginRight: spacing.md,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    ...typography.title,
    fontSize: 18,
  },
  division: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  eloContainer: {
    alignItems: 'flex-end',
  },
  eloLabel: {
    ...typography.label,
    marginBottom: 2,
  },
  eloValue: {
    ...typography.stat,
  },
  expandedStats: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.title,
    fontSize: 18,
    color: colors.textPrimary,
  },
  winRateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: radii.sm,
    marginBottom: spacing.md,
  },
  winRateLabel: {
    ...typography.subtitle,
  },
  winRateValue: {
    ...typography.h3,
    color: colors.secondary,
  },
  viewLeaderboardButton: {
    padding: spacing.md,
    borderRadius: radii.sm,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  viewLeaderboardText: {
    ...typography.buttonSmall,
    color: colors.textInverse,
  },
});

export default LanguageStatsScreen;
