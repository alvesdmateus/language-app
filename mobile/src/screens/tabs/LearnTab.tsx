import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, spacing, radii, shadows, typography } from '../../theme';

const LearnTab = () => {
  const navigation = useNavigation();

  const LearningCard = ({ icon, title, subtitle, gradientColors, onPress }: any) => (
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
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Learn</Text>
        <Text style={styles.headerSubtitle}>Study and improve your skills</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Study Materials</Text>
        <LearningCard
          icon="book"
          title="Flashcards"
          subtitle="Practice with interactive flashcards"
          gradientColors={gradients.accent}
          onPress={() => navigation.navigate('Flashcards' as never)}
        />
      </View>

      <View style={styles.tipCard}>
        <LinearGradient
          colors={[colors.goldLight, '#FFF3D6']}
          style={styles.tipGradient}
        >
          <Ionicons name="bulb" size={28} color={colors.accent} />
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Study Tip</Text>
            <Text style={styles.tipText}>
              Regular practice is key! Try to complete at least one flashcard session daily to maintain your progress.
            </Text>
          </View>
        </LinearGradient>
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
  tipCard: {
    margin: spacing.lg,
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gold,
  },
  tipGradient: {
    flexDirection: 'row',
    padding: spacing.lg,
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    ...typography.title,
    color: '#8B6914',
    marginBottom: spacing.xs,
  },
  tipText: {
    ...typography.bodySmall,
    color: '#8B6914',
  },
});

export default LearnTab;
