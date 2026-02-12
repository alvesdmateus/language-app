import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { DivisionBadge, DivisionCard } from '../components/DivisionBadge';
import { colors, gradients, spacing, radii, shadows, typography } from '../theme';

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={gradients.header} style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={72} color={colors.white} />
          </View>
          <Text style={styles.displayName}>{user?.displayName || user?.username}</Text>
          <Text style={styles.usernameText}>@{user?.username}</Text>
        </View>
      </LinearGradient>

      {user?.divisionInfo && (
        <View style={styles.divisionCardWrapper}>
          <DivisionCard
            division={user.division}
            divisionInfo={user.divisionInfo}
            eloRating={user.eloRating}
          />
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="person-outline" size={20} color={colors.secondary} />
          <Text style={styles.cardTitle}>Account Info</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Username</Text>
          <Text style={styles.value}>{user?.username}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Display Name</Text>
          <Text style={styles.value}>{user?.displayName}</Text>
        </View>
        <View style={[styles.row, styles.lastRow]}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="stats-chart" size={20} color={colors.accent} />
          <Text style={styles.cardTitle}>Statistics</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Division</Text>
          {user?.division && (
            <DivisionBadge division={user.division} divisionInfo={user.divisionInfo} size="small" />
          )}
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>ELO Rating</Text>
          <Text style={styles.value}>{user?.eloRating}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total Points</Text>
          <Text style={styles.value}>{user?.totalPoints}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Current Streak</Text>
          <View style={styles.streakContainer}>
            <Ionicons name="flame" size={16} color={colors.accent} />
            <Text style={styles.streakValue}>{user?.currentStreak} days</Text>
          </View>
        </View>
        <View style={[styles.row, styles.lastRow]}>
          <Text style={styles.label}>Longest Streak</Text>
          <View style={styles.streakContainer}>
            <Ionicons name="trophy" size={16} color={colors.gold} />
            <Text style={styles.streakValue}>{user?.longestStreak} days</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color={colors.textInverse} />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: spacing.xxxl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: spacing.sm,
  },
  displayName: {
    ...typography.h2,
    color: colors.textInverse,
    marginTop: spacing.sm,
  },
  usernameText: {
    ...typography.subtitle,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xs,
  },
  divisionCardWrapper: {
    paddingHorizontal: spacing.xl,
    marginTop: -spacing.md,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.title,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  label: {
    ...typography.body,
    color: colors.textSecondary,
  },
  value: {
    ...typography.title,
    fontSize: 15,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  streakValue: {
    ...typography.title,
    fontSize: 15,
  },
  logoutButton: {
    backgroundColor: colors.danger,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.dangerButton,
  },
  logoutButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
});

export default ProfileScreen;
