import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { DivisionBadge } from '../components/DivisionBadge';
import { userService } from '../services/api';
import { colors, gradients, spacing, radii, shadows, typography } from '../theme';

const HomeScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const response = await userService.getProfile();
      setUserStats(response.data);
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserStats();
    setRefreshing(false);
  };

  const MenuCard = ({ iconName, iconLib = 'ion', title, subtitle, color, onPress, badge }: {
    iconName: string;
    iconLib?: 'ion' | 'mci';
    title: string;
    subtitle: string;
    color: string;
    onPress: () => void;
    badge?: string;
  }) => (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={[styles.cardIconContainer, { backgroundColor: color + '15' }]}>
          {iconLib === 'ion' ? (
            <Ionicons name={iconName as any} size={24} color={color} />
          ) : (
            <MaterialCommunityIcons name={iconName as any} size={24} color={color} />
          )}
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        {badge && (
          <View style={[styles.badge, { backgroundColor: color }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.username}>{user?.displayName || user?.username}!</Text>
        </View>
        {user?.division && (
          <DivisionBadge
            division={user.division}
            divisionInfo={userStats?.user?.divisionInfo}
            size="small"
          />
        )}
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="flame" size={28} color={colors.accent} />
          <Text style={styles.statValue}>{user?.currentStreak || 0}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="star" size={28} color={colors.gold} />
          <Text style={styles.statValue}>{user?.totalPoints || 0}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="trophy" size={28} color={colors.secondary} />
          <Text style={styles.statValue}>{user?.eloRating || 1000}</Text>
          <Text style={styles.statLabel}>ELO</Text>
        </View>
      </View>

      {/* Menu Options */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Battle Modes</Text>

        <MenuCard
          iconName="sword-cross"
          iconLib="mci"
          title="Ranked Battle"
          subtitle="5 questions - 45s each - Earn ELO"
          color={colors.ranked}
          onPress={() => navigation.navigate('BattleMode' as never, { mode: 'RANKED' } as never)}
        />

        <MenuCard
          iconName="game-controller"
          title="Casual Battle"
          subtitle="5 questions - 45s each - Practice"
          color={colors.primary}
          onPress={() => navigation.navigate('BattleMode' as never, { mode: 'CASUAL' } as never)}
        />
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Challenges</Text>

        <MenuCard
          iconName="document-text-outline"
          title="Daily Challenge"
          subtitle="Complete today's quiz"
          color={colors.secondary}
          onPress={() => navigation.navigate('DailyQuiz' as never)}
          badge="TODAY"
        />

        <MenuCard
          iconName="trophy-outline"
          title="Achievements"
          subtitle="View your badges & milestones"
          color={colors.gold}
          onPress={() => navigation.navigate('Achievements' as never)}
        />
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Learn</Text>

        <MenuCard
          iconName="book-outline"
          title="Flashcards"
          subtitle="Study and improve skills"
          color={colors.accent}
          onPress={() => navigation.navigate('Flashcards' as never)}
        />
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Your Stats</Text>

        <MenuCard
          iconName="person-outline"
          title="Profile"
          subtitle="View your statistics & history"
          color={colors.textSecondary}
          onPress={() => navigation.navigate('Profile' as never)}
        />

        <MenuCard
          iconName="podium-outline"
          title="Leaderboard"
          subtitle="Rankings by language"
          color={colors.purple}
          onPress={() => navigation.navigate('LanguageStats' as never)}
        />

        <MenuCard
          iconName="settings-outline"
          title="Settings"
          subtitle="Account & preferences"
          color={colors.textSecondary}
          onPress={() => navigation.navigate('Settings' as never)}
        />
      </View>

      {/* Stats Summary */}
      {userStats?.stats && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="analytics" size={20} color={colors.secondary} />
            <Text style={styles.summaryTitle}>Your Performance</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Quizzes:</Text>
            <Text style={styles.summaryValue}>{userStats.stats.totalQuizzes}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Matches:</Text>
            <Text style={styles.summaryValue}>{userStats.stats.totalMatches}</Text>
          </View>
          <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.summaryLabel}>Win Rate:</Text>
            <Text style={styles.summaryValue}>
              {userStats.stats.winRate.toFixed(1)}%
            </Text>
          </View>
        </View>
      )}

      <View style={{ height: spacing.xxxl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: 60,
  },
  greeting: {
    ...typography.subtitle,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  username: {
    ...typography.h2,
    color: colors.textInverse,
    marginTop: spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: spacing.xl,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  statValue: {
    ...typography.stat,
    marginTop: spacing.sm,
  },
  statLabel: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  menuSection: {
    padding: spacing.xl,
    paddingTop: 0,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    ...shadows.md,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
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
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    marginRight: spacing.sm,
  },
  badgeText: {
    ...typography.label,
    fontSize: 11,
    color: colors.textInverse,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.xl,
    margin: spacing.xl,
    marginTop: 0,
    ...shadows.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  summaryTitle: {
    ...typography.title,
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
    ...typography.subtitle,
    color: colors.textPrimary,
  },
});

export default HomeScreen;
