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

type Language = 'SPANISH' | 'PORTUGUESE' | 'FRENCH';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

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
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(flipAnimation, {
        toValue: 180,
        friction: 8,
        tension: 10,
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
    inputRange: [0, 90, 90, 180],
    outputRange: [1, 1, 0, 0],
  });

  const backOpacity = flipAnimation.interpolate({
    inputRange: [0, 90, 90, 180],
    outputRange: [0, 0, 1, 1],
  });

  const getLanguageFlag = (lang: Language) => {
    if (lang === 'SPANISH') return '🇪🇸';
    if (lang === 'PORTUGUESE') return '🇧🇷';
    if (lang === 'FRENCH') return '🇫🇷';
    return '🌍';
  };

  const getLanguageName = (lang: Language) => {
    if (lang === 'SPANISH') return 'Spanish';
    if (lang === 'PORTUGUESE') return 'Portuguese';
    if (lang === 'FRENCH') return 'French';
    return lang;
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
          <Text style={styles.headerSubtitle}>Flashcards</Text>
        </View>
        <TouchableOpacity onPress={() => setShowSettings(true)}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Card {currentIndex + 1} of {flashcards.length}
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
        <View style={[styles.scoreBox, { backgroundColor: '#E8F5E9' }]}>
          <Text style={[styles.scoreValue, { color: '#34C759' }]}>{knownCount}</Text>
          <Text style={styles.scoreLabel}>✓ Known</Text>
        </View>
        <View style={[styles.scoreBox, { backgroundColor: '#FFEBEE' }]}>
          <Text style={[styles.scoreValue, { color: '#FF3B30' }]}>{unknownCount}</Text>
          <Text style={styles.scoreLabel}>✗ Learning</Text>
        </View>
      </View>

      {/* Flashcard */}
      <View style={styles.cardContainer}>
        <TouchableOpacity activeOpacity={0.9} onPress={flipCard} style={styles.cardTouchable}>
          <Animated.View
            style={[
              styles.card,
              styles.cardFront,
              {
                transform: [{ rotateY: frontInterpolate }],
                opacity: frontOpacity,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.difficultyBadge, getDifficultyColor(currentCard.difficulty)]}>
                <Text style={styles.difficultyText}>{currentCard.difficulty}</Text>
              </View>
              <View style={[styles.sourceBadge, getSourceColor(currentCard.source)]}>
                <Text style={styles.sourceText}>{getSourceLabel(currentCard.source)}</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.categoryLabel}>{formatCategory(currentCard.category)}</Text>
              <Text style={styles.questionText}>{currentCard.frontText}</Text>
              {currentCard.contextSentence && (
                <View style={styles.contextContainer}>
                  <Text style={styles.contextLabel}>Context:</Text>
                  <Text style={styles.contextText}>"{currentCard.contextSentence}"</Text>
                </View>
              )}
            </View>
            <View style={styles.tapHintContainer}>
              <Text style={styles.tapHint}>👆 Tap to reveal translation</Text>
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
          >
            <View style={styles.cardContent}>
              <Text style={styles.answerLabel}>Translation</Text>
              <Text style={styles.answerText}>{currentCard.backText}</Text>

              <View style={styles.divider} />

              <Text style={styles.originalLabel}>English</Text>
              <Text style={styles.originalText}>{currentCard.frontText}</Text>

              {currentCard.sourceTitle && (
                <View style={styles.sourceInfoContainer}>
                  <Text style={styles.sourceInfoLabel}>📰 Source:</Text>
                  <Text style={styles.sourceInfoText} numberOfLines={2}>
                    {currentCard.sourceTitle}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.tapHintContainer}>
              <Text style={[styles.tapHint, { color: 'rgba(255,255,255,0.9)' }]}>
                Do you know this word?
              </Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      {isFlipped && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, styles.unknownButton]} onPress={handleUnknown}>
            <Text style={styles.actionButtonText}>✗</Text>
            <Text style={styles.actionButtonLabel}>Don't Know</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.knownButton]} onPress={handleKnown}>
            <Text style={styles.actionButtonText}>✓</Text>
            <Text style={styles.actionButtonLabel}>Know It</Text>
          </TouchableOpacity>
        </View>
      )}

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
              <Text style={styles.modalTitle}>Flashcard Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Language Selection */}
              <Text style={styles.sectionTitle}>Language</Text>
              <View style={styles.optionsGrid}>
                {(['SPANISH', 'PORTUGUESE', 'FRENCH'] as Language[]).map((lang) => (
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
                      {count} cards
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
                    All Categories
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
              <Text style={styles.applyButtonText}>Apply Settings</Text>
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
  if (source === 'CURATED') return '✨ Curated';
  if (source === 'NEWS_API') return '📰 News';
  if (source === 'TRENDING') return '🔥 Trending';
  return 'Custom';
};

const formatCategory = (category: string) => {
  return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backIcon: {
    fontSize: 28,
    color: '#4A90E2',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  settingsIcon: {
    fontSize: 24,
  },
  settingsButton: {
    marginTop: 20,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressContainer: {
    padding: 20,
    backgroundColor: 'white',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  scoreBox: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardTouchable: {
    width: CARD_WIDTH,
    height: 440,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    justifyContent: 'space-between',
  },
  cardBack: {
    justifyContent: 'space-between',
    backgroundColor: '#4A90E2',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  sourceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sourceText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  categoryLabel: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  contextContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  contextLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  contextText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  sourceInfoContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  sourceInfoLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 6,
    fontWeight: '600',
  },
  sourceInfoText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.95)',
    fontStyle: 'italic',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    lineHeight: 42,
  },
  answerLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  answerText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 44,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: 20,
  },
  originalLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  originalText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  tapHintContainer: {
    alignItems: 'center',
    paddingTop: 16,
  },
  tapHint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 30,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  unknownButton: {
    backgroundColor: '#FF3B30',
  },
  knownButton: {
    backgroundColor: '#34C759',
  },
  actionButtonText: {
    fontSize: 32,
    color: 'white',
    marginBottom: 4,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
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
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  modalClose: {
    fontSize: 28,
    color: '#999',
    fontWeight: '300',
  },
  modalScroll: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  optionButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#f5f5f5',
    minWidth: 100,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#4A90E2',
  },
  optionFlag: {
    fontSize: 24,
    marginBottom: 4,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  optionTextActive: {
    color: '#4A90E2',
  },
  applyButton: {
    backgroundColor: '#4A90E2',
    margin: 24,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default FlashcardsScreen;
