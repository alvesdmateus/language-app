import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Division, DivisionInfo } from '../types';
import { colors, divisionColors, spacing, radii, shadows, typography } from '../theme';

interface DivisionBadgeProps {
  division: Division;
  divisionInfo?: DivisionInfo;
  size?: 'small' | 'medium' | 'large';
  showTier?: boolean;
}

const DIVISION_ICONS: Record<Division, keyof typeof MaterialCommunityIcons.glyphMap> = {
  [Division.UNRANKED]: 'circle-outline',
  [Division.BRONZE]: 'shield-outline',
  [Division.SILVER]: 'shield-half-full',
  [Division.GOLD]: 'shield-star',
  [Division.PLATINUM]: 'diamond-stone',
  [Division.DIAMOND]: 'diamond',
  [Division.MASTER]: 'crown',
  [Division.GRANDMASTER]: 'trophy',
};

const DIVISION_GRADIENTS: Record<Division, readonly [string, string]> = {
  [Division.UNRANKED]: ['#BFBFBF', '#AFAFAF'] as const,
  [Division.BRONZE]: ['#E8A04A', '#CD7F32'] as const,
  [Division.SILVER]: ['#D8D8D8', '#C0C0C0'] as const,
  [Division.GOLD]: ['#FFD700', '#FFC200'] as const,
  [Division.PLATINUM]: ['#F0EFED', '#E5E4E2'] as const,
  [Division.DIAMOND]: ['#4DD4F7', '#1CB0F6'] as const,
  [Division.MASTER]: ['#D9A3FF', '#CE82FF'] as const,
  [Division.GRANDMASTER]: ['#FF6BA6', '#FF4B88'] as const,
};

export const DivisionBadge: React.FC<DivisionBadgeProps> = ({
  division,
  divisionInfo,
  size = 'medium',
  showTier = true,
}) => {
  const color = divisionInfo?.color || divisionColors[division];
  const icon = DIVISION_ICONS[division];

  const sizeConfig = {
    small: { iconSize: 14, fontSize: 12, paddingH: 10, paddingV: 4 },
    medium: { iconSize: 18, fontSize: 14, paddingH: 14, paddingV: 6 },
    large: { iconSize: 22, fontSize: 16, paddingH: 16, paddingV: 8 },
  };

  const config = sizeConfig[size];
  const displayName = divisionInfo?.displayName || division.replace('_', ' ');

  return (
    <View style={[styles.badge, { borderColor: color, paddingHorizontal: config.paddingH, paddingVertical: config.paddingV }]}>
      <MaterialCommunityIcons name={icon} size={config.iconSize} color={color} />
      <Text style={[styles.badgeText, { fontSize: config.fontSize }]}>
        {displayName}
      </Text>
    </View>
  );
};

export const DivisionCard: React.FC<{
  division: Division;
  divisionInfo: DivisionInfo;
  eloRating: number;
}> = ({ division, divisionInfo, eloRating }) => {
  const color = divisionInfo.color;
  const icon = DIVISION_ICONS[division];
  const gradient = DIVISION_GRADIENTS[division];

  const progress = divisionInfo.maxElo !== Infinity
    ? ((eloRating - divisionInfo.minElo) / (divisionInfo.maxElo - divisionInfo.minElo)) * 100
    : 100;

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradientHeader}
      >
        <MaterialCommunityIcons name={icon} size={36} color={colors.white} />
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.cardDivisionName}>{divisionInfo.displayName}</Text>
          <Text style={styles.cardEloText}>{eloRating} ELO</Text>
        </View>
      </LinearGradient>

      {divisionInfo.maxElo !== Infinity && (
        <View style={styles.cardProgressSection}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.progressFill,
                { width: `${Math.min(100, Math.max(0, progress))}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {divisionInfo.maxElo - eloRating} ELO to next division
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Badge styles
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: radii.pill,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  badgeText: {
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // Card styles
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    marginVertical: spacing.sm,
    overflow: 'hidden',
    ...shadows.md,
  },
  cardGradientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  cardDivisionName: {
    ...typography.h3,
    color: colors.textInverse,
  },
  cardEloText: {
    ...typography.subtitle,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  cardProgressSection: {
    padding: spacing.lg,
  },
  progressBar: {
    height: 10,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: radii.full,
  },
  progressText: {
    ...typography.caption,
    textAlign: 'center',
  },
});
