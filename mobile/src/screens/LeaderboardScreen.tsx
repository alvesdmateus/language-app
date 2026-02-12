import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { userService } from '../services/api';
import { DivisionBadge } from '../components/DivisionBadge';
import { colors, gradients, spacing, radii, shadows, typography } from '../theme';

const LeaderboardScreen = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const response = await userService.getLeaderboard();
      setUsers(response.data.users);
    } catch (error) {
      Alert.alert('Error', 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Ionicons name="trophy" size={22} color={colors.gold} />;
    if (rank === 2) return <Ionicons name="trophy" size={20} color="#C0C0C0" />;
    if (rank === 3) return <Ionicons name="trophy" size={20} color="#CD7F32" />;
    return null;
  };

  const renderItem = ({ item, index }: any) => {
    const rank = item.rank || index + 1;
    return (
      <View style={[styles.item, rank <= 3 && styles.topItem]}>
        <View style={styles.rankContainer}>
          {getRankIcon(rank) || <Text style={styles.rank}>#{rank}</Text>}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.displayName}</Text>
          <View style={styles.divisionRow}>
            {item.division && (
              <DivisionBadge
                division={item.division}
                divisionInfo={item.divisionInfo}
                size="small"
              />
            )}
            <Text style={styles.points}>{item.eloRating} ELO</Text>
          </View>
        </View>
        <View style={styles.eloDisplay}>
          <Ionicons name="star" size={14} color={colors.accent} />
          <Text style={styles.eloText}>{item.eloRating}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.gold} style={styles.headerGradient}>
        <Ionicons name="podium" size={40} color={colors.white} />
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>Top players by ELO rating</Text>
      </LinearGradient>
      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
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
  headerGradient: {
    paddingTop: 60,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.textInverse,
    marginTop: spacing.sm,
  },
  subtitle: {
    ...typography.subtitle,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: spacing.xs,
  },
  listContent: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  topItem: {
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.goldLight,
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rank: {
    ...typography.title,
    color: colors.secondary,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    ...typography.title,
    marginBottom: spacing.xs + 2,
  },
  divisionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  points: {
    ...typography.bodySmall,
  },
  eloDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  eloText: {
    ...typography.title,
    color: colors.accent,
  },
});

export default LeaderboardScreen;
