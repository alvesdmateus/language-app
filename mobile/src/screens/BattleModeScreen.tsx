import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Language } from '../types';
import { api } from '../services/api';
import LanguageSelector from '../components/LanguageSelector';
import { colors, gradients, spacing, radii, shadows, typography } from '../theme';

const BattleModeScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { mode } = route.params as { mode: 'RANKED' | 'CASUAL' };
  const [languageStats, setLanguageStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [searching, setSearching] = useState(false);
  const [isAsync, setIsAsync] = useState(false);

  const isRanked = mode === 'RANKED';

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
        type: isRanked ? 'BATTLE' : 'CASUAL',
        language,
        isBattleMode: true,
        isAsync,
      });

      const response = await api.post('/match/find', {
        type: isRanked ? 'BATTLE' : 'CASUAL',
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
          mode: isRanked ? 'BATTLE' : 'CASUAL',
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
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={styles.loadingText}>Loading language stats...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={isRanked ? gradients.ranked : gradients.casual}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          disabled={searching}
          style={styles.backButtonTouch}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          {isRanked ? (
            <MaterialCommunityIcons name="sword-cross" size={48} color={colors.textInverse} />
          ) : (
            <Ionicons name="game-controller" size={48} color={colors.textInverse} />
          )}
          <Text style={styles.headerTitle}>
            {isRanked ? 'Ranked Battle' : 'Casual Battle'}
          </Text>
          <Text style={styles.headerSubtitle}>
            Choose your language to begin
          </Text>
        </View>
      </LinearGradient>

      {/* Match Type Selector */}
      <View style={styles.matchTypeCard}>
        <Text style={styles.matchTypeTitle}>Match Type</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, !isAsync && styles.toggleButtonActive]}
            onPress={() => setIsAsync(false)}
            disabled={searching}
          >
            <Ionicons
              name="flash"
              size={28}
              color={!isAsync ? colors.secondary : colors.textTertiary}
            />
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
            <Ionicons
              name="time"
              size={28}
              color={isAsync ? colors.secondary : colors.textTertiary}
            />
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
          <Ionicons name="document-text" size={18} color={colors.secondary} />
          <Text style={styles.infoText}>5 questions per match</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="timer" size={18} color={colors.secondary} />
          <Text style={styles.infoText}>
            {isAsync ? '24 hours to complete all questions' : '45 seconds per question'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="ribbon" size={18} color={colors.secondary} />
          <Text style={styles.infoText}>
            {isRanked
              ? 'ELO rating will be affected'
              : 'Practice mode - no ELO changes'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="trophy" size={18} color={colors.secondary} />
          <Text style={styles.infoText}>
            Winner: Most accurate, then fastest
          </Text>
        </View>
        {isAsync && (
          <View style={styles.infoRow}>
            <Ionicons name="notifications" size={18} color={colors.secondary} />
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

      <View style={{ height: spacing.xxxl }} />
    </ScrollView>
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
    marginBottom: spacing.lg,
    alignSelf: 'flex-start',
    padding: spacing.xs,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textInverse,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.subtitle,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  matchTypeCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.md,
    ...shadows.md,
  },
  matchTypeTitle: {
    ...typography.title,
    marginBottom: spacing.md,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  toggleButton: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: radii.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  toggleButtonActive: {
    backgroundColor: colors.secondaryLight,
    borderColor: colors.secondary,
  },
  toggleText: {
    ...typography.buttonSmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  toggleTextActive: {
    color: colors.secondary,
  },
  toggleSubtext: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  toggleSubtextActive: {
    color: colors.secondary,
  },
  infoCard: {
    backgroundColor: colors.surface,
    margin: spacing.xl,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.md,
    ...shadows.md,
  },
  infoTitle: {
    ...typography.title,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  infoText: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  languageSelector: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  sectionTitle: {
    ...typography.title,
    fontSize: 18,
    marginBottom: spacing.md,
  },
});

export default BattleModeScreen;
