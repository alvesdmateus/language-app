import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { DivisionBadge } from '../components/DivisionBadge';
import { userService } from '../services/api';

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

  const MenuCard = ({ icon, title, subtitle, color, onPress, badge }: any) => (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardIcon}>{icon}</Text>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        {badge && (
          <View style={[styles.badge, { backgroundColor: color }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        <Text style={styles.cardArrow}>›</Text>
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
      <View style={styles.header}>
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
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🔥</Text>
          <Text style={styles.statValue}>{user?.currentStreak || 0}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>⭐</Text>
          <Text style={styles.statValue}>{user?.totalPoints || 0}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🏆</Text>
          <Text style={styles.statValue}>{user?.eloRating || 1000}</Text>
          <Text style={styles.statLabel}>ELO</Text>
        </View>
      </View>

      {/* Menu Options */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Play</Text>

        <MenuCard
          icon="📝"
          title="Daily Quiz"
          subtitle="Complete today's challenge"
          color="#4A90E2"
          onPress={() => navigation.navigate('DailyQuiz' as never)}
          badge="NEW"
        />

        <MenuCard
          icon="🎖️"
          title="Ranked Match"
          subtitle="Compete for ELO rating"
          color="#FF3B30"
          onPress={() => navigation.navigate('Matchmaking' as never, { type: 'RANKED' } as never)}
        />

        <MenuCard
          icon="🎮"
          title="Casual Match"
          subtitle="Practice without pressure"
          color="#34C759"
          onPress={() => navigation.navigate('Matchmaking' as never, { type: 'CASUAL' } as never)}
        />
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Learn</Text>

        <MenuCard
          icon="📚"
          title="Flashcards"
          subtitle="Study and improve skills"
          color="#FF9500"
          onPress={() => navigation.navigate('Flashcards' as never)}
        />
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Progress</Text>

        <MenuCard
          icon="🏅"
          title="Leaderboard"
          subtitle="See top players"
          color="#5856D6"
          onPress={() => navigation.navigate('Leaderboard' as never)}
        />

        <MenuCard
          icon="👤"
          title="Profile"
          subtitle="View your statistics"
          color="#8E8E93"
          onPress={() => navigation.navigate('Profile' as never)}
        />
      </View>

      {/* Stats Summary */}
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
  },
  greeting: {
    fontSize: 16,
    color: '#666',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  menuSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginTop: 12,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cardIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardArrow: {
    fontSize: 32,
    color: '#ccc',
    fontWeight: '300',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
});

export default HomeScreen;
