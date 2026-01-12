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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Match, Question, AnswerData, PowerUpType, ActiveEffect } from '../types';
import { matchService } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import OnboardingGuide, { GuideStep } from '../components/OnboardingGuide';

// Onboarding guide steps for first battle
const ONBOARDING_GUIDE_STEPS: GuideStep[] = [
  {
    id: 'welcome',
    title: 'Your First Battle!',
    description: 'Answer 5 questions as quickly and accurately as you can. Beat the Training Bot to win!',
    position: 'center',
    arrow: 'none',
  },
  {
    id: 'timer',
    title: 'Watch the Timer',
    description: 'You have 45 seconds per question. The faster you answer correctly, the better your chances of winning!',
    position: 'top',
    arrow: 'up',
  },
  {
    id: 'question',
    title: 'Read Carefully',
    description: 'Each question tests your language skills. Read the question and choose the best answer from the options below.',
    position: 'center',
    arrow: 'none',
  },
  {
    id: 'answer',
    title: 'Tap to Answer',
    description: 'Select your answer by tapping on it. You can change your selection before submitting.',
    position: 'bottom',
    arrow: 'down',
  },
  {
    id: 'submit',
    title: 'Ready to Go!',
    description: 'Once you select an answer, tap "Next Question" to move on. Good luck!',
    position: 'bottom',
    arrow: 'down',
  },
];

const GameScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { matchId, match, isCPUMatch } = route.params as { matchId: string; match: Match; isCPUMatch?: boolean };
  const { socket, sendMatchHeartbeat } = useWebSocket();

  // Validate match data
  if (!match || !match.questions || match.questions.length === 0) {
    console.error('Invalid match data:', match);
    Alert.alert(
      'Error',
      'Invalid match data. Returning to home.',
      [{ text: 'OK', onPress: () => navigation.navigate('Home' as never) }]
    );
    return null;
  }

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerData>>({});
  const [timeRemaining, setTimeRemaining] = useState(match.questionDuration || 45);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [matchStatus, setMatchStatus] = useState<string>(match.status || 'READY_CHECK');
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [deadlineRemaining, setDeadlineRemaining] = useState<number | null>(null);

  // Power-up state
  const [userId, setUserId] = useState<string>('');
  const [powerUpCooldown, setPowerUpCooldown] = useState(0);
  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);
  const [timerModifier, setTimerModifier] = useState(1.0);

  // Onboarding guide state
  const [showOnboardingGuide, setShowOnboardingGuide] = useState(isCPUMatch || false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [guidePaused, setGuidePaused] = useState(isCPUMatch || false);

  const isAsync = match.isAsync || false;
  const powerUpsEnabled = match.powerUpsEnabled || false;
  const equippedPowerUp = powerUpsEnabled && userId ? (match.powerUpState?.[userId]?.equipped || PowerUpType.NONE) : PowerUpType.NONE;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const powerUpAnimRef = useRef(new Animated.Value(0)).current;

  const currentQuestion = match.questions[currentQuestionIndex];
  const totalQuestions = match.questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const questionDuration = match.questionDuration || 45;

  console.log('GameScreen rendered with:', {
    matchId,
    status: match.status,
    questionsCount: match.questions.length,
    currentQuestionIndex,
    isAsync,
  });

  // AsyncStorage keys for match state
  const getMatchStateKey = (matchId: string) => `match_state_${matchId}`;

  // Save match state to AsyncStorage (for async matches)
  const saveMatchState = async (
    answers: Record<string, AnswerData>,
    questionIndex: number
  ) => {
    if (!isAsync) return; // Only save for async matches

    try {
      const stateKey = getMatchStateKey(matchId);
      const state = {
        matchId,
        answers,
        currentQuestionIndex: questionIndex,
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(stateKey, JSON.stringify(state));
      console.log('Match state saved:', { questionIndex, answersCount: Object.keys(answers).length });
    } catch (error) {
      console.error('Failed to save match state:', error);
    }
  };

  // Load match state from AsyncStorage (for async matches)
  const loadMatchState = async () => {
    if (!isAsync) return null;

    try {
      const stateKey = getMatchStateKey(matchId);
      const savedState = await AsyncStorage.getItem(stateKey);

      if (savedState) {
        const state = JSON.parse(savedState);
        console.log('Loaded saved match state:', {
          questionIndex: state.currentQuestionIndex,
          answersCount: Object.keys(state.answers).length,
        });
        return state;
      }
    } catch (error) {
      console.error('Failed to load match state:', error);
    }
    return null;
  };

  // Clear match state from AsyncStorage
  const clearMatchState = async () => {
    if (!isAsync) return;

    try {
      const stateKey = getMatchStateKey(matchId);
      await AsyncStorage.removeItem(stateKey);
      console.log('Match state cleared');
    } catch (error) {
      console.error('Failed to clear match state:', error);
    }
  };

  // Get userId from AsyncStorage
  useEffect(() => {
    const getUserId = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          // Decode JWT to get userId (basic decode, first part is header, second is payload)
          const payload = token.split('.')[1];
          const decoded = JSON.parse(atob(payload));
          setUserId(decoded.userId);
        }
      } catch (error) {
        console.error('Failed to get userId:', error);
      }
    };

    getUserId();
  }, []);

  // Load saved state on mount (async matches only)
  useEffect(() => {
    const restoreSavedState = async () => {
      const savedState = await loadMatchState();
      if (savedState) {
        setAnswers(savedState.answers);
        setCurrentQuestionIndex(savedState.currentQuestionIndex);
        console.log('Restored match progress from saved state');
      }
    };

    restoreSavedState();
  }, [matchId, isAsync]);

  // Join match room on mount
  useEffect(() => {
    if (socket && matchId) {
      console.log('Joining match room:', matchId);
      socket.emit('game:join_match', { matchId });
    }

    // Only leave when component actually unmounts
    return () => {
      if (socket && matchId) {
        console.log('Leaving match room:', matchId);
        socket.emit('game:leave_match', { matchId });
      }
    };
  }, [socket, matchId]);

  // Calculate deadline remaining for async matches
  useEffect(() => {
    if (isAsync && match.turnDeadlineAt) {
      const calculateDeadline = () => {
        const deadline = new Date(match.turnDeadlineAt!).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((deadline - now) / 1000));
        setDeadlineRemaining(remaining);
      };

      calculateDeadline();
      const interval = setInterval(calculateDeadline, 1000);
      return () => clearInterval(interval);
    }
  }, [isAsync, match.turnDeadlineAt]);

  useEffect(() => {
    // Only start question timer for synchronous matches and when guide is not paused
    if (!isAsync && !guidePaused) {
      startQuestionTimer();
    }
    animateProgress();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestionIndex, isAsync, guidePaused]);

  // Onboarding guide handlers
  const handleOnboardingStepComplete = () => {
    if (onboardingStep < ONBOARDING_GUIDE_STEPS.length - 1) {
      setOnboardingStep(prev => prev + 1);
    } else {
      // Guide complete, start the game
      setShowOnboardingGuide(false);
      setGuidePaused(false);
    }
  };

  const handleOnboardingSkip = () => {
    setShowOnboardingGuide(false);
    setGuidePaused(false);
  };

  // Socket event listeners for match connection events
  useEffect(() => {
    if (!socket) return;

    socket.on('match:started', (data) => {
      console.log('Match started:', data);
      setMatchStatus('IN_PROGRESS');
      setConnectionMessage(null);
    });

    socket.on('match:opponent_disconnected', (data) => {
      console.log('Opponent disconnected:', data);
      setOpponentDisconnected(true);
      setConnectionMessage(data.message || 'Opponent disconnected. Waiting...');
      setIsPaused(true);
    });

    socket.on('match:opponent_reconnected', (data) => {
      console.log('Opponent reconnected:', data);
      setOpponentDisconnected(false);
      setConnectionMessage(null);
      setIsPaused(false);
    });

    socket.on('match:reconnected', (data) => {
      console.log('Reconnected to match:', data);
      setConnectionMessage('Reconnected! Continuing match...');
      setTimeout(() => setConnectionMessage(null), 3000);
      // Could restore match state from data.match if needed
    });

    socket.on('match:opponent_forfeited', (data) => {
      console.log('Opponent forfeited:', data);
      Alert.alert(
        'Opponent Forfeited',
        data.message || 'Your opponent failed to reconnect. You win!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home' as never),
          },
        ]
      );
    });

    socket.on('match:forfeited', (data) => {
      console.log('Match forfeited:', data);
      Alert.alert(
        'Match Forfeited',
        data.message || 'You failed to reconnect in time.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home' as never),
          },
        ]
      );
    });

    socket.on('match:completed', (data) => {
      console.log('Match completed event received:', data);
      setWaitingForOpponent(false);
      setIsSubmitting(false);

      // Navigate to results with complete match data
      navigation.navigate('MatchResults' as never, {
        matchId,
        result: data,
        isCPUMatch: isCPUMatch || false,
      } as never);
    });

    return () => {
      socket.off('match:started');
      socket.off('match:opponent_disconnected');
      socket.off('match:opponent_reconnected');
      socket.off('match:reconnected');
      socket.off('match:opponent_forfeited');
      socket.off('match:forfeited');
      socket.off('match:completed');
    };
  }, [socket, navigation, matchId]);

  // Power-up socket event listeners
  useEffect(() => {
    if (!socket || !powerUpsEnabled) return;

    socket.on('game:power_up_used', (data: { powerUpType: string; cooldownRemaining: number }) => {
      console.log('Power-up used:', data);
      setPowerUpCooldown(data.cooldownRemaining);

      // Animate power-up activation
      Animated.sequence([
        Animated.timing(powerUpAnimRef, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(powerUpAnimRef, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });

    socket.on('game:power_up_effect', (data: { effect: ActiveEffect; questionId: string }) => {
      console.log('Power-up effect received:', data);
      if (data.questionId === currentQuestion.id) {
        setActiveEffects(prev => {
          const newEffects = [...prev, data.effect];
          // Calculate timer modifier based on effects
          const modifier = calculateTimerModifier(newEffects);
          setTimerModifier(modifier);
          return newEffects;
        });
      }
    });

    socket.on('game:power_up_error', (data: { message: string }) => {
      Alert.alert('Power-Up Error', data.message);
    });

    return () => {
      socket.off('game:power_up_used');
      socket.off('game:power_up_effect');
      socket.off('game:power_up_error');
    };
  }, [socket, powerUpsEnabled, currentQuestion]);

  // Power-up cooldown timer
  useEffect(() => {
    if (powerUpCooldown > 0) {
      const interval = setInterval(() => {
        setPowerUpCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [powerUpCooldown]);

  // Clear power-up effects when moving to next question
  useEffect(() => {
    setActiveEffects([]);
    setTimerModifier(1.0);
  }, [currentQuestionIndex]);

  // Heartbeat mechanism - send heartbeat every 5 seconds
  useEffect(() => {
    if (matchStatus === 'IN_PROGRESS' || matchStatus === 'READY_CHECK') {
      heartbeatRef.current = setInterval(() => {
        sendMatchHeartbeat();
      }, 5000);
    }

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, [matchStatus, sendMatchHeartbeat]);

  const startQuestionTimer = () => {
    setQuestionStartTime(Date.now());
    setTimeRemaining(questionDuration);
    setSelectedAnswer(null);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        // Apply timer modifier from power-ups
        if (timerModifier === 0) {
          // Timer frozen, don't decrement
          return prev;
        }

        const decrement = timerModifier; // 1 for normal, 2 for burn

        if (prev <= decrement) {
          handleTimeUp();
          return 0;
        }
        return prev - decrement;
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

  // Power-up functions
  const calculateTimerModifier = (effects: ActiveEffect[]): number => {
    let isFrozen = false;
    let isBurning = false;

    effects.forEach((effect) => {
      if (effect.type === 'FREEZE') isFrozen = true;
      if (effect.type === 'BURN') isBurning = true;
    });

    // If both active, they cancel out
    if (isFrozen && isBurning) return 1.0;
    if (isFrozen) return 0; // Timer frozen
    if (isBurning) return 2.0; // Timer 2x speed

    return 1.0; // Normal
  };

  const usePowerUp = () => {
    if (!socket || !powerUpsEnabled || equippedPowerUp === PowerUpType.NONE) return;
    if (powerUpCooldown > 0) {
      Alert.alert('Cooldown', `Power-up is on cooldown for ${powerUpCooldown}s`);
      return;
    }

    socket.emit('game:use_power_up', {
      matchId,
      questionId: currentQuestion.id,
    });
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

  const handleNextQuestion = async () => {
    if (!selectedAnswer && timeRemaining > 0 && !isAsync) {
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

    // Save state for async matches
    if (isAsync) {
      const nextIndex = isLastQuestion ? currentQuestionIndex : currentQuestionIndex + 1;
      await saveMatchState(newAnswers, nextIndex);
    }

    if (isLastQuestion) {
      submitMatch(newAnswers);
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  // Navigate to specific question (async mode only)
  const goToQuestion = (index: number) => {
    if (!isAsync) return;
    setCurrentQuestionIndex(index);
    setSelectedAnswer(answers[match.questions[index].id]?.answer || null);
  };

  const submitMatch = async (finalAnswers: Record<string, AnswerData>) => {
    setIsSubmitting(true);
    setIsPaused(true);

    try {
      // Use CPU submit endpoint for CPU matches, regular endpoint for normal matches
      if (isCPUMatch) {
        await matchService.submitCPUMatchResult(matchId, finalAnswers);
      } else {
        await matchService.submitMatchResult(matchId, finalAnswers);
      }

      // Clear saved state for async matches
      if (isAsync) {
        await clearMatchState();
      }

      // Don't navigate immediately - wait for opponent to finish
      // The match:completed socket event will trigger navigation when both players are done
      setWaitingForOpponent(true);
      console.log('Answers submitted, waiting for opponent to finish...');
    } catch (error: any) {
      console.error('Failed to submit match:', error);
      setIsSubmitting(false);
      setWaitingForOpponent(false);
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
    }
  };

  const handleQuit = async () => {
    if (isAsync) {
      // For async matches, save progress and allow exit
      await saveMatchState(answers, currentQuestionIndex);
      Alert.alert(
        'Progress Saved',
        'Your progress has been saved. You can resume this match later.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Home' as never),
          },
        ]
      );
    } else {
      // For sync matches, warn about quitting
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
    }
  };

  const getTimerColor = () => {
    if (timeRemaining <= 5) return '#FF3B30';
    if (timeRemaining <= 10) return '#FF9500';
    return '#34C759';
  };

  const getTimerProgress = () => {
    return (timeRemaining / questionDuration) * 100;
  };

  if (isSubmitting || waitingForOpponent) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>
          {waitingForOpponent ? 'Waiting for opponent...' : 'Submitting your answers...'}
        </Text>
        <Text style={styles.loadingSubtext}>
          {waitingForOpponent
            ? 'Your opponent is still answering questions'
            : 'Please wait'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Connection Status Banner */}
      {(matchStatus === 'READY_CHECK' || connectionMessage || opponentDisconnected) && (
        <View
          style={[
            styles.connectionBanner,
            opponentDisconnected ? styles.connectionBannerWarning : styles.connectionBannerInfo,
          ]}
        >
          <Text style={styles.connectionBannerText}>
            {matchStatus === 'READY_CHECK' && !connectionMessage
              ? '⏳ Connecting to match...'
              : connectionMessage || 'Opponent disconnected. Waiting for reconnection...'}
          </Text>
        </View>
      )}

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
        {isAsync ? (
          // Async mode: Show deadline timer
          <View style={styles.timerContainer}>
            <View style={styles.asyncTimerContainer}>
              <Text style={styles.asyncTimerLabel}>⏳ Time Remaining:</Text>
              <Text style={styles.asyncTimerText}>
                {deadlineRemaining !== null
                  ? `${Math.floor(deadlineRemaining / 3600)}h ${Math.floor((deadlineRemaining % 3600) / 60)}m`
                  : 'Loading...'}
              </Text>
            </View>
            <Text style={styles.asyncHint}>Take your time! Answer all questions before the deadline.</Text>
          </View>
        ) : (
          // Sync mode: Show per-question timer
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
        )}
      </View>

      {/* Power-Up Button (if enabled and equipped) */}
      {powerUpsEnabled && equippedPowerUp !== PowerUpType.NONE && !isAsync && (
        <View style={styles.powerUpContainer}>
          <TouchableOpacity
            style={[
              styles.powerUpButton,
              powerUpCooldown > 0 && styles.powerUpButtonDisabled,
              equippedPowerUp === PowerUpType.FREEZE && { backgroundColor: '#4FC3F7' },
              equippedPowerUp === PowerUpType.BURN && { backgroundColor: '#FF6B6B' },
            ]}
            onPress={usePowerUp}
            disabled={powerUpCooldown > 0 || isPaused}
            activeOpacity={0.7}
          >
            <Animated.View
              style={[
                styles.powerUpContent,
                {
                  transform: [{
                    scale: powerUpAnimRef.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.2],
                    }),
                  }],
                },
              ]}
            >
              <Text style={styles.powerUpIcon}>
                {equippedPowerUp === PowerUpType.FREEZE ? '❄️' : '🔥'}
              </Text>
              <View style={styles.powerUpTextContainer}>
                <Text style={styles.powerUpName}>
                  {equippedPowerUp === PowerUpType.FREEZE ? 'Freeze' : 'Burn'}
                </Text>
                {powerUpCooldown > 0 ? (
                  <Text style={styles.powerUpCooldown}>{powerUpCooldown}s</Text>
                ) : (
                  <Text style={styles.powerUpReady}>READY</Text>
                )}
              </View>
            </Animated.View>
          </TouchableOpacity>

          {/* Active Effects Display */}
          {activeEffects.length > 0 && (
            <View style={styles.activeEffectsContainer}>
              {activeEffects.map((effect, index) => (
                <View
                  key={index}
                  style={[
                    styles.activeEffectBadge,
                    { backgroundColor: effect.type === 'FREEZE' ? '#4FC3F7' : '#FF6B6B' },
                  ]}
                >
                  <Text style={styles.activeEffectText}>
                    {effect.type === 'FREEZE' ? '❄️ Timer Frozen!' : '🔥 Timer Burning!'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Question Navigation (Async Mode Only) */}
      {isAsync && (
        <View style={styles.questionNavContainer}>
          <Text style={styles.questionNavTitle}>Questions:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.questionNavButtons}>
              {match.questions.map((q, index) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = index === currentQuestionIndex;
                return (
                  <TouchableOpacity
                    key={q.id}
                    style={[
                      styles.questionNavButton,
                      isAnswered && styles.questionNavButtonAnswered,
                      isCurrent && styles.questionNavButtonCurrent,
                    ]}
                    onPress={() => goToQuestion(index)}
                  >
                    <Text
                      style={[
                        styles.questionNavButtonText,
                        isAnswered && styles.questionNavButtonTextAnswered,
                        isCurrent && styles.questionNavButtonTextCurrent,
                      ]}
                    >
                      {index + 1}
                    </Text>
                    {isAnswered && !isCurrent && (
                      <Text style={styles.questionNavCheckmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

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
            (!selectedAnswer || isPaused || guidePaused) && styles.nextButtonDisabled,
          ]}
          onPress={handleNextQuestion}
          disabled={!selectedAnswer || isPaused || guidePaused}
        >
          <Text style={styles.nextButtonText}>
            {isLastQuestion ? 'Submit Match' : 'Next Question'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Onboarding Guide Overlay */}
      {isCPUMatch && (
        <OnboardingGuide
          steps={ONBOARDING_GUIDE_STEPS}
          currentStep={onboardingStep}
          onStepComplete={handleOnboardingStepComplete}
          onSkip={handleOnboardingSkip}
          visible={showOnboardingGuide}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  connectionBanner: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionBannerInfo: {
    backgroundColor: '#4A90E2',
  },
  connectionBannerWarning: {
    backgroundColor: '#FF9500',
  },
  connectionBannerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
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
  asyncTimerContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  asyncTimerLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
  },
  asyncTimerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  asyncHint: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
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
  questionNavContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  questionNavTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  questionNavButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  questionNavButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  questionNavButtonAnswered: {
    backgroundColor: '#E8F5E9',
    borderColor: '#34C759',
  },
  questionNavButtonCurrent: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  questionNavButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  questionNavButtonTextAnswered: {
    color: '#34C759',
  },
  questionNavButtonTextCurrent: {
    color: 'white',
  },
  questionNavCheckmark: {
    position: 'absolute',
    top: -4,
    right: -4,
    fontSize: 16,
    color: '#34C759',
    backgroundColor: 'white',
    borderRadius: 10,
    width: 20,
    height: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Power-up styles
  powerUpContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  powerUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  powerUpButtonDisabled: {
    opacity: 0.5,
  },
  powerUpContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  powerUpIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  powerUpTextContainer: {
    flex: 1,
  },
  powerUpName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  powerUpCooldown: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
  },
  powerUpReady: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  activeEffectsContainer: {
    marginTop: 8,
    gap: 6,
  },
  activeEffectBadge: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeEffectText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
});

export default GameScreen;
