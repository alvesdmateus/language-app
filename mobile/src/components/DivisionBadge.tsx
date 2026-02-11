import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Division, DivisionInfo } from '../types';

interface DivisionBadgeProps {
  division: Division;
  divisionInfo?: DivisionInfo;
  size?: 'small' | 'medium' | 'large';
  showTier?: boolean;
}

const DIVISION_COLORS: Record<Division, string> = {
  [Division.UNRANKED]: '#808080',
  [Division.BRONZE]: '#CD7F32',
  [Division.SILVER]: '#C0C0C0',
  [Division.GOLD]: '#FFD700',
  [Division.PLATINUM]: '#E5E4E2',
  [Division.DIAMOND]: '#B9F2FF',
  [Division.MASTER]: '#9B30FF',
  [Division.GRANDMASTER]: '#FF1493',
};

const DIVISION_EMOJIS: Record<Division, string> = {
  [Division.UNRANKED]: '⚪',
  [Division.BRONZE]: '🥉',
  [Division.SILVER]: '🥈',
  [Division.GOLD]: '🥇',
  [Division.PLATINUM]: '💎',
  [Division.DIAMOND]: '💠',
  [Division.MASTER]: '👑',
  [Division.GRANDMASTER]: '🏆',
};

export const DivisionBadge: React.FC<DivisionBadgeProps> = ({
  division,
  divisionInfo,
  size = 'medium',
  showTier = true,
}) => {
  const color = divisionInfo?.color || DIVISION_COLORS[division];
  const emoji = DIVISION_EMOJIS[division];

  const sizeStyles = {
    small: { fontSize: 12, padding: 4, emojiSize: 14 },
    medium: { fontSize: 14, padding: 8, emojiSize: 18 },
    large: { fontSize: 16, padding: 10, emojiSize: 22 },
  };

  const currentSize = sizeStyles[size];

  const displayName = divisionInfo?.displayName || division.replace('_', ' ');

  return (
    <View style={[styles.badge, { borderColor: color, padding: currentSize.padding }]}>
      <Text style={{ fontSize: currentSize.emojiSize }}>{emoji}</Text>
      <Text style={[styles.text, { fontSize: currentSize.fontSize }]}>
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
  const emoji = DIVISION_EMOJIS[division];

  // Calculate progress within division
  const progress = divisionInfo.maxElo !== Infinity
    ? ((eloRating - divisionInfo.minElo) / (divisionInfo.maxElo - divisionInfo.minElo)) * 100
    : 100;

  return (
    <View style={[styles.card, { borderColor: color }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.emoji}>{emoji}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.divisionName}>{divisionInfo.displayName}</Text>
          <Text style={styles.eloText}>{eloRating} ELO</Text>
        </View>
      </View>
      {divisionInfo.maxElo !== Infinity && (
        <>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(100, Math.max(0, progress))}%`, backgroundColor: color },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {divisionInfo.maxElo - eloRating} ELO to next division
          </Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    backgroundColor: 'white',
  },
  text: {
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 3,
    marginVertical: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 40,
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  divisionName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  eloText: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});
