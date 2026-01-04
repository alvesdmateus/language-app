import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
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
      icon: '🎯',
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
      icon: '⚔️',
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
      icon: '🔥',
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
      icon: '💯',
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
      icon: '🌍',
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
      icon: '💯',
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
      icon: '⚡',
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
      icon: '💎',
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
      icon: '👑',
      progress: 0,
      total: 1,
      unlocked: false,
      category: 'elite',
      rarity: 'legendary',
    },
  ];

  const categories = [
    { id: 'all', name: 'All', icon: '🏆' },
    { id: 'battles', name: 'Battles', icon: '⚔️' },
    { id: 'streak', name: 'Streak', icon: '🔥' },
    { id: 'learning', name: 'Learning', icon: '📚' },
    { id: 'elite', name: 'Elite', icon: '👑' },
  ];

  const rarityColors = {
    common: '#95a5a6',
    rare: '#3498db',
    epic: '#9b59b6',
    legendary: '#f39c12',
  };

  const filteredAchievements =
    selectedCategory === 'all'
      ? achievements
      : achievements.filter((a) => a.category === selectedCategory);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
    const progressPercent = (achievement.progress / achievement.total) * 100;

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
              { backgroundColor: rarityColors[achievement.rarity] + '20' },
            ]}
          >
            <Text style={[styles.achievementIcon, !achievement.unlocked && styles.iconLocked]}>
              {achievement.icon}
            </Text>
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
              <Text style={styles.checkmarkText}>✓</Text>
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
                    backgroundColor: rarityColors[achievement.rarity],
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
              { color: rarityColors[achievement.rarity] },
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
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading achievements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
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
      </View>

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
            <Text style={styles.categoryIcon}>{category.icon}</Text>
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
    marginBottom: 12,
  },
  progressSummary: {
    marginTop: 8,
  },
  progressSummaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBarSummary: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFillSummary: {
    height: '100%',
    backgroundColor: '#4A90E2',
  },
  categoryScroll: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#4A90E2',
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryTextActive: {
    color: 'white',
  },
  achievementsList: {
    flex: 1,
    padding: 16,
  },
  achievementCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementIcon: {
    fontSize: 32,
  },
  iconLocked: {
    opacity: 0.5,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
  },
  textLocked: {
    opacity: 0.7,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },
  rarityBadge: {
    marginTop: 8,
  },
  rarityText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default AchievementsScreen;
