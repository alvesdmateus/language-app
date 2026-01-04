import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const LearnTab = () => {
  const navigation = useNavigation();

  const LearningCard = ({ icon, title, subtitle, color, onPress }: any) => (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardIcon}>{icon}</Text>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.cardArrow}>›</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Learn</Text>
        <Text style={styles.headerSubtitle}>Study and improve your skills</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Study Materials</Text>
        <LearningCard
          icon="📚"
          title="Flashcards"
          subtitle="Practice with interactive flashcards"
          color="#FF9500"
          onPress={() => navigation.navigate('Flashcards' as never)}
        />
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipIcon}>💡</Text>
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>Study Tip</Text>
          <Text style={styles.tipText}>
            Regular practice is key! Try to complete at least one flashcard session daily to maintain your progress.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cardIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  cardArrow: {
    fontSize: 28,
    color: '#ccc',
    fontWeight: '300',
  },
  tipCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#FFE599',
  },
  tipIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B6914',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: '#8B6914',
    lineHeight: 18,
  },
});

export default LearnTab;
