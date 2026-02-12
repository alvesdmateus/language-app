import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { colors, gradients, spacing, radii, shadows, typography } from '../theme';

interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: string;
  iconLib: 'ion' | 'mci';
  progress: number;
  total: number;
  unlocked: boolean;
  category: 'battles' | 'streak' | 'learning' | 'social' | 'elite';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const AchievementsScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    // Simulate loading - in production, fetch from API
    setTimeout(() => {
      setAchievements(MOCK_ACHIEVEMENTS);
      setLoading(false);
    }, 500);
  };

  const MOCK_ACHIEVEMENTS: Achievement[] = [
    {
      id: '1',
      title: 'First Victory',
      description: 'Win your first battle',
      iconName: 'bullseye-arrow',
      iconLib: 'mci',
      progress: 1,
      total: 1,
      unlocked: true,
      category: 'battles',
      rarity: 'common',
    },
    {
      id: '2',
      title: 'Battle Master',
      description: 'Win 100 battles',
      iconName: 'sword-cross',
      iconLib: 'mci',
      progress: 34,
      total: 100,
      unlocked: false,
      category: 'battles',
      rarity: 'rare',
    },
    {
      id: '3',
      title: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      iconName: 'flame',
      iconLib: 'ion',
      progress: 7,
      total: 7,
      unlocked: true,
      category: 'streak',
      rarity: 'common',
    },
    {
      id: '4',
      title: 'Century Streak',
      description: 'Maintain a 100-day streak',
      iconName: 'counter',
      iconLib: 'mci',
      progress: 23,
      total: 100,
      unlocked: false,
      category: 'streak',
      rarity: 'legendary',
    },
    {
      id: '5',
      title: 'Polyglot',
      description: 'Play in all 8 languages',
      iconName: 'earth',
      iconLib: 'ion',
      progress: 3,
      total: 8,
      unlocked: false,
      category: 'learning',
      rarity: 'epic',
    },
    {
      id: '6',
      title: 'Perfect Score',
      description: 'Get all questions correct in a battle',
      iconName: 'checkmark-done-circle',
      iconLib: 'ion',
      progress: 2,
      total: 1,
      unlocked: true,
      category: 'battles',
      rarity: 'rare',
    },
    {
      id: '7',
      title: 'Speed Demon',
      description: 'Win with average answer time under 10s',
      iconName: 'flash',
      iconLib: 'ion',
      progress: 0,
      total: 1,
      unlocked: false,
      category: 'battles',
      rarity: 'epic',
    },
    {
      id: '8',
      title: 'Platinum League',
      description: 'Reach Platinum division',
      iconName: 'diamond',
      iconLib: 'ion',
      progress: 0,
      total: 1,
      unlocked: false,
      category: 'elite',
      rarity: 'epic',
    },
    {
      id: '9',
      title: 'Grandmaster',
      description: 'Reach Grandmaster division',
      iconName: 'crown',
      iconLib: 'mci',
      progress: 0,
      total: 1,
      unlocked: false,
      category: 'elite',
      rarity: 'legendary',
    },
  ];

  const categories: { id: string; name: string; iconName: string; iconLib: 'ion' | 'mci' }[] = [
    { id: 'all', name: 'All', iconName: 'trophy', iconLib: 'ion' },
    { id: 'battles', name: 'Battles', iconName: 'sword-cross', iconLib: 'mci' },
    { id: 'streak', name: 'Streak', iconName: 'flame', iconLib: 'ion' },
    { id: 'learning', name: 'Learning', iconName: 'book', iconLib: 'ion' },
    { id: 'elite', name: 'Elite', iconName: 'crown', iconLib: 'mci' },
  ];

  const rarityColors: Record<string, string> = {
    common: colors.textTertiary,
    rare: colors.secondary,
    epic: colors.purple,
    legendary: colors.accent,
  };

  const filteredAchievements =
    selectedCategory === 'all'
      ? achievements
      : achievements.filter((a) => a.category === selectedCategory);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
    const progressPercent = (achievement.progress / achievement.total) * 100;
    const rarityColor = rarityColors[achievement.rarity];

    return (
      <View
        style={[
          styles.achievementCard,
          !achievement.unlocked && styles.achievementCardLocked,
        ]}
      >
        <View style={styles.achievementHeader}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: rarityColor + '20' },
            ]}
          >
            {achievement.iconLib === 'ion' ? (
              <Ionicons
                name={achievement.iconName as any}
                size={28}
                color={achievement.unlocked ? rarityColor : colors.textTertiary}
              />
            ) : (
              <MaterialCommunityIcons
                name={achievement.iconName as any}
                size={28}
                color={achievement.unlocked ? rarityColor : colors.textTertiary}
              />
            )}
          </View>
          <View style={styles.achievementInfo}>
            <Text
              style={[
                styles.achievementTitle,
                !achievement.unlocked && styles.textLocked,
              ]}
            >
              {achievement.title}
            </Text>
            <Text
              style={[
                styles.achievementDescription,
                !achievement.unlocked && styles.textLocked,
              ]}
            >
              {achievement.description}
            </Text>
          </View>
          {achievement.unlocked && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark" size={16} color={colors.textInverse} />
            </View>
          )}
        </View>

        {!achievement.unlocked && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor: rarityColor,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {achievement.progress} / {achievement.total}
            </Text>
          </View>
        )}

        <View style={styles.rarityBadge}>
          <Text
            style={[
              styles.rarityText,
              { color: rarityColor },
            ]}
          >
            {achievement.rarity.toUpperCase()}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={styles.loadingText}>Loading achievements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={gradients.ocean} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonTouch}>
          <Ionicons name="arrow-back" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Achievements</Text>
        <View style={styles.progressSummary}>
          <Text style={styles.progressSummaryText}>
            {unlockedCount} / {totalCount} Unlocked
          </Text>
          <View style={styles.progressBarSummary}>
            <View
              style={[
                styles.progressFillSummary,
                { width: `${(unlockedCount / totalCount) * 100}%` },
              ]}
            />
          </View>
        </View>
      </LinearGradient>

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            {category.iconLib === 'ion' ? (
              <Ionicons
                name={category.iconName as any}
                size={16}
                color={selectedCategory === category.id ? colors.textInverse : colors.textSecondary}
              />
            ) : (
              <MaterialCommunityIcons
                name={category.iconName as any}
                size={16}
                color={selectedCategory === category.id ? colors.textInverse : colors.textSecondary}
              />
            )}
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextActive,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Achievements List */}
      <ScrollView style={styles.achievementsList}>
        {filteredAchievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
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
    marginBottom: spacing.md,
  },
  progressSummary: {
    marginTop: spacing.sm,
  },
  progressSummaryText: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: spacing.sm,
  },
  progressBarSummary: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressFillSummary: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: radii.full,
  },
  categoryScroll: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceSecondary,
    marginRight: spacing.sm,
    gap: spacing.xs + 2,
  },
  categoryButtonActive: {
    backgroundColor: colors.secondary,
  },
  categoryText: {
    ...typography.buttonSmall,
    color: colors.textSecondary,
  },
  categoryTextActive: {
    color: colors.textInverse,
  },
  achievementsList: {
    flex: 1,
    padding: spacing.lg,
  },
  achievementCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  achievementCardLocked: {
    opacity: 0.6,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    ...typography.title,
    marginBottom: spacing.xs,
  },
  achievementDescription: {
    ...typography.body,
    color: colors.textSecondary,
  },
  textLocked: {
    opacity: 0.7,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },
  rarityBadge: {
    marginTop: spacing.sm,
  },
  rarityText: {
    ...typography.label,
  },
});

export default AchievementsScreen;
