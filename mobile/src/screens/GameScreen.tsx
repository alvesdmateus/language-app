import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Match, Question, AnswerData } from '../types';
import { matchService } from '../services/api';

const GameScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { matchId, match } = route.params as { matchId: string; match: Match };

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerData>>({});
  const [timeRemaining, setTimeRemaining] = useState(match.questionDuration || 45);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const currentQuestion = match.questions[currentQuestionIndex];
  const totalQuestions = match.questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const questionDuration = match.questionDuration || 45;

  useEffect(() => {
    startQuestionTimer();
    animateProgress();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestionIndex]);

  const startQuestionTimer = () => {
    setQuestionStartTime(Date.now());
    setTimeRemaining(questionDuration);
    setSelectedAnswer(null);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const animateProgress = () => {
    Animated.timing(progressAnim, {
      toValue: ((currentQuestionIndex + 1) / totalQuestions) * 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleTimeUp = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    // Auto-submit with no answer
    const timeMs = Date.now() - questionStartTime;
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: {
        answer: '',
        timeMs,
        correct: false,
      },
    };
    setAnswers(newAnswers);

    // Shake animation
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      if (isLastQuestion) {
        submitMatch(newAnswers);
      } else {
        setCurrentQuestionIndex((prev) => prev + 1);
      }
    }, 1000);
  };

  const handleAnswerSelect = (answer: string) => {
    if (isPaused || isSubmitting) return;
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    if (!selectedAnswer && timeRemaining > 0) {
      Alert.alert('No Answer', 'Please select an answer before continuing.');
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);

    const timeMs = Date.now() - questionStartTime;
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: {
        answer: selectedAnswer || '',
        timeMs,
      },
    };
    setAnswers(newAnswers);

    if (isLastQuestion) {
      submitMatch(newAnswers);
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const submitMatch = async (finalAnswers: Record<string, AnswerData>) => {
    setIsSubmitting(true);
    setIsPaused(true);

    try {
      const response = await matchService.submitMatchResult(matchId, finalAnswers);

      // Navigate to results screen
      navigation.navigate('MatchResults' as never, {
        matchId,
        result: response.data,
      } as never);
    } catch (error: any) {
      console.error('Failed to submit match:', error);
      Alert.alert(
        'Submission Error',
        error?.response?.data?.message || 'Failed to submit answers. Please try again.',
        [
          {
            text: 'Retry',
            onPress: () => submitMatch(finalAnswers),
          },
          {
            text: 'Exit',
            style: 'cancel',
            onPress: () => navigation.navigate('Home' as never),
          },
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuit = () => {
    Alert.alert(
      'Quit Match?',
      'Are you sure you want to quit? This will count as a loss.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Quit',
          style: 'destructive',
          onPress: () => navigation.navigate('Home' as never),
        },
      ]
    );
  };

  const getTimerColor = () => {
    if (timeRemaining <= 5) return '#FF3B30';
    if (timeRemaining <= 10) return '#FF9500';
    return '#34C759';
  };

  const getTimerProgress = () => {
    return (timeRemaining / questionDuration) * 100;
  };

  if (isSubmitting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Submitting your answers...</Text>
        <Text style={styles.loadingSubtext}>Please wait</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleQuit} style={styles.quitButton}>
            <Text style={styles.quitText}>✕ Quit</Text>
          </TouchableOpacity>
          <View style={styles.matchInfo}>
            <Text style={styles.matchType}>
              {match.isBattleMode ? '⚔️ Battle Mode' : '🎮 Match'}
            </Text>
            <Text style={styles.languageFlag}>
              {match.language === 'ENGLISH' && '🇺🇸'}
              {match.language === 'SPANISH' && '🇪🇸'}
              {match.language === 'PORTUGUESE' && '🇧🇷'}
              {match.language === 'ITALIAN' && '🇮🇹'}
              {match.language === 'FRENCH' && '🇫🇷'}
              {match.language === 'GERMAN' && '🇩🇪'}
              {match.language === 'JAPANESE' && '🇯🇵'}
              {match.language === 'KOREAN' && '🇰🇷'}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Text style={styles.questionCounter}>
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </Text>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <View style={styles.timerCircle}>
            <Text style={[styles.timerText, { color: getTimerColor() }]}>
              {timeRemaining}s
            </Text>
          </View>
          <View style={styles.timerBarContainer}>
            <View
              style={[
                styles.timerBar,
                {
                  width: `${getTimerProgress()}%`,
                  backgroundColor: getTimerColor(),
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Question */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Animated.View
          style={[
            styles.questionCard,
            { transform: [{ translateX: shakeAnim }] },
          ]}
        >
          <View style={styles.questionTypeContainer}>
            <Text style={styles.questionType}>
              {currentQuestion.type === 'grammar' ? '📝 Grammar' : '📖 Comprehension'}
            </Text>
            {currentQuestion.difficulty && (
              <View
                style={[
                  styles.difficultyBadge,
                  {
                    backgroundColor:
                      currentQuestion.difficulty === 'EASY'
                        ? '#34C759'
                        : currentQuestion.difficulty === 'MEDIUM'
                        ? '#FF9500'
                        : '#FF3B30',
                  },
                ]}
              >
                <Text style={styles.difficultyText}>{currentQuestion.difficulty}</Text>
              </View>
            )}
          </View>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </Animated.View>

        {/* Answer Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
            const isSelected = selectedAnswer === option;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  isSelected && styles.optionButtonSelected,
                ]}
                onPress={() => handleAnswerSelect(option)}
                disabled={isPaused}
                activeOpacity={0.7}
              >
                <View style={[styles.optionCircle, isSelected && styles.optionCircleSelected]}>
                  <Text style={[styles.optionLetter, isSelected && styles.optionLetterSelected]}>
                    {optionLetter}
                  </Text>
                </View>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option}
                </Text>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            (!selectedAnswer || isPaused) && styles.nextButtonDisabled,
          ]}
          onPress={handleNextQuestion}
          disabled={!selectedAnswer || isPaused}
        >
          <Text style={styles.nextButtonText}>
            {isLastQuestion ? 'Submit Match' : 'Next Question'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  quitButton: {
    padding: 8,
  },
  quitText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  languageFlag: {
    fontSize: 24,
  },
  progressContainer: {
    marginBottom: 16,
  },
  questionCounter: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
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
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#e0e0e0',
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  timerBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  timerBar: {
    height: '100%',
    borderRadius: 6,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  questionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  questionTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  questionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
  },
  questionText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#333',
    fontWeight: '500',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionButtonSelected: {
    borderColor: '#4A90E2',
    backgroundColor: '#E3F2FD',
  },
  optionCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionCircleSelected: {
    backgroundColor: '#4A90E2',
  },
  optionLetter: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  optionLetterSelected: {
    color: 'white',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  optionTextSelected: {
    fontWeight: '600',
    color: '#4A90E2',
  },
  checkmark: {
    fontSize: 20,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  nextButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  nextButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default GameScreen;
