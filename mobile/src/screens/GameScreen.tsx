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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Match, Question, AnswerData, PowerUpType, ActiveEffect } from '../types';
import { matchService } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';
import OnboardingGuide, { GuideStep } from '../components/OnboardingGuide';
import { colors, gradients, spacing, radii, shadows, typography, commonStyles } from '../theme';
import { LANGUAGE_INFO } from '../theme/languages';

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
    if (timeRemaining <= 5) return colors.danger;
    if (timeRemaining <= 10) return colors.accent;
    return colors.primary;
  };

  const getTimerProgress = () => {
    return (timeRemaining / questionDuration) * 100;
  };

  const langInfo = match.language ? LANGUAGE_INFO[match.language as keyof typeof LANGUAGE_INFO] : null;

  if (isSubmitting || waitingForOpponent) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.secondary} />
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
        <LinearGradient
          colors={opponentDisconnected ? gradients.accent : gradients.secondary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.connectionBanner}
        >
          <Ionicons
            name={opponentDisconnected ? 'warning-outline' : 'hourglass-outline'}
            size={16}
            color={colors.textInverse}
            style={{ marginRight: spacing.sm }}
          />
          <Text style={styles.connectionBannerText}>
            {matchStatus === 'READY_CHECK' && !connectionMessage
              ? 'Connecting to match...'
              : connectionMessage || 'Opponent disconnected. Waiting for reconnection...'}
          </Text>
        </LinearGradient>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleQuit} style={styles.quitButton}>
            <Ionicons name="close" size={18} color={colors.danger} />
            <Text style={styles.quitText}>Quit</Text>
          </TouchableOpacity>
          <View style={styles.matchInfo}>
            <View style={styles.matchTypeBadge}>
              <Ionicons
                name={match.isBattleMode ? 'flash' : 'game-controller'}
                size={14}
                color={colors.textInverse}
              />
              <Text style={styles.matchTypeText}>
                {match.isBattleMode ? 'Battle' : 'Match'}
              </Text>
            </View>
            {langInfo && (
              <Text style={styles.languageFlag}>{langInfo.flag}</Text>
            )}
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
              <View style={styles.asyncTimerLabelRow}>
                <Ionicons name="hourglass-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.asyncTimerLabel}>Time Remaining:</Text>
              </View>
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
            <View style={[styles.timerCircle, { borderColor: getTimerColor() }]}>
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
              equippedPowerUp === PowerUpType.FREEZE && { backgroundColor: colors.secondary },
              equippedPowerUp === PowerUpType.BURN && { backgroundColor: colors.danger },
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
              <View style={styles.powerUpIconContainer}>
                <MaterialCommunityIcons
                  name={equippedPowerUp === PowerUpType.FREEZE ? 'snowflake' : 'fire'}
                  size={28}
                  color={colors.textInverse}
                />
              </View>
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
                    { backgroundColor: effect.type === 'FREEZE' ? colors.secondary : colors.danger },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={effect.type === 'FREEZE' ? 'snowflake' : 'fire'}
                    size={14}
                    color={colors.textInverse}
                    style={{ marginRight: spacing.xs }}
                  />
                  <Text style={styles.activeEffectText}>
                    {effect.type === 'FREEZE' ? 'Timer Frozen!' : 'Timer Burning!'}
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
                      <View style={styles.questionNavCheckmarkContainer}>
                        <Ionicons name="checkmark" size={12} color={colors.primary} />
                      </View>
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
            <View style={styles.questionTypeRow}>
              <Ionicons
                name={currentQuestion.type === 'grammar' ? 'create-outline' : 'book-outline'}
                size={16}
                color={colors.secondary}
                style={{ marginRight: spacing.xs }}
              />
              <Text style={styles.questionType}>
                {currentQuestion.type === 'grammar' ? 'Grammar' : 'Comprehension'}
              </Text>
            </View>
            {currentQuestion.difficulty && (
              <View
                style={[
                  styles.difficultyBadge,
                  {
                    backgroundColor:
                      currentQuestion.difficulty === 'EASY'
                        ? colors.primary
                        : currentQuestion.difficulty === 'MEDIUM'
                        ? colors.accent
                        : colors.danger,
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
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.secondary} />
                )}
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
          {(!selectedAnswer || isPaused || guidePaused) ? (
            <Text style={styles.nextButtonText}>
              {isLastQuestion ? 'Submit Match' : 'Next Question'}
            </Text>
          ) : (
            <LinearGradient
              colors={gradients.secondary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>
                {isLastQuestion ? 'Submit Match' : 'Next Question'}
              </Text>
              {!isLastQuestion && (
                <Ionicons name="arrow-forward" size={18} color={colors.textInverse} style={{ marginLeft: spacing.sm }} />
              )}
            </LinearGradient>
          )}
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
    backgroundColor: colors.background,
  },
  connectionBanner: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionBannerText: {
    color: colors.textInverse,
    ...typography.bodySmall,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.lg,
    ...typography.title,
    color: colors.textPrimary,
  },
  loadingSubtext: {
    marginTop: spacing.sm,
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  header: {
    backgroundColor: colors.surface,
    paddingTop: 50,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  quitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  quitText: {
    ...typography.subtitle,
    color: colors.danger,
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  matchTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    gap: spacing.xs,
  },
  matchTypeText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '700',
  },
  languageFlag: {
    fontSize: 24,
  },
  progressContainer: {
    marginBottom: spacing.lg,
  },
  questionCounter: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  progressBar: {
    ...commonStyles.progressBarTrack,
    height: 8,
  },
  progressFill: {
    ...commonStyles.progressBarFill,
    backgroundColor: colors.secondary,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  timerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.border,
  },
  timerText: {
    ...typography.title,
    fontSize: 18,
    fontWeight: '800',
  },
  timerBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  timerBar: {
    height: '100%',
    borderRadius: radii.sm,
  },
  asyncTimerContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  asyncTimerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  asyncTimerLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  asyncTimerText: {
    ...typography.h2,
    color: colors.secondary,
  },
  asyncHint: {
    ...typography.label,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
    textTransform: 'none',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.xl,
  },
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xxl,
    marginBottom: spacing.xxl,
    ...shadows.lg,
  },
  questionTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  questionTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionType: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.secondary,
  },
  difficultyBadge: {
    ...commonStyles.badge,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  difficultyText: {
    ...typography.label,
    color: colors.textInverse,
  },
  questionText: {
    fontSize: 18,
    lineHeight: 28,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  optionsContainer: {
    gap: spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.sm,
  },
  optionButtonSelected: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondaryLight,
  },
  optionCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  optionCircleSelected: {
    backgroundColor: colors.secondary,
  },
  optionLetter: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  optionLetterSelected: {
    color: colors.textInverse,
  },
  optionText: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: colors.secondary,
  },
  footer: {
    padding: spacing.xl,
    paddingBottom: 30,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nextButton: {
    borderRadius: radii.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: radii.md,
  },
  nextButtonDisabled: {
    backgroundColor: colors.surfaceSecondary,
    opacity: 0.6,
    padding: 18,
    alignItems: 'center',
  },
  nextButtonText: {
    color: colors.textInverse,
    ...typography.button,
  },
  questionNavContainer: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  questionNavTitle: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  questionNavButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  questionNavButton: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  questionNavButtonAnswered: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  questionNavButtonCurrent: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  questionNavButtonText: {
    ...typography.subtitle,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  questionNavButtonTextAnswered: {
    color: colors.primary,
  },
  questionNavButtonTextCurrent: {
    color: colors.textInverse,
  },
  questionNavCheckmarkContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Power-up styles
  powerUpContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  powerUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    ...shadows.md,
  },
  powerUpButtonDisabled: {
    opacity: 0.5,
  },
  powerUpContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  powerUpIconContainer: {
    marginRight: spacing.md,
  },
  powerUpTextContainer: {
    flex: 1,
  },
  powerUpName: {
    ...typography.subtitle,
    fontWeight: '800',
    color: colors.textInverse,
  },
  powerUpCooldown: {
    ...typography.caption,
    color: colors.textInverse,
    opacity: 0.8,
  },
  powerUpReady: {
    ...typography.label,
    color: colors.textInverse,
  },
  activeEffectsContainer: {
    marginTop: spacing.sm,
    gap: 6,
  },
  activeEffectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  activeEffectText: {
    color: colors.textInverse,
    ...typography.bodySmall,
    fontWeight: '700',
  },
});

export default GameScreen;
