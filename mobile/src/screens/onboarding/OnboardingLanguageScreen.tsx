import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language } from '../../types';
import { userService } from '../../services/api';

interface LanguageOption {
  value: Language;
  flag: string;
  name: string;
  description: string;
}

const languages: LanguageOption[] = [
  { value: 'SPANISH', flag: '🇪🇸', name: 'Spanish', description: 'Español' },
  { value: 'PORTUGUESE', flag: '🇧🇷', name: 'Portuguese', description: 'Português' },
  { value: 'FRENCH', flag: '🇫🇷', name: 'French', description: 'Français' },
  { value: 'GERMAN', flag: '🇩🇪', name: 'German', description: 'Deutsch' },
  { value: 'ITALIAN', flag: '🇮🇹', name: 'Italian', description: 'Italiano' },
  { value: 'JAPANESE', flag: '🇯🇵', name: 'Japanese', description: '日本語' },
  { value: 'KOREAN', flag: '🇰🇷', name: 'Korean', description: '한국어' },
  { value: 'ENGLISH', flag: '🇺🇸', name: 'English', description: 'English' },
];

const OnboardingLanguageScreen = () => {
  const navigation = useNavigation();
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
  };

  const handleContinue = async () => {
    if (!selectedLanguage) {
      Alert.alert('Select a Language', 'Please choose your favorite language to continue.');
      return;
    }

    try {
      setIsLoading(true);

      // Update user's favorite language
      await userService.updateFavoriteLanguage(selectedLanguage);

      // Navigate to first battle
      navigation.navigate('OnboardingFirstBattle' as never, { language: selectedLanguage } as never);
    } catch (error: any) {
      console.error('Failed to update favorite language:', error);
      Alert.alert('Error', 'Failed to save your language preference. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Language</Text>
        <Text style={styles.subtitle}>
          Pick the language you want to learn and master
        </Text>
      </View>

      {/* Language Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.languageGrid}
        showsVerticalScrollIndicator={false}
      >
        {languages.map((lang) => {
          const isSelected = selectedLanguage === lang.value;

          return (
            <TouchableOpacity
              key={lang.value}
              style={[
                styles.languageCard,
                isSelected && styles.languageCardSelected,
              ]}
              onPress={() => handleLanguageSelect(lang.value)}
              activeOpacity={0.7}
            >
              <Text style={styles.languageFlag}>{lang.flag}</Text>
              <Text style={[styles.languageName, isSelected && styles.languageNameSelected]}>
                {lang.name}
              </Text>
              <Text style={[styles.languageDescription, isSelected && styles.languageDescriptionSelected]}>
                {lang.description}
              </Text>
              {isSelected && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedLanguage && styles.continueButtonDisabled,
            isLoading && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedLanguage || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.continueButtonText}>
              Continue to First Battle 🎮
            </Text>
          )}
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          You can change this later in settings
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  languageCard: {
    width: '47%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  languageCardSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#E3F2FD',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  languageFlag: {
    fontSize: 48,
    marginBottom: 12,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  languageNameSelected: {
    color: '#4A90E2',
  },
  languageDescription: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  languageDescriptionSelected: {
    color: '#4A90E2',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  continueButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 12,
  },
  continueButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  footerNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default OnboardingLanguageScreen;
