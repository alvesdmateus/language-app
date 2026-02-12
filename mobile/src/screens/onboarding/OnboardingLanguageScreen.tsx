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
import { Ionicons } from '@expo/vector-icons';
import { Language } from '../../types';
import { userService } from '../../services/api';
import { LANGUAGES_LIST } from '../../theme/languages';
import { colors, spacing, radii, shadows, typography } from '../../theme';

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
      await userService.updateFavoriteLanguage(selectedLanguage);
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
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Language</Text>
        <Text style={styles.subtitle}>
          Pick the language you want to learn and master
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.languageGrid}
        showsVerticalScrollIndicator={false}
      >
        {LANGUAGES_LIST.map((lang) => {
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
                {lang.nativeName}
              </Text>
              {isSelected && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark" size={16} color={colors.white} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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
            <ActivityIndicator color={colors.white} />
          ) : (
            <View style={styles.continueContent}>
              <Text style={styles.continueButtonText}>Continue to First Battle</Text>
              <Ionicons name="game-controller" size={18} color={colors.white} style={{ marginLeft: 8 }} />
            </View>
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
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.lg,
    gap: spacing.md,
  },
  languageCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative',
    ...shadows.sm,
  },
  languageCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    ...shadows.md,
  },
  languageFlag: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  languageName: {
    ...typography.title,
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  languageNameSelected: {
    color: colors.primaryDark,
  },
  languageDescription: {
    ...typography.bodySmall,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  languageDescriptionSelected: {
    color: colors.primaryDark,
  },
  checkmark: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: radii.md,
    alignItems: 'center',
    borderBottomWidth: 4,
    borderBottomColor: colors.primaryDark,
    marginBottom: spacing.md,
    ...shadows.primaryButton,
  },
  continueButtonDisabled: {
    backgroundColor: colors.textTertiary,
    borderBottomColor: colors.textSecondary,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  continueButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
  footerNote: {
    ...typography.caption,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default OnboardingLanguageScreen;
