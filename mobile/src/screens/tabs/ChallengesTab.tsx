import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, radii, shadows, typography } from '../../theme';

const ChallengesTab = () => {
  const navigation = useNavigation();

  const ChallengeCard = ({ icon, iconColor, title, subtitle, gradientColors, onPress, badge }: any) => (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <LinearGradient colors={gradientColors} style={styles.cardIconCircle}>
          <Ionicons name={icon} size={24} color={colors.white} />
        </LinearGradient>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Challenges</Text>
        <Text style={styles.headerSubtitle}>Complete daily tasks and earn achievements</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily</Text>
        <ChallengeCard
          icon="document-text"
          gradientColors={gradients.secondary}
          title="Daily Challenge"
          subtitle="Complete today's quiz and earn bonus points"
          onPress={() => navigation.navigate('DailyQuiz' as never)}
          badge="TODAY"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress</Text>
        <ChallengeCard
          icon="trophy"
          gradientColors={gradients.gold}
          title="Achievements"
          subtitle="View your badges and milestones"
          onPress={() => navigation.navigate('Achievements' as never)}
        />
      </View>
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
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.bodySmall,
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
    width: 44,
    height: 44,
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
  },
  cardSubtitle: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    marginRight: spacing.sm,
  },
  badgeText: {
    color: colors.textInverse,
    ...typography.label,
    fontSize: 10,
  },
});

export default ChallengesTab;
