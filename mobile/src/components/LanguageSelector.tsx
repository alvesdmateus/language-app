import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { Language } from '../types';

interface LanguageInfo {
  name: string;
  flag: string;
  color: string;
}

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
}

const LANGUAGE_INFO: Record<Language, LanguageInfo> = {
  PORTUGUESE: { name: 'Portuguese', flag: '🇧🇷', color: '#009739' },
  SPANISH: { name: 'Spanish', flag: '🇪🇸', color: '#C60B1E' },
  ENGLISH: { name: 'English', flag: '🇺🇸', color: '#3C3B6E' },
  ITALIAN: { name: 'Italian', flag: '🇮🇹', color: '#009246' },
  FRENCH: { name: 'French', flag: '🇫🇷', color: '#0055A4' },
  GERMAN: { name: 'German', flag: '🇩🇪', color: '#000000' },
  JAPANESE: { name: 'Japanese', flag: '🇯🇵', color: '#BC002D' },
  KOREAN: { name: 'Korean', flag: '🇰🇷', color: '#003478' },
};

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onSelectLanguage,
  disabled = false,
  languageStats,
  showStats = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleLanguageSelect = (language: Language) => {
    onSelectLanguage(language);
    setModalVisible(false);
  };

  const selectedInfo = selectedLanguage ? LANGUAGE_INFO[selectedLanguage] : null;

  return (
    <View>
      {/* Selected Language Display */}
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
            <Text style={styles.placeholderIcon}>🌍</Text>
            <View style={styles.selectedInfo}>
              <Text style={styles.placeholderText}>Select a language</Text>
              <Text style={styles.placeholderSubtext}>Tap to choose</Text>
            </View>
          </View>
        )}
        <Text style={styles.chevron}>▼</Text>
      </TouchableOpacity>

      {/* Language Selection Modal */}
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
                <Text style={styles.closeButtonText}>✕</Text>
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
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
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
                          <Text style={styles.statLabel}>Division</Text>
                          <Text style={styles.statValue}>{stats.division}</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statLabel}>Win Rate</Text>
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
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    marginRight: 16,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  selectedName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholderIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
  },
  placeholderSubtext: {
    fontSize: 13,
    color: '#bbb',
    marginTop: 2,
  },
  chevron: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
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
    maxHeight: '80%',
    paddingBottom: 20,
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
    fontSize: 20,
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
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  languageOptionSelected: {
    backgroundColor: '#f0f8ff',
    borderColor: '#4A90E2',
  },
  languageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageFlag: {
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
  languageSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  checkmark: {
    fontSize: 20,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default LanguageSelector;
