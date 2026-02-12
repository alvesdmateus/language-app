import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { quizService } from '../services/api';
import { colors, gradients, spacing, radii, shadows, typography } from '../theme';

const DailyQuizScreen = () => {
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuiz();
  }, []);

  const loadQuiz = async () => {
    try {
      const response = await quizService.getDailyQuiz();
      setQuiz(response.data.quiz);
    } catch (error) {
      Alert.alert('Error', 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await quizService.submitDailyQuiz(quiz.id, answers);
      Alert.alert('Success', `You scored ${response.data.score} points!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit quiz');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.secondary} />
        <Text style={styles.loadingText}>Loading quiz...</Text>
      </View>
    );
  }

  if (quiz?.completed) {
    return (
      <View style={styles.completedContainer}>
        <Ionicons name="checkmark-circle" size={72} color={colors.primary} />
        <Text style={styles.completedTitle}>Daily Quiz Completed!</Text>
        <Text style={styles.completedSubtitle}>Come back tomorrow for a new quiz</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={gradients.secondary} style={styles.headerGradient}>
        <Ionicons name="calendar" size={32} color={colors.white} />
        <Text style={styles.title}>Daily Quiz</Text>
        <Text style={styles.subtitle}>Test your knowledge today</Text>
      </LinearGradient>

      <View style={styles.content}>
        {quiz?.questions.map((question: any, index: number) => (
          <View key={question.id} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={styles.questionBadge}>
                <Text style={styles.questionBadgeText}>{index + 1}</Text>
              </View>
              <Text style={styles.questionText}>{question.question}</Text>
            </View>
            {question.options.map((option: string, optionIndex: number) => (
              <TouchableOpacity
                key={optionIndex}
                style={[
                  styles.option,
                  answers[question.id] === option && styles.selectedOption,
                ]}
                onPress={() => setAnswers({ ...answers, [question.id]: option })}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    answers[question.id] === option && styles.selectedOptionText,
                  ]}
                >
                  {option}
                </Text>
                {answers[question.id] === option && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.textInverse} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.8}>
          <Ionicons name="send" size={20} color={colors.textInverse} />
          <Text style={styles.submitButtonText}>Submit Quiz</Text>
        </TouchableOpacity>

        <View style={{ height: spacing.xxxl }} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    ...typography.body,
    color: colors.textSecondary,
  },
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  completedTitle: {
    ...typography.h2,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  completedSubtitle: {
    ...typography.subtitle,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.textInverse,
    marginTop: spacing.sm,
  },
  subtitle: {
    ...typography.subtitle,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: spacing.xs,
  },
  content: {
    padding: spacing.xl,
  },
  questionCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  questionBadge: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionBadgeText: {
    ...typography.buttonSmall,
    color: colors.textInverse,
  },
  questionText: {
    ...typography.title,
    flex: 1,
  },
  option: {
    padding: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSecondary,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondaryDark,
  },
  optionText: {
    ...typography.body,
    flex: 1,
  },
  selectedOptionText: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.primaryButton,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
});

export default DailyQuizScreen;
