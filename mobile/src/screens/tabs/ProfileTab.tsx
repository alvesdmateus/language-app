import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/api';
import { DivisionBadge } from '../../components/DivisionBadge';
import { Language } from '../../types';

const LANGUAGE_INFO: Record<Language, { name: string; flag: string }> = {
  PORTUGUESE: { name: 'Portuguese', flag: '🇧🇷' },
  SPANISH: { name: 'Spanish', flag: '🇪🇸' },
  ENGLISH: { name: 'English', flag: '🇺🇸' },
  ITALIAN: { name: 'Italian', flag: '🇮🇹' },
  FRENCH: { name: 'French', flag: '🇫🇷' },
  GERMAN: { name: 'German', flag: '🇩🇪' },
  JAPANESE: { name: 'Japanese', flag: '🇯🇵' },
  KOREAN: { name: 'Korean', flag: '🇰🇷' },
};

const ProfileTab = () => {
  const navigation = useNavigation();
  const { user, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);
  const [languageStats, setLanguageStats] = useState<any[]>([]);
  const [preferredLanguage, setPreferredLanguage] = useState<Language>('SPANISH');
  const [preferredLanguageElo, setPreferredLanguageElo] = useState<number>(1000);
  const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false);

  // Load preferred language on mount
  useEffect(() => {
    loadPreferredLanguage();
  }, []);

  // Reload user stats when tab comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserStats();
      loadLanguageStats();
      refreshUser(); // Refresh user data from auth context
    }, [])
  );

  useEffect(() => {
    loadUserStats();
    loadLanguageStats();
  }, []);

  // Update ELO when language stats or preferred language changes
  useEffect(() => {
    if (languageStats.length > 0) {
      const stats = languageStats.find((s) => s.language === preferredLanguage);
      if (stats) {
        setPreferredLanguageElo(stats.eloRating);
      }
    }
  }, [languageStats, preferredLanguage]);

  const loadUserStats = async () => {
    try {
      const response = await userService.getProfile();
      setUserStats(response.data);
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const loadPreferredLanguage = async () => {
    try {
      const stored = await AsyncStorage.getItem('preferredLanguage');
      if (stored) {
        setPreferredLanguage(stored as Language);
      }
    } catch (error) {
      console.error('Failed to load preferred language:', error);
    }
  };

  const savePreferredLanguage = async (language: Language) => {
    try {
      await AsyncStorage.setItem('preferredLanguage', language);
      setPreferredLanguage(language);
      setLanguageSelectorVisible(false);

      // Update ELO for the new preferred language
      const stats = languageStats.find((s) => s.language === language);
      if (stats) {
        setPreferredLanguageElo(stats.eloRating);
      }
    } catch (error) {
      console.error('Failed to save preferred language:', error);
    }
  };

  const loadLanguageStats = async () => {
    try {
      const response = await userService.getLanguageStats();
      const stats = response.data?.stats || [];
      setLanguageStats(stats);
    } catch (error) {
      console.error('Failed to load language stats:', error);
      setLanguageStats([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserStats();
    await loadLanguageStats();
    setRefreshing(false);
  };

  const StatCard = ({ icon, value, label, color }: any) => (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, color && { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const MenuCard = ({ icon, title, subtitle, color, onPress }: any) => (
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
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Profile</Text>
            <Text style={styles.username}>{user?.displayName || user?.username}</Text>
          </View>
          {user?.division && (
            <DivisionBadge
              division={user.division}
              divisionInfo={userStats?.user?.divisionInfo}
              size="small"
            />
          )}
        </View>
      </View>

      <View style={styles.statsContainer}>
        <StatCard
          icon="🔥"
          value={user?.currentStreak || 0}
          label="Day Streak"
          color="#FF6B35"
        />
        <StatCard
          icon="⭐"
          value={user?.totalPoints || 0}
          label="Points"
          color="#FFD700"
        />
        <TouchableOpacity
          style={styles.eloStatCard}
          onPress={() => setLanguageSelectorVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🏆</Text>
            <Text style={[styles.statValue, { color: '#4A90E2' }]}>
              {preferredLanguageElo || 1000}
            </Text>
            <View style={styles.eloLabelContainer}>
              <Text style={styles.statLabel}>ELO</Text>
              <Text style={styles.languageFlag}>{LANGUAGE_INFO[preferredLanguage].flag}</Text>
            </View>
            <Text style={styles.changeLanguageHint}>Tap to change</Text>
          </View>
        </TouchableOpacity>
      </View>

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>More Stats</Text>
        <MenuCard
          icon="👤"
          title="Full Profile"
          subtitle="View detailed statistics and history"
          color="#8E8E93"
          onPress={() => navigation.navigate('Profile' as never)}
        />
        <MenuCard
          icon="📜"
          title="Match History"
          subtitle="Review your past battles"
          color="#FF9500"
          onPress={() => navigation.navigate('MatchHistory' as never)}
        />
        <MenuCard
          icon="🏅"
          title="Language Stats"
          subtitle="Rankings and stats by language"
          color="#5856D6"
          onPress={() => navigation.navigate('LanguageStats' as never)}
        />
        <MenuCard
          icon="📊"
          title="Leaderboard"
          subtitle="See how you rank globally"
          color="#34C759"
          onPress={() => navigation.navigate('Leaderboard' as never)}
        />
      </View>

      {/* Language Selector Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={languageSelectorVisible}
        onRequestClose={() => setLanguageSelectorVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setLanguageSelectorVisible(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your Primary Language</Text>
              <TouchableOpacity
                onPress={() => setLanguageSelectorVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
              {Object.keys(LANGUAGE_INFO).map((lang) => {
                const language = lang as Language;
                const info = LANGUAGE_INFO[language];
                const stats = languageStats.find((s) => s.language === language);
                const isSelected = preferredLanguage === language;

                return (
                  <TouchableOpacity
                    key={language}
                    style={[
                      styles.languageOption,
                      isSelected && styles.languageOptionSelected,
                    ]}
                    onPress={() => savePreferredLanguage(language)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.languageFlag2}>{info.flag}</Text>
                    <View style={styles.languageInfo}>
                      <Text style={styles.languageName}>{info.name}</Text>
                      {stats && (
                        <Text style={styles.languageElo}>
                          ELO: {stats.eloRating} • {stats.totalMatches} matches
                        </Text>
                      )}
                    </View>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
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
    padding: 16,
    gap: 10,
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
  eloStatCard: {
    flex: 1,
  },
  eloLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  languageFlag: {
    fontSize: 14,
  },
  changeLanguageHint: {
    fontSize: 9,
    color: '#999',
    marginTop: 4,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 17,
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
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
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
    fontSize: 28,
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  cardArrow: {
    fontSize: 28,
    color: '#ccc',
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 90,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  languageList: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  languageOptionSelected: {
    backgroundColor: '#f0f8ff',
    borderColor: '#4A90E2',
  },
  languageFlag2: {
    fontSize: 32,
    marginRight: 12,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  languageElo: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  checkmark: {
    fontSize: 20,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
});

export default ProfileTab;
