import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { quizService } from '../services/api';

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
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (quiz?.completed) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Daily Quiz Completed!</Text>
        <Text style={styles.subtitle}>Come back tomorrow for a new quiz</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Daily Quiz</Text>
      {quiz?.questions.map((question: any, index: number) => (
        <View key={question.id} style={styles.questionCard}>
          <Text style={styles.questionText}>
            {index + 1}. {question.question}
          </Text>
          {question.options.map((option: string, optionIndex: number) => (
            <TouchableOpacity
              key={optionIndex}
              style={[
                styles.option,
                answers[question.id] === option && styles.selectedOption,
              ]}
              onPress={() => setAnswers({ ...answers, [question.id]: option })}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit Quiz</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  questionCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  questionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  option: {
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#007AFF',
  },
  optionText: {
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default DailyQuizScreen;
