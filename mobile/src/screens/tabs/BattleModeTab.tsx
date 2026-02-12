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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Language } from '../../types';
import { api } from '../../services/api';
import LanguageSelector from '../../components/LanguageSelector';
import { colors, gradients, spacing, radii, shadows, typography } from '../../theme';

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
      const response = await api.post('/match/find', {
        type: selectedMode === 'RANKED' ? 'BATTLE' : 'CASUAL',
        language,
        isBattleMode: true,
        isAsync,
      });

      if (response.data.data.matched) {
        navigation.navigate('GameScreen' as never, {
          matchId: response.data.data.match.id,
          match: response.data.data.match,
        } as never);
      } else {
        navigation.navigate('Matchmaking' as never, {
          language,
          mode: selectedMode === 'RANKED' ? 'BATTLE' : 'CASUAL',
        } as never);
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to start matchmaking.'
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
          selectedMode === 'RANKED' && styles.modeButtonRanked,
        ]}
        onPress={() => setSelectedMode('RANKED')}
        disabled={searching}
      >
        {selectedMode === 'RANKED' ? (
          <LinearGradient colors={gradients.ranked} style={styles.modeIconCircle}>
            <MaterialCommunityIcons name="sword-cross" size={24} color={colors.white} />
          </LinearGradient>
        ) : (
          <View style={[styles.modeIconCircle, { backgroundColor: colors.surfaceSecondary }]}>
            <MaterialCommunityIcons name="sword-cross" size={24} color={colors.textTertiary} />
          </View>
        )}
        <Text
          style={[
            styles.modeButtonText,
            selectedMode === 'RANKED' && styles.modeButtonTextRanked,
          ]}
        >
          Ranked
        </Text>
        <Text style={styles.modeSubtext}>ELO rating affected</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.modeButton,
          selectedMode === 'CASUAL' && styles.modeButtonCasual,
        ]}
        onPress={() => setSelectedMode('CASUAL')}
        disabled={searching}
      >
        {selectedMode === 'CASUAL' ? (
          <LinearGradient colors={gradients.casual} style={styles.modeIconCircle}>
            <Ionicons name="game-controller" size={24} color={colors.white} />
          </LinearGradient>
        ) : (
          <View style={[styles.modeIconCircle, { backgroundColor: colors.surfaceSecondary }]}>
            <Ionicons name="game-controller" size={24} color={colors.textTertiary} />
          </View>
        )}
        <Text
          style={[
            styles.modeButtonText,
            selectedMode === 'CASUAL' && styles.modeButtonTextCasual,
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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ModeSelector />

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
              size={24}
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
              size={24}
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

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Battle Mode Rules</Text>
        <View style={styles.infoRow}>
          <Ionicons name="document-text" size={16} color={colors.secondary} />
          <Text style={styles.infoText}>5 questions per match</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="timer" size={16} color={colors.accent} />
          <Text style={styles.infoText}>
            {isAsync ? '24 hours to complete all questions' : '45 seconds per question'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="trophy" size={16} color={colors.gold} />
          <Text style={styles.infoText}>Winner: Most accurate, then fastest</Text>
        </View>
        {isAsync && (
          <View style={styles.infoRow}>
            <Ionicons name="notifications" size={16} color={colors.purple} />
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
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  modeSelector: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modeButton: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  modeButtonRanked: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
  },
  modeButtonCasual: {
    backgroundColor: colors.secondaryLight,
    borderColor: colors.secondary,
  },
  modeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  modeButtonText: {
    ...typography.title,
    color: colors.textTertiary,
  },
  modeButtonTextRanked: {
    color: colors.danger,
  },
  modeButtonTextCasual: {
    color: colors.secondary,
  },
  modeSubtext: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  infoCard: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    marginBottom: spacing.sm,
    padding: 14,
    borderRadius: radii.md,
    ...shadows.sm,
  },
  infoTitle: {
    ...typography.title,
    fontSize: 14,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: spacing.sm,
  },
  infoText: {
    ...typography.bodySmall,
  },
  languageSelector: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sectionTitle: {
    ...typography.title,
    fontSize: 16,
    marginBottom: spacing.md,
  },
  matchTypeCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.md,
    ...shadows.md,
  },
  matchTypeTitle: {
    ...typography.title,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  toggleButton: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
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
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    marginTop: spacing.xs,
    marginBottom: 3,
  },
  toggleTextActive: {
    color: colors.secondary,
  },
  toggleSubtext: {
    fontSize: 10,
    color: colors.textTertiary,
  },
  toggleSubtextActive: {
    color: colors.secondary,
  },
});

export default BattleModeTab;
