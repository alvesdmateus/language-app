import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { flashcardService } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { LANGUAGE_INFO } from '../theme/languages';
import { colors, gradients, spacing, radii, shadows, typography } from '../theme';

interface Flashcard {
  id: string;
  frontText: string;
  backText: string;
  contextSentence?: string;
  category: string;
  source: 'CURATED' | 'NEWS_API' | 'TRENDING' | 'USER_GENERATED';
  sourceTitle?: string;
  sourceUrl?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  imageUrl?: string;
}

type Language = 'SPANISH' | 'PORTUGUESE' | 'FRENCH' | 'GERMAN' | 'ITALIAN' | 'JAPANESE' | 'KOREAN';

const { width, height } = Dimensions.get('window');

const FlashcardsScreen = () => {
  const navigation = useNavigation();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [knownCount, setKnownCount] = useState(0);
  const [unknownCount, setUnknownCount] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Filters
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('SPANISH');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [cardCount, setCardCount] = useState(10);

  const flipAnimation = new Animated.Value(0);

  useEffect(() => {
    loadFlashcards();
  }, [selectedLanguage, selectedCategory, selectedDifficulty, cardCount]);

  const loadFlashcards = async () => {
    try {
      setLoading(true);
      const response = await flashcardService.getFlashcards(
        cardCount,
        selectedLanguage,
        selectedCategory || undefined,
        selectedDifficulty || undefined
      );
      setFlashcards(response.data.flashcards);
      setCurrentIndex(0);
      setKnownCount(0);
      setUnknownCount(0);
      setSessionComplete(false);
      setIsFlipped(false);
      flipAnimation.setValue(0);
    } catch (error) {
      console.error('Failed to load flashcards:', error);
    } finally {
      setLoading(false);
    }
  };

  const flipCard = () => {
    if (isFlipped) {
      Animated.spring(flipAnimation, {
        toValue: 0,
        friction: 7,
        tension: 15,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(flipAnimation, {
        toValue: 180,
        friction: 7,
        tension: 15,
        useNativeDriver: true,
      }).start();
    }
    setIsFlipped(!isFlipped);
  };

  const handleKnown = () => {
    setKnownCount(knownCount + 1);
    nextCard();
  };

  const handleUnknown = () => {
    setUnknownCount(unknownCount + 1);
    nextCard();
  };

  const nextCard = () => {
    if (currentIndex + 1 >= flashcards.length) {
      setSessionComplete(true);
    } else {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      flipAnimation.setValue(0);
    }
  };

  const resetSession = () => {
    setCurrentIndex(0);
    setKnownCount(0);
    setUnknownCount(0);
    setSessionComplete(false);
    setIsFlipped(false);
    flipAnimation.setValue(0);
    loadFlashcards();
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnimation.interpolate({
    inputRange: [0, 89, 91, 180],
    outputRange: [1, 1, 0, 0],
  });

  const backOpacity = flipAnimation.interpolate({
    inputRange: [0, 89, 91, 180],
    outputRange: [0, 0, 1, 1],
  });

  const getLanguageFlag = (lang: Language) => {
    return (LANGUAGE_INFO as any)[lang]?.flag || '';
  };

  const getLanguageName = (lang: Language) => {
    return (LANGUAGE_INFO as any)[lang]?.name || lang;
  };

  const renderHighlightedText = (text: string, keyword: string) => {
    if (!text || !keyword) return <Text style={styles.contextText}>"{text}"</Text>;

    const lowerText = text.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    const startIndex = lowerText.indexOf(lowerKeyword);

    if (startIndex === -1) {
      return <Text style={styles.contextText}>"{text}"</Text>;
    }

    const beforeKeyword = text.substring(0, startIndex);
    const keywordText = text.substring(startIndex, startIndex + keyword.length);
    const afterKeyword = text.substring(startIndex + keyword.length);

    return (
      <Text style={styles.contextText}>
        "{beforeKeyword}
        <TouchableOpacity
          onPress={() => setShowExplanation(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.highlightedKeyword}>{keywordText}</Text>
        </TouchableOpacity>
        {afterKeyword}"
      </Text>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={styles.loadingText}>Loading flashcards...</Text>
      </View>
    );
  }

  if (flashcards.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="book-outline" size={64} color={colors.textTertiary} />
        <Text style={styles.emptyTitle}>No Flashcards Available</Text>
        <Text style={styles.emptyText}>
          Try changing your filters or check back later
        </Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettings(true)}
        >
          <Ionicons name="settings-outline" size={18} color={colors.textPrimary} />
          <Text style={styles.settingsButtonText}>Change Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (sessionComplete) {
    const total = knownCount + unknownCount;
    const percentage = total > 0 ? Math.round((knownCount / total) * 100) : 0;

    return (
      <View style={styles.container}>
        <View style={styles.resultsContainer}>
          <Ionicons name="ribbon" size={72} color={colors.primary} />
          <Text style={styles.resultsTitle}>Session Complete!</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{total}</Text>
              <Text style={styles.statLabel}>Cards Reviewed</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{knownCount}</Text>
              <Text style={styles.statLabel}>Known</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.danger }]}>{unknownCount}</Text>
              <Text style={styles.statLabel}>Need Practice</Text>
            </View>
          </View>

          <View style={styles.percentageContainer}>
            <Text style={styles.percentageText}>{percentage}%</Text>
            <Text style={styles.percentageLabel}>Accuracy</Text>
          </View>

          <TouchableOpacity style={styles.resetButton} onPress={resetSession} activeOpacity={0.8}>
            <Ionicons name="refresh" size={20} color={colors.textInverse} />
            <Text style={styles.resetButtonText}>Study More Cards</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.homeButton} onPress={() => navigation.goBack()}>
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color={colors.secondary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {getLanguageFlag(selectedLanguage)} {getLanguageName(selectedLanguage)}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowSettings(true)}>
          <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {flashcards.length}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentIndex + 1) / flashcards.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      {/* Score */}
      <View style={styles.scoreContainer}>
        <View style={styles.scoreBox}>
          <Text style={[styles.scoreValue, { color: colors.primary }]}>{knownCount}</Text>
          <View style={styles.scoreLabelRow}>
            <Ionicons name="checkmark" size={12} color={colors.primary} />
            <Text style={styles.scoreLabel}>Known</Text>
          </View>
        </View>
        <View style={styles.scoreBox}>
          <Text style={[styles.scoreValue, { color: colors.danger }]}>{unknownCount}</Text>
          <View style={styles.scoreLabelRow}>
            <Ionicons name="close" size={12} color={colors.danger} />
            <Text style={styles.scoreLabel}>Learning</Text>
          </View>
        </View>
      </View>

      {/* Flashcard */}
      <View style={styles.cardContainer}>
        <TouchableOpacity activeOpacity={0.9} onPress={flipCard}>
          <View style={styles.cardWrapper}>
            <Animated.View
              style={[
                styles.card,
                {
                  transform: [{ rotateY: frontInterpolate }],
                  opacity: frontOpacity,
                },
              ]}
              pointerEvents={isFlipped ? 'none' : 'auto'}
            >
              <View style={styles.cardContent}>
                <Text style={styles.categoryLabel}>{formatCategory(currentCard.category)}</Text>
                {currentCard.contextSentence ? (
                  <View style={styles.contextBox}>
                    {renderHighlightedText(currentCard.contextSentence, currentCard.frontText)}
                  </View>
                ) : (
                  <Text style={styles.wordText}>{currentCard.frontText}</Text>
                )}
                <View style={styles.tapHintRow}>
                  <Ionicons name="hand-left-outline" size={14} color={colors.textTertiary} />
                  <Text style={styles.tapHint}>Tap to see translation</Text>
                </View>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.card,
                styles.cardBack,
                {
                  transform: [{ rotateY: backInterpolate }],
                  opacity: backOpacity,
                },
              ]}
              pointerEvents={isFlipped ? 'auto' : 'none'}
            >
              <View style={styles.cardContent}>
                <Text style={styles.translationLabel}>{getLanguageName(selectedLanguage)}</Text>
                <Text style={styles.translationText}>{currentCard.frontText}</Text>

                <View style={styles.divider} />

                <Text style={styles.originalLabel}>English Translation</Text>
                <Text style={styles.originalText}>{currentCard.backText}</Text>
              </View>
            </Animated.View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={[styles.actionButton, styles.unknownButton]} onPress={handleUnknown} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.textInverse} />
          <Text style={styles.actionButtonLabel}>Don't Know</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.knownButton]} onPress={handleKnown} activeOpacity={0.8}>
          <Ionicons name="checkmark" size={22} color={colors.textInverse} />
          <Text style={styles.actionButtonLabel}>Know It</Text>
        </TouchableOpacity>
      </View>

      {/* Explanation Modal */}
      <Modal
        visible={showExplanation}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowExplanation(false)}
      >
        <TouchableOpacity
          style={styles.explanationOverlay}
          activeOpacity={1}
          onPress={() => setShowExplanation(false)}
        >
          <View style={styles.explanationBox}>
            <View style={styles.explanationHeader}>
              <Text style={styles.explanationKeyword}>{currentCard.frontText}</Text>
              <TouchableOpacity onPress={() => setShowExplanation(false)}>
                <Ionicons name="close" size={24} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.explanationMeaning}>
              <Text style={styles.explanationLabel}>Meaning: </Text>
              {currentCard.backText}
            </Text>
            {currentCard.contextSentence && (
              <View style={styles.explanationContext}>
                <Text style={styles.explanationLabel}>Used in context:</Text>
                <Text style={styles.explanationContextText}>"{currentCard.contextSentence}"</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Ionicons name="close" size={26} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Language Selection */}
              <Text style={styles.sectionTitle}>Language</Text>
              <View style={styles.optionsGrid}>
                {(['SPANISH', 'PORTUGUESE', 'FRENCH', 'GERMAN', 'ITALIAN', 'JAPANESE', 'KOREAN'] as Language[]).map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.optionButton,
                      selectedLanguage === lang && styles.optionButtonActive,
                    ]}
                    onPress={() => setSelectedLanguage(lang)}
                  >
                    <Text style={styles.optionFlag}>{getLanguageFlag(lang)}</Text>
                    <Text
                      style={[
                        styles.optionText,
                        selectedLanguage === lang && styles.optionTextActive,
                      ]}
                    >
                      {getLanguageName(lang)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Card Count */}
              <Text style={styles.sectionTitle}>Number of Cards</Text>
              <View style={styles.optionsGrid}>
                {[5, 10, 15, 20].map((count) => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.optionButton,
                      cardCount === count && styles.optionButtonActive,
                    ]}
                    onPress={() => setCardCount(count)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        cardCount === count && styles.optionTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Difficulty */}
              <Text style={styles.sectionTitle}>Difficulty</Text>
              <View style={styles.optionsGrid}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    selectedDifficulty === '' && styles.optionButtonActive,
                  ]}
                  onPress={() => setSelectedDifficulty('')}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedDifficulty === '' && styles.optionTextActive,
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {['EASY', 'MEDIUM', 'HARD'].map((diff) => (
                  <TouchableOpacity
                    key={diff}
                    style={[
                      styles.optionButton,
                      selectedDifficulty === diff && styles.optionButtonActive,
                    ]}
                    onPress={() => setSelectedDifficulty(diff)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedDifficulty === diff && styles.optionTextActive,
                      ]}
                    >
                      {diff}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Categories */}
              <Text style={styles.sectionTitle}>Category</Text>
              <View style={styles.optionsGrid}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    selectedCategory === '' && styles.optionButtonActive,
                  ]}
                  onPress={() => setSelectedCategory('')}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedCategory === '' && styles.optionTextActive,
                    ]}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {['MOVIES', 'SPORTS', 'TECHNOLOGY', 'MUSIC', 'FOOD', 'GAMING'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.optionButton,
                      selectedCategory === cat && styles.optionButtonActive,
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedCategory === cat && styles.optionTextActive,
                      ]}
                    >
                      {formatCategory(cat)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => {
                setShowSettings(false);
                loadFlashcards();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const formatCategory = (category: string) => {
  return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.title,
    fontSize: 18,
  },
  settingsButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingsButtonText: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  progressContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  progressText: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: 3,
  },
  scoreContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: 10,
  },
  scoreBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreValue: {
    ...typography.stat,
  },
  scoreLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    marginTop: 2,
  },
  scoreLabel: {
    ...typography.label,
    fontSize: 11,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  cardWrapper: {
    width: '100%',
    aspectRatio: 1.5,
    maxHeight: 350,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    justifyContent: 'center',
    ...shadows.lg,
    backfaceVisibility: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardBack: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryLabel: {
    ...typography.label,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  wordText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  contextBox: {
    padding: spacing.md + 2,
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  contextText: {
    ...typography.body,
    lineHeight: 24,
  },
  highlightedKeyword: {
    fontWeight: 'bold',
    color: colors.secondary,
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.sm / 2,
  },
  translationLabel: {
    ...typography.label,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  translationText: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.textInverse,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: spacing.md + 2,
  },
  originalLabel: {
    ...typography.label,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  originalText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 26,
  },
  tapHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md + 2,
    gap: spacing.xs,
  },
  tapHint: {
    ...typography.caption,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs + 2,
  },
  unknownButton: {
    backgroundColor: colors.danger,
    ...shadows.dangerButton,
  },
  knownButton: {
    backgroundColor: colors.primary,
    ...shadows.primaryButton,
  },
  actionButtonLabel: {
    ...typography.buttonSmall,
    color: colors.textInverse,
  },
  loadingText: {
    marginTop: spacing.lg,
    ...typography.body,
    color: colors.textSecondary,
  },
  emptyTitle: {
    ...typography.h2,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  backButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.xxxl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    ...shadows.secondaryButton,
  },
  backButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  resultsTitle: {
    ...typography.h2,
    marginTop: spacing.xl,
    marginBottom: spacing.xxxl,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxxl,
    width: '100%',
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    ...typography.h1,
    color: colors.secondary,
  },
  statLabel: {
    ...typography.caption,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  percentageContainer: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xxxl,
    alignItems: 'center',
    marginBottom: spacing.xxxl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  percentageText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: colors.primary,
  },
  percentageLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  resetButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 40,
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.secondaryButton,
  },
  resetButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
  homeButton: {
    paddingHorizontal: 40,
    paddingVertical: spacing.lg,
  },
  homeButtonText: {
    ...typography.subtitle,
    color: colors.secondary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.pill,
    borderTopRightRadius: radii.pill,
    paddingTop: spacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
  },
  modalScroll: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.title,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  optionButton: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: colors.secondaryLight,
    borderColor: colors.secondary,
  },
  optionFlag: {
    fontSize: 20,
    marginBottom: 3,
  },
  optionText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  optionTextActive: {
    color: colors.secondary,
  },
  applyButton: {
    backgroundColor: colors.secondary,
    marginHorizontal: spacing.xxl,
    marginVertical: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    ...shadows.secondaryButton,
  },
  applyButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
  // Explanation Modal styles
  explanationOverlay: {
    flex: 1,
    backgroundColor: colors.overlayDark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  explanationBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...shadows.xl,
  },
  explanationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  explanationKeyword: {
    ...typography.h2,
    color: colors.secondary,
    flex: 1,
  },
  explanationLabel: {
    ...typography.label,
    color: colors.textSecondary,
  },
  explanationMeaning: {
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    lineHeight: 26,
  },
  explanationContext: {
    backgroundColor: colors.background,
    padding: spacing.md + 2,
    borderRadius: radii.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.secondary,
  },
  explanationContextText: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
});

export default FlashcardsScreen;
