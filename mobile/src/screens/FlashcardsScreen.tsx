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
import { flashcardService } from '../services/api';
import { useNavigation } from '@react-navigation/native';

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
    const flags = {
      SPANISH: '🇪🇸',
      PORTUGUESE: '🇧🇷',
      FRENCH: '🇫🇷',
      GERMAN: '🇩🇪',
      ITALIAN: '🇮🇹',
      JAPANESE: '🇯🇵',
      KOREAN: '🇰🇷',
    };
    return flags[lang] || '🌍';
  };

  const getLanguageName = (lang: Language) => {
    const names = {
      SPANISH: 'Spanish',
      PORTUGUESE: 'Portuguese',
      FRENCH: 'French',
      GERMAN: 'German',
      ITALIAN: 'Italian',
      JAPANESE: 'Japanese',
      KOREAN: 'Korean',
    };
    return names[lang] || lang;
  };

  const renderHighlightedText = (text: string, keyword: string) => {
    if (!text || !keyword) return <Text style={styles.contextText}>"{text}"</Text>;

    // Find the keyword in the text (case-insensitive)
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
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading flashcards...</Text>
      </View>
    );
  }

  if (flashcards.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>📚</Text>
        <Text style={styles.emptyTitle}>No Flashcards Available</Text>
        <Text style={styles.emptyText}>
          Try changing your filters or check back later
        </Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettings(true)}
        >
          <Text style={styles.settingsButtonText}>⚙️ Change Settings</Text>
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
          <Text style={styles.resultsIcon}>🎉</Text>
          <Text style={styles.resultsTitle}>Session Complete!</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{total}</Text>
              <Text style={styles.statLabel}>Cards Reviewed</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#34C759' }]}>{knownCount}</Text>
              <Text style={styles.statLabel}>Known</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#FF3B30' }]}>{unknownCount}</Text>
              <Text style={styles.statLabel}>Need Practice</Text>
            </View>
          </View>

          <View style={styles.percentageContainer}>
            <Text style={styles.percentageText}>{percentage}%</Text>
            <Text style={styles.percentageLabel}>Accuracy</Text>
          </View>

          <TouchableOpacity style={styles.resetButton} onPress={resetSession}>
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
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {getLanguageFlag(selectedLanguage)} {getLanguageName(selectedLanguage)}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowSettings(true)}>
          <Text style={styles.settingsIcon}>⚙️</Text>
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
          <Text style={[styles.scoreValue, { color: '#34C759' }]}>{knownCount}</Text>
          <Text style={styles.scoreLabel}>✓ Known</Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={[styles.scoreValue, { color: '#FF3B30' }]}>{unknownCount}</Text>
          <Text style={styles.scoreLabel}>✗ Learning</Text>
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
                <Text style={styles.tapHint}>👆 Tap to see translation</Text>
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
        <TouchableOpacity style={[styles.actionButton, styles.unknownButton]} onPress={handleUnknown}>
          <Text style={styles.actionButtonIcon}>✗</Text>
          <Text style={styles.actionButtonLabel}>Don't Know</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.knownButton]} onPress={handleKnown}>
          <Text style={styles.actionButtonIcon}>✓</Text>
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
                <Text style={styles.explanationClose}>✕</Text>
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
                <Text style={styles.modalClose}>✕</Text>
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
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getDifficultyColor = (difficulty: string) => {
  if (difficulty === 'EASY') return { backgroundColor: '#34C759' };
  if (difficulty === 'MEDIUM') return { backgroundColor: '#FF9500' };
  return { backgroundColor: '#FF3B30' };
};

const getSourceColor = (source: string) => {
  if (source === 'CURATED') return { backgroundColor: '#5856D6' };
  if (source === 'NEWS_API') return { backgroundColor: '#FF2D55' };
  if (source === 'TRENDING') return { backgroundColor: '#FF9500' };
  return { backgroundColor: '#8E8E93' };
};

const getSourceLabel = (source: string) => {
  if (source === 'CURATED') return '✨';
  if (source === 'NEWS_API') return '📰';
  if (source === 'TRENDING') return '🔥';
  return '•';
};

const formatCategory = (category: string) => {
  return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  backIcon: {
    fontSize: 26,
    color: '#4A90E2',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  settingsIcon: {
    fontSize: 22,
  },
  settingsButton: {
    marginTop: 20,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  progressText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e8e8e8',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 3,
  },
  scoreContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 10,
  },
  scoreBox: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    fontWeight: '600',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
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
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    backfaceVisibility: 'hidden',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  cardBack: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  cardBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  wordText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  contextBox: {
    padding: 14,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90E2',
  },
  contextText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  highlightedKeyword: {
    fontWeight: 'bold',
    color: '#4A90E2',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  translationLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  translationText: {
    fontSize: 30,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: 14,
  },
  originalLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  originalText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 26,
  },
  sourceInfo: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  sourceInfoText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  tapHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  unknownButton: {
    backgroundColor: '#FF3B30',
  },
  knownButton: {
    backgroundColor: '#34C759',
  },
  actionButtonIcon: {
    fontSize: 18,
    color: 'white',
  },
  actionButtonLabel: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  backButton: {
    marginTop: 16,
    backgroundColor: '#4A90E2',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultsIcon: {
    fontSize: 72,
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
    width: '100%',
  },
  statBox: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  percentageContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  percentageText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#34C759',
  },
  percentageLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  resetButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  homeButton: {
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  homeButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalClose: {
    fontSize: 26,
    color: '#999',
    fontWeight: '300',
  },
  modalScroll: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    marginTop: 8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#4A90E2',
  },
  optionFlag: {
    fontSize: 20,
    marginBottom: 3,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  optionTextActive: {
    color: '#4A90E2',
  },
  applyButton: {
    backgroundColor: '#4A90E2',
    marginHorizontal: 24,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  // Explanation Modal styles
  explanationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  explanationBox: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  explanationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  explanationKeyword: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
    flex: 1,
  },
  explanationClose: {
    fontSize: 24,
    color: '#999',
    fontWeight: '300',
    paddingLeft: 10,
  },
  explanationLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  explanationMeaning: {
    fontSize: 18,
    color: '#333',
    marginBottom: 16,
    lineHeight: 26,
  },
  explanationContext: {
    backgroundColor: '#f8f9fa',
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#4A90E2',
  },
  explanationContextText: {
    fontSize: 15,
    color: '#555',
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 22,
  },
});

export default FlashcardsScreen;
