import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { flashcardService } from '../services/api';
import { useNavigation } from '@react-navigation/native';

interface Flashcard {
  id: string;
  question: string;
  correctAnswer: string;
  options: string[];
  type: string;
  difficulty: number;
  explanation?: string;
}

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
  const flipAnimation = new Animated.Value(0);

  useEffect(() => {
    loadFlashcards();
  }, []);

  const loadFlashcards = async () => {
    try {
      setLoading(true);
      const response = await flashcardService.getFlashcards(10);
      setFlashcards(response.data.flashcards);
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
        <Text style={styles.emptyText}>Check back later for study materials</Text>
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
        <Text style={styles.headerTitle}>Flashcards</Text>
        <View style={styles.placeholder} />
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
        <View style={styles.scoreBox}>
          <Text style={styles.scoreValue}>{knownCount}</Text>
          <Text style={styles.scoreLabel}>✓ Known</Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreValue}>{unknownCount}</Text>
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
                <Text style={styles.difficultyText}>
                  {getDifficultyLabel(currentCard.difficulty)}
                </Text>
              </View>
              <Text style={styles.cardType}>{currentCard.type}</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.questionText}>{currentCard.question}</Text>
            </View>
            <Text style={styles.tapHint}>Tap to reveal answer</Text>
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
              <Text style={styles.answerLabel}>Answer:</Text>
              <Text style={styles.answerText}>{currentCard.correctAnswer}</Text>
              {currentCard.explanation && (
                <>
                  <Text style={styles.explanationLabel}>Explanation:</Text>
                  <Text style={styles.explanationText}>{currentCard.explanation}</Text>
                </>
              )}
            </View>
            <Text style={styles.tapHint}>Do you know this?</Text>
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
    </View>
  );
};

const getDifficultyLabel = (difficulty: number) => {
  if (difficulty <= 2) return 'Easy';
  if (difficulty <= 4) return 'Medium';
  return 'Hard';
};

const getDifficultyColor = (difficulty: number) => {
  if (difficulty <= 2) return { backgroundColor: '#34C759' };
  if (difficulty <= 4) return { backgroundColor: '#FF9500' };
  return { backgroundColor: '#FF3B30' };
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
  },
  backIcon: {
    fontSize: 28,
    color: '#4A90E2',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 28,
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
    height: 400,
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
    marginBottom: 20,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardType: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    lineHeight: 34,
  },
  answerLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    textAlign: 'center',
  },
  answerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  explanationLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    marginTop: 12,
  },
  explanationText: {
    fontSize: 16,
    color: 'white',
    lineHeight: 24,
  },
  tapHint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
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
  },
  backButton: {
    marginTop: 24,
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
});

export default FlashcardsScreen;
