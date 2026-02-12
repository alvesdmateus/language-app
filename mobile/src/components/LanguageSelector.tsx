import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Language } from '../types';
import { LANGUAGE_INFO } from '../theme/languages';
import { colors, spacing, radii, shadows, typography } from '../theme';

interface LanguageSelectorProps {
  selectedLanguage: Language | null;
  onSelectLanguage: (language: Language) => void;
  disabled?: boolean;
  languageStats?: Record<Language, {
    eloRating: number;
    division: string;
    totalMatches: number;
    wins: number;
    losses: number;
    draws: number;
  }>;
  showStats?: boolean;
  navigation?: any;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onSelectLanguage,
  disabled = false,
  languageStats,
  showStats = false,
  navigation,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (navigation) {
      if (modalVisible) {
        navigation.setOptions({
          tabBarStyle: { display: 'none' },
        });
      } else {
        navigation.setOptions({
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            height: 70,
            paddingBottom: 10,
            paddingTop: 8,
          },
        });
      }
    }
  }, [modalVisible, navigation]);

  const handleLanguageSelect = (language: Language) => {
    onSelectLanguage(language);
    setModalVisible(false);
  };

  const selectedInfo = selectedLanguage ? LANGUAGE_INFO[selectedLanguage] : null;

  return (
    <View>
      <TouchableOpacity
        style={[styles.selector, disabled && styles.selectorDisabled]}
        onPress={() => setModalVisible(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {selectedInfo ? (
          <View style={styles.selectedContent}>
            <Text style={styles.selectedFlag}>{selectedInfo.flag}</Text>
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedLabel}>Selected Language</Text>
              <Text style={styles.selectedName}>{selectedInfo.name}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.selectedContent}>
            <View style={styles.globeIcon}>
              <Ionicons name="globe-outline" size={28} color={colors.secondary} />
            </View>
            <View style={styles.selectedInfo}>
              <Text style={styles.placeholderText}>Select a language</Text>
              <Text style={styles.placeholderSubtext}>Tap to choose</Text>
            </View>
          </View>
        )}
        <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
              {Object.keys(LANGUAGE_INFO).map((lang) => {
                const language = lang as Language;
                const info = LANGUAGE_INFO[language];
                const stats = languageStats?.[language];
                const isSelected = selectedLanguage === language;
                const winRate = stats && stats.totalMatches > 0
                  ? ((stats.wins / stats.totalMatches) * 100).toFixed(1)
                  : '0.0';

                return (
                  <TouchableOpacity
                    key={language}
                    style={[
                      styles.languageOption,
                      isSelected && styles.languageOptionSelected,
                      { borderLeftColor: info.color },
                    ]}
                    onPress={() => handleLanguageSelect(language)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.languageHeader}>
                      <Text style={styles.languageFlag}>{info.flag}</Text>
                      <View style={styles.languageInfo}>
                        <Text style={styles.languageName}>{info.name}</Text>
                        {showStats && stats && (
                          <Text style={styles.languageSubtitle}>
                            {stats.totalMatches} matches
                          </Text>
                        )}
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                      )}
                    </View>

                    {showStats && stats && (
                      <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                          <Text style={styles.statLabel}>ELO</Text>
                          <Text style={[styles.statValue, { color: info.color }]}>
                            {stats.eloRating}
                          </Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statLabel}>DIVISION</Text>
                          <Text style={styles.statValue}>{stats.division}</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statLabel}>WIN RATE</Text>
                          <Text style={styles.statValue}>{winRate}%</Text>
                        </View>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  selector: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.md,
  },
  selectorDisabled: {
    opacity: 0.6,
  },
  selectedContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedFlag: {
    fontSize: 40,
    marginRight: spacing.lg,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  selectedName: {
    ...typography.h3,
  },
  globeIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  placeholderSubtext: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '80%',
    paddingBottom: 90,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageList: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  languageOption: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  languageOptionSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  languageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageFlag: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    ...typography.title,
  },
  languageSubtitle: {
    ...typography.caption,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});

export default LanguageSelector;
