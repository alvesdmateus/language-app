import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/api';
import { DivisionBadge } from '../../components/DivisionBadge';
import { Language } from '../../types';
import { LANGUAGE_INFO } from '../../theme/languages';
import { colors, gradients, spacing, radii, shadows, typography } from '../../theme';

const ProfileTab = () => {
  const navigation = useNavigation();
  const { user, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);
  const [languageStats, setLanguageStats] = useState<any[]>([]);
  const [preferredLanguage, setPreferredLanguage] = useState<Language>('SPANISH');
  const [preferredLanguageElo, setPreferredLanguageElo] = useState<number>(1000);
  const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false);

  useEffect(() => {
    loadPreferredLanguage();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUserStats();
      loadLanguageStats();
      refreshUser();
    }, [])
  );

  useEffect(() => {
    loadUserStats();
    loadLanguageStats();
  }, []);

  useEffect(() => {
    if (languageStats.length > 0) {
      const stats = languageStats.find((s) => s.language === preferredLanguage);
      if (stats) {
        setPreferredLanguageElo(stats.eloRating);
      }
    }
  }, [languageStats, preferredLanguage]);

  const loadUserStats = async () => {
    try {
      const response = await userService.getProfile();
      setUserStats(response.data);
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const loadPreferredLanguage = async () => {
    try {
      const stored = await AsyncStorage.getItem('preferredLanguage');
      if (stored) {
        setPreferredLanguage(stored as Language);
      }
    } catch (error) {
      console.error('Failed to load preferred language:', error);
    }
  };

  const savePreferredLanguage = async (language: Language) => {
    try {
      await AsyncStorage.setItem('preferredLanguage', language);
      setPreferredLanguage(language);
      setLanguageSelectorVisible(false);

      const stats = languageStats.find((s) => s.language === language);
      if (stats) {
        setPreferredLanguageElo(stats.eloRating);
      }
    } catch (error) {
      console.error('Failed to save preferred language:', error);
    }
  };

  const loadLanguageStats = async () => {
    try {
      const response = await userService.getLanguageStats();
      const stats = response.data?.stats || [];
      setLanguageStats(stats);
    } catch (error) {
      console.error('Failed to load language stats:', error);
      setLanguageStats([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserStats();
    await loadLanguageStats();
    setRefreshing(false);
  };

  const StatCard = ({ icon, iconColor, value, label }: any) => (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={24} color={iconColor} />
      <Text style={[styles.statValue, { color: iconColor }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const MenuCard = ({ icon, iconColor, title, subtitle, gradientColors, onPress }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <LinearGradient colors={gradientColors} style={styles.cardIconCircle}>
          <Ionicons name={icon} size={20} color={colors.white} />
        </LinearGradient>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Profile</Text>
            <Text style={styles.username}>{user?.displayName || user?.username}</Text>
          </View>
          {user?.division && (
            <DivisionBadge
              division={user.division}
              divisionInfo={userStats?.user?.divisionInfo}
              size="small"
            />
          )}
        </View>
      </View>

      <View style={styles.statsContainer}>
        <StatCard
          icon="flame"
          iconColor={colors.accent}
          value={user?.currentStreak || 0}
          label="Day Streak"
        />
        <StatCard
          icon="star"
          iconColor={colors.gold}
          value={user?.totalPoints || 0}
          label="Points"
        />
        <TouchableOpacity
          style={styles.eloStatCard}
          onPress={() => setLanguageSelectorVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.statCard}>
            <Ionicons name="trophy" size={24} color={colors.secondary} />
            <Text style={[styles.statValue, { color: colors.secondary }]}>
              {preferredLanguageElo || 1000}
            </Text>
            <View style={styles.eloLabelContainer}>
              <Text style={styles.statLabel}>ELO</Text>
              <Text style={styles.languageFlag}>{LANGUAGE_INFO[preferredLanguage].flag}</Text>
            </View>
            <Text style={styles.changeLanguageHint}>Tap to change</Text>
          </View>
        </TouchableOpacity>
      </View>

      {userStats?.stats && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Your Performance</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Quizzes:</Text>
            <Text style={styles.summaryValue}>{userStats.stats.totalQuizzes}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Matches:</Text>
            <Text style={styles.summaryValue}>{userStats.stats.totalMatches}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Win Rate:</Text>
            <Text style={styles.summaryValue}>
              {userStats.stats.winRate.toFixed(1)}%
            </Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>More Stats</Text>
        <MenuCard
          icon="person"
          gradientColors={['#8E8E93', '#636366']}
          title="Full Profile"
          subtitle="View detailed statistics and history"
          onPress={() => navigation.navigate('Profile' as never)}
        />
        <MenuCard
          icon="time"
          gradientColors={gradients.accent}
          title="Match History"
          subtitle="Review your past battles"
          onPress={() => navigation.navigate('MatchHistory' as never)}
        />
        <MenuCard
          icon="stats-chart"
          gradientColors={gradients.purple}
          title="Language Stats"
          subtitle="Rankings and stats by language"
          onPress={() => navigation.navigate('LanguageStats' as never)}
        />
        <MenuCard
          icon="podium"
          gradientColors={gradients.primary}
          title="Leaderboard"
          subtitle="See how you rank globally"
          onPress={() => navigation.navigate('Leaderboard' as never)}
        />
      </View>

      {/* Language Selector Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={languageSelectorVisible}
        onRequestClose={() => setLanguageSelectorVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setLanguageSelectorVisible(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your Primary Language</Text>
              <TouchableOpacity
                onPress={() => setLanguageSelectorVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
              {Object.keys(LANGUAGE_INFO).map((lang) => {
                const language = lang as Language;
                const info = LANGUAGE_INFO[language];
                const stats = languageStats.find((s) => s.language === language);
                const isSelected = preferredLanguage === language;

                return (
                  <TouchableOpacity
                    key={language}
                    style={[
                      styles.languageOption,
                      isSelected && styles.languageOptionSelected,
                    ]}
                    onPress={() => savePreferredLanguage(language)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.languageFlag2}>{info.flag}</Text>
                    <View style={styles.languageInfo}>
                      <Text style={styles.languageName}>{info.name}</Text>
                      {stats && (
                        <Text style={styles.languageElo}>
                          ELO: {stats.eloRating} • {stats.totalMatches} matches
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    ...typography.bodySmall,
  },
  username: {
    ...typography.h2,
    marginTop: spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  eloStatCard: {
    flex: 1,
  },
  eloLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  languageFlag: {
    fontSize: 14,
  },
  changeLanguageHint: {
    fontSize: 9,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  statValue: {
    ...typography.stat,
    marginTop: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 18,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  summaryTitle: {
    ...typography.title,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.body,
    fontWeight: '600',
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.title,
    fontSize: 18,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  cardIconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    ...typography.title,
    fontSize: 16,
  },
  cardSubtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '70%',
    paddingBottom: 90,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.title,
    fontSize: 18,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageList: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.border,
  },
  languageOptionSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  languageFlag2: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    ...typography.title,
    fontSize: 16,
  },
  languageElo: {
    ...typography.bodySmall,
    marginTop: 2,
  },
});

export default ProfileTab;
